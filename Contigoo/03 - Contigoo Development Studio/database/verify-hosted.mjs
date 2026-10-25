import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { serviceSettings, settingsFor, connect, ident, safeCode } from './hosted.mjs';
import { migrate, migrationFiles } from './migrate.mjs';

const config = await serviceSettings();
const entry = config.environments.test;
if (entry.database !== 'contigoo_studio_test' || entry.database === config.environments.development.database) throw new Error('Only the explicitly isolated test database may be exercised.');
const root = path.dirname(fileURLToPath(import.meta.url));
const results = [];
const ids = Object.fromEntries(['owner', 'manager', 'viewer', 'disabled', 'clientA', 'clientB', 'projectA', 'projectB', 'rollbackClient'].map(key => [key, randomUUID()]));
const principalIds = [ids.owner, ids.manager, ids.viewer, ids.disabled];
let migrator; let app; let seeded = false;
async function check(name, action) {
  try { await action(); results.push({ name, status: 'Passed' }); console.log(`PASS: ${name}`); }
  catch (error) { results.push({ name, status: 'Failed', code: safeCode(error) }); console.error(`FAIL: ${name} (${safeCode(error)})`); throw error; }
}
async function asActor(client, actor, action) {
  await client.query('BEGIN');
  try {
    if (actor !== null) await client.query("SELECT set_config('contigoo.actor_id',$1,true)", [actor]);
    return await action(client);
  } finally { await client.query('ROLLBACK'); }
}
const rejected = (action, code) => assert.rejects(action, error => error.code === code);

