import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { remoteConfig, checkRemote } from './remote-config.mjs';

const env = () => ({ CONTIGOO_DB_HOST: 'db.example.invalid', CONTIGOO_DB_NAME: 'synthetic_test',
  CONTIGOO_DB_USER: 'synthetic_probe', CONTIGOO_DB_PASSWORD: randomBytes(24).toString('hex') });

test('remote settings require explicit configuration and do not fall back to local PG variables', () => {
  assert.throws(() => remoteConfig({ PGHOST: '127.0.0.1' }), /CONTIGOO_DB_HOST/);
  for (const key of ['HOST', 'NAME', 'USER', 'PASSWORD']) {
    assert.throws(() => remoteConfig({ ...env(), [`CONTIGOO_DB_${key}`]: '' }), new RegExp(`CONTIGOO_DB_${key}`));
  }
});
test('TLS verification and read-only defaults cannot be disabled by PG environment settings', () => {
  const config = remoteConfig({ ...env(), PGSSLMODE: 'disable', PGOPTIONS: '-c default_transaction_read_only=off' });
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
  assert.equal(config.options, '-c default_transaction_read_only=on');
  assert.equal(config.connectionTimeoutMillis, 15000);
});
test('invalid remote endpoints, ports and control characters are rejected without echoing values', () => {
  for (const host of ['localhost', 'LOCALHOST.', 'db.localhost', '127.0.0.1', '::1', 'https://db.example.invalid', 'bad host']) {
    assert.throws(() => remoteConfig({ ...env(), CONTIGOO_DB_HOST: host }));
  }
  for (const port of ['0', '65536', '-1', '5432x']) assert.throws(() => remoteConfig({ ...env(), CONTIGOO_DB_PORT: port }), /PORT/);
  const values = env(); values.CONTIGOO_DB_PASSWORD += '\n';
  assert.throws(() => remoteConfig(values), error => !error.message.includes(values.CONTIGOO_DB_PASSWORD));
});

function fakeClient({ failConnect = false, failQuery = false, tls = true, authorized = true, backendTls = true } = {}) {
  const calls = [];
  class Client {
    connection = { stream: { encrypted: tls, authorized } };
    async connect() { calls.push('connect'); if (failConnect) throw new Error('Synthetic connection failure'); }
    async query(sql) {
      calls.push(sql.trim());
      if (sql.includes('SELECT')) {
        if (failQuery) throw new Error('Synthetic query failure');
        return { rows: [{ server_version: '17.11', database_bytes: '8192', tls: backendTls,
          superuser: false, can_create_database: false, can_create_role: false, bypass_rls: false,
          unexpectedPrivateValue: randomBytes(16).toString('hex') }] };
      }
      return { rows: [] };
    }
    async end() { calls.push('end'); }
  }
  return { Client, calls };
}
test('readiness probes use read-only transactions and emit only allowlisted evidence', async () => {
  const { Client, calls } = fakeClient(); const config = remoteConfig(env());
  const report = await checkRemote(Client, config);
  assert.equal(report.tls, true);
  assert.deepEqual(calls.slice(0, 2), ['connect', 'BEGIN READ ONLY']);
  assert.deepEqual(calls.slice(-2), ['ROLLBACK', 'end']);
  const output = JSON.stringify(report);
  for (const privateValue of [config.password, config.host, config.user, 'unexpectedPrivateValue']) assert(!output.includes(privateValue));
});
test('failed connections/queries and missing TLS evidence fail and close the client', async () => {
  for (const options of [{ failConnect: true }, { failQuery: true }, { tls: false }, { authorized: false }]) {
    const { Client, calls } = fakeClient(options);
    await assert.rejects(() => checkRemote(Client, remoteConfig(env())));
    assert.deepEqual(calls.slice(-2), ['ROLLBACK', 'end']);
  }
});
test('hosted proxy TLS is verified at the client socket, separately from the internal database hop', async () => {
  const { Client } = fakeClient({ backendTls: false });
  const report = await checkRemote(Client, remoteConfig(env()));
  assert.equal(report.tlsCertificateVerified, true);
  assert.equal(report.backendConnectionTls, false);
});
