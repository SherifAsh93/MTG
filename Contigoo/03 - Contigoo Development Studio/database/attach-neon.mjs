import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { privateDirectory, securePrivateDirectory, runNeon } from './neon-access.mjs';
import { remoteConfig, checkRemote } from './remote-config.mjs';

// Attaches only to an explicit existing project. Never creates a project or selects the first account project.
let stage = 'validate project selection';
try {
  const projectId = process.argv[2];
  if (!/^[a-z0-9-]+$/.test(projectId || '')) throw new Error('An explicit existing project ID is required.');
  await securePrivateDirectory();
  stage = 'read project metadata';
  const project = JSON.parse(await runNeon(['projects', 'get', projectId]));
  if (project.id !== projectId || !/contigoo/i.test(project.name)) throw new Error('The selected project is not the expected Contigoo project.');
  stage = 'retrieve private connection';
  const raw = await runNeon(['connection-string', 'production', '--project-id', projectId, '--ssl', 'verify-full', '--extended']);
  const connection = JSON.parse(raw);
  const settings = {
    CONTIGOO_DB_HOST: connection.host, CONTIGOO_DB_PORT: '5432', CONTIGOO_DB_NAME: connection.database,
    CONTIGOO_DB_USER: connection.role, CONTIGOO_DB_PASSWORD: connection.password,
  };
  stage = 'verify database TLS and read-only access';
  const evidence = await checkRemote(Client, remoteConfig(settings));
  stage = 'save restricted private settings';
  const target = path.join(privateDirectory, 'hosted-bootstrap.json');
  try {
    const existing = JSON.parse(await readFile(target, 'utf8'));
    if (existing.projectId !== projectId) throw new Error('Private bootstrap settings already belong to another project.');
    // Preserve existing credentials rather than silently replacing them.
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(target, JSON.stringify({ projectId, branch: 'production', settings }, null, 2), { flag: 'wx', mode: 0o600 });
  }
  console.log(JSON.stringify({ projectName: project.name, region: project.region_id,
    postgresMajor: project.pg_version, ...evidence, privateConnectionSaved: true }, null, 2));
} catch (error) {
  // Provider/driver errors may contain identifiers, SQL or connection secrets.
  console.error('Attaching the existing Neon project failed. No raw account or credential output was logged.');
  console.error(`Stage: ${stage}`);
  if (/^An explicit|^The selected|^Private bootstrap|^Neon command/.test(error.message)) console.error(error.message);
  else if (error.message === 'Remote connection evidence is incomplete.') console.error(error.message);
  else if (typeof error.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code)) console.error(`Diagnostic code: ${error.code}`);
  process.exitCode = 1;
}
