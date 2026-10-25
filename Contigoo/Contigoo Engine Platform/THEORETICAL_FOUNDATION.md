# Contigoo Engine Platform — Theoretical Foundation

> Living document. Updated after every discussion. Captures all theoretical decisions, architecture concepts, and design rationale for the Engine Registry + Generic Architecture + SaaS App Store platform.

---

## Project Identity

| Field | Value |
|---|---|
| **Name** | Contigoo Engine Platform |
| **Core Concept** | Engine Registry + Generic Architecture → SaaS App Store |
| **Purpose** | Internal development platform to assemble, configure, and deliver client SaaS applications from reusable engines |
| **Audience** | You (Super Admin/Developer) + future Employees — Clients are managed records, not platform users |
| **Public-Facing Brand** | **Contigoo Eco Systems** (or **Contigoo Solutions**) — the platform website at contigoo.com |

---

## Vision: From Module List → Business Unit Eco System

### Current Contigoo.com (Reference)
**Five horizontal modules:** CRM, Bot, AI Creative, AI Ads, Social
- Industry-specific pricing (Restaurant CRM, Real Estate CRM, etc.) but same module structure
- Unified dashboard with all 5 modules
- AI Studio as cross-cutting feature

### Target: Contigoo Eco Systems / Solutions
**Vertical Business Units** — each a complete industry solution stack:

| Business Unit | Core Solutions (Engines) | Example Engines |
|---|---|---|
| **Restaurants** | CRM, CMS, Bot, POS, Reservations, Inventory | Restaurant CRM, Menu CMS, WhatsApp Bot, Table POS, Stock Engine |
| **Fashion** | CRM, CMS, E-commerce, Bot, Lookbook, Inventory | Fashion CRM, Catalog CMS, Storefront, WhatsApp Bot, Lookbook Engine, Stock Engine |
| **Gym & Fitness** | CRM, CMS, Booking, Bot, Membership, POS | Gym CRM, Content CMS, Class Booking, WhatsApp Bot, Membership Engine, POS |
| **Doctors & Hospitals** | CRM, CMS, Appointments, Bot, Patient Portal, Records | Clinic CRM, Health CMS, Appointment Engine, WhatsApp Bot, Patient Portal, Medical Records |
| **Real Estate** | CRM, CMS, Listings, Bot, Portal, Contracts | Real Estate CRM, Property CMS, Listings Engine, WhatsApp Bot, Client Portal, Contract Engine |
| **Automotive** | CRM, CMS, Inventory, Bot, Workshop, Leads | Auto CRM, Showroom CMS, Inventory Engine, WhatsApp Bot, Workshop Manager, Lead Engine |
| **Salons & Beauty** | CRM, CMS, Booking, Bot, POS, Inventory | Salon CRM, Service CMS, Booking Engine, WhatsApp Bot, POS, Product Inventory |
| **Schools & Academies** | CRM, CMS, LMS, Bot, Portal, Scheduling | School CRM, Content CMS, LMS Engine, WhatsApp Bot, Student Portal, Schedule Engine |

**Key Principle:** Each Business Unit = **Pre-composed Engine Template** (Engine Registry composition) with industry-specific configuration, branding, and defaults.

---

## Theoretical Pillars (to be expanded)

### 1. Engine Registry
*What is an "Engine"? How are they registered, versioned, discovered, composed?*

- [ ] **Engine Definition** — Fine-grained capability (e.g., "Lead Capture", "Appointment Booking", "Menu Management") not full domain
- [ ] **Engine Manifest** — `engine.json`: name, version, capabilities, dependencies, config schema, UI schema, pricing tier
- [ ] **Registration Protocol** — CLI/API to register, validate, publish engines to registry
- [ ] **Versioning & Compatibility** — SemVer + compatibility matrix (engine ↔ engine, engine ↔ platform)
- [ ] **Discovery & Resolution** — Query by capability, industry, dependency graph resolution
- [ ] **Engine Lifecycle** — dev → review → publish → deprecate → archive
- [ ] **Engine Categories** — Core (CRM, CMS, Bot), Industry-Specific (POS, LMS, Patient Portal), Cross-Cutting (AI Creative, Analytics)

