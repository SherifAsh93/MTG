import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { serviceSettings, bootstrapSettings, settingsFor, clientConfig, connect, ident, literal, safeCode } from '../../database/hosted.mjs';
import { migrate } from '../../database/migrate.mjs';
import { platformRoot } from './config.js';

const environment = process.argv[2];
let admin; let migrator;
try {
  if (!['development', 'test'].includes(environment)) throw new Error('Choose development or test.');
  const config = await serviceSettings(); const bootstrap = await bootstrapSettings(); const entry = config.environments[environment];
  const directory = path.join(platformRoot, '.private'); await mkdir(directory, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') {
    const identity = execFileSync('whoami.exe', [], { encoding: 'utf8' }).trim();
    execFileSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { stdio: 'pipe' });
  } else await chmod(directory, 0o700);
  admin = await connect(bootstrap.settings);
  const target = path.join(directory, `${environment}.json`);
  let local;
  try { local = JSON.parse(await readFile(target, 'utf8')); }
  catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
    const user = `contigoo_${environment === 'development' ? 'dev' : 'test'}_identity`;
    if ((await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [user])).rowCount) throw new Error('Identity role already exists without its private configuration.');
    local = { databaseName: entry.database,
      appDatabase: clientConfig(settingsFor(config, environment, 'app')),
      identityDatabase: { ...clientConfig(settingsFor(config, environment, 'app')), user, password: randomBytes(32).toString('base64url') },
      authSecret: randomBytes(48).toString('base64url'), bootstrapToken: randomBytes(32).toString('base64url') };
    await writeFile(target, JSON.stringify(local, null, 2), { mode: 0o600, flag: 'wx' });
  }
  if (local.databaseName !== entry.database) throw new Error('Private identity configuration database mismatch.');
  const identityRole = local.identityDatabase.user;
  if (!(await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [identityRole])).rowCount) {
    await admin.query(`CREATE ROLE ${ident(identityRole)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(local.identityDatabase.password)}`);
  }
  migrator = await connect(settingsFor(config, environment, 'migrator'));
  await migrate(migrator, entry.app.user, undefined, bootstrap.settings.CONTIGOO_DB_USER);
  await migrator.query(`GRANT CONNECT ON DATABASE ${ident(entry.database)} TO ${ident(identityRole)};
    GRANT USAGE ON SCHEMA studio_auth, studio TO ${ident(identityRole)};
    GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA studio_auth TO ${ident(identityRole)};
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA studio_auth TO ${ident(identityRole)};
    GRANT SELECT,INSERT,UPDATE,DELETE ON studio.principals, studio.project_assignments TO ${ident(identityRole)};
    GRANT SELECT,UPDATE ON studio.employees TO ${ident(identityRole)};
    GRANT SELECT ON studio.action_events,studio.audit_events TO ${ident(identityRole)};
    GRANT EXECUTE ON FUNCTION studio.record_action(uuid,uuid,text,text,integer,uuid,uuid,uuid),studio.is_owner(),studio.actor_id() TO ${ident(identityRole)}`);
  console.log(JSON.stringify({ status: 'Passed', environment, identityRoleRestricted: true, credentials: 'Stored privately; not printed' }));
} catch (error: any) { console.error(`Platform identity setup failed (${safeCode(error)}). Private details suppressed.`); process.exitCode = 1; }
finally { if (migrator) await migrator.end(); if (admin) await admin.end(); }
