# Contigoo Studio — Infrastructure, database and access

Updated: 30 September 2026. **Status: first hosted Studio control-database foundation verified; backend/identity/frontend integration is still pending.** Neon Frankfurt PostgreSQL 17 has separate development/test DBs, two migrations and 23 passing hosted checks. The current interface remains a browser-local prototype. This document also describes the intended system, not deployed infrastructure.

> ### CORRECTION — 30 September 2026 (owner decision)
> There is **no "owner's VPS"** for Contigoo. Implementation is local on the personal laptop (`D:\Contigoo`); the personal VPS `76.13.42.219:3389` is WebistryDev-only; production will use a *separate* server and domain chosen after approval (never this laptop, never the personal VPS). Every "owner's VPS", "VPS migration" or "on the VPS" statement below is superseded historical planning text — read it as "the future approved server".

**Authoritative scope correction:** Contigoo Studio is exclusively an internal development and management system. The owner is the sole Super Admin and sole creator/developer; employees will be added after completion with delegated management permissions. Clients are managed records, not users. Earlier customer-admin, client-user, storefront-identity and customer-tenancy assumptions do not govern this Studio implementation. See the private `CONTIGOO_STUDIO_NOTES` deliverable for the consolidated notes and owner-account reference.

## 1. What is actually running now

| Area | Implemented today |
|---|---|
| Interface | Plain HTML, CSS and JavaScript ES modules: management screens, Studio editor and generated local app previews. |
| Local server | Node.js `prototype/server.mjs`, listening on `127.0.0.1:4173`. It serves an allowlisted set of static files; it has no application API. |
| Public presentation | GitHub Pages hosts verified v0.6 from commit `7b1d376`, including clearer Save demo version / View saved version actions, Shared data deletion and a Mobile app browser preview. No Vercel project is needed or configured for this presentation. |
| Storage | Browser `localStorage`, key `contigoo-studio-concept-v1`. Data belongs to that browser and origin; it is not shared between users or devices. |
| Database / API | Hosted PostgreSQL 17.11 now has separate Studio dev/test databases, five `studio` tables, a migration ledger, restricted roles, RLS and audit/revision triggers. Six tooling and 23 real DB checks pass. No application API/frontend connection or real login yet. The old local cluster remains stopped. |
| Users and access | No real accounts, passwords, login, invitations or permissions. The displayed administrator and Access roles are UI demonstrations. |
| Publication | Copies of project configuration/quotes in local storage, now with retained version history. It does not deploy a service. |
| Developer tools | Node/npm, Puppeteer Core and Edge for checks. PDF tooling is separate. These are not approval of a production stack. |

**Hosting these static files on a server would move the presentation, but would not create a database, authentication or a multi-user application.** The prototype is a reference for implementing the production management system and Studio.

### Hosting ownership and portability — confirmed by the owner

The entire intended system will be hosted on a *separate* future server under an owner-controlled subdomain (decided after approval — never this laptop, never the personal VPS), using the owner's resources. GitHub Pages and optional Vercel are presentation hosts, not required application services. Keep web/API/database/identity/jobs/files self-hostable; do not introduce mandatory Vercel Functions, hosted databases, Blob storage or similar vendor dependencies. Separately agree external integrations and independent backups.

The current demo has no Vercel runtime dependency: `npm run build` produces portable static `dist/` files with relative URLs and local brand/font assets. A reverse proxy/static web server can serve those files at the chosen subdomain once a future server is approved. The future backend services need their own implementation and deployment before the system becomes multi-user. Browser localStorage is origin-specific: moving from GitHub/Vercel to a new origin does not automatically transfer saved demo records. Any desired data transfer needs a deliberate validated export/import; that full-state import path is not implemented yet.

### Optional Vercel presentation import

