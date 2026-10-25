/** Blue/green switch to the assistant release. Old releases and nginx config backup retained. */
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const root='/home/sherif/sites/Ahmed-Elakad';
const release='/home/sherif/sites/ahmed-elakad-releases/20261008-assistant';
const evidence='/home/sherif/ahmed-assistant-20261008';
const nginx='/etc/nginx/sites-enabled/ahmedelakad.com';
const build='.next-assistant';
const events=[];
function run(bin,args,input){const r=spawnSync(bin,args,{input,encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});if(r.status!==0)throw Error('Operational command failed: '+bin+' '+args.slice(0,2).join(' '));return r.stdout;}
async function check(label){
 let result;
 for(let i=0;i<10;i++){
  const text=run('/usr/bin/node',[root+'/scripts/media-health-monitor.mjs','--check']);
  if(text.trim().startsWith('{')){result=JSON.parse(text.trim());break;}
  await new Promise(r=>setTimeout(r,3000));
 }
 if(!result)throw Error('Health check remained busy; no next operational step');
 events.push({label,status:result.status,failed:(result.checks||[]).filter(c=>!c.ok).map(c=>c.code)});
 console.log(JSON.stringify({label,status:result.status,failed:events[events.length-1].failed}));
 await fs.writeFile(evidence+'/deployment-health.json',JSON.stringify(events,null,2),{mode:0o600});
}
async function ready(base){for(let i=0;i<30;i++){try{const r=await fetch(base+'/api/admin/media/backup-status',{signal:AbortSignal.timeout(2000)});if(r.status===401&&(await fetch(base,{signal:AbortSignal.timeout(5000)})).status===200)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw Error('not ready: '+base);}
async function setNginx(config){run('sudo',['-n','tee',nginx],config);run('sudo',['-n','nginx','-t']);run('sudo',['-n','systemctl','reload','nginx']);await ready('https://ahmedelakad.com');}

await check('before blue-green');
await ready('http://127.0.0.1:3003');
const original=await fs.readFile(nginx,'utf8');
if(!original.includes('proxy_pass http://127.0.0.1:3002;'))throw Error('Unexpected upstream');
await fs.writeFile(evidence+'/nginx-before-assistant.conf',original,{flag:'wx',mode:0o600});
await setNginx(original.replaceAll('127.0.0.1:3002','127.0.0.1:3003'));
await check('candidate serving public traffic');
run('pm2',['delete','ahmed-elakad-live','--silent']);
run('pm2',['start',root+'/ops/ecosystem.config.cjs','--silent']);
await ready('http://127.0.0.1:3002');
const app=JSON.parse(run('pm2',['jlist'])).find(p=>p.name==='ahmed-elakad-live');
if(app?.pm2_env?.pm_cwd!==release||app.pm2_env.NEXT_DIST_DIR!==build||app.pm2_env.MEDIA_ORIGINALS_DIR!=='/home/sherif/data/ahmed-elakad/media-originals')
  throw Error('Runtime definition mismatch: '+JSON.stringify({cwd:app?.pm2_env?.pm_cwd,dist:app?.pm2_env?.NEXT_DIST_DIR}));
await check('new named live process ready');
await setNginx(original);
await check('public traffic on new live process');
run('pm2',['save','--silent']);
await fs.copyFile(root+'/ops/ecosystem.config.cjs',release+'/ops/ecosystem.config.cjs');
const content=await (await fetch('https://ahmedelakad.com/api/content')).text();
if(!content.startsWith('{"'))throw Error('public content endpoint is not a JSON object');
const gate=await fetch('https://ahmedelakad.com/api/admin/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'hi'}]})});
if(gate.status!==401)throw Error('assistant auth gate is not 401: '+gate.status);
console.log(JSON.stringify({deployed:true,release,build,port:3002,candidateRetained:true,contentOk:true,assistantGate:gate.status}));
