import { loadConfig } from './config.js';
import { createApplication } from './server.js';
let stage='configuration';
const progress=()=>{if(process.env.CONTIGOO_STARTUP_DIAGNOSTICS==='1')console.log(`Startup stage: ${stage}`);};
try{
  progress();const config=await loadConfig();stage='application initialization';progress();const runtime=await createApplication(config);stage='listener startup';progress();
  await runtime.app.listen(config.port,config.host);
  console.log(`Contigoo Studio backend ready at ${config.origin}`);
  let closing=false;const close=async()=>{if(closing)return;closing=true;await runtime.close();};
  process.on('SIGTERM',close);process.on('SIGINT',close);
}catch(error:any){const code=/^[A-Z0-9_]{1,40}$/.test(error?.code||'')?error.code:'STARTUP_FAILED';const kind=['TypeError','Error','UnknownDependenciesException','UnknownModuleException','RuntimeException'].includes(error?.constructor?.name)?error.constructor.name:'StartupError';console.error(`Contigoo startup failed during ${stage} (${code}). Type: ${kind}. Credentials were not logged.`);process.exitCode=1;}
