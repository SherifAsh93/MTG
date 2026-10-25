import { mkdir, access, stat, writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

if (process.platform !== 'win32') throw new Error('This downloader is for local Windows setup. On Linux use the matching PostgreSQL package or the provided Compose configuration.');
const version = process.argv.includes('--17') ? '17.11' : '18.6';
const root = 'C:/Users/sheri/AppData/Local/Temp/opencode';
const home = path.join(root, `postgresql-${version}`);
const archive = path.join(root, `postgresql-${version}-4-windows-x64-binaries.zip`);
const url = `https://get.enterprisedb.com/postgresql/postgresql-${version}-4-windows-x64-binaries.zip`;
const bytesExpected = version === '17.11' ? 379726839 : 382815572;
await access(root);
await mkdir(home, { recursive: true });
let exists = false;
try { exists = (await stat(archive)).size === bytesExpected; } catch { /* Download below. */ }
if (!exists) {
  console.log(`Downloading PostgreSQL ${version} Windows binaries from the official EDB distribution (${Math.round(bytesExpected / 1024 / 1024)} MB).`);
  const response = await fetch(url, { signal: AbortSignal.timeout(600000) });
  if (!response.ok || !response.headers.get('content-type')?.includes('zip')) throw new Error(`Unexpected download response: ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
}
if ((await stat(archive)).size !== bytesExpected) throw new Error('Archive size does not match the official download response.');
const hash = createHash('sha256'); for await (const chunk of createReadStream(archive)) hash.update(chunk);
const sha256 = hash.digest('hex');
const postgres = path.join(home, 'pgsql', 'bin', 'postgres.exe');
try { await access(postgres); } catch {
  console.log('Extracting the portable database binaries; no Windows service or global PATH changes.');
  execFileSync('tar.exe', ['-xf', archive, '-C', home], { stdio: 'inherit', timeout: 240000 });
}
const installed = execFileSync(postgres, ['--version'], { encoding: 'utf8' }).trim();
if (!installed.includes(version)) throw new Error(`Unexpected PostgreSQL version: ${installed}`);
await writeFile(path.join(home, 'download-info.json'), JSON.stringify({ version, url, bytes: bytesExpected, sha256, installed, downloadedAt: new Date().toISOString(), verification: 'Official HTTPS source, expected size, extracted executable version and locally recorded SHA-256; no independently published checksum was compared.' }, null, 2));
console.log(`${installed} ready at ${path.dirname(postgres)}`);
console.log(`Archive SHA-256: ${sha256}`);