try {
  migrator = await connect(settingsFor(config, 'test', 'migrator'));
  await check('Hosted schema migrations apply and repeat without changes', async () => {
    await migrate(migrator, entry.app.user);
    assert.deepEqual(await migrate(migrator, entry.app.user), []);
  });
  const total = await migrator.query(`SELECT (SELECT count(*) FROM studio.principals) +
    (SELECT count(*) FROM studio.clients) + (SELECT count(*) FROM studio.projects) +
    (SELECT count(*) FROM studio.project_assignments) + (SELECT count(*) FROM studio.audit_events) AS count`);
  if (Number(total.rows[0].count) !== 0) throw new Error('Test database contains existing data; refusing to reset it.');
  await migrator.query('BEGIN');
  try {
    await migrator.query("SELECT set_config('contigoo.actor_id',$1,true)", [ids.owner]);
    for (const [name, kind, active] of [['owner', 'owner', true], ['manager', 'employee', true], ['viewer', 'employee', true], ['disabled', 'employee', false]]) {
      await migrator.query('INSERT INTO studio.principals(id,issuer,subject,kind,active) VALUES ($1,$2,$3,$4,$5)',
        [ids[name], 'https://synthetic-identity.example.invalid', randomUUID(), kind, active]);
    }
    for (const key of ['A', 'B']) {
      await migrator.query('INSERT INTO studio.clients(id,name) VALUES ($1,$2)', [ids[`client${key}`], `Synthetic QA client ${key}`]);
      await migrator.query('INSERT INTO studio.projects(id,client_id,name) VALUES ($1,$2,$3)', [ids[`project${key}`], ids[`client${key}`], `Synthetic QA project ${key}`]);
    }
    for (const name of ['manager', 'viewer', 'disabled']) {
      await migrator.query('INSERT INTO studio.project_assignments(principal_id,project_id,can_manage) VALUES ($1,$2,$3)', [ids[name], ids.projectA, name !== 'viewer']);
    }
    await migrator.query('COMMIT'); seeded = true;
  } catch (error) { await migrator.query('ROLLBACK'); throw error; }
  app = await connect(settingsFor(config, 'test', 'app'));
  await check('Runtime roles have no superuser, role creation, DB creation or RLS bypass', async () => {
    const result = await app.query('SELECT rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user');
    assert(Object.values(result.rows[0]).every(value => value === false));
    const memberships = await app.query('SELECT count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname=current_user');
    assert.equal(Number(memberships.rows[0].count), 0);
  });
  await check('Missing transaction identity denies all client/project rows', () => asActor(app, null, async c => {
    assert.equal((await c.query('SELECT id FROM studio.clients')).rowCount, 0);
    assert.equal((await c.query('SELECT id FROM studio.projects')).rowCount, 0);
    await rejected(() => c.query("INSERT INTO studio.clients(name) VALUES ('Synthetic blocked')"), '42501');
  }));
  await check('Owner can manage clients/projects and changes produce audit rows', () => asActor(app, ids.owner, async c => {
    assert.equal((await c.query('SELECT id FROM studio.clients')).rowCount, 2);
    assert.equal((await c.query('SELECT id FROM studio.projects')).rowCount, 2);
    await c.query('UPDATE studio.projects SET draft_model=$1 WHERE id=$2', [{ entities: [] }, ids.projectA]);
    assert.equal((await c.query("SELECT id FROM studio.audit_events WHERE record_id=$1 AND action='UPDATE'", [ids.projectA])).rowCount, 1);
  }));
  await check('Employees see only assigned projects and their related clients', () => asActor(app, ids.manager, async c => {
    assert.deepEqual((await c.query('SELECT id FROM studio.projects')).rows.map(r => r.id), [ids.projectA]);
    assert.deepEqual((await c.query('SELECT id FROM studio.clients')).rows.map(r => r.id), [ids.clientA]);
    assert.equal((await c.query("UPDATE studio.projects SET name='Synthetic blocked' WHERE id=$1", [ids.projectB])).rowCount, 0);
    assert.equal((await c.query('SELECT id FROM studio.audit_events')).rowCount, 0);
  }));
  await check('Delegated manager can update assigned project lifecycle', () => asActor(app, ids.manager, async c => {
    const updated = await c.query("UPDATE studio.projects SET status='archived' WHERE id=$1 RETURNING revision", [ids.projectA]);
    assert.equal(updated.rowCount, 1); assert.equal(Number(updated.rows[0].revision), 2);
  }));
  await check('Read-only employee cannot update or delete assigned projects', () => asActor(app, ids.viewer, async c => {
    assert.equal((await c.query("UPDATE studio.projects SET status='archived' WHERE id=$1", [ids.projectA])).rowCount, 0);
    assert.equal((await c.query('DELETE FROM studio.projects WHERE id=$1', [ids.projectA])).rowCount, 0);
  }));
  await check('Delegated management cannot edit the Studio application model', () => asActor(app, ids.manager, async c => {
    await rejected(() => c.query('UPDATE studio.projects SET draft_model=$1 WHERE id=$2', [{ entities: [] }, ids.projectA]), '42501');
  }));
  await check('Disabled identities have no access even with saved assignments', () => asActor(app, ids.disabled, async c => {
    assert.equal((await c.query('SELECT id FROM studio.projects')).rowCount, 0);
  }));
  await check('Unknown and malformed identities fail closed', async () => {
    for (const actor of [randomUUID(), 'not-a-uuid']) await asActor(app, actor, async c => assert.equal((await c.query('SELECT id FROM studio.clients')).rowCount, 0));
  });
  await check('Transaction-local identity does not leak when a connection is reused', async () => {
    await asActor(app, ids.owner, async c => assert.equal((await c.query('SELECT id FROM studio.clients')).rowCount, 2));
    assert.equal((await app.query('SELECT id FROM studio.clients')).rowCount, 0);
  });
  await check('Runtime cannot modify identity or assignment tables', async () => {
    for (const sql of ["UPDATE studio.principals SET kind='owner'", 'DELETE FROM studio.project_assignments']) {
      await asActor(app, ids.manager, async c => rejected(() => c.query(sql), '42501'));
    }
  });
  await check('Runtime cannot reparent projects, change IDs or forge revisions', async () => {
    for (const [column, value] of [['client_id', ids.clientB], ['id', randomUUID()], ['revision', 42]]) {
      await asActor(app, ids.owner, async c => rejected(() => c.query(`UPDATE studio.projects SET ${ident(column)}=$1 WHERE id=$2`, [value, ids.projectA]), '42501'));
    }
  });
  await check('Client creation does not provision an identity; second owner is prohibited', async () => {
    await asActor(app, ids.owner, async c => c.query("INSERT INTO studio.clients(name) VALUES ('Synthetic standalone client')"));
    assert.equal(Number((await migrator.query('SELECT count(*) FROM studio.principals')).rows[0].count), 4);
    await rejected(() => migrator.query("INSERT INTO studio.principals(issuer,subject,kind) VALUES ('https://synthetic.example.invalid',$1,'owner')", [randomUUID()]), '23505');
  });
  await check('Relational constraints reject orphans and require explicit related-project deletion', async () => {
    await asActor(app, ids.owner, async c => rejected(() => c.query('INSERT INTO studio.projects(client_id,name) VALUES ($1,$2)', [randomUUID(), 'Synthetic orphan']), '23503'));
    await asActor(app, ids.owner, async c => rejected(() => c.query('DELETE FROM studio.clients WHERE id=$1', [ids.clientA]), '23503'));
    await asActor(app, ids.owner, async c => {
      await c.query('DELETE FROM studio.projects WHERE id=$1', [ids.projectA]);
      assert.equal((await c.query('DELETE FROM studio.clients WHERE id=$1', [ids.clientA])).rowCount, 1);
      assert.equal((await c.query('SELECT id FROM studio.projects WHERE id=$1', [ids.projectB])).rowCount, 1);
    });
  });
  await check('Basic data constraints reject blank names and non-object metadata', async () => {
    await asActor(app, ids.owner, async c => rejected(() => c.query("INSERT INTO studio.clients(name) VALUES ('  ')"), '23514'));
    await asActor(app, ids.owner, async c => rejected(() => c.query("UPDATE studio.projects SET draft_model='[]'::jsonb WHERE id=$1", [ids.projectA]), '23514'));
  });
  await check('Record writes and their audit rows roll back together', async () => {
    await asActor(app, ids.owner, async c => {
      await c.query('INSERT INTO studio.clients(id,name) VALUES ($1,$2)', [ids.rollbackClient, 'Synthetic rollback']);
      assert.equal((await c.query('SELECT id FROM studio.audit_events WHERE record_id=$1', [ids.rollbackClient])).rowCount, 1);
    });
    assert.equal((await migrator.query('SELECT id FROM studio.clients WHERE id=$1', [ids.rollbackClient])).rowCount, 0);
    assert.equal((await migrator.query('SELECT id FROM studio.audit_events WHERE record_id=$1', [ids.rollbackClient])).rowCount, 0);
  });
  await check('Runtime cannot alter audit rows, schema or migration history, or assume migration role', async () => {
    for (const sql of ['DELETE FROM studio.audit_events', 'CREATE TABLE studio.forbidden(id int)',
      'SELECT * FROM contigoo_migrations.history', `SET ROLE ${ident(entry.migrator.user)}`]) {
      await asActor(app, ids.owner, async c => rejected(() => c.query(sql), '42501'));
    }
    await asActor(app, ids.manager, async c => {
      await c.query('SET LOCAL row_security=off');
      await rejected(() => c.query('SELECT * FROM studio.projects'), '42501');
    });
  });
  await check('Revision-conditional writes reject a stale second connection update', async () => {
    const second = await connect(settingsFor(config, 'test', 'app'));
    try {
      const original = (await migrator.query('SELECT revision FROM studio.projects WHERE id=$1', [ids.projectA])).rows[0].revision;
      for (const client of [app, second]) { await client.query('BEGIN'); await client.query("SELECT set_config('contigoo.actor_id',$1,true)", [ids.owner]); }
      const a = await app.query("UPDATE studio.projects SET name='Synthetic revision winner' WHERE id=$1 AND revision=$2", [ids.projectA, original]);
      assert.equal(a.rowCount, 1); await app.query('COMMIT');
      const b = await second.query("UPDATE studio.projects SET name='Synthetic stale write' WHERE id=$1 AND revision=$2", [ids.projectA, original]);
      assert.equal(b.rowCount, 0); await second.query('ROLLBACK');
    } finally { await app.query('ROLLBACK'); await second.end(); }
  });
  await check('Development and test runtime credentials cannot connect to each other’s database', async () => {
    for (const [source, target] of [['development', 'test'], ['test', 'development']]) {
      let unexpected;
      try {
        await rejected(async () => { unexpected = await connect(settingsFor(config, source, 'app'), { database: config.environments[target].database }); }, '42501');
      } finally { if (unexpected) await unexpected.end(); }
    }
  });
  await check('Migration checksum drift is rejected without modifying history', async () => {
    const files = await migrationFiles();
    files[0].sql += '\n-- synthetic drift';
    await assert.rejects(() => migrate(migrator, entry.app.user, files), /checksum mismatch/);
  });
  await check('Failed migration rolls back DDL and its ledger entry atomically', async () => {
    const files = await migrationFiles();
    files.push({ name: '999_synthetic_failure.sql', sql: 'CREATE TABLE studio.synthetic_failed_migration(id int); SELECT * FROM studio.synthetic_missing_table;' });
    await rejected(() => migrate(migrator, entry.app.user, files), '42P01');
    assert.equal((await migrator.query("SELECT to_regclass('studio.synthetic_failed_migration') AS object")).rows[0].object, null);
    assert.equal((await migrator.query("SELECT name FROM contigoo_migrations.history WHERE name='999_synthetic_failure.sql'")).rowCount, 0);
  });
} catch (error) {
  process.exitCode = 1;
  if (!results.some(r => r.status === 'Failed')) results.push({ name: 'Integration setup', status: 'Failed', code: safeCode(error) });
  console.error(`Hosted integration run failed (${safeCode(error)}). Raw SQL and private details were suppressed.`);
} finally {
  if (migrator && seeded) {
    try {
      await migrator.query('BEGIN');
      await migrator.query("SELECT set_config('contigoo.actor_id',$1,true)", [ids.owner]);
      await migrator.query('DELETE FROM studio.projects WHERE id=ANY($1::uuid[])', [[ids.projectA, ids.projectB]]);
      await migrator.query('DELETE FROM studio.clients WHERE id=ANY($1::uuid[])', [[ids.clientA, ids.clientB, ids.rollbackClient]]);
      await migrator.query('DELETE FROM studio.audit_events WHERE actor_id=ANY($1::uuid[])', [principalIds]);
      await migrator.query('DELETE FROM studio.principals WHERE id=ANY($1::uuid[])', [principalIds]);
      await migrator.query('COMMIT');
      results.push({ name: 'Synthetic test rows cleaned up by exact fixture identifiers', status: 'Passed' });
    } catch (error) { await migrator.query('ROLLBACK'); results.push({ name: 'Synthetic fixture cleanup', status: 'Failed', code: safeCode(error) }); process.exitCode = 1; }
  }
  if (app) await app.end();
  if (migrator) await migrator.end();
  const report = { checkedAt: new Date().toISOString(), scope: 'Real hosted PostgreSQL control-schema tests; no API/login/browser acceptance',
    passed: results.filter(r => r.status === 'Passed').length, failed: results.filter(r => r.status === 'Failed').length, results };
  const directory = path.join(root, 'reports'); await mkdir(directory, { recursive: true });
  const filename = `hosted-${report.checkedAt.replaceAll(':', '-').replaceAll('.', '-')}.json`;
  await writeFile(path.join(directory, filename), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, evidence: `database/reports/${filename}` }, null, 2));
}
