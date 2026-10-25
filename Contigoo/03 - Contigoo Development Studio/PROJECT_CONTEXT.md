# Contigoo Platform — Project Context

> **Location update, 5 October 2026:** current project root is `D:\Work\Contigoo\03 - Contigoo Development Studio`. Older local roots in the historical entries below refer to this location. The workspace move preserves the project pause and does not authorize implementation, services or publication.

Last updated: 2026-09-30  
Stage: **PAUSED again at the owner's request, 24 September 2026.** The brief resume restarted the connected backend and confirmed an owner account exists, then the owner requested stopping until tomorrow. Backend safely stopped again. Public presentation remains at 7b1d376; three verified frontend source files are modified locally but not published.  
Document status: This context and VPS_HANDOFF.md contain the authoritative pause state. Earlier Notes/guide/architecture status text needs reconciliation. Owner account existence is confirmed; this resume did not verify an actual owner sign-in or UI acceptance.

## Read this first

This file is the durable project memory. Read it, `STUDIO_PRODUCT_MODEL.md` and `CONTIGOO_QUICK_GUIDE.md` at the start of each working session. The 34-page `CONTIGOO_PLATFORM_BLUEPRINT` v0.1 is a superseded reference: do not follow its CRM-first scope, roadmap or dates. Update context after material decisions, completed work, blockers, or scope changes. Do not treat recommendations as owner-approved requirements. Continuity depends on future sessions reading these files.

## Latest owner clarification — authoritative direction

### ENVIRONMENT CORRECTION — 30 September 2026 (owner decision — newest, overrides all older environment text)

The owner corrected the fundamental working environment for all Contigoo projects:

1. **Implementation is local only.** All Contigoo project work happens on the owner's personal laptop at `D:\Contigoo`. Project files exist only on that local drive during planning and implementation. Nothing Contigoo is hosted, deployed, or migrated on the laptop.
2. **The personal VPS `76.13.42.219:3389` is WebistryDev-only** — it holds WebistryDev and its subprojects and nothing else. It must never be used for Contigoo in any way (verified clean of Contigoo content on 30 September 2026).
3. **Production hosting is undecided — talk and plan only.** After a project is approved and fully planned, it will be implemented/migrated to a *separate* server and *separate* domain (cloud or a dedicated local server machine) — not this laptop, not the personal VPS.
4. **Neon Frankfurt (`contigoo-studio-dev`) remains the approved hosted development database.** The earlier "remote-first development" label meant hosted-DB development, not VPS hosting; the corrected direction is local-first implementation with the hosted dev DB.
5. Older entries in this file referring to "the owner's VPS", "VPS migration", "Codex on the VPS", "Ubuntu VPS" or avoiding local-PC work are **superseded historical planning text** — kept for the record only, never to be followed as instructions.

The pause state below remains in force: no code, services, migrations or publication are resumed by this correction.

### PAUSE HANDOFF — 24 September 2026 (latest)

The owner briefly said “resume,” then explicitly instructed pausing until tomorrow, expressing frustration that more than ten hours of work had not produced a visible change. **Stop work/services/publication until explicitly resumed.** Prioritize a short, visible demonstration and owner acceptance when the owner next resumes; do not repeat long implementation/testing work already evidenced below or substitute more summaries for showing the working app.

During this brief resume, read the saved handoffs/instructions and inspected repository status. `prototype/` remains at `7b1d376`, with exactly `app.mjs`, `builder-model.mjs` and `studio-ui.mjs` modified. No code edits, dependency installs, migrations, test reruns, commits or publication occurred. `npm run dev:start` successfully reported `http://127.0.0.1:4300` and **`ownerSetupRequired: false`**: an owner account exists. No credentials or account identifiers were displayed, and actual owner login was not exercised. After the pause instruction, `node scripts/dev-server.mjs --stop` confirmed that the owned development backend was stopped.

The prior checkpoint **“Add Employees profiles and an owner-only, project-linked activity/audit view with server enforcement”** remains the continuity label. That code and its previous evidence are preserved. On the next explicit resume, first distinguish the connected local application from the unchanged public presentation and demonstrate the Employees/audit screens to the owner. Pending publication/documentation remain unfinished; the pause takes precedence over standing demo-publication authorization.

### PAUSE HANDOFF — 23 September 2026 (authoritative latest state)

The owner explicitly requests pausing and will use this exact reminder to resume:

> **Add Employees profiles and an owner-only, project-linked activity/audit view with server enforcement.**

Treat this as the owner's checkpoint label. **The Employees/audit implementation has actually been completed and its API/browser scenarios passed. Do not rebuild it from scratch.** Resume by reading this entry, `VPS_HANDOFF.md`, `platform/AGENTS.md`, source and current evidence, then complete the outstanding review/handoff/publication/owner setup steps. Do not continue implementation, restart processes, deploy or publish during the pause.

**Stopped safely:** the final terminal call was interrupted by the user. Read-only inspection found only the owned platform development backend among the relevant setup/test processes. Ran `node scripts/dev-server.mjs --stop` from `platform/`; it confirmed **“The owned development server was stopped.”** No further tests, migrations or infrastructure work were started after the pause instruction. The hosted databases and files are preserved; the old local PostgreSQL server was never restarted. The private development process marker remains for the launcher to validate on resume.

**What had completed before interruption:**
- Private `platform/`: NestJS 12/TypeScript API, Better Auth 1.7.5, standard PostgreSQL, and the original Studio UI connected through an asynchronous persistence adapter. The green foundation banner remains. Node dependencies are installed locally with lockfiles; no Docker/global install/local DB service was added.
- Real protected sole-owner bootstrap, password hashing, HttpOnly sessions, logout/revocation, disabled-account checks, same-account **username/email/international phone** aliases, collision prevention and shared per-account login limits. Phone association is not SMS ownership verification. Owner self-phone changes require the current password and revoke sessions. No supplied chat password was inserted into source or account seeds.
- Owner-only client/project/configuration/pricing/template/version persistence; server-validated record forms and on-create set/note rules; immutable saved snapshots; explicit browser-workspace import with legacy-ID mapping; optimistic concurrency and failure/retry handling. Internal employees have scoped project viewing/lifecycle management, not Studio developer authority.
- Dedicated Employees UI: automatic unique reference codes, editable profile/name/department/job title/notes/phone association, account status and project assignments. Users & permissions remains first-class.
- Owner-only Activity & audit UI with employee/project/date/action/outcome filters and pagination. Committed row changes have transactional audit records, request IDs and actor/employee/project/client reference snapshots. API operations, login/logout, reads, exports and scoped view events are recorded without passwords, tokens or raw request bodies. Application roles cannot erase action logs. HTTP audit writes are asynchronous with retries; process-crash durability is not the same as transactional row auditing. This is application auditing, not workstation/keystroke surveillance.
- Seven migrations now exist: `001_studio_foundation`, `002_owner_development_boundary`, `003_portable_authentication`, `004_studio_workspace`, `005_record_revisions_and_events`, `006_employees_and_action_audit`, `007_management_workspace_concurrency`. Development and test setup commands completed against the hosted DB. Six restricted service roles total: application, migration and identity roles per environment. Never run the API with bootstrap/migration credentials.
- Standalone ZIP export from saved versions: independent runtime/model/assets/migrations/lockfile, **no internal Studio UI, records or credentials**. Generated-app identity context and database are separate. Actual generated runtime CRUD/rules/read-only permissions, disabled-app entitlements, compatible updates/rollback and rejection of incompatible required-field changes were exercised.
- Runtime configuration is environment-driven. Migration credentials are separated from runtime environment files. Fresh package installation and startup were tested **outside this workspace** to avoid accidentally using laptop/project dependencies. Production-mode Secure cookie policy was checked through the private HTTP upstream; real Linux/HTTPS reverse-proxy deployment is still pending.
- The owner explicitly approved rotating the bootstrap DB-role password previously pasted into chat. `database/rotate-bootstrap.mjs --confirm-exposed-bootstrap` passed: replacement verified, **old credential rejected**, restricted application credentials still work. Private bootstrap config was updated. Do not repeat the old or new credential; this did not change the Neon website password or app login.

**Executed evidence:**
- `platform/`: final `npm run build` passed; `npm test` passed **3 Node tests** (2 identifier tests and one integrated suite containing **28 named end-to-end checkpoints**). Final report: `platform/reports/integration-2026-09-23T15-25-32-592Z.json` / `integration-latest.json`. Coverage includes real hosted DB/API/browser, Employees/audit screens, all three login aliases, independent generated app, fresh exported ZIP install, upgrades/rollback, phone reassociation and logout. Do not count those checkpoints as 28 separate Node test files/cases.
- `database/`: 6 synthetic tooling tests and 23 hosted DB checks passed; latest foundation report `database/reports/hosted-2026-09-23T13-00-08-711Z.json`.
- Real logical dump/restore passed twice. Latest retained report: **`platform/reports/restore-2026-09-23T15-30-00-928Z.json`**, status Passed. It verifies portable pg_dump/pg_restore over verified TLS, restored records/versions/employee references/audit/identity/session data, reapplication of migration checksums/role grants, password and phone login, preserved session and read-only employee authorization. Two isolated temporary hosted DBs/roles and temporary archives were cleaned up before the report was written. Existing downloaded Windows client binaries were borrowed/extracted as needed and newly extracted clients removed; no local DB was started. This is not an Ubuntu/VPS restore test.
- `prototype/`: all 48 existing checks and static repository-subpath verification passed after the latest shared-UI changes. The full historical 144-case audit was not rerun; do not claim all old defects closed.
- Earlier failures are retained: initial DB CONNECT ACL enforcement, an overly short fresh-package startup window, async modal/test synchronization, and an invalid reserved UK phone test fixture. ACL and modal handling were fixed, readiness polling was made bounded/tolerant of cold starts, and valid synthetic NANP fixtures replaced the rejected number without weakening phone validation. Final suites above passed.

**Interruption/owner setup:** the last command chained restore verification → `node dist/setup.js development` → `npm run dev:start`. The final restore report proves successful completion/cleanup. The owned development server was found running, then stopped at the owner's pause request. The protected setup browser may have opened; **do not assume the real owner completed setup or logged in**. After explicit resume, `npm run dev:start` from `platform/` restarts/reopens the correct page, and `/api/setup-status` can confirm setup without exposing identifiers. Expected local API/UI origin: `http://127.0.0.1:4300`; it is not a shared public backend URL.

