# Implementation Plan: Inventory — the unit register

**Date**: 2026-10-01  
**Spec**: `specs/015-inventory/spec.md`  
**Status**: Draft  
**Linear**: BEN-150 (I0 BEN-151, I1 BEN-107, I2 BEN-108, I3 BEN-152, I4 BEN-153)

## Summary

`/inventory` renders an `InventoryPage` over a typed `InventorySource`. Its first implementation is seeded: one in-memory **unit register**, from which the Assets screen's per-office counts (spec 014) are also derived, so adding, editing or removing a unit moves the Assets figures the way the API would. Three panels sit on the shared `SidePanel`. `UnitFormPanel` covers Add Single Unit, Review/Edit and Remove Unit. `BulkAddPanel` covers Add Multiple Units. Both are driven by two pure tables: the status rules (which statuses a control offers, and which units may be removed) and the device fields (which fields a category carries). Nothing in the feature writes a count. The plan builds on PR #41's Assets code and starts with the constitution 9.0.0 amendment that spec D5 requires.

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 7  
**Primary Dependencies**: Existing shared UI (`PageHeader`, `Button`, `Search`, `Select`, `FilterChip`, `TableCard`, `TableHead`, `tableColumnStyle`, `tableMinWidth`, `Pagination`, `StatusPill`, `SidePanel`, `Notice`, `LoadingState`), `src/shared/validation.ts`, and PR #41's `AssetSource`, `CATEGORIES`, `fields.tsx` (`Field`, `TextInput`, `TextArea`, `FieldGroup`), `ImageField`, `useTableQuery`, `TableState`, `TablePager`. No new package.  
**Storage**: None in the SPA. The seeded register is module state and resets on reload.  
**Target Layer**: Frontend SPA only  
**Performance Goals**: One `list()` per visit, retry and save. Filtering is a single pass over a few hundred seeded rows.  
**Constraints**: Constitution 9.0.0, amended from 8.0.0 on this branch first (P18). No invented REST contract (VII). Nothing sets `Reserved` by hand (III). Unit secrets are Admin-only and never logged (VIII, IX). Admin-only route (II). No drive-by refactors (CLAUDE.md).

## Decisions

