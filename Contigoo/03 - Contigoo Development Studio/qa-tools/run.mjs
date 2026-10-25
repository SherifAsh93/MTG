import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { modelCases } from './model-cases.mjs';
import { browserCases } from './browser-cases.mjs';
import { pendingCases } from './pending-cases.mjs';
import { fixture } from './fixtures.mjs';
import { createPrototypeServer } from '../prototype/server.mjs';
import { STORAGE_KEY } from '../prototype/model.mjs';

const tools = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tools, '..');
const prototype = path.join(root, 'prototype');
const cases = [...modelCases, ...browserCases];
assert.equal(new Set([...cases, ...pendingCases].map(c => c.id)).size, cases.length + pendingCases.length, 'Duplicate QA case ID');
const md = value => String(value ?? '').replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: prototype, encoding: 'utf8' }).trim();
const status = execFileSync('git', ['status', '--porcelain'], { cwd: prototype, encoding: 'utf8' }).trim();
const plan = `# Contigoo Studio — QA test cases\n\nGenerated from the executable QA definitions. Source: \`qa-tools/model-cases.mjs\`, \`browser-cases.mjs\`, \`pending-cases.mjs\`.\n\n## Scope and environment\n\n- Tested application baseline: \`${commit}\`${status ? ' (working tree has changes; execution reports retain status)' : ' (clean working tree)'}.\n- ${cases.length} additional executable cases: ${modelCases.length} model, ${browserCases.length} browser; ${pendingCases.length} explicitly deferred cases. The existing 48-check regression suite and static/live smoke tests are separate evidence.\n- Covers current operations with positive, negative, boundary, persistence, dependency, safe-rendering and responsive cases. This is risk-based coverage of this build, **not proof that every possible input/combination or future feature has been tested**.\n- Browser cases use isolated contexts and synthetic data on an ephemeral loopback server. Real owner/customer records and credentials are never loaded.\n- Generic CRUD for every built-in module is tested; that is not verification of native mobile packaging, financial/stock engines, login or production isolation.\n- Execution results: \`QA_EXECUTION_REPORT.md\`; timestamped JSON/screenshots under \`qa-tools/results/\`.\n\n## Executable scenarios\n\n| ID | Area / layer | Scenario | Steps | Expected result |\n|---|---|---|---|---|\n${cases.map(c => `| ${c.id} | ${md(c.area)} / ${c.layer} | ${md(c.title)} | ${md(c.steps)} | ${md(c.expected)} |`).join('\n')}\n\n## Deferred scenarios — not passed\n\n| ID | Area | Scenario / steps | Expected result | Status / reason |\n|---|---|---|---|---|\n${pendingCases.map(c => `| ${c.id} | ${md(c.area)} | ${md(c.title)}: ${md(c.steps)} | ${md(c.expected)} | ${c.status}: ${md(c.reason)} |`).join('\n')}\n`;
await writeFile(path.join(root, 'QA_TEST_CASES.md'), plan);
if (process.argv.includes('--list')) {
  console.log(`QA matrix created: ${cases.length} executable cases (${modelCases.length} model, ${browserCases.length} browser), ${pendingCases.length} deferred.`);
  process.exit(0);
}

const filter = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
const selected = filter ? cases.filter(c => c.id.includes(filter)) : cases;
if (!selected.length) throw new Error(`No scenarios match ${filter}`);
const runId = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const output = path.join(tools, 'results', runId);
const shots = path.join(output, 'screenshots'); const assetsDir = path.join(output, 'fixtures');
await mkdir(shots, { recursive: true }); await mkdir(assetsDir, { recursive: true });
const assets = { validPng: path.join(prototype, 'assets', 'logo.png'), validJpeg: path.join(assetsDir, 'valid.jpg'), validWebp: path.join(assetsDir, 'valid.webp'), invalidMime: path.join(assetsDir, 'invalid.txt'), tooLarge: path.join(assetsDir, 'too-large.png'), corruptPng: path.join(assetsDir, 'corrupt.png') };
await writeFile(assets.invalidMime, 'Synthetic text, not an image.'); await writeFile(assets.tooLarge, Buffer.alloc(1024 * 1024 + 1)); await writeFile(assets.corruptPng, 'Not PNG bytes');
let regression = null; let staticReport = null;
try { regression = JSON.parse(await readFile(path.join(prototype, 'validation-report.json'), 'utf8')); } catch { /* Report missing baseline explicitly. */ }
try { staticReport = JSON.parse(await readFile(path.join(prototype, 'static-validation-report.json'), 'utf8')); } catch { /* Report missing baseline explicitly. */ }
if (regression) await writeFile(path.join(output, 'regression-evidence.json'), JSON.stringify(regression, null, 2));
if (staticReport) await writeFile(path.join(output, 'static-evidence.json'), JSON.stringify(staticReport, null, 2));

