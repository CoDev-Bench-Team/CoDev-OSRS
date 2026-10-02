# Tasks: Inventory — the unit register

**Spec**: `specs/015-inventory/spec.md`  
**Plan**: `specs/015-inventory/plan.md`  
**Structure**: By the plan's Build Order. Phase 0 is the amendment, committed on this branch before Phase 1's code and shipped in the same PR. Phase 1 starts only after PR #41 (Assets) has merged into `dev` (P1) and ends on a full `npm run verify` with Assets unchanged before any Inventory screen lands (R1). `check-inventory.mjs` is created in Phase 1 and grows with each increment, so each story is checkable as it lands (constitution VI).

Linear lifecycle: BEN-151 (I0, spec + plan + tasks + amendment) → BEN-107 (I1, groundwork + table) → BEN-108 (I2, single-unit panels) → BEN-152 (I3, bulk) → BEN-153 (I4, checks + PR). Parent: BEN-150.

Stories: US1 browse · US2 add single unit · US3 review and edit · US4 remove · US5 add multiple units · US6 Admin only.

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 0: Amendment and ownership (BEN-151)

Runs now; it does not wait on PR #41. Everything lands on this branch: T002 to T004 as one commit before Phase 1's code (spec Q1), shipped in the feature PR (project owner, 2026-10-01; R5).

- [x] T001 [P] [BEN-151] Mark spec 001 T010 and T010a as **owned by spec 015**, linking `specs/015-inventory/tasks.md` — `specs/001-office-supplies-mvp/tasks.md`
- [x] T002 [P] [BEN-151] Constitution **9.0.0** (MAJOR: III and VIII are redefined). III adds *"An Admin MAY also clear an assignment, moving an `Assigned` unit to `Available` or `Inactive`, and MAY record an assignment on an `Inactive` unit."*; VIII's "tag" becomes "purchase request number (PR)". Bump the version and Last Amended, add a version-history entry citing spec 015 D4, D5 and D14 and the drawn copy it comes from, [drift-2026-10-01 §5](../../docs/design-system/drift-2026-10-01.md), and bump the constitution row in `specs/README.md`, which still reads 7.0.0 (P18) — `AGENTS.md`, `specs/constitution.md`, `specs/README.md`
- [x] T003 [P] [BEN-151] ADR-0008: decision 1 (tag becomes the Purchase Request number, PR) and decision 3 (the Admin may clear an assignment, to Available or Inactive, and may record one on an Inactive unit), with a dated amendment note (P18) — `docs/adr/0008-per-unit-inventory-register.md`
- [x] T004 [P] [BEN-151] Spec 001 FR-003 and the Unit key entity: tag becomes PR; FR-003b adds the clearing move (`Assigned` → `Available` or `Inactive`). Data model: the `tag` row becomes `pr`, "Purchase Request number"; the Unit **Rules** and the outside-a-request moves add `Assigned` → `Available` (+n/+n), `Assigned` → `Inactive` and `Inactive` → `Assigned` (no count change). Process flow: the manual-edit rule adds the clearing move and `Inactive` → `Assigned` (no count change). ARCHITECT: the Inventory row's tag becomes PR; the unit-moves table and the manual-edit rule add the clearing move and `Inactive` → `Assigned` (P18) — `specs/001-office-supplies-mvp/spec.md`, `specs/001-office-supplies-mvp/data-model.md`, `docs/process-flow.md`, `ARCHITECT.md`
- [x] T005 [BEN-151] Commit T002 to T004 on this branch as one commit, ahead of any Phase 1 code. The spec's D5, Clarifications Q1 and Validation cite constitution 9.0.0, and the plan drops the separate amendment PR — `specs/015-inventory/spec.md`, `specs/015-inventory/plan.md`

## Phase 1: Groundwork, with Assets unchanged (BEN-107)

Unblocked: PR #41 merged into `dev` on 2026-10-01.

