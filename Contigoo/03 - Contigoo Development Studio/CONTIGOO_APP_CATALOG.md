# Contigoo Platform — Component and App Catalog

Version 0.2 · 22 September 2026  
Companion to the current three-page `CONTIGOO_QUICK_GUIDE.md`.

**22 September scope correction:** the current product is an internal Studio + Management System: one owner/Super Admin/developer and later employees. Clients are managed records, not users. The external websites/portals/customer-identity entries below are historical catalog candidates requiring separate scope; they are not approved Studio login roles or implementation requirements. Use the current guide/product model/private Notes Document when they differ from this catalog.

Latest interpretation: see `STUDIO_PRODUCT_MODEL.md`. **Studio → project → frameworks → modules → components/properties.** Default to a blank project; optional starters represent app categories. Industry solutions below are examples/presets, not the primary creation hierarchy or mandatory launch scope. AI assistance belongs inside Studio and works on the same editable model; it is not connected in the sample.

**The product:** a standalone Contigoo platform that you use as administrator/developer to assemble, customize, publish and operate different client solutions.

**How to use this catalog:** choose capabilities when a client needs them. This is an expandable product menu, not a commitment to implement everything in the first release. The `prototype/` demonstrates configuring 13 sample modules; their production business engines/native mobile delivery are not implemented. Technical boundaries and commercial packaging are proposed until accepted.

## One-minute map

| Layer | What it contains |
|---|---|
| Website and workspaces | Public Contigoo website, private Studio, client business systems, client websites/portals |
| Platform foundation | Identity, client isolation, access, shared data, files, events, billing and operations |
| Contigoo Studio | App selection, custom data/screens/workflows, templates, branding, preview/publish and developer extensions |
| Business app library | 49 candidates, including the owner-requested Mobile app delivery capability alongside the initial domain catalog |
| Industry solutions | Reusable combinations/configurations of those apps for restaurants, shops, companies, factories and other businesses |

**Your delivery loop:** create client → select template/apps → configure → brand → add users → test → publish → maintain.

## 1. Standalone website and user-facing areas

These areas belong to one product; they do not automatically require four repositories or servers.

| ID | Area | Contents |
|---|---|---|
| W01 | Public Contigoo Platform website | Home, platform explanation, app catalog, industry solutions, approved pricing/packages, demo/contact, signup/login, documentation and support entry |
| W02 | Contigoo Studio / platform administration | Client directory, solution builder, app/template library, platform configuration, provisioning, entitlements, operator reporting and operational controls |
| W03 | Client business workspace | That client's app launcher, branded dashboards, selected apps, user administration and delegated configuration |
| W04 | Client websites and external portals | Published corporate sites/storefronts and customer/supplier portals; approved public content and separate external-user access |

**Proposed routing:** public site at the chosen platform domain; Studio and workspace on protected routes or subdomains; client websites on verified subdomains/custom domains. Exact domains remain open. Hostnames identify a candidate client context but are never sufficient authorization by themselves.

The current `contigoo.com` website remains the visual reference. Its current implementation, app list and pricing are not assumed to be inherited.

## 2. Platform foundation — shared components

Build these once and expose them through contracts. They are usually included with app access, rather than sold as separate business apps.