const server = createPrototypeServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const require = createRequire(path.join(prototype, 'package.json'));
const { default: puppeteer } = await import(pathToFileURL(require.resolve('puppeteer-core')).href);
const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, protocolTimeout: 30000 });
const browserVersion = await browser.version();
const canvasPage = await browser.newPage();
for (const [key, type] of [['validJpeg', 'image/jpeg'], ['validWebp', 'image/webp']]) {
  const data = await canvasPage.evaluate(type => { const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#916b3d'; ctx.fillRect(0, 0, 2, 2); return canvas.toDataURL(type); }, type);
  assert(data.startsWith(`data:${type};base64,`)); await writeFile(assets[key], Buffer.from(data.split(',')[1], 'base64'));
}
await canvasPage.close();
const results = [];
try {
  for (const c of selected) {
    const contexts = []; const pages = []; const errors = []; const started = performance.now();
    const workspace = async (options = {}) => {
      const f = fixture(options); const context = await browser.createBrowserContext(); contexts.push(context);
      const page = await context.newPage(); pages.push(page); page.setDefaultTimeout(6000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${new URL(response.url()).pathname}`); });
      await page.setViewport({ width: 1440, height: 1000 });
      if (options.denyStorage) {
        await page.evaluateOnNewDocument(() => { Storage.prototype.getItem = () => { throw new Error('QA storage denied'); }; Storage.prototype.setItem = () => { throw new Error('QA storage denied'); }; });
      } else {
        await page.evaluateOnNewDocument((key, raw) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, STORAGE_KEY, options.raw ?? JSON.stringify(f.state));
      }
      await page.goto(url, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
      const fill = async (selector, value) => { await page.focus(selector); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); if (String(value)) await page.keyboard.type(String(value)); };
      const change = async (selector, value) => { await fill(selector, value); await page.$eval(selector, n => n.dispatchEvent(new Event('change', { bubbles: true }))); };
      const state = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
      const openProject = async (id = f.a.id) => { await page.click('[data-nav="builder"]'); await page.click(`[data-edit="${id}"]`); };
      const editor = async () => { await openProject(); await page.click(`[data-edit-app="${f.app.id}"]`); };
      return { page, context, f, fill, change, state, openProject, editor };
    };
    let result;
    try {
      await c.run({ workspace, url, assets });
      assert.deepEqual(errors, [], 'Unexpected browser/asset errors');
      result = { ...c, status: 'Passed', actual: 'All assertions for the listed expected result passed.', durationMs: Math.round(performance.now() - started) };
      console.log(`PASS ${c.id}: ${c.title}`);
    } catch (error) {
      result = { ...c, status: 'Failed', actual: error.message, browserErrors: errors, durationMs: Math.round(performance.now() - started) };
      if (pages.length) {
        const image = path.join(shots, `${c.id}.png`);
        try { const activePages = await contexts.at(-1).pages(); const shotPage = activePages.at(-1) || pages.at(-1); await shotPage.bringToFront(); await shotPage.screenshot({ path: image, fullPage: true }); result.screenshot = path.relative(root, image).replaceAll('\\', '/'); } catch { /* Keep the primary failure. */ }
      }
      console.error(`FAIL ${c.id}: ${String(error.message).slice(0, 450)}`);
    } finally {
      for (const context of contexts) await context.close();
    }
    delete result.run; results.push(result);
    await writeFile(path.join(output, 'results.partial.json'), JSON.stringify({ runId, commit, results }, null, 2));
  }
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
const counts = { passed: results.filter(r => r.status === 'Passed').length, failed: results.filter(r => r.status === 'Failed').length, deferred: pendingCases.length };
const report = { runId, sourceCommit: commit, workingTreeAtStart: status || 'clean', environment: { node: process.version, platform: process.platform, browser: browserVersion }, scope: 'Prototype QA only; no production access/security/domain acceptance claims', counts, results, deferred: pendingCases, regression: regression ? { date: regression.date, total: regression.results.length, passed: regression.results.filter(r => r.status === 'passed').length, browserErrors: regression.browserErrors } : 'Not run in available evidence', staticChecks: staticReport ? { verifiedAt: staticReport.verifiedAt, checks: staticReport.checks, errors: staticReport.errors } : 'Not run in available evidence' };
await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(path.join(tools, 'latest-run.json'), JSON.stringify({ runId, path: path.relative(root, output).replaceAll('\\', '/'), counts, sourceCommit: commit }, null, 2));
const failures = results.filter(r => r.status === 'Failed');
const summary = `# Contigoo Studio — QA execution report\n\nRun: **${runId}** · Source: \`${commit}\` · Initial working tree: ${status || 'clean'}.\n\n## Summary\n\n| Result | Count |\n|---|---:|\n| Additional QA cases executed | ${results.length} |\n| Passed | ${counts.passed} |\n| Failed | ${counts.failed} |\n| Deferred (not implemented / not run) | ${pendingCases.length} |\n| Existing regression cases passed | ${report.regression.passed ?? 'No evidence'} / ${report.regression.total ?? '?'} |\n\n- Environment: ${process.platform}, Node ${process.version}, ${browserVersion}.\n- Test cases: [QA_TEST_CASES.md](QA_TEST_CASES.md). Full reproducible evidence: [results.json](${path.relative(root, path.join(output, 'results.json')).replaceAll('\\', '/')}).\n- Every browser case uses a fresh isolated context and synthetic local data. Real saved projects, accounts and credentials are not accessed.\n- These results do not prove production authentication, server isolation, generated-app deployment or native mobile readiness.\n- Existing regression evidence timestamp: ${report.regression.date ?? 'not available'}. Static evidence timestamp: ${report.staticChecks.verifiedAt ?? 'not available'}.\n${filter ? `- **Filtered execution:** only case IDs containing \`${filter}\` were run.\n` : ''}\n## Failed cases — investigation required\n\n${failures.length ? '| ID | Severity | Scenario | Actual result | Evidence |\n|---|---|---|---|---|\n' + failures.map(r => `| ${r.id} | ${r.severity || 'Medium'} | ${md(r.title)} | ${md(r.actual)} | ${r.screenshot ? `[Screenshot](${r.screenshot})` : 'Model assertion; see JSON'} |`).join('\n') : 'No failures in the executed cases.'}\n\n## Full execution matrix\n\n| ID | Area | Result | Scenario |\n|---|---|---|---|\n${results.map(r => `| ${r.id} | ${md(r.area)} | ${r.status} | ${md(r.title)} |`).join('\n')}\n\n## Deferred coverage\n\n| ID | Status | Scenario | Reason |\n|---|---|---|---|\n${pendingCases.map(r => `| ${r.id} | ${r.status} | ${md(r.title)} | ${md(r.reason)} |`).join('\n')}\n\n## Reading the evidence\n\nA failed case is a reproducible discrepancy for investigation, not a passed test with a warning. A deferred case was not executed against a working implementation. Regression checks can pass while newly explored edge cases fail. No finite suite covers every possible combination; the matrix makes the tested boundaries explicit.\n`;
await writeFile(path.join(output, 'report.md'), summary);
if (!filter) await writeFile(path.join(root, 'QA_EXECUTION_REPORT.md'), summary);
console.log(`QA complete: ${counts.passed} passed, ${counts.failed} failed, ${pendingCases.length} deferred. Evidence: ${output}`);
if (counts.failed) process.exitCode = 1;
