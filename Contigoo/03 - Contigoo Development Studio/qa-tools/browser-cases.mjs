import assert from 'node:assert/strict';
import { modules, templates, STORAGE_KEY } from '../prototype/model.mjs';
import { defaultPrice } from '../prototype/builder-model.mjs';

export const browserCases = [];
const test = (id, area, title, steps, expected, run, severity = 'Medium') => browserCases.push({ id, area, title, steps, expected, layer: 'Browser', run, severity });

test('B-NAV-01', 'Navigation', 'Overview, navigation, branding and client/project searches', 'Visit every navigation area; search/clear clients and projects; filter by client.', 'Correct rows and current section; no data mutation, overflow or uncaught errors.', async t => {
  const w = await t.workspace(); const { page, f } = w;
  assert.equal(await page.$eval('.brand-subtitle', n => n.textContent), 'Internal Management & Development Platform');
  await page.click('[data-nav="clients"]'); await w.fill('#client-search', 'alpha@example.test'); assert.equal(await page.$$eval('[data-client-row]', n => n.length), 1);
  await page.click('[data-clear-client-search]'); assert.equal(await page.$$eval('[data-client-row]', n => n.length), 2);
  await w.fill('#client-search', 'not-found'); assert.equal(await page.$$eval('[data-client-row]', n => n.length), 0);
  await page.click('[data-nav="builder"]'); await page.select('#project-client-filter', f.ownerB.id); assert.equal(await page.$$eval('[data-project-row]', n => n.length), 1);
  await page.click('[data-clear-project-search]'); await w.fill('#project-search', 'Alpha'); assert.equal(await page.$$eval('[data-project-row]', n => n.length), 1);
  await page.click('[data-nav="apps"]'); assert.equal(await page.$eval('#library-project', n => n.value), '');
  assert(await page.$eval('[data-new-custom-app]', n => n.disabled));
  for (const category of ['All apps', 'Customer', 'Operations', 'Commerce', 'People', 'Mobile', 'Custom']) {
    await page.click(`[data-category="${category}"]`);
    const expected = category === 'All apps' ? modules.length + 1 : modules.filter(m => m.category === category).length + (category === 'Custom' ? 1 : 0);
    assert.equal(await page.$$eval('.library-card', ns => ns.length), expected, `Wrong catalog count for ${category}`);
  }
  await page.click('[data-nav="overview"]'); await w.fill('#global-search', 'Beta'); await page.keyboard.press('Enter'); assert.equal(await page.$$eval('[data-client-row]', n => n.length), 1);
});
test('B-CLIENT-01', 'Clients', 'Create/view/edit/cancel/delete a standalone client', 'Create profile without a project, edit contact details, cancel an edit, delete and reload.', 'All actions work, cancellation changes nothing and deletion survives reload.', async t => {
  const w = await t.workspace(); const { page } = w;
  await page.click('[data-nav="clients"]'); await page.click('[data-action="new-client"]');
  await w.fill('#client-name', 'QA standalone'); await w.fill('#client-email', 'standalone@example.test'); await w.fill('#client-notes', 'Synthetic notes');
  await page.click('#client-details-form button[type="submit"]'); assert.equal(await page.$$eval('[data-project-row]', n => n.length), 0);
  const id = await page.$eval('[data-edit-client]', n => n.dataset.editClient);
  await page.click('[data-edit-client]'); await w.fill('#client-contact', 'Updated contact'); await page.click('#client-details-form button[type="submit"]');
  assert(await page.$eval('.client-details', n => n.textContent.includes('Updated contact')));
  const before = await w.state(); await page.click('[data-edit-client]'); await w.fill('#client-name', 'Must be cancelled'); await page.keyboard.press('Escape'); assert.deepEqual(await w.state(), before);
  await page.click('[data-delete-client]'); await page.click('#delete-client-form button[type="submit"]'); await page.reload({ waitUntil: 'load' }); await page.click('[data-nav="clients"]');
  assert.equal(await page.$(`[data-client-row="${id}"]`), null);
});
test('B-CLIENT-02', 'Clients', 'Client validation and safe text rendering', 'Try blank/invalid email; save an HTML-like note/name.', 'Invalid form remains open; valid text is rendered literally and creates no executable elements.', async t => {
  const w = await t.workspace(); const { page } = w;
  await page.click('[data-nav="clients"]'); await page.click('[data-action="new-client"]'); await page.click('#client-details-form button[type="submit"]');
  assert(await page.$eval('#dialog', n => n.open)); await w.fill('#client-name', 'QA <svg>'); await w.fill('#client-email', 'not-an-email'); await page.click('#client-details-form button[type="submit"]');
  assert.equal((await w.state()).clientProfiles.length, 2);
  await w.fill('#client-email', 'safe@example.test'); await w.fill('#client-notes', '<img src=x onerror=window.qaInjected=1>'); await page.click('#client-details-form button[type="submit"]');
  assert(await page.$eval('.client-details', n => n.textContent.includes('<img'))); assert.equal(await page.$('.client-details img'), null); assert.equal(await page.evaluate(() => window.qaInjected), undefined);
});
test('B-CLIENT-03', 'Clients', 'Cascade deletion lists projects and respects cancellation', 'Delete a client with projects, cancel, then explicitly confirm cascade.', 'Confirmation lists scope; only chosen client/project is deleted, shared catalog and other client stay.', async t => {
  const w = await t.workspace(); const { page, f } = w;
  await page.click('[data-nav="clients"]'); await page.click(`[data-delete-client="${f.ownerA.id}"]`);
  assert(await page.$eval('#dialog', n => n.textContent.includes('QA Project Alpha')));
  await page.click('#delete-client-form button[type="submit"]'); assert(await page.$eval('#dialog', n => n.open));
  await page.click('#delete-client-form [data-action="close-dialog"]'); assert.equal((await w.state()).clients.length, 2);
  await page.click(`[data-delete-client="${f.ownerA.id}"]`); await page.click('#delete-client-projects'); await page.click('#delete-client-form button[type="submit"]');
  const s = await w.state(); assert.equal(s.clients.length, 1); assert.equal(s.clients[0].id, f.b.id); assert.equal(s.customApps.length, 1);
});

