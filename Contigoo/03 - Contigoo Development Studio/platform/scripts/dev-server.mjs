import { readFile,writeFile,open } from 'node:fs/promises';
import { spawn,execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { loadConfig,platformRoot } from '../dist/config.js';

async function launchBrowser(url){
  if(process.platform==='win32')await new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command','Start-Process $env:CONTIGOO_BROWSER_URL'],{env:{...process.env,CONTIGOO_BROWSER_URL:url},windowsHide:true},error=>error?reject(error):resolve()));
  else console.log('Open the application URL in your browser. For owner setup, use the protected code from your private configuration.');
}
try{
  const config=await loadConfig('development');const marker=path.join(platformRoot,'.private','development-server.json');let owned=null;
  try{owned=JSON.parse(await readFile(marker,'utf8'));if(owned.type!=='contigoo-development-server')throw new Error('Unexpected process marker.');}catch(error){if(error.code!=='ENOENT')throw error;}
  let health=null;try{const response=await fetch(`${config.origin}/api/health`,{signal:AbortSignal.timeout(3000)});if(response.ok)health=await response.json();}catch{}
  if(process.argv.includes('--stop')){
    if(!owned||!health||health.instanceId!==owned.instanceId)throw new Error('No matching owned server is available to stop.');
    process.kill(owned.pid);console.log('The owned development server was stopped.');
  }else{
    if(health&&(!owned||health.instanceId!==owned.instanceId))throw new Error('The configured port is already used by another server.');
    if(!health){
      let active=false;if(owned)try{process.kill(owned.pid,0);active=true;}catch{}
      if(active)throw new Error('An owned process is still starting or unresponsive. Inspect its private log before restarting.');
      const log=await open(path.join(platformRoot,'.private','development-server.log'),'a',0o600);const instanceId=randomUUID();
      const child=spawn(process.execPath,[path.join(platformRoot,'dist/main.js')],{cwd:platformRoot,detached:true,windowsHide:true,
        stdio:['ignore',log.fd,log.fd],env:{...process.env,CONTIGOO_ENV:'development',APP_ORIGIN:config.origin,PORT:String(config.port),HOST:config.host,CONTIGOO_INSTANCE_ID:instanceId}});
      child.unref();await log.close();owned={type:'contigoo-development-server',pid:child.pid,instanceId,origin:config.origin,startedAt:new Date().toISOString()};
      await writeFile(marker,JSON.stringify(owned),{mode:0o600});
      for(let attempt=0;attempt<180;attempt++){
        try{const response=await fetch(`${config.origin}/api/health`,{signal:AbortSignal.timeout(2000)});if(response.ok){health=await response.json();if(health.instanceId===instanceId)break;}}catch{}
        await new Promise(resolve=>setTimeout(resolve,500));
      }
      if(!health||health.instanceId!==instanceId)throw new Error('The development server did not become ready.');
    }
    const setup=await(await fetch(`${config.origin}/api/setup-status`)).json();
    const target=setup.ownerExists?config.origin:`${config.origin}/setup#token=${encodeURIComponent(config.bootstrapToken)}`;
    await launchBrowser(target);
    console.log(JSON.stringify({status:'Ready',url:config.origin,ownerSetupRequired:!setup.ownerExists,scope:'Laptop-hosted backend with hosted PostgreSQL; no VPS deployment yet.'}));
  }
}catch{console.error('Development server operation failed. Check the private process marker/log; no credentials or protected setup link were printed.');process.exitCode=1;}
