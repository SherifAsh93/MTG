import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import { rootCertificates } from 'node:tls';
import { mkdtemp,mkdir,writeFile,rm,stat,access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Client } from 'pg';
import { deliveredEnvironment } from './delivered-environment.mjs';
import { Authentication } from '../dist/authentication.js';
import { Workspace } from '../dist/workspace.js';
import { Employees } from '../dist/employees.js';
import { initialState,saveClientProfile,createProject,toggleApp,publishClient } from '../../prototype/model.mjs';
import { enhanceState,definitionFor } from '../../prototype/builder-model.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const completed=[];const borrowedClients=[];let source,target,identity,workspace,restoredIdentity,restoredWorkspace,directory;
let stage='create isolated source/target databases';let success=false;
function databaseUrl(config){const url=new URL('postgresql://placeholder.invalid');url.hostname=config.host;url.port=String(config.port||5432);url.username=config.user;url.password=config.password;url.pathname=`/${config.database}`;return url.toString();}
function pgTool(name,configuration,args){
  const executable=process.env.PG_BINDIR?path.join(process.env.PG_BINDIR,name+(process.platform==='win32'?'.exe':'')):name;
  const result=spawnSync(executable,['--host',configuration.host,'--port',String(configuration.port||5432),'--username',configuration.user,'--no-password',...args],{
    env:{...process.env,PGPASSWORD:configuration.password,PGSSLMODE:'verify-full',PGSSLROOTCERT:path.join(directory,'ca.pem'),PGCONNECT_TIMEOUT:'15'},
    windowsHide:true,encoding:'utf8',timeout:120000,maxBuffer:1024*1024,
  });
  if(result.status!==0)throw new Error(`${name} failed; private tool output suppressed.`);
}
async function counts(configuration){const client=new Client(configuration);await client.connect();try{
  const result={};for(const [schema,table]of [['studio','clients'],['studio','projects'],['studio','app_records'],['studio','project_versions'],['studio','employees'],['studio','audit_events'],['studio','action_events'],['studio_auth','auth_users'],['studio_auth','auth_accounts'],['studio_auth','auth_sessions']])result[`${schema}.${table}`]=Number((await client.query(`SELECT count(*) FROM ${schema}.${table}`)).rows[0].count);
  return result;
}finally{await client.end();}}
try{
  if(process.platform==='win32'&&process.env.PG_ARCHIVE_FILE&&process.env.PG_BINDIR){
    const bin=path.resolve(process.env.PG_BINDIR);const home=path.resolve(bin,'../..');
    if(path.basename(bin)!=='bin'||path.basename(path.dirname(bin))!=='pgsql')throw new Error('Expected existing portable client directory.');
    await access(bin);await access(process.env.PG_ARCHIVE_FILE);
    for(const name of ['pg_dump.exe','pg_restore.exe']){
      try{await access(path.join(bin,name));}
      catch(error){if(error.code!=='ENOENT')throw error;
        const extracted=spawnSync('tar.exe',['-xf',process.env.PG_ARCHIVE_FILE,'-C',home,`pgsql/bin/${name}`],{stdio:'pipe',timeout:60000});
        if(extracted.status!==0)throw new Error('Could not use existing archived PostgreSQL client.');borrowedClients.push(path.join(bin,name));
      }
    }
  }
  await mkdir(path.join(root,'.private'),{recursive:true,mode:0o700});directory=await mkdtemp(path.join(root,'.private','restore-check-'));
  await writeFile(path.join(directory,'ca.pem'),rootCertificates.join('\n'),{mode:0o600});
  source=await deliveredEnvironment();target=await deliveredEnvironment({initialize:false});
  const configuration={...source,origin:'http://127.0.0.1:4444',host:'127.0.0.1',port:4444,environment:'test',authSecret:randomBytes(48).toString('base64url'),bootstrapToken:randomBytes(32).toString('base64url')};
  identity=new Authentication(configuration);workspace=new Workspace(configuration);
  const password=randomBytes(24).toString('base64url');const suffix=randomUUID().slice(0,8);
  const ownerInput={name:'Synthetic restore owner',username:`restore_${suffix}`,email:`restore-${suffix}@example.invalid`,phone:'+12025550126',password};
  const ownerId=(await identity.provision(ownerInput,'owner')).id;const actor={...ownerInput,id:ownerId,kind:'owner',requestId:randomUUID()};delete actor.password;
  const employeeId=(await identity.provision({name:'Synthetic restore employee',username:`staff_${suffix}`,email:`staff-${suffix}@example.invalid`,password:randomBytes(24).toString('base64url')},'employee',actor)).id;
  const employees=new Employees(identity);const employee=(await employees.list()).find(e=>e.principal_id===employeeId);
  await employees.update(actor,employeeId,{employeeCode:`RESTORE-${suffix.toUpperCase()}`,name:employee.name,department:'Operations',jobTitle:'Coordinator',notes:'Synthetic restore fixture',revision:Number(employee.revision)});
  let loaded=await workspace.load(actor);const state=enhanceState(initialState());const client=saveClientProfile(state,{name:'Synthetic restore client'});const project=createProject(state,{clientId:client.id,name:'Synthetic restore project'});enhanceState(state);toggleApp(project,'crm');definitionFor(state,project,'crm');
  loaded=await workspace.save(actor,{revision:loaded.revision,state});loaded=await workspace.record(actor,{revision:loaded.revision,projectId:project.id,appId:'crm',entityId:'records',values:{name:'Synthetic restored record',status:'New'}});
  publishClient(loaded.state.clients[0]);await workspace.save(actor,{revision:loaded.revision,state:loaded.state});
  await identity.pool.query('INSERT INTO studio.project_assignments(principal_id,project_id,can_manage) VALUES($1,$2,false)',[employeeId,project.id]);
  await identity.pool.query('SELECT studio.record_action($1,$2,$3,$4,200,$5,NULL,NULL)',[employeeId,randomUUID(),'SYNTHETIC restore audit','TEST',project.id]);
  const login=await identity.auth.api.signInEmail({body:{email:ownerInput.email,password},headers:new Headers({Origin:configuration.origin}),asResponse:true});assert.equal(login.status,200);
  const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');const expected=await counts(source.migrationDatabase);
  stage='TLS-verified logical dump';const archive=path.join(directory,'synthetic.dump');
  pgTool('pg_dump',source.migrationDatabase,['--dbname',source.migrationDatabase.database,'--format=custom','--no-owner','--no-privileges','--schema=studio','--schema=studio_auth','--schema=contigoo_migrations','--file',archive]);
  completed.push('Standard pg_dump produced a private logical archive using verified TLS');
  stage='restore into an isolated empty database';
  pgTool('pg_restore',target.migrationDatabase,['--dbname',target.migrationDatabase.database,'--no-owner','--no-privileges','--exit-on-error','--single-transaction',archive]);
  assert.deepEqual(await counts(target.migrationDatabase),expected);completed.push('Logical restore preserved records, versions, employee references, audit events and identity/session rows');
  stage='reapply portable runtime grants';
  const migration=spawnSync(process.execPath,[path.join(root,'dist/migrate-production.js')],{cwd:root,stdio:'pipe',encoding:'utf8',timeout:120000,env:{...process.env,
    MIGRATION_DATABASE_URL:databaseUrl(target.migrationDatabase),APP_DATABASE_ROLE:target.appDatabase.user,IDENTITY_DATABASE_ROLE:target.identityDatabase.user}});
  assert.equal(migration.status,0,'Portable migration/grants command failed; output withheld.');completed.push('Restored migration checksums and new runtime/identity role grants verified');
  stage='verify restored authentication and permissions';const restoredConfig={...configuration,...target};restoredIdentity=new Authentication(restoredConfig);restoredWorkspace=new Workspace(restoredConfig);
  const session=await restoredIdentity.auth.api.getSession({headers:new Headers({Origin:configuration.origin,Cookie:cookie})});assert.equal(session.user.id,ownerId);
  const freshLogin=await restoredIdentity.auth.api.signInEmail({body:{email:ownerInput.email,password},headers:new Headers({Origin:configuration.origin}),asResponse:true});assert.equal(freshLogin.status,200);
  const phoneLogin=await restoredIdentity.login({ip:'127.0.0.1',headers:{origin:configuration.origin},body:{identifier:'+1 (202) 555-0126',password}});assert.equal(phoneLogin.status,200);
  const restored=await restoredWorkspace.load(actor);assert.equal(restored.state.clients[0].version,1);assert.equal(restored.state.clients[0].demoRecords.crm.records[0].values.name,'Synthetic restored record');
  const employeeActor={id:employeeId,kind:'employee',name:'Synthetic restore employee',email:`staff-${suffix}@example.invalid`};assert.equal((await restoredWorkspace.projects(employeeActor)).length,1);
  await assert.rejects(()=>restoredWorkspace.manage(employeeActor,project.id,{status:'archived',revision:1}),error=>error.code==='42501');completed.push('Restored password login, sessions, data, versions and read-only employee authorization work');
  const size=(await stat(archive)).size;success=true;
  console.log(JSON.stringify({status:'Passed',archiveBytes:size,checks:completed,boundary:'Real remote PostgreSQL logical restore using existing Windows client tools; Linux/VPS infrastructure is not yet tested.'},null,2));
}catch{console.error(`Restore check failed during ${stage}. Private database/tool details were suppressed.`);process.exitCode=1;}
finally{
  for(const pool of [identity?.pool,workspace?.pool,restoredIdentity?.pool,restoredWorkspace?.pool])if(pool)await pool.end();
  if(target)await target.cleanup();if(source)await source.cleanup();if(directory)await rm(directory,{recursive:true,force:true});
  for(const client of borrowedClients)await rm(client);
  const report={checkedAt:new Date().toISOString(),status:success?'Passed':'Failed',stage,completed};await mkdir(path.join(root,'reports'),{recursive:true});await writeFile(path.join(root,'reports',`restore-${report.checkedAt.replaceAll(':','-').replaceAll('.','-')}.json`),JSON.stringify(report,null,2));
}
