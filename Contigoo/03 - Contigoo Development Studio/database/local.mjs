import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { config, configPath, local, secureLocalDirectory, pgTool, sql, identifier, literal, createDatabase } from './lib.mjs';

const action = process.argv[2] || 'status';
const data = path.join(local, 'data');
const log = path.join(local, 'postgres.log');
const pwfile = path.join(local, 'admin-password.txt');
if (action === 'setup') {
  await secureLocalDirectory();
  let cfg;
  try { cfg = await config(); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try { await access(path.join(data, 'PG_VERSION')); throw new Error('A cluster exists without its private config. Recover the config; refusing to replace credentials/data.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    cfg = {
      version: '18.6', binDirectory: process.env.PG_BINDIR || 'C:/Users/sheri/AppData/Local/Temp/opencode/postgresql-18.6/pgsql/bin',
      host: '127.0.0.1', port: 55432, sslMode: 'disable', database: 'contigoo_studio',
      adminUser: 'contigoo_local_admin', migratorUser: 'contigoo_migrator', appUser: 'contigoo_app',
      adminPassword: randomBytes(36).toString('base64url'), migratorPassword: randomBytes(36).toString('base64url'), appPassword: randomBytes(36).toString('base64url'),
    };
    await writeFile(configPath, JSON.stringify(cfg, null, 2), { mode: 0o600, flag: 'wx' });
    await writeFile(pwfile, cfg.adminPassword + '\n', { mode: 0o600, flag: 'wx' });
  }
  if (process.env.PG_BINDIR && process.env.PG_BINDIR !== cfg.binDirectory) {
    let existingMajor = null;
    try { existingMajor = (await readFile(path.join(data, 'PG_VERSION'), 'utf8')).trim(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const output = pgTool({ ...cfg, binDirectory: process.env.PG_BINDIR }, 'postgres', ['--version']).output;
    const selectedVersion = output.match(/PostgreSQL\) ([0-9.]+)/)?.[1];
    if (!selectedVersion || (existingMajor && selectedVersion.split('.')[0] !== existingMajor)) throw new Error('Binary major version does not match the existing cluster; use logical migration, not an in-place switch.');
    cfg.binDirectory = process.env.PG_BINDIR; cfg.version = selectedVersion;
    await writeFile(configPath, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  }
  try { await access(path.join(data, 'PG_VERSION')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log('Initializing a new private loopback-only PostgreSQL cluster.');
    pgTool(cfg, 'initdb', ['-D', data, '-U', cfg.adminUser, '--pwfile', pwfile, '--auth-local=scram-sha-256', '--auth-host=scram-sha-256', '--encoding=UTF8', '--locale-provider=builtin', '--builtin-locale=C.UTF-8'], { timeout: 120000 });
  }
  const custom = `# Contigoo local development only\nlisten_addresses = '127.0.0.1'\nport = ${cfg.port}\npassword_encryption = 'scram-sha-256'\ntimezone = 'UTC'\nlog_statement = 'none'\nlog_min_error_statement = 'panic'\n`;
  const conf = path.join(data, 'contigoo-local.conf'); await writeFile(conf, custom);
  const mainConf = path.join(data, 'postgresql.conf'); const current = await readFile(mainConf, 'utf8');
  if (!current.includes("include = 'contigoo-local.conf'")) await writeFile(mainConf, current + "\ninclude = 'contigoo-local.conf'\n");
  await start(cfg);
  provision(cfg);
  await writeFile(path.join(local, 'application.env'), `# SERVER-ONLY LOCAL DEVELOPMENT SECRETS. Never publish.\nPGHOST=${cfg.host}\nPGPORT=${cfg.port}\nPGDATABASE=${cfg.database}\nPGUSER=${cfg.appUser}\nPGPASSWORD=${cfg.appPassword}\nPGSSLMODE=${cfg.sslMode}\n`, { mode: 0o600 });
  console.log('Database and service roles ready. Passwords are stored only in database/.local/ (restricted access), not printed.');
  printStatus(cfg);
} else {
  const cfg = await config();
  if (action === 'start') { await start(cfg); printStatus(cfg); }
  else if (action === 'stop') { console.log(pgTool(cfg, 'pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']).output); }
  else if (action === 'status') printStatus(cfg);
  else if (action === 'provision') provision(cfg);
  else throw new Error('Use setup, start, stop, status or provision.');
}

async function start(cfg) {
  if (pgTool(cfg, 'pg_ctl', ['-D', data, 'status'], { allowError: true }).ok) return;
  await new Promise((resolve, reject) => { const probe = createServer(); probe.once('error', () => reject(new Error(`Local port ${cfg.port} is occupied; refusing to interfere with another service.`))); probe.listen(cfg.port, cfg.host, () => probe.close(resolve)); });
  await mkdir(local, { recursive: true });
  pgTool(cfg, 'pg_ctl', ['-D', data, '-l', log, '-w', 'start'], { timeout: 120000 });
}
function provision(cfg) {
  for (const role of ['migrator', 'app']) {
    const user = cfg[`${role}User`];
    if (!sql(cfg, `SELECT 1 FROM pg_roles WHERE rolname=${literal(user)};`, { database: 'postgres' }).output) {
      sql(cfg, `CREATE ROLE ${identifier(user)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(cfg[`${role}Password`])};`, { database: 'postgres' });
    }
  }
  if (!sql(cfg, `SELECT 1 FROM pg_database WHERE datname=${literal(cfg.database)};`, { database: 'postgres' }).output) createDatabase(cfg, cfg.database);
  // Verify that all saved credentials still connect; never silently reset an existing role password.
  for (const role of ['migrator', 'app']) sql(cfg, 'SELECT current_user;', { role });
}
function printStatus(cfg) {
  const version = sql(cfg, 'SHOW server_version;', { database: 'postgres' }).output;
  console.log(JSON.stringify({ serverVersion: version, host: cfg.host, port: cfg.port, database: cfg.database, runtimeRole: cfg.appUser, migrationRole: cfg.migratorUser, dataDirectory: data, scope: 'Local database only; Studio web API/authentication is not connected yet.' }, null, 2));
}
