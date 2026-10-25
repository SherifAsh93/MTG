# Contigoo Studio — QA execution report

Run: **2026-09-22T16-27-15-932Z** · Source: `7b1d376c2563b61fbd433a435c4e3cf25c14bd9c` · Initial working tree: clean.

## Summary

| Result | Count |
|---|---:|
| Additional QA cases executed | 144 |
| Passed | 136 |
| Failed | 8 |
| Deferred (not implemented / not run) | 33 |
| Existing regression cases passed | 48 / 48 |

- Environment: win32, Node v24.19.0, Edg/153.0.4234.48.
- Test cases: [QA_TEST_CASES.md](QA_TEST_CASES.md). Full reproducible evidence: [results.json](qa-tools/results/2026-09-22T16-27-15-932Z/results.json).
- Every browser case uses a fresh isolated context and synthetic local data. Real saved projects, accounts and credentials are not accessed.
- These results do not prove production authentication, server isolation, generated-app deployment or native mobile readiness.
- Existing regression evidence timestamp: 2026-09-22T15:49:53.251Z. Static evidence timestamp: 2026-09-22T15:49:25.811Z.

## Failed cases — investigation required

| ID | Severity | Scenario | Actual result | Evidence |
|---|---|---|---|---|
| B-LAYOUT-768x1024 | Medium | Operational layouts at 768×1024 | apps overflows: {"viewport":768,"document":781,"overflowing":[{"element":"BUTTON","className":"filter-pill ","right":781}]} | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-LAYOUT-768x1024.png) |
| B-STORAGE-client-create | High | Storage failure during client-create is not reported as persisted success | Misleading feedback after persistence failure: Client created. Add a project when you are ready. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-client-create.png) |
| B-STORAGE-project-create | High | Storage failure during project-create is not reported as persisted success | Misleading feedback after persistence failure: Project created. Choose apps or create your own. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-project-create.png) |
| B-STORAGE-record-save | High | Storage failure during record-save is not reported as persisted success | Misleading feedback after persistence failure: Demo record saved. Matching on-create rules were applied. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-record-save.png) |
| B-STORAGE-default-prices | High | Storage failure during default-prices is not reported as persisted success | Misleading feedback after persistence failure: Default prices saved. Existing project quotes are unchanged. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-default-prices.png) |
| B-STORAGE-MULTITAB | High | Two tabs must not silently overwrite each other | First tab's client was lost. Persisted names: QA Client Alpha, QA Client Beta, QA Tab Beta; feedback: Client created. Add a project when you are ready. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-MULTITAB.png) |
| B-STORAGE-CORRUPT | Medium | Structurally invalid saved state has a usable recovery path | No application or recovery UI rendered for malformed stored project. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-CORRUPT.png) |
| B-STORAGE-FUTURE | Medium | Unrecognized saved schema is not silently replaced | Unknown schema was replaced without visible recovery/version feedback. Raw legacy backup retained: true. | [Screenshot](qa-tools/results/2026-09-22T16-27-15-932Z/screenshots/B-STORAGE-FUTURE.png) |

## Full execution matrix