**Unpublished source / remaining work:**
- Public repository still at `7b1d376`. `git status --short` at pause shows only `prototype/app.mjs`, `prototype/builder-model.mjs`, `prototype/studio-ui.mjs` modified. They contain async persistence integration, shared validation, preserved presentation behavior and explicit browser-workspace export. Review diff, update the public README if appropriate, then commit/push/verify Pages only after the owner resumes. Standing demo publication authorization remains; the pause takes precedence now. Do not publish private `platform/`, database scripts/secrets or context.
- Complete/reconcile `platform/README.md`, root README, architecture/product documents, database README and test ledger with this new state. `VPS_HANDOFF.md` is the required operational/model continuation entry point. The public prototype is still a presentation; login/Employees live in the private backend app, not GitHub Pages.
- Owner setup/manual acceptance is pending confirmation. Actual AI provider/key/budget and external email/SMS verification/message-based recovery were not selected; do not claim them connected. The owner reiterated associated phone/email login instead of selecting providers.
- No VPS host/inventory/domain/SSH setup or private implementation Git remote is configured. Linux service/proxy examples are **templates, not deployed/tested services**. Full load/accessibility/device coverage, general files/jobs/integrations and specialist Inventory/Finance/Commerce engines remain separate release scope; current modules are the supported generic data/pages/rules runtime. Native Android/iOS/PWA output is later scope by approval.
- A full production-ready suite is not declared finished. Continue the agreed supported scope in verified packages and keep credentials outside all generic handoff/context documents.

### Same-account email/phone login reiterated — 23 September 2026

When asked about verification channels and an AI provider, the owner reiterated twice that phone and email must be associated with the **same account** for login. This confirms account-alias behavior; it does not select an SMS/email delivery service or AI provider. Implemented direction: owner-provisioned username/email/international phone aliases resolve to the same password-backed account, with normalized unique identifiers and password checks. Association remains explicitly distinct from proof of phone/email ownership: the external-verification flag is not fabricated or set by this feature. Phone edits are owner-controlled, audited and revoke affected sessions; owner self-edit requires the current password. No default phone country is guessed—use explicit +country-code input. Actual SMS/email verification/recovery delivery and live AI remain unconfigured pending separate inputs, not falsely marked complete.

### Employees and comprehensive action monitoring requested — 23 September 2026

The owner confirmed the database architecture and requested a dedicated **Employees** section plus monitoring/recording actions by each employee, with their reference information and related project. This extends the active integration work. Implement linked employee profiles/reference codes, account status and project assignments, and owner-only activity/audit filters. Record authenticated actor references, project/client/record association, timestamp, operation and outcome; retain historical reference snapshots and audit committed mutations transactionally. Never log passwords, session/verification tokens or raw request bodies. Server access/denied-operation logging is additional to transactional row auditing; document its actual durability limits rather than claiming workstation/keystroke surveillance. Employees cannot edit or erase audit history.

**Implementation currently in progress:** private NestJS/Better Auth APIs, shared Studio asynchronous persistence adapter, server-side records/rules/versions, employee permissions and standalone web-package export have been authored. Hosted API/browser scenarios have passed through connected Studio and independent delivered-app flows, but the independent exported-package startup smoke found a failure still under investigation. Do not claim full completion or VPS readiness until final tests pass. New auth/workspace/employee migrations are being tested on the isolated test DB before development rollout; the last fully verified development schema is still the earlier foundation until a later entry records rollout. `VPS_HANDOFF.md` remains the required continuity document and must be updated with final evidence.

### Standing portability and model handoff instruction — 23 September 2026

While full implementation is underway, the owner explicitly requires checking VPS migration/hosting readiness **at every step**. They will supply VPS access later and require a Markdown handoff with the complete project information so any model (including this assistant running on the VPS) can continue, migrate, update and maintain it. Created `VPS_HANDOFF.md` as the living operational entry point alongside this context. Keep architecture, dependency/configuration names, commands, migrations, executed tests, status, blockers and next actions current. Do not put credentials or private account identifiers into the handoff. Future SSH credentials authorize only the scope the owner grants; inspect infrastructure before changing it. Portable builds/configuration, logical DB/file transfer, authentication-secret handling and restore evidence belong to release acceptance, not just a final note. This instruction extends the active implementation task rather than pausing it.

### Full integration authorized; implementation choices confirmed — 23 September 2026

The owner explicitly requests continuing to finish the whole project using the hosted DB. In response to focused implementation questions they approved: **(1)** portable authentication using a maintained library inside the backend, replacing the earlier Keycloak/OIDC service proposal; **(2)** a first self-hostable **web application package with a separate database per delivered solution**, whose apps/users share it under permissions (native Android/iOS is later scope); **(3)** a private `platform/` workspace and the project-local Node backend/auth dependencies needed to implement/test it. No local PostgreSQL server or global software installation is authorized by this. Keep the existing Studio UI as the integration target and preserve browser work through explicit import. These approvals resolve the prior auth-host, implementation workspace and first delivery/isolation blockers; they do not mean those capabilities are implemented. Initial implementation uses NestJS/TypeScript, Better Auth and standard PostgreSQL. External email/SMS verification/recovery delivery and AI provider access still require actual configured channels.

### Hosted database foundation verified — 23 September 2026

The owner completed Neon project creation in the browser. The screenshot showed Free-plan Frankfurt and the existing project's default branch named `production`; this is the provider's branch name, **not a production Contigoo deployment**. Successfully completed the subsequent official CLI browser authorization. Attached the explicit existing Contigoo project instead of creating a duplicate. Verified project name `contigoo-studio-dev`, region `aws-eu-central-1` and PostgreSQL **17.11**.

**Real database setup now completed:**
- `contigoo_studio_dev` and `contigoo_studio_test` are separate **Studio control** development/test databases on the same hosted project. This does not approve a generated-app database-per-project/app/person policy.
- Each has its own migration-owner and application role (four distinct login roles total), with generated private credentials. Service roles are non-superuser, cannot create roles/databases, replicate or bypass RLS. App roles have no role memberships and cannot connect to the other environment's DB.
- Applied `001_studio_foundation.sql` and `002_owner_development_boundary.sql`. Tables: `studio.principals`, `studio.clients`, `studio.projects`, `studio.project_assignments`, `studio.audit_events`; migration ledger: `contigoo_migrations.history`.
- Versioned checksummed migrations run transactionally under an advisory lock; reruns are idempotent and checksum drift/failed DDL are rejected with rollback.
- Database-layer policies deny absent/invalid/disabled identities, restrict employees to assigned projects/related clients, and block employee Studio-model editing even when project-management permission is delegated. Runtime roles cannot alter identities, assignments, audit rows, migration history, project parent/ID/revision columns or schema. Client/project changes have transactional audit and revision triggers; foreign keys prevent orphans and implicit related-project deletion.
- OIDC issuer/subject references are only identity **schema**. No real owner account, password authentication, verification/recovery, employee provisioning API or active employee exists. The future API must validate sessions and set the actor transaction-locally; SQL actor-setting alone is not authentication. It must also enforce expected revisions and validate the complete visual model.

**Evidence and corrections:** six synthetic tooling checks passed. Real hosted integration run `database/reports/hosted-2026-09-23T10-18-39-057Z.json`: **23 passed, 0 failed** (22 behavioral/migration cases plus exact-fixture cleanup), after the earlier successful `10-15-26-473Z` run. Initial `10-09-47-975Z` run recorded a cross-environment CONNECT isolation failure (20 passed including cleanup, 1 failed). Fixed ACL changes to run as the actual migration/database owner; issuing REVOKE as the hosted bootstrap role had returned without enforcing the intended removal. Also closed unexpected successful test connections to avoid a harness process remaining open. Preserved the failed report. Owner-console access now has explicit CONNECT and read visibility; final status verified all five Studio tables appear to that console role.

Initial TLS preflight incorrectly expected `pg_stat_ssl` to show client TLS; Neon terminates it at its proxy. Corrected the check to require the actual Node socket to be encrypted and certificate-authorized, reporting the internal backend hop separately. Real TLS and hostname verification are enabled; no insecure override was used. The client's read-only probe succeeds for both restricted runtime roles. Development DB was approximately **7.47 MiB** after schema creation, test DB approximately **7.59 MiB** at the recorded status check; these are database-size measurements, not total Neon billing/storage measurements or capacity guarantees.

**User's table-visibility question:** during isolated testing the development DB had no tables yet. The user supplied a connection string while asking about this. It was not copied into tool arguments, source or documentation. Once the test suite passed, applied both migrations to development and verified console visibility. In Neon choose **database `contigoo_studio_dev` → schema `studio`**, not default `neondb`/`public`. Development and test app tables were verified empty after cleanup. The exposed bootstrap DB-role password should be rotated through Neon before real data use; do not repeat it in chat or generic context.

**Private operational files:** `database/.private/neon/` for CLI authorization, `.private/hosted-bootstrap.json` and `.private/hosted-services.json` for DB service configuration. Never read them into prompts or print their contents. `database/README.md` describes `attach-neon.mjs`, `provision-hosted.mjs`, `migrate.mjs`, `verify-hosted.mjs`, `status-hosted.mjs` and package commands. Scripts preserve existing credentials/resources; no public deployment, global install, local DB restart or real account bootstrap occurred. `prototype/` remains clean on `main`.

**Next work package:** private backend/OIDC integration using the existing accepted-in-principle stack. Resolve its implementation repository/workspace and identity-service development execution under the remaining local-installation constraints; do not replace real login with SQL actor impersonation or a browser password gate. Add authenticated APIs, complete app/model/record/version/quote schemas and frontend integration, then end-to-end browser/API/DB acceptance. Standalone output/isolation decisions, phone normalization/verification, logical backup/Ubuntu restore and full Q1–Q6/N1–N6 remain open. The hosted DB is now real and tested; the whole application is not yet integrated or accepted.

### Neon onboarding screen reached — 23 September 2026

The owner supplied a screenshot of Neon's **Welcome / Create your first project** screen and asked which settings to choose. This confirms access to Neon onboarding, superseding the earlier Vercel-dashboard confusion; it does not confirm the signed-in email, completed CLI authorization or project creation. The screen has PostgreSQL enabled and Object storage, Functions, AI gateway and Neon Auth disabled. Recommended: project `contigoo-studio-dev`, PostgreSQL 17 if the expandable database settings offer it, Free plan, and a region near the development backend (Frankfurt is a suggested starting point if developing from Egypt/nearby). These settings are guidance pending the owner's creation action. Keep extra hosted services disabled so the intended backend/identity remains portable. Next: owner clicks Create project and confirms completion, then resume CLI authorization and securely verify the actual project/connection; do not create a duplicate project through the CLI.

### Neon project requested; setup tools approved; sign-in pending — 23 September 2026

The owner says they have existing hosted projects associated with another personal email and requests a **new instance for Contigoo**, using the previously intended company-account identity. Treat this as authorization to create a new development project under the correct owner-controlled account, not to alter unrelated personal projects or paid plans. The provider/account linkage still needs verification: when asked to complete Neon sign-in, the owner reported being on a **Vercel projects dashboard**, which is not proof of Neon authorization. Clarify whether they have a direct Neon account or a Vercel-managed Neon integration. Do not claim the new instance exists.

