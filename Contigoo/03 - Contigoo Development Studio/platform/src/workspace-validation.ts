import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
import { modules, initialState, saveClientProfile, updateProjectDetails, publicationHistory } from '../../prototype/model.mjs';
import { enhanceState, quoteFor, defaultDefinition, saveDemoRecord,validateFieldValue } from '../../prototype/builder-model.mjs';
import { fail } from './authentication.js';

const key = z.string().min(1).max(150).regex(/^[a-zA-Z0-9_.-]+$/).refine(s => !['__proto__','prototype','constructor'].includes(s));
const uuid=z.uuid().transform(value=>value.toLowerCase());
const text = (length: number) => z.string().max(length);
const value = z.union([text(20000), z.number().finite(), z.boolean()]);
export function validateRecordValues(input:unknown){const result=z.record(key,value).safeParse(input);if(!result.success)fail(400,'Record values must use supported scalar types and text limits.');return result.data!;}
const field = z.object({ id: key, label: text(80).min(1), type: z.enum(['Text','Number','Date','Email','Choice','Yes / No']),
  required: z.boolean(), visible: z.boolean().optional(), options: z.array(text(200)).max(100).optional() }).strict();
const entity = z.object({ id: key, name: text(80).min(1), fields: z.array(field).min(1).max(100) }).strict();
const definition = z.object({ name: text(80).min(1), entities: z.array(entity).min(1).max(50),
  pages: z.array(z.object({ id:key, name:text(80).min(1), kind:z.enum(['Dashboard','List','Form','Content']), entityId:key, body:text(2000) }).strict()).min(1).max(100),
  workflows: z.array(z.object({id:key,name:text(80).min(1),entityId:key,conditionField:text(150),conditionValue:text(2000),action:z.enum(['set','note']),targetField:text(150),value,enabled:z.boolean()}).strict()).max(100) }).strict();
