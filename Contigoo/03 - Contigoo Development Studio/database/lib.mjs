import { readFile, mkdir, chmod } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = path.dirname(fileURLToPath(import.meta.url));
export const local = path.join(root, '.local');
export const configPath = path.join(local, 'connection.json');
export async function config() { return JSON.parse(await readFile(configPath, 'utf8')); }
export async function secureLocalDirectory() {
  await mkdir(local, { recursive: true });
  if (process.platform === 'win32') {
    const identity = execFileSync('whoami.exe', [], { encoding: 'utf8' }).trim();
    execFileSync('icacls.exe', [local, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { stdio: 'pipe' });
  } else await chmod(local, 0o700);
}
export const identifier = value => {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value)) throw new Error('Invalid database identifier.');
  return `"${value}"`;
};
export const literal = value => `'${String(value).replaceAll("'", "''")}'`;
export function redacted(text, cfg) {
  let result = String(text || '');
  for (const key of ['adminPassword', 'migratorPassword', 'appPassword']) if (cfg?.[key]) result = result.replaceAll(cfg[key], '[REDACTED]');
  return result;
}
export function executable(cfg, name) {
  const directory = process.env.PG_BINDIR || cfg.binDirectory;
  return directory ? path.join(directory, name + (process.platform === 'win32' ? '.exe' : '')) : name;
}
export function sql(cfg, statement, { role = 'admin', database = cfg.database, allowError = false } = {}) {
  const user = cfg[`${role}User`]; const password = cfg[`${role}Password`];
  if (!user || !password) throw new Error('Missing private database connection settings.');
  const result = spawnSync(executable(cfg, 'psql'), ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-w', '-h', cfg.host, '-p', String(cfg.port), '-U', user, '-d', database], {
    input: statement, encoding: 'utf8', env: { ...process.env, PGPASSWORD: password, PGCONNECT_TIMEOUT: '10', PGSSLMODE: cfg.sslMode || 'disable' }, maxBuffer: 8 * 1024 * 1024, timeout: 60000,
  });
  const output = redacted(result.stdout, cfg).trim(); const error = redacted(result.stderr || result.error?.message, cfg).trim();
  if (result.status !== 0 && !allowError) throw new Error(`PostgreSQL command failed (${result.status}): ${error}`);
  return { ok: result.status === 0, output, error };
}
export function pgTool(cfg, name, args, { role = 'admin', allowError = false, timeout = 60000 } = {}) {
  const result = spawnSync(executable(cfg, name), args, { encoding: 'utf8', env: { ...process.env, PGPASSWORD: cfg[`${role}Password`], PGCONNECT_TIMEOUT: '10' }, maxBuffer: 8 * 1024 * 1024, timeout });
  if (result.status !== 0 && !allowError) throw new Error(`${name} failed (${result.status}): ${redacted(result.stderr || result.error?.message || result.stdout, cfg)}`);
  return { ok: result.status === 0, output: redacted(result.stdout, cfg).trim(), error: redacted(result.stderr, cfg).trim(), status: result.status };
}
export function createDatabase(cfg, name) {
  identifier(name);
  if (sql(cfg, `SELECT 1 FROM pg_database WHERE datname=${literal(name)};`, { database: 'postgres' }).output === '1') throw new Error(`Database ${name} already exists; refusing to overwrite it.`);
  sql(cfg, `CREATE DATABASE ${identifier(name)} OWNER ${identifier(cfg.migratorUser)} TEMPLATE template0 ENCODING 'UTF8';`, { database: 'postgres' });
  sql(cfg, `REVOKE ALL ON DATABASE ${identifier(name)} FROM PUBLIC; GRANT CONNECT ON DATABASE ${identifier(name)} TO ${identifier(cfg.migratorUser)}, ${identifier(cfg.appUser)};`, { database: 'postgres' });
}
