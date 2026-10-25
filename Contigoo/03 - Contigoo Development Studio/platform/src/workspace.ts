import { Pool, type PoolClient } from 'pg';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
import type { Configuration } from './config.js';
import type { Actor } from './authentication.js';
import { fail } from './authentication.js';
import { emptyWorkspace, validateWorkspace, normalizeImport,validateRecordValues } from './workspace-validation.js';
import { modules, publicationHistory } from '../../prototype/model.mjs';
import { defaultDefinition, saveDemoRecord, quoteFor } from '../../prototype/builder-model.mjs';

export class Workspace {
  readonly pool: Pool;
  constructor(config:Configuration) { this.pool=new Pool(config.appDatabase);this.pool.on('error',()=>console.error('Application database connection error.')); }
  async transaction<T>(actor:Actor, run:(c:PoolClient)=>Promise<T>,readOnly=false):Promise<T>{
    const c=await this.pool.connect();
    try{await c.query(readOnly?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');await c.query("SELECT set_config('contigoo.actor_id',$1,true),set_config('contigoo.request_id',$2,true)",[actor.id,actor.requestId||'']);const result=await run(c);await c.query('COMMIT');return result;}
    catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
  private async read(c:PoolClient,lock=false){
    const settings=(await c.query(`SELECT revision,configuration FROM studio.workspace_settings WHERE id=1${lock?' FOR UPDATE':''}`)).rows[0];
    if(!settings) return fail(403,'Studio development access is owner-only.');
    const clients=(await c.query('SELECT id,name,industry,contact,email,phone,address,notes FROM studio.clients ORDER BY created_at,id')).rows;
    const projects=(await c.query('SELECT id,client_id,name,description,status,draft_model,studio_state FROM studio.projects ORDER BY created_at,id')).rows;
    const records=(await c.query('SELECT project_id,app_id,entity_id,id,"values" FROM studio.app_records ORDER BY position,id')).rows;
    const versions=(await c.query('SELECT project_id,version,configuration,published_at FROM studio.project_versions ORDER BY version DESC')).rows;
    const state={...emptyWorkspace(),...settings.configuration,clientProfiles:clients,clients:projects.map(p=>{
      const data:any={...p.studio_state,id:p.id,clientId:p.client_id,name:p.name,description:p.description,archived:p.status==='archived',draft:p.draft_model,demoRecords:{},publications:[]};
      // Empty entity arrays are retained in metadata so save/reload does not change shape.
      for(const [app,entities] of Object.entries(data.recordShape||{}) as any[])data.demoRecords[app]=Object.fromEntries(entities.map((id:string)=>[id,[]]));
      delete data.recordShape;
      for(const r of records.filter(r=>r.project_id===p.id)){data.demoRecords[r.app_id]??={};data.demoRecords[r.app_id][r.entity_id]??=[];data.demoRecords[r.app_id][r.entity_id].push({id:r.id,values:r.values});}
      data.publications=versions.filter(v=>v.project_id===p.id).map(v=>({version:v.version,publishedAt:v.published_at?.toISOString()||null,config:v.configuration}));
      return data;
    })};
    return {revision:Number(settings.revision),state};
  }
  load(actor:Actor){return this.transaction(actor,c=>this.read(c),true);}
  private async persist(c:PoolClient,state:any,previous:any,revision:number){
    const nextProjectIds=state.clients.map((p:any)=>p.id);const nextClientIds=state.clientProfiles.map((p:any)=>p.id);
    for(const old of previous.clients)if(!nextProjectIds.includes(old.id))await c.query('DELETE FROM studio.projects WHERE id=$1',[old.id]);
    for(const old of previous.clientProfiles)if(!nextClientIds.includes(old.id))await c.query('DELETE FROM studio.clients WHERE id=$1',[old.id]);
    for(const client of state.clientProfiles){
      if(isDeepStrictEqual(client,previous.clientProfiles.find((old:any)=>old.id===client.id)))continue;
      await c.query(`INSERT INTO studio.clients(id,name,industry,contact,email,phone,address,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name,industry=excluded.industry,contact=excluded.contact,email=excluded.email,phone=excluded.phone,address=excluded.address,notes=excluded.notes`,
      [client.id,client.name,client.industry,client.contact,client.email,client.phone,client.address,client.notes]);
    }
    const catalog=[...modules,...state.customApps];
    for(const p of state.clients){
      const previousProject=previous.clients.find((old:any)=>old.id===p.id);
      if(isDeepStrictEqual(p,previousProject))continue;
      const {id,clientId,name,description,draft,demoRecords,publications,...metadata}=p;
      metadata.recordShape=Object.fromEntries(Object.entries(demoRecords).map(([app,entities])=>[app,Object.keys(entities as object)]));
      await c.query(`INSERT INTO studio.projects(id,client_id,name,description,status,draft_model,studio_state) VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,status=excluded.status,draft_model=excluded.draft_model,studio_state=excluded.studio_state`,
      [id,clientId,name,description,p.archived?'archived':'active',draft,metadata]);
      const appIds=new Set([...draft.apps,...Object.keys(draft.appDefinitions),...Object.keys(demoRecords)]);
      for(const appId of appIds){
        const def=draft.appDefinitions[appId as string]||defaultDefinition(catalog.find((a:any)=>a.id===appId));
        await c.query(`INSERT INTO studio.project_apps(project_id,app_id,enabled,definition) VALUES($1,$2,$3,$4)
          ON CONFLICT(project_id,app_id) DO UPDATE SET enabled=excluded.enabled,definition=excluded.definition`,[id,appId,draft.apps.includes(appId),def]);
      }
      await c.query('UPDATE studio.project_apps SET enabled=false WHERE project_id=$1 AND NOT (app_id=ANY($2::text[]))',[id,draft.apps]);
      const oldRecords=previousProject?.demoRecords||{};
      for(const [oldApp,entities] of Object.entries(oldRecords) as any[])for(const [oldEntity,rows] of Object.entries(entities) as any[])for(const row of rows){
        if(!demoRecords[oldApp]?.[oldEntity]?.some((next:any)=>next.id===row.id))await c.query('DELETE FROM studio.app_records WHERE project_id=$1 AND app_id=$2 AND entity_id=$3 AND id=$4',[id,oldApp,oldEntity,row.id]);
      }
      for(const [appId,entities] of Object.entries(demoRecords) as any[])for(const [entityId,rows] of Object.entries(entities) as any[])for(const [position,r] of rows.entries()){
        const previousRows=oldRecords[appId]?.[entityId]||[];const oldIndex=previousRows.findIndex((old:any)=>old.id===r.id);
        if(oldIndex===position&&isDeepStrictEqual(previousRows[oldIndex],r))continue;
        await c.query(`INSERT INTO studio.app_records(project_id,app_id,entity_id,id,position,"values") VALUES($1,$2,$3,$4,$5,$6)
          ON CONFLICT(project_id,app_id,entity_id,id) DO UPDATE SET position=excluded.position,"values"=excluded."values",revision=studio.app_records.revision+1`,[id,appId,entityId,r.id,position,r.values]);
      }
      for(const v of publicationHistory(p)){
        await c.query('INSERT INTO studio.project_versions(project_id,version,configuration,published_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[id,v.version,v.config,v.publishedAt]);
      }
    }
    const {clients,clientProfiles,...globals}=state;
    const updated=await c.query('UPDATE studio.workspace_settings SET configuration=$1,revision=revision+1 WHERE id=1 RETURNING revision',[globals]);
    return {revision:Number(updated.rows[0].revision),state};
  }
  save(actor:Actor,input:any){
    if(actor.kind!=='owner')return fail(403,'Only the owner can edit Studio configuration.');
    return this.transaction(actor,async c=>{
      const old=await this.read(c,true);if(input.revision!==old.revision)fail(409,'Another session saved changes. Reload before saving; your server data was kept.');
      const state=validateWorkspace(input.state,old.state);
      if(old.state.clientProfiles.some((p:any)=>!state.clientProfiles.some((n:any)=>n.id===p.id)&&old.state.clients.some((project:any)=>project.clientId===p.id)) && input.confirmRelatedDeletion!==true)fail(400,'Confirm deletion of related projects.');
      return this.persist(c,state,old.state,old.revision);
    });
  }
  import(actor:Actor,input:any){
    if(actor.kind!=='owner')return fail(403,'Only the owner can import a workspace.');
    return this.transaction(actor,async c=>{
      const old=await this.read(c,true);
      if(input.revision!==old.revision)fail(409,'The workspace changed. Reload before importing.');
      if(old.state.clients.length||old.state.clientProfiles.length||old.state.customApps.length)fail(409,'Import requires an empty workspace; existing work will not be overwritten.');
      if(input.confirm!==true)fail(400,'Confirm the browser-workspace import.');
      return this.persist(c,normalizeImport(input.state),old.state,old.revision);
    });
  }
  record(actor:Actor,input:any,remove=false){
    if(actor.kind!=='owner')return fail(403,'Use assigned-project management endpoints for employee work.');
    return this.transaction(actor,async c=>{
      const old=await this.read(c,true);if(input.revision!==old.revision)fail(409,'The workspace changed. Reload before editing records.');
      const state=structuredClone(old.state);const p=state.clients.find((p:any)=>p.id===input.projectId);
      if(!p||p.archived)fail(404,'Active project not found.');
      if(!p.draft.apps.includes(input.appId))fail(403,'This app is not enabled for the project.');
      const d=p.draft.appDefinitions[input.appId]||defaultDefinition([...modules,...state.customApps].find((a:any)=>a.id===input.appId));
      p.draft.appDefinitions[input.appId]??=d;
      if(!d.entities.some((e:any)=>e.id===input.entityId))fail(400,'Entity not found.');
      if(remove){
        const rows=p.demoRecords[input.appId]?.[input.entityId]||[];
        if(!rows.some((r:any)=>r.id===input.recordId))fail(404,'Record not found.');
        p.demoRecords[input.appId][input.entityId]=rows.filter((r:any)=>r.id!==input.recordId);
      }else{
        input.values=validateRecordValues(input.values);
        const fields=d.entities.find((e:any)=>e.id===input.entityId).fields;
        if(Object.keys(input.values).some(k=>!fields.some((f:any)=>f.id===k)))fail(400,'Unknown record field.');
        try{saveDemoRecord(p,input.appId,d,input.entityId,input.values,input.recordId||'');}catch(error:any){fail(400,error.message);}
      }
      const stateValidated=validateWorkspace(state);
      return this.persist(c,stateValidated,old.state,old.revision);
    });
  }
  projects(actor:Actor){return this.transaction(actor,async c=>(await c.query('SELECT p.id,p.client_id,p.name,p.description,p.status,p.revision,c.name AS client_name,studio.can_access_project(p.id,true) AS can_manage FROM studio.projects p JOIN studio.clients c ON c.id=p.client_id ORDER BY p.name')).rows);}
  async applyVersion(actor:Actor,projectId:string,target:any,expectedRevision:number,expectedVersion:number){
    if(actor.kind!=='owner')return fail(403,'Application administrator permission required.');
    return this.transaction(actor,async c=>{
      const old=await this.read(c,true);const previous=old.state.clients.find((p:any)=>p.id===projectId);
      if(!previous||old.revision!==expectedRevision||previous.version!==expectedVersion)fail(409,'Application state changed. Review the update again.');
      const state=this.versionCandidate(old.state,projectId,target);
      return this.persist(c,state,old.state,old.revision);
    });
  }
  versionCandidate(original:any,projectId:string,target:any){
    const state=structuredClone(original);const project=state.clients.find((p:any)=>p.id===projectId);if(!project)fail(404,'Application project not found.');
    const existing=publicationHistory(project).find((v:any)=>v.version===target.version);
    if(existing&&!isDeepStrictEqual(existing.config,target.configuration))fail(409,'A version number cannot be reused with different configuration.');
    const history=publicationHistory(project);
    project.draft=structuredClone(target.configuration);project.published=structuredClone(target.configuration);project.version=target.version;project.dirty=false;
    project.publications=existing?history:[{version:target.version,publishedAt:new Date().toISOString(),config:structuredClone(target.configuration)},...history];
    for(const app of target.customApps||[]){const index=state.customApps.findIndex((old:any)=>old.id===app.id);if(index<0)state.customApps.push(app);else state.customApps[index]=app;}
    const catalog=[...modules,...state.customApps];
    for(const [appId,entities] of Object.entries(project.demoRecords) as any[]){
      const definition=project.draft.appDefinitions[appId]||defaultDefinition(catalog.find((a:any)=>a.id===appId));
      for(const [entityId,records] of Object.entries(entities) as any[]){
        const entity=definition.entities.find((e:any)=>e.id===entityId);
        if(!entity&&records.length)fail(409,'Update conflicts with stored records: an entity would be removed.');
        for(const record of records){
          if(Object.keys(record.values).some(key=>!entity.fields.some((f:any)=>f.id===key)))fail(409,'Update conflicts with stored records: a field would be removed.');
          const scratch={draft:{apps:[appId]},demoRecords:{[appId]:{[entityId]:[structuredClone(record)]}},workflowLog:[]};
          let converted;try{converted=saveDemoRecord(scratch,appId,definition,entityId,record.values,record.id);}catch{fail(409,'Stored records do not satisfy the new model. Add required fields as optional first, populate them, then publish a later required-field version.');}
          for(const key of Object.keys(record.values))if(!isDeepStrictEqual(record.values[key],converted.values[key]))fail(409,'Update requires an explicit data conversion. Existing records were kept unchanged.');
        }
      }
    }
    return validateWorkspace(state,undefined,true);
  }
  manage(actor:Actor,id:string,input:any){return this.transaction(actor,async c=>{
    if(!['active','archived'].includes(input.status)||!Number.isSafeInteger(input.revision))fail(400,'Valid status and expected revision required.');
    await c.query('SELECT studio.lock_workspace_for_project($1)',[id]);
    const result=await c.query('UPDATE studio.projects SET status=$1 WHERE id=$2 AND revision=$3 RETURNING id,name,status,revision',[input.status,id,input.revision]);
    if(!result.rowCount)fail(409,'Project is unavailable, read-only or changed.');return result.rows[0];
  });}
}
