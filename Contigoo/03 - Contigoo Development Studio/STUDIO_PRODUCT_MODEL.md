# Contigoo Studio — The product model

**Approved product identity:** Contigoo Studio — **Internal Management & Development Platform** (owner-approved 22 September 2026).

**Working direction:** an AI-assisted visual development **and management** platform. Manage clients and projects, build and publish applications, then return for daily use, updates, versions and lifecycle management. Creation is the beginning of the workflow, not its end.

**Authoritative audience correction, 22 September 2026:** this entire project is internal to the owner and later employees. The owner is the sole Super Admin and sole creator/developer. Employees receive delegated management access after completion. Clients are managed records, not Studio users; previous customer-admin/client-user assumptions are superseded. Login is username OR email OR phone plus password. See the private Notes Document for the consolidated requirements; no authentication backend/account exists yet.

**Generator/delivery clarification:** the internal system is an app generator. Each client receives the **generated application with its own login credentials**, not the Studio development/management interface. The client-login exclusion above applies only to Studio. Generated-app authentication and permissions are part of the deliverable and must be implemented separately from Studio owner/employee access.

### The core no-code delivery contract

1. Create a client project and optionally select reusable frameworks/modules.
2. Visually define entities/fields, compose pages/components and configure validation/workflows.
3. Configure the generated application's users, roles, branding and delivery settings.
4. Preview/test the same versioned model that will run in the delivered application.
5. Generate/provision a standalone application and hand over its URL/package and initial access.
6. Continue managing deployments, versions, data operations and upgrades from Studio.

Routine app creation must not require writing code or sending AI prompts. The platform engine and reviewed reusable extensions are developed once; visual configuration drives each application's runtime behavior. This is a requirement, not a capability already fulfilled by the current local preview/version-saving workflow. Initial production acceptance should demonstrate the full path from visual configuration to an independently usable, authenticated client application.

This short reference captures the owner's latest clarification. It takes precedence over the earlier industry-first starter interpretation. The detailed app catalog remains a menu, not an approved all-at-once scope.

## 1. Why “Restaurant relationships” appeared

The assistant turned the owner's restaurant example into a CRM-oriented configuration preset. It meant CRM + appointments + marketing with restaurant-style fields. That was an illustrative assistant-created preset, not a requested platform category. It should not define the new-project workflow.

**Correct starting point:** Projects & solutions → Create new project. Select a client and project name, then Start from scratch (default) or an optional CRM/ERP/Finance/etc. framework inside that same setup. Framework starters are not a separate primary navigation destination. Industry configurations can later be optional saved presets.

## 2. Consistent terminology

| Level | Meaning | Example |
|---|---|---|
| Studio | The owner's internal development environment within the management system | Explorer, canvas, components, properties, AI, preview, versions |
| Client profile | Managed business/contact record, independent of project and login account | Client X, contact details and related projects; no Studio access |
| Client project / solution | One client's selected capabilities and configuration | Client X's management system |
| Framework / capability family | Reusable domain foundation and related modules | CRM, Finance, Commerce; ERP assembles several families |
| App / module | A usable business capability with declared dependencies | Leads, quotations, stock, invoicing, requests |
| Component | A reusable visual or behavioral building block | Data grid, form, chart, page section, approval step |
| Properties / rules | Configuration that gives a component its behavior | Labels, bindings, validation, visibility, allowed actions |
| Starter template | Optional versioned initial selection/configuration | CRM starter; a saved client-independent app layout |
| Published version | A tested snapshot of the solution and its quote | Version 3 delivered to Client X |

**ERP is a suite composition**, not a second implementation of Finance/Inventory/HR. Shared modules and records should be reused, and selecting overlapping framework starters must not install or charge for the same module twice.

### Client-first navigation — owner correction, 22 September 2026

Clients and projects are different records. Creating a client must not require creating a solution. A client profile owns zero or more projects, and each project can deliver one custom app or a complete solution.

1. **Clients:** searchable business/contact management list; create, view, update and delete clients. Direct Edit/Delete actions appear in each row as well as the profile. Deletion lists related projects and requires explicit confirmation before removing their local demo data.
2. **Client profile:** business name, industry, contact, email, phone, address, notes and a related projects list.
3. **Projects & solutions:** the management hub and single project entry. Create new project, search/filter existing work, choose **Manage** or **Open in Studio**.
4. **Manage:** project details, apps and daily use, pricing, retained publications, archive/reactivate and deletion. **Open in Studio** enters the solution builder for apps, data/pages/rules, branding/access/pricing, preview and publication.
5. **App library:** explicitly select a working project before project-specific actions. Browse the catalog without silently editing a default project.

The v0.5 local prototype implements this navigation and independent project state. Fresh workspaces are empty; fictional historical clients exist only in excluded test fixtures. Existing saved data is preserved and managed explicitly. New publications retain configuration/quote history; older overwritten versions cannot be recovered. Archiving keeps data and blocks normal Studio entry until reactivated; it is not a remote service operation. Client-profile edits, project names and project branding are separate. These browser-local relationships are not production tenant/security boundaries; server enforcement remains future work.

## 3. What the creator should contain