The owner explicitly selected **Allow setup tools** for the official Neon CLI and PostgreSQL Node client. Installed locally under `database/node_modules`, with `package-lock.json`: `pg` 8.23.0 and `neon` 5.0.1. Initial npm audit reported one low and two moderate vulnerabilities through CLI dependencies; pinned overrides to `@hono/node-server` 2.0.10 and `diff` 5.2.2 resolved them, and the final install audit reported **zero vulnerabilities**. Npm left optional esbuild's postinstall unapproved under existing policy; no approval-policy changes were made and this script is not needed for the connection/login work. No global install, DB server install/restart or new cloud service occurred.

Added `database/neon-access.mjs`: runs the official CLI with dedicated restricted-access settings in ignored `database/.private/neon/`; captures CLI output instead of exposing account details/connection secrets. Initial named-profile login attempts failed before opening the browser; using the default profile within the dedicated config directory resolved that. The browser OAuth page then opened but the CLI's **60-second authorization window timed out**. Opened the normal Neon console so the owner can sign in first. Do not log/read private credential files into prompts. Account passwords are not stored in source, documentation, environment examples or setup commands.

**Executed checks:** installed CLI help, `npm test` in `database/` (5/5 synthetic tests passed), and `node --check database/neon-access.mjs` passed. The live authorization attempt failed by timeout; no real database connection or schema was verified. One optional public-endpoint diagnostic failed locally because PowerShell stripped inline JavaScript quotes; it performed no successful endpoint check and is not evidence of a network failure.

**Immediate next action:** confirm direct Neon vs Vercel-managed access, complete official authorization using the intended company account, verify organization/free-plan ownership, then create the new `contigoo-studio-dev` project with PostgreSQL 17 and an appropriate confirmed region. Capture generated DB credentials privately; create no paid resources and do not print connection strings (CLI project creation defaults to secrets unless suppressed). Run the prepared read-only readiness check before schema/role/API integration. The shared app/database goal remains active; this is a sign-in blocker, not a completed backend.

### Confirmed hosted development database — 23 September 2026

The owner clarifies that their earlier DB configuration request meant **complete the backend and DB integration to test the whole app before moving to the VPS**. They explicitly require a **web-based/hosted database**, expecting a small initial volume of text. This resolves the preceding local-versus-remote DB question in favor of hosted PostgreSQL development. Do not ask again to restart a local DB or make production VPS access a development prerequisite. Small text datasets are a reasonable initial sizing assumption, but metadata/version history, indexes, audit logs and backups also consume resources; no final capacity guarantee is agreed.

**Initial provider recommendation, subsequently selected for setup above:** Neon Free as a development-only standard PostgreSQL service; official pricing checked at https://neon.com/pricing lists 0.5 GB/project, 100 CU-hours/project, 5 GB/project public transfer, no card required and idle suspension. Use ordinary PostgreSQL/SQL migrations and avoid provider-specific runtime/auth/storage dependencies so the later owner-VPS move stays possible. Account authorization/region and credentials are still pending; no service has been created or billed.

**Prepared in private `database/`:** `.env.example`, `package.json` pinning `pg` 8.23.0 (version/Node support checked through npm metadata), `remote-config.mjs`, `remote.mjs`, `remote.test.mjs` and README. The read-only preflight requires explicit hosted settings, verified TLS, bounded queries and emits only size/version/privilege evidence without credentials/connection identifiers. It does not read the old `.local` secrets or start the local cluster. Real settings belong in ignored `database/.env`, supplied privately. The driver was initially uninstalled; **the subsequent owner approval and installation are recorded above**. No new DB binaries, services or persistent database data were added.

**Checks actually executed:** `node --test database/remote.test.mjs` passed 5/5 synthetic configuration/client-lifecycle tests; `node --check database/remote.mjs` passed. These verify tooling behavior with a fake client, **not a real hosted connection, actual TLS handshake, migrations or app integration**. Public prototype repository remains clean. No cloud connection, application database tables, Studio accounts or generated apps exist as a result of this tooling.

**Immediate next action:** owner selects Neon Free or supplies an existing hosted PostgreSQL development environment; establishes owner-controlled access and fills private connection settings without pasting secrets into chat. Confirm the small Node dependency install, execute read-only readiness, then build migrations/roles, real identity/API/frontend integration and full end-to-end tests in bounded slices. Implementation repository/workspace, phone identity flow, standalone output and DB isolation boundary remain open choices; remote hosting does not silently settle those product contracts.

### Owner correction — backend/database completion is the active task, 23 September 2026

After the reporting resume, the owner corrected the task selection: they had already requested **finishing the backend and database setup so the whole project can be tested end to end**. Continuing QA summaries or treating VPS migration as the prerequisite does not fulfill that request. The active objective is a real integrated application: database schemas/migrations, authentication/authorization, business APIs, frontend integration and full-flow verification, including the separately required standalone-app delivery path.

Backend development and testing can precede VPS migration. The existing `database/` contains local setup/control scripts and the stopped empty PostgreSQL cluster; `prototype/` remains static/browser-local, with no backend dependencies. At this point the local-versus-remote question was unresolved; **the subsequent owner clarification above selects a hosted database**. Do not insist on production VPS access or choose an unapproved cloud service. Keep the accepted-in-principle stack and identity direction; do not silently replace it with improvised authentication.

### Resume — 23 September 2026

The owner requested continuing from the current folder and the previous stopping point. Read the pause handoff, guide and product model; verified `prototype/` has a clean working tree on `main` tracking `origin/main`. The general resume request does not select a remote provider/environment or approve renewed local DB installation/storage. The remote-first constraint remains active.

**Completed pending QA reporting:** reviewed and corrected `qa-tools/summary.mjs`, then generated `QA_SUMMARY.md` and `QA_SUMMARY.html`. Live-site claims now depend on matching passed evidence instead of unconditional wording; malformed evidence stops generation. Combined failure counts include regression failures. The existing five-defect narrative is guarded against silently being reused for a different build/failure set. Updated `TEST_EXECUTION_LEDGER.md`, root README and QA tool instructions with actual recorded evidence and the Studio/generated-app identity distinction.

**Verification executed this session:** `node --check qa-tools/summary.mjs`, `node qa-tools/summary.mjs` and `node qa-tools/verify-summary.mjs` passed. The document verifier checked 144 result rows (8 failed), 33 deferred rows, totals, evidence links, local assets and expanded-table layout at widths 390/768/1440; no browser/request errors. No dependency installation was needed. This verifies report generation/rendering, not a new application audit. The retained 22 September results remain 48/48 regression plus 136/144 expanded QA: **192 combined checks, 184 passed, 8 failed**, with overlapping coverage and 33 deferred cases. All five application defects remain open.

**Next action:** obtain approval for the owner's Ubuntu VPS or another remote development environment and its non-secret connection reference; then perform a bounded inventory before proposing setup. No remote connection, infrastructure change, local DB restart, cleanup or application-source change occurred in this reporting session. The existing local download/data footprint remains pending explicit cleanup/relocation. The public presentation remains the previously published v0.6; these private report/context changes are outside its repository. Once environment approval is supplied, scope portable DB migrations/authentication and the first standalone delivery slice; prototype defect fixes remain an actionable separate work package.

### PAUSE HANDOFF — 22 September 2026

The owner needs to close the laptop and explicitly requests pausing now. Their highest priority is **avoiding local-PC storage/software installation and other machine impact**. They prefer remote/cloud development resources and require migration readiness for their Ubuntu VPS. Do not resume installation, start the local DB, or add persistent local data until the owner resumes and approves the remote setup. No VPS access or cloud resource has been configured.

**Stopped safely:** `node database/local.mjs stop` completed with `server stopped`. The PostgreSQL process is no longer running. No Windows service, registry installation or global PATH modification was made. Downloaded portable binaries/archives and the local cluster/config files still occupy disk; they were not deleted during the pause. Discuss targeted cleanup/relocation when resuming rather than claiming the local footprint is gone.

**Database work completed before the pause:**
- No PostgreSQL/Docker executable was originally available. Downloaded official EDB Windows binary archives after checking the official download page/redirect.
- PostgreSQL 18.6 bootstrap failed with native Windows exception `0xC0000005` during post-bootstrap initialization. Its failed cluster was removed by initdb; its download/extracted binaries remain.
- PostgreSQL 17.11 successfully initialized and started. Created empty `contigoo_studio` at `127.0.0.1:55432`, plus non-superuser service roles `contigoo_migrator` and `contigoo_app`. Verified all service connections and server version. This is a database service, **not an implemented Studio login/account**.
- Data: `database/.local/data`. Restricted-access private runtime secrets: `database/.local/connection.json`, `admin-password.txt`, `application.env`. Never read these into prompts/logs or publish them. No supplied owner password or real account data was inserted.
- Native binaries: `C:\Users\sheri\AppData\Local\Temp\opencode\postgresql-17.11\pgsql\bin`; unused 18.6 binaries in the sibling version directory. Both ZIP archives remain in the approved temporary folder (approximately 727 MiB combined, plus extracted binaries).
- Archive SHA-256: 17.11 `b9424ee7bc60b52450ff910a3630225df32e633f3cb29c1d126d9299d59aea28`; 18.6 `1df55002afe95b945d934c078b13e82c1603fa546731e511d068aa983b4ead28`. These are locally recorded hashes from official HTTPS downloads, not an independently published checksum comparison.
- New private `database/` scripts: `install-local.mjs`, `local.mjs`, `lib.mjs`, `.gitignore`. They are outside the public prototype repository. **No SQL application schema, migration runner, DB integration tests, backup/restore test, Docker/VPS deployment or web API connection has been completed.** Do not claim Ubuntu migration is verified. Windows binaries/data directories must not be copied as an Ubuntu installation; use matching Linux services and logical dump/restore or recreate this empty DB.

**QA work completed:**
- Existing `npm test`: 48/48 passed; static repository-subpath checks passed. Live smoke/asset comparison passed for the existing published build.
- Final extended audit: **144 cases executed (81 model, 63 browser), 136 passed and 8 failed**. These failures represent five open defects: misleading success feedback after failed localStorage writes (four cases), two-tab lost updates, tablet App library overflow, malformed-state startup crash and silent unsupported-schema fallback.
- **33 deferred cases:** 31 not implemented, 2 not run (other browser/device environments and full accessibility review). Adding an empty DB does not make authentication, generation or database/API scenarios passed.
- Files ready: `QA_TEST_CASES.md`, `QA_EXECUTION_REPORT.md`, `QA_DEFECTS.md`; executable tools in `qa-tools/`. Final evidence: `qa-tools/results/2026-09-22T16-27-15-932Z/results.json` and screenshots, plus `live-smoke.json`.
- Two early harness issues were corrected (dialog selector scope and foregrounding the two-tab test). Historical runs are retained. No application fixes were made; public source remains unchanged/clean at the audited commit.
- At the pause, `qa-tools/summary.mjs` was authored but unverified. **Resolved 23 September:** corrected evidence handling and generated/verified QA_SUMMARY.md/HTML; see the resume entry above.

