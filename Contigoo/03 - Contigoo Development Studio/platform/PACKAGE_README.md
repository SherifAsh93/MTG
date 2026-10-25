# Contigoo standalone web application

The saved visual model and version are in `delivery.json`. This package contains a reusable runtime, standard PostgreSQL migrations, local assets, dependency lockfile and per-file checksums. It does not contain client records, database endpoints/passwords, session secrets or an initial account.

## Deploy under your control

1. Allocate a **dedicated PostgreSQL database for this solution** and distinct migration-owner, application and identity-service roles. The application/identity roles must not be superusers, create roles/databases or bypass RLS. Restrict CONNECT to this database. Configure verified PostgreSQL TLS; private CAs can be supplied through Node's `NODE_EXTRA_CA_CERTS` startup environment.
2. Use Node.js 22.13+ (the current implementation was tested on Node 24.19) and PostgreSQL 17. From this package root run `npm ci --omit=dev`.
3. Copy `.env.example` to `.env.runtime` and fill only runtime database URLs, HTTPS application origin and bind/proxy settings. Set `APP_MODE=delivered` and keep `APP_MANIFEST=delivery.json`. Protect the file and keep it out of source control.
4. Copy `.env.migration.example` to `.env.migration` and fill the migration connection plus the existing runtime/identity role names. **Do not load this file into the application process.**
5. Run `npm run secrets`. It creates `.private/instance.env` with independent auth and owner-setup secrets; existing files are never overwritten. Restrict this file to the service/operator accounts.
6. Apply the schema and grants:

   ```sh
   node --env-file=.env.migration platform/dist/migrate-production.js
   ```

7. Start the runtime behind your HTTPS reverse proxy:

   ```sh
   node --env-file=.env.runtime --env-file=.private/instance.env platform/dist/main.js
   ```

8. Visit `/setup`, enter the protected setup code from your private instance environment, and create this application's administrator account. Then sign in. The authenticated administrator's first initialization loads configuration only; Studio records and accounts are not copied.
9. Add this application's users and their read/write access. They use the app's separate database and credentials; internal Studio sessions do not grant access.

Keep the Node process on loopback or a private container network. Configure `TRUST_PROXY_HOPS` for the actual proxy topology, rather than trusting arbitrary forwarding headers. Health endpoint: `/api/health`. No Neon CLI or Neon-specific runtime API is required.

## Identity and data boundaries

Username, email and an associated international `+country code` phone resolve to the same account and password. A stored association is **not** SMS ownership verification. Public registration is disabled. External verification and message-based recovery are separate integrations, not implied by this package.

Configured fields, forms, pages, simple create-time rules and branding drive the runtime. Record validation and permissions run on the server. This generic runtime is not a native Android/iOS build or a completed accounting, stock-valuation or checkout engine.

## Configuration updates and rollback

Preserve runtime configuration, private secrets and the database when installing a newer package. Install its pinned dependencies, apply forward SQL migrations, and restart the runtime. The application administrator can then use **Versions & updates** to review and explicitly apply the package's configuration. Existing records are checked against the proposed model before any change commits.

Compatible saved configurations can be restored from the same screen. Destructive field/entity removal or required/type changes that conflict with existing records are blocked, leaving the current configuration usable. For example, add a new field as optional, populate its records, then make it required in a later version. Configuration rollback is not SQL-schema downgrade or database recovery.

## Backup and migration

Back up the database, auth secrets and server-managed files independently. This ZIP is a **configuration/runtime release, not a data backup**. Use logical PostgreSQL dump/restore rather than copying Windows data directories. When restoring with new role names, restore without old ownership/ACLs and rerun the migration/grant command under the new migration owner. Preserve auth secrets deliberately if existing sessions must survive, or invalidate sessions as a planned security action.

The development checks exercised a fresh ZIP install, environment-only startup, persisted records after restart and a real logical PostgreSQL restore. Actual Linux/server inventory, domain, reverse proxy, service management, monitoring and cutover still require validation on the authorized host (a separate future server — decided only after approval; never this laptop, never the personal VPS).