| ID | Component | Responsibility |
|---|---|---|
| C01 | Client/workspace provisioning | Create, activate, suspend and manage isolated client workspaces |
| C02 | Identity and membership | Login, invitations, MFA integration, session lifecycle and workspace membership |
| C03 | Authorization | Platform/client roles, action permissions, record scope, field policies and service identities |
| C04 | App registry and entitlement enforcement | Installed modules, compatibility, declared dependencies and purchased capabilities |
| C05 | Shared business data | App-neutral parties/contacts, product references, addresses, currencies, units and stable identifiers |
| C06 | Metadata and configuration runtime | Interpret versioned entity/field/form/view definitions and enforce them on the server |
| C07 | Files and document generation | Private storage, authorized downloads, generated PDFs, attachments and media handling |
| C08 | Events and background jobs | Transactional outbox, retries, deduplication, scheduling and failed-job visibility |
| C09 | Workflow and rules runtime | Execute configured conditions/actions with tenant context, permissions and limits |
| C10 | Notifications and integration primitives | Email/SMS adapters, webhook delivery, scoped API credentials and connector contracts |
| C11 | Query/reporting services | Permission-aware filtering, search, aggregation, dashboards and import/export |
| C12 | Audit and change history | Actor/tenant attribution, configuration changes and sensitive-operation history |
| C13 | Contigoo commercial management | Your clients' plans, subscription/license records, provider reconciliation, seats and usage |
| C14 | Branding, locale and domain settings | Tenant themes, translations, timezone/currency conventions and verified domain associations |
| C15 | Backup and recovery | Database/files/configuration recovery, retention and restore verification |
| C16 | Delivery and observability | Environments, migrations, health checks, logs, metrics, alerts and version visibility |

**Ownership rule:** an app uses shared primitives without requiring another paid app merely to access contact or product basics. Domain-specific fields and invariants remain owned by their module.

## 3. Contigoo Studio — the builder you operate

Some tools start with simple configuration screens and become more visual later. A drag-and-drop designer is a UI option, not a prerequisite for a functioning metadata-driven builder.

| ID | Builder capability | What you can do |
|---|---|---|
| S01 | Client solution wizard | Start blank or from a template; select the client and intended solution |
| S02 | App/package composer | Enable apps, inspect dependencies, choose capabilities and assign a commercial package |
| S03 | Entity and relationship designer | Define client-specific objects and relationships, such as service requests or branches |
| S04 | Field and validation designer | Add supported data types, defaults, required fields and constraints |
| S05 | Form and record-page designer | Arrange sections, tabs, fields, related records and permitted actions |
| S06 | List/view and navigation designer | Configure columns, filters, menus, app groups and record navigation |
| S07 | Dashboard/report designer | Compose permitted metrics, charts, lists and export/report definitions |
| S08 | Workflow/approval designer | Configure triggers, conditions, tasks, approvals and approved integration actions |
| S09 | Role and access designer | Define customer roles and record/field policies; preview a user's effective access |
| S10 | Brand/theme designer | Logo, approved colors, typography options, company details and document branding |
| S11 | Website/storefront composer | Page sections, navigation, content and product presentation; private and public publishing boundaries |
| S12 | Template library and packaging | Save reusable app/configuration combinations without client records or secrets |
| S13 | Draft, preview and publication | Edit isolated drafts, validate dependencies, preview and publish an immutable version |
| S14 | Upgrade and compatibility management | Compare template/module versions, preserve client overrides, identify conflicts and restore compatible configuration |
| S15 | Data and integration setup | Map imports, configure connectors and credentials, and validate mappings per client |
| S16 | Developer extension toolkit | Register reviewed actions/components/domain modules, APIs and migrations with versioned contracts |

**Definition of a client solution:** selected module versions + template/configuration versions + client overrides + access rules + client-owned data and integrations. Platform updates should not silently overwrite its customizations.

## 4. Business app library — 49 candidates

These entries are potential module boundaries/capabilities, not necessarily 49 separately priced products. Related capabilities may share one package. A module's manifest declares hard dependencies and optional integrations before it is sold.

### A. Customer relationships and growth

| ID | App | Main capabilities |
|---|---|---|
| A01 | CRM | Leads, customer relationships, activities, pipelines and follow-ups |
| A02 | Sales | Quotations, price lists, discount approvals and sales orders |
| A03 | Marketing automation | Segments, campaigns, customer journeys and campaign reporting |
| A04 | Loyalty and referrals | Points, tiers, rewards, referral rules and redemption history |

### B. Customer service and appointments

| ID | App | Main capabilities |
|---|---|---|
| A05 | Helpdesk | Tickets, queues, ownership, priorities, service targets and resolution history |
| A06 | Field service | Work orders, technician scheduling, visits, parts use and service reports |
| A07 | Appointment scheduling | Availability, appointments, reminders, rescheduling and optional booking payments |
| A08 | Customer portal | Approved customer documents, orders, invoices, requests and account self-service |

