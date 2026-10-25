import { isIP } from 'node:net';

// Explicit, separate names avoid accidentally reusing the stopped local cluster's settings.
export function remoteConfig(env = process.env) {
  const required = ['HOST', 'NAME', 'USER', 'PASSWORD'];
  for (const key of required) {
    const value = env[`CONTIGOO_DB_${key}`];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Set CONTIGOO_DB_${key} privately in database/.env.`);
    }
    if (/[\x00-\x1f\x7f]/.test(value)) throw new Error(`Invalid CONTIGOO_DB_${key} format.`);
  }
  const host = env.CONTIGOO_DB_HOST.trim();
  const normalizedHost = host.toLowerCase().replace(/\.$/, '');
  if (normalizedHost === 'localhost' || normalizedHost.endsWith('.localhost')
    || isIP(host) || !/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) {
    throw new Error('Use the hosted provider DNS hostname, not a URL, IP address or local database.');
  }
  const portText = env.CONTIGOO_DB_PORT || '5432';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || port < 1 || port > 65535) throw new Error('Invalid CONTIGOO_DB_PORT.');
  return {
    host, port,
    database: env.CONTIGOO_DB_NAME,
    user: env.CONTIGOO_DB_USER,
    password: env.CONTIGOO_DB_PASSWORD,
    ssl: { rejectUnauthorized: true },
    enableChannelBinding: true,
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
    statement_timeout: 10000,
    application_name: 'contigoo-remote-readiness',
    options: '-c default_transaction_read_only=on',
  };
}

export async function checkRemote(Client, config) {
  const client = new Client(config);
  try {
    await client.connect();
    const stream = client.connection?.stream;
    if (stream?.encrypted !== true || stream?.authorized !== true) {
      throw new Error('Remote TLS certificate verification is incomplete.');
    }
    await client.query('BEGIN READ ONLY');
    const { rows } = await client.query(`
      SELECT current_setting('server_version') AS server_version,
             pg_database_size(current_database())::text AS database_bytes,
             (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()) AS tls,
             r.rolsuper AS superuser, r.rolcreatedb AS can_create_database,
             r.rolcreaterole AS can_create_role, r.rolbypassrls AS bypass_rls
      FROM pg_roles r WHERE r.rolname = current_user
    `);
    if (rows.length !== 1) throw new Error('Remote connection evidence is incomplete.');
    const row = rows[0];
    // Deliberate allowlist: no host, account identifiers, passwords or raw errors in logs.
    return {
      status: 'Passed', scope: 'Read-only hosted PostgreSQL readiness; not application acceptance',
      serverVersion: row.server_version, databaseBytes: row.database_bytes,
      tls: true, tlsCertificateVerified: true,
      // Hosted proxies may terminate client TLS before the internal PostgreSQL connection.
      // pg_stat_ssl describes that internal hop, not the verified client-to-provider socket.
      backendConnectionTls: row.tls,
      connectedRole: {
        superuser: row.superuser, canCreateDatabase: row.can_create_database,
        canCreateRole: row.can_create_role, bypassRls: row.bypass_rls,
      },
      next: 'Configure restricted runtime/migration roles, versioned schema and isolated integration tests.',
    };
  } finally {
    try { await client.query('ROLLBACK'); } catch { /* Connection might not have opened. */ }
    await client.end();
  }
}
