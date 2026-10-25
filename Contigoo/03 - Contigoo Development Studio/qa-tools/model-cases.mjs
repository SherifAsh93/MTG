import assert from 'node:assert/strict';
import { initialState, saveClientProfile, createProject, updateProjectDetails, deleteClientProfile, deleteProject, addEntity, addField, deleteEntity, toggleApp, publishClient, publicationHistory, setProjectArchived, templates, modules } from '../prototype/model.mjs';
import { enhanceState, catalog, createCustomApp, definitionFor, addAppEntity, addAppField, addAppPage, addWorkflow, moveItem, saveDemoRecord, recordsFor, reusableTemplate, moneyToCents, setProjectPrice, setQuoteSettings, quoteFor } from '../prototype/builder-model.mjs';
import { legacyDemoState } from '../prototype/test-fixtures.mjs';
import { fixture } from './fixtures.mjs';

export const modelCases = [];
const test = (id, area, title, steps, expected, run) => modelCases.push({ id, area, title, steps, expected, layer: 'Model', run });
const snapshot = value => JSON.stringify(value);
const maxEmail = size => 'a'.repeat(size - '@example.test'.length) + '@example.test';

test('M-START-01', 'Startup', 'Empty first workspace and idempotent enhancement', 'Create initial state; enhance twice; compare saved structure.', 'No synthetic clients/projects; enhancement creates no duplicates.', () => {
  const s = enhanceState(initialState()); const before = snapshot(s); enhanceState(s);
  assert.equal(snapshot(s), before); assert.equal(s.clients.length, 0); assert.equal(s.clientProfiles.length, 0);
});
test('M-MIGRATE-01', 'Migration', 'Legacy records and publication survive upgrade', 'Enhance historical synthetic state twice; inspect original IDs, fields and saved configurations.', 'Legacy IDs, fields and published data remain; exactly one profile per earlier project.', () => {
  const s = legacyDemoState(); const before = structuredClone(s.clients); enhanceState(s); enhanceState(s);
  assert.equal(s.clientProfiles.length, before.length);
  for (const [i, p] of s.clients.entries()) { assert.equal(p.id, before[i].id); assert.deepEqual(p.published, before[i].published); assert.deepEqual(p.draft.fields, before[i].draft.fields); }
});

for (const [key, limit] of Object.entries({ name: 60, industry: 60, contact: 80, email: 120, phone: 40, address: 240, notes: 2000 })) {
  test(`M-CLIENT-${key}-MAX`, 'Clients', `${key}: maximum accepted length`, `Create client with ${key} at ${limit} characters.`, 'Value is accepted and preserved without creating a project.', () => {
    const s = enhanceState(initialState()); const value = key === 'email' ? maxEmail(limit) : 'x'.repeat(limit);
    const p = saveClientProfile(s, { name: 'QA limit', [key]: value }); assert.equal(p[key], value); assert.equal(s.clients.length, 0);
  });
  test(`M-CLIENT-${key}-OVER`, 'Clients', `${key}: over-limit rejected atomically`, `Try client creation with ${key} at ${limit + 1} characters.`, 'Validation rejects it; no client is inserted.', () => {
    const s = enhanceState(initialState()); const value = key === 'email' ? maxEmail(limit + 1) : 'x'.repeat(limit + 1);
    assert.throws(() => saveClientProfile(s, { name: 'QA limit', [key]: value }), /at most/); assert.equal(s.clientProfiles.length, 0);
  });
}
for (const [id, name] of [['EMPTY', ''], ['SPACE', '   ']]) test(`M-CLIENT-${id}`, 'Clients', 'Blank client name is rejected', 'Submit empty/whitespace client name.', 'No client is created.', () => {
  const s = enhanceState(initialState()); assert.throws(() => saveClientProfile(s, { name }), /client name/); assert.equal(s.clientProfiles.length, 0);
});
test('M-CLIENT-EMAIL', 'Clients', 'Invalid contact email does not mutate an existing client', 'Edit a valid client with an invalid email.', 'Existing profile remains identical.', () => {
  const f = fixture(); const before = snapshot(f.ownerA);
  assert.throws(() => saveClientProfile(f.state, { name: 'New name', email: 'broken@' }, f.ownerA.id), /valid contact email/); assert.equal(snapshot(f.ownerA), before);
});
test('M-CLIENT-DUP', 'Clients', 'Same client names retain distinct identities', 'Create two client profiles with the same name and separate projects.', 'No merging or cross-linking by display name.', () => {
  const s = enhanceState(initialState()); const a = saveClientProfile(s, { name: 'Same name' }); const b = saveClientProfile(s, { name: 'Same name' });
  assert.notEqual(a.id, b.id); assert.equal(s.clientProfiles.length, 2);
});
test('M-CLIENT-DELETE', 'Clients', 'Client cascade requires consent and preserves other state', 'Try deleting a client with projects without consent; then confirm.', 'First attempt changes nothing; confirmed deletion affects only that client/projects.', () => {
  const f = fixture(); const before = snapshot(f.state); const other = structuredClone(f.b); const apps = structuredClone(f.state.customApps);
  assert.throws(() => deleteClientProfile(f.state, f.ownerA.id), /Confirm/); assert.equal(snapshot(f.state), before);
  deleteClientProfile(f.state, f.ownerA.id, { deleteProjects: true }); assert.deepEqual(f.state.clients, [other]); assert.deepEqual(f.state.customApps, apps);
});