- [x] T006 [BEN-107] Rebase this branch onto `origin/dev`; resolve the `specs/README.md` conflict by keeping both the 014 and 015 rows. Re-read #41's merged `seeded-asset-source.ts`, `useTableQuery.ts`, `TableToolbar.tsx` and `types.ts`, and revise plan P3 and P9 if their shape changed (R1) — `specs/README.md`, `specs/015-inventory/plan.md`
- [x] T007 [BEN-107] Record the Assets baseline from the browser before any change: every asset's AVAILABLE, RESERVED and ASSIGNED figures and every chip count. Create `check-inventory.mjs` asserting it, and wire `inventory (spec 015)` into the gates. Also wire the existing `assets (spec 014)` / `scripts/check-assets.mjs` into the gates, which `verify.mjs` does not run today, and confirm it passes before any change (P19, Build Order 1) — `scripts/check-inventory.mjs`, `scripts/verify.mjs`
- [x] T008 [BEN-107] Generalise `useTableQuery(items, describe, { statuses, pageSizes, pageSize })`: a row whose status is not a chip counts under All only, and `TablePager` reads the page-size options from the query. `TableState` takes a generic `{ kind; stale? }` load state, with its loading label and failed title as props. `AssetsPage` passes `STOCK_STATUSES`, `[10, 25, 50]`, 10 and today's copy, with no behaviour change (P9) — `src/features/assets/useTableQuery.ts`, `src/features/assets/TableToolbar.tsx`, `src/features/assets/AssetsPage.tsx`
- [x] T009 [P] [BEN-107] `UNIT_STATUSES` (`Available · Reserved · Assigned · Inactive`) and `UnitStatus`; correct the comment that calls unit states out of scope (P5) — `src/shared/ui/status.ts`
- [x] T010 [BEN-107] `AddStatus`, `EditStatus`, `Assignee`, `UnitRow` (no secret field), `UnitDetail`, `UnitDraft`, `UnitBatchDraft`, with the contract's field names plus the SPA-only `pr` and an optional `status`. A Reserved unit's draft omits `status`, `assignedToId` and `location` (P5) — `src/features/inventory/types.ts`
- [x] T011 [P] [BEN-107] `UserDirectory`, `DirectoryUser`, and a seeded directory of about eight non-production users: `maya.santos` and `ethan.cruz` under their sign-in ids, plus others with departments, listed in quickstart as non-production placeholders (P16, constitution IX) — `src/features/inventory/user-directory.ts`, `src/features/inventory/seeded-user-directory.ts`, `specs/001-office-supplies-mvp/quickstart.md`
- [x] T012 [BEN-107] The seeded unit register:
  - `StoredUnit` and a per-asset seed table reproducing #41's per-office Available, Reserved and Assigned counts exactly.
  - Deterministic, visibly fake serials, PRs and Laptop secrets; seeded Assigned units go to directory users.
  - Some units with no PR; a Mice unit with no serial; a Monitor unit with no serial (created before the serial rule, spec Story 3 7a); at least one Inactive unit; enough units for several pages at 50.
  - `stockFor(assetId)`, `assignedFor(assetId)`, insert, replace and delete, and the removal log `{ id, reason, at }` (P3, P4).

  File: `src/features/inventory/seeded-unit-register.ts`
- [x] T013 [BEN-107] Stop storing `stock` and `assigned`; derive both from the register on every read (`list()` and the assets `create` and `update` return). New assets start with no units (P3) — `src/features/assets/seeded-asset-source.ts`
- [x] T014 [BEN-107] Gate: full `npm run verify` passes, `check-assets.mjs` and the Assets baseline assertions included, and Phase 1 is its own commit (R1). Done 2026-10-01 with one inheritance: `utilities + adherence` (`group` in `ImageField.tsx`), `fidelity` and `pixels` (SupplyCard 413 vs 410px) fail identically on `origin/dev` at `660b84d`, before this branch's code — `scripts/verify.mjs`

## Phase 2: US1, US6 — The unit table and the Add Inventory menu (BEN-107)

