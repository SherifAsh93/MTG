# Contigoo Studio — implementation and hosting handoff

Updated: 30 September 2026. **PAUSED by the owner until a new explicit resume.**

> ### CORRECTION — 30 September 2026 (owner decision — overrides everything below)
>
> 1. **Local-only implementation:** all Contigoo work happens on the owner's personal laptop at `D:\Contigoo`. Nothing Contigoo is hosted, deployed, or migrated on that laptop.
> 2. **The personal VPS `76.13.42.219:3389` is WebistryDev-only** (WebistryDev and its subprojects, nothing else). It must never be used for Contigoo in any way.
> 3. **Production = a separate server + a separate domain** (cloud or a dedicated local server machine), chosen only after the project is approved and fully planned. Today we are in **planning only**; no deployment exists or is authorized.
> 4. **Neon Frankfurt remains the approved hosted development database.**
> 5. All "owner's VPS", "VPS migration", "VPS access" and remote-hosting statements below are **superseded historical planning text** — keep them for the record, never follow them as instructions. The word "VPS" in old entries does not mean the personal VPS; no VPS is in scope for this project.

## Latest pause — 24 September 2026

The owner requested a brief resume, then stopped it until tomorrow, reporting that the long work session had not produced a visible change. The connected backend was restarted successfully and reported `ownerSetupRequired: false`, confirming an owner account exists. Owner sign-in/UI acceptance was not performed. The backend was then safely stopped with `node scripts/dev-server.mjs --stop`.

No code changes, installs, migrations, tests, commits or publication occurred during this brief resume. The public demo is still `7b1d376`; `prototype/app.mjs`, `builder-model.mjs` and `studio-ui.mjs` remain modified and unpublished. Preserve the work and wait. On the next resume, prioritize showing the actual connected app at `http://127.0.0.1:4300` and its Employees/audit screens, explaining which URL the owner should use. The longer 23 September implementation evidence below remains valid historical evidence.

## PAUSED — latest checkpoint, 23 September 2026

The owner requests pausing and will resume using:

> **Add Employees profiles and an owner-only, project-linked activity/audit view with server enforcement.**

This is a bookmark, not an instruction to duplicate finished work. Employees profiles and the project-linked, owner-only audit APIs/UI are implemented and browser/API tested. The local development backend was found running after an interrupted terminal call and safely stopped using `node scripts/dev-server.mjs --stop`. Preserve all source/databases and wait for the owner's resume instruction before restarting or publishing.

**Read the full latest PAUSE HANDOFF at the top of `PROJECT_CONTEXT.md`.** It supersedes initial-stage descriptions elsewhere in this document. The implementation has advanced beyond the original foundation:

- `platform/` now contains the connected NestJS/Better Auth API, same-account username/email/phone login, existing branded Studio integration, employee permissions/profiles/audit, server-side records/rules, pricing/templates/snapshots/import, and standalone package/runtime/version lifecycle.
- Seven migrations are applied through hosted development/test setup. Schema `studio` includes employee and action-audit tables; `studio_auth` stores identities/sessions/login aliases. Runtime/migration/identity service credentials are separate and private.
- Latest app evidence: `platform/reports/integration-2026-09-23T15-25-32-592Z.json`: 28 named integration checkpoints; `npm test` has 3 passing Node tests total including two identifier tests. Database tooling: 6 + 23 passing checks. Prototype: 48 checks plus static verification passed.
- Latest logical restore evidence: `platform/reports/restore-2026-09-23T15-30-00-928Z.json`, Passed. Real cloud PostgreSQL dump/restore and restored authentication/data/permissions were exercised; temporary resources were cleaned up. Actual Linux/VPS restore remains unverified.
- A downloaded standalone ZIP was installed independently outside this workspace and started from environment-only configuration. It includes runtime/model/assets/migrations, not private records/credentials or the internal Studio UI. Compatible model updates/rollback preserve data; incompatible field changes are blocked.
- Runtime configuration: `.env.example`; separate migration-only configuration: `.env.migration.example`. Operator package instructions: `platform/PACKAGE_README.md`. Linux samples: `platform/deploy/Caddyfile.example`, `contigoo.service.example` (not deployed).
- Exposed bootstrap DB password was rotated with explicit owner approval; old credential rejection and separate runtime connections were verified. Never copy credentials from `.private/` into this document.
- Real owner setup completion is **not confirmed**. After resume use `npm run dev:start` from `platform/` to reopen the correct login/protected setup page at `http://127.0.0.1:4300`. No real credentials were seeded by automation.
- Public demo is still `7b1d376`. Three verified shared frontend files are modified but uncommitted/unpublished. Finish review/documentation and publish only after resume. Private implementation stays private.

