# Contigoo Platform — Start with the short guide

**Contigoo Studio — Internal Management & Development Platform**

## Start here

**Latest owner-approved scope:** an internal **Studio + Management System**. The owner is the sole Super Admin and sole creator/developer. Employees will be added after completion with assigned management access. Clients are records, not Studio users. Login will support username/email/phone plus password; it is not implemented yet.

**Private Notes Document:** [CONTIGOO_STUDIO_NOTES.pdf](CONTIGOO_STUDIO_NOTES.pdf) — four pages covering scope, owner/employee access, infrastructure/DB and delivery. [Editable Markdown](CONTIGOO_STUDIO_NOTES.md) · [Offline HTML](CONTIGOO_STUDIO_NOTES.html). These notes contain owner account identifiers and belong outside the public repository/site. The password is not recorded, and no account has been provisioned.

**Live manager-presentation demo:** https://sherifash93.github.io/contigoo-studio-demo/  
**Public source:** https://github.com/SherifAsh93/contigoo-studio-demo

The hosted demo is verified and runs independently of this computer. Each visitor has browser-local demo data; localhost projects do not automatically transfer. The public repository contains the standalone prototype, not this planning folder.

**See the interactive sample:** [Open Contigoo Studio locally](http://127.0.0.1:4173). If the server has stopped, run `npm start` from `prototype/`. See [prototype/README.md](prototype/README.md) for the demo walkthrough.

**Live and local (v0.6):** Shared data supports entity deletion; Mobile app offers a phone-sized browser preview. **Save demo version**, **View saved version** and **Preview draft** now distinguish saving a local snapshot from hosting a generated app. Standalone output, real database/authentication and native/PWA packaging remain to be implemented. GitHub Pages was verified from commit `7b1d376` on 22 September 2026.

**Sharing and eventual hosting:** use the GitHub Pages URL above now, or import the same repository into Vercel (framework Other, repository root `./`, build `npm run build`, output `dist`, no environment variables). Share its public production domain after deployment. The intended application remains self-hostable on a *separate* future server/subdomain of the owner's choosing — **talk/plan only, decided after approval; never this laptop, never the personal VPS `76.13.42.219` (WebistryDev-only)** — with owner-controlled web/API/database/identity/jobs/files and no required Vercel services. Private Notes and account details remain outside the public repository. Completed demo updates are published under the owner's standing instruction.

**Infrastructure and database:** the first hosted PostgreSQL foundation is now implemented in Neon Frankfurt: separate Studio development/test DBs, two migrations, restricted service roles and **23 passing hosted database checks**. In Neon select `contigoo_studio_dev` → schema `studio` to see the tables. See [database/README.md](database/README.md) for verified scope/commands and [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) for the intended stack. Backend APIs, real login, frontend DB integration and any future hosting decision remain pending.

**QA audit:** [Open the readable summary](QA_SUMMARY.html) · [Markdown summary](QA_SUMMARY.md) · [Defects](QA_DEFECTS.md). Recorded 22 September results: 48/48 regression checks passed; expanded audit 136/144 passed, with eight failures covering five open defects. Another 33 cases are deferred. Summary completed 23 September; production acceptance remains pending.

**Latest clarification:** Contigoo Studio is an **AI-assisted visual IDE**. Project creation now defaults to **Start from scratch**, with optional **Framework starters** (CRM, ERP, Finance, Inventory, HR, Commerce, Service and Workflows). Industry examples are not primary templates. See [STUDIO_PRODUCT_MODEL.md](STUDIO_PRODUCT_MODEL.md) for the hierarchy, proposed creator layout, AI behavior and official-platform research. AI is not connected in the sample.

1. Open **[CONTIGOO_QUICK_GUIDE.pdf](CONTIGOO_QUICK_GUIDE.pdf)** — the current **three-page** personal summary and working guideline.
2. Review **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** for confirmed requirements, proposals and decisions needed.
3. Edit **[CONTIGOO_QUICK_GUIDE.md](CONTIGOO_QUICK_GUIDE.md)** as the source of truth for the current guide.
4. Use **[TEST_EXECUTION_LEDGER.md](TEST_EXECUTION_LEDGER.md)** to record real application test results during implementation.
5. Browse **[CONTIGOO_APP_CATALOG.md](CONTIGOO_APP_CATALOG.md)** when selecting components/apps for a client or the next implementation milestone.

**Corrected direction:** build one internal platform the owner uses as sole administrator/developer to build apps, manage client/project records, operate configured tools and maintain versions. Employees receive only delegated management permissions. CRM is one capability, not the product identity.

The current scope is the protected internal system. Earlier public-site/client-experience ideas are separate delivery possibilities, not client access to Studio. Development is local-only on the owner's personal laptop (`D:\Contigoo`); hosting (a separate server + domain) remains talk/plan only. Repository and execution workflow remain to be confirmed.

The 34-page v0.1 document is now a **superseded technical reference**. Its CRM-led scope, phase order and dates are withdrawn. You do not need to read it to use the current guide. A local frontend prototype is available; the production application and any deployment are not implemented.

## Files

| File | Purpose |
|---|---|
| `prototype/` | Visual app builder, local record/workflow runtime, project pricing and website/client previews |
| `database/` | Hosted PostgreSQL dev/test control schema, migrations, restricted-role setup and executed database checks; private credentials excluded |
| `prototype/screenshots/` | Twenty sample screenshots, including shared entity management, mobile app preview, responsive dialogs and project lifecycle |
| `CONTIGOO_QUICK_GUIDE.pdf` | Current three-page guide: vision, client workflow, build steps/checks |
| `CONTIGOO_QUICK_GUIDE.md` / `.html` | Editable source / offline browser version |
| `CONTIGOO_STUDIO_NOTES.pdf` / `.md` / `.html` | Private four-page owner notes: internal scope, account reference, employees, hosting/DB and login requirements; no password |
| `CONTIGOO_APP_CATALOG.md` | Expandable components, 49 candidate apps/capabilities including Mobile app, and industry examples; not all initial scope |
| `CONTIGOO_PLATFORM_BLUEPRINT.pdf` / `.md` / `.html` | Superseded v0.1 technical reference; not the working roadmap |
| `PROJECT_CONTEXT.md` | Durable conversation and project context |
| `STUDIO_PRODUCT_MODEL.md` | Latest Studio/framework/module/component/AI model and official research sources |
| `PLATFORM_ARCHITECTURE.md` | Current infrastructure versus proposed future server stack, database model, authentication/authorization and rollout |
| `AGENTS.md` | Startup/context-update instructions for coding sessions |
| `TEST_EXECUTION_LEDGER.md` | Recorded prototype QA evidence; production Q1–Q6/N1–N6 and legacy ideas remain Not run |
| `QA_SUMMARY.html` / `.md` | Readable audit results, open defects and evidence links |
| `QA_TEST_CASES.md` / `QA_EXECUTION_REPORT.md` / `QA_DEFECTS.md` | Detailed cases, actual results and defect reproduction steps |
| `Contigoo Platform Notes.pdf` | Original reference, preserved |
| `document-tools/` | Renderer, styles, pinned dependencies, cached brand assets, verification and previews |

## Using the guide with Codex (local sessions)

Copy the quick guide's Markdown, context, ledger and agent instructions into the implementation repository. Ask Codex to read context and the short guide first, then use the starter instruction on page 3. Begin S1 by mapping the three client examples to app/template/solution contracts, then build the runtime and Studio together. All sessions run locally on the personal laptop; there is no VPS path (corrected 30 September 2026 — the personal VPS is WebistryDev-only).

Use one bounded work package per coding task. Record what was actually built and tested, then update context before the next session. Creating these files does not give an agent automatic memory unless it reads them.

## Regenerate the PDF

Prerequisites: Node.js 22.13 or later compatible with the pinned tools, npm, and an installed Chromium, Google Chrome, or Microsoft Edge browser. On this Windows machine the generator detects Edge automatically. On other machines set `PUPPETEER_EXECUTABLE_PATH` if needed. Browser sandboxing stays enabled; use an appropriate non-root user on Linux.

Run the following **from the `document-tools` directory**:

```sh
npm ci
npm run build
npm run verify
```

The lockfile pins the document dependencies. These are not approved dependencies for the future business platform. The first build downloads the Contigoo logo and Latin Inter/Fraunces font files from the URLs recorded in `assets/SOURCES.json`; subsequent builds use the local cache. The generated HTML/PDF embeds those assets and requires no network connection to read.

The default build/verification target the three-page quick guide. For the private Notes Document, use `npm run build -- --notes` and `npm run verify -- --notes`. For the superseded reference, use `npm run build -- --legacy` and `npm run verify -- --legacy`. Do not combine the two flags.

Markdown uses `<!-- pagebreak -->` for designed A4 pages. Builds fail on overflow. The quick-guide check expects three pages, sections 01–03 and checks Q1–Q6. Keep the owner's preference for concise documents when editing.

## Verification output

- `document-tools/quick-layout-report.json`: browser layout bounds for every quick-guide page.
- `document-tools/quick-validation-report.json`: PDF page count, A4 dimensions, text presence, acceptance IDs and SHA-256.
- `document-tools/quick-previews/contact-sheet.png`: rendered overview of all three pages.
- `document-tools/quick-previews/page-*.png`: full-page previews.
- `document-tools/notes-layout-report.json`, `notes-validation-report.json` and `notes-previews/`: private Notes validation and all four page renders; extracted text/renders also contain the owner identifiers.
- Unprefixed reports and `previews/` relate to the superseded v0.1 reference.

These checks validate **the document**, not the future platform's security or business behavior. The prototype has its own 48 passing catalog/model/browser checks in `prototype/validation-report.json`. Production acceptance Q1–Q6/N1–N6/T01–T48 remains **Not run**; no real login or owner account exists yet.