### 2. Generic Architecture
*The meta-framework that all engines conform to*

- [ ] **Core Contracts** — Engine interface: `init(config)`, `routes()`, `models()`, `permissions()`, `uiSchema()`, `hooks()`
- [ ] **Configuration Schema** — JSON Schema per engine, versioned, migratable, supports overrides
- [ ] **Extension Points** — Lifecycle hooks, middleware, event bus, custom fields, custom actions
- [ ] **Isolation Boundaries** — Tenant isolation (shared engine code, isolated data/config), Engine sandboxing
- [ ] **Runtime Interpretation** — Engine configs interpreted at runtime (not compiled) for instant updates
- [ ] **Shared Primitives** — Auth, Tenancy, Files, Events, Audit, Notifications, Billing (platform-level, not engine-level)

### 3. Business Unit Template System
*Pre-composed industry solutions from engines*

- [ ] **Template Definition** — `business-unit.json`: name, industry, engine selections, default config, branding, pricing
- [ ] **Template Registry** — Versioned templates, inheritance (base template → industry specialization)
- [ ] **Instantiation** — One-click: select template → auto-provision engines → apply defaults → deploy
- [ ] **Customization Layer** — Client overrides on top of template (config, branding, custom engines)
- [ ] **Template Marketplace** — Internal (your catalog) + future external (partner templates)

### 4. SaaS App Store Architecture
*How engines become deliverable client applications*

- [ ] **App Definition** = Business Unit Template + Client Overrides + Branding + Entitlements
- [ ] **Provisioning Pipeline** — Template selection → Engine resolution → Config merge → Build → Deploy → DNS/SSL
- [ ] **Multi-Tenancy Model** — Shared engine codebase, per-tenant database (or schema), isolated config/branding
- [ ] **Update/Upgrade Strategy** — Engine version bump → Impact analysis per template → Staged rollout → Client notification
- [ ] **Billing/Entitlement** — Engine-level pricing + Template bundle pricing + Client subscription management

### 5. Studio Builder (Internal Tool)
*Your visual interface to assemble apps from engines*

- [ ] **Engine Explorer** — Browse registry by capability, industry, popularity; search/filter
- [ ] **Template Composer** — Drag/drop engines into business unit template; dependency auto-resolution
- [ ] **Configurator** — Per-engine generated UI from `uiSchema`; real-time preview
- [ ] **Business Unit Designer** — Create/edit industry templates; set defaults, pricing, branding packs
- [ ] **Preview Sandbox** — Run composed app in isolated tenant; test all engines together
- [ ] **Publisher** — Version template → Generate client app package → Deploy to staging → Promote to production

### 6. Public Platform Website (contigoo.com)
*Marketing & sales front-end for Contigoo Eco Systems*

- [ ] **Homepage** — Hero: "Contigoo Eco Systems" → Business Unit grid (Restaurants, Fashion, Gym, Clinics, etc.)
- [ ] **Business Unit Pages** — Each unit: overview, solutions grid (CRM, CMS, Bot, etc.), pricing, demo, testimonials
- [ ] **Solution Detail Pages** — Per engine within unit: features, screenshots, integration, pricing
- [ ] **Pricing Calculator** — Select unit → pick solutions → see bundle price → start trial
- [ ] **Two Purchase Paths** — **Path A: Self-Serve Trial/Subscribe** (instant signup, auto-provision) | **Path B: Contact Sales** (custom quote, managed setup, enterprise)
- [ ] **AI Studio Section** — Cross-cutting AI capabilities (Content, Images, Video, Voice, Ads)
- [ ] **Managed Services** — "Team alongside your tools" for each unit
- [ ] **Developer Hub** — API docs, engine SDK, template contribution guide