for (const [id, input, error] of [
  ['OWNER', { clientId: 'missing', name: 'QA' }, /existing client/],
  ['NAME', { name: ' ' }, /project name/],
  ['NAME-LONG', { name: 'x'.repeat(61) }, /project name/],
  ['DESC-LONG', { name: 'QA', description: 'x'.repeat(501) }, /description/],
  ['STARTER', { name: 'QA', templateId: 'unknown' }, /valid template/],
]) test(`M-PROJECT-${id}`, 'Projects', `Invalid project ${id.toLowerCase()}`, 'Attempt project creation with the specified invalid reference/value.', 'No project or client is added/changed.', () => {
  const f = fixture({ custom: false }); const before = snapshot(f.state);
  assert.throws(() => createProject(f.state, { clientId: f.ownerA.id, ...input }), error); assert.equal(snapshot(f.state), before);
});
test('M-PROJECT-MAX', 'Projects', 'Maximum project name/description and independent branding', 'Create a project with 60-character name/500-character description; rename its metadata.', 'Limits accepted; project metadata is separate from client name and app branding.', () => {
  const f = fixture(); const p = createProject(f.state, { clientId: f.ownerA.id, name: 'x'.repeat(60), description: 'y'.repeat(500) });
  updateProjectDetails(p, { name: 'New project label', description: 'Updated' }); assert.equal(p.draft.name, f.ownerA.name); assert.notEqual(p.name, p.draft.name);
});
test('M-PROJECT-ARCHIVE', 'Projects', 'Archive/reactivate retains versions and records', 'Save a version, archive, try saving while archived, then reactivate.', 'Archive blocks publication; data survives round-trip.', () => {
  const f = fixture(); publishClient(f.a); const before = snapshot(f.a.published); setProjectArchived(f.a, true); assert.throws(() => publishClient(f.a), /Reactivate/);
  setProjectArchived(f.a, false); assert.equal(snapshot(f.a.published), before);
});
test('M-PROJECT-DELETE', 'Projects', 'Delete one project without deleting its owner', 'Remove one project from a two-client workspace.', 'Client profiles, the other project and shared templates survive.', () => {
  const f = fixture(); const clients = snapshot(f.state.clientProfiles); const apps = snapshot(f.state.customApps);
  deleteProject(f.state, f.a.id); assert.equal(snapshot(f.state.clientProfiles), clients); assert.equal(snapshot(f.state.customApps), apps); assert.equal(f.state.clients[0].id, f.b.id);
});