| # | Decision | Why |
|---|----------|-----|
| P1 | **Built on PR #41 (Assets, BEN-48), after it merges.** Execute starts only once #41 is merged into `dev` and this branch is rebased onto `dev`. It does not stack on #41's branch (project owner, 2026-10-01). Until then, only the spec, plan, tasks and the amendment (P18) land on this branch. No #41 file is copied here. | Inventory reads the Assets source for the catalog-item search (spec Relationship). It also reuses #41's category list, form fields, image uploader and table query. Copying them would fork the code. |
| P2 | **The first source is seeded.** `InventorySource` (P4) is implemented by `seeded-inventory-source.ts`, selected in `inventory-source.ts`. A contract-backed source is a later integration task, as it is for every SPA feature today (catalog, queue, history, assets). | The published contract cannot carry this screen yet. It has no assignee on read (G6), so `ASSIGNED` cannot render. It has no PR field (G5) and no upload (G7). Its reads expose secrets to the employee role (G3). The live Swagger returned `500` on 2026-10-01. Every gap is raised (P17), not bridged. |
| P3 | **One seeded unit register, read by Inventory and Assets.** `seeded-unit-register.ts` holds the units and seeds them from a per-asset table that reproduces PR #41's per-office counts exactly. Asset 1 (Dell Latitude 7440) still reads Available `[6, 3, 4, 2, 3]`, Reserved `[6, 2, 4, 2, 0]` and Assigned 3. #41's `seeded-asset-source.ts` stops storing `stock` and `assigned` and derives them from the register on every `list()`. The `Asset` type does not change. | Spec 001 US1 acceptance 2 and SC-001 need a unit added here to raise the asset's Available and Total. With two copies of stock, that cannot be true. The Assets screen shows the same numbers on day one. |
| P4 | **The source boundary.** `InventorySource { list(): Promise<UnitRow[]>; get(id): Promise<UnitDetail>; create(draft: UnitDraft): Promise<UnitDetail>; createBatch(draft: UnitBatchDraft): Promise<UnitRow[]>; update(id, draft: UnitDraft): Promise<UnitDetail>; remove(id, reason: string): Promise<void> }`. `list()` returns rows newest added first. A failure rejects with a `ValidationProblem` (400) or a problem body carrying `status` and `detail` (404, 409). | `get` is the only read that returns the secret fields, so the table holds no secret to render (FR-002, SC-006). The type enforces this, not a convention. `remove` takes the reason, so the seeded source keeps it and a contract-backed source drops it (spec D10, G2). |
| P5 | **Types.** These live in `inventory/types.ts`, except the status vocabulary, which goes in `src/shared/ui/status.ts`. **`UNIT_STATUSES`** = `Available` · `Reserved` · `Assigned` · `Inactive`. `UnitStatus`, with `AddStatus = 'Available' \| 'Assigned'` and `EditStatus = 'Available' \| 'Assigned' \| 'Inactive'`. **`UnitRow`**: `id`, `assetId`, `itemName`, `model?`, `category`, `pr?`, `serialNumber?`, `location` (`Office`), `status`, `assignee?` (`{ id, name, department? }`), `createdAt`. **`UnitDetail`** = `UnitRow` plus `price?`, `supplier?`, `purchasedAt?`, `bitlockerIdentifier?`, `recoveryPin?`, `description?`, `attachmentUrl?`. **`UnitDraft`** and **`UnitBatchDraft`** use the contract's field names wherever the contract has one (`assetId`, `location`, `price`, `supplier`, `purchasedAt`, `serialNumber`, `bitlockerIdentifier`, `recoveryPin`, `assignedToId`, `description`, `attachmentUrl`, `units[]`), plus the SPA-only `pr`, and `status`, which a contract-backed source sends only on `update` (on `create` it follows `assignedToId`). `UnitDraft.status` is optional: for a Reserved unit the draft omits `status`, `assignedToId` and `location`, and both sources leave them unchanged, so editing its other details can never release it (constitution III). | With matching names, a problem's pointer maps to a form field through `pointerToField` with no translation table, and `#/units/2/serialNumber` lands on row 3 (FR-011). `status.ts`'s stale comment, which calls unit states out of scope, is corrected here. |
| P6 | **Status rules, one pure module.** `unit-rules.ts`: `statusOptions('add')` returns Available and Assigned. `statusOptions('edit', unit)` returns Available, Assigned and Inactive, or `null` (read-only) for a Reserved unit. `withStatus(draft, s)` clears `assignedToId` for Available and Inactive. `withAssignee(draft, user)` sets Assigned. `removal(unit)` returns `allowed`, or a refusal message: the drawn assigned copy, or for a reserved unit *"This unit can’t be removed because it is reserved for a request."* (ours, P17). | FR-007, FR-008, FR-009 and SC-003/004 become one table the panels and the check both read. `Reserved` is not in either option type, so no control can offer it. |
| P7 | **Device fields, one data table.** `device-fields.ts`: `DEVICE_FIELDS: Record<Category, { serial: 'required' \| 'optional'; bitlocker: boolean }>`. Laptop is `required` with BitLocker. Mice and Other Devices are `optional` with no BitLocker. Every other category is `required` with no BitLocker. With no item chosen, only Serial is shown. `stripHidden(draft, category)` drops the BitLocker values before validation and before submit. | Spec D13, FR-011a: one table, as spec 014 D5 does for specifications. A hidden field is never sent. |
| P8 | **Validation, shared by the panels and the seeded source.** `unit-validation.ts`: `validateUnit(draft, category, today)` and `validateBatch(draft, category, today)` return messages keyed by field path. They cover required asset, location and status (except on a Reserved unit, whose draft carries neither, P5); a User for Assigned; serial by category; batch serials unique, 0 < rows ≤ 100; price ≥ 0 with ≤ 2 decimals; `purchasedAt` ≤ today; Supplier and device fields ≤ 255; Description ≤ 2,048; attachment `.jpeg`/`.png` ≤ 25 MB (the last through `ImageField`). The seeded source runs the same functions and refuses with a `ValidationProblem` whose pointers name the same paths. Serials already in the register are refused `409` with the contract's own text, *"Serial numbers already in use: X."*. An unknown id is refused `404` with *"Inventory item with ID 'X' could not be found."*. | Spec 014's pattern: the source refuses only what a client check missed. A valid draft is never refused `400` by the shared rules, so FR-011's server path is reached through the dev hook `refuseNext` (P16). The 409 and 404 messages are the backend's published strings, not ours. |
| P9 | **Table query: #41's hook, generalised in place.** `useTableQuery` gains its chip set, page-size options and starting page size as arguments: `useTableQuery(items, describe, { statuses, pageSizes, pageSize })`, and `TablePager` reads the options from the query. Assets passes `STOCK_STATUSES`, `[10, 25, 50]` and 10, so its behaviour is unchanged. Inventory passes `['Assigned', 'Available', 'Reserved']`, the Queue's `[10, 25, 50, 100]` and 50 (FR-005). A row whose status is not a chip (`Inactive`) counts under **All items** only. `TableState` is typed on `{ kind: 'loading' } \| { kind: 'failed' } \| { kind: 'loaded'; stale?: boolean }` instead of `AssetsState`, and takes its loading label and failed title as props; Assets passes today's *Loading stock* and *Stock could not be loaded*. Inventory gets its own `InventoryToolbar` (its copy and chips), composed from the same shared primitives. | FR-003 to FR-005 restate the Assets toolbar's rules. One hook keeps the two tables in step, and the change to #41's files is a signature change only. Search text is item name, model, PR and serial (FR-004). |
| P10 | **Page.** `InventoryPage.tsx` is laid out as `PageHeader` (title and subtitle from `DESTINATIONS.inventory`, unchanged: the drawn copy without its full stop, as every page subtitle reads), then `AddInventoryMenu`, `InventoryToolbar`, `TableCard`, `TableHead` and `TablePager`. The load state is `loading` · `failed` · `loaded`, through an `inventory-store.ts` hook (`useInventory()`) in the shape of #41's `useAssets()`, without its `console.error` (P19). Columns follow the `03 - Inventory` frame through `tableColumnStyle` / `tableMinWidth`: `MODEL` (item name), `CATEGORY`, `PR`, `SERIAL NUMBER`, `OFFICE`, `ASSIGNED` (name over department, or muted `Unassigned`), `STATUS` (`StatusPill unit`) and `ACTION` (**Review**, `aria-label="Review <item name> <serial or PR>"`). A missing PR or serial shows `NO_VALUE` from `src/features/requests/format.ts`. | Spec Story 1, FR-001 to FR-005, FR-015. The page opens no panel from the URL, so no unit id or secret reaches an address (FR-012). |
| P11 | **The Add Inventory menu.** `AddInventoryMenu.tsx` is a menu button: `Button` with a trailing `MdiChevronDown`, `aria-haspopup="menu"` and `aria-expanded`. Under it, a white card with `role="menu"` holds two `menuitem`s. Arrow keys move between the items. Esc and an outside click close the menu and return focus to the button. Choosing an item opens its panel, and focus returns to the button when that panel closes. | FR-006, FR-016. |
| P12 | **Panels.** **`UnitFormPanel.tsx`** (`mode: 'add' \| 'edit'`, 400px). In add mode it shows `CatalogItemPicker`, PURCHASE DETAILS (PR, Price with a `Php` prefix, Supplier, Purchased Date as `type="date"` with `max` = today), DEVICE DETAILS per P7, ASSIGNMENT (`UserPicker`, Office `Select` defaulting to Cebu, Status `Select` with placeholder *Select Status*) and NOTES (Description `TextArea`, Attachment `ImageField`). `ImageField` gains `label` and `filename` props (defaults `Image` and `asset-image`, so Assets is unchanged); its action names follow the label, so Inventory's read *Replace attachment*, *Download attachment* and *Remove attachment* (spec Story 3 7b). In edit mode the header is the item name plus its unit pill, the catalog item is not editable (no picker; `update` leaves `assetId` unchanged), every other field is prefilled from `get(id)`, a Reserved unit's Status, User and Office are read-only, and `RemoveUnitSection` is added. In removing mode the section shows `Reason for removal *` and the footer becomes **Cancel** / **Confirm Removal**. Cancel returns to edit mode. Confirm calls `remove(id, reason)` and discards unsaved edits. **`BulkAddPanel.tsx`** (650px) has the same picker, a `No. of Units` stepper (`−`, count, `+`) beside Office, the shared PURCHASE DETAILS and one row per unit. A row shows Serial, plus the BitLocker pair for a Laptop, and a ✕. Below the rows, **+ Add another unit**. It opens with one row; `−` drops the last row, a row's ✕ drops that row, `+` and **+ Add another unit** are disabled at 100 rows and Save is disabled at 0. Shared parts are in `unit-fields.tsx`: `CatalogItemPicker` and `UserPicker` (ARIA 1.2 comboboxes over `useAssets()` and the user directory; the picker shows the category eyebrow over the name with ✕), `SecretInput` (a `type="text"` input masked by CSS `-webkit-text-security: disc` until **Show** is pressed, never `type="password"`, so no browser offers to save it as a password (R3); Show/Hide toggle with `aria-pressed`, `autoComplete="off"`, `spellCheck={false}`; checked 2026-10-01 in Chrome 154, WebKit 26.6 (Safari's engine) and Firefox 155: all three compute `disc`, draw bullets until **Show** and plain text after, so no fallback is needed), `PurchaseFields` and `DeviceFields`. `SidePanel` gains a third width, `batch: 'max-w-[650px]'`. | Spec Stories 2 to 5. One form component for add and edit, as #41's `AssetFormPanel` does. Closing with unsaved edits discards them without a prompt, as the other panels do (spec edge case). A save refusal keeps the panel open with every value. **Concurrent removal:** when `get`, `update` or `remove` is refused `404`, the panel replaces its body with a `Notice` that carries the source's message and one **Close** action. Close (or ✕, Esc, scrim) closes the panel and reloads the list, so the row is gone. |
| P13 | **The register's reach is Inventory and Assets only.** The catalog's seeded stock (spec 005), the seeded request submit that reserves from it (spec 011) and Profile's assigned list (spec 006) keep their own data. A unit added here does not change the catalog's availability, and a seeded request does not reserve a register unit. Profile's *Currently Assigned* is not rendered in production (spec 006 FR-010). The spec's edge cases on Profile and the catalog describe the system against the API, where all of these read one register. | Rewiring three shipped seeded stores is outside spec 015 (constitution VIII). The API makes them one by construction. Accepted and documented (R2, Known Risks). |
| P14 | **The unit status pill.** `StatusPill` gains a `unit: UnitStatus` prop, drawn on the 8px chip as `inventory` is. The colours come from the `Inventory Status` component in the 2026-10-01 export: Available reuses the green tokens, Reserved the amber `low` tokens, Assigned the blue (`#235ea7` text on a 10% tint), and Inactive the slate (`#4b5063` on a 10% tint). Both colours are existing primitives, so the new tokens `--color-status-assigned-*` and `--color-status-inactive-*` in `src/styles/theme.css` alias them: `--color-osrs-blue-700` / `--color-osrs-blue-tint`, and `--color-osrs-ink-700` / `--color-osrs-ink-tint`. Inactive therefore looks the same as the request pill's Cancelled. The gallery shows all four. `In Storage` is not modelled (spec D1). | FR-002, spec D1. |
| P15 | **Route.** `src/app/routes.tsx` renders `guarded('inventory', <InventoryPage />)`. `InventoryPlaceholder` is the last export of `src/app/placeholders.tsx`, so the file and its import are deleted. `DESTINATIONS.inventory.roles` is already `['admin']`. | FR-001, Story 6. The existing guard and navigation already refuse the Employee. |
| P16 | **Users and dev reach.** `user-directory.ts` defines `UserDirectory { list(): Promise<DirectoryUser[]> }` with `DirectoryUser { id, name, email, department? }`. `seeded-user-directory.ts` holds about eight non-production users: the two sign-in users (`maya.santos`, `ethan.cruz`, same ids) plus others with departments, used as the assignees of the seeded Assigned units. They are listed in `specs/001-office-supplies-mvp/quickstart.md` as non-production placeholders (constitution IX). A contract-backed directory reads `GET /users` and leaves `department` unset (G6). On the dev server only, `?inventory=slow\|failing\|recovers\|empty` reaches the states the seed cannot (`dev/inventory-stub.ts`, behind `import.meta.env.DEV`, over a fresh seed, as `history-stub.ts` does). `window.__osrs.inventory` exposes `counts(assetId, office)`, `reserveBehind(unitId)`, `removeBehind(unitId)` and `refuseNext(problem)` for the check, so the concurrent-reservation and concurrent-removal edge cases, and a `400` problem with single-unit and per-row pointers (spec Story 2 7, Story 5 5), can be reached. `refuseNext` answers the next save with the given problem body once, as spec 011's `submitFixture` does. A save on a unit that became Reserved behind the panel is refused `409` with *"This unit was reserved by a request. Reload to see its current status."* (ours, seeded only, logged in `additions.md` by P17; the API's guard is G4). | FR-008 (every user, any role, any office), FR-015 and the edge cases. Dev reach is dropped from a production build. |
| P17 | **Records.** Add conflict **11, "Inventory: the unit register (raised 2026-10-01)"** to `specs/001-office-supplies-mvp/contracts/README.md` (10 is taken by the withdrawn custom-specification conflict), listing G1 to G9 as the spec words them (G9 includes the newest-first order), and naming no route, parameter or field. Under conflict 1, strike the 2026-09-26 request for a unit **tag** and point to conflict 11 G5 and G7. In `docs/design-system/additions.md`, log: masked secrets with Show/Hide (D6); the category-driven device fields (D13); the PR field (D14); the reserved-refusal copy (D9); the ✓ not built (Q6); Bulk opening at one row (Story 5 1a); the filled attachment on Review/Edit (Story 3 7b); the catalog-item and user result lists, which the file does not draw; and the seeded concurrent-reservation message (P16). | Constitution I and VII; FR-017, SC-008. |
| P18 | **Amendment first (spec D5).** Before any feature code: constitution **9.0.0** (MAJOR: III and VIII are redefined, as every earlier change to an existing principle was). Principle III adds *"An Admin MAY also clear an assignment, moving an `Assigned` unit to `Available` or `Inactive`, and MAY record an assignment on an `Inactive` unit."* (spec D4, D5) Principle VIII's "tag" becomes "purchase request number (PR)". The change lands in `AGENTS.md` and `specs/constitution.md`, with the version history. Also: ADR-0008 decisions 1 (tag becomes PR) and 3 (the clearing move), spec 001 FR-003 and Key Entities (tag becomes PR) and FR-003b (adds the clearing move), `specs/001-office-supplies-mvp/data-model.md` (the `tag` row becomes `pr`, "Purchase Request number"; the Unit **Rules** and the outside-a-request moves add `Assigned` → `Available` +n/+n, `Assigned` → `Inactive` and `Inactive` → `Assigned` with no count change), `docs/process-flow.md` (the manual-edit rule adds the clearing move and `Inactive` → `Assigned`, no count change) and `ARCHITECT.md` (the Inventory row's tag becomes PR; the unit-moves table and the manual-edit rule add the clearing move and `Inactive` → `Assigned`, no count change). Committed **on this branch as its own commit, before any Phase 1 code** (T007, spec Q1), and shipped in the feature PR (project owner, 2026-10-01). Reviewers see the governance change first and separately in the PR's history. | Constitution Governance: a redefined principle lands as an amendment, never as a silent edit. Without it, spec D4/D5 violates III. |
| P19 | **Checks.** `scripts/check-inventory.mjs`, wired into `scripts/verify.mjs` after `history`. It is created in the groundwork step with the Assets baseline and extended with each increment (tasks T007, T027, T035, T039). It covers: Admin-only (no nav item, `/inventory` refused for the Employee); the columns, with no secret in any cell; chips, counts, search by item name, model, PR and serial, category, pagination and page-1 reset; newest first. The menu: keyboard, Esc, outside click. Add Single Unit: Status options exactly Available and Assigned; picking a User sets Assigned; field errors; a `400` problem through `refuseNext` landing under the pointed field; a 409 serial conflict. Review/Edit per status: the options of P6; Reserved read-only, with its other details still saveable; unassign, assign, inactivate and reactivate moving `__osrs.inventory.counts` by ±1; Assigned → Inactive and Inactive → Assigned moving nothing; an office move; a seeded serial-less Monitor that cannot be saved until Serial is filled (spec Story 3 7a). The User field finds an Employee and an Admin by name and by email. Masked secrets on a Laptop, and none for other categories. Removal allowed only for Available and Inactive, refused with the copy for Assigned and Reserved, and requiring a reason. Bulk: opens at 1, stepper and rows in step, 0 and 100 bounds, a duplicate serial and an invalid row create nothing (SC-005), a `400` problem through `refuseNext` pointing at `#/units/2/serialNumber` lands under row 3, a serial already in the register shows the `409` message and creates nothing, a valid batch of 3 at Cebu raises Available by 3 (SC-001), category switch keeps serials and drops BitLocker values. The stub modes, concurrent reservation and concurrent removal. Assets' `AVAILABLE UNITS` following an Inventory add. No console call in `src/features/inventory/`. **Secrets (R3):** no `input[type="password"]` anywhere in the feature; the page console is captured through every panel flow, and no seeded BitLocker Identifier or Recovery Key/PIN value appears in it, in `location.href`, or in the table's DOM. No page-level overflow at 360px and 1440px. Focus returns to the opener. | BEN-153 (I4); SC-001 to SC-008. |