### 7. Admin Panel (Platform Management)
*Your control center — manage everything from one interface*

- [ ] **Dashboard** — Platform health, active clients, revenue, engine usage, trial conversions
- [ ] **Business Unit Manager** — CRUD business units, set display order, enable/disable, SEO
- [ ] **Engine Registry Manager** — View/register/version engines, validate manifests, set pricing tiers
- [ ] **Solution Builder (Visual Composer)** — **Core Feature**: Create business unit templates with clicks:
  - Drag/drop engines into template
  - Set template name, logo, industry, description
  - Configure engine defaults (config schema UI generated from manifest)
  - Define engine dependencies (auto-resolve + manual override)
  - Set pricing: per-engine, bundle, managed service tiers
  - Preview template → Publish to catalog
- [ ] **Client Management** — View all deployed apps, subscriptions, usage, support tickets
- [ ] **Subscription & Billing Manager** — Plans, invoices, payments (Stripe/Paymob/Tabby), trials, upgrades/downgrades
- [ ] **User & Access Manager** — Platform users (you, employees), roles, permissions, audit log
- [ ] **Content Manager** — Website copy, testimonials, case studies, pricing tables, FAQs
- [ ] **Deployment Manager** — View deployment status, logs, rollback, scale per client app

### 8. Solution Builder (Admin Panel Feature)
*Create complete industry solutions in minutes, not months*

- [ ] **Template Creation Wizard** — Step-by-step: Industry → Name/Logo → Engine Selection → Config Defaults → Pricing → Publish
- [ ] **Engine Dependency Graph** — Visual graph showing engine relationships, conflicts, required pairs
- [ ] **Config Default Editor** — Per-engine form (generated from `uiSchema`) with validation, preview
- [ ] **Branding Pack Manager** — Color palette, typography, logo variants, email templates per template
- [ ] **Pricing Rule Builder** — Base price + per-engine add-ons + volume discounts + managed service markup
- [ ] **Template Versioning** — SemVer, changelog, backward compatibility flags, deprecation schedule
- [ ] **One-Click Test Deploy** — Spin up sandbox tenant with template to verify end-to-end

### 9. Delivery & Operations
*Post-publish lifecycle*

- [ ] **Standalone App Package** — Engine bundle + config + migrations + assets + Docker/zip
- [ ] **Database Provisioning** — Per-app isolated DB (recommended) or shared with tenant isolation
- [ ] **Identity & Access** — Engine-provided roles + app overrides + platform SSO
- [ ] **Monitoring & Logs** — Per-deployed-app observability (health, usage, errors, costs)
- [ ] **Backup & Recovery** — Automated per-app backup, point-in-time restore, DR runbooks
- [ ] **Rollback** — Config rollback, engine version rollback, database migration rollback

---

## Discussion Log

| Date | Topic | Decision / Insight | Status |
|---|---|---|---|
| 2026-10-19 | Project naming | "Contigoo Engine Platform" — reflects Engine Registry as core | ✅ Decided |
| 2026-10-19 | Public brand | "Contigoo Eco Systems" or "Contigoo Solutions" for platform website | 🟡 Pending decision |
| 2026-10-19 | Architecture shift | From 5 horizontal modules → Vertical Business Units with composed engines | ✅ Decided |
| 2026-10-19 | Business Units identified | Restaurants, Fashion, Gym & Fitness, Doctors/Hospitals, Real Estate, Automotive, Salons, Schools | ✅ Decided |
| 2026-10-19 | Full platform scope | Public website + Admin panel + Solution Builder + Engine Registry + Provisioning + Billing | ✅ Decided |
| 2026-10-19 | Two purchase paths | Self-serve trial/subscribe + Contact sales/enterprise quote | ✅ Decided |
| 2026-10-19 | Admin Solution Builder | Visual composer to create templates with clicks (title, logo, engines, dependencies, pricing) | ✅ Decided |