test('M-SHARED-LIMITS', 'Shared data', 'Entity/field boundaries and duplicate validation', 'Add a 35-character entity and 45-character field; try longer/duplicate names.', 'Limits accepted; invalid entries rejected without duplicates.', () => {
  const f = fixture(); const e = 'x'.repeat(35); addEntity(f.a, e); addField(f.a, { entity: e, label: 'f'.repeat(45), type: 'Text' });
  assert.throws(() => addEntity(f.a, 'x'.repeat(36))); assert.throws(() => addEntity(f.a, e.toUpperCase()), /already/);
  assert.throws(() => addField(f.a, { entity: e, label: 'f'.repeat(46), type: 'Text' })); assert.equal(f.a.draft.fields.length, 1);
});
test('M-SHARED-DELETE', 'Shared data', 'Deleting all shared entities keeps app data and saved snapshots', 'Save a version containing a shared field; confirm entity deletion and then remove the last empty entity.', 'No shared entities remain; saved version/app definitions are intact.', () => {
  const f = fixture(); addEntity(f.a, 'Obsolete'); addField(f.a, { entity: 'Obsolete', label: 'Details', type: 'Text' }); publishClient(f.a);
  const before = snapshot(f.a.published); const def = snapshot(f.a.draft.appDefinitions);
  assert.throws(() => deleteEntity(f.a, 'Obsolete'), /Confirm/); deleteEntity(f.a, 'Obsolete', { deleteFields: true }); deleteEntity(f.a, 'Record');
  assert.equal(f.a.draft.entities.length, 0); assert.equal(snapshot(f.a.published), before); assert.equal(snapshot(f.a.draft.appDefinitions), def);
});