**Resume priorities:** confirm an approved remote/cloud PostgreSQL or Ubuntu VPS environment; decide whether to remove the owned local DB/download footprint; create versioned portable schemas/migrations and real DB tests remotely; fix the recorded defects and implement backend/authentication/generation in bounded slices. QA summary/ledger updates were completed on 23 September. Keep database host/ports/secrets in environment configuration. Application accounts/data can later be migrated; credentials must never enter public frontend/source. Do not restart local work merely because the earlier scripts exist.

### 2026-09-22 — Visual app generator with client application credentials

The owner reiterates the defining purpose: **Contigoo Studio creates complete applications visually**, so routine client delivery requires neither hand-written application code nor model prompts. Studio remains the owner's internal generator/management system. Each client receives the **generated application with its own credentials**, rather than access to the internal Studio. Keep Studio owner/employee identities separate from generated-application users and roles; the earlier “no client login” restriction applies to Studio, not to delivered apps.

Required end-to-end workflow: choose/create a client project → select optional frameworks/modules → configure entities/fields, pages/components and rules visually → configure generated-app users/roles → preview → generate/provision a standalone application → deliver its URL/package and initial access → manage versions, updates and operation from Studio. The visual model must drive real runtime data validation and authorization, not only decorative previews. AI is optional assistance; it must not be required for ordinary app creation. Reusable developer extensions may add capabilities once for reuse across projects.

This clarification confirms generated-app delivery/authentication as a core requirement; it does not yet settle physical database granularity, first web/native package target or local setup. The live v0.6 remains a browser-local prototype: no standalone generator, real database, Studio login or generated-client accounts have been implemented. A first genuine visual-build-to-authenticated-app delivery slice is the next implementation milestone once the remaining technical scope is agreed.

### 2026-09-22 — Standalone output, local database and pricing questions

The owner explicitly wants Studio to **produce a standalone project**, and asks to have a database before moving to the VPS. They describe a DB per “user / app,” ask whether this implies large storage and whether listed app prices include the database. Clarified that backend/DB development can happen locally before VPS deployment; only shared public authentication needs a reachable backend. Earlier statements implying VPS access is needed merely to write/test a backend must not be repeated.

The demo does not yet export/deploy a standalone application or provision a real DB. Clarify the first output target (self-hosted web app/runtime package versus source export/native mobile) and the requested DB granularity before implementation. A Studio control DB plus a separate database per deployed client solution is a recommendation, **not a confirmed replacement** for the owner's separation request. Database-per-user is not technically required; distinct users typically share an app DB under permissions. Separate modules versus whole project databases have different integration costs. Multiple databases can share one PostgreSQL instance. Size depends on records, files, indexes and backups; no capacity estimate is confirmed.

Current EGP prices are illustrative only and have no approved database/hosting/storage inclusions or automated provisioning. Define real setup/application/support/infrastructure charges and quotas before quoting. Added these distinctions to PLATFORM_ARCHITECTURE.md. Local DB tooling, production repository/workflow, output packaging and isolation policy remain to be confirmed; no backend/database was installed during this UI task.

### 2026-09-22 — Demo save message mistaken for an error

The owner showed “Demo version 3 saved locally. No public deployment has occurred.” Explained that this is a successful local snapshot save, not an error. Changed the prototype action to **Save demo version**, its success message to a positive confirmation, and added **View saved version** beside the builder with **Preview draft** for current edits. The interface explicitly says saving does not create a standalone hosted app URL. Tests prove that the shortcut opens the saved snapshot rather than later draft edits. All 48 local checks/static verification passed. Published `7b1d376`; workflow `35742833730` and live browser checks succeeded, including the new save/preview action. This wording fix does not implement the separately requested standalone exporter/backend.

### 2026-09-22 — Shared entity deletion and Mobile app option

The owner wants a Delete option for entities added under Shared data and an explanation of entities/fields. Implemented a plain-language entity/field/record primer, per-entity Delete with related-field confirmation, draft-only cleanup, preserved published/app data, and an empty-model state that disables field creation until an entity exists. Persistence failures keep the previous data.

The owner additionally requests **Mobile app** in the capabilities offered. Added it as the thirteenth catalog module, a Mobile category and an optional new-project starter. It supports the existing visual editor/rules and a phone-sized working browser runtime. Current monthly/setup defaults are explicitly zero placeholders; admin pricing remains editable. Native Android/iOS versus PWA delivery is still open; no native packages, app-store deployment, installation or real authentication has been implemented. This does not authorize client access to internal Studio.

Local verification passed 48 model/browser checks and static repository-subpath checks. Reviewed Shared data/mobile screenshots. Published v0.6 in commit `45107f5`; GitHub workflow `35739190880` passed. Live core files exactly matched the local build, and shared-entity/field deletion plus Mobile app phone-preview record creation were browser-verified alongside previous flows. No browser/asset errors; private files remain excluded.

### 2026-09-22 — Client dialog UI fix and starter explanation

The owner reported a Create client screenshot with crowded focus/label spacing and bottom fields/actions below the visible dialog. Reproduced at 1024×664: the submit button extended to about y=777, outside the viewport. Fixed create/edit dialogs with a stationary header/footer, internally scrolling form body, paired fields on wider screens, one column on mobile, consistent font and separated labels/focus outlines. Values, cancel behavior, creation/editing and native required-field validation are preserved.

Added a meaningful layout regression covering 1440×1080, 1024×664, 667×830, 390×844 and 390×500, including visible/clickable actions after scrolling, retained inputs and validation. All 43 checks and static verification passed. Published `c0e7704`; workflow `35734649091` succeeded. Live browser verification confirmed the fix at short desktop/mobile sizes, deployed files matching the build, and main management flows without browser/asset errors. Screenshots 17/18 show the corrected dialogs. The owner also asked what Custom workflows means: explained that it is an optional starter preselecting Management and Projects for requests/task tracking, with configurable fields/pages/simple rules—not an automatically completed approval engine. Added that explanation to the public README.

### 2026-09-22 — Approved product subtitle

The owner approved **Contigoo Studio — Internal Management & Development Platform**. Keep Studio as the product name and use the exact subtitle in the visible branding, overview and browser/page metadata. Implemented and published in commit `1fe34ae`, with the subsequent banner restoration in `e7070a9`. Live browser verification confirmed the exact subtitle, page title and responsive layout. This wording does not imply that the pending real authentication/user-administration backend has been implemented.

The owner explicitly requests preserving the original green overview banner: central Contigoo / One foundation with CRM, Inventory, E-commerce and Management cards around it. Restored beneath the updated subtitle in `e7070a9` and verified live; retain it in future UI changes. The user requests a summary of completed work and remaining items after this update finishes. All 42 local checks, static repository-subpath checks and GitHub-hosted CI passed. Subtitle workflow: `35727133193`; latest banner workflow: `35727866032`. Live core files matched the build, and smoke flows passed without browser/asset errors.

### 2026-09-22 — Real authentication and user management requested now

The owner reiterated this using a screenshot: **Users & Permissions must be a first-class management area**, not limited to client/project management. The same shared application URL must show Login to an unauthenticated visitor. The owner signs in as the sole Super Admin, creates an employee account and its permissions, then sends that employee the same URL to sign in with their own credentials. The current screenshot has neither login nor Users management; its “Contigoo admin” label is a placeholder, not an authenticated owner session. This is an implementation gap, not an unclear product requirement. Do not substitute more builder-only UI or a browser-local password check for the requested feature.

The owner opened the shared demo and expected the previously requested login and owner account. They explicitly request implementation of username/email/phone + password authentication and the ability to create/add employee users, not merely documenting these features. Acknowledge that neither real authentication nor the owner account has been created; the public static demo currently has no login.

Confirmed `prototype/server.mjs` is static-only, `package.json` has no backend/auth/database dependency, no Compose configuration exists, and the local environment exposes Node/SSH but no Docker executable on PATH. The repository is clean/synchronized after the v0.5 deployment. GitHub Pages cannot host the required authentication API/database by itself. The owner's deployment target remains their VPS/subdomain, not an unapproved external managed service.

**Remote deployment blocker:** no authorized VPS host/SSH user/connection alias, subdomain or service inventory is provided. These are required for VPS deployment, not for developing a local backend. Local database tooling/repository, standalone output scope and DB isolation still need confirmation. Account identifiers in the private Notes are application requirements, not VPS access. Do not hardcode the password, simulate a login gate or claim an account exists. The authenticated foundation needs sole-owner bootstrap, three-identifier login, sessions and employee provisioning/permissions with API-level tests. Standing public-demo publication permission does not authorize private-data publication or changes to an unspecified VPS.

### 2026-09-22 — Keep the shared presentation URL updated

The owner requests that completed demo changes always be published to the existing GitHub Pages URL for sharing with teammates. This is standing authorization to commit/push intended verified public-demo files and verify deployment after future completed demo changes. Private Notes/identifiers/secrets and real client data remain excluded. The authorization does not cover VPS or production infrastructure. Published accumulated v0.5 changes as `af3560c`; GitHub CI/Pages and a live browser smoke test passed. Share `https://sherifash93.github.io/contigoo-studio-demo/` now.

### 2026-09-22 — Optional Vercel import; mandatory VPS portability

The owner sees the existing GitHub repository in Vercel's Import screen and wants an easily shared demo without viewer credentials. Vercel can import the same repository with Other/default root, `npm run build`, output `dist`, no environment variables; the committed `vercel.json` supplies those settings. Share a public stable production domain and check Deployment Protection if login is requested. No Vercel project/URL has been created or verified by this session.

The owner explicitly requires the intended system to move fully onto their VPS, under their subdomain, using their resources. Keep web/API/PostgreSQL/identity/jobs/file storage self-hostable; avoid mandatory Vercel/cloud runtime or managed data-service dependencies. The present static build is portable and includes local assets. Production backend/login still needs implementation. Browser-local data is origin-specific and does not automatically migrate when moving domains; a validated transfer/import path remains to be built. Local `prototype/` is source/test/build workspace; parent notes/context are private planning materials, not website content.

### 2026-09-22 — Internal-only Studio, sole owner and employee access

