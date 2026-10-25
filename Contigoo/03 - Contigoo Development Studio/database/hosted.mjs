import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { Client } from 'pg';
import { privateDirectory, securePrivateDirectory } from './neon-access.mjs';
import { remoteConfig } from './remote-config.mjs';

export const ident = name => {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(name)) throw new Error('Invalid database identifier.');
  return `"${name}"`;
};
export const literal = value => `'${String(value).replaceAll("'", "''")}'`;
export const safeCode = error => /^[A-Z0-9_]{1,40}$/.test(error?.code || '') ? error.code : 'SETUP_FAILED';
export async function bootstrapSettings() {
  return JSON.parse(await readFile(path.join(privateDirectory, 'hosted-bootstrap.json'), 'utf8'));
}
export async function serviceSettings() {
  const config = JSON.parse(await readFile(path.join(privateDirectory, 'hosted-services.json'), 'utf8'));
  const bootstrap = await bootstrapSettings();
  if (config.projectId !== bootstrap.projectId) throw new Error('Service settings do not match the attached project.');
  return config;
}
export function clientConfig(settings, overrides = {}) {
  return { ...remoteConfig(settings), options: '-c default_transaction_read_only=off',
    application_name: 'contigoo-database-setup', ...overrides };
}
export function settingsFor(config, environment, role) {
  if (!['development', 'test'].includes(environment) || !['migrator', 'app'].includes(role)) throw new Error('Explicit environment and role required.');
  const entry = config.environments[environment];
  return { CONTIGOO_DB_HOST: config.host, CONTIGOO_DB_PORT: config.port,
    CONTIGOO_DB_NAME: entry.database, CONTIGOO_DB_USER: entry[role].user, CONTIGOO_DB_PASSWORD: entry[role].password };
}
export async function connect(settings, overrides) {
  const client = new Client(clientConfig(settings, overrides));
  try {
    await client.connect();
    if (!client.connection.stream.encrypted || !client.connection.stream.authorized) throw new Error('Verified TLS required.');
    return client;
  } catch (error) { await client.end(); throw error; }
}

export async function provisionServices() {
  await securePrivateDirectory();
  const bootstrap = await bootstrapSettings();
  const admin = await connect(bootstrap.settings);
  let stage = 'prepare private service configuration';
  try {
    let config; let isNew = false;
    try { config = await serviceSettings(); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      config = { projectId: bootstrap.projectId, host: bootstrap.settings.CONTIGOO_DB_HOST,
        port: bootstrap.settings.CONTIGOO_DB_PORT, environments: {} };
      for (const [environment, suffix] of [['development', 'dev'], ['test', 'test']]) {
        config.environments[environment] = {
          database: `contigoo_studio_${suffix}`,
          migrator: { user: `contigoo_${suffix}_migrator`, password: randomBytes(32).toString('base64url') },
          app: { user: `contigoo_${suffix}_app`, password: randomBytes(32).toString('base64url') },
        };
      }
      // Refuse to adopt unrelated resources just because they have matching names.
      for (const entry of Object.values(config.environments)) {
        const collision = await admin.query(`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1)
          OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname=ANY($2::text[])) AS found`,
        [entry.database, [entry.migrator.user, entry.app.user]]);
        if (collision.rows[0].found) throw new Error('Existing resources require explicit reconciliation.');
      }
      await writeFile(path.join(privateDirectory, 'hosted-services.json'), JSON.stringify(config, null, 2), { flag: 'wx', mode: 0o600 });
      isNew = true;
    }
    for (const [environment, entry] of Object.entries(config.environments)) {
      for (const role of ['migrator', 'app']) {
        stage = `create ${environment} ${role} role`;
        const credentials = entry[role];
        const exists = await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [credentials.user]);
        if (!exists.rowCount) {
          await admin.query(`CREATE ROLE ${ident(credentials.user)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(credentials.password)}`);
        }
      }
      const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [entry.database]);
      stage = `create ${environment} database`;
      // PostgreSQL requires the database creator to be able to SET ROLE to its owner.
      // This grants the bootstrap administrator access to the migrator, never the reverse.
      const ownerAccess = await admin.query("SELECT pg_has_role(current_user, $1, 'SET') AS allowed", [entry.migrator.user]);
      if (!ownerAccess.rows[0].allowed) {
        await admin.query(`GRANT ${ident(entry.migrator.user)} TO ${ident(bootstrap.settings.CONTIGOO_DB_USER)} WITH INHERIT FALSE, SET TRUE`);
      }
      if (!exists.rowCount) await admin.query(`CREATE DATABASE ${ident(entry.database)} OWNER ${ident(entry.migrator.user)} TEMPLATE template0 ENCODING 'UTF8'`);
      const owner = await admin.query('SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=$1', [entry.database]);
      if (owner.rows[0].owner !== entry.migrator.user) throw new Error('Database ownership differs from saved configuration.');
      stage = `restrict ${environment} database access`;
      // Issue ACL changes as the actual database owner. A hosted bootstrap role can
      // otherwise return a warning/no-op for REVOKE despite being able to create DBs.
      await admin.query(`SET ROLE ${ident(entry.migrator.user)}`);
      try {
        await admin.query(`REVOKE ALL ON DATABASE ${ident(entry.database)} FROM PUBLIC`);
        await admin.query(`GRANT CONNECT ON DATABASE ${ident(entry.database)} TO ${ident(entry.app.user)}, ${ident(bootstrap.settings.CONTIGOO_DB_USER)}`);
      } finally { await admin.query('RESET ROLE'); }
      for (const role of ['migrator', 'app']) {
        stage = `verify ${environment} ${role} connection`;
        const client = await connect(settingsFor(config, environment, role));
        try {
          const flags = await client.query(`SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls AS elevated
            FROM pg_roles WHERE rolname=current_user`);
          if (flags.rows[0].elevated) throw new Error('Service role has unexpected elevated privileges.');
        } finally { await client.end(); }
      }
    }
    return { status: 'Passed', createdPrivateConfiguration: isNew, environments: ['development', 'test'],
      databases: 2, separateServiceRoles: 4, verifiedTls: true, scope: 'Studio control data only; generated-app isolation remains to be decided.' };
  } catch (error) { error.setupStage = stage; throw error; }
  finally { await admin.end(); }
}