| ID | Area | Result | Scenario |
|---|---|---|---|
| M-START-01 | Startup | Passed | Empty first workspace and idempotent enhancement |
| M-MIGRATE-01 | Migration | Passed | Legacy records and publication survive upgrade |
| M-CLIENT-name-MAX | Clients | Passed | name: maximum accepted length |
| M-CLIENT-name-OVER | Clients | Passed | name: over-limit rejected atomically |
| M-CLIENT-industry-MAX | Clients | Passed | industry: maximum accepted length |
| M-CLIENT-industry-OVER | Clients | Passed | industry: over-limit rejected atomically |
| M-CLIENT-contact-MAX | Clients | Passed | contact: maximum accepted length |
| M-CLIENT-contact-OVER | Clients | Passed | contact: over-limit rejected atomically |
| M-CLIENT-email-MAX | Clients | Passed | email: maximum accepted length |
| M-CLIENT-email-OVER | Clients | Passed | email: over-limit rejected atomically |
| M-CLIENT-phone-MAX | Clients | Passed | phone: maximum accepted length |
| M-CLIENT-phone-OVER | Clients | Passed | phone: over-limit rejected atomically |
| M-CLIENT-address-MAX | Clients | Passed | address: maximum accepted length |
| M-CLIENT-address-OVER | Clients | Passed | address: over-limit rejected atomically |
| M-CLIENT-notes-MAX | Clients | Passed | notes: maximum accepted length |
| M-CLIENT-notes-OVER | Clients | Passed | notes: over-limit rejected atomically |
| M-CLIENT-EMPTY | Clients | Passed | Blank client name is rejected |
| M-CLIENT-SPACE | Clients | Passed | Blank client name is rejected |
| M-CLIENT-EMAIL | Clients | Passed | Invalid contact email does not mutate an existing client |
| M-CLIENT-DUP | Clients | Passed | Same client names retain distinct identities |
| M-CLIENT-DELETE | Clients | Passed | Client cascade requires consent and preserves other state |
| M-PROJECT-OWNER | Projects | Passed | Invalid project owner |
| M-PROJECT-NAME | Projects | Passed | Invalid project name |
| M-PROJECT-NAME-LONG | Projects | Passed | Invalid project name-long |
| M-PROJECT-DESC-LONG | Projects | Passed | Invalid project desc-long |
| M-PROJECT-STARTER | Projects | Passed | Invalid project starter |
| M-PROJECT-MAX | Projects | Passed | Maximum project name/description and independent branding |
| M-PROJECT-ARCHIVE | Projects | Passed | Archive/reactivate retains versions and records |
| M-PROJECT-DELETE | Projects | Passed | Delete one project without deleting its owner |
| M-SHARED-LIMITS | Shared data | Passed | Entity/field boundaries and duplicate validation |
| M-SHARED-DELETE | Shared data | Passed | Deleting all shared entities keeps app data and saved snapshots |
| M-STARTER-blank | Starters | Passed | Start from scratch: independent configuration |
| M-STARTER-crm-framework | Starters | Passed | CRM: independent configuration |
| M-STARTER-erp-framework | Starters | Passed | ERP / Business suite: independent configuration |
| M-STARTER-finance-framework | Starters | Passed | Finance: independent configuration |
| M-STARTER-inventory-framework | Starters | Passed | Inventory & Operations: independent configuration |
| M-STARTER-hr-framework | Starters | Passed | HR & People: independent configuration |
| M-STARTER-commerce-framework | Starters | Passed | Website & E-commerce: independent configuration |
| M-STARTER-service-framework | Starters | Passed | Service & Support: independent configuration |
| M-STARTER-workflow-framework | Starters | Passed | Custom workflows: independent configuration |
| M-STARTER-mobile-framework | Starters | Passed | Mobile app: independent configuration |
| M-CUSTOM-INVALID | App builder | Passed | Duplicate custom app and invalid pricing reject atomically |
| M-APP-ENTITY | App builder | Passed | New app entity creates independent fields/list |
| M-APP-FIELDS | App builder | Passed | Choice normalization and invalid schema references |
| M-APP-PAGES | App builder | Passed | All page types and invalid page definitions |
| M-APP-MOVE | App builder | Passed | Ordering stays stable at boundaries |
| M-RECORD-TEXT | Records | Passed | Text typed record value (TEXT) |
| M-RECORD-NUMBER | Records | Passed | Number typed record value (NUMBER) |
| M-RECORD-NUMBER-INVALID | Records | Passed | Number invalid value (NUMBER) |
| M-RECORD-NUMBER-ZERO | Records | Passed | Number typed record value (NUMBER-ZERO) |
| M-RECORD-NUMBER-ZERO-INVALID | Records | Passed | Number invalid value (NUMBER-ZERO) |
| M-RECORD-EMAIL | Records | Passed | Email typed record value (EMAIL) |
| M-RECORD-EMAIL-INVALID | Records | Passed | Email invalid value (EMAIL) |
| M-RECORD-DATE | Records | Passed | Date typed record value (DATE) |
| M-RECORD-DATE-INVALID | Records | Passed | Date invalid value (DATE) |
| M-RECORD-DATE-OVERFLOW | Records | Passed | Date typed record value (DATE-OVERFLOW) |
| M-RECORD-DATE-OVERFLOW-INVALID | Records | Passed | Date invalid value (DATE-OVERFLOW) |
| M-RECORD-CHOICE | Records | Passed | Choice typed record value (CHOICE) |
| M-RECORD-CHOICE-INVALID | Records | Passed | Choice invalid value (CHOICE) |
| M-RECORD-BOOL-TRUE | Records | Passed | Yes / No typed record value (BOOL-TRUE) |
| M-RECORD-BOOL-FALSE | Records | Passed | Yes / No typed record value (BOOL-FALSE) |
| M-RECORD-REQUIRED | Records | Passed | Missing and whitespace required values reject |
| M-RECORD-SCOPE | Records | Passed | Unknown input fields and disabled modules |
| M-RULES-ORDER | Workflows | Passed | Ordered conditional rules, disabled rules and edit semantics |
| M-RULES-INVALID | Workflows | Passed | Invalid rules are rejected before insertion |
| M-RULES-ATOMIC | Workflows | Passed | Rule failure does not partially create records/logs |
| M-TEMPLATE-REUSE | Templates | Passed | Saved template copies configuration but not records/prices |
| M-MONEY-ZERO | Pricing | Passed | Valid money 0 |
| M-MONEY-CENT | Pricing | Passed | Valid money 0.01 |
| M-MONEY-DECIMAL | Pricing | Passed | Valid money 123.45 |
| M-MONEY-MAX | Pricing | Passed | Valid money 9999999.99 |
| M-MONEY-NEGATIVE | Pricing | Passed | Reject unsupported money negative |
| M-MONEY-PRECISION | Pricing | Passed | Reject unsupported money precision |
| M-MONEY-EXPONENT | Pricing | Passed | Reject unsupported money exponent |
| M-MONEY-NAN | Pricing | Passed | Reject unsupported money nan |
| M-MONEY-INFINITY | Pricing | Passed | Reject unsupported money infinity |
| M-MONEY-EMPTY | Pricing | Passed | Reject unsupported money empty |
| M-MONEY-MAX-OVER | Pricing | Passed | Reject unsupported money max-over |
| M-QUOTE-DISCOUNT | Pricing | Passed | Zero/full discount and setup separation |
| M-QUOTE-SNAPSHOT | Pricing | Passed | Default/project/saved price independence |
| M-VERSIONS | Versions | Passed | Repeated versioning preserves earlier schema snapshots |
| B-NAV-01 | Navigation | Passed | Overview, navigation, branding and client/project searches |
| B-CLIENT-01 | Clients | Passed | Create/view/edit/cancel/delete a standalone client |
| B-CLIENT-02 | Clients | Passed | Client validation and safe text rendering |
| B-CLIENT-03 | Clients | Passed | Cascade deletion lists projects and respects cancellation |
| B-STARTER-blank | Starters | Passed | Create through Start from scratch |
| B-STARTER-crm-framework | Starters | Passed | Create through CRM |
| B-STARTER-erp-framework | Starters | Passed | Create through ERP / Business suite |
| B-STARTER-finance-framework | Starters | Passed | Create through Finance |
| B-STARTER-inventory-framework | Starters | Passed | Create through Inventory & Operations |
| B-STARTER-hr-framework | Starters | Passed | Create through HR & People |
| B-STARTER-commerce-framework | Starters | Passed | Create through Website & E-commerce |
| B-STARTER-service-framework | Starters | Passed | Create through Service & Support |
| B-STARTER-workflow-framework | Starters | Passed | Create through Custom workflows |
| B-STARTER-mobile-framework | Starters | Passed | Create through Mobile app |
| B-PROJECT-01 | Projects | Passed | New-project validation and nested client cancellation |
| B-PROJECT-02 | Projects | Passed | Project details, archive/reactivate and deletion |
| B-MODULE-crm | Built-in app runtime | Passed | CRM: select/edit/create/update/delete record |
| B-MODULE-inventory | Built-in app runtime | Passed | Inventory: select/edit/create/update/delete record |
| B-MODULE-commerce | Built-in app runtime | Passed | E-commerce: select/edit/create/update/delete record |
| B-MODULE-management | Built-in app runtime | Passed | Management: select/edit/create/update/delete record |
| B-MODULE-projects | Built-in app runtime | Passed | Projects: select/edit/create/update/delete record |
| B-MODULE-finance | Built-in app runtime | Passed | Finance: select/edit/create/update/delete record |
| B-MODULE-hr | Built-in app runtime | Passed | People & HR: select/edit/create/update/delete record |
| B-MODULE-helpdesk | Built-in app runtime | Passed | Helpdesk: select/edit/create/update/delete record |
| B-MODULE-appointments | Built-in app runtime | Passed | Appointments: select/edit/create/update/delete record |
| B-MODULE-website | Built-in app runtime | Passed | Website & CMS: select/edit/create/update/delete record |
| B-MODULE-marketing | Built-in app runtime | Passed | Marketing: select/edit/create/update/delete record |
| B-MODULE-analytics | Built-in app runtime | Passed | Analytics: select/edit/create/update/delete record |
| B-MODULE-mobile | Built-in app runtime | Passed | Mobile app: select/edit/create/update/delete record |
| B-CUSTOM-01 | Custom apps | Passed | Create custom app and reject duplicate name |
| B-SHARED-01 | Shared data | Passed | Create field types, delete a field/entity and recover an empty model |
| B-ENTITY-01 | App entities | Passed | Add/switch app entity and use its generated list |
| B-FIELDS-01 | App fields | Passed | Field add/rename/duplicate/order/required/visibility/delete controls |
| B-FIELDS-02 | App fields | Passed | Optional hidden values survive record editing |
| B-PAGES-01 | Pages | Passed | Add/edit/reorder/preview/delete pages and rename app |
| B-RULES-01 | Workflows | Passed | Conditional set/note rules, disable/delete and dependent field protection |
| B-RECORDS-01 | Records | Passed | Typed browser fields and native required/email validation |
| B-TEMPLATES-01 | Templates | Passed | Save reusable template and install in a fresh project |
| B-PRICING-01 | Pricing | Passed | Default price list vs existing projects and future selections |
| B-PRICING-02 | Pricing | Passed | App override, base amounts, discount, deselection and JSON export |
| B-BRAND-01 | Branding | Passed | Name/tagline/color/logo persist with safe rendering and per-project scope |
| B-LOGO-validJpeg | Branding | Passed | Accept image/jpeg upload |
| B-LOGO-validWebp | Branding | Passed | Accept image/webp upload |
| B-LOGO-invalidMime | Branding | Passed | Reject unsupported file type |
| B-LOGO-tooLarge | Branding | Passed | Reject over 1 MB |
| B-LOGO-corruptPng | Branding | Passed | Reject corrupt image bytes |
| B-VERSIONS-01 | Versions | Passed | Save/view versions, preview draft, reload and no-app validation |
| B-ACCESS-PREVIEW | Role preview | Passed | Administrator/Member/Viewer change only the displayed demo role |
| B-CONCEPT-PREVIEWS | Concept previews | Passed | Website/storefront navigation and Escape |
| B-LAYOUT-320x568 | Responsive layout | Passed | Operational layouts at 320×568 |
| B-LAYOUT-390x500 | Responsive layout | Passed | Operational layouts at 390×500 |
| B-LAYOUT-768x1024 | Responsive layout | Failed | Operational layouts at 768×1024 |
| B-LAYOUT-1024x664 | Responsive layout | Passed | Operational layouts at 1024×664 |
| B-LAYOUT-1440x900 | Responsive layout | Passed | Operational layouts at 1440×900 |
| B-STORAGE-client-create | Persistence failure | Failed | Storage failure during client-create is not reported as persisted success |
| B-STORAGE-project-create | Persistence failure | Failed | Storage failure during project-create is not reported as persisted success |
| B-STORAGE-record-save | Persistence failure | Failed | Storage failure during record-save is not reported as persisted success |
| B-STORAGE-default-prices | Persistence failure | Failed | Storage failure during default-prices is not reported as persisted success |
| B-STORAGE-VERSION | Persistence failure | Passed | Saved-version storage failure is atomic and explicit |
| B-STORAGE-MULTITAB | Persistence failure | Failed | Two tabs must not silently overwrite each other |
| B-STORAGE-CORRUPT | Recovery | Failed | Structurally invalid saved state has a usable recovery path |
| B-STORAGE-FUTURE | Recovery | Failed | Unrecognized saved schema is not silently replaced |
| B-STARTUP-STORAGE-DENIED | Recovery | Passed | Initial storage denial still renders the workspace |

