import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Post, Put, Patch, Param, Query, Req, Res, Inject, Module, HttpException, Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import express, { type Request, type Response as ExpressResponse } from 'express';
import { toNodeHandler } from 'better-auth/node';
import path from 'node:path';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Authentication, fail } from './authentication.js';
import { Workspace } from './workspace.js';
import { platformRoot, type Configuration } from './config.js';
import { DeliveredApplication,exportWebPackage } from './delivery.js';
import { Employees } from './employees.js';

export interface Services { authentication:Authentication; workspace:Workspace; config:Configuration; delivery:DeliveredApplication;employees:Employees; }
const id=(value:string)=>{if(!z.uuid().safeParse(value).success)fail(400,'Invalid record identifier.');return value;};
@Catch()
class SafeErrors implements ExceptionFilter {
  catch(error:any,host:ArgumentsHost){
    const res=host.switchToHttp().getResponse<ExpressResponse>();
    if(error instanceof HttpException){res.status(error.getStatus()).json(error.getResponse());return;}
    if(error instanceof z.ZodError){res.status(400).json({message:'Invalid request structure.'});return;}
    if(error.code==='23505'){res.status(409).json({message:'That record already exists.'});return;}
    if(error.code==='42501'){res.status(403).json({message:'This operation is not permitted.'});return;}
    if(error.code==='23503'){res.status(409).json({message:'A related record is missing or still in use.'});return;}
    console.error('An API operation failed. Sensitive diagnostics were suppressed.');
    res.status(500).json({message:'The operation could not be completed. No successful save is claimed.'});
  }
}
@Controller('api')
class ApiController {
  constructor(@Inject('services')private readonly s:Services){}
  private studio(){if(this.s.config.delivery)fail(403,'This is a delivered application, not internal Studio.');}
  @Get('info')info(){const branding=this.s.config.delivery?.configuration;return{mode:branding?'delivered':'studio',name:branding?.name||'Contigoo Studio',...(branding?{branding:{logo:branding.logo,color:branding.color,tagline:branding.tagline}}:{})};}
  @Get('health')async health(){try{await this.s.workspace.pool.query('SELECT id,revision FROM studio.workspace_settings WHERE false; SELECT id,revision FROM studio.app_records WHERE false');await this.s.authentication.pool.query('SELECT id,email FROM studio_auth.auth_users WHERE false; SELECT employee_code FROM studio.employees WHERE false; SELECT request_id FROM studio.action_events WHERE false');}catch{fail(503,'Database migrations or service permissions are not ready.');}return{status:'ok',...(this.s.config.environment==='development'&&process.env.CONTIGOO_INSTANCE_ID?{instanceId:process.env.CONTIGOO_INSTANCE_ID}:{})};}
  @Get('setup-status')async setupStatus(){const result=await this.s.authentication.pool.query("SELECT EXISTS(SELECT 1 FROM studio.principals WHERE kind='owner') AS ready");return{ownerExists:result.rows[0].ready};}
  @Post('setup')async setup(@Req()req:Request){
    await this.s.authentication.limited(`setup:${req.ip}`,10);
    if(!this.s.authentication.validSetupToken(req.headers['x-setup-token']))fail(403,'Use the protected owner setup link.');
    return this.s.authentication.provision(req.body,'owner');
  }
  @Post('login')async login(@Req()req:Request,@Res()res:ExpressResponse){
    const response=await this.s.authentication.login(req);
    for(const cookie of response.headers.getSetCookie())res.append('Set-Cookie',cookie);
    // Session tokens/password hashes are never returned in our JSON response.
    if(!response.ok){res.status(response.status===429?429:401).json({message:'Invalid credentials.'});return;}
    res.status(200).json({authenticated:true});
  }
  @Get('me')me(@Req()req:Request){return this.s.authentication.actor(req);}
  @Get('account/identifiers')async identifiers(@Req()req:Request){return this.s.authentication.identifiers(await this.s.authentication.actor(req));}
  @Patch('account/phone')async phone(@Req()req:Request){return this.s.authentication.changeOwnPhone(await this.s.authentication.owner(req),req.body);}
  @Post('activity')async activity(@Req()req:Request){
    this.studio();const actor=await this.s.authentication.actor(req);
    const event=z.object({action:z.enum(['view','workspace_export','quote_export']).default('view'),view:z.enum(['overview','clients','client','builder','project','manage','apps','designer']).optional(),projectId:z.uuid().optional(),clientId:z.uuid().optional()}).strict().refine(data=>data.action==='view'?!!data.view:!data.view).parse(req.body);
    if(actor.kind!=='owner'&&(event.action!=='view'||['project','designer','apps'].includes(event.view||'')))fail(403,'Studio development and exports are owner-only.');
    if(event.action==='quote_export'&&!event.projectId)fail(400,'Choose a project for quote export.');
    const projects=event.projectId||event.clientId?await this.s.workspace.projects(actor):[];
    if(event.projectId&&!projects.some(p=>p.id===event.projectId))fail(403,'Project access is not assigned.');
    if(event.clientId&&actor.kind!=='owner'&&!projects.some(p=>p.client_id===event.clientId))fail(403,'Client access is not assigned.');
    const action=event.action==='view'?`VIEW ${event.view}`:event.action==='quote_export'?'EXPORT quote':'EXPORT workspace';
    await this.s.authentication.pool.query('SELECT studio.record_action($1,$2,$3,$4,200,$5,$6,NULL)',[actor.id,actor.requestId,action,event.action==='view'?'VIEW':'EXPORT',event.projectId||null,event.clientId||null]);
    return{recorded:true};
  }
  @Get('workspace')async workspace(@Req()req:Request){this.studio();return this.s.workspace.load(await this.s.authentication.owner(req));}
  @Put('workspace')async save(@Req()req:Request){this.studio();return this.s.workspace.save(await this.s.authentication.owner(req),req.body);}
  @Post('workspace/import')async import(@Req()req:Request){this.studio();return this.s.workspace.import(await this.s.authentication.owner(req),req.body);}
  @Post('records/save')async record(@Req()req:Request){this.studio();return this.s.workspace.record(await this.s.authentication.owner(req),req.body);}
  @Post('records/delete')async deleteRecord(@Req()req:Request){this.studio();return this.s.workspace.record(await this.s.authentication.owner(req),req.body,true);}
  @Get('projects')async projects(@Req()req:Request){this.studio();return this.s.workspace.projects(await this.s.authentication.actor(req));}
  @Patch('projects/:id')async manage(@Req()req:Request,@Param('id')value:string){this.studio();return this.s.workspace.manage(await this.s.authentication.actor(req),id(value),req.body);}
  @Get('users')async users(@Req()req:Request){await this.s.authentication.owner(req);return this.s.authentication.users();}
  @Get('employees')async employees(@Req()req:Request){this.studio();await this.s.authentication.owner(req);return this.s.employees.list();}
  @Patch('employees/:id')async employee(@Req()req:Request,@Param('id')value:string){this.studio();return this.s.employees.update(await this.s.authentication.owner(req),id(value),req.body);}
  @Get('audit')async audit(@Req()req:Request,@Query()query:any){this.studio();return this.s.employees.audit(await this.s.authentication.owner(req),query);}
  @Post('users')async addUser(@Req()req:Request){const owner=await this.s.authentication.owner(req);if(this.s.config.delivery)await this.s.delivery.initialize(owner);return this.s.authentication.provision(req.body,'employee',owner);}
  @Patch('users/:id')async updateUser(@Req()req:Request,@Param('id')value:string){
    const owner=await this.s.authentication.owner(req);if(typeof req.body.active!=='boolean')fail(400,'Choose active or disabled.');
    await this.s.authentication.disable(id(value),req.body.active,owner);return{saved:true};
  }
  @Put('users/:id/assignments')async assignments(@Req()req:Request,@Param('id')value:string){
    const owner=await this.s.authentication.owner(req);id(value);
    const assignments=z.array(z.object({projectId:z.uuid(),canManage:z.boolean()}).strict()).max(1000).parse(req.body.assignments);
    const user=(await this.s.authentication.pool.query("SELECT id FROM studio.principals WHERE id=$1 AND kind='employee'",[value])).rows[0];
    if(!user)fail(404,'Employee not found.');
    const allowed=await this.s.workspace.projects(owner);
    if(assignments.some(a=>!allowed.some(p=>p.id===a.projectId)))fail(400,'Unknown project assignment.');
    const c=await this.s.authentication.pool.connect();
    try{await c.query('BEGIN');const previousAssignments=(await c.query('SELECT project_id FROM studio.project_assignments WHERE principal_id=$1',[value])).rows;await c.query('DELETE FROM studio.project_assignments WHERE principal_id=$1',[value]);
      for(const a of assignments)await c.query('INSERT INTO studio.project_assignments(principal_id,project_id,can_manage) VALUES($1,$2,$3)',[value,a.projectId,a.canManage]);
      await c.query('INSERT INTO studio_auth.security_events(actor_id,subject_id,action) VALUES($1,$2,$3)',[owner.id,value,'assignments_changed']);
      for(const assignment of assignments)await c.query('SELECT studio.record_action($1,$2,$3,$4,200,$5,NULL,$6)',[owner.id,owner.requestId,assignment.canManage?'ASSIGN project management':'ASSIGN project viewing','ASSIGN',assignment.projectId,value]);
      for(const removed of previousAssignments.filter(old=>!assignments.some(a=>a.projectId===old.project_id)))await c.query('SELECT studio.record_action($1,$2,$3,$4,200,$5,NULL,$6)',[owner.id,owner.requestId,'REVOKE project access','ASSIGN',removed.project_id,value]);
      await c.query('COMMIT');return{saved:true};
    }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
  @Get('projects/:id/package')async package(@Req()req:Request,@Param('id')value:string,@Query('version')version:string,@Res()res:ExpressResponse){
    this.studio();const owner=await this.s.authentication.owner(req);id(value);const number=Number(version);if(!Number.isSafeInteger(number)||number<1)fail(400,'Choose a saved version.');
    const buffer=await exportWebPackage(this.s.workspace,owner,value,number);res.type('application/zip').attachment(`contigoo-${value}-v${number}.zip`).send(buffer);
  }
  @Get('runtime')async runtime(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');return this.s.delivery.read(await this.s.authentication.actor(req));}
  @Post('runtime/initialize')async initializeRuntime(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');await this.s.delivery.initialize(await this.s.authentication.owner(req));return{initialized:true};}
  @Post('runtime/records')async runtimeRecord(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');return this.s.delivery.record(await this.s.authentication.actor(req),req.body);}
  @Post('runtime/records/delete')async runtimeDelete(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');return this.s.delivery.record(await this.s.authentication.actor(req),req.body,true);}
  @Get('runtime/updates')async runtimeUpdates(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');return this.s.delivery.review(await this.s.authentication.owner(req));}
  @Post('runtime/apply-version')async applyRuntimeVersion(@Req()req:Request){if(!this.s.config.delivery)fail(404,'No delivered application is configured.');return this.s.delivery.apply(await this.s.authentication.owner(req),req.body);}
}
@Module({})class PlatformModule{}
export async function createApplication(config:Configuration){
  const workspace=new Workspace(config);
  const authentication=new Authentication(config);
  const services:Services={authentication,workspace,config,delivery:new DeliveredApplication(config,workspace),employees:new Employees(authentication)};
  try{
    for(const pool of [workspace.pool,authentication.pool]){
      const permissions=(await pool.query(`SELECT r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls
        OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r.oid)
        OR EXISTS(SELECT 1 FROM pg_database WHERE datname=current_database() AND datdba=r.oid)
        OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relowner=r.oid AND n.nspname IN('studio','studio_auth')) AS elevated
        FROM pg_roles r WHERE r.rolname=current_user`)).rows[0];
      if(!permissions||permissions.elevated)throw new Error('Runtime connections must use dedicated restricted service roles.');
    }
  }catch(error){await authentication.pool.end();await workspace.pool.end();throw error;}
  const app=await NestFactory.create({module:PlatformModule,controllers:[ApiController],providers:[{provide:'services',useValue:services}]},{logger:false,bodyParser:false,abortOnError:false});
  const http=app.getHttpAdapter().getInstance();http.disable('x-powered-by');
  const auditTasks=new Set<Promise<void>>();
  // Remain loopback-bound by default. Trusted proxy hops must be explicitly configured at deployment.
  if(process.env.TRUST_PROXY_HOPS)http.set('trust proxy',Number(process.env.TRUST_PROXY_HOPS));
  http.use((req:Request,res:ExpressResponse,next:()=>void)=>{
    (req as any).auditRequestId=randomUUID();
    res.setHeader('X-Request-ID',(req as any).auditRequestId);
    if(req.path.startsWith('/api/')&&!['/api/health','/api/info','/api/setup-status'].includes(req.path))res.once('finish',()=>{
      const route=typeof req.route?.path==='string'?req.route.path:'unmatched-api';
      const safeRoute=/^[a-zA-Z0-9/:_-]{1,140}$/.test(route)?route:'unmatched-api';
      const uuid=(value:unknown)=>z.uuid().safeParse(value).success?value as string:null;
      const projectId=uuid(safeRoute.includes('/projects/:id')?req.params.id:req.body?.projectId||config.delivery?.projectId);
      const actor=(req as any).auditActor;
      const task=(async()=>{
        for(let attempt=0;attempt<3;attempt++)try{
          await authentication.pool.query('SELECT studio.record_action($1,$2,$3,$4,$5,$6,$7,$8)',[actor?.id||null,(req as any).auditRequestId,`${req.method} ${safeRoute}`,req.method,res.statusCode,projectId,uuid(req.body?.clientId),uuid(req.body?.recordId||req.params.id)]);return;
        }catch{if(attempt===2)console.error('Action audit persistence failed after retries. No sensitive request data was logged.');else await new Promise(resolve=>setTimeout(resolve,100*(attempt+1)));}
      })();auditTasks.add(task);void task.finally(()=>auditTasks.delete(task));
    });
    res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});
    if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.path.startsWith('/api/')&&req.headers.origin!==config.origin){res.status(403).json({message:'A same-origin request is required.'});return;}
    next();
  });
  const handler=toNodeHandler(services.authentication.auth);
  for(const route of ['sign-out','change-password','revoke-sessions'])http.all(`/api/auth/${route}`,async(req:Request,res:ExpressResponse)=>{try{await authentication.actor(req);}catch{res.status(401).json({message:'Sign in to this application first.'});return;}await handler(req,res);});
  http.use(express.json({limit:'12mb',strict:true}));
  http.use((error:any,_req:Request,res:ExpressResponse,_next:unknown)=>{
    res.status(error?.status===413?413:400).json({message:error?.status===413?'Request is too large.':'Invalid request payload.'});
  });
  http.use((req:Request,res:ExpressResponse,next:()=>void)=>{if(req.path.startsWith('/api/')&&['POST','PUT','PATCH'].includes(req.method)&&(!req.body||typeof req.body!=='object'||Array.isArray(req.body))){res.status(400).json({message:'A JSON object request body is required.'});return;}next();});
  const prototypeRoot=path.resolve(platformRoot,'../prototype');
  const assets=new Map<string,string>([
    ['/',path.join(platformRoot,'web/index.html')],['/setup',path.join(platformRoot,'web/index.html')],
    ['/entry.mjs',path.join(platformRoot,config.delivery?'web/runtime.mjs':'web/entry.mjs')],['/connected.css',path.join(platformRoot,'web/connected.css')],
  ]);
  for(const name of ['model.mjs','builder-model.mjs','styles.css','studio.css',...(!config.delivery?['app.mjs','studio-ui.mjs']:[])])assets.set(`/${name}`,path.join(prototypeRoot,name));
  for(const name of ['logo.png','inter.woff2','fraunces.woff2'])assets.set(`/assets/${name}`,path.join(prototypeRoot,'assets',name));
  for(const [route,file]of assets)http.get(route,(_req:Request,res:ExpressResponse)=>res.sendFile(file));
  app.useGlobalFilters(new SafeErrors());await app.init();
  return {app,services,close:async()=>{await app.close();await Promise.allSettled(auditTasks);await services.authentication.pool.end();await services.workspace.pool.end();}};
}
