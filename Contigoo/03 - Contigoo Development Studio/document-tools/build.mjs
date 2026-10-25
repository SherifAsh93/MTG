import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const tools = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(tools);
const assets = path.join(tools, 'assets');
const legacy = process.argv.includes('--legacy');
const notes = process.argv.includes('--notes');
if (legacy && notes) throw new Error('Choose --legacy or --notes, not both.');
const name = legacy ? 'CONTIGOO_PLATFORM_BLUEPRINT' : notes ? 'CONTIGOO_STUDIO_NOTES' : 'CONTIGOO_QUICK_GUIDE';
const status = legacy ? 'Superseded reference v0.1' : notes ? 'Private owner notes v1.1' : 'Internal Studio + Management · Guide v0.5';
const reportPrefix = legacy ? '' : notes ? 'notes-' : 'quick-';
const output = path.join(root, name);
await mkdir(assets, { recursive: true });

// Actual homepage assets, inspected 2026-09-21. Once cached, builds work offline.
const assetDefinitions = [
  ['contigoo-dark.png', 'https://contigoo.com/contigoo-dark.png', 'image/png'],
  ['inter-latin.woff2', 'https://contigoo.com/assets-v20260723/_next/static/media/e4af272ccee01ff0-s.p.woff2', 'font/woff2'],
  ['fraunces-latin.woff2', 'https://contigoo.com/assets-v20260723/_next/static/media/cb9f64d62d112b41-s.p.woff2', 'font/woff2'],
];
const assetMap = {};
const manifest = [];
for (const [name, url, mime] of assetDefinitions) {
  const target = path.join(assets, name);
  let bytes;
  try { bytes = await readFile(target); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Asset request failed: ${response.status} ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    const signature = bytes.subarray(0, 4).toString('hex');
    if ((mime === 'image/png' && signature !== '89504e47') ||
        (mime === 'font/woff2' && signature !== '774f4632')) {
      throw new Error(`Unexpected binary format: ${url}`);
    }
    await writeFile(target, bytes);
  }
  assetMap[name] = `data:${mime};base64,${bytes.toString('base64')}`;
  manifest.push({ name, source: url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(path.join(assets, 'SOURCES.json'), JSON.stringify({ inspected: '2026-09-21', assets: manifest }, null, 2) + '\n');

const source = await readFile(output + '.md', 'utf8');
const css = await readFile(path.join(tools, 'print.css'), 'utf8');
const pages = source.trim().split(/\s*<!-- pagebreak -->\s*/);
const titles = pages.map((text, index) => ({
  page: index + 1,
  title: (text.match(/^## (.+)$/m) || text.match(/^# (.+)$/m) || [null, `Page ${index + 1}`])[1],
}));
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const entries = titles.slice(2);
const half = Math.ceil(entries.length / 2);
const toc = '<nav class="toc" aria-label="Table of contents">' + [entries.slice(0, half), entries.slice(half)].map(column =>
  '<div class="toc-column">' + column.map(item => `<a href="#page-${item.page}"><span>${escape(item.title)}</span><span class="page-number">${item.page}</span></a>`).join('') + '</div>'
).join('') + '</nav>';

const body = pages.map((text, index) => {
  const cover = text.includes('<!-- cover -->');
  const compactTables = /^(06|31) ·/.test(titles[index].title);
  const rendered = marked.parse(text.replace('<!-- contents -->', toc), { mangle: false, headerIds: false });
  return `<section class="page${cover ? ' cover' : ''}${compactTables ? ' compact-tables' : ''}${legacy ? '' : ' quick-guide'}${notes ? ' notes-document' : ''}" id="page-${index + 1}" aria-label="${escape(titles[index].title)}">
    ${cover ? '' : `<header class="running-header">${legacy ? '<strong>contigoo</strong>' : `<img class="header-logo" src="${assetMap['contigoo-dark.png']}" alt="Contigoo">`}<span>${legacy ? 'Superseded · Use the current quick guide' : notes ? 'Private · Owner and internal employees' : 'Your internal Studio · Development + management'}</span></header>`}
    <main class="content">${cover ? `<img class="cover-logo" src="${assetMap['contigoo-dark.png']}" alt="Contigoo"><div class="cover-label">Business applications · One foundation</div>` : ''}${rendered}</main>
    <footer class="running-footer"><span>CONTIGOO · ${status} · ${legacy ? '21' : '22'} Sep 2026</span><span>${String(index + 1).padStart(2, '0')} / ${pages.length}</span></footer>
  </section>`;
}).join('\n');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Contigoo — ${status}</title>
<style>@font-face{font-family:Inter;src:url('${assetMap['inter-latin.woff2']}') format('woff2');font-style:normal;font-weight:100 900;font-display:block}@font-face{font-family:Fraunces;src:url('${assetMap['fraunces-latin.woff2']}') format('woff2');font-style:normal;font-weight:100 900;font-display:block}${css}</style></head><body>${body}</body></html>`;
await writeFile(output + '.html', html);

const candidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  try { await access(candidate); executablePath = candidate; break; } catch { /* Try next installed browser. */ }
}
if (!executablePath) throw new Error('No browser found. Set PUPPETEER_EXECUTABLE_PATH to an installed Chromium/Chrome/Edge executable.');
const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1250, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode()));
  });
  const layout = await page.evaluate(() => [...document.querySelectorAll('.page')].map((section, index) => {
    const content = section.querySelector('.content');
    const bounds = content.getBoundingClientRect();
    const visible = [...content.querySelectorAll('*')].filter(e => e.getClientRects().length);
    const overflowElements = visible.filter(e => {
      const b = e.getBoundingClientRect();
      return b.right > bounds.right + 2 || b.left < bounds.left - 2 || b.bottom > bounds.bottom + 2;
    }).map(e => `${e.tagName}: ${(e.textContent || '').trim().slice(0, 90)}`);
    return { page: index + 1, height: content.clientHeight, usedHeight: Math.round(Math.max(bounds.top, ...visible.map(e => e.getBoundingClientRect().bottom)) - bounds.top), overflowElements };
  }));
  const overflow = layout.filter(item => item.overflowElements.length);
  await writeFile(path.join(tools, reportPrefix + 'layout-report.json'), JSON.stringify({ document: name, pages: pages.length, layout, overflow }, null, 2) + '\n');
  if (overflow.length) throw new Error(`Layout overflow: ${JSON.stringify(overflow)}`);
  await page.pdf({ path: output + '.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  console.log(`Generated ${pages.length} pages: ${output}.pdf`);
  console.log('Layout check passed: no content outside page bounds. Fonts and logo embedded.');
} finally { await browser.close(); }