for (const starter of templates) test(`M-STARTER-${starter.id}`, 'Starters', `${starter.name}: independent configuration`, `Create two projects from ${starter.name}; modify one.`, 'Valid module IDs, no duplicates, no copied mutations between projects.', () => {
  const f = fixture({ custom: false }); const a = createProject(f.state, { clientId: f.ownerA.id, name: 'A', templateId: starter.id }); const b = createProject(f.state, { clientId: f.ownerB.id, name: 'B', templateId: starter.id });
  assert.deepEqual(a.draft.apps, starter.apps); assert.equal(new Set(a.draft.apps).size, a.draft.apps.length); assert(a.draft.apps.every(id => modules.some(m => m.id === id)));
  addEntity(a, 'Only A'); assert(!b.draft.entities.includes('Only A'));
});
test('M-CUSTOM-INVALID', 'App builder', 'Duplicate custom app and invalid pricing reject atomically', 'Try a duplicate app name, then an invalid new-app price.', 'Catalog, project selections and price book remain unchanged.', () => {
  const f = fixture(); const before = snapshot(f.state);
  assert.throws(() => createCustomApp(f.state, f.a, { name: f.app.name.toUpperCase(), entityName: 'Entry', monthly: '1', setup: '0' }), /already/);
  assert.throws(() => createCustomApp(f.state, f.a, { name: 'Invalid app', entityName: 'Entry', monthly: '-1', setup: '0' })); assert.equal(snapshot(f.state), before);
});
test('M-APP-ENTITY', 'App builder', 'New app entity creates independent fields/list', 'Add a second entity, then try duplicate/blank/over-limit entity names.', 'New entity/list exists; invalid names add nothing.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); const e = addAppEntity(d, 'Shipment');
  assert(d.pages.some(p => p.entityId === e.id && p.kind === 'List')); assert.equal(e.fields.length, 1);
  for (const name of ['shipment', '', 'x'.repeat(36)]) assert.throws(() => addAppEntity(d, name)); assert.equal(d.entities.length, 2);
});
test('M-APP-FIELDS', 'App builder', 'Choice normalization and invalid schema references', 'Add duplicate/trimmed choices; try unsupported type, empty choices and unknown entity.', 'Choices are normalized once; invalid definitions are rejected.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); const field = addAppField(d, { entityId: 'records', label: 'Priority', type: 'Choice', options: ' High, Low,High, ' });
  assert.deepEqual(field.options, ['High', 'Low']); const before = snapshot(d);
  for (const data of [{ type: 'Script' }, { type: 'Choice', options: ', ' }, { type: 'Text', entityId: 'missing' }, { type: 'Text', label: 'priority' }]) assert.throws(() => addAppField(d, { entityId: 'records', label: 'New field', ...data }));
  assert.equal(snapshot(d), before);
});
test('M-APP-PAGES', 'App builder', 'All page types and invalid page definitions', 'Add Dashboard/List/Form/Content pages; try unknown entity/type and an overlong name.', 'Valid pages bind to the selected entity; invalid pages are rejected; content is bounded.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id);
  for (const kind of ['Dashboard', 'List', 'Form', 'Content']) addAppPage(d, { name: kind, kind, entityId: 'records', body: 'x'.repeat(2100) });
  assert.equal(d.pages.at(-1).body.length, 2000); const before = snapshot(d);
  for (const data of [{ kind: 'Script' }, { entityId: 'missing' }, { name: 'x'.repeat(46) }]) assert.throws(() => addAppPage(d, { name: 'Page', kind: 'List', entityId: 'records', ...data })); assert.equal(snapshot(d), before);
});
test('M-APP-MOVE', 'App builder', 'Ordering stays stable at boundaries', 'Move first item up, last down, missing item; then reorder a valid item.', 'Invalid/boundary moves are no-ops; valid move swaps the requested neighbors.', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]; const before = snapshot(items);
  moveItem(items, 'a', -1); moveItem(items, 'c', 1); moveItem(items, 'missing', 1); assert.equal(snapshot(items), before);
  moveItem(items, 'b', -1); assert.deepEqual(items.map(i => i.id), ['b', 'a', 'c']);
});

