import { serviceSettings, settingsFor, connect, safeCode } from './hosted.mjs';

const config = await serviceSettings();
for (const [source, target] of [['development', 'test'], ['test', 'development']]) {
  let client;
  try {
    client = await connect(settingsFor(config, source, 'app'), { database: config.environments[target].database });
    const info = await client.query(`SELECT current_database()=$1 AS correct_target,
      has_database_privilege(current_user,$1,'CONNECT') AS connect_privilege,
      EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='studio') AS studio_exists,
      (SELECT has_schema_privilege(current_user,oid,'USAGE') FROM pg_namespace WHERE nspname='studio') AS schema_access`,
    [config.environments[target].database]);
    console.log(JSON.stringify({ source, target, connectionAccepted: true, ...info.rows[0] }));
  } catch (error) { console.log(JSON.stringify({ source, target, connectionAccepted: false, code: safeCode(error) })); }
  finally { if (client) await client.end(); }
}