for (const starter of templates) test(`B-STARTER-${starter.id}`, 'Starters', `Create through ${starter.name}`, `Use Create project; choose ${starter.name}; submit client/name.`, 'Exactly the starter modules are selected; project has its own identity and no copied records.', async t => {
  const w = await t.workspace({ custom: false }); const { page, f } = w;
  await page.click('[data-nav="builder"]'); await page.click('[data-action="new-project"]'); await page.select('#new-project-client', f.ownerA.id);
  await w.fill('#new-project-name', `QA ${starter.name}`); await page.select('#new-project-template', starter.id); await page.click('#new-project-form button[type="submit"]');
  const id = await page.$eval('#client-select', n => n.value); const p = (await w.state()).clients.find(p => p.id === id);
  assert.deepEqual(p.draft.apps, starter.apps); assert.equal(p.clientId, f.ownerA.id); assert.deepEqual(p.demoRecords, {});
});

test('B-PROJECT-01', 'Projects', 'New-project validation and nested client cancellation', 'Try submitting without owner/name; fill project inputs, enter nested client creation, cancel and return.', 'No invalid project; nested cancel preserves project inputs.', async t => {
  const w = await t.workspace(); const { page, f } = w;
  await page.click('[data-nav="builder"]'); await page.click('[data-action="new-project"]'); await page.click('#new-project-form button[type="submit"]'); assert.equal((await w.state()).clients.length, 2);
  await w.fill('#new-project-name', 'Nested setup'); await w.fill('#new-project-description', 'Keep description'); await page.select('#new-project-client', f.ownerA.id); await page.select('#new-project-template', 'mobile-framework');
  await page.click('#project-create-client'); await w.fill('#client-name', 'Cancel me'); await page.click('#cancel-client');
  assert.equal(await page.$eval('#new-project-name', n => n.value), 'Nested setup'); assert.equal(await page.$eval('#new-project-description', n => n.value), 'Keep description'); assert.equal(await page.$eval('#new-project-template', n => n.value), 'mobile-framework');
});
test('B-PROJECT-02', 'Projects', 'Project details, archive/reactivate and deletion', 'Rename project; save; archive/filter/reactivate; delete project independently.', 'Branding/client identity retained; archived data kept; deletion keeps the client.', async t => {
  const w = await t.workspace(); const { page, f } = w;
  await w.openProject(); await page.click('[data-action="project-details"]'); await w.fill('#project-details-form input[name="name"]', 'QA renamed'); await w.fill('#project-details-form textarea', 'Updated description'); await page.click('#project-details-form button');
  assert.equal((await w.state()).clients.find(p => p.id === f.a.id).draft.name, f.ownerA.name);
  await page.click(`[data-manage-project="${f.a.id}"]`); await page.click(`[data-archive-project="${f.a.id}"]`); await page.click('[data-nav="builder"]'); assert.equal(await page.$(`[data-project-row="${f.a.id}"]`), null);
  await page.select('#project-status-filter', 'archived'); await page.click(`[data-manage-project="${f.a.id}"]`); await page.click(`[data-archive-project="${f.a.id}"]`);
  await page.click(`[data-delete-project="${f.a.id}"]`); await page.click('#delete-project-form button[type="submit"]'); const s = await w.state(); assert.equal(s.clients.length, 1); assert.equal(s.clientProfiles.length, 2);
});

for (const app of modules) test(`B-MODULE-${app.id}`, 'Built-in app runtime', `${app.name}: select/edit/create/update/delete record`, `Select ${app.name}; open its editor/preview; create, edit and delete a synthetic record.`, 'The module can be used independently through its generic browser runtime; data and pricing remain scoped.', async t => {
  const w = await t.workspace({ custom: false }); const { page, f } = w;
  await w.openProject(); await page.click(`[data-toggle-app="${app.id}"]`); await page.click(`[data-edit-app="${app.id}"]`); await page.click(`[data-run-app="${app.id}"]`); await page.click('[data-runtime-page="form"]');
  await w.fill('#runtime-record-form input[name="name"]', `${app.name} test record`); await page.select('#runtime-record-form select[name="status"]', 'New');
  const numbers = await page.$$eval('#runtime-record-form input[type="number"]', ns => ns.map(n => n.name)); for (const name of numbers) await w.fill(`#runtime-record-form input[name="${name}"]`, '2.5');
  await page.click('#runtime-record-form button[type="submit"]'); assert(await page.$eval('.runtime-table', (n, name) => n.textContent.includes(name), `${app.name} test record`));
  await page.click('[data-runtime-edit]'); await w.fill('#runtime-record-form input[name="name"]', `${app.name} edited`); await page.click('#runtime-record-form button[type="submit"]');
  assert(await page.$eval('.runtime-table', (n, name) => n.textContent.includes(name), `${app.name} edited`));
  await page.click('[data-runtime-delete]'); assert(await page.$eval('.runtime-table', n => n.textContent.includes('No records yet')));
  const s = await w.state(); assert.deepEqual(s.clients.find(p => p.id === f.b.id).demoRecords, {});
  assert.equal(s.clients.find(p => p.id === f.a.id).draft.quote.prices[app.id].monthly, defaultPrice(app.id).monthly);
});

