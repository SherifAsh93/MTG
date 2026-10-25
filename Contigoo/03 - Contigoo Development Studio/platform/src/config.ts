import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolConfig } from 'pg';

export const platformRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export interface Configuration {
  origin: string; authSecret: string; bootstrapToken: string; appDatabase: PoolConfig; identityDatabase: PoolConfig;
  environment: string; host: string; port: number;
  delivery?: any;
}
export function connection(uri: string): PoolConfig {
  const url = new URL(uri);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL connection required.');
  return { host: url.hostname, port: Number(url.port || 5432), database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000, max: 4, idleTimeoutMillis: 10000,
    statement_timeout: 15000, query_timeout: 20000 };
}
export async function loadConfig(environment = process.env.CONTIGOO_ENV || (process.env.NODE_ENV==='production'?'production':'development')): Promise<Configuration> {
  const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:4300';
  const url = new URL(origin);
  if (url.origin !== origin) throw new Error('APP_ORIGIN must be an origin without a path or trailing slash.');
  if (environment === 'production' && url.protocol !== 'https:') throw new Error('Production requires an HTTPS origin.');
  if(environment==='production'&&!['studio','delivered'].includes(process.env.APP_MODE||''))throw new Error('Explicit APP_MODE=studio or delivered is required in production.');
  let secret = process.env.AUTH_SECRET; let token = process.env.OWNER_SETUP_TOKEN || '';
  let appDatabase: PoolConfig; let identityDatabase: PoolConfig;
  if (process.env.DATABASE_URL && process.env.IDENTITY_DATABASE_URL) {
    appDatabase = connection(process.env.DATABASE_URL); identityDatabase = connection(process.env.IDENTITY_DATABASE_URL);
  } else {
    if (!['development', 'test'].includes(environment)) throw new Error('Explicit production database configuration is required.');
    const local = JSON.parse(await readFile(path.join(platformRoot, '.private', `${environment}.json`), 'utf8'));
    appDatabase = local.appDatabase; identityDatabase = local.identityDatabase;
    secret ||= local.authSecret; token ||= local.bootstrapToken;
  }
  if (!secret || secret.length < 32) throw new Error('A strong AUTH_SECRET is required.');
  if(!appDatabase.host||!identityDatabase.host||!appDatabase.database||!identityDatabase.database||
    appDatabase.host.toLowerCase()!==identityDatabase.host.toLowerCase()||Number(appDatabase.port||5432)!==Number(identityDatabase.port||5432)||appDatabase.database!==identityDatabase.database)throw new Error('Application and identity connections must target the same PostgreSQL endpoint/database.');
  if(!appDatabase.user||!identityDatabase.user||appDatabase.user===identityDatabase.user)throw new Error('Separate application and identity service roles are required.');
  for (const database of [appDatabase, identityDatabase]) {
    database.ssl = { rejectUnauthorized: true }; database.max = 4; database.connectionTimeoutMillis = 15000;
    database.idleTimeoutMillis = 10000; database.statement_timeout = 15000; database.query_timeout = 20000;
  }
  identityDatabase.options = '-c search_path=studio_auth,pg_catalog';
  let delivery;
  if(process.env.APP_MODE==='delivered'){
    delivery=JSON.parse(await readFile(path.resolve(process.env.APP_MANIFEST||'delivery.json'),'utf8'));
    if(delivery.formatVersion!==1||!delivery.projectId||!delivery.configuration||!Number.isSafeInteger(delivery.version))throw new Error('Invalid delivery manifest.');
  }
  return { origin, authSecret: secret, bootstrapToken: token, appDatabase, identityDatabase, environment,delivery,
    host: process.env.HOST || '127.0.0.1', port: Number(process.env.PORT || url.port || 4300) };
}
