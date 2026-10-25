# Contigoo Platform — Test execution ledger

Updated 23 September 2026: the browser-local prototype and first hosted database foundation have executed evidence below. Full API/browser/identity production acceptance Q1–Q6/N1–N6 and legacy T01–T48 remain **Not run**; the integrated production platform is not implemented.

Current direction: `CONTIGOO_QUICK_GUIDE.md` v0.5 and `CONTIGOO_STUDIO_NOTES.md` v1.1: internal-only Studio + management, sole Super Admin/developer, later employee management access and username/email/phone plus password. The old blueprint's CRM-led gates, customer-login assumptions and UAT mappings are superseded. T01–T48 remain supplemental ideas, not approved release scope.

Keep one evidence record per run/build; preserve earlier failures and retests. Mark a case N/A only with a scope-based explanation. Add domain/localization variants as modules are built.

## Recorded prototype execution — 22 September 2026

Build: `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c`. Environment: Windows, Node v24.19.0, Edge 153.0.4234.48. Synthetic data in isolated browser contexts.

| Evidence | Result | Reference |
|---|---|---|
| Existing regression, 15:49:53 UTC | 48 passed / 48 | Baseline copied into the full audit evidence |
| Expanded audit, `2026-09-22T16-27-15-932Z` | 144 executed: 136 passed, 8 failed | [Full matrix](QA_EXECUTION_REPORT.md) · [Raw evidence](qa-tools/results/2026-09-22T16-27-15-932Z/results.json) |
| Static repository-subpath verification, 15:49:25 UTC | Passed; no recorded browser/asset errors | `staticChecks` in raw evidence |
| Live GitHub Pages smoke, 22 September | Passed for the same commit | [Live evidence](qa-tools/results/2026-09-22T16-27-15-932Z/live-smoke.json) |
| Deferred expanded cases | 31 Not implemented; 2 Not run | [Deferred matrix](QA_EXECUTION_REPORT.md#deferred-coverage) |

Combined recorded suites: **192 checks, 184 passed, 8 failed** (some coverage overlaps). The eight failures map to **five open defects**: failed-save feedback, two-tab lost updates, tablet overflow, malformed-state startup and unsupported-schema recovery. See [QA_DEFECTS.md](QA_DEFECTS.md) and [QA_SUMMARY.html](QA_SUMMARY.html). No defect fix/retest is recorded yet.

The summary was generated and checked on 23 September from retained evidence; the application audit was not rerun. An empty local PostgreSQL service was separately created and stopped on 22 September. A first hosted control schema is now tested separately below. API integration, real login, generated-app credentials, standalone generation and Ubuntu restore remain unimplemented/unverified. These prototype results do not pass the production checks below. The client-login restriction applies to Studio; generated applications require their own credentials.

## Hosted PostgreSQL foundation — 23 September 2026

Environment: Neon Free Frankfurt, PostgreSQL 17.11; isolated Studio development/test databases and separate runtime/migrator credentials. Synthetic identities/records only; no real account bootstrap.

| Evidence | Result |
|---|---|
| `npm test` in `database/` | 6/6 synthetic TLS/configuration/client-lifecycle tests passed |
| `database/reports/hosted-2026-09-23T10-09-47-975Z.json` | Initial hosted run: 20 passed including cleanup, 1 failed cross-environment CONNECT isolation; failed report retained |
| `database/reports/hosted-2026-09-23T10-15-26-473Z.json` | 23 passed after owner-role ACL correction |
| `database/reports/hosted-2026-09-23T10-18-39-057Z.json` | Final 23/23 passed after explicit console access grants |
| `node database/migrate.mjs development` | Both versioned migrations applied, repeat run installed none |
| `node database/status-hosted.mjs` | Verified both runtime TLS connections/privilege flags, two migration entries per DB, console-visible tables and empty application tables |

Coverage includes single-owner constraint, denied missing/disabled/unknown actors, assignment scope, management-versus-development boundary, restricted identity/audit/schema writes, foreign keys, typed metadata shape, atomic audit rollback, revision-conditional stale-write rejection, environment DB separation, idempotent migrations, checksum drift and failed-migration rollback. Tests use explicit SQL transaction actors; they do **not** prove OIDC login, session/token verification, API authorization, complete visual-model validation, jobs/files, GUI integration, generator output or restore. Q1–Q6/N1–N6 remain pending their complete end-to-end scope.

## Current platform-builder acceptance checks

| Check | Setup and action | Expected result | Status |
|---|---|---|---|
| Q1 — Isolation | Assign an employee to project A; request unassigned B records/files/configuration through API and jobs. | No unassigned access or changes. | Not run |
| Q2 — Builder | In Studio create an entity/field/form/workflow, publish, then submit valid and invalid client requests. | UI reflects configuration; server validates it and enforces permissions. | Not run |
| Q3 — Reuse | Create a second client from a template and customize it. Inspect initial records and integration credentials. | Configurations are independent; private data/secrets are not copied. | Not run |
| Q4 — Upgrade | Upgrade a solution with overrides; inject publication failure; restore prior compatible configuration. | Overrides survive or conflicts are reported; publication is atomic and prior valid version stays usable. | Not run |
| Q5 — Access | Attempt employee privilege escalation and account creation via a client record. | Only one Super Admin/developer; client creation grants no Studio access. | Not run |
| Q6 — Operations | Sign in using all three owner identifiers; test employee access/revocation, backup restore and compatible configuration recovery. | Same account resolves correctly; access and recovery work with evidence. | Not run |

## Notes Document acceptance checks

| Check | Required evidence | Status |
|---|---|---|
| N1 — Owner | Exactly one designated Super Admin/developer; employee escalation and second-owner creation denied. | Not run |
| N2 — Login | Username, verified email and normalized/verified phone resolve to one account; password checks and ambiguous-identifier rejection pass. | Not run |
| N3 — Employee access | Assigned operations work; unassigned records, development and privileged actions are denied by the API. | Not run |
| N4 — Internal boundary | No client registration/login or customer-admin role in Studio; client records create no Studio account. Delivered applications have separate identities. | Not run |
| N5 — Lifecycle | Full create/edit/use/publish/update/archive/reactivate/delete workflow with version/data handling. | Not run |
| N6 — Server operation | HTTPS login, persistence, revocation, audit evidence and off-server backup restoration. | Not run |

## Execution record template

```text
Run ID / date:
Build or artifact / migration version:
Environment / hardware / dataset:
Executor:
Case ID and variant:
Preconditions and test data:
Exact command or manual steps:
Expected result:
Actual result:
Status: Not run / Passed / Failed / Blocked / N/A
Evidence link:
Defect and retest reference:
N/A or skipped-check reason:
```

## Legacy supplemental case inventory — gate mappings superseded

| Case | Scenario | First gate | Status |
|---|---|---|---|
| T01 | Identity lifecycle | G1 | Not run |
| T02 | Tenant selection | G1 | Not run |
| T03 | Cross-tenant reads | G1 onward | Not run |
| T04 | Cross-tenant writes/links | G1 | Not run |
| T05 | RLS and pooled connection reuse | G1 | Not run |
| T06 | Action/record scope | G1/G3 | Not run |
| T07 | Field policy/mass assignment | G1/G3 | Not run |
| T08 | Upload/download isolation | G1 | Not run |
| T09 | Entitlement enforcement | G4 | Not run |
| T10 | Independent app operation | G2/G4/E | Not run |
| T11 | Billing event authenticity/replay | G4 | Not run |
| T12 | Subscription transitions | G4 | Not run |
| T13 | Downgrade/dependencies | G4 | Not run |
| T14 | Concurrent quotas | G4 | Not run |
| T15 | Revocation/cached and queued work | G4 | Not run |
| T16 | Platform support/audit | G1/G4 | Not run |
| T17 | Branding isolation | G3 | Not run |
| T18 | Typed fields/backend validation | G3 | Not run |
| T19 | Draft/atomic publication | G3 | Not run |
| T20 | Upgrade/archive/rollback | G3 | Not run |
| T21 | Expressions/workflow limits | G3/G4 | Not run |
| T22 | Templates/stored content | G3 | Not run |
| T23 | Configuration transfer | G3 | Not run |
| T24 | Accessibility/localized forms | G3/G5 | Not run |
| T25 | Lead qualification | G2 | Not run |
| T26 | Concurrent editing/state | G2 | Not run |
| T27 | Import validation/resume | G2 | Not run |
| T28 | Scoped search/report/export | G2/G3 | Not run |
| T29 | Shared-record deduplication | G2/E | Not run |
| T30 | Activities/time/currency totals | G2 | Not run |
| T31 | Outbox/consumer retries | G4 | Not run |
| T32 | Integration credentials/webhooks | G4 | Not run |
| T33 | Quote/order fulfillment | E1 | Not run |
| T34 | Stock concurrency/reservations | E1 | Not run |
| T35 | Transfer/return/valuation | E1/E2 | Not run |
| T36 | Balanced/idempotent journals | E2 | Not run |
| T37 | Period close/reversals | E2 | Not run |
| T38 | Receivables/payables/rounding | E2 | Not run |
| T39 | HR privacy/leave/accrual | E3 | Not run |
| T40 | Procurement/helpdesk variants | E4 | Not run |
| T41 | Load/noisy neighbor | G5 | Not run |
| T42 | Backup/restore objectives | G5 | Not run |
| T43 | Migration/failed deployment | G5 | Not run |
| T44 | Dependency outages | G5 | Not run |
| T45 | Observability/incident response | G5 | Not run |
| T46 | Browser security/abuse | G5 | Not run |
| T47 | Full onboarding/accessibility | G5 | Not run |
| T48 | Retention/export/deletion | G5 | Not run |

## Legacy UAT — revise for the three client solution patterns

| Journey | Owner | Status | Evidence |
|---|---|---|---|
| UAT-A — Owner buys/configures | Assign in P5 | Not run | Pending |
| UAT-B — Salesperson works | Assign in P5 | Not run | Pending |
| UAT-C — Operator handles changes/failure | Assign in P5 | Not run | Pending |

## Gate decisions

Current milestones S1–S6: **not evaluated**. Legacy G0–G5/E1–E5 mappings are superseded. Record acceptance only with applicable execution evidence, unresolved defects and the owner's acceptance.
