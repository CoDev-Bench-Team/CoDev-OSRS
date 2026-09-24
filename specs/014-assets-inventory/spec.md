# Feature Specification: Assets and Inventory

**Feature Branch**: `rockyc/ben-48-p2spa-assets-inventory`
**Created**: 2026-09-24
**Status**: Draft — **SPA mock**: both screens run on seeded data; no endpoint is called (D1)
**Linear**: [BEN-48](https://linear.app/bench-synergy-project/issue/BEN-48) (H0 [BEN-80](https://linear.app/bench-synergy-project/issue/BEN-80), H1 [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81))
**Sources**: Figma `.fig` export 2026-09-22 — frames `03- Assets`, `03.1 Add Asset - <category>` (×8), `03.2- View Asset`, `03 - Inventory` (frame B), `03.4 - Update Stocks`; [drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md) §4; spec 001 US1, FR-002, FR-002a, FR-003, FR-003a, FR-018; the live contract at <https://codev-osrs-backend.vercel.app/> as read on 2026-09-24

## Overview

The Admin's two data screens. **Assets** (`/assets`) is the catalogue of requestable models, with how many units are available, reserved and deployed. **Inventory** (`/inventory`) is stock per item, edited per office. Each has panels: Add, View and Update Asset on the first; Update stocks on the second.

**Relationship to other specs**: implements spec 001 US1 for the SPA. Replaces the shell's Assets and Inventory placeholders. Adds no request transition and no notification.

## Decisions

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | **Mock first.** The live contract answered the three open conflicts on 2026-09-24 (backend PR #87, BEN-20), and conflict 1 was answered with a **per-unit register**: stock is one `/inventory-items` row per physical unit (serial, BitLocker identifier, status `Available / Reserved / Assigned / Inactive`). That model is out of scope under constitution VIII and contradicts ADR-0006. The contract has no resource that returns Total / Available / Reserved per asset or per office, and no way to set a quantity per office. Until the project owner decides between amending ADR-0006 and asking the backend for an aggregate stock resource, both screens read a **source boundary** (`AssetSource`) whose only implementation is in-memory seeded data. | The pages are complete and demoable; wiring is one new source implementation. No route, field or error code is invented — the seeded source speaks SPA vocabulary, and its validation failures use the published RFC 9457 shape. |
| D2 | **`03 - Inventory` frame B**, the stock-levels table. Frame A (`PR · ASSET · CATEGORY · ASSIGNED · OFFICE`) is the per-unit register. The two frames share a subtitle — "Monitor stock levels, manage reservations…" — that describes B, and `03.4 - Update Stocks` is built on B ([drift §4d](../../docs/design-system/drift-2026-09-22.md)). | Flagged to the designer; A is not built. |
| D3 | **Offices follow the contract: `Ortigas`.** The live contract now says `Ortigas` in every location enum — assets, inventory items and users — matching the design. Conflict 2 is resolved. | `Office` in `src/features/auth/types.ts` moves from `Pasig` to `Ortigas`. No seeded user is in that office, so Profile is unchanged. |
| D4 | **Categories follow the contract enum**: Laptop, Headset, Monitor, Phone, UPS, Mice, Wifi, Type C Hub, Other Devices. The design draws eight Add Asset frames; it draws none for **Monitor**, and names the last one "Other Device". | Monitor takes Headset's shape (Model required, no specifications) — **our invention**, flagged. The label is the contract's `Other Devices`. |
| D5 | **The field set per category is data**, not eight forms (FR-002a). One table names, per category, whether Model is required, optional or absent, and which specification rows appear. | A new category is one row. |
| D6 | **Model is required only where the design asterisks it** (Laptop, Phone, Headset, Monitor per D4); optional on Wifi and Type C Hub; absent on UPS, Mice and Other Devices. The live `CreateAssetDto` requires `model` for every category. | **New contract conflict 4.** The mock follows the design. |
| D7 | **The custom-spec row** on Update Asset (`e.g. External Keyboard`) is built as drawn. The live contract removed `specs[]` in favour of five fixed fields (`ram`, `storage`, `processor`, `graphics`, `operatingSystem`), so a custom spec has nowhere to be saved. | **New contract conflict 5.** The mock stores custom specs; wiring must either drop the row or get the field back. |
| D8 | **One low-stock threshold per asset.** `03.4 - Update Stocks` draws a single `Low-stock threshold` above five office rows, and the contract keeps `lowQtyAlert` on the asset. Spec 001 FR-003 says per (asset, office). | Follows the design and the contract. Recorded as a spec 001 amendment request. |
| D9 | **A stepper sets an office's Total.** Reserved is not editable here — it moves only through the request pipeline — so an office's Total cannot go below its Reserved, and Available is always `Total − Reserved` (constitution III). | The UI cannot produce a state where `Total ≠ Available + Reserved` or any quantity is negative. |
| D10 | **`+ Add Inventory` is drawn and disabled.** It opens `Add Catalog Item`, a per-unit form (Serial Number, BitLocker Identifier, Recovery Key/PIN, Price, Supplier, Purchased Date) — out of scope under constitution VIII ([drift §4e](../../docs/design-system/drift-2026-09-22.md)). | The button is present for fidelity and says why it does nothing. No per-unit field appears anywhere in this feature. |
| D11 | **Stock status is derived, never stored**: `Out of Stock` when Available is 0, `Low Stock` when Available is at or below the threshold, `In Stock` otherwise. On Assets, Available is the sum over offices. | The same rule the live contract's `stockLevel` filter and the catalog use. |
| D12 | **Admin only.** Both destinations are the ones BEN-114 (Phase 0) added for the two-role shell, guarded to `admin` and in the Admin bar: Requests Queue · Assets · Inventory · History. | This feature replaces their placeholders; it adds no route. |

## User Stories

### Story 1 — Browse assets (Priority: P1)

An Admin opens **Assets** and sees `Assets` / `Deployed and available units`, a primary **+ Add Asset**, a search field (`Search inventory by item name or code`), an `All categories` select, chips `All assets · In stock · Low stock · Out of stock` with counts, and a table: `ITEM NAME · CATEGORY · MODEL · AVAILABLE UNITS · PENDING/RESERVED UNITS · DEPLOYED UNITS`, paginated.

**Acceptance Criteria**:

1. **Given** seeded assets, **When** the Admin opens `/assets`, **Then** every column renders and the chip counts equal the number of assets in each derived status (D11).
2. **Given** a search term, **When** it matches an item's name, model or category, **Then** only matching rows remain, and the chip counts describe the searched set.
3. **Given** a category and a chip selected, **When** both apply, **Then** rows match both.
4. **Given** more rows than one page holds, **When** the Admin changes page or results per page, **Then** the range label (`1-10 of 24`) and rows follow.
5. **Given** no row matches, **When** the table renders, **Then** it shows an empty state rather than a blank card.
6. **Given** a row, **When** the Admin activates it, **Then** View Asset opens for that asset.

### Story 2 — Add an asset (Priority: P1)

**+ Add Asset** opens a right-hand panel. BASICS: Image (`Drop file or browse`, `Format: .jpeg, .png & Max file size: 25 MB`), `Item Name *`, `Category *`, Model (required, optional or absent by category), Description. SPECIFICATIONS: the rows the category defines. **Cancel** / **Save Changes**.

**Acceptance Criteria**:

1. **Given** Category Laptop, **Then** Model is required and SPECIFICATIONS shows RAM, Storage, Processor, Graphics, Operating System. **Given** Phone, **Then** RAM and Storage. **Given** UPS, Mice or Other Devices, **Then** no Model field and no SPECIFICATIONS section.
2. **Given** values typed under Laptop, **When** Category changes to Phone and back, **Then** shared values (name, model, description, image, RAM, Storage) are kept; a hidden field is not submitted.
3. **Given** a required field is empty, **When** Save is pressed, **Then** nothing is saved and the message appears under that field.
4. **Given** a file that is not `.jpeg`/`.png`, or larger than 25 MB, **When** it is chosen, **Then** it is refused with a message under the uploader.
5. **Given** the source refuses with a validation problem (`errors[].pointer`), **When** the panel receives it, **Then** each `detail` appears under the field its pointer names, through the shared parser.
6. **Given** a valid form, **When** saved, **Then** the panel closes and the asset appears with zero units.
7. The panel has no location, quantity or low-stock field.

### Story 3 — View and update an asset (Priority: P1)

View Asset reads back Item Name, Model and the category's specification rows, then Description, with **Update Asset**. Update Asset is Add Asset prefilled, plus a free custom-spec row.

**Acceptance Criteria**:

1. **Given** a Mice asset, **When** View Asset opens, **Then** no specification rows show.
2. **Given** any asset, **When** Update Asset opens, **Then** every field is prefilled from it.
3. **Given** the custom-spec row, **When** a name and value are added, **Then** they are appended as one `{ key, value }` pair without disturbing the category rows, and View Asset reads them back.
4. **Given** an edit, **When** saved, **Then** the row in the table reflects it.

### Story 4 — See stock levels (Priority: P1)

An Admin opens **Inventory** and sees `Inventory` / `Monitor stock levels, manage reservations, and keep office essentials ready.`, **+ Add Inventory** (disabled, D10), search, `All categories`, chips `All items · In stock · Low stock · Out of stock`, and `ITEM NAME · CATEGORY · TOTAL STOCK · AVAILABLE QUANTITY · RESERVED / PENDING · STATUS · ACTION`.

**Acceptance Criteria**:

1. **Given** any row, **Then** `TOTAL STOCK = AVAILABLE QUANTITY + RESERVED / PENDING`.
2. **Given** Available is 0, **Then** it is red and the pill reads `Out of Stock`; otherwise green.
3. **Given** filters and pagination, **Then** they behave as Story 1 AC2–AC5.
4. **Given** a row, **When** `Update stock` is activated, **Then** Update stocks opens for that item.

### Story 5 — Update stock per office (Priority: P1)

Update stocks shows the item's image, read-only Item Name and Category, a link `Update Item Details and Specs >`, then **STOCKS**: `Low-stock threshold` and one stepper per office — Cebu, Bacolod, Makati, Ortigas, Davao. **Cancel** / **Save Changes**.

**Acceptance Criteria**:

1. **Given** an office with Reserved 3, **When** its stepper is at 3, **Then** `−` is disabled, and a typed value below 3 is raised back to 3 (D9).
2. **Given** edits to the threshold and two offices, **When** Save is pressed, **Then** all of them are applied together in one source call, and the table's totals, availability and pill reflect them.
3. **Given** edits, **When** Cancel is pressed, **Then** nothing changes.
4. **Given** `Update Item Details and Specs >`, **When** activated, **Then** Update Asset opens for the same asset.
5. **Given** a negative or non-integer threshold, **When** Save is pressed, **Then** it is refused under the field.

## Requirements

- **FR-001**: `/assets` and `/inventory` MUST be reachable only by the Admin (D12) and appear in the Admin's navigation.
- **FR-002**: Both screens MUST read through `AssetSource`; no page imports seeded data directly.
- **FR-003**: The category field set MUST be one data table (D5).
- **FR-004**: Validation problems MUST be mapped to fields by one shared parser (`src/shared/validation.ts`) that reads `errors[].pointer` as an RFC 6901 pointer.
- **FR-005**: Stock status MUST be derived by one function (D11) and never stored.
- **FR-006**: No UI path MUST be able to produce `Total ≠ Available + Reserved` or a negative quantity (D9).
- **FR-007**: Update stocks MUST save the threshold and all five offices in a single source call.
- **FR-008**: Assets, Inventory and their panels MUST NOT render any per-unit field (D10).
- **FR-009**: Both tables MUST paginate with the range label, Back / page numbers / Next, and a `Result per page` select.
- **FR-010**: Panels MUST close on Escape and on the scrim, hold focus while open, and return focus to the control that opened them.

## Out of Scope

- The per-unit register: `Add Catalog Item`, Inventory frame A, serials, assignment, BitLocker escrow (constitution VIII).
- Wiring to HTTP (D1). Deleting an asset. Marking an asset inactive (spec 001 edge case; not drawn).

## Contract conflicts — state on 2026-09-24

Recorded in [contracts/README.md](../001-office-supplies-mvp/contracts/README.md).

| # | Conflict | State |
|---|----------|-------|
| 1 | Reserved is a real quantity, per office | **Answered with a per-unit register** — blocks wiring (D1) |
| 2 | `Ortigas` vs `Pasig` | **Resolved: `Ortigas`** (D3) |
| 3 | `location` / `quantity` / `lowQtyAlert` on the asset form | **Mostly resolved**: `location` and `quantity` left the asset; `lowQtyAlert` stayed, which matches D8 |
| 4 | `model` required for every category | **New** (D6) |
| 5 | No field for a custom spec | **New** (D7) |

## Open questions for the designer

1. No `03.1 Add Asset - Monitor` frame (D4).
2. Inventory frames A and B (D2).
3. `Add Asset - Wifi`, `- Type C Hub`, `- Other Device` show `Category *` = "Mice"; all eight carry Inventory's subtitle and chips. The port takes each frame's own category and `03- Assets`' header.
4. `+ Add Inventory` opens a per-unit form from an aggregate table (D10).

## Success Criteria

- **SC-001**: A tester can add a Laptop asset, set Cebu to 10 on Update stocks, and see Inventory read Total 10 / Available 10 / Reserved 0 / `In Stock` — spec 001 US1 AC1–AC2 — using only the UI.
- **SC-002**: Every category renders exactly the fields in D5/D6 and refuses a save missing a required one.
- **SC-003**: No sequence of stepper, typing, save or cancel produces a row where `Total ≠ Available + Reserved`.
- **SC-004**: `npm run lint` and `npm run build` are clean.