## Data Model

No backend schema in this repo. SPA types (P5) against the spec's entities and the published contract:

| Spec entity | SPA type | Contract (`/inventory-items`, 2026-10-01) |
|-------------|----------|---------------------------------------------|
| **Unit**: asset, office, status, PR, serial, assignee | `UnitRow` | `asset {id, name, model, category}`, `location`, `status`, `serialNumber`, `createdAt`. No PR (G5), no assignee on read (G6) |
| Unit purchase, device and notes details | `UnitDetail` | `price`, `supplier`, `purchasedAt`, `bitlockerIdentifier`, `recoveryPin`, `description`, `attachmentUrl` (G7) |
| **Unit batch** | `UnitBatchDraft` | `POST /inventory-items/bulk`: `assetId`, `location`, `price`, `supplier`, `purchasedAt`, `units[1..100]` of `{serialNumber, bitlockerIdentifier, recoveryPin}`. No PR (G5) |
| **Inventory query**: search, category, chip, page | `useTableQuery` state, applied in the browser | `page`, `limit`, `search` (name, model, category only), `category`, `status`. No status counts, ordered by id ascending (G9) |
| **Assignable user** | `DirectoryUser` | `GET /users`: `firstName`, `lastName`, `email`, `role`, `location`. No department (G6) |
| Per-(asset, office) counts | derived: `Asset.stock` and `Asset.assigned` from the register (P3) | Not published per asset (spec 014 conflict) |

