# Contigoo Studio — QA summary

**Build:** `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c` · **Final audit:** 2026-09-22T16-27-15-932Z

## Final results

| Suite | Passed | Failed |
|---|---:|---:|
| Existing regression suite | 48 | 0 |
| Expanded QA (144 cases) | 136 | 8 |
| **Combined recorded checks** | **184** | **8** |

**192 checks in the combined result. 33 additional cases are deferred: 31 not implemented, 2 not run.**

Static repository-subpath checks passed (2026-09-22T15:49:25.811Z). The live GitHub Pages smoke test passed for this build on 2026-09-22.

These are recorded prototype results from 22 September 2026, not production approval or a new application test run. Regression evidence: 2026-09-22T15:49:53.251Z. Some coverage overlaps between suites.

## Five confirmed open defects

1. **High — Storage errors are followed by success messages.** Four failing cases: client creation, project creation, record saving and default prices.
2. **High — Two-tab editing loses an earlier change.** A stale second tab overwrites the first tab’s newly created client.
3. **Medium — Tablet App library overflows horizontally.** 781px content in a 768px viewport; the last category button crosses the edge.
4. **Medium — Malformed stored state crashes startup.** An invalid project shape results in a blank app without a recovery screen.
5. **Medium — Unknown schema resets the active workspace silently.** A raw backup existed in the test, but no version/recovery message was shown.

## What was exercised

- All 10 starting points and generic record create/read/edit/delete for all 13 catalog modules.
- Client/profile/project management, search, selection, archiving/reactivation and deletion.
- Entities/fields, supported field types, pages, ordering, visibility, dependent rules, templates and snapshot previews.
- Pricing/defaults/discounts, quote-export payload, branding and PNG/JPEG/WebP upload success/rejection.
- Reloads, injected storage failures, two-tab editing, malformed/unsupported stored state and five viewport sizes.
- Literal rendering of HTML-like input and limited keyboard/dialog operations. Full security, browser/device and accessibility certification are not claimed.

## Deliverables

- [Readable HTML summary](QA_SUMMARY.html)
- [Test cases with steps and expected results](QA_TEST_CASES.md)
- [Full execution matrix](QA_EXECUTION_REPORT.md)
- [Defect register and reproduction steps](QA_DEFECTS.md)
- [Machine-readable evidence](qa-tools/results/2026-09-22T16-27-15-932Z/results.json)
- [Rerun instructions](qa-tools/README.md)

All tests used isolated synthetic data. Real authentication, server authorization, database/API integration, standalone generation and native delivery remain unimplemented. The empty local PostgreSQL service created separately was stopped at the owner's request; it does not satisfy those acceptance cases.

## Next priorities

Fix failed-save feedback and two-tab lost updates, then tablet layout and stored-data recovery. Rerun the audit after fixes and retain the original evidence. Backend work happens locally on the owner's personal laptop (corrected 30 September 2026 — the old remote-first constraint is superseded); Neon remains the approved hosted dev database.