On resume, reconcile the older status sections below and remaining architecture/readme/ledger text before any hosting discussion. AI provider/delivery channels, the future separate server/domain hosting decision, private implementation remote, and broader production/domain acceptance are still outstanding. Phone association works as a password-login alias and is **not** a claim of SMS ownership verification.

## Read first — any model continuing this project

1. Read `AGENTS.md`, `PROJECT_CONTEXT.md` and this file.
2. Read `CONTIGOO_QUICK_GUIDE.md`, `STUDIO_PRODUCT_MODEL.md`, `PLATFORM_ARCHITECTURE.md` and local `AGENTS.md` files before editing.
3. Inspect the actual source and executed evidence. Proposed work is not passed acceptance.
4. Preserve existing code/data; never reset databases or browser work to make tests pass.
5. Record each completed work package, failures, evidence and next action in the context and this handoff.

The owner's standing instruction (corrected 30 September 2026) is to keep **every implementation step local on the personal laptop** and provide enough Markdown context for any model to continue. Hosting remains talk/plan only (a separate server and domain after approval). This document contains references/configuration names, never credentials.

## Product and latest confirmed choices

- **Contigoo Studio — Internal Management & Development Platform**: internal owner/developer workspace and later delegated employee management. Clients are managed records, not Studio accounts.
- Blank-first client projects; reusable frameworks/modules/components, visual data/pages/rules, app runtime, templates, pricing, versions and lifecycle. Preserve the approved green connected-apps overview banner.
- Build and test the complete application using hosted PostgreSQL **locally, on the personal laptop**, before any future hosting decision. No server or VPS access is required (or permitted) just to develop it.
- Owner-approved implementation: private `platform/`, NestJS/TypeScript, maintained portable in-backend authentication (Better Auth, replacing the earlier Keycloak proposal), standard PostgreSQL and the existing Studio UI.
- First standalone delivery target: self-hostable **web runtime package**, separate database per delivered solution, separate application users/credentials. Native Android/iOS delivery is later scope.
- Username/email/phone login must resolve unambiguously to one account. International phone normalization and actual verification/recovery delivery must be documented and tested; no fake verification or hardcoded owner password.
- AI provider integration and complete specialist Finance/Inventory/etc. domain engines are not implemented merely because the module catalog contains those labels.

## Directory map

| Path | Purpose |
|---|---|
| `prototype/` | Public static presentation repository, original UI/model and tests. Its current release is browser-local. |
| `database/` | Private PostgreSQL provisioning, migrations, restricted-role setup and real hosted tests. |
| `platform/` | Authorized private application implementation; currently being built. Read its local instructions. |
| `qa-tools/`, `QA_*.md` | Preserved static-prototype audit and five open defects. |
| `PROJECT_CONTEXT.md` | Chronological decisions, corrections, evidence, blockers and next steps. |
| `CONTIGOO_STUDIO_NOTES.*` | Private owner notes with account references; never publish or copy identifiers into generic context/source. |

The parent workspace is not a Git repository. `prototype/` has its own public repository. Permission to publish verified presentation changes does **not** authorize publishing `platform/`, private documents, credentials or customer data. A private implementation remote remains to be selected.

## Verified current state

- Neon project `contigoo-studio-dev`, Frankfurt, PostgreSQL 17.11. Official CLI authorization works.
- `contigoo_studio_dev` / `contigoo_studio_test`: isolated internal Studio development/test DBs with separate migration and runtime roles.
- Applied migrations: `001_studio_foundation.sql`, `002_owner_development_boundary.sql`.
- Tables under **`studio`**, not `public`: principals, clients, projects, project_assignments, audit_events. Migration ledger: `contigoo_migrations.history`.
- 6 synthetic database-tool tests and 23 real hosted DB checks passed. Final evidence: `database/reports/hosted-2026-09-23T10-18-39-057Z.json`. Earlier failed ACL test is retained and the owner-role grant correction is recorded.
- Real client TLS and certificate verification succeed. Neon terminates TLS at its proxy, so internal `pg_stat_ssl` differs from the verified client socket.
- No real owner account or app login/API/frontend integration was completed by those database checks. The implementation workspace was just authorized; update this section as its evidence changes.
- Public presentation: https://sherifash93.github.io/contigoo-studio-demo/ at `7b1d376`. It is not a backend host.
- Old Windows PostgreSQL cluster is stopped. Its binaries/data must not be copied as a Linux installation. Cleanup/relocation needs separate authorization.

