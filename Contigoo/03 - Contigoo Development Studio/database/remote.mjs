import { remoteConfig, checkRemote } from './remote-config.mjs';

async function main() {
  let config;
  try { config = remoteConfig(); }
  catch (error) { console.error(error.message); process.exitCode = 1; return; }
  if (process.argv.includes('--check-config')) {
    console.log('Remote settings validated locally. No database connection was attempted.');
    return;
  }
  let Client;
  try { ({ Client } = await import('pg')); }
  catch {
    console.error('The PostgreSQL Node driver is not installed. Install the database/ project dependencies before the remote check.');
    process.exitCode = 1; return;
  }
  try { console.log(JSON.stringify(await checkRemote(Client, config), null, 2)); }
  catch {
    console.error('Remote database readiness failed. Verify private settings, network access, trusted TLS certificate and database permissions. Connection details are not logged.');
    process.exitCode = 1;
  }
}
await main();