Seeded register entry (`StoredUnit`, internal to the register): `UnitDetail` minus the asset projection, plus the removal log `{ id, reason, at }` for P4. The asset's name, model and category are joined at read time from the Assets source, so an asset renamed on Assets is renamed here.

## API Contracts

None is consumed in this increment (P2). The SPA proposes no route, parameter or field. What a contract-backed source would map, once G3 to G7 are answered:

| Source method | Published operation | Not carried today |
|---------------|---------------------|-------------------|
| `list()` | `GET /inventory-items` (paged) | PR, assignee, newest-first order, PR/serial search, status counts |
| `get(id)` | `GET /inventory-items/{id}` | PR, assignee |
| `create(draft)` | `POST /inventory-items` (Assigned when `assignedToId` is given, else Available) | `pr`. `status` is derived from `assignedToId` and not sent. The attachment, until an upload operation is published (G7) |
| `createBatch(draft)` | `POST /inventory-items/bulk` | `pr` |
| `update(id, draft)` | `PATCH /inventory-items/{id}` (`assignedToId: null` returns it to Available; `status` for Inactive) | `pr`. The attachment (G7). The API's own guard against Reserved (G4) |
| `remove(id, reason)` | `DELETE /inventory-items/{id}` | `reason` (G2). The API's own guard against Assigned and Reserved (G1) |