### C. Internal management and collaboration

| ID | App | Main capabilities |
|---|---|---|
| A09 | Business requests and approvals | Configurable internal requests, approval queues, assignments and status tracking |
| A10 | Projects and tasks | Projects, milestones, boards, dependencies, assignments and progress |
| A11 | Timesheets | Time capture, approvals, project allocation and billable-time export |
| A12 | Document management | Controlled document libraries, versions, review, retention and record links |

### D. Websites and commerce

| ID | App | Main capabilities |
|---|---|---|
| A13 | Website/CMS | Corporate sites, landing pages, content, media, SEO metadata and publication |
| A14 | E-commerce | Catalog, variants, cart, checkout, orders, customer accounts and payment/shipping integration |
| A15 | Retail point of sale | Counter sales, barcode scanning, receipts, registers, cashier shifts and returns |
| A16 | B2B commerce | Company buyers, negotiated pricing, bulk ordering and buyer approval flows |

### E. Inventory and supply chain

| ID | App | Main capabilities |
|---|---|---|
| A17 | Inventory | Stock ledger, locations, receipts/issues, transfers, reservations and adjustments |
| A18 | Warehouse management | Bins, picking, packing, barcode workflows, cycle counts and replenishment |
| A19 | Procurement | Suppliers, requisitions, purchase orders, receiving and approval limits |
| A20 | Fulfillment and returns | Shipment preparation, carrier tracking, returns authorization and disposition |

### F. Finance

| ID | App | Main capabilities |
|---|---|---|
| A21 | Invoicing and collections | Invoices, credit notes, payment tracking, reminders and customer balances |
| A22 | Accounting | General ledger, receivables/payables, bank reconciliation, posting, period close and financial reports |
| A23 | Expenses and budgets | Expense claims, approvals, budget allocations and actual-versus-budget views |
| A24 | Fixed-asset accounting | Capitalization, depreciation, transfers, impairment/disposal where supported |

Invoicing can be sold before full accounting, with clear capability boundaries. Accounting and tax behavior require jurisdiction-specific scope and reviewed examples.

### G. People and HR

| ID | App | Main capabilities |
|---|---|---|
| A25 | HR core | Employee profiles, organization structure, employment documents and onboarding |
| A26 | Attendance and leave | Shifts, attendance, leave policies, balances and approval flows |
| A27 | Recruitment | Vacancies, candidates, interviews, offers and hiring workflows |
| A28 | Payroll | Supported-country salary calculations, benefits, deductions, payslips and exports |

Payroll is a separately scoped domain; HR directory/leave features alone do not provide payroll correctness.

### H. Manufacturing and maintenance

| ID | App | Main capabilities |
|---|---|---|
| A29 | Product engineering/BOM | Bills of materials, variants, revisions and production specifications |
| A30 | Production planning and execution | Material requirements, work orders, operations, consumption and finished goods |
| A31 | Quality management | Inspections, acceptance criteria, defects, nonconformance and corrective actions |
| A32 | Equipment maintenance | Equipment records, preventive schedules, work orders, downtime and spare parts |

### I. Communications and knowledge

| ID | App | Main capabilities |
|---|---|---|
| A33 | Omnichannel inbox | Supported email/WhatsApp/social conversations, routing, assignment and customer links |
| A34 | Bots and self-service automation | Published knowledge, guided conversations, bounded actions and human handoff |
| A35 | Social publishing | Content calendars, supported-channel scheduling, review and performance reporting |
| A36 | Knowledge and learning | Knowledge articles, internal courses, assignments and completion tracking |

Supported channels depend on provider APIs, permissions and delivery economics. Existing Contigoo website offerings are not automatically working modules in this new platform.

### J. Data and AI

| ID | App | Main capabilities |
|---|---|---|
| A37 | Advanced analytics/BI | Cross-module permitted metrics, dashboards, scheduled reports and drill-down |
| A38 | Forecasting and planning | Sales/demand forecasts, scenarios, targets and planning revisions |
| A39 | Document extraction | OCR/extraction, validation queues and mapping approved results into business records |
| A40 | AI assistants | Tenant-scoped assistance, summaries, permitted record search and explicitly authorized actions |

