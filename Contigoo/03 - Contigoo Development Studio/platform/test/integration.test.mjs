import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { loadConfig } from '../dist/config.js';
import { createApplication } from '../dist/server.js';
import { serviceSettings, settingsFor, connect } from '../../database/hosted.mjs';
import { initialState, saveClientProfile, createProject, toggleApp, publishClient } from '../../prototype/model.mjs';
import { enhanceState, definitionFor, addWorkflow,saveDemoRecord,defaultDefinition } from '../../prototype/builder-model.mjs';
import { unzipSync,strFromU8 } from 'fflate';
import { deliveredEnvironment } from './delivered-environment.mjs';
import { verifyPackedRuntime } from './package-portability.mjs';

test('Real hosted authentication, API persistence, authorization and existing Studio browser flow', {timeout:360000}, async()=>{
  const reservation=createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  process.env.APP_ORIGIN=`http://127.0.0.1:${port}`;
  const config=await loadConfig('test');const database=await serviceSettings();const admin=await connect(settingsFor(database,'test','migrator'));
  config.authSecret=randomBytes(48).toString('base64url');
  assert.equal(config.appDatabase.database,'contigoo_studio_test');
  const before=await admin.query('SELECT (SELECT count(*) FROM studio.principals)+(SELECT count(*) FROM studio.clients) AS total');
  assert.equal(Number(before.rows[0].total),0,'Refusing to run against a populated test workspace.');
  const initialSettings=(await admin.query('SELECT configuration,revision FROM studio.workspace_settings WHERE id=1')).rows[0];
  const initialSecurityEvents=(await admin.query('SELECT coalesce(max(id),0) AS id FROM studio_auth.security_events')).rows[0].id;
  const runtime=await createApplication(config);await runtime.app.listen(port,'127.0.0.1');
  const completed=[];const identities=[];const run=randomUUID().slice(0,8);const password=randomBytes(24).toString('base64url');
  const owner={name:`Synthetic owner ${run}`,username:`qa_${run}`,email:`qa-${run}@example.invalid`,phone:'+12025550123',password};
  let cookie='';let browser;let success=false;const requestIds=new Set();
  async function api(route,method='GET',body,options={}){
    const response=await fetch(config.origin+route,{method,headers:{Origin:options.origin||config.origin,...(body?{'Content-Type':'application/json'}:{}),...(options.cookie!==undefined?{Cookie:options.cookie}:cookie?{Cookie:cookie}:{}),...options.headers},...(body?{body:JSON.stringify(body)}:{})});
    if(response.headers.get('x-request-id'))requestIds.add(response.headers.get('x-request-id'));
    const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={message:'Non-JSON response'};}
    return{status:response.status,data,cookies:response.headers.getSetCookie()};
  }
  const passed=name=>{completed.push(name);console.log(`PASS: ${name}`);};
  const ok=(r,expected=200)=>{assert.equal(r.status,expected,`API status mismatch: ${r.data?.message||'response withheld'}`);return r.data;};
  try{
    assert.equal((await api('/api/workspace')).status,401);passed('Unauthenticated workspace access rejected');
    assert.equal((await api('/api/setup','POST',owner,{headers:{'X-Setup-Token':'invalid'}})).status,403);
    const created=ok(await api('/api/setup','POST',owner,{headers:{'X-Setup-Token':config.bootstrapToken}}),201);identities.push(created.id);
    assert.equal((await api('/api/setup','POST',owner,{headers:{'X-Setup-Token':config.bootstrapToken}})).status,409);passed('Protected sole-owner bootstrap and second-owner rejection');
    assert.equal((await api('/api/auth/sign-up/email','POST',owner)).status,404);passed('Public registration endpoint absent');
    const invalid=await api('/api/login','POST',{identifier:owner.username,password:randomBytes(20).toString('hex')});assert.equal(invalid.status,401);
    for(const identifier of [owner.username.toUpperCase(),owner.email.toUpperCase(),'+1 (202) 555-0123']){
      const login=await api('/api/login','POST',{identifier,password});ok(login);assert(login.cookies.some(c=>/httponly/i.test(c)));cookie=login.cookies.map(c=>c.split(';')[0]).join('; ');
      assert.equal(ok(await api('/api/me')).id,created.id);
    }
    passed('Username/email/normalized phone resolve to one password-backed account with HttpOnly sessions');
    assert.equal((await api('/api/users','POST',{name:'Synthetic collision',username:`collision_${run}`,email:`collision-${run}@example.invalid`,phone:owner.phone,password:randomBytes(24).toString('base64url')})).status,409);
    passed('A normalized phone login identifier cannot be assigned to two accounts');
    assert.equal((await api('/api/login','POST',{identifier:`unknown_${run}`,password})).status,401);
    assert.equal((await api('/api/workspace','PUT',{}, {origin:'https://untrusted.example.invalid'})).status,403);passed('Cross-origin mutation rejected');
    let loaded=ok(await api('/api/workspace'));
    const legacy=enhanceState(initialState());const legacyClient=saveClientProfile(legacy,{name:'Synthetic imported client'});legacyClient.id='legacy-client';
    const legacyProject=createProject(legacy,{clientId:legacyClient.id,name:'Synthetic imported solution'});legacyProject.id='legacy-project';enhanceState(legacy);toggleApp(legacyProject,'crm');const legacyDefinition=definitionFor(legacy,legacyProject,'crm');
    saveDemoRecord(legacyProject,'crm',legacyDefinition,'records',{name:'Synthetic retained record',status:'New'}).id='legacy-record';
    loaded=ok(await api('/api/workspace/import','POST',{revision:loaded.revision,confirm:true,state:legacy}),201);
    assert.equal(loaded.state.clients[0].demoRecords.crm.records[0].values.name,'Synthetic retained record');assert.notEqual(loaded.state.clients[0].id,'legacy-project');assert.equal(legacy.clients[0].id,'legacy-project');
    passed('Explicit browser-workspace import preserves records and maps legacy identifiers without mutating the export');
    const state=loaded.state;
    const client=saveClientProfile(state,{name:`Synthetic API client ${run}`});const p=createProject(state,{clientId:client.id,name:'Synthetic API project',templateId:'blank'});enhanceState(state);
    toggleApp(p,'crm');const definition=definitionFor(state,p,'crm');
    addWorkflow(definition,{entityId:'records',name:'Server rule',action:'set',targetField:'status',value:'Complete'});
    loaded=ok(await api('/api/workspace','PUT',{revision:loaded.revision,state}));passed('Client/project/schema writes persist through the API');
    assert.equal((await api('/api/workspace','PUT',{revision:loaded.revision-1,state:loaded.state})).status,409);passed('Stale workspace revision cannot overwrite another session');
    assert.equal((await api('/api/records/save','POST',{revision:loaded.revision,projectId:p.id,appId:'crm',entityId:'records',values:{status:'New'}})).status,400);
    assert.equal((await api('/api/records/save','POST',{revision:loaded.revision,projectId:p.id,appId:'crm',entityId:'records',values:{name:'Record',status:'New',unknown:'value'}})).status,400);
    loaded=ok(await api('/api/records/save','POST',{revision:loaded.revision,projectId:p.id,appId:'crm',entityId:'records',values:{name:'Synthetic record',status:'New'}}),201);
    assert.equal(loaded.state.clients.find(project=>project.id===p.id).demoRecords.crm.records[0].values.status,'Complete');passed('Record validation and on-create rules execute on the server');
    publishClient(loaded.state.clients.find(project=>project.id===p.id));loaded=ok(await api('/api/workspace','PUT',{revision:loaded.revision,state:loaded.state}));
    const forged=structuredClone(loaded.state);forged.clients.find(project=>project.id===p.id).publications[0].config.name='Forged history';
    assert.equal((await api('/api/workspace','PUT',{revision:loaded.revision,state:forged})).status,409);passed('Published configuration/quote snapshots cannot be rewritten');
    const caseVariant=structuredClone(loaded.state);for(const row of caseVariant.clientProfiles)row.id=row.id.toUpperCase();for(const project of caseVariant.clients){project.id=project.id.toUpperCase();project.clientId=project.clientId.toUpperCase();}
    loaded=ok(await api('/api/workspace','PUT',{revision:loaded.revision,state:caseVariant}));assert.equal(loaded.state.clients.find(project=>project.id===p.id).demoRecords.crm.records.length,1);passed('UUID casing is normalized without replacing projects or losing records');
    const employee=ok(await api('/api/users','POST',{name:'Synthetic employee',username:`emp_${run}`,email:`emp-${run}@example.invalid`,password:randomBytes(24).toString('hex')}),201);identities.push(employee.id);
    const employeePassword=randomBytes(24).toString('base64url');
    const second=ok(await api('/api/users','POST',{name:'Synthetic employee session',username:`ops_${run}`,email:`ops-${run}@example.invalid`,password:employeePassword}),201);identities.push(second.id);
    const employeeLogin=await api('/api/login','POST',{identifier:`ops_${run}`,password:employeePassword});ok(employeeLogin);const employeeCookie=employeeLogin.cookies.map(c=>c.split(';')[0]).join('; ');
    assert.equal((await api('/api/users','GET',undefined,{cookie:employeeCookie})).status,403);
    assert.equal((await api('/api/workspace','GET',undefined,{cookie:employeeCookie})).status,403);
    assert.equal(ok(await api('/api/projects','GET',undefined,{cookie:employeeCookie})).length,0);
    ok(await api(`/api/users/${second.id}/assignments`,'PUT',{assignments:[{projectId:p.id,canManage:true}]}));
    assert.equal(ok(await api('/api/projects','GET',undefined,{cookie:employeeCookie})).length,1);
    assert.equal((await api('/api/employees','GET',undefined,{cookie:employeeCookie})).status,403);
    assert.equal((await api('/api/audit','GET',undefined,{cookie:employeeCookie})).status,403);
    const employeeProfile=ok(await api('/api/employees')).find(e=>e.principal_id===second.id);assert(employeeProfile.employee_code.startsWith('EMP-'));
    const employeeCode=`EMP-${run.toUpperCase()}`;
    ok(await api(`/api/employees/${second.id}`,'PATCH',{employeeCode,name:'Synthetic referenced employee',department:'Operations',jobTitle:'Project coordinator',notes:'Synthetic profile only',revision:Number(employeeProfile.revision)}));
    const staleView=ok(await api('/api/workspace'));
    const assigned=ok(await api('/api/projects','GET',undefined,{cookie:employeeCookie}))[0];
    ok(await api(`/api/projects/${p.id}`,'PATCH',{status:'archived',revision:Number(assigned.revision)},{cookie:employeeCookie}));
    assert.equal((await api('/api/workspace','PUT',staleView)).status,409);
    const currentProject=ok(await api('/api/projects')).find(project=>project.id===p.id);ok(await api(`/api/projects/${p.id}`,'PATCH',{status:'active',revision:Number(currentProject.revision)}));
    let events=[];for(let i=0;i<10;i++){events=ok(await api(`/api/audit?employeeId=${second.id}&projectId=${p.id}`)).events;if(events.some(e=>e.action==='UPDATE'&&e.employee_code===employeeCode)&&events.some(e=>e.source==='request'&&e.action.includes('PATCH')))break;await new Promise(resolve=>setTimeout(resolve,100));}
    assert(events.some(e=>e.action==='UPDATE'&&e.employee_code===employeeCode&&e.project_name==='Synthetic API project'&&e.client_name===client.name));
    assert(events.some(e=>e.source==='request'&&e.status===200));
    const auditText=JSON.stringify(events);assert(!auditText.includes(password));assert(!auditText.includes(employeePassword));
    await assert.rejects(()=>runtime.services.authentication.pool.query('DELETE FROM studio.action_events'),error=>error.code==='42501');
    passed('Employee references/profiles and project-linked audit are owner-only and cannot be erased by runtime roles');
    ok(await api(`/api/users/${second.id}`,'PATCH',{active:false}));
    assert.equal((await api('/api/projects','GET',undefined,{cookie:employeeCookie})).status,401);passed('Employee authorization, assignment isolation and immediate revocation');
    assert.equal((await api('/api/workspace/import','POST',{revision:loaded.revision,confirm:true,state:loaded.state})).status,409);passed('Import refuses to overwrite existing server work');
    const require=createRequire(new URL('../../prototype/package.json',import.meta.url));const puppeteer=require('puppeteer-core');
    browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
    const page=await browser.newPage();await page.setViewport({width:1440,height:900});const errors=[];page.on('pageerror',error=>errors.push(error.name));page.on('response',response=>{const id=response.headers()['x-request-id'];if(id)requestIds.add(id);});
    await page.goto(config.origin,{waitUntil:'networkidle0'});
    await page.type('[name=identifier]',owner.username);await page.type('[name=password]',password);
    await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('#auth-form button')]);
    await page.waitForSelector('.hero-panel');assert(await page.$('.studio-center'));
    await page.click('[data-nav=clients]');await page.click('[data-action=new-client]');await page.type('#client-name',`Synthetic browser client ${run}`);await page.click('#client-details-form [type=submit]');
    await page.waitForSelector('.client-detail-panel');await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.hero-panel');
    await page.click('[data-nav=clients]');assert((await page.$eval('#content',n=>n.textContent)).includes(`Synthetic browser client ${run}`));
    assert.deepEqual(errors,[]);passed('Existing branded Studio login/create-client/reload journey persists in hosted PostgreSQL');
    await page.click('[data-connected-view=employees]');await page.waitForSelector(`[data-edit-employee="${second.id}"]`);await page.click(`[data-edit-employee="${second.id}"]`);await page.waitForSelector('#employee-profile-form');
    await page.$eval('#employee-profile-form [name=jobTitle]',node=>{node.value='Synthetic team lead';});await page.click('#employee-profile-form button');
    await page.waitForFunction(()=>document.querySelector('#dialog').textContent.includes('Synthetic team lead'));await page.click('#close-account-dialog');
    await page.click('[data-connected-view=audit]');await page.waitForSelector('#audit-filter');await page.select('#audit-filter [name=employeeId]',second.id);await page.select('#audit-filter [name=projectId]',p.id);await page.click('#audit-filter button');
    await page.waitForFunction(id=>document.querySelector('#dialog').dataset.auditQuery?.includes(`employeeId=${id}`),{},second.id);
    await page.waitForFunction(code=>document.querySelector('#dialog tbody')?.textContent.includes(code),{},employeeCode);
    assert((await page.$eval('#dialog tbody',n=>n.textContent)).includes('Synthetic API project'));await page.click('#close-account-dialog');
    passed('Employees profile editing and employee/project audit filtering work in the browser');
    const browserState=ok(await api('/api/workspace')).state;const browserClient=browserState.clientProfiles.find(c=>c.name===`Synthetic browser client ${run}`);
    await page.click(`[data-new-project-for="${browserClient.id}"]`);await page.waitForSelector('#new-project-name');await page.type('#new-project-name','Synthetic browser solution');await page.click('#new-project-form [type=submit]');
    await page.waitForSelector('#publish-button');await page.click('[data-toggle-app=management]');await page.waitForSelector('[data-toggle-app=management][aria-pressed=true]');
    await page.click('[data-edit-app=management]');await page.waitForSelector('#app-field-form');await page.type('#app-field-label','Budget');await page.select('#app-field-type','Number');await page.click('#app-field-required');await page.click('#app-field-form [type=submit]');
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-field-label]')].some(n=>n.value==='Budget'));
    await page.click('[data-run-app=management]');await page.waitForSelector('.runtime-nav');await page.click('[data-runtime-page=form]');await page.type('#record-name','Synthetic browser request');await page.select('#record-status','New');
    const budget=await page.$$eval('#runtime-record-form label',nodes=>nodes.find(n=>n.textContent.includes('Budget')).querySelector('input').id);await page.type(`#${budget}`,'125');await page.click('#runtime-record-form [type=submit]');
    await page.waitForFunction(()=>document.querySelector('.runtime-table')?.textContent.includes('Synthetic browser request'));
    await page.click('#dialog [data-action=close-dialog]');await page.click('[data-nav=project]');await page.waitForSelector('#publish-button');await page.click('#publish-button');
    await page.waitForSelector('[data-preview-mode=published]');
    const persisted=ok(await api('/api/workspace')).state.clients.find(p=>p.name==='Synthetic browser solution');assert.equal(persisted.version,1);assert.equal(persisted.demoRecords.management.records.length,1);assert.equal(Object.values(persisted.demoRecords.management.records[0].values).includes(125),true);
    passed('Existing visual field editor, typed record form and saved publication persist end to end');
    await page.click('[data-nav=clients]');await page.click('[data-action=new-client]');await page.type('#client-name',`Synthetic retry client ${run}`);
    await page.setRequestInterception(true);let failSave=true;
    const intercept=request=>{if(failSave&&request.method()==='PUT'&&request.url().endsWith('/api/workspace')){failSave=false;return request.respond({status:503,contentType:'application/json',body:JSON.stringify({message:'Synthetic unavailable database; retry.'})});}return request.continue();};
    page.on('request',intercept);await page.click('#client-details-form [type=submit]');await page.waitForFunction(()=>document.querySelector('#client-details-form .form-error')?.textContent.includes('Synthetic'));
    assert.equal(ok(await api('/api/workspace')).state.clientProfiles.filter(c=>c.name===`Synthetic retry client ${run}`).length,0);
    await page.click('#client-details-form [type=submit]');await page.waitForSelector('.client-detail-panel');
    assert.equal(ok(await api('/api/workspace')).state.clientProfiles.filter(c=>c.name===`Synthetic retry client ${run}`).length,1);
    await page.setRequestInterception(false);page.off('request',intercept);assert.deepEqual(errors,[]);passed('Failed backend save preserves the form and retries without duplicate records');
    const archiveResponse=await fetch(`${config.origin}/api/projects/${p.id}/package?version=1`,{headers:{Cookie:cookie}});assert.equal(archiveResponse.status,200);
    const archive=unzipSync(new Uint8Array(await archiveResponse.arrayBuffer()));
    assert(Object.keys(archive).every(name=>!name.includes('.private')&&!name.includes('node_modules')&&!name.includes('/test/')));
    assert(archive['database/migration-core.mjs']);assert(archive['platform/dist/main.js']);assert(archive['platform/web/runtime.mjs']);
    for(const bytes of Object.values(archive)){const text=strFromU8(bytes);assert(!text.includes(config.authSecret));assert(!text.includes(config.appDatabase.password));assert(!text.includes(config.appDatabase.host));}
    const manifest=JSON.parse(strFromU8(archive['delivery.json']));assert.equal(manifest.version,1);assert.equal(manifest.projectId,p.id);assert(!('demoRecords'in manifest));
    passed('Standalone web package includes runtime/migrations/model without private secrets or data');
    const deliveredDB=await deliveredEnvironment();let delivered;
    try{
      const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const runtimePort=socket.address().port;await new Promise(resolve=>socket.close(resolve));
      const deliveryConfig={...config,...deliveredDB,origin:`http://127.0.0.1:${runtimePort}`,port:runtimePort,
        authSecret:randomBytes(48).toString('base64url'),bootstrapToken:randomBytes(32).toString('base64url'),delivery:manifest};
      delivered=await createApplication(deliveryConfig);await delivered.app.listen(runtimePort,'127.0.0.1');let appCookie='';
      async function deliveredApi(route,method='GET',body,overrides={}){
        const response=await fetch(deliveryConfig.origin+route,{method,headers:{Origin:deliveryConfig.origin,Cookie:appCookie,...(body?{'Content-Type':'application/json'}:{}),...overrides},...(body?{body:JSON.stringify(body)}:{})});
        return{status:response.status,data:await response.json(),cookies:response.headers.getSetCookie()};
      }
      assert.equal((await deliveredApi('/api/me','GET',undefined,{Cookie:cookie})).status,401);
      const deliveredPassword=randomBytes(24).toString('base64url');
      ok(await deliveredApi('/api/setup','POST',{...owner,password:deliveredPassword},{'X-Setup-Token':deliveryConfig.bootstrapToken}),201);
      assert.equal((await deliveredApi('/api/login','POST',{identifier:owner.username,password})).status,401);
      const deliveryLogin=await deliveredApi('/api/login','POST',{identifier:owner.username,password:deliveredPassword});ok(deliveryLogin);appCookie=deliveryLogin.cookies.map(c=>c.split(';')[0]).join('; ');
      ok(await deliveredApi('/api/runtime/initialize','POST',{}),201);const runtimeData=ok(await deliveredApi('/api/runtime'));assert.equal(runtimeData.records.length,0);
      assert.equal((await deliveredApi('/api/workspace')).status,403);
      passed('Delivered application has its own database, credentials and no internal Studio API access');
      const runtimePage=await browser.newPage();await runtimePage.goto(deliveryConfig.origin,{waitUntil:'networkidle0'});await runtimePage.type('[name=identifier]',owner.username);await runtimePage.type('[name=password]',deliveredPassword);
      await Promise.all([runtimePage.waitForNavigation({waitUntil:'networkidle0'}),runtimePage.click('#access-form button')]);
      await runtimePage.waitForSelector('[data-page=form]');await runtimePage.click('[data-page=form]');await runtimePage.waitForSelector('#record-form [name=name]');await runtimePage.type('#record-form [name=name]','Synthetic delivered record');await runtimePage.select('#record-form [name=status]','New');await runtimePage.click('#record-form button');
      await runtimePage.waitForFunction(()=>document.querySelector('.runtime-table')?.textContent.includes('Synthetic delivered record'));await runtimePage.reload({waitUntil:'networkidle0'});
      const savedRecord=ok(await deliveredApi('/api/runtime')).records[0];assert.equal(savedRecord.values.status,'Complete');
      assert.equal((await deliveredApi('/api/runtime/records','POST',{appId:'crm',entityId:'records',recordId:savedRecord.id,expectedRevision:0,values:savedRecord.values})).status,409);
      passed('Delivered visual runtime form persists records, runs rules and rejects stale updates');
      const viewerPassword=randomBytes(24).toString('base64url');ok(await deliveredApi('/api/users','POST',{name:'Synthetic delivered viewer',username:`view_${run}`,email:`view-${run}@example.invalid`,password:viewerPassword,writeAccess:false}),201);
      const viewerLogin=await deliveredApi('/api/login','POST',{identifier:`view_${run}`,password:viewerPassword});ok(viewerLogin);const viewerCookie=viewerLogin.cookies.map(c=>c.split(';')[0]).join('; ');
      assert.equal(ok(await deliveredApi('/api/runtime','GET',undefined,{Cookie:viewerCookie})).canWrite,false);
      assert.equal((await deliveredApi('/api/runtime/records','POST',{appId:'crm',entityId:'records',values:{name:'Blocked',status:'New'}},{Cookie:viewerCookie})).status,403);
      passed('Generated-app read-only user permissions are enforced by the server');await runtimePage.close();
      const incompatible=structuredClone(manifest);incompatible.version=3;incompatible.configuration.appDefinitions.crm.entities[0].fields.push({id:'mandatory_new',label:'New required detail',type:'Text',required:true,visible:true,options:[]});deliveryConfig.delivery=incompatible;
      let review=ok(await deliveredApi('/api/runtime/updates'));assert.equal(review.candidates.find(c=>c.kind==='package').compatible,false);
      assert.equal((await deliveredApi('/api/runtime/apply-version','POST',{kind:'package',confirm:true,expectedRevision:review.revision,expectedVersion:review.installedVersion})).status,409);
      assert.equal(ok(await deliveredApi('/api/runtime')).records.length,1);
      const compatible=structuredClone(manifest);compatible.version=2;compatible.configuration.tagline='Synthetic upgraded branding';deliveryConfig.delivery=compatible;
      review=ok(await deliveredApi('/api/runtime/updates'));assert.equal(review.candidates.find(c=>c.kind==='package').compatible,true);
      ok(await deliveredApi('/api/runtime/apply-version','POST',{kind:'package',confirm:true,expectedRevision:review.revision,expectedVersion:review.installedVersion}),201);
      assert.equal(ok(await deliveredApi('/api/runtime')).branding.tagline,'Synthetic upgraded branding');
      review=ok(await deliveredApi('/api/runtime/updates'));ok(await deliveredApi('/api/runtime/apply-version','POST',{kind:'saved',version:1,confirm:true,expectedRevision:review.revision,expectedVersion:review.installedVersion}),201);
      assert.equal(ok(await deliveredApi('/api/runtime')).records[0].id,savedRecord.id);passed('Compatible configuration upgrade/rollback preserves data; incompatible required-field upgrade is blocked');
      const deselected=structuredClone(manifest);deselected.version=4;deselected.configuration.apps=['management'];deselected.configuration.quote.prices.management={monthly:100000,setup:0};deselected.configuration.appDefinitions.management=defaultDefinition({id:'management',name:'Management'});deliveryConfig.delivery=deselected;
      review=ok(await deliveredApi('/api/runtime/updates'));ok(await deliveredApi('/api/runtime/apply-version','POST',{kind:'package',confirm:true,expectedRevision:review.revision,expectedVersion:review.installedVersion}),201);
      assert.equal(ok(await deliveredApi('/api/runtime')).records.length,0);assert.equal((await deliveredApi('/api/runtime/records','POST',{appId:'crm',entityId:'records',values:{name:'Not entitled',status:'New'}})).status,403);
      review=ok(await deliveredApi('/api/runtime/updates'));ok(await deliveredApi('/api/runtime/apply-version','POST',{kind:'saved',version:1,confirm:true,expectedRevision:review.revision,expectedVersion:review.installedVersion}),201);
      assert.equal(ok(await deliveredApi('/api/runtime')).records[0].id,savedRecord.id);passed('Disabled app records are hidden at the API and retained for compatible reactivation');
      deliveryConfig.delivery=manifest;
      await delivered.close();delivered=undefined;
      await verifyPackedRuntime(archive,deliveryConfig,{identifier:owner.username,password:deliveredPassword});
      passed('Exported ZIP installs independently and runs from environment configuration with persisted data');
    }finally{if(delivered)await delivered.close();await deliveredDB.cleanup();}
    const newPhone='+12025550125';
    assert.equal((await api('/api/account/phone','PATCH',{phone:newPhone,currentPassword:randomBytes(20).toString('hex')})).status,401);
    assert.equal(ok(await api('/api/account/phone','PATCH',{phone:newPhone,currentPassword:password})).signInAgain,true);
    assert.equal((await api('/api/me')).status,401);
    assert.equal((await api('/api/login','POST',{identifier:owner.phone,password})).status,401);
    const reassociated=await api('/api/login','POST',{identifier:newPhone,password});ok(reassociated);cookie=reassociated.cookies.map(c=>c.split(';')[0]).join('; ');assert.equal(ok(await api('/api/me')).id,created.id);
    passed('Phone reassociation requires the password, revokes sessions and preserves the same account');
    ok(await api('/api/auth/sign-out','POST',{}));assert.equal((await api('/api/me')).status,401);passed('Logout invalidates the database-backed session');
    success=true;
  }finally{
    if(browser)await browser.close();await runtime.close();
    // A clean test DB was required before setup; clean only rows attributable to these synthetic principals.
    if(identities.length){
      await admin.query('BEGIN');
      try{
        await admin.query("SELECT set_config('contigoo.actor_id',$1,true)",[identities[0]]);
        await admin.query("DELETE FROM studio.projects WHERE id IN (SELECT record_id FROM studio.audit_events WHERE actor_id=ANY($1::uuid[]) AND entity='projects')",[identities]);
        await admin.query("DELETE FROM studio.clients WHERE id IN (SELECT record_id FROM studio.audit_events WHERE actor_id=ANY($1::uuid[]) AND entity='clients')",[identities]);
        await admin.query('DELETE FROM studio_auth.auth_users WHERE id=ANY($1::uuid[])',[identities]);
        await admin.query('DELETE FROM studio.principals WHERE id=ANY($1::uuid[])',[identities]);
        await admin.query('DELETE FROM studio.audit_events WHERE actor_id=ANY($1::uuid[])',[identities]);
        await admin.query('DELETE FROM studio.action_events WHERE actor_id=ANY($1::uuid[]) OR request_id=ANY($2::uuid[])',[identities,[...requestIds]]);
        await admin.query('DELETE FROM studio_auth.security_events WHERE id>$1 AND (actor_id=ANY($2::uuid[]) OR subject_id=ANY($2::uuid[]))',[initialSecurityEvents,identities]);
        await admin.query('UPDATE studio.workspace_settings SET configuration=$1,revision=$2 WHERE id=1',[initialSettings.configuration,initialSettings.revision]);
        const limiterKeys=[...identities.map(id=>`account:${id}`),`identifier:${owner.username}`,`identifier:${owner.email}`,`identifier:${owner.phone}`,'identifier:+12025550125',`identifier:ops_${run}`,`identifier:unknown_${run}`,`phone-change:${identities[0]}`,
          'ip:127.0.0.1','ip:::ffff:127.0.0.1','setup:127.0.0.1','setup:::ffff:127.0.0.1'].map(key=>createHmac('sha256',config.authSecret).update(key).digest('hex'));
        await admin.query('DELETE FROM studio_auth.login_limits WHERE key=ANY($1::text[])',[limiterKeys]);
        await admin.query('COMMIT');
      }catch(error){await admin.query('ROLLBACK');throw error;}
    }else{
      await admin.query('DELETE FROM studio.action_events WHERE request_id=ANY($1::uuid[])',[[...requestIds]]);
      const keys=['setup:127.0.0.1','setup:::ffff:127.0.0.1'].map(key=>createHmac('sha256',config.authSecret).update(key).digest('hex'));
      await admin.query('DELETE FROM studio_auth.login_limits WHERE key=ANY($1::text[])',[keys]);
    }
    await admin.end();
    await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
    const report={checkedAt:new Date().toISOString(),status:success?'Passed':'Failed',scope:'Synthetic accounts; real hosted DB/API/browser integration',completed};
    await writeFile(new URL(`../reports/integration-${report.checkedAt.replaceAll(':','-').replaceAll('.','-')}.json`,import.meta.url),JSON.stringify(report,null,2));
    await writeFile(new URL('../reports/integration-latest.json',import.meta.url),JSON.stringify(report,null,2));
  }
});