test('B-CUSTOM-01', 'Custom apps', 'Create custom app and reject duplicate name', 'Create a custom app through library, then try its name again.', 'Editor opens for new app; duplicate is rejected without new catalog/project entries.', async t => {
  const w = await t.workspace({ custom: false }); const { page, f } = w;
  await page.click('[data-nav="apps"]'); await page.select('#library-project', f.a.id); await page.click('[data-new-custom-app]');
  await w.fill('#custom-app-name', 'QA Rentals'); await w.fill('#custom-app-entity', 'Rental'); await w.fill('#custom-app-monthly', '12.50'); await w.fill('#custom-app-setup', '3'); await page.click('#custom-app-form button[type="submit"]');
  assert(await page.$('.designer-panel')); assert.equal((await w.state()).customApps.length, 1);
  await page.click('[data-nav="apps"]'); await page.click('[data-new-custom-app]'); await w.fill('#custom-app-name', 'qa rentals'); await w.fill('#custom-app-entity', 'Other'); await page.click('#custom-app-form button[type="submit"]');
  assert(await page.$eval('#custom-app-form .form-error', n => n.textContent.includes('already'))); assert.equal((await w.state()).customApps.length, 1);
});
test('B-SHARED-01', 'Shared data', 'Create field types, delete a field/entity and recover an empty model', 'Add entity and Text/Number/Date/Yes-No fields; delete a field; remove entities and reload; add a replacement.', 'Fields attach to the right entity; scoped cleanup works; empty state disables fields until replacement.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.openProject(); await page.click('[data-tab="fields"]');
  await w.fill('#entity-name', 'QA Shipment'); await page.click('#entity-form button');
  for (const type of ['Text', 'Number', 'Date', 'Yes / No']) {
    await page.select('#field-entity', 'QA Shipment'); await page.select('#field-type', type); await w.fill('#field-name', `Field ${type}`); await page.click('#field-form button[type="submit"]');
  }
  let p = (await w.state()).clients.find(p => p.id === f.a.id); assert.equal(p.draft.fields.length, 4);
  await page.click(`[data-delete-field="${p.draft.fields[0].id}"]`); await page.click('[data-delete-entity="QA Shipment"]');
  assert(await page.$eval('#dialog', n => n.textContent.includes('3 shared fields'))); await page.click('#delete-entity-form button[type="submit"]');
  await page.click('[data-delete-entity="Record"]'); await page.click('#delete-entity-form button[type="submit"]'); assert(await page.$eval('#field-form button', n => n.matches(':disabled')));
  await page.reload({ waitUntil: 'load' }); await w.openProject(); await page.click('[data-tab="fields"]'); assert.equal(await page.$$eval('[data-shared-entity]', n => n.length), 0);
  await w.fill('#entity-name', 'Replacement'); await page.click('#entity-form button'); assert.equal(await page.$eval('#field-form button', n => n.matches(':disabled')), false);
});
test('B-ENTITY-01', 'App entities', 'Add/switch app entity and use its generated list', 'Add Shipment; open its auto-generated list; create its required-name record.', 'Record is stored in the new entity, not the original one.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await w.fill('#app-entity-name', 'Shipment'); await page.click('#app-entity-form button');
  const s = await w.state(); const d = s.clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id]; const e = d.entities.find(e => e.name === 'Shipment'); const list = d.pages.find(p => p.entityId === e.id);
  await page.click(`[data-open-app-page="${list.id}"]`); await page.click('[data-runtime-add]'); await w.fill(`#runtime-record-form input[name="${e.fields[0].id}"]`, 'Shipment row'); await page.click('#runtime-record-form button[type="submit"]');
  const saved = (await w.state()).clients.find(p => p.id === f.a.id); assert.equal(saved.demoRecords[f.app.id][e.id].length, 1); assert(!saved.demoRecords[f.app.id].records?.length);
});
test('B-FIELDS-01', 'App fields', 'Field add/rename/duplicate/order/required/visibility/delete controls', 'Add optional field; rename/reorder it; try duplicate rename and hiding required name; remove down to one field.', 'Supported controls persist; duplicate/required-hide/last-field removal are blocked.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor();
  await w.fill('#app-field-label', 'Reference'); await page.click('#app-field-form button[type="submit"]');
  let d = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id]; const field = d.entities[0].fields.find(x => x.label === 'Reference');
  await w.change(`[data-field-label="${field.id}"]`, 'Reference renamed');
  await page.click(`[data-field-move="${field.id}"][data-direction="-1"]`);
  d = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id]; assert.equal(d.entities[0].fields[1].id, field.id);
  await page.click(`[data-field-move="${field.id}"][data-direction="1"]`);
  assert.equal((await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id].entities[0].fields[2].id, field.id);
  await w.change(`[data-field-label="${field.id}"]`, 'Entry name'); assert.equal(await page.$eval(`[data-field-label="${field.id}"]`, n => n.value), 'Reference renamed');
  await page.click('[data-field-visible="name"]'); assert(await page.$eval('[data-field-visible="name"]', n => n.checked));
  await page.click('[data-field-required="name"]'); await page.click('[data-field-visible="name"]'); assert.equal(await page.$eval('[data-field-visible="name"]', n => n.checked), false);
  await page.click('[data-field-required="name"]'); assert(await page.$eval('[data-field-visible="name"]', n => n.checked));
  await page.click(`[data-remove-app-field="${field.id}"]`); await page.click('[data-remove-app-field="status"]'); await page.click('[data-remove-app-field="name"]');
  assert(await page.$eval('#toast', n => n.textContent.includes('at least one field'))); assert.equal(await page.$$eval('[data-app-field]', ns => ns.length), 1);
});
test('B-FIELDS-02', 'App fields', 'Optional hidden values survive record editing', 'Create a record with an optional field; hide the field; edit the visible name.', 'Hidden input is absent from form but the existing hidden value is retained.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await w.fill('#app-field-label', 'Internal reference'); await page.click('#app-field-form button[type="submit"]');
  const field = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id].entities[0].fields.at(-1);
  await page.click(`[data-run-app="${f.app.id}"]`); await page.click('[data-runtime-page="form"]'); await w.fill('#runtime-record-form input[name="name"]', 'Original'); await page.select('#runtime-record-form select[name="status"]', 'New'); await w.fill(`#runtime-record-form input[name="${field.id}"]`, 'Keep me'); await page.click('#runtime-record-form button[type="submit"]'); await page.click('[data-action="close-dialog"]');
  await page.click(`[data-field-visible="${field.id}"]`); await page.click(`[data-run-app="${f.app.id}"]`); await page.click('[data-runtime-page="list"]'); await page.click('[data-runtime-edit]');
  assert.equal(await page.$(`#runtime-record-form input[name="${field.id}"]`), null); await w.fill('#runtime-record-form input[name="name"]', 'Updated'); await page.click('#runtime-record-form button[type="submit"]');
  assert.equal((await w.state()).clients.find(p => p.id === f.a.id).demoRecords[f.app.id].records[0].values[field.id], 'Keep me');
});
test('B-PAGES-01', 'Pages', 'Add/edit/reorder/preview/delete pages and rename app', 'Create safe text Content page, edit its body, move it up, preview and delete; rename app.', 'Content is literal text; page actions and instance rename persist without affecting another project.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await page.click('[data-designer-tab="pages"]');
  await w.fill('#app-name-form input', 'QA renamed display'); await page.click('#app-name-form button');
  await w.fill('#app-page-name', 'Policy'); await page.select('#app-page-kind', 'Content'); await w.fill('#app-page-form textarea', '<svg onload=window.qaInjected=1>'); await page.click('#app-page-form button[type="submit"]');
  let d = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id]; const item = d.pages.at(-1);
  await page.click(`[data-edit-page="${item.id}"]`); await w.fill('#edit-page-form input[name="name"]', 'Updated policy'); await w.fill('#edit-page-form textarea', 'Updated <b>policy</b>'); await page.click('#edit-page-form button[type="submit"]');
  await page.click(`[data-page-move="${item.id}"]`); await page.click(`[data-open-app-page="${item.id}"]`);
  assert.equal(await page.$('.runtime-content-text b'), null); assert(await page.$eval('.runtime-content-text', n => n.textContent.includes('<b>policy</b>'))); assert.equal(await page.evaluate(() => window.qaInjected), undefined);
  await page.click('[data-action="close-dialog"]'); await page.click(`[data-remove-page="${item.id}"]`);
  d = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id]; assert(!d.pages.some(p => p.id === item.id));
  assert.equal((await w.state()).clients.find(p => p.id === f.b.id).draft.appDefinitions[f.app.id].name, 'QA Custom App');
  for (const p of d.pages.slice(1)) await page.click(`[data-remove-page="${p.id}"]`);
  await page.click(`[data-remove-page="${d.pages[0].id}"]`); assert(await page.$eval('#toast', n => n.textContent.includes('at least one app page')));
});
test('B-RULES-01', 'Workflows', 'Conditional set/note rules, disable/delete and dependent field protection', 'Add conditional status rule and note, disable note, create record; try deleting referenced status field; delete rules.', 'Condition executes; disabled rule does not log; referenced fields cannot be removed until rule deletion.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await page.click('[data-designer-tab="workflow"]');
  await w.fill('#workflow-name', 'Finish new'); await page.select('#app-workflow-form select[name="conditionField"]', 'status'); await w.fill('#app-workflow-form input[name="conditionValue"]', 'New'); await page.select('#workflow-target', 'status'); await w.fill('#workflow-value', 'Complete'); await page.click('#app-workflow-form button[type="submit"]');
  await w.fill('#workflow-name', 'Note'); await page.select('#workflow-action', 'note'); await w.fill('#workflow-value', 'Do not run'); await page.click('#app-workflow-form button[type="submit"]');
  const rules = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id].workflows; await page.click(`[data-rule-enabled="${rules[1].id}"]`);
  await page.click(`[data-run-app="${f.app.id}"]`); await page.click('[data-runtime-page="form"]'); await w.fill('#runtime-record-form input[name="name"]', 'Conditional'); await page.select('#runtime-record-form select[name="status"]', 'New'); await page.click('#runtime-record-form button[type="submit"]');
  assert(await page.$eval('.runtime-table', n => n.textContent.includes('Complete'))); assert.equal(await page.$('.runtime-log'), null); await page.click('[data-action="close-dialog"]');
  await page.click('[data-designer-tab="data"]'); await page.click('[data-remove-app-field="status"]'); assert(await page.$eval('#toast', n => n.textContent.includes('referencing this field')));
  await page.click('[data-designer-tab="workflow"]'); for (const rule of rules) await page.click(`[data-remove-rule="${rule.id}"]`);
  await page.click('[data-designer-tab="data"]'); await page.click('[data-remove-app-field="status"]'); assert.equal(await page.$('[data-app-field="status"]'), null);
});
test('B-RECORDS-01', 'Records', 'Typed browser fields and native required/email validation', 'Add email/number/date/boolean/choice fields; try invalid form, then save valid typed values.', 'Invalid form commits nothing; valid values retain their intended types.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor();
  for (const [label, type] of [['Email', 'Email'], ['Amount', 'Number'], ['Date', 'Date'], ['Active', 'Yes / No'], ['Priority', 'Choice']]) {
    await w.fill('#app-field-label', label); await page.select('#app-field-type', type); if (type === 'Choice') await w.fill('#app-field-options', 'High,Low'); await page.click('#app-field-form button[type="submit"]');
  }
  const fields = (await w.state()).clients.find(p => p.id === f.a.id).draft.appDefinitions[f.app.id].entities[0].fields; const id = label => fields.find(f => f.label === label).id;
  await page.click(`[data-run-app="${f.app.id}"]`); await page.click('[data-runtime-page="form"]'); await page.click('#runtime-record-form button[type="submit"]');
  assert.equal((await w.state()).clients.find(p => p.id === f.a.id).demoRecords[f.app.id]?.records?.length || 0, 0);
  await w.fill('#runtime-record-form input[name="name"]', 'Typed'); await page.select('#runtime-record-form select[name="status"]', 'New'); await w.fill(`#record-${id('Email')}`, 'invalid-email'); await page.click('#runtime-record-form button[type="submit"]'); assert(await page.$('#runtime-record-form'));
  await w.fill(`#record-${id('Email')}`, 'typed@example.test'); await w.fill(`#record-${id('Amount')}`, '-12.5');
  await page.$eval(`#record-${id('Date')}`, n => { n.value = '2028-02-29'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click(`#record-${id('Active')}`); await page.select(`#record-${id('Priority')}`, 'High'); await page.click('#runtime-record-form button[type="submit"]');
  const values = (await w.state()).clients.find(p => p.id === f.a.id).demoRecords[f.app.id].records[0].values;
  assert.equal(values[id('Amount')], -12.5); assert.equal(values[id('Active')], true); assert.equal(values[id('Date')], '2028-02-29'); assert.equal(values[id('Priority')], 'High');
});
test('B-TEMPLATES-01', 'Templates', 'Save reusable template and install in a fresh project', 'Add a custom field; save template; create blank project and select the custom app.', 'New definition includes the field; existing second project is unchanged; records are empty.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await w.fill('#app-field-label', 'Reused field'); await page.click('#app-field-form button[type="submit"]'); await page.click('[data-save-app-template]');
  await page.click('[data-nav="builder"]'); await page.click('[data-action="new-project"]'); await page.select('#new-project-client', f.ownerB.id); await w.fill('#new-project-name', 'Reuse target'); await page.click('#new-project-form button[type="submit"]');
  await page.click(`[data-toggle-app="${f.app.id}"]`); await page.click(`[data-edit-app="${f.app.id}"]`); assert.equal(await page.$$eval('[data-app-field]', ns => ns.length), 3);
  const s = await w.state(); assert.equal(s.clients.find(p => p.id === f.b.id).draft.appDefinitions[f.app.id].entities[0].fields.length, 2); assert.deepEqual(s.clients.at(-1).demoRecords, {});
});
test('B-PRICING-01', 'Pricing', 'Default price list vs existing projects and future selections', 'Change catalog default; inspect existing selected app price; select it in a new project.', 'Existing selection retains its price; new selection gets the changed default.', async t => {
  const w = await t.workspace(); const { page, f } = w; await page.click('[data-nav="apps"]'); await page.click('[data-price-book]');
  await w.fill(`[data-price-id="${f.app.id}"][data-price-kind="monthly"]`, '88.25'); await page.click('#price-book-form button[type="submit"]');
  assert.equal((await w.state()).clients.find(p => p.id === f.a.id).draft.quote.prices[f.app.id].monthly, 2500);
  await page.click('[data-action="new-project"]'); await page.select('#new-project-client', f.ownerA.id); await w.fill('#new-project-name', 'Price target'); await page.click('#new-project-form button[type="submit"]'); await page.click(`[data-toggle-app="${f.app.id}"]`);
  assert.equal(await page.$eval('#project-monthly', n => n.textContent), 'EGP 88.25');
});
test('B-PRICING-02', 'Pricing', 'App override, base amounts, discount, deselection and JSON export', 'Edit app price and quote settings; export; remove/re-add the app.', 'Exact recurring/setup totals and export fields; overrides survive reselection.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.editor(); await page.click('[data-designer-tab="price"]');
  await w.fill('.single-app-price input[name="monthly"]', '100.25'); await w.fill('.single-app-price input[name="setup"]', '20'); await page.click('.single-app-price button[type="submit"]');
  await page.click('[data-nav="project"]'); await page.click('[data-open-pricing]'); await w.fill('#quote-settings input[name="monthly"]', '9.75'); await w.fill('#quote-settings input[name="setup"]', '5'); await w.fill('#quote-settings input[name="discount"]', '10'); await page.click('#quote-settings button');
  assert.equal(await page.$eval('#project-monthly', n => n.textContent), 'EGP 99'); assert.equal(await page.$eval('#project-setup', n => n.textContent), 'EGP 25');
  await page.evaluate(() => { const original = URL.createObjectURL; URL.createObjectURL = function(blob) { window.qaExport = blob.text(); return original.call(this, blob); }; });
  const session = await page.createCDPSession(); await session.send('Page.setDownloadBehavior', { behavior: 'deny' });
  await page.click('[data-export-quote]'); const exported = JSON.parse(await page.evaluate(() => window.qaExport));
  assert.equal(exported.monthly, 9900); assert.equal(exported.setup, 2500); assert.equal(exported.projectId, f.a.id); assert.equal(exported.client, f.ownerA.name); assert.equal(exported.lines[0].monthly, 10025);
  await page.click('[data-tab="apps"]'); await page.click(`[data-toggle-app="${f.app.id}"]`); assert.equal(await page.$eval('#project-monthly', n => n.textContent), 'EGP 8.77');
  await page.click(`[data-toggle-app="${f.app.id}"]`); assert.equal(await page.$eval('#project-monthly', n => n.textContent), 'EGP 99');
});
test('B-BRAND-01', 'Branding', 'Name/tagline/color/logo persist with safe rendering and per-project scope', 'Change branding with HTML-like text; upload a valid logo; switch project and return; remove logo.', 'Text is escaped, colors/logo are scoped and removal works.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.openProject(); await page.click('[data-tab="brand"]');
  await w.fill('#brand-name', 'QA <svg>'); await w.fill('#brand-tagline', '<img src=x onerror=window.qaInjected=1>'); await page.click('[data-color="#79658b"]');
  await (await page.$('#brand-logo')).uploadFile(t.assets.validPng); await page.waitForSelector('#live-preview .client-logo');
  await page.select('#client-select', f.b.id); assert.equal(await page.$('#live-preview .client-logo'), null); await page.select('#client-select', f.a.id);
  assert.equal(await page.$eval('#brand-name', n => n.value), 'QA <svg>'); assert.equal(await page.$eval('#brand-color', n => n.value), '#79658b'); assert.equal(await page.evaluate(() => window.qaInjected), undefined);
  await page.click('[data-action="remove-logo"]'); assert.equal(await page.$('#live-preview .client-logo'), null);
});
for (const [key, mime] of [['validJpeg', 'image/jpeg'], ['validWebp', 'image/webp']]) test(`B-LOGO-${key}`, 'Branding', `Accept ${mime} upload`, `Upload a valid synthetic ${mime} image, reload and reopen the project.`, 'Image decodes, is saved as the correct data URI and survives reload.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.openProject(); await page.click('[data-tab="brand"]');
  await (await page.$('#brand-logo')).uploadFile(t.assets[key]); await page.waitForSelector('#live-preview .client-logo');
  assert((await w.state()).clients.find(p => p.id === f.a.id).draft.logo.startsWith(`data:${mime};base64,`));
  await page.reload({ waitUntil: 'load' }); await w.openProject(); await page.click('[data-tab="brand"]');
  await page.waitForFunction(() => { const img = document.querySelector('#live-preview .client-logo'); return img?.complete && img.naturalWidth > 0; });
});
for (const [key, label, expected] of [['invalidMime', 'unsupported file type', 'Choose a PNG'], ['tooLarge', 'over 1 MB', 'smaller than 1 MB'], ['corruptPng', 'corrupt image bytes', 'could not be read']]) test(`B-LOGO-${key}`, 'Branding', `Reject ${label}`, `Upload the ${label} synthetic fixture.`, 'Helpful rejection; no logo saved and no uncaught exception.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.openProject(); await page.click('[data-tab="brand"]'); await (await page.$('#brand-logo')).uploadFile(t.assets[key]);
  await page.waitForFunction(text => document.querySelector('#toast').textContent.includes(text), {}, expected); assert.equal((await w.state()).clients.find(p => p.id === f.a.id).draft.logo, '');
});
test('B-VERSIONS-01', 'Versions', 'Save/view versions, preview draft, reload and no-app validation', 'Save two versions with different branding; inspect history/draft; try saving a project with no apps.', 'Saved versions remain distinct; empty app selection cannot create a version.', async t => {
  const w = await t.workspace(); const { page, f } = w; await w.openProject(); await page.click('[data-action="publish"]'); await page.click('[data-tab="brand"]'); await w.fill('#brand-name', 'Version two'); await page.click('[data-action="publish"]'); await w.fill('#brand-name', 'Unsaved version three');
  await page.click('.demo-save-strip [data-preview-mode="published"]'); assert(await page.$eval('#dialog .client-top', n => n.textContent.includes('Version two'))); await page.click('#dialog [data-preview-mode="draft"]'); assert(await page.$eval('#dialog .client-top', n => n.textContent.includes('Unsaved version three'))); await page.click('[data-action="close-dialog"]');
  await page.click(`[data-manage-project="${f.a.id}"]`); await page.click('[data-preview-version="1"]'); assert(await page.$eval('#dialog .client-top', n => n.textContent.includes('QA Client Alpha'))); await page.click('[data-action="close-dialog"]');
  await page.reload({ waitUntil: 'load' }); await w.openProject(); await page.click(`[data-toggle-app="${f.app.id}"]`); await page.click('[data-action="publish"]'); assert(await page.$eval('#toast', n => n.textContent.includes('at least one app'))); assert.equal((await w.state()).clients.find(p => p.id === f.a.id).version, 2);
});
test('B-ACCESS-PREVIEW', 'Role preview', 'Administrator/Member/Viewer change only the displayed demo role', 'Select each role preview and inspect the solution preview.', 'Role label changes; UI explicitly says real authorization is not connected.', async t => {
  const w = await t.workspace(); const { page } = w; await w.openProject(); await page.click('[data-tab="access"]');
  for (const role of ['Administrator', 'Viewer', 'Member']) { await page.click(`[data-role="${role}"]`); assert(await page.$eval('#live-preview', (n, r) => n.textContent.includes(`Role preview: ${r}`), role)); }
  assert(await page.$eval('.access-explanation', n => n.textContent.includes('not connected')));
});
test('B-CONCEPT-PREVIEWS', 'Concept previews', 'Website/storefront navigation and Escape', 'Open public-site concept; navigate to app section/Studio; preview a commerce project and click collection.', 'Concept links/close controls work; no checkout or real deployment is falsely performed.', async t => {
  const w = await t.workspace({ custom: false, apps: ['commerce'] }); const { page } = w;
  await page.click('[data-action="platform-site"]'); await page.click('a[href="#site-apps"]'); assert(await page.$('.public-apps')); await page.click('[data-action="enter-studio"]'); assert.equal(await page.$eval('#dialog', n => n.open), false);
  await w.openProject(); await page.click('[data-preview]'); await page.click('#dialog [data-action="shop-collection"]'); assert(await page.$eval('#toast', n => n.textContent.includes('Checkout is not connected'))); await page.keyboard.press('Escape'); assert.equal(await page.$eval('#dialog', n => n.open), false);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 500 }, { width: 768, height: 1024 }, { width: 1024, height: 664 }, { width: 1440, height: 900 }]) test(`B-LAYOUT-${viewport.width}x${viewport.height}`, 'Responsive layout', `Operational layouts at ${viewport.width}×${viewport.height}`, 'Visit overview/client/project/library/editor/runtime; open client form and test its action positions.', 'No page-level horizontal overflow; modal client actions stay visible and clickable.', async t => {
  const w = await t.workspace(); const { page, f } = w; await page.setViewport(viewport);
  for (const nav of ['overview', 'clients', 'builder', 'apps']) {
    await page.click(`[data-nav="${nav}"]`);
    const bounds = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('#content *')].filter(n => n.getBoundingClientRect().right > innerWidth + 1).slice(0, 6).map(n => ({ element: n.tagName, className: n.className, right: Math.round(n.getBoundingClientRect().right) })) }));
    assert(bounds.document <= bounds.viewport + 1, `${nav} overflows: ${JSON.stringify(bounds)}`);
  }
  await page.click('[data-nav="clients"]'); await page.click('[data-action="new-client"]'); await page.focus('#client-notes');
  assert(await page.$$eval('.client-dialog-header button, .client-dialog-footer button', buttons => buttons.every(button => { const r = button.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; })));
  await page.keyboard.press('Escape'); await w.editor(); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'App editor overflows');
  await page.click(`[data-run-app="${f.app.id}"]`); assert(await page.$eval('#dialog', n => n.scrollWidth <= n.clientWidth + 1), 'Runtime dialog overflows');
});

