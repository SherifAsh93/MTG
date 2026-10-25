import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { serviceSettings, bootstrapSettings, settingsFor, connect, safeCode } from './hosted.mjs';
import { migrate, migrationFiles } from './migration-core.mjs';
export { migrate, migrationFiles };

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let client;
  try {
    const environment = process.argv[2];
    const config = await serviceSettings();
    client = await connect(settingsFor(config, environment, 'migrator'));
    const bootstrap = await bootstrapSettings();
    const installed = await migrate(client, config.environments[environment].app.user, undefined, bootstrap.settings.CONTIGOO_DB_USER);
    console.log(JSON.stringify({ status: 'Passed', environment, installed, migrationCount: (await migrationFiles()).length }, null, 2));
  } catch (error) { console.error(`Migration failed (${safeCode(error)}). The transaction was rolled back; private details were suppressed.`); process.exitCode = 1; }
  finally { if (client) await client.end(); }
}