AI uses the same permissions as the actor; it does not bypass app access or autonomously turn generated values into financial postings. Deterministic workflows remain useful without AI.

### K. Recurring services and operational assets

| ID | App | Main capabilities |
|---|---|---|
| A41 | Recurring customer billing | Let a client sell recurring services, renewals and recurring invoices to its own customers |
| A42 | Membership management | Plans, member access, renewals, entitlements and attendance integrations |
| A43 | Fleet and transport | Vehicles, drivers, trips, dispatch, usage and maintenance links |
| A44 | Operational asset custody | IT/tools/equipment checkout, assigned custodians, returns and asset history |

A41 bills the **client's customers**. C13 bills **Contigoo's clients**. These are distinct accountabilities and ledgers. A44 tracks custody; A24 handles financial asset accounting; A32 handles maintenance work.

### L. Specialist commercial tools

| ID | App | Main capabilities |
|---|---|---|
| A45 | Contracts and e-signature | Contract workflows, templates, approvals and signing-provider integration |
| A46 | Resource booking/rental | Rooms/equipment availability, reservations, duration pricing, deposits and returns |
| A47 | Supplier portal | Purchase-order responses, supplier documents, delivery updates and invoice submission |
| A48 | Marketplace/channel connectors | Catalog, order and inventory synchronization with selected external marketplaces |

### M. Mobile application delivery — owner-requested option

| ID | Capability | Scope |
|---|---|---|
| A49 | Mobile app | Selectable app creation option. The prototype supports editable data/pages/rules and a phone-sized browser preview. Native Android/iOS versus PWA delivery, device features, offline support and packaging remain to be defined; no installation packages or app-store publishing are implemented. |

The prototype exposes Mobile app as its thirteenth module and an optional starter. It reuses the existing browser metadata/runtime and starts with an editable zero-price placeholder; this is not an approved commercial price. Selecting it is not a claim that production mobile delivery already exists. Client access to separately delivered apps does not imply access to internal Studio.

## 5. Industry solutions — assemble apps before creating new ones

Industry solutions are **templates/configuration packages** unless they introduce genuinely new domain behavior. Not every industry needs a different CRM, stock ledger or identity system.

All combinations below are illustrative. The owner's three examples demonstrate flexibility; they are not approved industry-first starters or mandatory first-release scope.

| Industry / solution | Example composition | Specialized additions when needed |
|---|---|---|
| Restaurant CRM — owner example | A01 + optional A07/A04 | Restaurant-specific fields and follow-ups; table/kitchen operations are separate scope |
| Company management + Inventory — owner example | A09 + A17 + optional A10/A19/A37 | Department approvals, branches, stock policies and management dashboards |
| Clothing shop/factory E-commerce — owner example | A13 + A14 + A17 + optional A20 | Sizes/colors, product media and returns; a factory webstore does not imply manufacturing software |
| Full factory management | A17 + A19 + A29–A32 + optional A22 | Production routes, material consumption, scrap and quality rules |
| Retail chain | A15 + A17 + A04 + optional A14 | Branches, tills, transfers and multichannel stock |
| Wholesale/distribution | A02 + A16 + A17 + A19 + A20 | Customer price lists, bulk orders and credit terms |
| Agency/professional services | A01 + A10 + A11 + A21 + A45 | Client projects, utilization, retainers and approvals |
| Construction/contracting | A10 + A19 + A17 + A23 + A32 | Sites, subcontractors, progress claims and specialized project costing |
| Property/real estate | A01 + A07 + A45 + optional A41 | Listings, viewings, leases and property/unit records |
| Salon/spa | A07 + A15 + A04 + optional A26 | Staff availability, service durations and product retail |
| Gym/club | A42 + A07 + A41 | Member plans, sessions and controlled access integration |
| Clinic administration | A07 + A21 + A12 | Appointment/admin workflows; clinical records and medical functionality need separate specialist scope |
| School/training center | A36 + A41 + A08 | Enrolment, schedules and attendance; student records/grades need scoped domain extensions |
| Hotel/hospitality | A46 + A21 + A08 | Rooms, availability and housekeeping; specialist property-management/channel behavior requires extension |
| Automotive/workshop | A01 + A06 + A17 + A21 | Vehicles, service history, repairs and spare parts |
| Logistics/delivery | A43 + A20 + A08 | Dispatch, route status, proof of delivery and customer tracking |
| Nonprofit/association | A01 + A42 + A21 + A37 | Donations, volunteers and restricted-fund requirements if applicable |
| Equipment rental | A46 + A44 + A32 + A21 | Availability, deposits, custody and damage/maintenance workflow |

