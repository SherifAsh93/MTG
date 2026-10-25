import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const ident = name => {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(name)) throw new Error('Invalid database role identifier.');
  return `"${name}"`;
};

const root = path.dirname(fileURLToPath(import.meta.url));
export async function migrationFiles() {
  const directory = path.join(root, 'migrations');
  const files = (await readdir(directory)).filter(name => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
  return Promise.all(files.map(async name => ({ name, sql: await readFile(path.join(directory, name), 'utf8') })));
}
export async function migrate(client, appRole, files, consoleRole) {
  files ??= await migrationFiles();
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(85423017)');
    await client.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await client.query(`CREATE SCHEMA IF NOT EXISTS contigoo_migrations;
      REVOKE ALL ON SCHEMA contigoo_migrations FROM PUBLIC;
      CREATE TABLE IF NOT EXISTS contigoo_migrations.history (
        name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = (await client.query('SELECT name, checksum FROM contigoo_migrations.history')).rows;
    if (applied.some(row => !files.some(file => file.name === row.name))) throw new Error('Migration history contains an unknown version.');
    const installed = [];
    for (const file of files) {
      const checksum = createHash('sha256').update(file.sql).digest('hex');
      const previous = applied.find(row => row.name === file.name);
      if (previous && previous.checksum !== checksum) throw new Error('Migration checksum mismatch.');
      if (previous) continue;
      await client.query(file.sql);
      await client.query('INSERT INTO contigoo_migrations.history(name,checksum) VALUES ($1,$2)', [file.name, checksum]);
      installed.push(file.name);
    }
    const role = ident(appRole);
    await client.query(`GRANT USAGE ON SCHEMA studio TO ${role};
      GRANT SELECT ON studio.clients, studio.projects, studio.audit_events TO ${role};
      GRANT INSERT(id,name,contact,email,phone,industry,address,notes) ON studio.clients TO ${role};
      GRANT UPDATE(name,contact,email,phone,industry,address,notes) ON studio.clients TO ${role};
      GRANT DELETE ON studio.clients TO ${role};
      GRANT INSERT(id,client_id,name,description,status,draft_model) ON studio.projects TO ${role};
      GRANT UPDATE(name,description,status,draft_model) ON studio.projects TO ${role};
      GRANT DELETE ON studio.projects TO ${role};
      GRANT EXECUTE ON FUNCTION studio.actor_id(), studio.is_owner(), studio.can_access_project(uuid,boolean), studio.can_read_client(uuid) TO ${role}`);
    const workspace = await client.query("SELECT to_regclass('studio.workspace_settings') AS present");
    if (workspace.rows[0].present) {
      await client.query(`GRANT SELECT,UPDATE ON studio.workspace_settings TO ${role};
        GRANT UPDATE(studio_state) ON studio.projects TO ${role};
        GRANT INSERT(studio_state) ON studio.projects TO ${role};
        GRANT SELECT,INSERT,UPDATE,DELETE ON studio.project_apps,studio.app_records TO ${role};
        GRANT SELECT,INSERT ON studio.project_versions TO ${role}`);
    }
    const events = await client.query("SELECT to_regclass('studio.record_events') AS present");
    if (events.rows[0].present) await client.query(`GRANT SELECT,INSERT ON studio.record_events TO ${role}; GRANT USAGE ON SEQUENCE studio.record_events_id_seq TO ${role}`);
    const lock = await client.query("SELECT to_regprocedure('studio.lock_workspace_for_project(uuid)') AS present");
    if (lock.rows[0].present) await client.query(`GRANT EXECUTE ON FUNCTION studio.lock_workspace_for_project(uuid) TO ${role}`);
    if (consoleRole) {
      // Give the owner's Neon SQL/table viewer visibility without giving app roles
      // access to identity tables or the migration ledger.
      const viewer = ident(consoleRole);
      await client.query(`GRANT USAGE ON SCHEMA studio, contigoo_migrations TO ${viewer};
        GRANT SELECT ON ALL TABLES IN SCHEMA studio, contigoo_migrations TO ${viewer}`);
    }
    await client.query('COMMIT');
    return installed;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
