import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';

globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const tools = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(tools);
const legacy = process.argv.includes('--legacy');
const notes = process.argv.includes('--notes');
if (legacy && notes) throw new Error('Choose --legacy or --notes, not both.');
const name = legacy ? 'CONTIGOO_PLATFORM_BLUEPRINT' : notes ? 'CONTIGOO_STUDIO_NOTES' : 'CONTIGOO_QUICK_GUIDE';
const reportPrefix = legacy ? '' : notes ? 'notes-' : 'quick-';
const base = path.join(root, name);
const source = await readFile(base + '.md', 'utf8');
const bytes = await readFile(base + '.pdf');
if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF header');
const expectedPages = source.trim().split(/\s*<!-- pagebreak -->\s*/).length;
if (!legacy && expectedPages !== (notes ? 4 : 3)) throw new Error(notes ? 'The notes must remain four pages.' : 'The quick guide must remain three pages.');
const loadingTask = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, isEvalSupported: false });
const pdf = await loadingTask.promise;
if (pdf.numPages !== expectedPages) throw new Error(`Expected ${expectedPages} pages, received ${pdf.numPages}`);

const report = {
  document: name + '.pdf',
  verifiedAt: new Date().toISOString(),
  sha256: createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  pages: pdf.numPages,
  expectedPages,
  applicationTests: 'Not run — this validates the document only.',
  pageChecks: [],
  cases: [],
};
let fullText = '';
const previews = path.join(tools, legacy ? 'previews' : notes ? 'notes-previews' : 'quick-previews');
await mkdir(previews, { recursive: true });
const thumbnailWidth = 210;
const thumbnailHeight = 297;
const columns = Math.min(5, pdf.numPages);
const rows = Math.ceil(pdf.numPages / columns);
const contact = createCanvas(columns * (thumbnailWidth + 20) + 20, rows * (thumbnailHeight + 38) + 20);
const ctx = contact.getContext('2d');
ctx.fillStyle = '#dcd5c9'; ctx.fillRect(0, 0, contact.width, contact.height);

for (let index = 1; index <= pdf.numPages; index++) {
  const page = await pdf.getPage(index);
  const content = await page.getTextContent();
  const text = content.items.filter(item => 'str' in item).map(item => item.str).join(' ');
  if (text.trim().length < 100) throw new Error(`Page ${index} has unexpectedly little text`);
  fullText += `\n\n--- PAGE ${index} ---\n${text}`;
  const viewport = page.getViewport({ scale: 1 });
  if (Math.abs(viewport.width - 595.28) > 2 || Math.abs(viewport.height - 841.89) > 2) throw new Error(`Page ${index} is not A4`);
  const outOfPage = content.items.filter(item => 'str' in item && item.str.trim() && (item.transform[4] < -1 || item.transform[4] > viewport.width + 1 || item.transform[5] < -1 || item.transform[5] > viewport.height + 1));
  if (outOfPage.length) throw new Error(`Page ${index} contains text origins outside page bounds`);
  report.pageChecks.push({ page: index, characters: text.length, widthPt: viewport.width, heightPt: viewport.height, textWithinPage: true });
  const renderViewport = page.getViewport({ scale: 1.25 });
  const canvas = createCanvas(Math.ceil(renderViewport.width), Math.ceil(renderViewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;
  const x = 20 + ((index - 1) % columns) * (thumbnailWidth + 20);
  const y = 20 + Math.floor((index - 1) / columns) * (thumbnailHeight + 38);
  ctx.drawImage(canvas, x, y, thumbnailWidth, thumbnailHeight);
  ctx.fillStyle = '#30312e'; ctx.font = '13px sans-serif'; ctx.fillText(`Page ${index}`, x, y + thumbnailHeight + 18);
  if (notes || [1, 2, 6, 15, 22, 29, pdf.numPages].includes(index)) {
    await writeFile(path.join(previews, `page-${String(index).padStart(2, '0')}.png`), canvas.toBuffer('image/png'));
  }
  page.cleanup();
}
const caseCount = legacy ? 48 : 6;
const sectionCount = legacy ? 32 : notes ? 4 : 3;
for (let n = 1; n <= caseCount; n++) {
  const id = legacy ? `T${String(n).padStart(2, '0')}` : `${notes ? 'N' : 'Q'}${n}`;
  const pattern = legacy ? `^### ${id} ·` : `^- \\*\\*${id} —`;
  const count = [...source.matchAll(new RegExp(pattern, 'gm'))].length;
  if (count !== 1 || !fullText.includes(id)) throw new Error(`Missing or duplicate test case ${id}`);
  report.cases.push({ id, definitionCount: count, presentInPdf: true, execution: 'Not run' });
}
for (let n = 1; n <= sectionCount; n++) {
  const prefix = `${String(n).padStart(2, '0')} ·`;
  if (!fullText.includes(prefix)) throw new Error(`Missing section ${prefix}`);
}
if (legacy) {
  const secondPage = await pdf.getPage(2);
  const links = (await secondPage.getAnnotations()).filter(a => a.subtype === 'Link');
  if (links.length < 32) throw new Error(`Expected at least 32 contents links, found ${links.length}`);
  if (!fullText.includes('SUPERSEDED REFERENCE')) throw new Error('Legacy document is missing its superseded notice.');
  report.contentsLinks = links.length;
} else {
  for (const phrase of notes ? ['Contigoo Studio', 'Clients do not log in', 'only Super Admin', 'username OR email OR phone', 'not recorded here', 'PostgreSQL', 'employees', 'N6'] : ['Contigoo Studio', 'Restaurant', 'E-commerce', 'S1', 'S6', 'old CRM-led dates are withdrawn', 'internal', 'sole Super Admin']) {
    if (!fullText.toLowerCase().includes(phrase.toLowerCase())) throw new Error(`Missing corrected product direction: ${phrase}`);
  }
}
await writeFile(path.join(previews, 'contact-sheet.png'), contact.toBuffer('image/png'));
await writeFile(path.join(tools, reportPrefix + 'extracted-text.txt'), fullText);
await writeFile(path.join(tools, reportPrefix + 'validation-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Verified ${pdf.numPages} A4 pages, ${sectionCount} sections and ${caseCount} acceptance definitions.`);
console.log(`PDF size: ${(bytes.length / 1024 / 1024).toFixed(2)} MB. Page renders and contact sheet saved to ${previews}.`);
await loadingTask.destroy();