Import `SherifAsh93/contigoo-studio-demo`, keep the repository root at its default (`./`, not a nested `prototype` directory), select framework **Other**, build command **`npm run build`**, output **`dist`**, and no environment variables. `vercel.json` already supplies the framework/build/output configuration. Share the stable **production domain** from the project, not a protected preview/deployment URL. Under Settings → Deployment Protection, Standard Protection leaves production domains public; All Deployments can require credentials. Verify public demo access in a signed-out/incognito browser. This does not change the real internal Studio's planned owner/employee authentication.

The owner has authorized future verified demo updates to be committed/pushed to the same GitHub repository. GitHub Pages deploys from `main`; a Vercel project connected to that branch can deploy the same pushes. Vercel project creation itself has not been performed in this session.

## 2. Recommended production stack

This working baseline reflects the owner's acceptance of the architecture direction. Exact versions, providers, resource sizing and deployment parameters still require validation against the future server. No services have been purchased or installed by these notes.

| Component | Recommendation | Responsibility |
|---|---|---|
| Web application | TypeScript + Next.js | Protected internal management and Studio interface for the owner and authorized employees. |
| API and business runtime | NestJS modular monolith | Validate requests and project metadata, enforce permissions/entitlements, operate reusable business modules, publish versions and audit changes. |
| Main database | PostgreSQL | Client records, projects, metadata, employee assignments, business records, pricing, versions and audit events. |
| Authentication | Keycloak using OpenID Connect | Internal identities, credentials, sessions and recovery. Username/email login plus a validated phone-login extension/flow; API authorization remains in Contigoo. |
| Jobs/cache | Redis + a NestJS worker | Queued email/import/automation jobs as those features are added. PostgreSQL remains the durable business source of truth. |
| Uploaded files | Server-managed persistent file/object storage | Logos, documents and media with scoped access; an S3-compatible interface may be self-hosted if needed. No managed cloud-storage dependency by default. |
| HTTPS/routing | Caddy reverse proxy | TLS certificates and routing to the web/API/identity services. Adapt to an existing approved proxy instead of replacing existing services blindly. |
| Service packaging | Docker Compose on the future approved server | Repeatable web, API, worker, database and identity service setup. No Kubernetes or per-customer code forks required initially. |
| Delivery | GitHub repository + CI | Build/test versioned images, deploy to staging and then the authorized production environment. The implementation repository still needs confirmation. |

Use pinned, supported releases when the implementation environment is approved. The static demo repository and documentation dependencies are not the production deployment specification.

## 3. How the services connect

```text
Owner / authorized employee browser
                 |
               HTTPS
                 |
        Server reverse proxy (Caddy)
          |                   |
          |             Identity service
          |             (Keycloak / OIDC)
          |
      Next.js web application
      - Protected internal management
      - Owner's Studio development tools
      - Assigned internal app usage
          |
      NestJS API / shared business runtime
          |              |                 |
      PostgreSQL       Redis             File service
          |              |                 |
      Audit/outbox     Worker       Server-managed file/object storage

      Encrypted off-server backup destination
```

The identity service uses a separate PostgreSQL database and database account from the business application. These can initially run on the same PostgreSQL server. Database/Redis services use internal networking, not public browser connections. A single-host first deployment shares a failure domain; it is not a high-availability cluster.

Hostnames such as `studio.<domain>` and `auth.<domain>` are illustrative. Confirm the real domain, DNS and existing proxy before configuring routes/certificates. Development/staging and production need separate credentials and data. Separately delivered client applications or marketing sites are outside the internal Studio access model and require their own scope.

## 4. What the database stores

The production model will use correctly named entities rather than copying the prototype's compatibility naming (`state.clients` currently stores projects).

