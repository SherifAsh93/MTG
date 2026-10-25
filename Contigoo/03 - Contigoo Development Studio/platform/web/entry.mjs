const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=document.querySelector('#app');const status=document.querySelector('#connection-status');
let busy=false;let revision=0;let stopped=false;let modalSequence=0;
document.querySelector('#dialog').addEventListener('cancel',()=>{modalSequence++;});
for(const eventName of ['click','submit','keydown'])document.addEventListener(eventName,event=>{if(busy){event.preventDefault();event.stopImmediatePropagation();}},true);
async function request(url,method='GET',body,headers={}){
  const response=await fetch(url,{method,credentials:'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok){if(response.status===401&&url!=='/api/me'&&['Sign in to continue.','This account is not active.','Sign in to this application first.'].includes(data.message))location.replace('/');const error=new Error(data.message||'The request could not be completed.');error.status=response.status;throw error;}return data;
}
async function saving(action){
  if(stopped)throw new Error('Reload to reconcile the server workspace before saving again.');
  if(busy)throw new Error('A save is already in progress.');
  busy=true;document.body.dataset.saving='true';status.className='';status.textContent='Saving to PostgreSQL…';
  try{const data=await action();revision=data.revision;status.textContent='Saved to PostgreSQL';return data;}
  catch(error){status.className='error';status.textContent=error.message;if(error.status===409)stopped=true;throw error;}
  finally{busy=false;delete document.body.dataset.saving;}
}
function download(state){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='contigoo-workspace.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function login(setup=false){
  let setupToken=new URLSearchParams(location.hash.slice(1)).get('token')||'';
  if(setupToken)history.replaceState(null,'',location.pathname);
  const info=await request('/api/setup-status');
  if(setup&&info.ownerExists){location.replace('/');return;}
  app.innerHTML=`<main class="auth-shell"><img src="/assets/logo.png" alt="Contigoo"><div class="eyebrow">INTERNAL MANAGEMENT &amp; DEVELOPMENT PLATFORM</div>
    <h1>${setup?'Set up the owner':'Sign in to Studio'}</h1><p>${setup?'Create the sole owner/developer account through this protected setup.':'Use your internal Studio account. Clients do not sign in here.'}</p>
    <form id="auth-form">${setup?'<label>Name<input class="input" name="name" required maxlength="120" autocomplete="name"></label><label>Username<input class="input" name="username" required minlength="3" maxlength="30" autocomplete="username"></label><label>Email<input class="input" name="email" required type="email" autocomplete="email"></label><label>Phone login (optional, with +country code)<input class="input" name="phone" type="tel" autocomplete="tel"></label><p class="tiny-note">Username, email and the associated international phone number use the same account password. Phone association is not SMS ownership verification.</p>':'<label>Username, email or phone<input class="input" name="identifier" required autocomplete="username"></label>'}
    <label>Password<input class="input" name="password" type="password" required ${setup?'minlength="12"':''} maxlength="128" autocomplete="${setup?'new-password':'current-password'}"></label>
    ${setup?'<label>Confirm password<input class="input" name="confirmPassword" type="password" required autocomplete="new-password"></label>':''}
    <p class="form-error" role="alert"></p><button class="button primary" type="submit">${setup?'Create owner account':'Sign in'}</button></form>
    ${!info.ownerExists&&!setup?'<p>Owner setup has not been completed. Use the protected setup link opened by the local setup tool.</p>':''}</main>`;
  if(setup&&!setupToken)document.querySelector('#auth-form').insertAdjacentHTML('afterbegin','<label>Protected setup code<input class="input" name="setupCode" type="password" required autocomplete="off"></label>');
  document.querySelector('#auth-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target;const button=form.querySelector('button');button.disabled=true;
    try{const data=Object.fromEntries(new FormData(form));
      if(setup){if(data.password!==data.confirmPassword)throw new Error('Passwords do not match.');delete data.confirmPassword;setupToken||=data.setupCode||'';delete data.setupCode;await request('/api/setup','POST',data,{'X-Setup-Token':setupToken});setupToken='';location.replace('/');}
      else{await request('/api/login','POST',data);location.replace('/');}
    }catch(error){form.querySelector('.form-error').textContent=error.message;}finally{button.disabled=false;}
  });
}
async function signOut(){await request('/api/auth/sign-out','POST',{});location.replace('/');}
function dialog(title,body){modalSequence++;const d=document.querySelector('#dialog');if(d.open)d.close();delete d.dataset.auditQuery;d.className='wide-dialog';d.innerHTML=`<div class="dialog-heading"><h2>${title}</h2><button class="button secondary" id="close-account-dialog">Close</button></div>${body}`;d.showModal();d.querySelector('#close-account-dialog').onclick=()=>{modalSequence++;d.close();};return d;}
async function users(){
  const token=++modalSequence;
  const [accounts,projects]=await Promise.all([request('/api/users'),request('/api/projects')]);
  if(token!==modalSequence)return;
  const d=dialog('Users & permissions',`<p>Only the owner develops in Studio. Employees receive explicit project management access.</p><div class="account-list">${accounts.map(u=>`<article class="account-card"><h3>${esc(u.name)} · ${esc(u.kind)}</h3><p>${esc(u.email)} · ${u.active?'Active':'Disabled'}</p><p>Username: ${esc(u.identifiers.username?.value)}</p>${u.kind==='employee'?`<button class="button secondary" data-toggle-user="${u.id}" data-active="${!u.active}">${u.active?'Disable and revoke sessions':'Enable'}</button><button class="text-button" data-assign-user="${u.id}">Set project assignments</button>`:''}</article>`).join('')}</div>
    <h3>Create employee</h3><form id="employee-form" class="account-form">${[['name','Name','text'],['username','Username','text'],['email','Email','email'],['phone','Phone login (+country code, optional)','tel'],['password','Initial password (12+ characters)','password']].map(([name,label,type])=>`<label>${label}<input class="input" name="${name}" type="${type}" ${name==='phone'?'':'required'} ${name==='password'?'minlength="12" autocomplete="new-password"':''}></label>`).join('')}<p class="form-error" role="alert"></p><button class="button primary">Create employee</button></form>`);
  d.querySelector('#employee-form').onsubmit=async event=>{event.preventDefault();try{await request('/api/users','POST',Object.fromEntries(new FormData(event.target)));await users();}catch(error){event.target.querySelector('.form-error').textContent=error.message;}};
  for(const b of d.querySelectorAll('[data-toggle-user]'))b.onclick=async()=>{try{await request(`/api/users/${b.dataset.toggleUser}`,'PATCH',{active:b.dataset.active==='true'});await users();}catch(error){status.textContent=error.message;}};
  for(const b of d.querySelectorAll('[data-assign-user]'))b.onclick=()=>{
    const id=b.dataset.assignUser;const assignment=dialog('Assign projects',`<p>This replaces this employee’s assignments. Leave all unchecked to revoke all project access.</p><form id="assignments-form" class="account-form">${projects.map(p=>`<div><label class="checkbox-label"><input type="checkbox" name="${p.id}"> ${esc(p.name)}</label><label class="checkbox-label"><input type="checkbox" name="manage-${p.id}"> Allow lifecycle management</label></div>`).join('')}<p class="form-error" role="alert"></p><button class="button primary">Save assignments</button></form>`);
    assignment.querySelector('form').onsubmit=async event=>{event.preventDefault();const f=new FormData(event.target);try{await request(`/api/users/${id}/assignments`,'PUT',{assignments:projects.filter(p=>f.has(p.id)).map(p=>({projectId:p.id,canManage:f.has(`manage-${p.id}`)}))});await users();}catch(error){event.target.querySelector('.form-error').textContent=error.message;}};
  };
}
function importWorkspace(){const d=dialog('Import browser workspace',`<p>Export your existing browser workspace using “Export browser workspace” in the presentation, then choose its JSON file here. Import requires an empty server workspace and never clears browser storage.</p><form class="account-form" id="import-form"><input class="input" type="file" accept=".json,application/json" required><label class="checkbox-label"><input type="checkbox" required> Import this workspace into the empty database.</label><p class="form-error" role="alert"></p><button class="button primary">Import workspace</button></form>`);
  d.querySelector('form').onsubmit=async event=>{event.preventDefault();try{const file=event.target.querySelector('[type=file]').files[0];if(file.size>10*1024*1024)throw new Error('Workspace export is too large.');const state=JSON.parse(await file.text());await saving(()=>request('/api/workspace/import','POST',{revision,confirm:true,state}));location.reload();}catch(error){event.target.querySelector('.form-error').textContent=error.message;}};
}
async function employees(){
  const token=++modalSequence;const [rows,projects]=await Promise.all([request('/api/employees'),request('/api/projects')]);if(token!==modalSequence)return;
  const d=dialog('Employees',`<p>Employee references, profiles and account/project access are linked. Disable accounts rather than removing their history.</p><button class="button primary" id="create-employee-account">Create employee account</button><div class="account-list">${rows.map(e=>`<article class="account-card"><h3>${esc(e.employee_code)} · ${esc(e.name)}</h3><p>${esc(e.job_title||'Job title not set')} · ${esc(e.department||'Department not set')}</p><p>${esc(e.email)} · ${e.active?'Active':'Disabled'} · ${e.assignments.length} assigned projects</p><button class="button secondary" data-edit-employee="${e.principal_id}">Edit profile</button><button class="text-button" data-employee-history="${e.principal_id}">View activity</button><button class="text-button" data-employee-access>Account & project permissions</button></article>`).join('')||'<p>No employee accounts have been added yet.</p>'}</div>`);
  d.querySelector('#create-employee-account').onclick=()=>users().catch(error=>{status.textContent=error.message;});
  for(const row of rows){const card=d.querySelector(`[data-edit-employee="${row.principal_id}"]`).closest('.account-card');const list=document.createElement('ul');for(const assignment of row.assignments){const item=document.createElement('li');item.textContent=`${projects.find(p=>p.id===assignment.projectId)?.name||assignment.projectId} · ${assignment.canManage?'Management':'Read-only'}`;list.append(item);}card.append(list);}
  for(const b of d.querySelectorAll('[data-employee-access]'))b.onclick=()=>users().catch(error=>{status.textContent=error.message;});
  for(const b of d.querySelectorAll('[data-employee-history]'))b.onclick=()=>audit({employeeId:b.dataset.employeeHistory}).catch(error=>{status.textContent=error.message;});
  for(const b of d.querySelectorAll('[data-edit-employee]'))b.onclick=()=>{
    const employee=rows.find(e=>e.principal_id===b.dataset.editEmployee);const formDialog=dialog('Employee profile',`<form id="employee-profile-form" class="account-form">${[['employeeCode','Reference code',employee.employee_code,32],['name','Display name',employee.name,120],['department','Department',employee.department,120],['jobTitle','Job title',employee.job_title,120],['phone','Phone login (+country code)',employee.phone||'',40]].map(([name,label,value,max])=>`<label>${label}<input class="input" name="${name}" value="${esc(value)}" maxlength="${max}" ${['employeeCode','name'].includes(name)?'required':''}></label>`).join('')}<p class="tiny-note">Changing a phone association signs that employee out. It does not change their password or claim SMS verification.</p><label>Internal notes<textarea class="input" name="notes" maxlength="2000">${esc(employee.notes)}</textarea></label><p class="form-error" role="alert"></p><button class="button primary">Save employee profile</button></form>`);
    formDialog.querySelector('form').onsubmit=async event=>{event.preventDefault();try{const values=Object.fromEntries(new FormData(event.target));values.employeeCode=values.employeeCode.trim().toUpperCase();await request(`/api/employees/${employee.principal_id}`,'PATCH',{...values,revision:Number(employee.revision)});await employees();}catch(error){event.target.querySelector('.form-error').textContent=error.message;}};
  };
}
async function audit(filters={}){
  const token=++modalSequence;
  const query=new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==''&&v!==undefined));
  const [result,staff,projects]=await Promise.all([request(`/api/audit?${query}`),request('/api/employees'),request('/api/projects')]);
  if(token!==modalSequence)return;
  for(const event of result.events){event.project_name=event.display_project_name||event.project_name||event.project_id;event.client_name=event.display_client_name||event.client_name||event.client_id;if(event.project_id&&!projects.some(project=>project.id===event.project_id))projects.push({id:event.project_id,name:`${event.project_name} (history)`});}
  const d=dialog('Activity & audit',`<p>Server operations and committed data changes, linked to authenticated employee references and project/client records. Passwords, tokens and request bodies are excluded.</p><form id="audit-filter" class="account-form"><div class="form-row"><label>Employee<select class="input" name="employeeId"><option value="">All employees / owner / system</option>${staff.map(e=>`<option value="${e.principal_id}" ${filters.employeeId===e.principal_id?'selected':''}>${esc(e.employee_code)} · ${esc(e.name)}</option>`).join('')}</select></label><label>Project<select class="input" name="projectId"><option value="">All projects</option>${projects.map(p=>`<option value="${p.id}" ${filters.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label></div><div class="form-row"><label>From (UTC)<input class="input" type="date" name="from" value="${esc(filters.from||'')}"></label><label>Through (UTC)<input class="input" type="date" name="to" value="${esc(filters.to||'')}"></label></div><div class="form-row"><label>Action contains<input class="input" name="action" value="${esc(filters.action||'')}" maxlength="100"></label><label>Outcome<select class="input" name="outcome">${['all','success','denied','failed'].map(value=>`<option ${filters.outcome===value?'selected':''}>${value}</option>`).join('')}</select></label></div><button class="button secondary">Apply filters / refresh</button></form>
    <div class="directory-table-wrap"><table class="directory-table"><thead><tr><th>Time</th><th>Employee / reference</th><th>Action / outcome</th><th>Project / client</th><th>Record / changed fields</th></tr></thead><tbody>${result.events.map(e=>`<tr><td>${esc(new Date(e.occurred_at).toLocaleString())}<small>${esc(e.source)}</small></td><td>${esc(e.actor_name||'Unauthenticated / system')}<small>${esc(e.employee_code||e.actor_id||'No verified actor')}</small></td><td>${esc(e.action)}<small>${esc(e.method)} · ${e.status}</small></td><td>${esc(e.project_name||'—')}<small>${esc(e.client_name||'')}</small></td><td><code>${esc(e.record_id||'—')}</code><small>${esc((e.changed_fields||[]).join(', '))}</small></td></tr>`).join('')||'<tr><td colspan="5">No matching activity.</td></tr>'}</tbody></table></div><div class="dialog-actions"><button class="button secondary" id="audit-previous" ${result.page===0?'disabled':''}>Previous</button><span>Page ${result.page+1}</span><button class="button secondary" id="audit-next" ${result.events.length<result.pageSize?'disabled':''}>Next</button></div>`);
  d.dataset.auditQuery=query.toString();
  d.querySelector('#audit-filter').onsubmit=event=>{event.preventDefault();audit(Object.fromEntries(new FormData(event.target))).catch(error=>{status.textContent=error.message;});};
  d.querySelector('#audit-previous').onclick=()=>audit({...filters,page:result.page-1}).catch(error=>{status.textContent=error.message;});
  d.querySelector('#audit-next').onclick=()=>audit({...filters,page:result.page+1}).catch(error=>{status.textContent=error.message;});
}
function packages(state){const published=state.clients.filter(p=>p.version>0);const d=dialog('Standalone web packages',`<p>Download a saved version as a self-hostable runtime. Deploy it with its own database and bootstrap its own administrator; no records or credentials are included.</p><div class="account-list">${published.map(p=>`<article class="account-card"><h3>${esc(p.name)}</h3><a class="button primary" href="/api/projects/${p.id}/package?version=${p.version}" download>Download version ${p.version}</a></article>`).join('')||'<p>Save an app version in Studio first.</p>'}</div>`);}
async function myAccount(){
  const identifiers=await request('/api/account/identifiers');const phone=identifiers.find(i=>i.kind==='phone')?.identifier||'';
  const d=dialog('My account',`<p>These identifiers all resolve to your single account and password.</p><dl>${identifiers.map(i=>`<dt>${esc(i.kind)}</dt><dd>${esc(i.identifier)}</dd>`).join('')}</dl><form id="own-phone-form" class="account-form"><label>Associated phone (+country code)<input class="input" name="phone" type="tel" value="${esc(phone)}"></label><label>Current password<input class="input" name="currentPassword" type="password" required autocomplete="current-password"></label><p class="tiny-note">A changed phone association revokes existing sessions. You can sign in again using the new phone, email or username.</p><p class="form-error" role="alert"></p><button class="button primary">Update phone association</button></form>`);
  d.querySelector('form').onsubmit=async event=>{event.preventDefault();try{const result=await request('/api/account/phone','PATCH',Object.fromEntries(new FormData(event.target)));if(result.signInAgain)location.replace('/');else{d.close();status.textContent='Account association saved.';}}catch(error){event.target.querySelector('.form-error').textContent=error.message;}};
}
async function employeeView(user){
  const projects=await request('/api/projects');
  app.innerHTML=`<main class="employee-shell"><img src="/assets/logo.png" alt="Contigoo" width="150"><h1>Assigned projects</h1><p>Signed in as ${esc(user.name)}</p><button class="button secondary" id="sign-out">Sign out</button><div class="account-list">${projects.map(p=>`<article class="account-card"><h2>${esc(p.name)}</h2><p>Client: ${esc(p.client_name)}</p><p>${esc(p.description)}</p><p>${esc(p.status)} · ${p.can_manage?'Management access':'Read-only'}</p>${p.can_manage?`<button class="button secondary" data-manage="${p.id}">${p.status==='active'?'Archive':'Reactivate'}</button>`:''}</article>`).join('')||'<p>No projects assigned. Ask the owner to grant access.</p>'}</div></main>`;
  document.querySelector('#sign-out').onclick=signOut;
  for(const b of document.querySelectorAll('[data-manage]'))b.onclick=async()=>{const p=projects.find(p=>p.id===b.dataset.manage);try{await request(`/api/projects/${p.id}`,'PATCH',{status:p.status==='active'?'archived':'active',revision:Number(p.revision)});await employeeView(user);}catch(error){status.textContent=error.message;}};
}
async function start(){
  if(location.pathname==='/setup'){await login(true);return;}
  let user;try{user=await request('/api/me');}catch(error){if(error.status===401){await login();return;}throw error;}
  if(user.kind!=='owner'){await employeeView(user);return;}
  globalThis.contigooPersistence={user,
    view(event){return request('/api/activity','POST',event);},
    activity(event){return request('/api/activity','POST',event);},
    afterRender(){
      const directory=document.querySelector('#client-results .list-toolbar .muted');if(directory)directory.textContent='Database-backed client directory';
      const saveNote=document.querySelector('.demo-save-strip p');if(saveNote)saveNote.textContent='Versions store the configuration and quote in PostgreSQL. Use Standalone packages to download a self-hostable application.';
      const publish=document.querySelector('#publish-button');if(publish)publish.textContent='Save version';
      const recordsNote=document.querySelector('.managed-apps + .tiny-note');if(recordsNote)recordsNote.textContent='App records are validated and stored through the authenticated backend.';
      const stateNote=document.querySelector('.project-state-strip span:last-child');if(stateNote)stateNote.textContent=stateNote.textContent.replace('local snapshot','database snapshot');
      for(const label of document.querySelectorAll('.publication-list strong'))label.textContent=label.textContent.replace('Demo version','Saved version');
    },
    afterDialog(dialog){
      const description=dialog.querySelector('.client-dialog-body > p');if(description)description.textContent='Save the client’s business/contact details now. Projects are managed separately.';
      for(const text of dialog.querySelector('.delete-summary')?.childNodes||[])if(text.nodeType===Node.TEXT_NODE)text.textContent=text.textContent.replace('from this browser’s client directory','from the database-backed client directory');
      const listNote=dialog.querySelector('.runtime-list-heading p');if(listNote)listNote.textContent=listNote.textContent.replace('local demo records','database records');
      if(dialog.classList.contains('runtime-dialog')){const note=dialog.querySelector(':scope > .tiny-note');if(note)note.textContent='This Studio runtime uses authenticated backend validation and PostgreSQL persistence. Standalone delivery is available from saved-version packages.';}
    },
    async load(){const data=await request('/api/workspace');revision=data.revision;return data.state;},
    async save(state,options){await saving(()=>request('/api/workspace','PUT',{state,revision,...options}));},
    async record(input,remove=false){const data=await saving(()=>request(`/api/records/${remove?'delete':'save'}`,'POST',{...input,revision}));return data.state;},
    mount({state}){
      const nav=document.querySelector('.sidebar nav');
      for(const [label,key,action]of [['Employees','employees',employees],['Users & permissions','users',users],['Activity & audit','audit',audit]]){const button=document.createElement('button');button.className='nav-item';button.dataset.connectedView=key;button.textContent=label;button.onclick=()=>action().catch(error=>{status.textContent=error.message;});nav.append(button);}
      const tools=document.createElement('div');tools.className='connected-tools';
      const actions=[['Import browser work',importWorkspace],['Export workspace',async()=>{await request('/api/activity','POST',{action:'workspace_export'});download(state);}],['Standalone packages',()=>packages(state)],['My account',myAccount],['Sign out',signOut]];
      for(const [label,action]of actions){const b=document.createElement('button');b.className='text-button';b.textContent=label;b.onclick=()=>Promise.resolve(action()).catch(error=>{status.textContent=error.message;});tools.append(b);}
      document.querySelector('.prototype-card').append(tools);
      const menu=document.createElement('button');menu.className='button secondary';menu.id='account-tools';menu.textContent='Account & tools';
      menu.onclick=()=>{const d=dialog('Workspace tools','<div id="workspace-tools" class="account-form"></div>');for(const [label,action]of actions){const b=document.createElement('button');b.className='button secondary';b.textContent=label;b.onclick=()=>{d.close();Promise.resolve(action()).catch(error=>{status.textContent=error.message;});};d.querySelector('#workspace-tools').append(b);}};
      document.querySelector('.topbar-actions').prepend(menu);
      document.querySelector('.prototype-card p').textContent='Manage clients. Build and deliver.';
      document.querySelector('.app-footer span:last-child').textContent='Authenticated Studio · PostgreSQL-backed';
    }
  };
  await import('/app.mjs');
}
start().catch(()=>{app.innerHTML='<main class="auth-shell"><h1>Studio could not load</h1><p>Your database and browser work have not been reset. Check the backend connection and reload.</p></main>';});