const price = z.object({monthly:z.number().int().min(0).max(999999999),setup:z.number().int().min(0).max(999999999)}).strict();
const draft = z.object({ name:text(120).min(1),color:z.string().regex(/^#[0-9a-f]{6}$/i),logo:text(1500000).refine(s => !s || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(s)),tagline:text(500),
  apps:z.array(key).max(100),entities:z.array(text(80).min(1)).max(100),
  fields:z.array(z.object({id:key,entity:text(80),label:text(80),type:z.enum(['Text','Number','Date','Email','Choice','Yes / No']),required:z.boolean()}).strict()).max(500),
  role:z.enum(['Administrator','Member','Viewer']), appDefinitions:z.record(key,definition),
  quote:z.object({currency:z.literal('EGP'),baseMonthly:z.number().int().min(0),baseSetup:z.number().int().min(0),discountPercent:z.number().min(0).max(100),prices:z.record(key,price)}).strict(),
}).strict();
const record = z.object({ id:uuid,values:z.record(key,value) }).strict();
const project = z.object({ id:uuid,clientId:uuid,name:text(60).min(1),description:text(500),template:key,industry:text(120),
  draft,published:draft.nullable(),version:z.number().int().min(0).max(2147483647),dirty:z.boolean(),archived:z.boolean().optional(),
  publications:z.array(z.object({version:z.number().int().positive().max(2147483647),publishedAt:z.string().datetime().nullable(),config:draft}).strict()).max(1000).optional(),
  demoRecords:z.record(key,z.record(key,z.array(record).max(10000))),
  workflowLog:z.array(z.object({appId:key,entityId:key,recordId:uuid,note:text(2000)}).strict()).max(10000),
}).strict();
const schema = z.object({schema:z.literal(1),builderVersion:z.literal(2),directoryVersion:z.literal(1),
  clientProfiles:z.array(z.object({id:uuid,name:text(60),industry:text(60),contact:text(80),email:text(120),phone:text(40),address:text(240),notes:text(2000)}).strict()).max(5000),
  clients:z.array(project).max(1000),
  customApps:z.array(z.object({id:key,name:text(60),icon:z.literal('code'),category:z.literal('Custom'),color:z.literal('lilac'),description:text(200),custom:z.literal(true),templateDefinition:definition}).strict()).max(200),
  priceBook:z.record(key,price),activity:z.array(z.object({title:text(200),detail:text(1000)}).strict()).max(8),
}).strict();
function unique(values: string[]) { if (new Set(values).size !== values.length) fail(400, 'Duplicate identifiers are not allowed.'); }
function validateDefinition(d: any) {
  unique(d.entities.map((e:any)=>e.id)); unique(d.pages.map((p:any)=>p.id)); unique(d.workflows.map((w:any)=>w.id));
  if(!d.name.trim())fail(400,'App names cannot be blank.');
  for (const e of d.entities) { if(!e.name.trim())fail(400,'Entity names cannot be blank.');unique(e.fields.map((f:any)=>f.id)); for (const f of e.fields) {
    if(!f.label.trim())fail(400,'Field labels cannot be blank.');
    if(f.required&&f.visible===false)fail(400,'Required fields must be visible.');
    if (f.type==='Choice' && (!f.options?.length||f.options.some((option:string)=>!option.trim()||option!==option.trim())||new Set(f.options).size!==f.options.length)) fail(400,'Choice fields require unique non-empty options.');
  } }
  for (const p of d.pages) if (!d.entities.some((e:any)=>e.id===p.entityId)) fail(400,'Page entity reference is invalid.');
  for (const w of d.workflows) {
    const e=d.entities.find((e:any)=>e.id===w.entityId);
    if (!e || (w.conditionField && !e.fields.some((f:any)=>f.id===w.conditionField)) || (w.action==='set' && !e.fields.some((f:any)=>f.id===w.targetField))) fail(400,'Workflow field/entity reference is invalid.');
    if(w.action==='note'&&(typeof w.value!=='string'||!w.value.trim()||w.value.length>2000))fail(400,'Workflow notes must be non-empty text of at most 2000 characters.');
    if(w.action==='set')try{validateFieldValue(e.fields.find((f:any)=>f.id===w.targetField),w.value);}catch{fail(400,'Workflow value is invalid for its target field.');}
  }
}
export function emptyWorkspace() { return enhanceState(initialState()); }
export function validateWorkspace(input: unknown, previous?: any, imported=false): any {
  const parsed=schema.safeParse(input);
  if (!parsed.success) fail(400,`Invalid workspace structure at ${parsed.error.issues[0]?.path.join('.') || 'root'}.`);
  const state=parsed.data!;
  unique(state.clientProfiles.map(c=>c.id)); unique(state.clients.map(p=>p.id)); unique(state.customApps.map(a=>a.id));
  const catalog=[...modules,...state.customApps]; unique(catalog.map((a:any)=>a.id));
  for (const app of state.customApps) validateDefinition(app.templateDefinition);
  const clientCheck=initialState(); for (const c of state.clientProfiles) saveClientProfile(clientCheck,c);
  for (const p of state.clients) {
    if (!state.clientProfiles.some(c=>c.id===p.clientId)) fail(400,'Project client does not exist.');
    updateProjectDetails({},p); unique(p.draft.apps); unique(p.draft.entities);
    for (const config of [p.draft,...publicationHistory(p).map((v:any)=>v.config)]) {
      quoteFor(config);
      if (config.apps.some((id:string)=>!catalog.some((a:any)=>a.id===id))) fail(400,'Project contains an unknown app.');
      for (const d of Object.values(config.appDefinitions)) validateDefinition(d);
      if (config.fields.some((f:any)=>!config.entities.includes(f.entity))) fail(400,'Shared field entity is missing.');
    }
    const old=previous?.clients.find((item:any)=>item.id===p.id);
    if (old && old.clientId!==p.clientId) fail(400,'Project ownership cannot be changed through workspace updates.');
    if (previous && !imported) {
      if (!isDeepStrictEqual(p.demoRecords,old?.demoRecords || {})) fail(400,'Use the record API for record changes.');
      if (!isDeepStrictEqual(p.workflowLog,old?.workflowLog || [])) fail(400,'Workflow events are server-owned.');
      const oldHistory=old ? publicationHistory(old):[]; const nextHistory=publicationHistory(p);
      if(p.version===0?p.published!==null:!isDeepStrictEqual(p.published,nextHistory.find((v:any)=>v.version===p.version)?.config))fail(409,'The latest saved snapshot must match its immutable version.');
      for (const v of oldHistory) if (!isDeepStrictEqual(v,nextHistory.find((n:any)=>n.version===v.version))) fail(409,'Saved versions are immutable.');
      const additions=nextHistory.filter((n:any)=>!oldHistory.some((o:any)=>o.version===n.version));
      if (p.version!==(old?.version||0)+additions.length || additions.length>1) fail(400,'Invalid publication sequence.');
      if (additions.length && (!p.draft.apps.length || !isDeepStrictEqual(additions[0].config,p.draft) || !isDeepStrictEqual(p.published,p.draft))) fail(400,'A saved version must match the current draft.');
      if(additions.length&&p.draft.apps.some(id=>!p.draft.appDefinitions[id]))fail(400,'Save the complete definitions of selected apps before publishing.');
      if(additions.length&&p.draft.apps.some(id=>!p.draft.quote.prices[id]))fail(400,'Save explicit prices for selected apps before publishing.');
      if(old?.archived&&p.archived&&(!isDeepStrictEqual(p.draft,old.draft)||additions.length))fail(409,'Reactivate the project before editing or saving a version.');
    }
    for (const [appId,entities] of Object.entries(p.demoRecords)) {
      const app=catalog.find((a:any)=>a.id===appId); if (!app) fail(400,'Record app does not exist.');
      const d=p.draft.appDefinitions[appId] || defaultDefinition(app);
      for (const [entityId,records] of Object.entries(entities)) {
        unique(records.map(r=>r.id));
        if (!d.entities.some((e:any)=>e.id===entityId)) fail(400,'Record entity does not exist.');
        if (imported) for (const r of records) {
          const scratch={draft:{apps:[appId]},demoRecords:{[appId]:{[entityId]:[r]}},workflowLog:[]};
          saveDemoRecord(scratch,appId,d,entityId,r.values,r.id);
        }
      }
    }
  }
  return state;
}
export function normalizeImport(input:any) {
  if (!input || input.schema!==1 || !Array.isArray(input.clients)) fail(400,'Unsupported workspace export.');
  if((input.builderVersion!==undefined&&![1,2].includes(input.builderVersion))||(input.directoryVersion!==undefined&&input.directoryVersion!==1))fail(400,'Unsupported workspace export version; the source data was not changed.');
  const state=enhanceState(structuredClone(input)); const map=new Map<string,string>();
  const mapped=(id:string)=>{ if(!map.has(id)) map.set(id,z.uuid().safeParse(id).success?id.toLowerCase():randomUUID()); return map.get(id)!; };
  for(const c of state.clientProfiles)c.id=mapped(c.id);
  for(const p of state.clients){ p.id=mapped(p.id);p.clientId=mapped(p.clientId);
    for(const entities of Object.values(p.demoRecords) as any[])for(const records of Object.values(entities) as any[])for(const r of records)r.id=mapped(r.id);
    for(const event of p.workflowLog)event.recordId=mapped(event.recordId);
  }
  return validateWorkspace(state,undefined,true);
}