---

## Open Questions (to resolve in discussion)

1. **Engine granularity** — Fine-grained (Lead Capture, Appointment Booking) vs coarse (CRM, CMS)? *Leaning fine-grained for max reusability.*
2. **Composition model** — Declared dependencies (engine manifest) vs free-form wiring in Studio? *Leaning declared deps for safety.*
3. **Configuration vs Code** — 80% config / 20% code extensions? Where's the line?
4. **Data isolation** — Separate database per deployed app (cleanest) vs shared with tenant_id (cost-effective)?
5. **Engine development** — You write core engines; employees write industry engines; partners later?
6. **App Store scope** — Internal catalog only (v1) or external marketplace (v2)?
7. **Genericity vs Specificity** — Platform = runtime + contracts + registry; Engines = all business logic.
8. **Migration strategy** — Engine upgrades: auto-patch compatible, notify breaking, client chooses when to upgrade.
9. **Public brand name** — "Contigoo Eco Systems" vs "Contigoo Solutions" vs "Contigoo Platform"?
10. **Pricing model** — Per-engine? Per-template bundle? Per-seat? Usage-based? (Current: industry-flat + module)
11. **Admin panel tech stack** — Extend existing Contigoo Studio prototype? Or new Next.js admin? (Prototype already has React + Express)
12. **Solution Builder UX** — Wizard vs free-form canvas? How much validation before publish?
13. **Provisioning automation** — Full auto-provision on trial signup? Manual approval gate for enterprise?
14. **Existing asset reuse** — Leverage `../03 - Contigoo Development Studio/` prototype, platform backend, database?

---

## Related References (from existing Contigoo work)

| Document | Relevance |
|---|---|
| `../03 - Contigoo Development Studio/CONTIGOO_APP_CATALOG.md` | 49 module candidates → potential engines |
| `../03 - Contigoo Development Studio/STUDIO_PRODUCT_MODEL.md` | Generator contract, internal vs client identity |
| `../03 - Contigoo Development Studio/CONTIGOO_QUICK_GUIDE.md` | S1–S6 milestones, workflow |
| `../03 - Contigoo Development Studio/PLATFORM_ARCHITECTURE.md` | Infrastructure discussions |
| `../03 - Contigoo Development Studio/PROJECT_CONTEXT.md` | Pause state, completed backend work |
| `../03 - Contigoo Development Studio/prototype/` | Browser-local prototype (React + Express) — **Admin panel foundation** |
| `../03 - Contigoo Development Studio/platform/` | NestJS backend, Better Auth, Neon PG — **Engine registry & provisioning backend** |
| `https://contigoo.com/` | Current visual design, copy, pricing to preserve/adapt |

---

## Next Discussion Topics (queue)

- [ ] **Engine Registry data model & API** — Manifest schema, registration flow, resolution algorithm
- [ ] **Generic Architecture core contracts** — Engine interface, config schema, event bus, shared primitives
- [ ] **Business Unit Template system** — Template manifest, inheritance, instantiation pipeline
- [ ] **SaaS provisioning pipeline design** — Template → engines → config → build → deploy → DNS
- [ ] **Admin Panel architecture** — Extend prototype vs new build; routes, auth, RBAC
- [ ] **Solution Builder UX design** — Wizard steps, drag/drop, config forms, preview, publish
- [ ] **Public website IA & components** — Homepage → Unit → Solution → Pricing → Trial/Sales flows
- [ ] **Subscription/Billing integration** — Stripe/Paymob/Tabby, trial logic, upgrade/downgrade, webhooks
- [ ] **Multi-tenancy & isolation strategy** — DB per app vs schema vs tenant_id; engine sandboxing
- [ ] **Engine development workflow** — Local dev → test → register → publish → version
- [ ] **Pricing & packaging model** — Engine pricing, template bundles, managed services tiers
- [ ] **Implementation phases** — What to build first for CEO demo? MVP scope?