## 6. What gets built first

Follow the current guide's S1–S6, adding detail only when a work package is ready.

| Milestone | Focus | Demonstration |
|---|---|---|
| S1 — Contracts and scope | Define W01–W04 routes, framework/module/component ownership, builder/AI edit contracts, stack and initial workflows | Different app categories map to reusable modules and configuration without per-client codebase forks |
| S2–S3 — Foundation + Studio | Minimum C01–C16 needed by the slice; basic S01–S16 progressively, not every advanced feature upfront | Create two clients, select different modules, change entities/forms/branding/roles, preview and publish isolated solutions |
| S4 — Initial business capabilities | Select bounded domain modules during S1; the existing CRM/operations/commerce examples are options, not a fixed release bundle | Chosen domain workflows and their data/security invariants pass |
| S5 — Repeatable delivery | Template reuse, upgrades, domain provisioning, entitlements, Contigoo billing and client onboarding | Deliver another client solution using existing modules/configuration and separate credentials/data |
| S6 — Production acceptance | Cross-client/access tests, module invariants, site/public-private boundaries, restore, load and UAT | Operate the explicitly promised client workflows and recover safely |
| Expansion | Add domain apps based on demand and reusable value | Every new app has a standalone contract, dependency declaration and integration tests |

**Do not measure progress by module count.** Measure whether Studio can produce a usable client solution, whether domain workflows are correct, and whether updates preserve isolation and customizations.

**Timeline:** scope and estimate the selected work packages after S1. This catalog's full breadth is a long-term product portfolio, not a first-release schedule.

## 7. App definition card — use before asking Codex to implement

```text
App ID/name:
Customer problem and primary workflow:
Included capabilities / explicitly deferred capabilities:
Owned entities and invariants:
Shared platform services:
Hard module dependencies / optional integrations:
Studio-configurable fields, screens, rules and actions:
Permissions and public/private exposure:
Events, API contracts, retries and concurrency:
Standalone-sale behavior:
Template and upgrade impact:
Acceptance examples and expected results:
Bounded first work package:
```

For templates, identify included apps, configuration versions, required secrets/mappings, allowed client overrides and migration policy. Package configuration only; provision client data separately.

## 8. Implementation responsibility and next handoff

The assistant can implement application code, tests, schemas/migrations, UI, build configuration and deployment tooling in the local workspace only (`D:\Contigoo`). There is no VPS or server work: the personal VPS `76.13.42.219` is WebistryDev-only, and Contigoo hosting is undecided (talk/plan only — a separate server and domain after approval). The owner remains the product/domain decision-maker and acceptance reviewer.

- **Direct implementation (the only current path):** use this session to build bounded milestones in the local repository on the owner's personal laptop.
- **Codex-led implementation:** use these documents and accepted work packages in a local Codex session on the same machine; bring changes/results back for review and planning.
- **Mixed workflow:** share one repository and decision/context records; hand off clearly and avoid simultaneous conflicting edits.

Before application setup, establish the chosen workflow and repository location, plus whether the proposed TypeScript/PostgreSQL stack is acceptable. Hosting, domain and deployment questions stay in planning until the owner approves a separate server and domain.

**First implementation target:** from a fresh installation, sign into Contigoo Studio, create two client workspaces, choose different app configurations, customize and publish them, and demonstrate that neither client can access the other's data or settings.