## Configuration and secret handling

Development credentials live in ignored, access-restricted `database/.private/` (CLI authorization and hosted bootstrap/service JSON). Never open their contents into an AI prompt or command log. Refer to scripts that read them internally.

Production code must accept explicit environment configuration for PostgreSQL connection(s), application origin, session/auth secret, upload location and any approved mail/SMS/AI integrations. Do not embed Neon hostnames, account identifiers, laptop paths or secrets in runtime code. Runtime DB users must remain separate from migration/provisioning users. Add exact implemented variable names and `.env.example` references here as code lands.

No server hosting is in scope today: implementation is local-only and the personal VPS is excluded from Contigoo work permanently (see the 30 September correction banner). If a future approved deployment uses a separate server, use an owner-approved SSH-key/connection setup for that server only; do not place passwords, private keys or live connection strings in this document. A previously shared DB bootstrap password requires controlled rotation before real-data use; update its private configuration through the authorized mechanism.

## Existing verified database commands

From `database/`:

```sh
npm ci
npm test
npm run db:status
npm run db:migrate:test
npm run test:hosted
npm run db:migrate:dev
```

These commands currently use restricted development configuration. Do not run development provisioning/reset logic against production. `verify-hosted.mjs` refuses nonempty test datasets and removes only its own synthetic fixture rows. Keep applied SQL immutable; add numbered migrations.

## Portability acceptance — enforce as implementation proceeds

- **Build:** pinned dependencies/lockfiles, documented Node version, OS-neutral paths, no required globally installed CLI in application runtime.
- **Database:** standard PostgreSQL with explicit migrations and least-privilege roles; Neon console APIs are setup tools, not runtime requirements.
- **Identity:** portable credentials/sessions and stable account IDs. Exported apps have independent identity/data boundaries. Restore required auth encryption/signing secrets deliberately.
- **Files:** owner-controlled filesystem/object storage behind configurable adapters; browser-local assets/data are not a durable server file store.
- **Operations:** explicit origin, trusted proxy/TLS cookies, graceful shutdown, health checks, bounded connection pools, startup validation and redacted logs.
- **Transfer:** versioned code, schema/data and server files are distinct artifacts. Domain changes do not transfer browser storage; use an explicit validated import.
- **Recovery:** test logical PostgreSQL dump/restore into an isolated environment, then verify accounts/permissions, records, versions and files. Restoring only a configuration snapshot is not database recovery.

Each item needs executed evidence before it is marked complete. Docker/Compose, Linux builds, reverse-proxy TLS, restore and actual server operation are not yet verified.

## Future hosting sequence — talk/plan only (not authorized; personal VPS excluded)

Hypothetical outline for **after** a project is approved and fully planned. It targets a *separate* server and domain (cloud or a dedicated local server machine) — never this laptop, never the personal VPS `76.13.42.219:3389`. Nothing in this sequence may be executed without an explicit deployment decision.

1. Inventory OS, CPU/RAM/disk, PostgreSQL/containers, existing apps/proxy, domain/DNS and backup destination. Preserve unrelated services.
2. Select a private release/repository and supported runtime/PostgreSQL versions. Build repeatable web/API artifacts.
3. Configure owner-controlled PostgreSQL, runtime/migration roles, file storage and secrets; keep DB ports private.
4. Restore a staging copy via logical export/import and verify migrations, counts, identity/session behavior and app records/files.
5. Run integration/browser/authorization/concurrency and recovery checks on the staging URL of the future approved server (not this laptop, not the personal VPS).
6. Agree cutover/write-freeze and rollback points, take final backups, transfer final deltas, configure HTTPS/origin, smoke-test and switch traffic.
7. Verify monitoring, restart behavior, scheduled backups and a restore exercise; record actual commands/versions/URLs without secrets.

## Current active work / unresolved inputs

Implement real authentication and authenticated API persistence, connect the existing Studio interface, preserve/import browser work, then build/test standalone web delivery. Record work in bounded verified packages rather than claiming the entire catalog is finished.

Still needed for complete release: actual owner bootstrap through a protected UI; phone ownership verification and recovery channel configuration; private implementation remote; approved AI provider if included; module-domain scope; the future separate server/domain hosting decision (talk/plan only). None of these should be substituted with fabricated credentials or passed tests.
