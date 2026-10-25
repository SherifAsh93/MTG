import { readFile,writeFile,rename,rm } from 'node:fs/promises';
import path from 'node:path';
import { bootstrapSettings,serviceSettings,settingsFor,connect,safeCode } from './hosted.mjs';
import { privateDirectory,runNeon,securePrivateDirectory } from './neon-access.mjs';

let stage='authorization check';
try{
  if(!process.argv.includes('--confirm-exposed-bootstrap'))throw new Error('Explicit bootstrap credential rotation confirmation required.');
  await securePrivateDirectory();const current=await bootstrapSettings();const journal=path.join(privateDirectory,'bootstrap-rotation-pending.json');
  try{await readFile(journal);throw new Error('A prior rotation needs private recovery; no second reset was requested.');}catch(error){if(error.code!=='ENOENT')throw error;}
  stage='resolve existing branch';const listed=JSON.parse(await runNeon(['branches','list','--project-id',current.projectId]));
  const branch=(Array.isArray(listed)?listed:listed.branches).find(b=>b.name===current.branch||b.id===current.branch);
  if(!branch)throw new Error('Expected branch not found.');
  const endpoint=`/projects/${encodeURIComponent(current.projectId)}/branches/${encodeURIComponent(branch.id)}/roles/${encodeURIComponent(current.settings.CONTIGOO_DB_USER)}/reset_password`;
  await writeFile(journal,JSON.stringify({status:'requested',requestedAt:new Date().toISOString(),projectId:current.projectId}),{flag:'wx',mode:0o600});
  stage='request provider password reset';const result=JSON.parse(await runNeon(['api',endpoint,'--method','POST']));
  if(typeof result.role?.password!=='string'||!result.role.password)throw new Error('Provider did not return the new private credential.');
  const updated={...current,settings:{...current.settings,CONTIGOO_DB_PASSWORD:result.role.password}};
  await writeFile(journal,JSON.stringify({status:'credential-received',configuration:updated,operations:result.operations||[]}),{mode:0o600});
  stage='wait for provider operation';
  for(const operation of result.operations||[]){
    let completed=false;
    for(let attempt=0;attempt<30;attempt++){
      const response=JSON.parse(await runNeon(['api',`/projects/${encodeURIComponent(current.projectId)}/operations/${encodeURIComponent(operation.id)}`]));
      const status=(response.operation||response).status;
      if(['finished','skipped'].includes(status)){completed=true;break;}
      if(['failed','error','cancelled'].includes(status))throw new Error('Provider operation failed; recovery journal retained.');
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    if(!completed)throw new Error('Provider operation is still pending; recovery journal retained.');
  }
  stage='verify replacement credential';const fresh=await connect(updated.settings);await fresh.end();
  let oldAccepted=false;
  try{const old=await connect(current.settings);oldAccepted=true;await old.end();}catch(error){if(error.code!=='28P01')throw error;}
  if(oldAccepted)throw new Error('Old credential is still accepted; recovery journal retained.');
  stage='save private configuration';const target=path.join(privateDirectory,'hosted-bootstrap.json');const temporary=target+'.next';
  await writeFile(temporary,JSON.stringify(updated,null,2),{mode:0o600,flag:'wx'});await rename(temporary,target);
  const services=await serviceSettings();for(const environment of ['development','test']){const client=await connect(settingsFor(services,environment,'app'));await client.end();}
  await rm(journal);
  console.log(JSON.stringify({status:'Passed',bootstrapPasswordRotated:true,oldCredentialRejected:true,separateRuntimeCredentialsVerified:true,credentialValuesPrinted:false}));
}catch(error){console.error(`Bootstrap rotation stopped during ${stage} (${safeCode(error)}). No credential values were printed. Inspect/recover through the private setup scripts before retrying a reset.`);process.exitCode=1;}