Errors: `400` validation problem (RFC 9457, `errors[].pointer`), `404` not found, `409` serial conflict, as published. Auth: Admin bearer on every call (constitution IX).

## Component / Module Breakdown

| File | Change |
|------|--------|
| `src/features/inventory/InventoryPage.tsx` | **New.** Page, load state, table, open-panel state (P10) |
| `src/features/inventory/AddInventoryMenu.tsx` | **New.** Menu button (P11) |
| `src/features/inventory/InventoryToolbar.tsx` | **New.** Search, category, status chips (P9) |
| `src/features/inventory/UnitFormPanel.tsx` | **New.** Add, Review/Edit, Remove (P12) |
| `src/features/inventory/BulkAddPanel.tsx` | **New.** Add Multiple Units (P12) |
| `src/features/inventory/unit-fields.tsx` | **New.** `CatalogItemPicker`, `UserPicker`, `SecretInput`, `PurchaseFields`, `DeviceFields`, `RemoveUnitSection` (P12) |
| `src/features/inventory/types.ts` | **New.** (P5) |
| `src/features/inventory/unit-rules.ts` | **New.** (P6) |
| `src/features/inventory/device-fields.ts` | **New.** (P7) |
| `src/features/inventory/unit-validation.ts` | **New.** (P8) |
| `src/features/inventory/format.ts` | **New.** `formatPeso` (`Php 80,000.00`, FR-013) |
| `src/features/inventory/inventory-source.ts` | **New.** `InventorySource`, `inventorySource(search)` (P2, P4, P16) |
| `src/features/inventory/inventory-store.ts` | **New.** `useInventory()` (P10) |
| `src/features/inventory/seeded-inventory-source.ts` | **New.** (P2, P8) |
| `src/features/inventory/seeded-unit-register.ts` | **New.** Units, seed table, `stockFor`, `assignedFor`, dev hooks (P3, P16) |
| `src/features/inventory/user-directory.ts`, `seeded-user-directory.ts` | **New.** (P16) |
| `src/features/inventory/dev/inventory-stub.ts` | **New.** Dev-only modes (P16) |
| `src/features/assets/seeded-asset-source.ts` | Derives `stock` and `assigned` from the register (P3) |
| `src/features/assets/useTableQuery.ts`, `TableToolbar.tsx` (`TableState`, `TablePager`) | Chip set and page size as arguments; `TableState` on a generic load state; Assets unchanged (P9) |
| `src/features/assets/AssetsPage.tsx` | Passes its chips, page sizes and state copy (P9) |
| `src/features/assets/ImageField.tsx` | `label` and `filename` props; Assets unchanged (P12) |
| `src/shared/ui/status.ts` | `UNIT_STATUSES`, `UnitStatus`; stale comment corrected (P5) |
| `src/shared/ui/data-display/StatusPill.tsx`, `src/styles/theme.css`, `src/shared/ui/gallery/Gallery.tsx` | `unit` prop, two new tones, gallery entry (P14) |
| `src/shared/ui/overlay/SidePanel.tsx` | `batch` width, 650px (P12) |
| `src/app/routes.tsx`, `src/app/placeholders.tsx` | Route; placeholder file deleted (P15) |
| `scripts/check-inventory.mjs`, `scripts/verify.mjs` | (P19); `verify.mjs` also gains `check-assets.mjs` (Build Order 1) |
| `specs/001-office-supplies-mvp/quickstart.md` | Seeded directory users (P16) |
| `specs/001-office-supplies-mvp/contracts/README.md`, `docs/design-system/additions.md` | (P17) |
| `AGENTS.md`, `specs/constitution.md`, `docs/adr/0008-per-unit-inventory-register.md`, `specs/001-office-supplies-mvp/spec.md`, `specs/001-office-supplies-mvp/data-model.md`, `docs/process-flow.md`, `ARCHITECT.md` | Amendment 9.0.0 (P18) |

