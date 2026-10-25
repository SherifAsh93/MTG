# Prototype QA audit tools

These tools test the local prototype with synthetic state and isolated browser contexts. They live outside the public prototype repository and do not deploy or modify application source, real accounts or existing browser workspaces.

From `D:\Contigoo\01 Contigoo Platform`:

```powershell
node qa-tools/run.mjs --list
node qa-tools/run.mjs
node qa-tools/run.mjs --only=B-STORAGE
```

Run `npm test` and `npm run test:static` from `prototype/` first to refresh the baseline evidence. The audit resolves Puppeteer from `prototype/node_modules`; it uses installed Edge on Windows or `PUPPETEER_EXECUTABLE_PATH` if provided.

- `QA_TEST_CASES.md`: generated case matrix, steps, expected results and deferred production cases.
- `QA_EXECUTION_REPORT.md`: latest **full** audit report. A filtered retest does not overwrite it.
- `results/<timestamp>/`: immutable per-run JSON, incremental results, screenshots, synthetic upload fixtures and copied baseline evidence.
- `latest-run.json`: points to the latest full/filtered run.

## Readable audit summary

Run `node qa-tools/summary.mjs` from the project root to generate `QA_SUMMARY.md` and `QA_SUMMARY.html` from the retained full audit. Open the HTML directly in a browser; it uses existing local prototype assets and needs no server or installation. This is report generation, not an application test rerun.

The defect narrative is pinned to the audited build and failing case IDs. After fixes or a new build, review that narrative before generating a replacement. Filtered retests cannot generate the full summary. Optional live evidence is reported as passed only when its status and source commit match; absent evidence does not become a pass, and malformed evidence stops generation.

Run `node qa-tools/verify-summary.mjs` to check the generated result counts, evidence links, local assets and expanded HTML layout at 390/768/1440px using the existing Edge/Puppeteer setup. It verifies the report only; it does not rerun application cases or create new application evidence.

The process exits nonzero when cases fail. Failures are preserved, not relabeled as passes. Tests cover current generic prototype operations and selected risks; they are not a claim of exhaustive inputs, production security, native delivery or domain correctness.
