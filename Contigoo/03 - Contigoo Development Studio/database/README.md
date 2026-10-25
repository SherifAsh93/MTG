# Contigoo — remote development database

The owner confirmed on 23 September 2026 that backend/database implementation and end-to-end testing should happen **before any future hosting decision** (local-first rule, corrected 30 September 2026 — there is no VPS migration for this project), using a **web-hosted PostgreSQL database**. The owner created `contigoo-studio-dev` on Neon Free in Frankfurt, using PostgreSQL 17. Browser authorization and real TLS-verified connections now work. The old local cluster remains stopped.

## Implemented hosted database foundation

- `contigoo_studio_dev`: internal Studio development database.
- `contigoo_studio_test`: separate integration-test database, with separate credentials.
- Four non-superuser service roles: a migration owner and restricted runtime role per database. Runtime roles cannot create databases/roles, bypass RLS or connect to the other environment's database.
- `studio` schema: `principals`, `clients`, `projects`, `project_assignments`, `audit_events`.
- `contigoo_migrations.history`: transactional, checksum-tracked migration ledger with an advisory lock.
- RLS denies missing/invalid/disabled identities; employees see assigned project/client records. Delegated management cannot change the Studio model. Runtime credentials cannot modify identities/assignments or audit history.
- Relational ownership constraints, revisions for conditional concurrency updates, and atomic audit triggers. The eventual API must enforce expected revisions and derive transaction-local actor identity from a verified login, never browser-supplied IDs.
- No real owner/employee identity, password or customer records have been seeded. The schema's OIDC issuer/subject references do not implement authentication. The API, full visual-model validation, runtime records, quotes/publications, frontend integration and standalone delivery remain future work.

These two databases isolate **development from testing** for Studio control data. They do not decide the still-open database-per-project/app/person policy for generated applications.

### Find the tables in Neon

Open the project → Tables → choose database **`contigoo_studio_dev`** → schema **`studio`**, then refresh. The default `neondb` database and `public` schema do not contain these tables. The owner's console role has explicit connection and read visibility. Both development and test application tables are empty after fixture cleanup.

### Commands and private configuration

From `database/`:

```powershell
npm run db:status
npm run db:migrate:test
npm run test:hosted
npm run db:migrate:dev
```

The hosted setup reads restricted, ignored `.private/hosted-bootstrap.json` and `.private/hosted-services.json`. Do not read or print these files into chat/logs. `provision-hosted.mjs` creates only the saved development/test resources, does not reset existing passwords/data, and rejects name collisions before adopting new resources. The bootstrap role has SET access to migration owners so PostgreSQL can create databases with those owners; application roles have no role memberships.

`attach-neon.mjs <existing-project-id>` attaches an explicitly selected Contigoo project and saves its bootstrap credentials privately. It never creates a duplicate cloud project. `status-hosted.mjs` reports only schema names, counts, versions and privilege flags. `verify-hosted.mjs` refuses a nonempty test database, uses synthetic records and removes only its own fixture identifiers. Reports under ignored `reports/` retain failures and later runs. Schema updates require new migration files; do not modify applied migration SQL.

## Prepared now

- `remote-config.mjs` / `remote.mjs`: provider-neutral, read-only connection check with certificate/hostname verification, timeouts and restricted output.
- `.env.example`: server-only configuration names; actual values belong in ignored `database/.env` and must not be pasted into chat or committed.
- `remote.test.mjs`: synthetic configuration and client-lifecycle tests. These do not connect to a real database or prove real TLS connectivity.
- `package.json` / `package-lock.json`: installed project-local `pg` 8.23.0 and official Neon CLI 5.0.1. No local database server was installed or started. Two transitive CLI dependencies are overridden to patched releases (`@hono/node-server` 2.0.10 and `diff` 5.2.2); the final install audit reports zero vulnerabilities.
- `neon-access.mjs`: official browser authorization wrapper, isolated restricted-access CLI configuration under ignored `database/.private/neon/`, with raw account/secret output suppressed.