This correction takes precedence over earlier client-facing platform/role assumptions. The entire current Contigoo Studio project is an **internal administration, development and management system**, not a portal for clients. Clients are managed records, not Studio users. The owner is the sole Super Admin and the sole creator/developer. After completing the system, the owner will add internal employee accounts with delegated management permissions; employees do not automatically become developers or administrators. Login must accept **username OR email OR phone number, plus password**, resolving to one account.

The owner requested a Notes Document consolidating the architecture and these updates, and supplied intended owner-account identifiers. Completed `CONTIGOO_STUDIO_NOTES.md/.html/.pdf`: four private pages, including the requested identifiers only in that deliverable and its private rendered/extracted artifacts. Do not propagate them into source, fixtures, public demos or shared context. The password was not written to documents, code or logs; set it through protected owner bootstrap when real authentication exists. No account, password hash or authentication backend has been created. Phone country/normalization and the identity-provider phone-login flow require implementation decisions. The prior stack is accepted as a working direction in principle, with deployment details still dependent on the VPS inventory.

### 2026-09-22 — Studio plus ongoing management; unified UX

The owner rejects fictional seed client names as a representation of their working system and clarifies that Contigoo must combine a developer Studio with ongoing management, not just creation. Framework starters and Solution builder looked like competing starting points. Completed v0.5 locally: empty-first workspaces, Projects & solutions as the single project entry with optional frameworks inside creation, Manage alongside Open in Studio, retained publication history, app usage, archive/reactivate and project deletion. Existing stored work is preserved; fictional legacy records are not real customers and can be explicitly deleted through management. All 42 prototype checks and static-site checks passed; guide v0.4 rebuilt and verified.

### 2026-09-22 — Infrastructure, database and future users

The owner asks to understand the infrastructure, database and complete hosting approach, reiterates that the project will be presented/hosted on their VPS, and intends to add authenticated/authorized users. Clarified that the present sample is static HTML/CSS/JavaScript served locally by Node or on GitHub Pages, with localStorage only: no DB/API/authentication/real authorization exists. Added `PLATFORM_ARCHITECTURE.md` describing the transition to a real multi-user system. Recommended TypeScript/Next.js, NestJS modular monolith, PostgreSQL, Keycloak/OIDC, Redis/worker, S3-compatible file storage, Docker Compose and a Caddy HTTPS proxy, subject to inventory and approval. Authentication and authorization belong in the first protected production slice; users can be onboarded progressively. VPS specs, existing services/proxy, domain, repository/workflow and next deployment scope are still needed. No VPS connection or deployment is authorized by merely discussing the architecture.

### 2026-09-22 — Separate clients from Studio projects

**Follow-up request — completed locally:** client management must include create, view, update and delete, with explicit actions in the client list. Added direct list editing plus confirmed deletion from the list/profile. Deletion lists all related projects and requires explicit consent to remove them and their local records/configuration/quotes/snapshots. Other clients, shared templates and default prices are retained. Storage failures leave the active data intact. Verified with 37 model/browser checks plus static-site checks.

The owner requests a visible client list and direct client creation with business/contact details, with projects as related items on the client profile. Solution builder must offer creating a new project or opening/updating an existing project. Review the end-to-end journey from a simple user/developer perspective, including custom-app and complete-solution creation. The work package separates client profiles from projects, supports multiple independent projects per client, and makes project selection explicit before app editing. The initial 37 checks passed; this work is now included in the deployed v0.5 and its 42-check suite.

The owner does not want to read a 34-page document and rejected the CRM-led framing. They want a concise personal summary and actionable guideline for building a complete Contigoo platform, similar in breadth to Dynamics 365 but highly configurable by them as administrator and developer.

The defining workflow is: enter the internal Contigoo management system → manage client/project records → build/configure apps → set branding and internal employee permissions → publish and maintain. Only the owner develops; employee management access is added after completion. CRM is one selectable capability, not the product identity or prerequisite release.

Owner-provided examples:
- Restaurant requests CRM.
- Company requests a management system and Inventory.
- Clothes factory or shop requests an E-commerce website. This does not automatically imply manufacturing requirements.

The owner explicitly likes **Contigoo Studio**: internal management + the owner's development workspace + reusable frameworks/modules/templates. Earlier client-facing applications/storefronts are potential separately scoped deliverables, not Studio access for clients.

### Latest refinement: an AI-assisted visual IDE

The owner likes the **Studio** name and clarified that the larger product is an IDE-like creator with AI, customizable frameworks/templates, features, properties and components. The new-project experience should default to **Start from scratch**, then allow module selection. Optional starters should represent application categories/frameworks such as CRM, ERP, Finance, HR, Inventory and E-commerce. Industry examples are illustrations, not the main template hierarchy or an approved initial release scope.

“Restaurant relationships” was the assistant's interpretation of a restaurant example, not an owner requirement. Remove it from primary creation choices; preserve any existing client projects and their configurations. Industry-specific presets can be optional later additions.

Routine client configuration must work visually. AI is an integrated assistant within Studio, not a requirement to leave Studio and prompt Codex for each change. Proposed AI functions: draft data models/pages/rules, explain configuration, suggest changes and tests, and apply reviewable changes to versioned project metadata. The current local prototype has no live AI integration.

## Owner and development workflow

- The owner is a solution developer with strong full-stack experience and Microsoft Dynamics 365 certification, particularly CRM.
- Codex is installed on the owner's VPS and is the preferred implementation tool. Claude is also available, but optional.
- Planning and documentation are being prepared with OpenCode. No delegated agents are required.
- The owner wants a practical pipeline, timeline, roadmap, implementation steps, Codex prompts, and test cases through release.
- The conversation develops requirements incrementally. New messages extend the context unless the owner explicitly changes direction.
- Windows documentation directory: `D:\Contigoo\01 Contigoo Platform`.
- VPS access details, resources, OS, existing services, repository, domain, and production topology are not yet provided.
- The owner intends to build using Codex on a VPS and has asked whether this assistant can implement the full project directly. Direct implementation versus Codex-led execution is not yet selected; no VPS connection is configured in this session.
- Presentation request: publish the sample to the owner's GitHub account `SherifAsh93` and a small hosted site for a manager presentation. Owner chose a **public** repository, proposed name `contigoo-studio-demo`. GitHub Pages is the simplest selected path; Vercel configuration is also prepared. External publication is authorized; credentials are handled through GitHub browser/device authorization, never copied into project files.
- Latest instruction: the owner can provide VPS access but wants to see a sample here first. Build and demonstrate a local interactive Studio prototype before any VPS connection or deployment. The prototype uses synthetic data and local browser persistence; it is not production authentication, provisioning or billing.

## Confirmed product requirements

1. A completely new internal Studio + Management System, not an extension of an existing Contigoo codebase.
2. A unified platform in the category of Dynamics 365, covering CRM, ERP capabilities, HR, Sales, Finance, Inventory, and possible later apps.
3. Reusable apps can be useful individually and together. Earlier sellable-app ideas require separate external delivery scope; they do not grant clients Studio access.
4. Earlier subscription/purchase/licensing ideas are commercial possibilities, not an instruction to make the internal Studio a customer SaaS portal. Exact external terms remain unresolved.
5. Customer customization, including logos and other organization-specific settings.
6. Extensive platform-administrator customization and configuration capabilities; the exact no-code/low-code depth is still being defined.
7. Owner/employee authentication, server authorization, client/project record separation and auditing are foundational. No client login is in scope.
8. A Contigoo-branded PDF implementation blueprint, supported by editable Markdown and a maintained context file.
9. The existing `https://contigoo.com/` website is a visual-brand reference. Its current product list and pricing are not requirements for this new build.
10. The platform must enable the owner to assemble and tailor different client solutions through a central administration/builder experience, rather than rebuilding each client project.
11. E-commerce/public websites were earlier delivery examples. Their external runtime/access needs separate scope under the latest internal-only correction.
12. Provide a short working guide. Keep detailed technical references optional, not required daily reading.
13. Current scope: protected internal Studio/management on the owner's VPS. Earlier public product website/client-surface ideas are separate from Studio user access. The domain is still unconfirmed.
14. Maintain an expandable catalog of components/apps that can be built under the platform. Catalog ideas are options, not approval to build every module at once.
15. Owner must have a clear **Edit app** and **Preview app** entry for each selected client app. A whole-solution mockup is insufficient.
16. No-code app building is a central requirement: the owner wants to create/customize apps through visual data, page/form and workflow tools rather than writing code or prompting a model for each client. Supported building blocks need real configurable behavior; general-purpose unlimited app generation is not claimed.
17. While assembling a client project, each selected app contributes its price to a running solution quote. Prices must be admin-editable. Recurring vs one-time charges, currency, discounts and final rates still need commercial decisions; the sample will use explicitly illustrative EGP monthly/setup prices.
18. Primary starting options must be blank-first and framework/category-based. CRM/ERP/Finance/etc. are reusable capability families; optional industry presets sit above them.
19. Studio should evolve into an AI-assisted visual development environment with a project explorer, reusable component palette, editable canvas, properties/data-binding inspector, data/relationships, workflows, users/security, previews/tests, versions/publishing and pricing.
20. Clients must have a searchable list and direct creation/editing of business/contact details, separate from projects. Show related projects on each profile. Solution builder must offer creating a new project or opening/updating an existing project, with a clear path to build one app or a complete solution.
21. Client management includes create, view, update and delete. These operations must be explicit in the list and profile, with defined handling of related projects when deleting a client.
22. Studio combines development with ongoing management of clients and solutions. Unify creation and lifecycle navigation; framework starters are optional inside project creation. New workspaces must not fabricate customer records.
23. Explain infrastructure/DB/access architecture clearly. VPS hosting and authenticated/authorized user onboarding are required for the real platform; the current static sample is only the interaction reference.
24. Exactly one owner is Super Admin and creator/developer. The owner adds employees after completion, with delegated internal management permissions. No client account, public registration or customer-admin Studio role.
25. Login accepts username OR email OR phone plus password for the same internal account. Account identifiers are recorded privately; password setup occurs through protected bootstrap, not documentation or hardcoded seeds.
26. The intended system must be fully self-hostable on the owner's VPS/subdomain using owner-controlled resources. Presentation hosting on GitHub Pages/Vercel must not introduce mandatory hosted-platform runtime/database/storage services.
27. Shared data entities need explicit deletion and clear entity/field terminology. Deleting an entity removes its associated shared fields from the draft after confirmation, preserving published and app-specific state.
28. Provide a Mobile app option in the app catalog/project creation. The prototype may preview mobile layouts; native Android/iOS versus PWA delivery, offline/device features and packaging require separate definition and implementation.
29. Studio must produce standalone applications/projects, not just preview snapshots. First output type and database isolation granularity remain to be confirmed.
30. Build/test the real backend and database locally before VPS migration. Clarify infrastructure/storage pricing; the prototype's example rates provision nothing and have no approved package inclusions.