| Data area | Proposed records and ownership |
|---|---|
| Client directory | `clients`: person/organization details, contacts and commercial relationship. A client record is not itself a login account. |
| Internal organization | One internal organization and a single designated owner identity. Client records do not provision customer organizations or accounts. |
| Projects | `projects`: client, name, description, lifecycle state and version references. One client can own several projects. |
| Users and assignments | Local profiles keyed by identity-provider issuer + subject; employee roles, permissions and client/project assignments. The owner is designated once. Passwords stay with the identity provider. |
| App catalog | Reusable module definitions, versions and dependencies. Selected project apps and purchased capabilities are separate from individual user permissions. |
| Studio configuration | Entity/field/page/workflow definitions and data bindings, stored as validated versioned metadata, with JSONB where appropriate. |
| Published solutions | Immutable `project_versions` containing configuration and quote references. A separate current-version pointer enables controlled activation. |
| Business data | Module-owned relational tables for customers, products, stock movements, orders and other approved domains. Generic custom records may use validated JSONB behind a server-side schema. |
| Pricing | Project price lines, currency, recurring/setup amounts in minor units, quote snapshots. The current illustrative EGP rates are not approved commercial prices. |
| Files | Client/project-scoped file metadata and object-storage keys, accessible only to authorized internal users. File bytes live in object storage. |
| Audit and jobs | Who changed which client/project/record, when and why; durable job/outbox state for retryable operations. |

Records include their client/project ownership where applicable. Enforce employee assignments and action/record permissions at the API, use scoped foreign keys/constraints, and consider PostgreSQL row-level security as defense in depth. Any RLS implementation needs an application role that cannot bypass it and transaction-scoped context tested under connection pooling. This is record separation inside one organization, not an assumption that each managed client has a customer tenant or login.

Core stock/accounting/payment invariants require domain-specific schemas and transactions, not an unrestricted generic JSON document store. The initial custom-data and relationship scope remains an S1 decision.

**Today, Studio editing does not provision databases or export independently running applications.** The intended reusable runtime should interpret versioned project configuration, without requiring a separate manually maintained code fork for each customer. The owner now explicitly requires standalone application output; its database isolation and packaging need confirmation before implementation. Configuration publication/rollback and restoration of business records remain separate operations.

### Standalone output and database development — latest request

The owner wants Studio to produce a **standalone project**, not only a browser-local preview. They explicitly confirm that each client receives the generated application with its own credentials, created through visual controls rather than routine coding or prompting. The exact first deliverable—an independently deployed web application, downloadable source/runtime package or native mobile build—still needs confirmation. A self-hostable runtime/configuration/API/migration package is a proposed web delivery design, not an implemented exporter. Generated applications and their users are separate from the owner's internal Studio and employee accounts.

Two access boundaries are required: **Studio owner/employees** manage/build/provision; **generated-app users** sign into their delivered application under that application's permissions. Provisioning must configure the app runtime, data schema/storage, initial app account/access and versioned configuration. Subsequent changes should use the same visual model and controlled migrations, preserving application records. Credential handoff/bootstrap must be implemented securely, not placed in exported frontend code or public templates. No generated accounts or provisioning pipeline exists yet.

**A VPS is not required to develop the backend/database first.** The owner confirmed on 23 September that the database must be **web-hosted for development**, with the complete app integrated and tested before any future hosting move. The existing local PostgreSQL service was stopped and must not be restarted for this work. Backend/frontend development can run separately from the hosted database; an online DB does not by itself host the API or make GitHub Pages authenticated. Repository/execution setup and data-isolation decisions still need agreement.

