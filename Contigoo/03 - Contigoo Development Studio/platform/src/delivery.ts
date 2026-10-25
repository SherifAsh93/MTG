import { readFile,readdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import { zipSync,strToU8 } from 'fflate';
import type { Configuration } from './config.js';
import { platformRoot } from './config.js';
import { type Actor,fail } from './authentication.js';
import { Workspace } from './workspace.js';
import { emptyWorkspace,validateWorkspace,validateRecordValues } from './workspace-validation.js';
import { modules,publicationHistory } from '../../prototype/model.mjs';
import { defaultDefinition,saveDemoRecord } from '../../prototype/builder-model.mjs';

export async function exportWebPackage(workspace:Workspace,actor:Actor,projectId:string,version:number){
  const {state}=await workspace.load(actor);const project=state.clients.find((p:any)=>p.id===projectId);if(!project)fail(404,'Project not found.');
  const saved=publicationHistory(project).find((v:any)=>v.version===version);if(!saved)fail(404,'Save a version before creating a standalone package.');
  const manifest={formatVersion:1,projectId,version,name:project.name,configuration:saved.config,
    customApps:state.customApps.filter((a:any)=>saved.config.apps.includes(a.id))};
  const files:Record<string,Uint8Array>={};
  const root=path.resolve(platformRoot,'..');
  const include=async(relative:string)=>{files[relative]=await readFile(path.join(root,relative));};
  for(const name of await readdir(path.join(platformRoot,'dist'))){
    if(name.endsWith('.js')&&!['setup.js','open-setup.js'].includes(name))await include(`platform/dist/${name}`);
  }
  for(const name of ['index.html','entry.mjs','connected.css','runtime.mjs'])await include(`platform/web/${name}`);
  for(const name of ['app.mjs','studio-ui.mjs','model.mjs','builder-model.mjs','styles.css','studio.css'])await include(`prototype/${name}`);
  for(const name of ['logo.png','inter.woff2','fraunces.woff2','Inter-OFL.txt','Fraunces-OFL.txt'])await include(`prototype/assets/${name}`);
  await include('database/migration-core.mjs');
  for(const name of await readdir(path.join(root,'database/migrations')))if(/^\d{3}_[a-z0-9_]+\.sql$/.test(name))await include(`database/migrations/${name}`);
  const pkg=JSON.parse(await readFile(path.join(platformRoot,'package.json'),'utf8'));
  pkg.scripts={start:'node platform/dist/main.js',migrate:'node platform/dist/migrate-production.js',secrets:'node platform/dist/initialize-secrets.js'};
  files['package.json']=strToU8(JSON.stringify(pkg,null,2));files['package-lock.json']=await readFile(path.join(platformRoot,'package-lock.json'));
  files['delivery.json']=strToU8(JSON.stringify(manifest,null,2));
  files['.env.example']=strToU8((await readFile(path.join(platformRoot,'.env.example'),'utf8')).replace('APP_MODE=studio','APP_MODE=delivered')+'\nAPP_MANIFEST=delivery.json\n');
  files['.env.migration.example']=await readFile(path.join(platformRoot,'.env.migration.example'));
  files['.gitignore']=strToU8('node_modules/\n.private/\n.env\n.env.*\n!.env.example\n!.env.migration.example\n*.log\n');
  files['README.md']=await readFile(path.join(platformRoot,'PACKAGE_README.md'));
  const checksums=Object.fromEntries(Object.entries(files).map(([name,data])=>[name,createHash('sha256').update(data).digest('hex')]));
  files['checksums.json']=strToU8(JSON.stringify(checksums,null,2));
  return Buffer.from(zipSync(files,{level:6}));
}

export class DeliveredApplication {
  constructor(private readonly config:Configuration,private readonly workspace:Workspace){}
  async initialize(actor:Actor){
    const manifest=this.config.delivery;if(!manifest)return fail(404,'This is the internal Studio.');
    const projects=await this.workspace.projects(actor);
    if(projects.some(p=>p.id===manifest.projectId))return;
    if(actor.kind!=='owner')return fail(403,'The application administrator must initialize this delivery first.');
    const loaded=await this.workspace.load(actor);
    if(loaded.state.clients.length)fail(409,'This database already contains another solution. Use a dedicated solution database.');
    const state=emptyWorkspace();const clientId=randomUUID();
    state.clientProfiles.push({id:clientId,name:manifest.name,industry:'',contact:'',email:'',phone:'',address:'',notes:''});
    state.customApps=manifest.customApps;
    state.clients.push({id:manifest.projectId,clientId,name:manifest.name,description:'Standalone delivered application',template:'blank',industry:'Custom project',
      draft:manifest.configuration,published:manifest.configuration,version:manifest.version,dirty:false,archived:false,
      publications:[{version:manifest.version,publishedAt:null,config:manifest.configuration}],demoRecords:{},workflowLog:[]});
    validateWorkspace(state,undefined,true);
    await this.workspace.import(actor,{revision:loaded.revision,confirm:true,state});
  }
  async read(actor:Actor){
    return this.workspace.transaction(actor,async c=>{
      const p=(await c.query('SELECT id,name,status,draft_model FROM studio.projects WHERE id=$1',[this.config.delivery.projectId])).rows[0];
      if(!p||p.status!=='active')fail(403,'Application access is not available.');
      const apps=(await c.query('SELECT app_id,definition FROM studio.project_apps WHERE project_id=$1 AND enabled ORDER BY app_id',[p.id])).rows;
      const records=(await c.query('SELECT r.app_id,r.entity_id,r.id,r."values",r.revision FROM studio.app_records r JOIN studio.project_apps a ON a.project_id=r.project_id AND a.app_id=r.app_id WHERE r.project_id=$1 AND a.enabled ORDER BY r.position,r.id',[p.id])).rows;
      const canWrite=(await c.query('SELECT studio.can_access_project($1,true) AS permitted',[p.id])).rows[0].permitted;
      const activity=(await c.query('SELECT e.app_id,e.entity_id,e.record_id,e.note,e.occurred_at FROM studio.record_events e JOIN studio.project_apps a ON a.project_id=e.project_id AND a.app_id=e.app_id WHERE e.project_id=$1 AND a.enabled ORDER BY e.occurred_at DESC,e.id DESC LIMIT 20',[p.id])).rows;
      return{name:p.draft_model.name,branding:{logo:p.draft_model.logo,color:p.draft_model.color,tagline:p.draft_model.tagline},projectId:p.id,apps,records,activity,canWrite};
    },true);
  }
  async record(actor:Actor,input:any,remove=false){
    await this.initialize(actor);return this.workspace.transaction(actor,async c=>{
      const projectId=this.config.delivery.projectId;
      await c.query('SELECT studio.lock_workspace_for_project($1)',[projectId]);
      const project=(await c.query('SELECT id,status,draft_model FROM studio.projects WHERE id=$1 FOR UPDATE',[projectId])).rows[0];
      if(!project||project.status!=='active')fail(403,'Application access is not available.');
      const permission=(await c.query('SELECT studio.can_access_project($1,true) AS permitted',[projectId])).rows[0].permitted;
      if(!permission)fail(403,'Read-only access.');
      const app=(await c.query('SELECT definition FROM studio.project_apps WHERE project_id=$1 AND app_id=$2 AND enabled',[projectId,input.appId])).rows[0];
      if(!app)fail(403,'App is not enabled.');
      const entity=app.definition.entities.find((e:any)=>e.id===input.entityId);if(!entity)fail(400,'Entity not found.');
      const previous=(await c.query('SELECT id,"values",revision FROM studio.app_records WHERE project_id=$1 AND app_id=$2 AND entity_id=$3 ORDER BY position,id',[projectId,input.appId,input.entityId])).rows;
      if(input.recordId&&!previous.some(r=>r.id===input.recordId))fail(404,'Record not found.');
      if(input.recordId&&Number(previous.find(r=>r.id===input.recordId).revision)!==input.expectedRevision)fail(409,'This record changed. Reload before saving.');
      if(remove){await c.query('DELETE FROM studio.app_records WHERE project_id=$1 AND app_id=$2 AND entity_id=$3 AND id=$4',[projectId,input.appId,input.entityId,input.recordId]);return{saved:true};}
      input.values=validateRecordValues(input.values);
      if(Object.keys(input.values).some(k=>!entity.fields.some((f:any)=>f.id===k)))fail(400,'Invalid record fields.');
      if(!input.recordId&&previous.length>=10000)fail(409,'The supported per-entity record limit has been reached.');
      const scratch={draft:project.draft_model,demoRecords:{[input.appId]:{[input.entityId]:previous}},workflowLog:[]};
      let record;try{record=saveDemoRecord(scratch,input.appId,app.definition,input.entityId,input.values,input.recordId||'');}catch(error:any){fail(400,error.message);}
      await c.query(`INSERT INTO studio.app_records(project_id,app_id,entity_id,id,position,"values") VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(project_id,app_id,entity_id,id) DO UPDATE SET "values"=excluded."values",revision=studio.app_records.revision+1`,[projectId,input.appId,input.entityId,record.id,previous.length,record.values]);
      for(const note of scratch.workflowLog as any[])await c.query('INSERT INTO studio.record_events(project_id,app_id,entity_id,record_id,actor_id,note) VALUES($1,$2,$3,$4,$5,$6)',[projectId,input.appId,input.entityId,record.id,actor.id,note.note]);
      return{saved:true,record};
    });
  }
  async review(actor:Actor){
    const loaded=await this.workspace.load(actor);const project=loaded.state.clients.find((p:any)=>p.id===this.config.delivery.projectId);if(!project)fail(409,'Initialize the application first.');
    const targets=[{...this.config.delivery,kind:'package'},...publicationHistory(project).filter((v:any)=>v.version!==project.version).map((v:any)=>({version:v.version,configuration:v.config,customApps:loaded.state.customApps,kind:'saved'}))];
    const candidates=targets.map(target=>{
      try{this.workspace.versionCandidate(loaded.state,project.id,target);return{version:target.version,kind:target.kind,compatible:true,message:'Compatible with existing records.'};}
      catch(error:any){return{version:target.version,kind:target.kind,compatible:false,message:typeof error.getResponse==='function'?error.getResponse().message:'Configuration validation failed.'};}
    });
    return{installedVersion:project.version,availableVersion:this.config.delivery.version,revision:loaded.revision,candidates};
  }
  async apply(actor:Actor,input:any){
    if(input.confirm!==true||!Number.isSafeInteger(input.expectedRevision)||!Number.isSafeInteger(input.expectedVersion))fail(400,'Review and explicitly confirm the configuration change.');
    let target;
    if(input.kind==='package')target=this.config.delivery;
    else if(input.kind==='saved'){
      const loaded=await this.workspace.load(actor);const project=loaded.state.clients.find((p:any)=>p.id===this.config.delivery.projectId);
      const version=project&&publicationHistory(project).find((v:any)=>v.version===input.version);if(!version)fail(404,'Saved configuration version not found.');
      target={version:version.version,configuration:version.config,customApps:loaded.state.customApps};
    }else fail(400,'Choose the package or a saved configuration.');
    await this.workspace.applyVersion(actor,this.config.delivery.projectId,target,input.expectedRevision,input.expectedVersion);
    return{saved:true,installedVersion:target.version};
  }
}