- [x] T015 [P] [US1] [BEN-107] `StatusPill` `unit` prop on the 8px chip. New tokens `--color-status-assigned-*` (aliasing `--color-osrs-blue-700` / `--color-osrs-blue-tint`) and `--color-status-inactive-*` (aliasing `--color-osrs-ink-700` / `--color-osrs-ink-tint`); Available reuses green and Reserved the amber `low` tokens. Add all four to the gallery (P14) — `src/shared/ui/data-display/StatusPill.tsx`, `src/styles/theme.css`, `src/shared/ui/gallery/Gallery.tsx`
- [x] T016 [P] [BEN-107] `statusOptions('add')`, `statusOptions('edit', unit)` (`null` for Reserved), `withStatus`, `withAssignee`, and `removal(unit)` with the drawn assigned copy and our reserved copy (P6) — `src/features/inventory/unit-rules.ts`
- [x] T017 [P] [BEN-107] `DEVICE_FIELDS` per category (Laptop: serial required and BitLocker; Mice and Other Devices: serial optional; the rest: serial required), the no-item default (Serial only), and `stripHidden(draft, category)` (P7) — `src/features/inventory/device-fields.ts`
- [x] T018 [P] [BEN-107] `formatAmount` (`Php 80,000.00` with the field's prefix) — `src/features/inventory/format.ts`
- [x] T019 [BEN-107] `validateUnit` and `validateBatch`, keyed by contract field paths (`units.<i>.serialNumber` for rows), covering every FR-008, FR-010, FR-011a and FR-013 rule that is not the uploader's. Status is required unless the stored unit is Reserved (P5, P8) — `src/features/inventory/unit-validation.ts`
- [x] T020 [BEN-107] `InventorySource` and `inventorySource(search)`. The seeded source:
  - `list()` returns rows newest first, joined to the Assets source for item name, model and category.
  - `get(id)` is the only method that returns secrets.
  - `create`, `createBatch` (all or nothing) and `update` run the shared validation and refuse with a `ValidationProblem`; a serial already in the register gets `409` with *"Serial numbers already in use: X."*.
  - An unknown id gets `404` with *"Inventory item with ID 'X' could not be found."*.
  - A save on a unit that became Reserved gets `409` with our seeded message.
  - `remove(id, reason)` refuses Assigned and Reserved, and logs the reason (P2, P4, P8, P16).

  Files: `src/features/inventory/inventory-source.ts`, `src/features/inventory/seeded-inventory-source.ts`
- [x] T021 [BEN-107] Dev-only `?inventory=slow|failing|recovers|empty`, each over a fresh seed, behind `import.meta.env.DEV`. `window.__osrs.inventory` exposes `counts(assetId, office)`, `reserveBehind(unitId)`, `removeBehind(unitId)` and `refuseNext(problem)`, which answers the next save once with that problem body (P16) — `src/features/inventory/dev/inventory-stub.ts`, `src/features/inventory/seeded-unit-register.ts`
- [x] T022 [BEN-107] `useInventory()`: `loading` · `failed` · `loaded`, `reload`, and save methods that reload after success, in the shape of `useAssets()` but without its `console.error` calls (P10, P19) — `src/features/inventory/inventory-store.ts`
- [x] T023 [P] [US1] [BEN-107] `InventoryToolbar`: `Search` (*"Search inventory by item name or code"*), the category `Select` (All categories plus the contract's nine), and chips All items · Assigned · Available · Reserved with counts and pressed state (P9, FR-003, FR-004) — `src/features/inventory/InventoryToolbar.tsx`
- [x] T024 [P] [US1] [BEN-107] `AddInventoryMenu`: `Button` with a trailing chevron, `aria-haspopup="menu"` and `aria-expanded`. Under it, a white card with `role="menu"` holding Add Single Unit and Add Multiple Units. Arrow keys move; Esc and an outside click close and return focus to the button (P11, FR-006) — `src/features/inventory/AddInventoryMenu.tsx`
- [x] T025 [US1] [BEN-107] `InventoryPage`:
  - `PageHeader` from `DESTINATIONS.inventory`; the menu; the toolbar.
  - The load states: `LoadingState`, a `Notice` with **Try again**, and the empty state.
  - `TableCard` with columns MODEL (item name) · CATEGORY · PURCHASE REQUEST · SERIAL NUMBER · OFFICE · ASSIGNED (name over department, or muted `Unassigned`) · STATUS (`StatusPill unit`) · ACTION (**Review**, labelled with item name and serial or PR), widths from the `03 - Inventory` frame via `tableColumnStyle` / `tableMinWidth`. A missing PR or serial shows `NO_VALUE` (`src/features/requests/format.ts`).
  - `TablePager` at 50 per page, offering 10 · 25 · 50 · 100. Open-panel state is held in the component, never in the URL (P10, FR-001 to FR-005, FR-015).

  File: `src/features/inventory/InventoryPage.tsx`
- [x] T026 [US6] [BEN-107] Route `/inventory` to `guarded('inventory', <InventoryPage />)`. `InventoryPlaceholder` is the file's last export, so delete `placeholders.tsx` and its import (P15) — `src/app/routes.tsx`, `src/app/placeholders.tsx`
- [x] T027 [US1] [US6] [BEN-107] Extend the check:
  - The Employee: no nav item, and `/inventory` refused.
  - Columns; no secret in any cell; chips, counts and Inactive under All items only; search by item name, model, PR and serial; category; pagination and page-1 reset; newest first.
  - The menu by keyboard, Esc and outside click.
  - Stub modes; no page-level overflow at 360px and 1440px (P19).

  File: `scripts/check-inventory.mjs`

## Phase 3: US2, US3, US4 — Add Single Unit, Review/Edit, Remove Unit (BEN-108)

- [x] T028 [BEN-108] Shared panel parts (P12):
  - `CatalogItemPicker`, an ARIA 1.2 combobox over `useAssets()` by item name or model, showing the category eyebrow over the name with ✕.
  - `UserPicker`, a combobox over the directory by name or email, any role or office.
  - `SecretInput`, a `type="text"` input masked by `-webkit-text-security: disc`, never `type="password"`, with a Show/Hide toggle (`aria-pressed`), `autoComplete="off"` and `spellCheck={false}` (R3).
  - `PurchaseFields`: PR, Price with a `Php` prefix, Supplier, Purchased Date (`max` = today).
  - `DeviceFields`, driven by `DEVICE_FIELDS`.
  - `ImageField` gains `label` and `filename` props (defaults `Image` and `asset-image`); its action names follow the label, so Assets is unchanged.

  Files: `src/features/inventory/unit-fields.tsx`, `src/features/assets/ImageField.tsx`
- [x] T029 [US2] [BEN-108] `UnitFormPanel` in add mode (400px):
  - Catalog Item; PURCHASE DETAILS; DEVICE DETAILS; ASSIGNMENT (User, Office defaulting to Cebu, Status with *Select Status* offering Available, Assigned and Inactive, per D3 as amended 2026-10-02); NOTES (Description, Attachment via `ImageField`).
  - Picking a User sets Assigned, and Available clears the User. Switching away from a Laptop drops the BitLocker values.
  - Client validation on Save; a refusal maps through `fieldErrors`, and a `409` shows the source's message. The panel stays open with every value on refusal (Story 2, FR-007, FR-008, FR-011 to FR-013).

  File: `src/features/inventory/UnitFormPanel.tsx`
- [x] T030 [US2] [BEN-108] Wire **Add Single Unit** from the menu. On save the panel closes and the list reloads; focus returns to **+ Add Inventory** — `src/features/inventory/InventoryPage.tsx`
- [x] T031 [US3] [BEN-108] `UnitFormPanel` in edit mode, opened by **Review** through `get(id)`:
  - The header is the item name plus the unit pill; the catalog item is not editable and `update` leaves `assetId` unchanged; every other field is prefilled.
  - Status offers Available · Assigned · Inactive. A Reserved unit has read-only Status, User and Office.
  - Secrets are masked, for a Laptop only. A missing serial must be filled before saving (except Mice and Other Devices).
  - A stored attachment fills the uploader with Replace / Download / Remove.
  - Focus returns to the row's **Review** (Story 3, FR-007, FR-012, FR-016).

  Files: `src/features/inventory/UnitFormPanel.tsx`, `src/features/inventory/InventoryPage.tsx`
- [x] T032 [US4] [BEN-108] `RemoveUnitSection` and the removing mode:
  - **Remove Unit** link for Available and Inactive; the assigned and reserved refusal copy otherwise, from `removal(unit)`.
  - Removing mode shows `Reason for removal *` and the footer becomes **Cancel** / **Confirm Removal**. Cancel returns to edit; an empty reason is refused under the field.
  - A reason opens a confirmation (*Remove this unit?*); **Remove unit** calls `remove(id, reason)`, discarding unsaved edits. Cancel, Esc and the scrim leave the unit (Story 4, FR-009).

  Files: `src/features/inventory/unit-fields.tsx`, `src/features/inventory/UnitFormPanel.tsx`
- [x] T033 [US3] [US4] [BEN-108] Concurrent changes. On a `404` from `get`, `update` or `remove`, the body becomes a `Notice` with the source's message and **Close**; closing reloads the list. On a `409` from a unit reserved behind the panel, the message shows and the edits are kept (P12, P16, spec edge cases) — `src/features/inventory/UnitFormPanel.tsx`
- [x] T034 [BEN-108] Check `SecretInput` masking in Chrome, Safari and Firefox. If one does not mask, decide the fallback and record it in plan P12 (R3) — `src/features/inventory/unit-fields.tsx`, `specs/015-inventory/plan.md`
- [x] T035 [US2] [US3] [US4] [BEN-108] Extend the check (P19):
  - Add Single Unit: exactly Available, Assigned and Inactive; picking a User sets Assigned; the User field finds an Employee and an Admin by name and by email, at any office; switching from a Laptop to another category drops the BitLocker values; field errors; a `400` problem through `refuseNext` landing under the pointed field; a `409` serial conflict; counts after save.
  - Review/Edit per status, with the P6 options; Reserved read-only, with its other details still saveable; unassign, assign, inactivate and reactivate moving `__osrs.inventory.counts` by ±1; Assigned → Inactive and Inactive → Assigned moving nothing; an office move; the seeded serial-less Monitor cannot be saved until Serial is filled (Story 3 7a).
  - Masked secrets on a Laptop only; no `input[type="password"]`; a console captured through every panel flow, the URL and the table DOM free of any seeded secret value.
  - Removal only for Available and Inactive, with a reason; the refusal copy for Assigned and Reserved.
  - Concurrent reservation and concurrent removal through the dev hooks; focus return.

  File: `scripts/check-inventory.mjs`

## Phase 4: US5 — Add Multiple Units (BEN-152)

- [x] T036 [P] [US5] [BEN-152] `SidePanel` gains `batch: 'max-w-[650px]'` (P12) — `src/shared/ui/overlay/SidePanel.tsx`
- [x] T037 [US5] [BEN-152] `BulkAddPanel` (650px):
  - Catalog Item; a **No. of Units** stepper on its own row above Office (Cebu), as the frame stacks them; shared PURCHASE DETAILS.
  - Opens with one row. Each row has Serial (plus the BitLocker pair for a Laptop) and a ✕; **+ Add another unit** sits below. The count always equals the rows: `−` drops the last row, `+` and **+ Add another unit** are disabled at 100, and Save is disabled at 0. No ✓, User, Status or RAM.
  - A category switch keeps serials and drops BitLocker values.
  - `validateBatch` on Save (missing and duplicate serials under each row); per-row pointers through `fieldErrors`; a `409` shows the source's message above the rows; `createBatch` all or nothing (Story 5, FR-010, FR-011, FR-011a).

  File: `src/features/inventory/BulkAddPanel.tsx`
- [x] T038 [US5] [BEN-152] Wire **Add Multiple Units** from the menu. On save the panel closes and the list reloads; focus returns to **+ Add Inventory** — `src/features/inventory/InventoryPage.tsx`
- [x] T039 [US5] [BEN-152] Extend the check (P19):
  - Opens at 1; stepper and rows in step; the 0 and 100 bounds.
  - A duplicate serial or one invalid row creates nothing, with the error under that row (SC-005). A serial already in the register shows the `409` message and creates nothing. A `400` problem through `refuseNext` pointing at `#/units/2/serialNumber` lands under row 3.
  - Three units at Cebu raise Available and Total there by 3, on Inventory and on Assets' AVAILABLE UNITS (SC-001).
  - A category switch keeps serials and drops BitLocker values.

  File: `scripts/check-inventory.mjs`

## Phase 5: Records, checks and PR (BEN-153)

- [x] T040 [P] [BEN-153] Add conflict **11, "Inventory: the unit register (raised 2026-10-01)"** with G1 to G9 as the spec words them, the newest-first order included, naming no route, parameter or field. Under conflict 1, strike the 2026-09-26 request for a unit **tag**, pointing to conflict 11 G5 and G7 (P17) — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T041 [P] [BEN-153] Log the undrawn parts (P17): masked secrets with Show/Hide; the category-driven device fields (D13); the PR field; the reserved-refusal copy; the ✓ not built; Bulk opening at one row; the filled attachment on Review/Edit; the catalog-item and user result lists; the seeded concurrent-reservation message — `docs/design-system/additions.md`
- [x] T042 [P] [BEN-153] Confirm the shell check refuses `/inventory` for the Employee and offers it to the Admin; add the assertion if missing. Already covered: the Admin nav lists Inventory, and `/inventory` is in the Employee's forbidden set and its signed-out fallback; no change — `scripts/check-shell.mjs`
- [x] T043 [BEN-153] Final check header comment, listing what it covers and stating the seeded register's reach (R2); the `verify.mjs` header comment names spec 015 — `scripts/check-inventory.mjs`, `scripts/verify.mjs`
- [x] T044 [BEN-153] `run-checks`: full `npm run verify` passes. Take screenshots at 1440px against the `03 - Inventory`, Add Single Unit and Bulk frames; walk every panel as the Admin and `/inventory` as the Employee. Done 2026-10-01: every gate passes, `inventory (spec 015)` and `assets (spec 014)` included, except the three T014 records as inherited from `origin/dev` (`utilities + adherence` for `group` in `ImageField.tsx`, `fidelity` and `pixels` for SupplyCard) — `scripts/verify.mjs`
- [x] T045 [BEN-153] Tick T010 and T010a in spec 001's tasks and T001 to T044 here — `specs/001-office-supplies-mvp/tasks.md`, `specs/015-inventory/tasks.md`
- [ ] T046 [BEN-153] PR to `dev`, linking BEN-150 and BEN-151. The description names the constitution 9.0.0 amendment (its own first commit), states the seeded register's reach (R2) and the contract gaps, with the screenshots attached. Attach the PR to the Linear issue — `specs/015-inventory/`

## Dependencies

- Phase 0 runs now. T002 to T004 → T005. T005's commit precedes T007 (spec Q1).
- Phase 1 follows PR #41's merge into `dev` (done 2026-10-01). T006 → T007 → T008. T010 depends on T009. T012 depends on T010 and T011. T013 depends on T012. T014 closes Phase 1.
- Phase 2: T019 depends on T017. T020 depends on T012, T013, T016 and T019. T021 depends on T020. T022 depends on T020. T025 depends on T015, T022, T023 and T024. T026 depends on T025. T027 depends on T021 and T026.
- Phase 3: T028 depends on T011 and T017. T029 depends on T016, T018, T019, T022 and T028. T030 depends on T029. T031 depends on T029. T032 and T033 depend on T031. T034 depends on T028. T035 depends on T021, T027 and T030 to T033.
- Phase 4: T037 depends on T019, T020, T022, T028 and T036. T038 depends on T037. T039 depends on T038.
- Phase 5: T043 depends on T039. T044 depends on T039 to T043. T045 depends on T044. T046 depends on T045.

## Parallel opportunities

- T001 to T004 together.
- T009 and T011 alongside T008.
- T015, T016, T017 and T018 together; T023 and T024 alongside T020 to T022.
- T036 alongside Phase 3.
- T040, T041 and T042 together.

## MVP slice

Phases 1 and 2 give a working, Admin-only unit table with Assets reading the same register (BEN-107). Phase 3 adds the panels that make stock editable (US2 and US3 are P1), Phase 4 the bulk path (P2), and Phase 5 is the PR gate.
