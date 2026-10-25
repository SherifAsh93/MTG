import { mkdir, chmod } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
export const privateDirectory = path.join(root, '.private');
const configDirectory = path.join(privateDirectory, 'neon');
const cli = path.join(root, 'node_modules', 'neon', 'dist', 'cli.js');

export async function securePrivateDirectory() {
  await mkdir(privateDirectory, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') {
    const identity = execFileSync('whoami.exe', [], { encoding: 'utf8' }).trim();
    execFileSync('icacls.exe', [privateDirectory, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { stdio: 'pipe' });
  } else await chmod(privateDirectory, 0o700);
  await mkdir(configDirectory, { recursive: true, mode: 0o700 });
}

// CLI output can contain account details and connection secrets. Never forward it to logs.
export function runNeon(args, { timeout = 60000, login = false } = {}) {
  const env = { ...process.env };
  delete env.NEON_API_KEY;
  delete env.NEON_PROFILE;
  delete env.DEBUG;
  env.CI = login ? 'false' : 'true'; // Only an explicit login may open browser authorization.
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args, '--config-dir', configDirectory,
      '--no-analytics', '--no-color', '--output', 'json'], {
      cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = ''; let stderr = ''; let announced = false;
    const capture = (chunk, stream) => {
      const text = chunk.toString();
      if (stream === 'stdout') stdout += text; else stderr += text;
      if (login && !announced && /Awaiting authentication|Auth Url:/.test(text)) {
        announced = true;
        console.log('Neon browser authorization opened. Complete sign-in with the intended Contigoo account.');
      }
    };
    child.stdout.on('data', chunk => capture(chunk, 'stdout'));
    child.stderr.on('data', chunk => capture(chunk, 'stderr'));
    const timer = setTimeout(() => { child.kill(); reject(new Error('Neon authorization/command timed out.')); }, timeout);
    child.on('error', () => { clearTimeout(timer); reject(new Error('Unable to start the installed Neon CLI.')); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        const output = stdout + stderr;
        const reason = /Cannot run interactive auth in CI/.test(output) ? 'Interactive login was disabled by the inherited CI environment.'
          : /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(output) ? 'The Neon authentication service could not be reached.'
          : /certificate|CERT_/i.test(output) ? 'TLS certificate verification failed.'
          : /timed out/i.test(output) ? 'Browser authorization timed out.'
          : /Unknown argument/i.test(output) ? 'The CLI rejected an option.'
          : /Unknown profile/i.test(output) ? 'The named CLI profile has not been initialized.'
          : /issuer/i.test(output) ? 'The OAuth discovery issuer was rejected.'
          : /unexpected HTTP|non-2xx|response is not conform|unexpected.*response/i.test(output) ? 'The OAuth service returned an unexpected response.'
          : /EACCES|EPERM|permission denied/i.test(output) ? 'The CLI could not access its private configuration directory.'
          : /Cannot find module|ERR_MODULE_NOT_FOUND/i.test(output) ? 'An installed CLI dependency could not be loaded.'
          : 'No credentials or raw account output were logged.';
        reject(new Error(`Neon command did not complete (exit ${code}). ${reason}`)); return;
      }
      resolve(stdout);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await securePrivateDirectory();
    if (process.argv[2] !== 'login') throw new Error('Use: node database/neon-access.mjs login');
    await runNeon(['login'], { timeout: 300000, login: true });
    console.log('Neon browser authorization completed. Project and database connectivity must be verified separately.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
