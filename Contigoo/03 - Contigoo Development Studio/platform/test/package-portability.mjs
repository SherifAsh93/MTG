import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm,access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

function databaseUrl(config){const url=new URL('postgresql://placeholder.invalid');url.hostname=config.host;url.port=String(config.port||5432);url.username=config.user;url.password=config.password;url.pathname=`/${config.database}`;return url.toString();}
export async function verifyPackedRuntime(files,configuration,credentials,startupOnly=false){
  const temporaryRoot=process.env.CONTIGOO_TEST_TEMP_ROOT||(process.platform==='win32'?path.join(os.tmpdir(),'opencode'):os.tmpdir());
  await access(temporaryRoot);const directory=await mkdtemp(path.join(temporaryRoot,'contigoo-package-'));
  let child;let exit;let diagnostics='';let stdout='';let healthStatus=null;let fetchCode=null;
  try{
    for(const [name,bytes]of Object.entries(files)){
      assert(!name.startsWith('/')&&!name.split('/').includes('..'),'Unsafe package path');const target=path.join(directory,name);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);
    }
    assert(process.env.npm_execpath,'Run this check using npm test.');
    const install=spawn(process.execPath,[process.env.npm_execpath,'ci','--omit=dev','--no-fund','--ignore-scripts'],{cwd:directory,stdio:'ignore',windowsHide:true});
    const [installCode]=await once(install,'close');assert.equal(installCode,0,'The exported lockfile must install independently.');
    const origin='https://delivery.example.invalid';
    const startupStarted=Date.now();
    child=spawn(process.execPath,[path.join(directory,'platform/dist/main.js')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,
      CONTIGOO_ENV:'production',APP_MODE:'delivered',APP_MANIFEST:path.join(directory,'delivery.json'),APP_ORIGIN:origin,
      HOST:'127.0.0.1',PORT:String(configuration.port),AUTH_SECRET:configuration.authSecret,OWNER_SETUP_TOKEN:configuration.bootstrapToken,
      DATABASE_URL:databaseUrl(configuration.appDatabase),IDENTITY_DATABASE_URL:databaseUrl(configuration.identityDatabase),TRUST_PROXY_HOPS:'0',CONTIGOO_STARTUP_DIAGNOSTICS:'1',NODE_TEST_CONTEXT:undefined,NODE_PATH:'',
    }});child.stderr.on('data',chunk=>{diagnostics+=chunk.toString();});child.stdout.on('data',chunk=>{stdout+=chunk.toString();});exit=once(child,'close');
    const backend=`http://127.0.0.1:${configuration.port}`;let healthy=false;
    for(let attempt=0;attempt<360;attempt++){if(child.exitCode!==null)break;try{const response=await fetch(`${backend}/api/health`,{signal:AbortSignal.timeout(3000)});healthStatus=response.status;if(response.ok){healthy=true;break;}}catch(error){fetchCode=/^[A-Z_]+$/.test(error.cause?.code||'')?error.cause.code:'FETCH_FAILED';}await new Promise(resolve=>setTimeout(resolve,250));}
    const safeDiagnostic=diagnostics.match(/Contigoo startup failed during [a-z ]+ \([A-Z0-9_]+\). Type: [A-Za-z]+/)?.[0]||diagnostics.match(/ERR_[A-Z_]+/)?.[0]||`no diagnostic code; exit=${child.exitCode}`;
    const stages=[...stdout.matchAll(/Startup stage: ([a-z ]+)/g)].map(match=>match[1]);
    assert(healthy,`Exported runtime must boot with environment-only configuration (${safeDiagnostic}; preload=${stdout.includes('Node bootstrap started')}; stages=${stages.join('/')}; ready=${stdout.includes('backend ready')}; HTTP=${healthStatus}; network=${fetchCode}).`);
    if(startupOnly)return{independentInstall:true,environmentOnlyStartup:true,startupMilliseconds:Date.now()-startupStarted};
    const login=await fetch(`${backend}/api/login`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(credentials)});
    assert.equal(login.status,200);assert(login.headers.getSetCookie().some(cookie=>/; Secure/i.test(cookie)),'Production cookies must be Secure.');
    const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
    const runtime=await fetch(`${backend}/api/runtime`,{headers:{Origin:origin,Cookie:cookie}});assert.equal(runtime.status,200);
    const data=await runtime.json();assert(data.records.some(r=>r.values.name==='Synthetic delivered record'),'Saved application data must survive a runtime restart.');
    assert.equal((await fetch(`${backend}/api/workspace`,{headers:{Origin:origin,Cookie:cookie}})).status,403);
    return{independentInstall:true,environmentOnlyStartup:true,recordsSurviveRestart:true,secureCookiePolicy:true,
      boundary:'Windows artifact smoke through the private HTTP upstream; actual Linux/HTTPS reverse proxy remains to be verified on the authorized VPS.'};
  }finally{
    if(child&&child.exitCode===null){child.kill();await exit;}
    await rm(directory,{recursive:true,force:true});
  }
}