## Working baseline — direction accepted in principle; details pending

- Platform-and-Studio-first delivery: build a thin configurable runtime alongside its admin builder and prove it across distinct client solution patterns.
- App manifests define reusable capabilities; versioned templates package configuration; project instances hold overrides, employee assignments and scoped data. Templates never contain private records or secrets.
- Basic custom entities/relationships, fields, screens, navigation, workflow configuration, branding and preview/publish belong to the builder's core scope. The exact depth and initial field/action set still need definition.
- The current identity boundary is one internal organization: owner and assigned employees. Public storefront/customer-identity systems require separate scope; they are not part of Studio login.
- One experienced developer leading Codex; 30–35 focused project hours/week assumed for estimates. Actual availability and team size are unconfirmed.
- Modular monolith, shared platform core, module-owned data and explicit internal APIs/events.
- TypeScript, Next.js web interface, NestJS API/worker, PostgreSQL, Redis-backed jobs, S3-compatible object storage, and an established OIDC identity provider.
- Shared PostgreSQL with explicit client/project record ownership, employee assignments and action/record permissions. RLS may reinforce isolation and must be tested under pooling. Do not automatically provision a customer tenant or login when a client record is created.
- Controlled metadata-driven configuration plus reviewed, versioned developer extensions for new domain logic. Avoid a separate codebase fork for each customer. Arbitrary untrusted customer scripts and a public marketplace are not confirmed requirements.
- First deployment is the owner's internal system. Customer SaaS subscriptions/dedicated delivery are separate commercial questions, not the current Studio access model.
- The earlier 24-week CRM plan plus contingency and 18–30+ month suite envelope are withdrawn as the current schedule. Re-estimate after S1 defines the builder, domain modules, client examples and actual capacity.

## Earlier executive notes: treatment

The owner supplied the text of `Contigoo Platform Notes.pdf`. Its core/frameworks/apps model remains useful, but an explicit Studio, template and client-solution lifecycle is now central. Claims of “3×” infrastructure and “5–10×” faster app delivery remain unverified. “One database” is a proposed implementation choice, not a product guarantee. Neither the notes' six-month bundle estimate nor the assistant's subsequent CRM-led schedule is the current implementation plan.

## Branding verified from the live website

Inspected 2026-09-21 at `https://contigoo.com/`.

- Homepage palette: paper `#F4F0E9`, warm white `#FFFDF9`, ink `#30312E`, muted `#746F65`, line `#DCD5C9`, gold `#916B3D`, sage `#DCE4D9`.
- Homepage headings: Fraunces; body: Inter.
- Global tokens also include cream `#EDE8E2`, charcoal `#1F1B16`, tan `#835F33`.
- Brand asset: `/contigoo-dark.png`; use the actual available logo in the generated document.
- Final PDF should embed assets locally so it can be read offline.

## Decisions needed before implementation

| ID | Decision | Needed by |
|---|---|---|
| D01 | Minimum framework/module/component scope and cross-category acceptance workflows; industry examples are illustrative | S1 |
| D02 | Weekly availability, team size, budget | S1 |
| D03 | SaaS, dedicated installation, perpetual license, source-code rights | S1 commercial baseline; before contracting |
| D04 | Future server inventory, OS, capacity, domains, backup provider | S1–S2 |
| D05 | Stack, identity provider, metadata storage/data-access library | S1–S2 technical spike |
| D06 | Initial countries, languages/RTL, currency, legal requirements | S1 baseline; before Finance/payroll |
| D07 | Sole-owner authority versus delegated employee management actions and client/project/record/field assignments | S1–S3 |
| D08 | Initial prices, seat basis, trial/grace/retention rules, payment provider | S5 |
| D09 | Entity/relationship, UI/workflow builder depth; reviewed extension and upgrade policy | S1–S3 |
| D10 | Inventory scope, valuation method, negative-stock policy | Before Inventory |
| D11 | Accounting scope, localization, qualified domain reviewer | Before Finance |
| D12 | Payroll scope, employee-data retention and residency | Before HR/payroll |
| D13 | Storefront builder scope: sections/templates vs free-form design; checkout/shipping/tax providers | S1 scope, S4 implementation |
| D14 | Standalone platform domain, routing, client subdomains/custom domains | S1–S2 |
| D15 | Codex-led, direct assistant implementation or mixed workflow; authorized repository/VPS environment | Before application implementation |
| D16 | Integrated Studio AI provider, server-side integration, structured edit/diff model, context and usage budget | AI design milestone |
| D17 | Phone country/normalization, identifier uniqueness, phone-login extension, verification/recovery channels and protected owner bootstrap | Before authentication implementation |
| D18 | Mobile delivery target: Android/iOS native versus PWA, supported device/offline capabilities and build/distribution workflow | Before production mobile delivery |
| D19 | Standalone output target/package and DB isolation boundary (project/solution, app/module or individual user), local DB tooling and provisioning/migration contract | Before standalone/backend implementation |

## Current deliverables and state

### Live presentation deployment

**Deployment version:** v0.6, published and independently verified on 22 September 2026.

- Live URL: **https://sherifash93.github.io/contigoo-studio-demo/**
- Public GitHub repository: **https://github.com/SherifAsh93/contigoo-studio-demo**
- Local repository root: `D:\Contigoo\01 Contigoo Platform\prototype` (the parent planning directory is not in this repository).
- Branch/current commit: `main` / `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c` (`fix: clarify demo saving and saved version preview`). Mobile/shared data: `45107f5`; client dialog: `c0e7704`; banner: `e7070a9`; subtitle: `1fe34ae`; lifecycle: `af3560c`; initial v0.3: `36542b4`.
- Successful workflow: https://github.com/SherifAsh93/contigoo-studio-demo/actions/runs/35742833730
- Deployment: GitHub Pages via Actions, HTTPS enforced, automatic verification/deploy on pushes to main. No Vercel account or VPS was needed. `vercel.json` is included as a compatible alternative.
- Published only the intended demo source and local brand/font assets/licenses. Planning documents, browser localStorage, secrets, node_modules, generated test output and private context were not committed or deployed.
- Local 48-check suite and static repository-subpath verification passed for this release. GitHub-hosted CI passed both suites; Pages deployment succeeded. The repository working tree is clean and synchronized with origin/main.
- Public-site browser smoke passed: HTTP 200, empty-first startup, client/project creation, app pricing/editing/record save, publication history, archive/reactivate and client deletion. No browser/asset errors. Deployed core HTML/JS/CSS exactly matched the local static build; private Notes/context and development-fixture paths returned 404.
- Visitors have separate browser-local demo state. Previous localhost projects do not automatically transfer to the public site's origin. Prepare presentation-specific examples on the hosted URL; local npm start remains a fallback.
- Authentication completed through GitHub's device flow and the official GitHub CLI. No credentials are recorded in these project files.
- This session's first push could not use an interactive credential prompt. Retried successfully with the existing authenticated GitHub CLI as a command-scoped Git credential helper; no persistent Git configuration or credentials were changed. CLI binary currently at `C:\Users\sheri\AppData\Local\Temp\opencode\gh-2.101.0\bin\gh.exe` (not on PATH). Live verification script: `C:\Users\sheri\AppData\Local\Temp\opencode\verify-contigoo-live.mjs`.

- `Contigoo Platform Notes.pdf`: pre-existing source reference; preserve it.
- `PROJECT_CONTEXT.md`: this record.
- `CONTIGOO_QUICK_GUIDE.md`: current source; three-page personal summary, client workflow and S1–S6 platform-builder guideline.
- `CONTIGOO_QUICK_GUIDE.pdf` / `.html`: v0.5 guide, 3 A4 pages, 337,449 bytes, with internal-only ownership/employee access, the unified flow and revised Q1–Q6 checks.
- `CONTIGOO_STUDIO_NOTES.md` / `.html` / `.pdf`: private owner Notes v1.1, 4 A4 pages, 344,010 bytes. Covers scope, ownership/employee access, private account identifiers (no password), VPS-owned architecture/portability, phased implementation and planned N1–N6 checks. Kept outside the public prototype repository.
- `STUDIO_PRODUCT_MODEL.md`: latest product hierarchy, target creator controls, proposed AI change workflow, official-platform research and linked sources.
- `CONTIGOO_APP_CATALOG.md`: expandable catalog with 49 candidate apps/capabilities, including the owner-requested Mobile app option. Historical external-surface concepts require separate scope; the current Studio remains internal-only. This is a selection menu, not an all-at-once backlog.
- `prototype/`: interactive frontend sample with admin overview, client creation/templates, app selection, branding/logo upload, entity/field configuration, role preview, draft/demo-publication snapshots, client previews and standalone platform website concept.
- `prototype/builder-model.mjs` / `studio-ui.mjs`: visual custom-app definitions, generated pages/record forms, simple create-time rules, project quotations, price defaults and non-destructive upgrades for earlier demo configurations.
- `prototype/README.md`: how to open, use and test the sample; synthetic data and browser-local storage only.
- `prototype/screenshots/`: twenty desktop/mobile screenshots; `prototype/validation-report.json` records 48 passing catalog/model/browser checks, including entity deletion, mobile preview, responsive dialogs, lifecycle, app runtime/pricing and legacy compatibility.
- `PLATFORM_ARCHITECTURE.md`: implemented static/localStorage infrastructure versus the proposed VPS web/API/PostgreSQL/identity topology, database responsibilities, authentication/authorization, operations and staged transition. Recommendations are not approved/deployed choices.
- `CONTIGOO_PLATFORM_BLUEPRINT.md` / `.pdf` / `.html`: superseded v0.1 technical reference, visibly marked; CRM-first scope/phase dates are not current instructions.
- `AGENTS.md`: instructions to help future coding sessions read and maintain context.
- `README.md`: navigation and document regeneration instructions.
- `TEST_EXECUTION_LEDGER.md`: recorded prototype regression/audit/static/live evidence; production Q1–Q6/N1–N6 and 48 legacy supplemental cases remain Not run. Legacy phase/UAT mappings require revision before reuse.
- `QA_SUMMARY.md` / `.html`: readable results from the 22 September audit, generated and document-verified 23 September; links to detailed cases, execution matrix, five open defects and retained raw evidence. `qa-tools/verify-summary.mjs` checks summary content, links/assets and responsive layout.
- `document-tools/`: document styles, build/verification scripts and dependency manifest. These are documentation tools, not the platform application stack.

## Previous v0.1 document verification (historical)