| Studio area | Desired control |
|---|---|
| Project explorer | Frameworks, modules, entities, pages, components, assets, users, roles and versions |
| Component palette | Forms, grids, charts, navigation, content blocks, actions and domain-specific widgets |
| Design canvas | Compose pages, select components, arrange layouts and switch responsive previews |
| Properties inspector | Logo, text, style, data binding, validation, visibility, events and component settings |
| Data designer | Entities, relationships, types, constraints, queries and imports |
| Logic designer | Workflows, approvals, calculations, integration actions and business-state rules |
| Employee access management | Owner-controlled internal employee roles and assigned client/project/record access; enforced by the backend |
| AI copilot | Suggest or edit models/pages/rules, explain dependencies and propose test cases inside Studio |
| Test/preview workspace | Run generated apps, try roles, inspect errors and test workflows before publishing |
| Version/package manager | Drafts, diffs, reusable packages, migrations, upgrades and compatible rollback |
| Commercial panel | Live app/module selection pricing, overrides, recurring/setup separation and quote versions |

Visual editing is always available. AI accelerates work on the same underlying model; it should not produce an unrelated codebase for every client. Optional developer extensions add genuinely new platform capabilities.

## 4. AI operating model — proposed, not implemented

1. You select a project, page, component or entity and describe the desired change, or use visual tools directly.
2. AI reads the relevant schema/configuration and proposes a structured change to the shared project model.
3. Studio shows the proposed diff, dependencies, validation results and preview.
4. You apply or revise the change; automated checks exercise affected behavior.
5. The change becomes a versioned draft and follows the normal publication path.

Example: “Add a supplier lookup and require manager approval when purchase value exceeds the configured limit.” Both the resulting relationship and approval rule must remain editable in the visual tools.

**Implementation choices still open:** provider/model, authenticated server-side integration, cost limits, edit representation, context retrieval and extension strategy. Installing Codex does not itself connect AI to the product (and there is no VPS for Contigoo — local-only rule, 30 September 2026). No live AI capability is claimed for the local sample.

## 5. Official-platform review and design lessons

Research reviewed 21 September 2026. This is a focused reference review, not an exhaustive audit of every product/version or a claim of feature parity.

| Reference | What its official documentation establishes | Lesson for our own Studio |
|---|---|---|
| Dynamics 365 portfolio | Separate business products including Sales, Customer Service, Field Service, Finance, Supply Chain, HR, Commerce, Project Operations and Business Central | Model business domains/modules deliberately; a large suite is more than a generic CRUD builder |
| Power Apps model-driven apps + Dataverse | Tables/relationships plus forms, views, charts, dashboards, roles and solution packaging; model-driven layout differs from canvas-style layout control | Combine a metadata-driven runtime with deliberate layout/component editing and versioned solution packages |
| Copilot in Power Apps | Natural-language app/data-model assistance; feature availability and requirements vary | AI assistance belongs within the creator but must be defined by actual supported operations |
| Odoo Studio | Customize fields, views, models, automations, webhooks, reports, approvals and security; create apps from scratch | Make “edit this app/model” direct and keep workflows/reports/security configurable alongside data |
| Frappe Framework / DocTypes | Metadata describes both model and view; DocTypes generate tables and form/list experiences | Treat the data/app schema as a first-class project artifact, not merely decorative form settings |
| Retool classic and current builders | Classic: drag-and-drop components with queries/JavaScript. Current builder: AI generates React components/themes/functions connected to resources | Use an IDE-like composition and properties experience; explicitly choose metadata editing vs code generation rather than confusing them |

These references inform the design. No decision has been made to purchase them, copy their implementations, or base Contigoo on their codebases. They already offer substantial customization; a Contigoo advantage should be demonstrated through its specific client-delivery workflow and economics.

### Sources

- Dynamics 365: https://learn.microsoft.com/en-us/dynamics365/
- Power Apps model-driven design: https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/model-driven-app-overview
- Power Apps Copilot: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/ai-overview
- Odoo Studio 19: https://www.odoo.com/documentation/19.0/applications/studio.html
- Frappe DocTypes: https://docs.frappe.io/framework/user/en/basics/doctypes
- Retool classic apps: https://docs.retool.com/apps
- Retool AI app builder: https://docs.retool.com/build/apps

## 6. What this means for the sample and next work

**Implemented locally:** empty-first management overview; client CRUD; Projects & solutions with a single creation flow; optional in-flow framework selection; project management, app use, archive/reactivate, deletion and retained version previews; visual app editors, generic local runtime and pricing. Previous saved project data is preserved.

**Next substantial Studio milestone, to scope:** a unified project/component explorer + selectable canvas + properties inspector; explicit data bindings and security editing; then connected AI assistance working on that same model. Framework packages need real domain behavior in production, rather than just framework names on presets.

**Current boundary:** the sample is a browser-local prototype, with generic data/pages/rules and quotations. It is not yet a full IDE, live AI service, secure multi-user runtime or complete ERP implementation.

**Standalone delivery request, 22 September:** the owner requires independently usable application output, not only saved previews, and wants the backend/database developed locally before any future hosting decision (local-first rule, 30 September 2026). A standalone runtime/code package and automated database provisioning do not exist yet. Confirm the first output type and whether DB isolation is per deployed project, module or person. A separate project DB plus the internal Studio control DB is a recommendation awaiting approval. Users normally share their application's database under permissions; a personal DB is not technically mandatory for authentication. Current demo app prices do not define any real hosting/database/storage allowance.

### Shared data and mobile additions — 22 September 2026

The owner requested deleting Shared data entities and an explanation of entity/field concepts. Shared entities now have explicit Delete controls and field-impact confirmation. This operates on project-level preview metadata; app-specific schemas/records remain separate. Published snapshots are retained, and an empty shared model can be rebuilt by adding another entity.

The owner also requested a **Mobile app** option. The prototype catalog/starter now provides that selection, editable data/pages/rules and a working phone-sized browser preview. Native Android/iOS versus PWA delivery is not yet selected; no package generation, installation, app-store integration or mobile authentication is claimed. Preserve owner-controlled backend portability when planning its eventual delivery/runtime.
