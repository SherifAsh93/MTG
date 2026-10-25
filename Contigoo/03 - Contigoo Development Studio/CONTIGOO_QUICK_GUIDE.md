## 01 · What you are actually building

**Contigoo Studio: your internal development and management environment, operated by you and later by authorized employees.**

You are the sole Super Admin and the only creator/developer. Clients are records you manage, not Studio users. After completion, add employees with delegated management permissions. Build apps, manage projects and maintain published versions. AI should assist inside Studio; the current sample has no connected AI service.

### The platform has four parts

| Part | What it does |
|---|---|
| **1. Internal foundation** | Owner/employee login, assigned-project access, permissions, files, audit and persistent business data. |
| **2. Contigoo Studio** | Client/project management, visual editor, data/rules/security, AI assistance, app use, publishing and ongoing maintenance. |
| **3. Frameworks and modules** | Reusable domain capabilities, editable category starters and your own saved components/templates. |
| **4. Ongoing management** | Client records, projects, app usage, prices, versions, employees and lifecycle operations. |

### Work you manage — examples, not client access

| Client request | Solution you assemble |
|---|---|
| Restaurant wants CRM | Customer records + enquiries/follow-ups + restaurant-specific fields/forms + its logo and staff roles. |
| Company wants management + inventory | Requests/tasks/approvals + products/warehouses/stock + management dashboards and permissions. |
| Clothes shop or factory wants an online store | Branded storefront + sizes/colors/catalog + cart/checkout/orders + stock integration. Manufacturing is a separate capability if requested. |

### The key distinction

**Clients → Projects & solutions → Manage / Open in Studio.** Create project is the single entry: choose a client, then start blank or use an optional framework. Framework starters sit inside creation. ERP composes Finance/Inventory rather than duplicating them.

Build routine client solutions visually. AI can propose changes to the same editable model, with a diff and preview. Specialized stock/accounting/payment behavior comes from reusable domain engines; new engine capabilities can be added as extensions.

**Success:** create and manage different client solutions throughout their lifecycle from one maintained platform, without rebuilding or forking the foundation for each client.

<!-- pagebreak -->

## 02 · Your workflow for every client

### From request to a working solution

1. **Manage the client.** Create or update a person/organization and contact details. A client can have several projects.
2. **Create or open a project.** Use Projects & solutions. New projects start blank, with optional framework selection inside setup.
3. **Select sub-apps and capabilities.** Show dependencies and update the project price as modules are added or removed.
4. **Shape the business data.** Configure entities, relationships and fields such as branches, clothing sizes or approval limits.
5. **Build the experience.** Arrange components, forms, pages and navigation; edit properties and bindings. Use AI assistance when useful.
6. **Set behavior and access.** Define workflows, approvals, notifications, user roles and permitted records/fields.
7. **Configure internal access.** Assign employee permissions to management functions and projects; development remains yours.
8. **Preview, test and publish.** Test the journey and version the configuration/quote; separately scope any external delivery.
9. **Keep managing.** Open apps, review changes and publications, edit in Studio, publish updates, archive or reactivate projects.

### How reuse works

Save a useful configuration as a **versioned template without client data or secrets**. Another client gets its own solution instance and overrides. Publishing an update for one client must not change another client's configuration.

Maintain the shared platform centrally. Preview template/module upgrades against each client's customizations, resolve conflicts, then publish. Configuration rollback and database recovery are separate operations.

### Ownership and access

- **You:** sole Super Admin/developer; control development, security, employee accounts and publishing.
- **Employees:** internal management users you add after completion, restricted to assigned actions and records.
- **Clients:** managed records, not Studio accounts. Login is username, email or phone plus password for internal users only.

### Commercial records

Manage project quotes and selected app prices internally. Client delivery, licensing, hosting and source-code rights are separate commercial decisions, not permission to enter Studio.

**Working model:** one internal organization, shared codebase, scoped client/project data and versioned configuration. Hosting/DB/login details are in the private Notes Document.

<!-- pagebreak -->

## 03 · The short implementation guideline

**Build the foundation and Studio together, testing real client flows throughout.**

| Step | Build | Proof before moving on |
|---|---|---|
| **S1 · Model** | Framework, module, component, solution and version contracts. | Map different app categories to reusable capabilities. |
| **S2 · Runtime** | Owner login, employee permissions, app registry and configurable rendering. | Assigned project data is isolated; clients have no login. |
| **S3 · Studio** | Explorer, canvas, properties/data/rules/security; AI edit contract. | Visually configure two different solutions. |
| **S4 · Modules** | Framework modules and integrations selected during S1. | Their domain workflows and invariants pass. |
| **S5 · Operations** | Template reuse, upgrades, employee administration, files and integrations. | Manage ongoing projects without copying private data. |
| **S6 · Release** | Security, load, restore, monitoring and client acceptance. | Operate the explicitly selected release scope. |

Grow CRM, Finance, HR, Inventory, E-commerce and other frameworks through shared contracts, with explicit domain rules.

### Six essential acceptance checks

- **Q1 — Isolation:** an employee cannot read/change unassigned client/project records, files or configuration through UI, API or jobs.
- **Q2 — Builder:** a Studio-created field/form/workflow works in the client app and is validated by the server.
- **Q3 — Reuse:** create a second client from a template; changes, records and credentials stay separate.
- **Q4 — Upgrade:** publish an update while preserving client overrides; a failed update leaves the prior valid configuration usable.
- **Q5 — Access:** employees cannot become Super Admin/developers; creating a client grants no Studio account or login.
- **Q6 — Operations:** owner login by each identifier, employee access/revocation, backup restore and configuration recovery succeed.

### First Codex instruction

> Read PROJECT_CONTEXT.md and STUDIO_PRODUCT_MODEL.md. Propose the core + Studio model and a blank-first builder slice: framework/module selection, components/properties, data/security and an AI edit contract. Implement agreed tasks incrementally, demonstrate, test and update context.

**Schedule:** the old CRM-led dates are withdrawn. Estimate S2–S6 after S1 defines scope and weekly capacity. Work cycle: specify → implement → test → review → update context.