- `npm run build` passed using local Microsoft Edge: 34 designed pages, no content overflow, cached/embedded Contigoo logo and Inter/Fraunces fonts.
- `npm run verify` passed: 34 A4 pages, 32 sections, 48 unique test definitions, 32 clickable contents links, text inside page boundaries.
- Visually reviewed the full rendered contact sheet and full-size cover, contents, timeline, test-case and Codex-template pages.
- Evidence: `document-tools/layout-report.json`, `document-tools/validation-report.json`, and `document-tools/previews/`.
- Initial v0.1 PDF SHA-256 before superseded labeling: `f64d0baa63504fe4f41b952dbaae85c01b893ca32295b80db00382a0a3558ee7`.
- These are document checks only. No VPS access, application deployment, business feature implementation, or application acceptance testing occurred.

## Document verification

### Current Notes v1.1 hosting update — 2026-09-22

- Added owner-controlled VPS/subdomain/resources, presentation-only GitHub/Vercel hosting, VPS-managed files and explicit origin/data migration considerations. Updated the public demo status to verified v0.5.
- The first rebuild detected a page 3 overflow; shortened the final paragraph and rebuilt. `npm run build -- --notes` and `npm run verify -- --notes` passed: four A4 pages, four sections, N1–N6 present, no overflow. Reviewed the updated architecture page. PDF 344,010 bytes; SHA-256 `301c7adb93ef52723891d7505b5f99749b1d36d3faf7e7e608dc9a7269be5963`.

### Previous Notes v1.0 and current guide v0.5 — 2026-09-22

- Added `--notes` build/verify mode using local branding/fonts. Initial Notes builds detected overflow on pages 2–4, then page 2 only; adjusted the notes-specific typography and shortened text without removing requirements. Final build/verification passed: four A4 pages, four sections and six N1–N6 definitions, no overflow. Visually reviewed the contact sheet and account/infrastructure/acceptance pages.
- Notes PDF: 343,263 bytes; SHA-256 `670d3b7b44a8a84c7f8eee6611bca8bbe4a58d27992ec7903c63a6cc5ae46d12`. Evidence: `document-tools/notes-layout-report.json`, `notes-validation-report.json`, `notes-previews/`. Notes and their extracted/rendered artifacts include private identifiers and must not be published; no password was stored.
- Updated quick guide to the internal-only model and rebuilt source/HTML/PDF. `npm run build` and `npm run verify` passed: three A4 pages, three sections, Q1–Q6 present, no overflow. PDF 337,449 bytes; SHA-256 `c7ebeb5155afe8ddf21654fb5fd4a93f19c0fc57ac1d11bc429c31ea2fe930a7`.
- Updated architecture, product model, agent instructions, README, catalog scope notice and test ledger. No application/authentication/VPS changes or account creation occurred. The prototype's earlier 42 checks were not rerun for documentation-only changes. Production Q1–Q6/N1–N6 remain Not run.

### Previous v0.4 guide — 2026-09-22

- Updated Studio + management framing, client/project distinction, single Projects & solutions entry, optional frameworks inside creation, and ongoing management after publication.
- The first build detected page 2 overflow. Shortened the commercial/delivery wording, rebuilt and passed `npm run build` and `npm run verify`: three A4 pages, Q1–Q6 present, no overflow, embedded assets. Reviewed the contact sheet.
- Previous v0.4 PDF: 337,173 bytes; SHA-256 `4d7b530411b3c9be7ec6b4025e6ccefbf7bf018ff39e324be899c85a0e6e30b4`. The superseded blueprint was not changed.

### Previous v0.3 verification

- `npm run build` and `npm run verify` passed: three A4 pages, three sections, Q1–Q6 present, corrected platform-builder content present, no content overflow.
- Visually reviewed all three rendered pages for readability and layout.
- `npm run build -- --legacy` and `npm run verify -- --legacy` passed for the original 34-page reference, now visibly marked superseded on its cover and running headers/footers.
- Current evidence: `document-tools/quick-layout-report.json`, `quick-validation-report.json`, and `quick-previews/`.
- Previous v0.3 quick-guide PDF SHA-256: `d2964d15bf09efd649abe0234a338409ccd018d02f35f6bbccfa8dce2fa23e14`.
- Regenerated quick guide and legacy superseded reference after the framework/AI clarification; both passed their document checks. Reviewed the new quick-guide opening page and new-project screenshot.
- Application tests Q1–Q6 and T01–T48 remain Not run.

## Local interactive sample — verified state

### v0.6 shared data and mobile selection — 2026-09-22

- Shared data displays entity/field/record explanations and per-entity field counts/Delete actions. Confirmation lists affected shared fields, removes only draft metadata, and preserves other entities, app definitions/records, prices and published snapshots. Last-entity deletion is supported with Add field disabled until an entity is added. Storage failures do not apply deletion.
- Mobile app is a selectable thirteenth module, filter category and optional framework starter. Its existing metadata editor supports data/pages/simple rules, and a 430px-max browser preview provides functional local record forms/lists. It does not build/install native apps or PWAs. Pricing starts at an explicitly editable EGP 0 placeholder.
- Passed all 48 tests plus static repository-subpath verification, with twenty screenshots. Added model/browser checks for destructive-field handling, consent/cancel, empty state/reload, publication/app-data preservation, storage failures, mobile starter/catalog selection, local form/record persistence and phone-layout bounds. Live release browser verification and GitHub Actions succeeded for `45107f5`.

### v0.5 unified Studio + management — 2026-09-22

- **Navigation:** Overview, Clients, Projects & solutions, App library. Framework starter page removed from the navigation/creation path; optional framework selection lives inside Create project. The solution builder is the selected project's Studio editing workspace, not a second entry point.
- **Overview:** counts actual saved clients/active projects/pending changes/archived projects, ongoing work and recent activity. New browser workspaces start empty. Historical fictional companies moved to `prototype/test-fixtures.mjs`, excluded from server/build assets. Previously saved browser records are preserved; Clients explains their legacy origin when present.
- **Management:** each project offers Manage and Open in Studio. Manage shows apps/daily record use, record counts, quote, publication history, metadata editing, archive/reactivate and confirmed independent project deletion. Project deletion keeps the client, sibling projects and reusable catalog.
- **Versions:** new publishes retain immutable-by-copy configuration/quote snapshots with timestamps, and preserve the previous legacy latest snapshot. Older already-overwritten versions cannot be recovered. Preview each retained version; records/DB rollback and remote deployment are not implemented.
- **Archive:** hides from the default active list, retains project state and publications, and requires reactivation before normal Studio/app use. Client lists and archived filter retain management access. This is local organization, not cancellation/unpublishing of a deployed service.
- **Persistence:** publication/archive/deletion commit browser storage before replacing active state; failures keep existing data. No storage-key reset or automatic deletion of prior clients occurred.
- **Checks:** `npm test` passed 42 model/browser checks; `npm run test:static` passed under the repository subpath. Covered empty-first startup, single create flow, historical compatibility, client CRUD, project/archive/reactivate/delete, publication history/preview, failed publication persistence, runtime/pricing and desktop/mobile layouts. Sixteen screenshots; reviewed overview, project hub and management at desktop/mobile widths. Local HTTP 200 verified. Production Q1–Q6 remains Not run.

### v0.4 foundation — historical flow, superseded by v0.5 above

- **Clients:** searchable management table with Create/View/Edit/Delete, editable business name/industry/contact/email/phone/address/notes, and a profile with related projects. A client can exist without a project. Confirmed deletion removes the client and all its related projects with their data; shared templates/prices and unrelated clients are retained. Persistence occurs before changing active state; failed saves retain the client and projects. Selected project/client filters are cleared when their target is deleted.
- **Solution builder:** project hub with Create new project / Open existing project, search and client filter. New projects require a client and separate name, support optional description and blank-first framework selection. Creating a client from project setup returns to the retained project inputs.
- **Studio:** open a project explicitly, select/build apps, edit data/pages/workflows, configure branding/access/pricing, preview and publish. Back to project returns from the app editor; All projects returns to the hub. Project names/descriptions can be updated independently from client details and display branding.
- **App library:** explicit working-project selector; no default project is silently selected on startup. Catalog browsing uses default rates until a project is selected.
- **Compatibility:** the same storage key remains. `state.clients` is the existing project collection; `state.clientProfiles` holds business/contact records, with `clientId`, `name` and `description` added to projects. One profile is created for each legacy solution without merging by name. Migration preserves old IDs, records, definitions, prices and published snapshots. Attempts a one-time raw backup at `contigoo-studio-concept-v1-before-client-directory-v1`. Valid empty directories are retained.
- **Evidence:** `npm test` passed 37 model/browser checks; `npm run test:static` passed under `/contigoo-studio-demo/`. Covered client creation/view/edit/search/delete, cancellation, related-project confirmation, storage failures, deleted-client persistence/no reseeding, independent projects for the same client, project metadata/reopening, explicit app-library selection, migration/backup and prior builder/runtime/pricing checks. No browser/asset errors. Desktop 1440px and mobile 390px checks passed; directory/profile/project-hub and deletion-dialog screenshots visually reviewed. `git diff --check` passed.
- **Files:** `prototype/model.mjs`, `builder-model.mjs`, `app.mjs`, `studio-ui.mjs`, `studio.css`, verification scripts, package version/lockfile and README. Updated parent README, product model and agent instructions. The PDFs/blueprint were not revised in this navigation work package; use the product model and prototype walkthrough for this latest flow.
- **Delivery:** this foundation is now included in deployed v0.5. Future verified demo updates are authorized for GitHub Pages by the standing owner instruction. Production acceptance Q1–Q6 remains Not run; no VPS/backend/AI work occurred.

- Stack: plain HTML/CSS/JavaScript with a Node static server. This is a design/interaction prototype, not a production framework decision.
- Start command: `npm start` from `prototype/`; local URL `http://127.0.0.1:4173`.
- Local server restarted on 2026-09-22 as process 7144, bound to 127.0.0.1 only; HTTP 200 verified at `http://127.0.0.1:4173`. Process IDs/runtime availability may change across sessions.
- Current `npm test` passed all 48 checks. No browser runtime or asset-loading errors recorded.
- Twenty screenshots generated. Latest additions: `19-shared-data-entities.png`, `20-mobile-app-preview.png`; previous views refreshed. Named examples in verification screenshots are test fixtures, not default workspace data.
- The overall workspace/storefront is illustrative. Individual app previews have browser-local CRUD, generated pages and simple rules. No production authentication, server tenancy enforcement, database, payment processing, checkout, invitations or deployment of generated apps exist. The static Studio demo itself is hosted on GitHub Pages. Q1–Q6 are not marked passed by prototype checks.
- Prototype saves configuration in browser localStorage under `contigoo-studio-concept-v1`. It does not contact the VPS.
- Upgrade preserves that key, clients, branding and shared fields; attempts a one-time pre-upgrade backup in localStorage. Existing published snapshots are retained. Old client-wide fields remain under Shared data; app-specific definitions are edited through each app's Edit app button.
- Demo pricing uses editable EGP monthly/setup amounts and minor-unit arithmetic. Default prices are copied on first selection; existing project overrides and published quotes do not track later default-price edits. Tax/usage charges and final commercial terms are not implemented/approved.
- Custom app templates copy schemas/pages/rules only. Client data and pricing are separate; existing configured client instances remain unchanged when a reusable template is updated.
- Primary starters: Start from scratch (default), CRM, ERP / Business suite, Finance, Inventory & Operations, HR & People, Website & E-commerce, Service & Support, Custom workflows and Mobile app. They preselect demo modules, not finished domain/native-mobile engines. Restaurant/company/store IDs remain compatible for existing projects but are absent from primary creation options.
- No AI chat/agent is simulated or connected. The planned component canvas/property inspector and integrated AI are future Studio work, not completed capabilities.

