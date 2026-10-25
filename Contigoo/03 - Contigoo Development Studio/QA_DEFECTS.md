# Contigoo Studio — QA defect register

Audited build: `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c` · 22 September 2026.

**Status: five confirmed open defects, represented by eight failing cases.** This was a QA audit; application behavior has not been changed to conceal or bypass failures. Test-harness corrections are documented separately below.

Final evidence: [QA execution report](QA_EXECUTION_REPORT.md) and [raw results](qa-tools/results/2026-09-22T16-27-15-932Z/results.json).

## Summary

| ID | Priority | Finding | Failing cases | Status |
|---|---|---|---|---|
| D01 | High | Successful-save messages overwrite browser-storage failure feedback | B-STORAGE-client-create, project-create, record-save, default-prices | Open |
| D02 | High | Editing in a second tab can overwrite changes made in the first tab | B-STORAGE-MULTITAB | Open |
| D03 | Medium | App library filter pills overflow a 768px tablet viewport | B-LAYOUT-768x1024 | Open |
| D04 | Medium | Structurally invalid stored project crashes startup without recovery UI | B-STORAGE-CORRUPT | Open |
| D05 | Medium | Unrecognized storage schema is silently replaced as the active workspace | B-STORAGE-FUTURE | Open |

## D01 — Storage failure is presented as success

**Observed:** simulated `QuotaExceededError` leaves persisted state unchanged, but the interface says “Client created”, “Project created”, “Demo record saved” or “Default prices saved”. The new values exist only in memory; reloading can lose them.

**Reproduce with isolated synthetic data:**
1. Open the appropriate creation/record/pricing form and enter valid data.
2. In the test context only, make `Storage.prototype.setItem` throw a synthetic `QuotaExceededError`.
3. Submit the form and inspect both the feedback and the unchanged stored workspace.
4. Observe the misleading success message. Dispose of the test context after the check.

**Cause:** `prototype/app.mjs` `save()` catches the storage error and displays a warning but returns normally. Callers then close/rerender and issue a new success toast. Relevant paths include `clientDialog`, `newProject`, `studio-ui.mjs` `showRuntime()` and `openPriceBook()`.

**Fix direction:** propagate the save result/failure consistently; only confirm persisted success after persistence succeeds. Preserve entered data for retry or explicitly label it unsaved. Check all callers of the shared helper. The existing version-save and destructive-management paths already use a separate atomic persistence helper; their dedicated checks passed.

**Retest:** all four failing cases pass; successful saves still persist across reload; no duplicate clients/projects appear after a failed-save retry.

Evidence: [client](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-client-create.png), [project](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-project-create.png), [record](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-record-save.png), [prices](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-default-prices.png).

## D02 — Lost updates between browser tabs

**Observed:** two tabs load the same initial workspace. Tab A creates “QA Tab Alpha”; tab B then creates “QA Tab Beta”. The persisted client list contains only the initial clients and Tab Beta—the first tab's new client is lost. No conflict is reported.

**Reproduce:**
1. Open two tabs on the same test origin before either is edited.
2. Create a synthetic client in tab A.
3. Switch to tab B and create a different synthetic client.
4. Reload/read the stored workspace; tab A's new client is absent.

**Cause:** startup reads the workspace into each tab's memory once. `save()` serializes the whole cached state into the same localStorage key without a revision check, conflict detection or synchronization policy.

**Fix direction:** prevent stale whole-workspace writes. Add an explicit revision/conflict strategy for the prototype; the real backend also needs transaction/revision handling. Synchronization alone must not silently discard unsaved changes.

**Retest:** two-tab changes both survive or the stale write is explicitly rejected; verify create/update/delete/version operations and conflict recovery.

Evidence: [screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-MULTITAB.png), final raw assertion records the persisted names.

## D03 — Tablet App library horizontal overflow

**Observed at 768×1024:** document width is **781px** for a **768px** viewport. The last `.filter-pill` extends to x=781, producing horizontal scrolling.

**Reproduce:** open App library at a 768px-wide viewport with the normal category filters. The model/editor work; this is a responsive-layout defect.

**Cause:** the category pill row does not wrap at this intermediate width. The narrower mobile and wider desktop cases passed.

**Fix direction:** allow the filter row to wrap or scroll within its own bounded region across tablet widths. Preserve desktop/mobile spacing and keyboard access.

**Retest:** 768×1024 passes, and 320/390/1024/1440px layouts continue to pass with every category accessible.

Evidence: [screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-LAYOUT-768x1024.png).

## D04 — Malformed saved project produces a blank application

**Observed:** a syntactically valid stored object with `schema: 1` and a project missing `draft` is accepted by the shallow startup check, then crashes during enhancement. Neither the main application nor a usable recovery screen renders.

**Reproduce in an isolated context:** put `{"schema":1,"clients":[{"id":"broken-project"}],"activity":[]}` in the workspace storage key and reload.

**Cause:** `app.mjs` validates only the schema flag and `clients` array. `enhanceClientDirectory()` immediately accesses `project.draft.name`; enhancement occurs outside the initial parse try/catch.

**Fix direction:** validate stored structure before mutation/enhancement and provide an explicit recovery path while preserving the raw payload. Do not silently replace recoverable data with seeds or an empty workspace.

**Retest:** malformed projects are contained; the UI shows recovery guidance; raw data remains available; normal legacy migrations still preserve IDs, records and publications.

Evidence: [screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-CORRUPT.png); browser exception is captured in raw results.

## D05 — Unknown schema silently resets the active workspace

**Observed:** loading a synthetic workspace with `schema: 999` replaces the active storage entry with a new empty schema-1 workspace without visible version/recovery feedback. **In the tested fresh context, a raw legacy backup was retained**; this is not a claim of irreversible loss in that test.

**Reproduce in an isolated context:** save an unsupported schema value with a unique synthetic marker, reload, compare the primary storage key and visible feedback.

**Cause:** unsupported schema falls back to `initialState()`, followed by unconditional startup saving. Backup keys may be created, but no restore/version-mismatch UI is presented.

**Fix direction:** explicitly handle unsupported versions and preserve the current payload. Offer an intentional recovery/reset path rather than treating an unrecognized version as a first visit.

**Retest:** original payload is preserved or recoverable through explicit UI; backup availability is reported; fresh visits still start empty.

Evidence: [screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-FUTURE.png), raw result confirms that the legacy backup existed in this test.

## Harness findings excluded from product defects

- The first pass clicked an underlying storefront button rather than the button inside the preview dialog. The selector was scoped to `#dialog`; the real storefront action then passed. This is not an application defect.
- The first two-tab attempt timed out because the automation operated a background tab. Explicit foreground switching corrected the harness. The retest then reproduced the genuine lost-update defect D02.
- Initial results are retained under `qa-tools/results/2026-09-22T16-08-33-564Z/`; targeted retests are retained separately. Final full results come from `2026-09-22T16-27-15-932Z` and include JPEG/WebP upload coverage and every catalog category.

## Separate implementation gaps

The 33 deferred cases are not these five defects. They cover absent real login, employee authorization, database/API, standalone generation, native/PWA delivery, domain engines, billing, integrations and operational acceptance, plus unexecuted cross-browser/accessibility work. App-entity rename/delete, workflow editing and whole-workspace export/import are also absent controls. See the case matrix for their exact status.

## Recommended order

1. Fix D01 and D02 (misleading persistence and lost updates).
2. Fix D03 and the D04/D05 recovery paths.
3. Rerun the same audit and regression suites, preserving this baseline.
4. Implement the backend/authentication/generator foundation and activate the corresponding deferred acceptance cases.
