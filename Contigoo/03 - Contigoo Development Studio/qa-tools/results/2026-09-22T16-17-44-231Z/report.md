# Contigoo Studio — QA execution report

Run: **2026-09-22T16-17-44-231Z** · Source: `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c` · Initial working tree: clean.

## Summary

| Result | Count |
|---|---:|
| Additional QA cases executed | 1 |
| Passed | 0 |
| Failed | 1 |
| Deferred (not implemented / not run) | 33 |
| Existing regression cases passed | 48 / 48 |

- Environment: win32, Node v24.19.0, Edg/153.0.4234.48.
- Test cases: [QA_TEST_CASES.md](QA_TEST_CASES.md). Full reproducible evidence: [results.json](qa-tools/results/2026-09-22T16-17-44-231Z/results.json).
- Every browser case uses a fresh isolated context and synthetic local data. Real saved projects, accounts and credentials are not accessed.
- These results do not prove production authentication, server isolation, generated-app deployment or native mobile readiness.
- Existing regression evidence timestamp: 2026-09-22T15:49:53.251Z. Static evidence timestamp: 2026-09-22T15:49:25.811Z.
- **Filtered execution:** only case IDs containing `B-STORAGE-MULTITAB` were run.

## Failed cases — investigation required

| ID | Severity | Scenario | Actual result | Evidence |
|---|---|---|---|---|
| B-STORAGE-MULTITAB | High | Two tabs must not silently overwrite each other | First tab's client was lost. Persisted names: QA Client Alpha, QA Client Beta, QA Tab Beta; feedback: Client created. Add a project when you are ready. | [Screenshot](qa-tools/results/2026-09-22T16-17-44-231Z/screenshots/B-STORAGE-MULTITAB.png) |

## Full execution matrix

| ID | Area | Result | Scenario |
|---|---|---|---|
| B-STORAGE-MULTITAB | Persistence failure | Failed | Two tabs must not silently overwrite each other |

## Deferred coverage

| ID | Status | Scenario | Reason |
|---|---|---|---|
| P-AUTH-01 | Not implemented | Sole owner bootstrap | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-02 | Not implemented | Username/email/phone login | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-03 | Not implemented | Invalid credentials and throttling | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-04 | Not implemented | Session lifecycle | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-05 | Not implemented | Recovery and identifier changes | Required implementation or delivery contract is absent; no pass claimed. |
| P-USERS-01 | Not implemented | Create/update/disable/delete employees | Required implementation or delivery contract is absent; no pass claimed. |
| P-USERS-02 | Not implemented | Privilege escalation and mass assignment | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-01 | Not implemented | Unassigned client/project access | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-02 | Not implemented | Studio versus generated-app identities | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-03 | Not implemented | Client record creates no Studio account | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-01 | Not implemented | Real persistence and transactions | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-02 | Not implemented | Concurrent updates and scoped references | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-03 | Not implemented | Database provisioning policy | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-01 | Not implemented | Visual model to standalone web app | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-02 | Not implemented | Client credential handoff | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-03 | Not implemented | Upgrade and rollback | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-04 | Not implemented | Reusable package privacy | Required implementation or delivery contract is absent; no pass claimed. |
| P-MOBILE-01 | Not implemented | Android/iOS build and installation | Required implementation or delivery contract is absent; no pass claimed. |
| P-MOBILE-02 | Not implemented | Installation, offline and sync | Required implementation or delivery contract is absent; no pass claimed. |
| P-FILES-01 | Not implemented | Server upload/download authorization | Required implementation or delivery contract is absent; no pass claimed. |
| P-AI-01 | Not implemented | Real structured edit provider | Required implementation or delivery contract is absent; no pass claimed. |
| P-DOMAIN-01 | Not implemented | Inventory/order invariants | Required implementation or delivery contract is absent; no pass claimed. |
| P-DOMAIN-02 | Not implemented | Finance/HR correctness | Required implementation or delivery contract is absent; no pass claimed. |
| P-BILLING-01 | Not implemented | Real payment/entitlement changes | Required implementation or delivery contract is absent; no pass claimed. |
| P-OPS-01 | Not implemented | HTTPS/restart/backup restoration | Required implementation or delivery contract is absent; no pass claimed. |
| P-OPS-02 | Not implemented | Operational evidence | Required implementation or delivery contract is absent; no pass claimed. |
| P-PERF-01 | Not implemented | Concurrent capacity and limits | Required implementation or delivery contract is absent; no pass claimed. |
| P-BUILDER-ENTITY | Not implemented | App-specific entity rename/delete | Required implementation or delivery contract is absent; no pass claimed. |
| P-BUILDER-RULE | Not implemented | Edit existing workflow | Required implementation or delivery contract is absent; no pass claimed. |
| P-TRANSFER-01 | Not implemented | Full workspace export/import | Required implementation or delivery contract is absent; no pass claimed. |
| P-CROSS-BROWSER | Not run | Firefox/Safari and physical iOS/Android | This pass uses installed Chromium-based Edge only; other engines/physical devices are unavailable. |
| P-ACCESSIBILITY | Not run | Assistive technology and full WCAG review | Automated viewport and limited keyboard checks are not a full accessibility certification. |
| P-L10N | Not implemented | Arabic/RTL and localization | Localized/RTL interface and locale requirements are not implemented/approved. |

## Reading the evidence

A failed case is a reproducible discrepancy for investigation, not a passed test with a warning. A deferred case was not executed against a working implementation. Regression checks can pass while newly explored edge cases fail. No finite suite covers every possible combination; the matrix makes the tested boundaries explicit.