## Project Structure

```
src/features/inventory/
├── InventoryPage.tsx
├── AddInventoryMenu.tsx
├── InventoryToolbar.tsx
├── UnitFormPanel.tsx
├── BulkAddPanel.tsx
├── unit-fields.tsx
├── types.ts
├── unit-rules.ts
├── device-fields.ts
├── unit-validation.ts
├── format.ts
├── inventory-source.ts
├── inventory-store.ts
├── seeded-inventory-source.ts
├── seeded-unit-register.ts
├── user-directory.ts
├── seeded-user-directory.ts
└── dev/inventory-stub.ts
src/features/assets/          # PR #41: seeded source, table hook changed
src/shared/ui/                # status vocabulary, pill, panel width
scripts/check-inventory.mjs
```

## Dependencies

- No new package.
- **PR #41** (BEN-48, Assets) merged into `dev` (P1). Done 2026-10-01 (`660b84d`); this branch is rebased onto it, and P3 and P9 hold against the merged code.
- Backend, not blocking the build: contracts conflict 11, G1 to G9 (P17).
- Governance: the 9.0.0 amendment (P18), its own commit on this branch before any Phase 1 code (T007), in the same PR.

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Implements spec 015. Undrawn parts are logged (P17). The design deltas are in drift-2026-10-01 (PR #41) |
| II. Two Human Roles | PASS | Admin-only through the existing guard (P15), checked (P19) |
| III. Inventory Integrity | PASS (9.0.0) | No control offers `Reserved` (P6). Counts are derived, never written (P3, FR-014). Removal is refused for Assigned and Reserved units (P6). Clearing an assignment (spec D5) was not in 8.0.0; P18 amends III to 9.0.0 as this branch's first commit, before any Phase 1 code (T007) |
| IV. State Machine | PASS | No request transition is touched |
| V. Notifications | PASS | No transition, no email |
| VI. Testable Increments | PASS | Stands alone on the seeded register. Each of I1, I2 and I3 is checkable by `check-inventory.mjs` as it lands |
| VII. Typed Contracts | PASS | No invented route, field or error code. Drafts use the contract's names. The SPA-only `pr` and removal reason are never sent by a contract-backed source, and `status` is never sent on create. Gaps are raised (P17) |
| VIII. MVP Restraint | PASS | The per-unit register is in scope. No new dependency. The table's extra fields (Inventory Code, IMEI and others) stay out |
| IX. Secrets | PASS | Secrets come only from `get(id)` (P4), are masked in inputs (P12), are never in a URL (P10) and are never logged (P19 greps for console calls). Seed values are visibly fake placeholders |

## Analysis

Cross-checked against spec 015 on 2026-10-01. Coverage is FR-001 to FR-017 plus FR-011a: 18/18. No CRITICAL or HIGH findings.

- A1 (MEDIUM, fixed in the spec): the edge cases on Profile's assigned list and the catalog's availability described the API, not the seeded build (P13). Both now say *against the API*.
- A2 (MEDIUM, fixed in the spec and P17): FR-005's newest-first order is not the contract's (id ascending). Added to G9.
- A3 (MEDIUM, fixed in P12): the concurrent-removal edge case had a refusal but no panel behaviour.
- A4 (LOW, fixed in P10): the drawn subtitle's full stop. Every page subtitle in `DESTINATIONS` omits it, so `destinations.ts` is not touched.

No analysis overrides.

## Build Order

0. **Amendment (P18).** Its own commit on this branch, before step 1's code (spec Q1). Done 2026-10-01.
1. **Rebase on `dev` once #41 has merged (P1), then the shared groundwork.** Re-read #41's merged `seeded-asset-source.ts`, `useTableQuery.ts` and `TableToolbar.tsx` before editing them, and revise P3 and P9 here if their shape changed (R1). Generalise the table hook (P9). Add the register and derive Assets' counts from it (P3). **Gate:** the Assets table MUST show the same numbers, per asset and per chip, before and after, recorded from the browser before the change and asserted by `check-inventory.mjs`. `check-assets.mjs`, which `verify.mjs` does not run today, is wired in first and passes before and after. One commit, full `npm run verify` passing, before step 2.
2. **I1, BEN-107:** types, status pill, rules, source, store, page, menu, toolbar, route, stubs (P5, P6, P9 to P11, P14 to P16).
3. **I2, BEN-108:** `UnitFormPanel` add, edit and remove, with the user directory (P7, P8, P12).
4. **I3, BEN-152:** `BulkAddPanel` (P12).
5. **I4, BEN-153:** `check-inventory.mjs`, `verify.mjs`, contracts conflict 11, additions.md, `run-checks`, PR to `dev` (P17, P19). The PR description states the seeded register's reach (R2).

## Red Team

Steelman: Inventory is a thin, typed view over one unit register that the Assets counts also derive from, so "nothing writes a count" holds by construction. The status rules and device fields are each one pure table, read by the panels, the seeded source and the check. Secrets cannot reach the table because the list type does not carry them. Every contract gap is raised, not bridged.

| # | Failure mode | Response |
|---|--------------|----------|
| R1 | PR #41's seeded source or table hook is reshaped in review, or merges late, and P3/P9 become rework | **Mitigated**: wait for the merge (P1); re-read #41 at rebase; same-Assets-numbers gate (Build Order 1) |
| R2 | The demo shows two stock worlds: a catalog request does not move Inventory's Reserved, and an Inventory add does not move the catalog | **Accepted**, documented; see Known Risks |
| R3 | A masked secret is saved by the browser's password manager, or printed by a stray log | **Mitigated**: CSS-masked text input, never `type="password"` (P12); console, URL and DOM capture in the check (P19) |
| R4 | The load-everything, filter-in-the-browser list does not survive a server-paged contract with no status counts | **Accepted**; see Known Risks |
| R5 | Review of the feature PR rejects the 9.0.0 amendment, and the D4/D5 code goes with it | **Accepted** (project owner, 2026-10-01): one PR. The amendment is its own first commit, so it reads and can be reverted alone; without it, D4/D5's clearing and Inactive-assignment options are what must change (P6) |

## Known Risks

- **R2, the seeded register's reach.** Only Inventory and Assets read the register (P13). The catalog's seeded stock (spec 005), the seeded request submit (spec 011) and Profile's assigned list (spec 006) keep their own data. In the seeded build, a submitted request does not reserve a register unit, `Received` does not assign one, and adding units does not change catalog availability. Against the API they are one register, and the spec's edge cases say so (Analysis A1). The PR description and `check-inventory.mjs`'s header state this, so QA does not file it as a defect. Accepted by the project owner, 2026-10-01.
- **R4, browser-side query.** `InventorySource.list()` returns every unit, and `useTableQuery` searches, counts, filters and pages in the browser, newest first. The published `GET /inventory-items` pages on the server, orders by id ascending, searches neither PR nor serial, and returns no status counts (G9). When the contract answers G9, the contract-backed source takes the query and those steps move behind it. The boundary is narrow, so the change stays inside `src/features/inventory/`. This is the same position as spec 013's R4. Accepted by the project owner, 2026-10-01.

**Strengthened position:** Inventory lands only after Assets has merged, and its governance change is the branch's first commit, ahead of any code that needs it. The first commit on the rebased branch is a behaviour-preserving change to Assets, gated on identical numbers. From then on, one seeded register is the only place stock lives for the two Admin screens: counts are derived, never written. The status, device-field and validation rules are each one table, shared by the UI, the seeded source and the check script. Secrets come only from the per-unit read, sit in inputs no password manager will save, and are asserted absent from logs, URLs and the table. Where the seeded build and the API differ (the register's reach, server-side querying), the difference is written down rather than papered over.