Neon Free is now the selected hosted development PostgreSQL service. Its [official pricing](https://neon.com/pricing), checked 23 September, lists 0.5 GB/project, 100 CU-hours/project and 5 GB/project public transfer, with idle suspension. This is a reasonable development starting point for a small text dataset, not confirmed full-project capacity or production hosting. Keep standard PostgreSQL connections and portable migrations; avoid required provider-specific auth/data APIs. Use the provider's TLS-verified endpoint from server-side code, never browser credentials. Later migration needs logical data transfer and verified restoration, not just changing a URL.

`database/README.md` describes the verified remote setup, restricted private configuration and migration/test commands. Neon authorization is complete; project `contigoo-studio-dev` exists in Frankfurt. `contigoo_studio_dev` and `contigoo_studio_test` isolate Studio development/test data, with four distinct migration/runtime roles. Two migrations implement internal identity references, clients, projects, assignments, audit and database-level access policies; no real identities are seeded. Six synthetic tooling checks and 23 hosted DB checks pass. The owner-approved PostgreSQL driver/Neon CLI are installed locally. This does not select generated-app per-project/app/person isolation or implement authentication/delivery.

The owner described a database for each “user / app.” Do not assume the granularity is settled or silently override an intentional isolation policy. Clarify these distinct choices:

| Boundary | Meaning / implication |
|---|---|
| Studio control database | Internal owner/employees, client directory, project registry, templates and provisioning metadata. |
| Database per deployed project/solution — recommendation pending approval | One independent project DB; its enabled modules use module-owned tables. That application's users share its database through authenticated/authorized APIs. |
| Database per app/module | Separate CRM/Inventory/etc. databases even within one solution; introduces cross-module API/event and transaction complexity. |
| Database per person | Each person's data is isolated physically; shared collaboration requires an additional design. This is a business-policy choice, not a technical requirement for login. |

One PostgreSQL server can host multiple databases with separate roles; a database does not automatically require a separate VPS/container/server. User accounts generally do not each need their own physical database. Independent application deployment may justify separate project databases, while maintaining one reusable codebase. Exact provisioning, migration, backups, credentials and access boundaries are not implemented yet.

### Storage and current demo prices

Storage needs depend on actual records, indexes, logs, attachments/media and backup retention. Database count adds overhead, but does not by itself establish a large storage requirement. Large files can be kept in project-scoped server-managed file/object storage, with metadata/references in PostgreSQL. Capacity must be estimated from real workloads and free space, not an assumed fixed allocation for every user.

**The EGP prices displayed in the prototype are illustrative inputs, not approved commercial offers. They do not provision a database or define an included hosting/storage allowance.** The Mobile app's initial zero price is also only a placeholder.

Before issuing real quotes, define one-time development/setup, any recurring application/support fee, hosting/database/file-storage/backups with explicit limits, and applicable overages. Running on the owner's future approved server uses owner-controlled disk/RAM/CPU and operational resources; selecting a module currently neither allocates those resources nor causes a real charge. Whether infrastructure is bundled into a rate or itemized is an unresolved commercial decision.

## 5. Authentication versus authorization

**Authentication:** who is this user? The identity service manages login, password handling, MFA and sessions.

**Authorization:** what may this internal user do, to which client/project/record? The Contigoo API checks the owner/employee identity, assigned scope, action permissions and applicable record/field policies on every operation.

### Confirmed ownership and initial access model

| Role | Intended scope |
|---|---|
| Sole Super Admin / creator / developer | One owner account. Controls platform administration, development, catalog, security, employee provisioning and publication. |
| Employee | Added by the owner after completion. Only assigned internal management actions, apps and client/project records; read-only or operational grants as configured. No automatic developer or elevated role. |

Client administrators, client staff and storefront customers have no Studio accounts in this scope. No public self-registration or client invitations. The employee permission matrix still needs definition; joining as an employee must not grant development/publication/security authority. Enforce one designated Super Admin at the service/data boundary; employee APIs cannot assign that role or replace the owner.

### Required login identifiers

- Username **or** email **or** phone number, plus the same account password. These resolve to one immutable user ID.
- Normalize username/email consistently and enforce uniqueness. Confirm the phone country and normalize to a unique international representation. Verify email/phone ownership before activation/change; choose the recovery and verification channels explicitly.
- Prevent ambiguous cross-identifier matches. Username rules and resolution precedence must be tested rather than guessing the account from an arbitrary string.
- Keycloak is the working identity baseline, but phone-number-plus-password login is **not assumed to be available by default**. Implement/test an appropriate authentication flow or reviewed extension before claiming support.
- Set the owner password through protected deployment bootstrap; do not put plaintext passwords in documents, source, seeds, environment examples or public bundles. The identity service stores a salted password hash. No owner account exists yet.

### Login and request flow

1. A protected page redirects the user to the identity service using OIDC authorization-code flow with PKCE.
2. The backend-for-frontend completes login and maintains a server-side session; the browser receives a secure, HttpOnly session cookie. Do not carry over prototype localStorage as token storage.
3. Server-side requests reach the API with authenticated identity. The API validates session/token context and resolves current owner/employee permissions and assignments itself.
4. The API checks the requested action and client/project/record scope before database changes or file access. A browser-supplied client/project ID is not proof of permission.
5. Sensitive state changes generate audit records. Workers use scoped job context and applicable authorization rules too.

Cookie-authenticated writes need CSRF protection. Logout, user suspension, role changes and session expiry must invalidate or constrain access appropriately. Hiding a button or selecting “Viewer” in the current sample is not authorization.

### Adding users later

Only the owner uses the system initially. The owner will add employees **after completion**, while identity/authorization are implemented in the first protected production slice. Employee provisioning, verification/recovery and notification delivery still need implementation/testing; no user invitations or verification messages are sent today. Creating client records never provisions accounts.

## 6. What runs on the future approved server and what must be managed

- **Initial deployment:** one approved separate server (chosen after approval) can host the web/API/worker, reverse proxy, Redis, PostgreSQL and identity service. Persistent databases/files must survive container replacement.
- **Sizing to validate:** roughly 4 vCPU, 8 GB RAM and 80+ GB SSD is a planning starting point for a small pilot with this service set, not a guaranteed minimum or production capacity promise. Actual services on the chosen server, user counts, uploads, reports and workload determine sizing.
- **Backups:** scheduled database and file backups to a separate off-server destination, with retention and restore tests. Browser migration backups are not server backups.
- **Operations:** service health, logs, error reporting, database/disk/CPU alerts, certificate renewal, dependency updates and rollbackable application releases.
- **Secrets:** deployment-managed environment/secret files with restricted access; not committed source, frontend bundles, demo fixtures or project metadata.
- **Version control:** reviewed application changes and database migrations, deployed through a defined workflow. Metadata publication is separate from code deployment.
- **Deletion/retention:** production archive, delete, retention and recovery rules need explicit design. The prototype's local hard-delete behavior is not automatically the production retention policy.

## 7. Practical transition from this sample

1. **Confirm the environment:** future server/hosting inventory, domain, repository/workflow, phone country/verification and the initial employee permission matrix.
2. **Build the authenticated foundation:** PostgreSQL migrations, owner bootstrap, three-identifier login, employee assignments, API validation, record isolation and auditing.
3. **Implement management first:** server-backed Clients/Projects CRUD, lifecycle and owner-controlled employee administration. Keep employees unprovisioned until onboarding is requested after completion.
4. **Connect Studio and runtime:** shared validated project metadata, app records, workflows, quotes and versioned publication through the API.
5. **Import selected prototype configuration if wanted:** use an explicit validated export/import process. Do not silently treat fictional test data or all browser storage as production data.
6. **Deploy to the authorized future server:** prove sole-owner authority, assigned-record access, no client login, persistence, retained publications and backup restoration. Onboard employees after completion under owner control.

The visual design and behavior can guide the implementation. The present browser-local storage and demonstration permission controls must be replaced by server-backed services.

## 8. Information needed from the owner

1. Future server **OS/version, vCPU, RAM and disk**, and whether it already hosts other applications.
2. Whether **Docker/Compose and a reverse proxy** are already installed, and the intended domain/subdomains.
3. Whether the next hosting step is **presentation hosting** or the **first real authenticated application slice**.
4. Whether execution is direct assistant implementation, Codex-led or mixed; the authorized implementation repository/environment and final stack versions/resources.
5. Employee management permissions, phone country/normalization, verification/recovery channels and the owner-bootstrap method. Owner identity references are kept only in the private Notes Document, not this architecture reference.

Credentials are not needed for this architecture discussion. Establish an approved access mechanism separately when deployment work is authorized.