const typedCases = [
  ['TEXT', 'Text', ' Hello ', 'Hello', undefined], ['NUMBER', 'Number', '-12.5', -12.5, 'not-number'],
  ['NUMBER-ZERO', 'Number', '0', 0, 'Infinity'], ['EMAIL', 'Email', 'qa@example.test', 'qa@example.test', 'wrong@'],
  ['DATE', 'Date', '2028-02-29', '2028-02-29', '2026-02-29'], ['DATE-OVERFLOW', 'Date', '2026-01-31', '2026-01-31', '2026-02-30'],
  ['CHOICE', 'Choice', 'Yes', 'Yes', 'Unknown'], ['BOOL-TRUE', 'Yes / No', 'on', true, undefined], ['BOOL-FALSE', 'Yes / No', false, false, undefined],
];
for (const [id, type, value, expectedValue, invalid] of typedCases) {
  test(`M-RECORD-${id}`, 'Records', `${type} typed record value (${id})`, 'Add a typed field and save a record with the specified valid value.', 'Value is normalized to the correct type; other project has no records.', () => {
    const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); const field = addAppField(d, { entityId: 'records', label: 'Typed value', type, required: true, options: 'Yes,No' });
    const r = saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Entry', status: 'New', [field.id]: value }); assert.equal(r.values[field.id], expectedValue); assert.equal(recordsFor(f.b, f.app.id, 'records').length, 0);
  });
  if (invalid !== undefined) test(`M-RECORD-${id}-INVALID`, 'Records', `${type} invalid value (${id})`, 'Save a record with an invalid typed value.', 'Validation fails and no record/log is committed.', () => {
    const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); const field = addAppField(d, { entityId: 'records', label: 'Typed value', type, required: true, options: 'Yes,No' });
    assert.throws(() => saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Entry', status: 'New', [field.id]: invalid })); assert.equal(recordsFor(f.a, f.app.id, 'records').length, 0); assert.equal(f.a.workflowLog.length, 0);
  });
}
test('M-RECORD-REQUIRED', 'Records', 'Missing and whitespace required values reject', 'Submit records without required name/status or with a whitespace name.', 'No record is committed.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id);
  for (const values of [{ name: '', status: 'New' }, { name: ' ', status: 'New' }, { name: 'Valid', status: '' }]) assert.throws(() => saveDemoRecord(f.a, f.app.id, d, 'records', values)); assert.equal(recordsFor(f.a, f.app.id, 'records').length, 0);
});
test('M-RECORD-SCOPE', 'Records', 'Unknown input fields and disabled modules', 'Save with an extra admin flag; deselect the module and try another save.', 'Unconfigured values are dropped; deselected app cannot save.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); const r = saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Entry', status: 'New', admin: true });
  assert.equal(r.values.admin, undefined); toggleApp(f.a, f.app.id, catalog(f.state)); assert.throws(() => saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Blocked', status: 'New' }), /Add this app/);
});
test('M-RULES-ORDER', 'Workflows', 'Ordered conditional rules, disabled rules and edit semantics', 'Add matching set/note rules plus a disabled rule; create then edit a record.', 'Rules run in order once on creation; disabled rules and updates do not rerun them.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id);
  addWorkflow(d, { name: 'Start', entityId: 'records', conditionField: 'status', conditionValue: 'New', action: 'set', targetField: 'status', value: 'In progress' });
  addWorkflow(d, { name: 'Finish', entityId: 'records', conditionField: 'status', conditionValue: 'In progress', action: 'set', targetField: 'status', value: 'Complete' });
  addWorkflow(d, { name: 'Log', entityId: 'records', action: 'note', value: 'Created once' });
  addWorkflow(d, { name: 'Disabled', entityId: 'records', action: 'note', value: 'Must not execute' }); d.workflows.at(-1).enabled = false;
  const r = saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Entry', status: 'New' }); assert.equal(r.values.status, 'Complete'); assert.equal(f.a.workflowLog.length, 1);
  saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Edited', status: 'New' }, r.id); assert.equal(f.a.workflowLog.length, 1); assert.equal(recordsFor(f.a, f.app.id, 'records')[0].values.status, 'New');
});
test('M-RULES-INVALID', 'Workflows', 'Invalid rules are rejected before insertion', 'Try unknown entity, condition field, action, target and invalid target choice.', 'No workflow is inserted.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id);
  for (const change of [{ entityId: 'bad' }, { conditionField: 'bad' }, { action: 'script' }, { targetField: 'bad' }, { value: 'Invalid status' }]) assert.throws(() => addWorkflow(d, { name: 'Rule', entityId: 'records', action: 'set', targetField: 'status', value: 'Complete', ...change })); assert.equal(d.workflows.length, 0);
});
test('M-RULES-ATOMIC', 'Workflows', 'Rule failure does not partially create records/logs', 'Introduce a rule referencing a missing target after a valid note rule; save.', 'No record or activity log is committed.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); addWorkflow(d, { name: 'Note', entityId: 'records', action: 'note', value: 'Pending' });
  d.workflows.push({ id: 'invalid-rule', name: 'Invalid reference', entityId: 'records', action: 'set', targetField: 'missing', value: 'bad', enabled: true });
  assert.throws(() => saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Entry', status: 'New' }), /missing field/); assert.equal(f.a.workflowLog.length, 0); assert.equal(recordsFor(f.a, f.app.id, 'records').length, 0);
});
test('M-TEMPLATE-REUSE', 'Templates', 'Saved template copies configuration but not records/prices', 'Customize an app, save a record and template, then install it in a third project.', 'Schema/rules are copied; records/prices and existing instances remain independent.', () => {
  const f = fixture(); const d = definitionFor(f.state, f.a, f.app.id); addAppField(d, { entityId: 'records', label: 'Reference', type: 'Text' });
  saveDemoRecord(f.a, f.app.id, d, 'records', { name: 'Private synthetic row', status: 'New' }); reusableTemplate(f.state, f.a, f.app.id);
  const c = createProject(f.state, { clientId: f.ownerB.id, name: 'Third project' }); toggleApp(c, f.app.id, catalog(f.state)); enhanceState(f.state);
  assert.equal(definitionFor(f.state, c, f.app.id).entities[0].fields.length, 3); assert.equal(recordsFor(c, f.app.id, 'records').length, 0);
  assert.equal(definitionFor(f.state, f.b, f.app.id).entities[0].fields.length, 2);
});