The original readiness utility is complemented by the migration/provisioning foundation above. It is not the backend or authentication service. The Next.js/NestJS/PostgreSQL/OIDC working direction still governs those implementation slices.

## Hosted option — new development project requested

Neon Free provides standard PostgreSQL suitable for initial development. Its official pricing page checked 23 September lists **0.5 GB per project**, **100 CU-hours per project**, **5 GB public transfer per project**, no credit card required and idle suspension after five minutes. Small synthetic text datasets are a reasonable starting workload; indexes, metadata versions, audits and retained test branches also count toward storage. Free-tier limits are not production sizing or performance guarantees.

Use portable PostgreSQL features and standard SQL migrations. Do not depend on provider-specific authentication, APIs or storage for the application's core. A final move to the future approved server needs a tested logical dump/restore or migration-based recreation; changing a connection setting alone does not transfer data.

Sources: https://neon.com/pricing · https://neon.com/docs/connect/connect-securely

## Connection handoff

1. Sign in to the intended owner-controlled Neon account at https://console.neon.tech/, then run `node database/neon-access.mjs login` from the workspace root and approve the official CLI connection. The CLI's browser authorization expires after 60 seconds, so sign in to the normal console first. A Vercel dashboard login does not complete Neon CLI authorization. Vercel-managed Neon integrations need API-key authorization instead, with the key supplied privately rather than in chat.
2. Choose a region near the backend's development execution location. Prefer PostgreSQL 17 for continuity unless another supported major is explicitly selected.
3. Enter the provider's **direct DNS host**, port, database name, service user and password privately in `database/.env`, using `.env.example` as the guide. Keep the file access restricted. These are DB service credentials, not the Studio owner's login.
4. The owner-approved Node dependencies are now installed. Use `npm ci` inside `database/` for a future reproducible install. The optional esbuild install script was left unapproved by npm policy; database readiness and browser login do not require it.
5. From the workspace root, run:

```powershell
node --env-file=database/.env database/remote.mjs --check-config
node --env-file=database/.env database/remote.mjs
```

The first command only checks settings. The second connects read-only and reports database size/version, TLS and role privilege flags without displaying connection identifiers or passwords. A successful probe does not approve using a provider-admin account as the runtime role. Restricted runtime/migration roles are the next setup step. The tool uses Node's trusted certificate roots; private-CA providers require an explicitly trusted CA rather than disabling verification.

Current evidence: browser authorization completed, project/version/region and both runtime TLS connections are verified, and two migrations are applied in development/test. Six synthetic readiness tests and the real hosted integration suite run separately. The initial hosted run found that ACL changes attempted by the bootstrap role did not remove PUBLIC connection access; running those changes as the actual database owner fixed it. A subsequent test-suite run passed all 23 checks. Client TLS is checked on the verified Node TLS socket; Neon's internal database hop reports no TLS because the provider proxy terminates client TLS. No certificate checks were disabled.

## Implementation and acceptance sequence

1. Confirm private implementation workspace/repository, hosted connection and test isolation; establish runtime/migration roles.
2. Versioned migrations for clients/projects, identities/assignments, visual metadata, app records, quotations, versions and auditing. Repeated migrations must be safe and recorded.
3. Real Studio owner bootstrap, username/email/phone login and server authorization. Confirm phone normalization/verification; test the identity-provider phone flow.
4. APIs and frontend integration: client/project lifecycle, visual definitions, server-validated records/rules, quotes and publication. Preserve existing browser work through explicit import when requested.
5. Standalone generated-app runtime/delivery with separate identities. Confirm the first web output package and database isolation boundary; hosted development does not settle per-project/per-app/per-person policy.
6. Isolated database/API/browser acceptance tests, denied access, concurrent updates, rollback and logical backup/restore. No tests may reset an existing development database blindly.

Unit checks available now, without installing dependencies:

```powershell
node --test database/remote.test.mjs
```

Local `install-local.mjs`, `local.mjs`, `.local/` and portable downloads are historical paused work. Do not restart, delete or relocate them without the owner's explicit instruction.
