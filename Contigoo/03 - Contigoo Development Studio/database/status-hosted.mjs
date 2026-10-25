import { Client } from 'pg';
import { bootstrapSettings, serviceSettings, settingsFor, connect, safeCode } from './hosted.mjs';
import { remoteConfig, checkRemote } from './remote-config.mjs';

try {
  const config = await serviceSettings();
  const bootstrap = await bootstrapSettings();
  const result = { checkedAt: new Date().toISOString(), scope: 'Hosted Studio database foundation, not implemented app login/API', environments: {} };
  for (const environment of ['development', 'test']) {
    const client = await connect(settingsFor(config, environment, 'migrator'));
    try {
      const tables = (await client.query("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema IN ('studio','contigoo_migrations') ORDER BY table_schema,table_name")).rows;
      const counts = {};
      for (const name of ['principals', 'clients', 'projects', 'project_assignments', 'audit_events']) {
        counts[name] = Number((await client.query(`SELECT count(*) FROM studio.${name}`)).rows[0].count);
      }
      const migrations = (await client.query('SELECT name FROM contigoo_migrations.history ORDER BY name')).rows.map(r => r.name);
      const runtime = await checkRemote(Client, remoteConfig(settingsFor(config, environment, 'app')));
      result.environments[environment] = { tables, counts, migrations, runtime };
    } finally { await client.end(); }
  }
  const consoleClient = await connect({ ...bootstrap.settings, CONTIGOO_DB_NAME: config.environments.development.database });
  try {
    result.consoleVisibleStudioTables = (await consoleClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema='studio' ORDER BY table_name")).rows.map(r => r.table_name);
  } finally { await consoleClient.end(); }
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(`Hosted status failed (${safeCode(error)}). Private details were suppressed.`); process.exitCode = 1; }
