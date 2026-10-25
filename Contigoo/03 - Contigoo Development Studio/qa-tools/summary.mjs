import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const tools = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tools, '..');
const latest = JSON.parse(await readFile(path.join(tools, 'latest-run.json'), 'utf8'));
const report = JSON.parse(await readFile(path.join(root, latest.path, 'results.json'), 'utf8'));
if (report.results.length < 100) throw new Error('Generate the summary after a full QA run, not a filtered retest.');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const groups = [...new Set(report.results.map(c => c.area))].map(area => {
  const cases = report.results.filter(c => c.area === area);
  return { area, total: cases.length, passed: cases.filter(c => c.status === 'Passed').length, failed: cases.filter(c => c.status === 'Failed').length };
});
const baseline = report.regression.total;
const total = baseline + report.results.length;
const passed = report.regression.passed + report.counts.passed;
const failed = baseline - report.regression.passed + report.counts.failed;
const notImplemented = report.deferred.filter(c => c.status === 'Not implemented').length;
const notRun = report.deferred.filter(c => c.status === 'Not run').length;
let live = null;
try {
  live = JSON.parse(await readFile(path.join(root, latest.path, 'live-smoke.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const livePassed = live?.status === 'Passed' && live.sourceCommit === report.sourceCommit;
const liveSentence = livePassed
  ? `The live GitHub Pages smoke test passed for this build on ${live.verifiedOn}.`
  : 'No matching passed live-site smoke evidence is attached to this run.';
const staticPassed = report.staticChecks?.checks?.length > 0 && report.staticChecks?.errors?.length === 0;
const staticSentence = staticPassed
  ? `Static repository-subpath checks passed (${report.staticChecks.verifiedAt}).`
  : 'No passed static-site evidence is attached to this run.';
// Keep the defect narrative tied to its audited build; never carry it into a new retest silently.
const openDefects = [
  ['High', 'Storage errors are followed by success messages', 'Four failing cases: client creation, project creation, record saving and default prices.'],
  ['High', 'Two-tab editing loses an earlier change', 'A stale second tab overwrites the first tab’s newly created client.'],
  ['Medium', 'Tablet App library overflows horizontally', '781px content in a 768px viewport; the last category button crosses the edge.'],
  ['Medium', 'Malformed stored state crashes startup', 'An invalid project shape results in a blank app without a recovery screen.'],
  ['Medium', 'Unknown schema resets the active workspace silently', 'A raw backup existed in the test, but no version/recovery message was shown.'],
];
const expectedFailures = [
  'B-STORAGE-client-create', 'B-STORAGE-project-create', 'B-STORAGE-record-save',
  'B-STORAGE-default-prices', 'B-STORAGE-MULTITAB', 'B-LAYOUT-768x1024',
  'B-STORAGE-CORRUPT', 'B-STORAGE-FUTURE',
].sort();
const actualFailures = report.results.filter(c => c.status === 'Failed').map(c => c.id).sort();
if (report.sourceCommit !== '7b1d376c2563b61fbd433a435c4e3cf25c14bd9c'
  || JSON.stringify(actualFailures) !== JSON.stringify(expectedFailures)) {
  throw new Error('Review the summary defect narrative against the new build/results before generating it.');
}
if (report.counts.passed !== report.results.filter(c => c.status === 'Passed').length
  || report.counts.failed !== actualFailures.length
  || report.counts.passed + report.counts.failed !== report.results.length
  || report.counts.deferred !== report.deferred.length) {
  throw new Error('QA result counts do not match the case evidence.');
}
const coverage = [
  'All 10 starting points and generic record create/read/edit/delete for all 13 catalog modules.',
  'Client/profile/project management, search, selection, archiving/reactivation and deletion.',
  'Entities/fields, supported field types, pages, ordering, visibility, dependent rules, templates and snapshot previews.',
  'Pricing/defaults/discounts, quote-export payload, branding and PNG/JPEG/WebP upload success/rejection.',
  'Reloads, injected storage failures, two-tab editing, malformed/unsupported stored state and five viewport sizes.',
  'Literal rendering of HTML-like input and limited keyboard/dialog operations. Full security, browser/device and accessibility certification are not claimed.',
];
const md = `# Contigoo Studio — QA summary

**Build:** \`${report.sourceCommit}\` · **Final audit:** ${report.runId}

## Final results

| Suite | Passed | Failed |
|---|---:|---:|
| Existing regression suite | ${report.regression.passed} | ${baseline - report.regression.passed} |
| Expanded QA (${report.results.length} cases) | ${report.counts.passed} | ${report.counts.failed} |
| **Combined recorded checks** | **${passed}** | **${failed}** |

**${total} checks in the combined result. ${report.deferred.length} additional cases are deferred: ${notImplemented} not implemented, ${notRun} not run.**

${staticSentence} ${liveSentence}

These are recorded prototype results from 22 September 2026, not production approval or a new application test run. Regression evidence: ${report.regression.date}. Some coverage overlaps between suites.

## Five confirmed open defects

${openDefects.map(([severity, title, detail], i) => `${i + 1}. **${severity} — ${title}.** ${detail}`).join('\n')}

## What was exercised

${coverage.map(item => `- ${item}`).join('\n')}

## Deliverables

- [Readable HTML summary](QA_SUMMARY.html)
- [Test cases with steps and expected results](QA_TEST_CASES.md)
- [Full execution matrix](QA_EXECUTION_REPORT.md)
- [Defect register and reproduction steps](QA_DEFECTS.md)
- [Machine-readable evidence](${latest.path}/results.json)
- [Rerun instructions](qa-tools/README.md)

All tests used isolated synthetic data. Real authentication, server authorization, database/API integration, standalone generation and native delivery remain unimplemented. The empty local PostgreSQL service created separately was stopped at the owner's request; it does not satisfy those acceptance cases.

## Next priorities

Fix failed-save feedback and two-tab lost updates, then tablet layout and stored-data recovery. Rerun the audit after fixes and retain the original evidence. Backend work requires the approved remote/cloud environment under the owner's remote-first constraint.
`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contigoo Studio — QA results</title><style>
@font-face{font-family:Inter;src:url('prototype/assets/inter.woff2')}@font-face{font-family:Fraunces;src:url('prototype/assets/fraunces.woff2')}
*{box-sizing:border-box}body{margin:0;background:#f4f0e9;color:#30312e;font:14px/1.6 Inter,Arial,sans-serif}
main{max-width:1200px;margin:auto;padding:32px 24px 60px}header{display:flex;gap:24px;align-items:center;border-bottom:1px solid #dcd5c9;padding-bottom:22px}
header img{width:145px}header p{margin:0;color:#746f65}h1,h2{font-family:Fraunces,Georgia,serif;line-height:1.2}h1{font-size:37px;margin:26px 0 10px}h2{font-size:25px}
p{color:#746f65}.kicker{color:#916b3d;font-size:12px;letter-spacing:1.5px;text-transform:uppercase}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}
.card,section{background:#fffdf9;border:1px solid #dcd5c9;border-radius:12px;padding:22px;min-width:0}.card strong{display:block;font:36px Fraunces,Georgia,serif}.card span{color:#746f65}
.pass{color:#3d7148}.fail{color:#a44232}.pending{color:#916b3d}section{margin:18px 0}a{color:#79552c}nav{display:flex;flex-wrap:wrap;gap:18px}.table-wrap{overflow:auto}
table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:12px;border-bottom:1px solid #e1dbcf;text-align:left;vertical-align:top}th{background:#edece2}code{font-size:11px;overflow-wrap:anywhere}
li{margin-bottom:10px}summary{cursor:pointer;font-weight:600;margin-bottom:12px}footer{font-size:12px;color:#746f65;margin-top:25px}
@media(max-width:720px){main{padding:20px 14px}.cards{grid-template-columns:repeat(2,1fr)}header{align-items:flex-start;flex-direction:column}h1{font-size:30px}section{padding:17px}}
@media print{body{background:white}.card,section{break-inside:avoid}.cards{grid-template-columns:repeat(4,1fr)}}
</style></head><body><main>
<header><img src="prototype/assets/logo.png" alt="Contigoo"><div><strong>Contigoo Studio</strong><p>Internal Management &amp; Development Platform · QA audit</p></div></header>
<p class="kicker">Evidence-based review · 22 September 2026</p><h1>QA results and next priorities</h1>
<p>Tested build <code>${esc(report.sourceCommit)}</code><br>Final audit <code>${esc(report.runId)}</code> · ${esc(report.environment.browser)}</p>
<div class="cards">
<div class="card"><strong>${total}</strong><span>Combined recorded checks</span></div>
<div class="card"><strong class="pass">${passed}</strong><span>Passed</span></div>
<div class="card"><strong class="fail">${failed}</strong><span>Failed · 5 defects</span></div>
<div class="card"><strong class="pending">${report.deferred.length}</strong><span>Deferred cases</span></div>
</div>
<section><h2>What these results mean</h2>
<p>The existing suite passed ${report.regression.passed} of ${baseline} checks. The expanded audit ran ${report.results.length} cases (${report.counts.passed} passed, ${report.counts.failed} failed). ${esc(staticSentence)} ${esc(liveSentence)}</p>
<p>Recorded results from 22 September 2026; generating this summary is not a new application test run. Some coverage overlaps between suites. All tests used isolated synthetic data. These results do not certify real authentication, databases, standalone generation or native mobile delivery.</p>
<nav><a href="QA_TEST_CASES.md">Test cases</a><a href="QA_EXECUTION_REPORT.md">Full execution report</a><a href="QA_DEFECTS.md">Defects and reproduction</a><a href="${esc(latest.path)}/results.json">Raw evidence</a></nav></section>
<section><h2>Five confirmed open defects</h2><ol>
${openDefects.map(([severity, title, detail]) => `<li><strong class="${severity === 'High' ? 'fail' : 'pending'}">${severity} — ${esc(title)}</strong><br>${esc(detail)}</li>`).join('\n')}
</ol><p><strong>Recommended priority:</strong> address failed-save feedback and lost updates first, then tablet layout and stored-data recovery. Rerun the audit after fixes. Backend work awaits an approved remote/cloud environment.</p></section>
<section><h2>What was exercised</h2><ul>${coverage.map(item => `<li>${esc(item)}</li>`).join('\n')}</ul></section>
<section><h2>Coverage by area</h2><p>${notImplemented} planned cases are not implemented; ${notRun} require additional manual/browser environments.</p>
<div class="table-wrap"><table><thead><tr><th>Area</th><th>Cases</th><th>Passed</th><th>Failed</th></tr></thead><tbody>
${groups.map(g => `<tr><td>${esc(g.area)}</td><td>${g.total}</td><td class="pass">${g.passed}</td><td class="${g.failed ? 'fail' : ''}">${g.failed}</td></tr>`).join('\n')}
</tbody></table></div></section>
<section><details><summary>All ${report.results.length} expanded results</summary><div class="table-wrap"><table><thead><tr><th>ID</th><th>Scenario</th><th>Result</th></tr></thead><tbody>
${report.results.map(r => `<tr data-test-status="${esc(r.status)}"><td><code>${esc(r.id)}</code></td><td>${esc(r.title)}</td><td class="${r.status === 'Passed' ? 'pass' : 'fail'}">${esc(r.status)}</td></tr>`).join('\n')}
</tbody></table></div></details></section>
<section><details><summary>${report.deferred.length} deferred cases</summary><div class="table-wrap"><table><thead><tr><th>ID</th><th>Scenario</th><th>Status</th><th>Reason</th></tr></thead><tbody>
${report.deferred.map(r => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.title)}</td><td class="pending">${esc(r.status)}</td><td>${esc(r.reason)}</td></tr>`).join('\n')}
</tbody></table></div></details></section>
<footer>Finite, risk-based coverage of this build—not a claim that every possible combination or future feature has been tested. Raw results and earlier runs are retained in qa-tools/results.</footer>
</main></body></html>`;

await writeFile(path.join(root, 'QA_SUMMARY.md'), md);
await writeFile(path.join(root, 'QA_SUMMARY.html'), html);
console.log(`QA summaries created: ${total} combined checks, ${passed} passed, ${failed} failed, ${report.deferred.length} deferred.`);