## Next actions

1. Review the private four-page Notes and internal-only guide: sole owner/developer, later employees, clients as records, and username/email/phone login. Confirm employee grants and phone country/verification/recovery.
2. Obtain VPS OS/resources/current services, subdomain and authorized implementation repository/workflow. Build the owner-authenticated self-hosted foundation; set the password only through protected bootstrap. Continue publishing completed verified demo changes under the standing authorization. GitHub Pages currently contains v0.5. If the owner imports Vercel, verify its production URL when supplied.
3. Scope the project/component explorer, canvas/property inspector, data bindings and user/security editors around a shared versioned model; define the integrated AI edit contract.
4. Establish implementation workflow, repository/VPS details and domain; implement runtime and Studio together with real server-side isolation. Estimate only after the initial cross-category scope is agreed.

## Update protocol

- Record confirmed user instructions immediately, with the date.
- Maintain separate confirmed/proposed/open sections.
- Record phase progress using evidence: changed files, test results, deployment checks, and unresolved blockers.
- Update the blueprint when architecture or scope changes, bump its version, and regenerate the PDF.
- Never mark an application test passed merely because it appears in the blueprint.
- Keep credentials, tokens, personal records, and private production data out of these documents.

## Change log

### 2026-09-22

- Clarified a successful local-version save mistaken for an error: renamed the action Save demo version, added View saved version/Preview draft, and tested snapshot-versus-draft display. Passed all 48 checks/static verification and published `7b1d376`; GitHub run `35742833730` and live browser checks succeeded. Owner then explicitly requested standalone output, local database development before VPS migration and clarification of per-user/app DB storage/pricing. Recorded these requirements and explained the architecture trade-offs; database granularity/output target remain awaiting confirmation. No standalone package or database was created.

- Owner requested Shared data entity deletion and an entity/field explanation, then a Mobile app creation option. Implemented v0.6 with scoped entity/field deletion and preserved snapshots/app state, thirteen-module catalog, Mobile starter/category and working phone-sized browser preview. Native/PWA delivery remains unimplemented and unselected. Passed 48 checks and static verification; published `45107f5`, workflow `35739190880` succeeded, and live browser asset/feature verification passed.

- Fixed the reported Create/Edit client dialog layout: responsive paired fields, label/focus spacing and stationary header/footer with internal scrolling. Reproduced the hidden-submit issue before changing it; all 43 checks/static checks then passed. Committed/pushed `c0e7704`; CI/Pages run `35734649091` and live browser validation passed. Explained the Custom workflows starter and documented its Management/Projects selections and simple-rule scope.

- Owner approved the subtitle “Internal Management & Development Platform” and asked to preserve the original green connected-apps banner. Added the subtitle beneath the logo, to the overview, browser title/meta description and public README; restored the illustration without reverting management navigation. Committed/pushed `1fe34ae` and `e7070a9`. All 42 local checks/static checks and both GitHub Pages workflows passed; verified the exact subtitle, restored app cards, desktop/mobile layout, deployed asset matches and main management flows on the public URL. Real authentication/employee management remains unimplemented and blocked on backend/VPS setup.

- Owner authorized keeping the shared GitHub Pages demo updated after completed verified changes. Reviewed intended files and exclusion of private data, passed 42 local checks/static verification, committed/pushed `af3560c`, and verified successful workflow `35722413802`. Initial Git push credential-prompt failure resolved with a temporary authenticated CLI credential helper. Live browser flows and deployed-build content comparison passed; private-document paths are not served.
- Owner showed Vercel's repository Import screen and reiterated complete VPS/subdomain hosting on their own resources. Confirmed optional Vercel settings and portable static build, recorded self-hostable production services/no managed-host dependency, and explained browser-origin data migration. No Vercel project or VPS infrastructure was created. Private Notes refreshed with this requirement.

- Owner requested a Notes Document and corrected the audience: entire Studio is internal, with the owner as sole Super Admin and sole creator/developer, employees added after completion, and no client login. Required username/email/phone plus password. Created private four-page Notes v1.0 with account identifiers only (password not stored or set), updated architecture/guide/context/access checks, and verified Notes and guide PDFs after resolving Notes layout overflow. No account/backend/VPS setup performed.

- Owner corrected the client/solution conflation: requested a visible client list, standalone client creation with details/related projects, and new/existing project options in Solution builder. Requested reviewing the full simple-user/developer workflow.
- Implemented v0.4 locally: separate client profiles and independent projects, client search/profile/editing, new/existing project hub and filters, named project metadata, linked project creation, explicit app-library scope and revised navigation. Preserved earlier browser data with additive migration and one-time backup.
- Passed 32 model/browser checks and static repository-subpath verification; reviewed new screenshots. Refreshed walkthrough/product/context instructions and started the local sample server. Public v0.4 publication remains pending.
- Owner clarified that Clients must provide full management, including update and delete. Added direct list Edit/Delete and profile Delete, related-project scope/confirmation, atomic persistence failure handling and stale-selection cleanup. All 37 model/browser checks and static-site checks passed, including last-client deletion without reseeding and preservation of unrelated clients/shared app templates. Reviewed the management list and deletion dialog; localhost returned HTTP 200. Public publication remains pending.
- Owner clarified Studio + ongoing management, rejected fictional seed client framing and competing Framework starters/Solution builder entry points. Implemented v0.5 empty-first management overview, unified Projects & solutions creation, Manage/Open in Studio, app usage, publication history, archive/reactivate and independent project deletion. Passed 42 prototype checks and static verification; regenerated/verified the three-page v0.4 guide after fixing a layout overflow.
- Owner requested infrastructure/DB explanations and reaffirmed VPS hosting and future authenticated/authorized users. Added PLATFORM_ARCHITECTURE.md with the current static-only state and proposed backend/PostgreSQL/Keycloak/services topology, data model, roles, deployment stages and outstanding environment decisions. No production framework, DB, identity service or VPS was installed/configured.

### 2026-09-21

- Consolidated the conversation, supplied executive notes, owner background, chosen directory, Codex preference, and greenfield requirement.
- Verified the website's brand tokens and available local PDF tooling.
- Owner paused before file creation, then explicitly asked to continue in Build mode.
- Began version 0.1 implementation playbook. Application architecture and timeline remain proposals pending owner review.
- Completed the 34-page branded PDF and editable Markdown, context/agent instructions, test execution ledger, offline HTML, and reproducible rendering tools.
- Passed document build and verification and reviewed page renders. Original notes PDF preserved. Next step is owner review, then P0 scope and technical validation.
- Owner corrected the product framing: they need an admin/developer-led platform for assembling client-specific systems, not a CRM-led product. Requested a short summary and working guideline.
- Added restaurant CRM, company management/Inventory, and shop/factory E-commerce examples as design anchors. Introduced Studio/template/client-solution lifecycle as a proposed implementation model.
- Superseded the old roadmap and estimates. Prepared a three-page v0.2 quick guide and updated future-session instructions to use it first.
- Generated and verified the short guide; inspected all three page renders. Regenerated the old reference with superseded labels and updated README, agent instructions and test ledger to prevent stale CRM-led direction from governing future work.
- Owner confirmed the same platform-builder concept, requested the component/app catalog, specified a standalone website and VPS/Codex development, and asked about direct implementation by this assistant. No implementation mode or VPS access has yet been established.
- Created the expandable component/app catalog with website/Studio/client surfaces, shared services, builder tools, 48 candidate apps, 18 solution examples and recommended implementation order. Catalog candidates remain proposed; no application code or VPS changes made.
- Owner offered future VPS access and requested a sample first. Started local interactive prototype work; remote access and production implementation remain pending sample review.
- Built and launched the interactive sample at `http://127.0.0.1:4173`; passed 15 checks and generated six visual previews. Catalog counts verified. Awaiting owner feedback; no VPS credentials, connection or deployment involved.
- Owner tested client creation but could not find individual app editing/preview. Requested full visual app-building control and additive app pricing per client project. Began extending the local prototype, preserving the existing browser storage key and client configurations.
- Completed prototype v0.2: explicit Edit app/Preview app, Create custom app, entity/field controls, dashboard/list/form/content pages, simple executable create-time rules, local demo record CRUD, reusable custom-app templates, default/project pricing, live totals/discounts and published quote snapshots.
- Passed 23 checks and refreshed the live local server. Added visual screenshots and a practical walkthrough. The owner should refresh the existing browser tab, then choose a client → select app → Edit app/Preview app; project pricing is visible while selecting.
- Owner rejected industry-first starters, likes the Studio name, and defined the broader product as an AI-assisted visual IDE. Started official-documentation research and a blank-first/category-based starter correction; existing projects must be preserved.
- Reviewed official Dynamics 365, Power Apps/Dataverse/Copilot, Odoo Studio, Frappe DocType and Retool classic/AI builder documentation. Recorded facts, design lessons and URLs in STUDIO_PRODUCT_MODEL.md; no claim of exhaustive product review or parity.
- Completed blank-first creation plus eight optional framework/category starters with visible module/rate summaries. Preserved legacy projects, passed 25 checks, fixed mobile navigation sizing, and refreshed the three-page guide to v0.3. Live demo assets at port 4173 verified; no server restart or data reset needed.
- Prepared a standalone public demo repository in `prototype/`: included local brand assets and font licenses, pinned test dependency, allowlisted static build, GitHub Pages workflow, Vercel configuration and manager walkthrough. Both the 25-check suite and repository-subpath static check passed. GitHub device authorization is the current publication blocker; repository/site must not be reported live until verified.
- Resolved GitHub authorization, verified account SherifAsh93, committed/pushed public repository `contigoo-studio-demo`, enabled Pages and completed the workflow successfully. Public website verified in a browser and opened for the owner. Publication blocker is resolved.