## Deferred coverage

| ID | Status | Scenario | Reason |
|---|---|---|---|
| P-AUTH-01 | Not implemented | Sole owner bootstrap | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-02 | Not implemented | Username/email/phone login | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-03 | Not implemented | Invalid credentials and throttling | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-04 | Not implemented | Session lifecycle | Required implementation or delivery contract is absent; no pass claimed. |
| P-AUTH-05 | Not implemented | Recovery and identifier changes | Required implementation or delivery contract is absent; no pass claimed. |
| P-USERS-01 | Not implemented | Create/update/disable/delete employees | Required implementation or delivery contract is absent; no pass claimed. |
| P-USERS-02 | Not implemented | Privilege escalation and mass assignment | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-01 | Not implemented | Unassigned client/project access | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-02 | Not implemented | Studio versus generated-app identities | Required implementation or delivery contract is absent; no pass claimed. |
| P-ACCESS-03 | Not implemented | Client record creates no Studio account | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-01 | Not implemented | Real persistence and transactions | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-02 | Not implemented | Concurrent updates and scoped references | Required implementation or delivery contract is absent; no pass claimed. |
| P-DB-03 | Not implemented | Database provisioning policy | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-01 | Not implemented | Visual model to standalone web app | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-02 | Not implemented | Client credential handoff | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-03 | Not implemented | Upgrade and rollback | Required implementation or delivery contract is absent; no pass claimed. |
| P-GEN-04 | Not implemented | Reusable package privacy | Required implementation or delivery contract is absent; no pass claimed. |
| P-MOBILE-01 | Not implemented | Android/iOS build and installation | Required implementation or delivery contract is absent; no pass claimed. |
| P-MOBILE-02 | Not implemented | Installation, offline and sync | Required implementation or delivery contract is absent; no pass claimed. |
| P-FILES-01 | Not implemented | Server upload/download authorization | Required implementation or delivery contract is absent; no pass claimed. |
| P-AI-01 | Not implemented | Real structured edit provider | Required implementation or delivery contract is absent; no pass claimed. |
| P-DOMAIN-01 | Not implemented | Inventory/order invariants | Required implementation or delivery contract is absent; no pass claimed. |
| P-DOMAIN-02 | Not implemented | Finance/HR correctness | Required implementation or delivery contract is absent; no pass claimed. |
| P-BILLING-01 | Not implemented | Real payment/entitlement changes | Required implementation or delivery contract is absent; no pass claimed. |
| P-OPS-01 | Not implemented | HTTPS/restart/backup restoration | Required implementation or delivery contract is absent; no pass claimed. |
| P-OPS-02 | Not implemented | Operational evidence | Required implementation or delivery contract is absent; no pass claimed. |
| P-PERF-01 | Not implemented | Concurrent capacity and limits | Required implementation or delivery contract is absent; no pass claimed. |
| P-BUILDER-ENTITY | Not implemented | App-specific entity rename/delete | Required implementation or delivery contract is absent; no pass claimed. |
| P-BUILDER-RULE | Not implemented | Edit existing workflow | Required implementation or delivery contract is absent; no pass claimed. |
| P-TRANSFER-01 | Not implemented | Full workspace export/import | Required implementation or delivery contract is absent; no pass claimed. |
| P-CROSS-BROWSER | Not run | Firefox/Safari and physical iOS/Android | This pass uses installed Chromium-based Edge only; other engines/physical devices are unavailable. |
| P-ACCESSIBILITY | Not run | Assistive technology and full WCAG review | Automated viewport and limited keyboard checks are not a full accessibility certification. |
| P-L10N | Not implemented | Arabic/RTL and localization | Localized/RTL interface and locale requirements are not implemented/approved. |

## Reading the evidence

A failed case is a reproducible discrepancy for investigation, not a passed test with a warning. A deferred case was not executed against a working implementation. Regression checks can pass while newly explored edge cases fail. No finite suite covers every possible combination; the matrix makes the tested boundaries explicit.