for (const operation of ['client-create', 'project-create', 'record-save', 'default-prices']) test(`B-STORAGE-${operation}`, 'Persistence failure', `Storage failure during ${operation} is not reported as persisted success`, `Block Storage.setItem; perform ${operation}; inspect feedback and stored state.`, 'The operation clearly reports that changes are unsaved or storage failed; persisted state is unchanged.', async t => {
  const w = await t.workspace(); const { page, f } = w;
  if (operation === 'client-create') { await page.click('[data-nav="clients"]'); await page.click('[data-action="new-client"]'); await w.fill('#client-name', 'Unsaved client'); }
  if (operation === 'project-create') { await page.click('[data-nav="builder"]'); await page.click('[data-action="new-project"]'); await page.select('#new-project-client', f.ownerA.id); await w.fill('#new-project-name', 'Unsaved project'); }
  if (operation === 'record-save') { await w.editor(); await page.click(`[data-run-app="${f.app.id}"]`); await page.click('[data-runtime-page="form"]'); await w.fill('#runtime-record-form input[name="name"]', 'Unsaved record'); await page.select('#runtime-record-form select[name="status"]', 'New'); }
  if (operation === 'default-prices') { await page.click('[data-nav="apps"]'); await page.click('[data-price-book]'); await w.fill(`[data-price-id="${f.app.id}"][data-price-kind="monthly"]`, '80'); }
  const before = await w.state();
  await page.evaluate(() => { window.qaSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException('QA synthetic quota failure', 'QuotaExceededError'); }; });
  const selector = { 'client-create': '#client-details-form', 'project-create': '#new-project-form', 'record-save': '#runtime-record-form', 'default-prices': '#price-book-form' }[operation];
  await page.click(`${selector} button[type="submit"]`);
  const message = await page.$eval('#toast', n => n.textContent); assert.deepEqual(await w.state(), before);
  assert.match(message, /storage|not saved|not persist|only.*tab|could not.*save/i, `Misleading feedback after persistence failure: ${message}`);
}, 'High');
test('B-STORAGE-VERSION', 'Persistence failure', 'Saved-version storage failure is atomic and explicit', 'Block Storage.setItem and save a new demo version.', 'No version increment and explicit failed-save feedback.', async t => {
  const w = await t.workspace(); const { page } = w; await w.openProject(); const before = await w.state();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('QA storage denial'); }; }); await page.click('[data-action="publish"]');
  assert.deepEqual(await w.state(), before); assert(await page.$eval('#toast', n => n.textContent.includes('kept unchanged')));
});
test('B-STORAGE-MULTITAB', 'Persistence failure', 'Two tabs must not silently overwrite each other', 'Open two same-origin tabs before edits; create a different client in each; inspect stored data.', 'Both clients survive, or a clear conflict prevents overwriting the first tab.', async t => {
  const w = await t.workspace(); const { page, context } = w; const second = await context.newPage(); await second.goto(t.url, { waitUntil: 'load' });
  await page.bringToFront();
  await page.click('[data-nav="clients"]'); await page.click('[data-action="new-client"]'); await w.fill('#client-name', 'QA Tab Alpha'); await page.click('#client-details-form button[type="submit"]');
  await second.bringToFront();
  await second.click('[data-nav="clients"]'); await second.click('[data-action="new-client"]'); await second.type('#client-name', 'QA Tab Beta'); await second.click('#client-details-form button[type="submit"]');
  const names = await second.evaluate(key => JSON.parse(localStorage.getItem(key)).clientProfiles.map(c => c.name), STORAGE_KEY); const feedback = await second.$eval('#toast', n => n.textContent);
  assert(names.includes('QA Tab Alpha') && (names.includes('QA Tab Beta') || /conflict|another tab/i.test(feedback)), `First tab's client was lost. Persisted names: ${names.join(', ')}; feedback: ${feedback}`);
}, 'High');
test('B-STORAGE-CORRUPT', 'Recovery', 'Structurally invalid saved state has a usable recovery path', 'Load schema 1 with a project missing its draft object.', 'Show usable recovery feedback; do not crash to a blank application.', async t => {
  const w = await t.workspace({ raw: JSON.stringify({ schema: 1, clients: [{ id: 'broken-project' }], activity: [] }) });
  assert(await w.page.$('#content, [role="alert"]'), 'No application or recovery UI rendered for malformed stored project.');
}, 'Medium');
test('B-STORAGE-FUTURE', 'Recovery', 'Unrecognized saved schema is not silently replaced', 'Load a synthetic workspace with a future schema number.', 'Keep original data and show recovery/version feedback rather than silently creating an empty workspace.', async t => {
  const original = JSON.stringify({ schema: 999, clients: [], futureMarker: 'QA preserve this payload' }); const w = await t.workspace({ raw: original });
  const stored = await w.page.evaluate(key => localStorage.getItem(key), STORAGE_KEY); const text = await w.page.$eval('body', n => n.textContent);
  const backupRetained = await w.page.evaluate(key => localStorage.getItem(`${key}-before-builder-v2`) !== null, STORAGE_KEY);
  assert(stored === original || /recover|unsupported.*version|backup.*restor|newer.*version/i.test(text), `Unknown schema was replaced without visible recovery/version feedback. Raw legacy backup retained: ${backupRetained}.`);
}, 'Medium');
test('B-STARTUP-STORAGE-DENIED', 'Recovery', 'Initial storage denial still renders the workspace', 'Deny all localStorage get/set calls before first page load.', 'App remains usable in memory and explains storage unavailability.', async t => {
  const w = await t.workspace({ denyStorage: true }); assert(await w.page.$('#content')); assert(await w.page.$eval('#toast', n => /storage/i.test(n.textContent)));
});