for (const [id, input, value] of [['ZERO', '0', 0], ['CENT', '0.01', 1], ['DECIMAL', '123.45', 12345], ['MAX', '9999999.99', 999999999]]) test(`M-MONEY-${id}`, 'Pricing', `Valid money ${input}`, 'Parse the supported amount to minor units.', 'Exact integer arithmetic; no binary fraction stored.', () => assert.equal(moneyToCents(input), value));
for (const [id, input] of [['NEGATIVE', '-1'], ['PRECISION', '1.001'], ['EXPONENT', '1e3'], ['NAN', 'NaN'], ['INFINITY', 'Infinity'], ['EMPTY', ''], ['MAX-OVER', '10000000']]) test(`M-MONEY-${id}`, 'Pricing', `Reject unsupported money ${id.toLowerCase()}`, 'Pass an invalid amount to the model.', 'Validation rejects it.', () => assert.throws(() => moneyToCents(input)));
test('M-QUOTE-DISCOUNT', 'Pricing', 'Zero/full discount and setup separation', 'Set base and app amounts; apply 100% recurring discount.', 'Monthly becomes zero; setup is not discounted; first payment equals setup.', () => {
  const f = fixture(); setProjectPrice(f.state, f.a, f.app.id, '25.50', '12.25'); setQuoteSettings(f.a, '10', '3', '100'); const q = quoteFor(f.a.draft);
  assert.equal(q.monthly, 0); assert.equal(q.setup, 1525); assert.equal(q.firstPayment, 1525); assert.throws(() => setQuoteSettings(f.a, '0', '0', '100.01'));
});
test('M-QUOTE-SNAPSHOT', 'Pricing', 'Default/project/saved price independence', 'Publish a priced project, change default and project prices, remove/re-add the module.', 'Existing saved quote is immutable; removed line contributes zero; override returns on re-add.', () => {
  const f = fixture(); publishClient(f.a); const old = quoteFor(f.a.published).monthly; f.state.priceBook[f.app.id].monthly = 8000; enhanceState(f.state);
  assert.equal(quoteFor(f.a.draft).monthly, old); setProjectPrice(f.state, f.a, f.app.id, '99', '8'); toggleApp(f.a, f.app.id, catalog(f.state)); assert.equal(quoteFor(f.a.draft).monthly, 0);
  toggleApp(f.a, f.app.id, catalog(f.state)); assert.equal(quoteFor(f.a.draft).monthly, 9900); assert.equal(quoteFor(f.a.published).monthly, old);
});
test('M-VERSIONS', 'Versions', 'Repeated versioning preserves earlier schema snapshots', 'Save twice with an intervening rename; edit draft again.', 'Monotonic history; earlier and latest saved versions remain unchanged.', () => {
  const f = fixture(); publishClient(f.a); f.a.draft.name = 'Second branding'; publishClient(f.a); f.a.draft.name = 'Third draft'; const h = publicationHistory(f.a);
  assert.deepEqual(h.map(v => v.version), [2, 1]); assert.equal(h[0].config.name, 'Second branding'); assert.equal(h[1].config.name, f.ownerA.name);
});
