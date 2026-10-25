import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const latest = JSON.parse(await readFile(path.join(root, 'qa-tools/latest-run.json'), 'utf8'));
const report = JSON.parse(await readFile(path.join(root, latest.path, 'results.json'), 'utf8'));
const markdown = await readFile(path.join(root, 'QA_SUMMARY.md'), 'utf8');
assert(markdown.includes(`| Expanded QA (${report.results.length} cases) | ${report.counts.passed} | ${report.counts.failed} |`));
for (const [, target] of markdown.matchAll(/\]\(([^)]+)\)/g)) await access(path.resolve(root, target));

const require = createRequire(path.join(root, 'prototype/package.json'));
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  await page.goto(pathToFileURL(path.join(root, 'QA_SUMMARY.html')).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.$$eval('[data-test-status]', rows => rows.length), report.results.length);
  assert.equal(await page.$$eval('[data-test-status="Failed"]', rows => rows.length), report.counts.failed);
  assert.deepEqual(await page.$$eval('details', nodes => nodes.map(n => n.querySelectorAll('tbody tr').length)), [report.results.length, report.deferred.length]);
  assert.deepEqual(await page.$$eval('.card strong', nodes => nodes.map(n => Number(n.textContent))), [192, 184, 8, 33]);
  assert(await page.$eval('header img', img => img.complete && img.naturalWidth > 0));
  for (const target of await page.$$eval('a', links => links.map(a => a.href))) await access(fileURLToPath(target));
  const layouts = [];
  for (const width of [390, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.$$eval('details', nodes => nodes.forEach(n => { n.open = true; }));
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(documentWidth <= width, `Summary overflows at ${width}px: ${documentWidth}`);
    layouts.push(width);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'Passed', scope: 'Summary document verification only',
    resultRows: report.results.length, failedRows: report.counts.failed, deferredRows: report.deferred.length,
    viewports: layouts, assetsAndLinks: 'Passed', browserErrors: errors }, null, 2));
} finally {
  await browser.close();
}
