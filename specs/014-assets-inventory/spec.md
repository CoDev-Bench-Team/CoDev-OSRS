# Feature Specification: Assets

**Feature Branch**: `rockyc/ben-48-p2spa-assets-inventory`
**Created**: 2026-09-24 · **Amended**: 2026-09-30 (constitution 7.0.0; see Clarifications)
**Status**: Draft — **SPA mock**: the screen runs on seeded data; no endpoint is called (D1)
**Linear**: [BEN-48](https://linear.app/bench-synergy-project/issue/BEN-48) (H0 [BEN-80](https://linear.app/bench-synergy-project/issue/BEN-80), H1 [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81), H2–H4 BEN-82 · BEN-83 · BEN-84)
**Sources**: Figma `.fig` export 2026-09-26 (unchanged for these frames in the 2026-09-29 export) — frames `03- Assets` (×2), `03.1 Add Asset - <category>` (×8), `03.2- View Asset`; [drift-2026-09-26 §2](../../docs/design-system/drift-2026-09-26.md), [drift-2026-09-29-export §5](../../docs/design-system/drift-2026-09-29-export.md); spec 001 US1, FR-002, FR-002a, FR-003, FR-018; [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md); the live contract at <https://codev-osrs-backend.vercel.app/>

The folder keeps its name, `014-assets-inventory`, because BEN-48 is the parent of both halves. This spec covers **Assets only**. Inventory is the unit register of BEN-107 and BEN-108, specified on its own.

## Overview

The Admin's **Assets** screen (`/assets`): the catalogue of requestable models, each with how many of its units are available, reserved and assigned. Its panels are Add Asset, View Asset and Update Asset.

**Relationship to other specs**: implements the Assets half of spec 001 US1 for the SPA. Replaces the shell's Assets placeholder. Leaves `/inventory` on its placeholder for BEN-107. Adds no request transition and no notification.

## Decisions

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | **Mock first.** Stock is a register of units (constitution 7.0.0 III, ADR-0008), and the live `GET /assets` returns each asset's **Available** count alone — no Reserved and no Assigned. The screen reads a **source boundary** (`AssetSource`) whose only implementation is in-memory seeded data. | The page is complete and demoable; wiring is one new source implementation. No route, field or error code is invented. The seeded source speaks SPA vocabulary, and its validation failures use the published RFC 9457 shape. |
| D2 | *Withdrawn 2026-09-30.* Was: build `03 - Inventory` frame B. Frame B and `03.4 - Update Stocks` are retired (drift-2026-09-26 §2). | Inventory is BEN-107 / BEN-108. |
| D3 | **Offices follow the contract: `Ortigas`.** Every contract `location` enum says `Ortigas`, matching the design. | `Office` in `src/features/auth/types.ts` is already `Ortigas` on `dev`. |
| D4 | **Categories follow the contract enum**: Laptop, Headset, Monitor, Phone, UPS, Mice, Wifi, Type C Hub, Other Devices. The design draws eight Add Asset frames; it draws none for **Monitor**, and names the last one "Other Device". | Monitor takes Headset's shape (Model required, no specifications) — **our invention**, flagged. The label is the contract's `Other Devices`. |
| D5 | **The field set per category is data**, not eight forms (FR-002a). One table names, per category, whether Model is required, optional or absent, and which specification rows appear. | A new category is one row. |
| D6 | **Model is required only where the design asterisks it** (Laptop, Phone, Headset, Monitor per D4); optional on Wifi and Type C Hub; absent on UPS, Mice and Other Devices. The live `CreateAssetDto` requires `model` for every category. | **Contract conflict 8.** The mock follows the design. |
| D7 | **The custom-spec row** on Update Asset (`e.g. External Keyboard`) is built as drawn. The live contract removed `specs[]` in favour of five fixed fields (`ram`, `storage`, `processor`, `graphics`, `operatingSystem`), so a custom spec has nowhere to be saved. | **Contract conflict 9.** The mock stores custom specs; wiring must either drop the row or get the field back. |
| D8 | **One low-stock threshold per asset, on Update Asset.** The Update Asset panel on the second `03- Assets` frame ends with `STOCKS · Low-stock threshold` (drift-2026-09-26 §2); the contract keeps `lowQtyAlert` on the asset, default 5; spec 001 FR-003 holds it per asset. Add Asset draws no threshold. | Add Asset sends none and the source applies the contract default of 5. Update Asset edits it. |
| D9 | **Stock is read-only here.** Available, Reserved and Assigned are counts of units by status (ADR-0008 decision 2). Only the request pipeline moves a unit into or out of `Reserved`, or to `Assigned` on `Received`; units are added, removed or made inactive on Inventory (constitution III). Total is Available + Reserved, never stored. | Nothing on this screen can break `Total = Available + Reserved` or make a count negative, because nothing on it writes a count. |
| D10 | *Withdrawn 2026-09-30.* Was: `+ Add Inventory` disabled and no per-unit field anywhere. The per-unit register is in scope under constitution 4.0.0 VIII. | Units belong to BEN-107 / BEN-108. The Assets screen still shows no per-unit field, because none is drawn on it. |
| D11 | **Stock status is derived, never stored**: `Out of Stock` when Available is 0, `Low Stock` when Available is at or below the threshold, `In Stock` otherwise. Available is summed over the offices (ADR-0008 decision 4, with no office selected). | The same rule as the live contract's `stockLevel` filter and the catalog. |
| D12 | **Admin only.** `/assets` is the destination BEN-114 added for the two-role shell, guarded to `admin` and in the Admin bar. `/inventory` keeps its placeholder. | This feature replaces one placeholder; it adds no route. |

## User Stories

### Story 1 — Browse assets (Priority: P1)

An Admin opens **Assets** and sees `Assets` / `Assigned and available units`, a primary **+ Add Asset**, a search field (`Search inventory by item name or code`), an `All categories` select, chips `All assets · In stock · Low stock · Out of stock` with counts, and a table: `ITEM NAME · CATEGORY · MODEL · AVAILABLE UNITS · PENDING/RESERVED UNITS · ASSIGNED UNITS`, paginated.

**Acceptance Criteria**:

1. **Given** seeded assets, **When** the Admin opens `/assets`, **Then** every column renders and the chip counts equal the number of assets in each derived status (D11).
2. **Given** a search term, **When** it matches an item's name, model or category, **Then** only matching rows remain, and the chip counts describe the searched set.
3. **Given** a category and a chip selected, **When** both apply, **Then** rows match both.
4. **Given** more rows than one page holds, **When** the Admin changes page or results per page, **Then** the range label (`1-10 of 24`) and rows follow.
5. **Given** no row matches, **When** the table renders, **Then** it shows an empty state rather than a blank card.
6. **Given** a row, **When** the Admin activates it, **Then** View Asset opens for that asset.
7. **Given** an asset, **Then** AVAILABLE UNITS and PENDING/RESERVED UNITS are its units in those statuses summed over the five offices, and ASSIGNED UNITS its units in `Assigned` (D9).

### Story 2 — Add an asset (Priority: P1)

**+ Add Asset** opens a right-hand panel. BASICS: Image (`Drop file or browse`, `Format: .jpeg, .png & Max file size: 25 MB`), `Item Name *`, `Category *`, Model (required, optional or absent by category), Description. SPECIFICATIONS: the rows the category defines. **Cancel** / **Save Changes**.

**Acceptance Criteria**:

1. **Given** Category Laptop, **Then** Model is required and SPECIFICATIONS shows RAM, Storage, Processor, Graphics, Operating System. **Given** Phone, **Then** RAM and Storage. **Given** UPS, Mice or Other Devices, **Then** no Model field and no SPECIFICATIONS section.
2. **Given** values typed under Laptop, **When** Category changes to Phone and back, **Then** shared values (name, model, description, image, RAM, Storage) are kept; a hidden field is not submitted.
3. **Given** a required field is empty, **When** Save is pressed, **Then** nothing is saved and the message appears under that field.
4. **Given** a file that is not `.jpeg`/`.png`, or larger than 25 MB, **When** it is chosen, **Then** it is refused with a message under the uploader.
5. **Given** the source refuses with a validation problem (`errors[].pointer`), **When** the panel receives it, **Then** each `detail` appears under the field its pointer names, through the shared parser.
6. **Given** a valid form, **When** saved, **Then** the panel closes and the asset appears with zero units and a threshold of 5 (D8).
7. The panel has no location, quantity or low-stock field.

### Story 3 — View and update an asset (Priority: P1)

View Asset reads back Item Name, Model and the category's specification rows, then Description, with **Update Asset**. Update Asset is Add Asset prefilled, plus a free custom-spec row, then **STOCKS · Low-stock threshold**.

**Acceptance Criteria**:

1. **Given** a Mice asset, **When** View Asset opens, **Then** no specification rows show.
2. **Given** any asset, **When** Update Asset opens, **Then** every field is prefilled from it, the threshold included.
3. **Given** the custom-spec row, **When** a name and value are added, **Then** they are appended as one `{ key, value }` pair without disturbing the category rows, and View Asset reads them back.
4. **Given** an edit, **When** saved, **Then** the row in the table reflects it.
5. **Given** a new threshold, **When** saved, **Then** the row's derived status and the chip counts follow it (D11).
6. **Given** a blank, negative or non-whole threshold, **When** Save is pressed, **Then** nothing is saved and the message appears under the field.

## Requirements

- **FR-001**: `/assets` MUST be reachable only by the Admin (D12) and appear in the Admin's navigation.
- **FR-002**: The screen MUST read through `AssetSource`; no page imports seeded data directly.
- **FR-003**: The category field set MUST be one data table (D5).
- **FR-004**: Validation problems MUST be mapped to fields by one shared parser (`src/shared/validation.ts`) that reads `errors[].pointer` as an RFC 6901 pointer.
- **FR-005**: Stock status MUST be derived by one function (D11) and never stored.
- **FR-006**: No UI path on this screen MUST write a stock count (D9).
- **FR-007**: The low-stock threshold MUST be edited on Update Asset only, one per asset, as a whole number 0 or more (D8).
- **FR-008**: *Withdrawn 2026-09-30* (was: no per-unit field anywhere; D10).
- **FR-009**: The table MUST paginate with the range label, Back / page numbers / Next, and a `Result per page` select.
- **FR-010**: Panels MUST close on Escape and on the scrim, hold focus while open, and return focus to the control that opened them.

## Out of Scope

- **Inventory** — the unit table and its panels (BEN-107, BEN-108). `/inventory` stays on its placeholder.
- Wiring to HTTP (D1). Deleting an asset. Marking an asset inactive (spec 001 edge case; not drawn).

## Contract conflicts — state on 2026-09-30

Recorded in [contracts/README.md](../001-office-supplies-mvp/contracts/README.md).

| # | Conflict | State |
|---|----------|-------|
| 1 | Stock per office | **Decided: the per-unit register** (ADR-0008). Blocks wiring until per-asset counts (available / reserved / assigned) are published (D1) |
| 2 | `Ortigas` vs `Pasig` | **Resolved: `Ortigas`** (D3) |
| 3 | `location` / `quantity` / `lowQtyAlert` on the asset form | **Resolved**: `lowQtyAlert` stays on the asset, which matches D8 |
| 8 | `model` required for every category | **Open** (D6) |
| 9 | No field for a custom spec | **Open** (D7) |

## Open questions for the designer

1. No `03.1 Add Asset - Monitor` frame (D4).
2. `Other Device` (file) vs `Other Devices` (contract); the SPA prints the contract's.

## Success Criteria

- **SC-001**: A tester can add a Laptop asset, see it on Assets with 0 / 0 / 0 units and `Out of Stock`, set its threshold on Update Asset, and see View Asset read back what was saved — spec 001 US1 AC1 — using only the UI.
- **SC-002**: Every category renders exactly the fields in D5/D6 and refuses a save missing a required one.
- **SC-003**: No action on the screen changes AVAILABLE, RESERVED or ASSIGNED units.
- **SC-004**: `npm run lint` and `npm run build` are clean.

## Clarifications

### Session 2026-09-30 — Amendment

Raised by the rebase of BEN-48 onto `dev` at constitution **7.0.0**. The spec was
written on 2026-09-24 against 3.0.1, and four amendments landed while its PR was
open. Constitution I requires it recorded here, citing the drift it came from.

- Q: Constitution 4.0.0 III / VIII and [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md) make Inventory a register of units and retire `03 - Inventory` frame B and `03.4 - Update Stocks` ([drift-2026-09-26 §2](../../docs/design-system/drift-2026-09-26.md)). ADR-0008 names this spec's Inventory half as retired work in flight. Rework it here or split it? → A: **Split.** BEN-48 ships Assets. Inventory is BEN-107 / BEN-108, re-scoped to the unit screens on 2026-09-26, as ADR-0008 records. Agreed on BEN-48, 2026-09-30.
- Q: Where does the low-stock threshold go now that Update stocks is retired? → A: **Update Asset**, under `STOCKS`, as drift-2026-09-26 §2 records the second `03- Assets` frame drawing it.
- Q: `DEPLOYED UNITS` or `ASSIGNED UNITS`? → A: **`ASSIGNED UNITS`**, with the subtitle **"Assigned and available units"**, as the 2026-09-26 `03- Assets` draws. The count is units in `Assigned`, which under constitution 5.0.0+ happens on `Received`, not on `Completed`.

**Scope of the amendment.**

- **Withdrawn**: Stories 4 and 5 (Inventory table, Update stocks), D2, D10, FR-008, the old FR-006 / FR-007 (per-office steppers and their atomic save), and SC-001's stepper path.
- **Rewritten**: D1 (the blocker is now the missing per-asset counts, not the stock model), D8 (threshold on Update Asset), D9 (stock is read-only counts of units), D12 (Assets only), Story 1 (subtitle, `ASSIGNED UNITS`), Story 3 (the threshold).
- **Renumbered**: the folder was `008-assets-inventory`; `dev` took 008 (request review panel) and 013 (admin history). Contract conflicts 4 and 5 became **8** and **9**, because `contracts/README.md` on `dev` already uses 4–7 (7 is History, spec 013).
