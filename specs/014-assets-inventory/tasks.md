# Tasks: Assets

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)
**Amended**: 2026-10-01 — Phase 6 realigns to the 2026-10-01 export ([drift-2026-10-01](../../docs/design-system/drift-2026-10-01.md)); Inventory is BEN-150. 2026-09-30 — Inventory (old T010, T011) withdrawn to BEN-107 / BEN-108; Phase 5 realigns to constitution 7.0.0

Format: `- [ ] [TaskID] [Linear] Description — path`

## Phase 1 — Foundations

- [x] T001 Move `Office` to the contract's `Ortigas` (D3) — `src/features/auth/types.ts` *(on `dev` since the rebase)*
- [x] T002 Shared problem+json parser (spec 001 T003a) — `src/shared/validation.ts` *(on `dev` since the rebase)*
- [x] T003 Panel fields; reuse `SidePanel`, `Pagination`, `FilterChip`, `table-columns` from `dev` — `src/shared/ui/forms/fields.tsx`, `src/shared/ui/index.ts`
- [x] T004 Asset model, category field table, stock rules — `src/features/assets/types.ts`, `category-fields.ts`, `stock.ts`
- [x] T005 `AssetSource`, seeded source, `useAssets` — `src/features/assets/asset-source.ts`, `seeded-asset-source.ts`, `asset-store.ts`
- [x] T006 Replace the `/assets` placeholder from BEN-114 (D12) — `src/app/routes.tsx`, `src/app/placeholders.tsx`

## Phase 2 — Assets

- [x] T007 [BEN-82] Assets table, toolbar, chips, pagination, empty state, row → View — `src/features/assets/AssetsPage.tsx`, `TableToolbar.tsx`, `useTableQuery.ts`
- [x] T008 [BEN-83] Add Asset panel from the field table; image uploader; per-field errors — `src/features/assets/AssetFormPanel.tsx`, `ImageField.tsx`
- [x] T009 [BEN-84] View Asset panel; Update Asset (prefill; the custom-spec row was withdrawn by T024) — `src/features/assets/ViewAssetPanel.tsx`, `AssetFormPanel.tsx`

## Phase 3 — Inventory (withdrawn 2026-09-30)

- ~~T010 [BEN-107] Inventory table, derived pill, disabled `+ Add Inventory` (D10)~~ — retired by ADR-0008; BEN-107 builds the unit table
- ~~T011 [BEN-108] Update stocks panel: threshold, five steppers floored at Reserved, atomic save~~ — retired by ADR-0008; BEN-108 builds the unit panels; the threshold moves to T017

## Phase 4 — Records and checks

- [x] T012 Record the contract conflicts — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T013 List spec 014 — `specs/README.md`
- [x] T014 [BEN-85] `npm run lint`, `npm run build`; walk the success criteria in the browser

## Phase 5 — Realign to constitution 7.0.0 (2026-09-30)

- [x] T015 Renumber the spec folder 008 → 014 and contract conflicts 4/5 → 8/9 (9/10 since T030) — `specs/`, `contracts/README.md`, `src/features/assets/*`
- [x] T016 Stock as counts of units by status: `StockLevels = { available, reserved }`, `deployed` → `assigned`; drop `setStock` / `StockChange` (D9) — `types.ts`, `stock.ts`, `asset-source.ts`, `asset-store.ts`, `seeded-asset-source.ts`
- [x] T017 [BEN-84] `STOCKS · Low-stock threshold` on Update Asset; whole number ≥ 0 (D8, FR-007) — `AssetFormPanel.tsx`, `category-fields.ts`
- [x] T018 [BEN-82] Subtitle `Assigned and available units`; column `ASSIGNED UNITS` — `AssetsPage.tsx`
- [x] T019 Remove the Inventory screen and Update stocks panel; restore the `/inventory` placeholder — `src/features/inventory/`, `src/app/routes.tsx`, `src/app/placeholders.tsx`
- [x] T020 Amend spec, plan, tasks and additions §3k — `specs/014-assets-inventory/*`, `docs/design-system/additions.md`
- [x] T021 `npm run lint`, `npm run build`; walk SC-001–SC-003 in the browser

## Phase 6 — Realign to the 2026-10-01 export

- [x] T022 Record the export diff — `docs/design-system/drift-2026-10-01.md`
- [x] T023 [BEN-83] `STOCKS · Low-stock threshold` on Add Asset, prefilled 5; the draft always carries it (A1, D8) — `AssetFormPanel.tsx`, `category-fields.ts`, `types.ts`, `seeded-asset-source.ts`
- [x] T024 [BEN-84] Remove the custom-spec rows from the model, seed and panels (A2; D7 and conflict 10 withdrawn) — `types.ts`, `category-fields.ts`, `AssetFormPanel.tsx`, `seeded-asset-source.ts`
- [x] T025 [BEN-84] View Asset: `Inventory Status` pill, `Low Stock Threshold` row, no Category row, 158px image (A3, A6) — `ViewAssetPanel.tsx`, `stock.ts`
- [x] T026 [BEN-84] Update Asset image: 158px box with Replace / Download / Remove icon chips (A5) — `ImageField.tsx`
- [x] T027 [BEN-82] Search placeholder `Search asset by item name or model` (A4) — `TableToolbar.tsx`
- [x] T028 Amend spec, plan, tasks, contracts README (conflict 10 withdrawn) and additions §3k — `specs/014-assets-inventory/*`, `specs/001-office-supplies-mvp/contracts/README.md`, `docs/design-system/additions.md`
- [x] T029 `npm run lint`, `npm run build`; walk the three Assets panels in the browser
- [x] T030 Rebase on `dev` at constitution 8.0.0; contract conflicts 8 / 9 → **9 / 10** (`dev` took 8 for the `for_delivery` cancel) — `contracts/README.md`, `specs/014-assets-inventory/*`, `drift-2026-10-01.md`, `category-fields.ts`
- [x] T031 Review fixes on the form: digits-only threshold; a refusal on a field the panel does not show surfaces in the panel's alert; a save settling after the panel closed neither closes nor writes to its replacement, and Cancel is disabled while saving; the Category error wired to its control — `AssetFormPanel.tsx`
- [x] T032 Fidelity pass against the 2026-10-01 export: columns 320/180/264/180/180; bold selected chip; panel inset and footer band; 39px Category select; Description per frame (single-line on Add, 99px on Update); solid uploader with the cloud glyph; View Asset row type — `AssetsPage.tsx`, `AssetFormPanel.tsx`, `ViewAssetPanel.tsx`, `ImageField.tsx`, `SidePanel.tsx`, `Select.tsx`, `FilterChip.tsx`, plan Geometry, additions §3k
- [x] T033 Spacing review: 4px chip label→count; `e.g.` placeholders on SPECIFICATIONS; uploader prompt and hint 4px apart; label→value 6px at tight line height, rows 8px on View and 12px between fields on Add / Update (as both frames draw it) — `FilterChip.tsx`, `category-fields.ts`, `AssetFormPanel.tsx`, `ImageField.tsx`, `ViewAssetPanel.tsx`, `fields.tsx`, plan Geometry
- [x] T034 First chip reads `All items`, as every Assets frame but one draws it — `AssetsPage.tsx`, spec Story 1
- [x] T035 One pill height, 32px, across the app: `StatusPill` (all variants), `FilterChip`, the catalog Office tag, the review panel's stock badge — `StatusPill.tsx`, `FilterChip.tsx`, `ViewSpecsPanel.tsx`, `ReviewPanel.tsx`, additions
- [x] T036 Buttons stay 42px below 1440: `hit-area` on `BUTTON_SHAPE`, `FilterChip` and the Catalog card's add button, links exempted alike; `check-a11y-responsive` passes — `button-styles.ts`, `SupplyCard.tsx`, `index.css`, additions §3
- [x] T037 Drawn sizes at every width: the below-1440 touch-target rule gives every link and button an invisible 44px pseudo-element instead of a 44px minimum box, and no longer touches fields (T036's `hit-area` on buttons and chips dropped as redundant); no control changes height between 1440 and 1425; no target takes a neighbour's clicks at 1425 / 768 / 390; `check-a11y-responsive` passes — `index.css`, additions §3
- [x] T038 Pagination re-read against the `pagination *` components: 36px, r4, Regular 14 `#313131`, Codev Red active page (the instance's fill style), 6px / 48px gaps all match; disabled Back / Next is now the resting control at 30% opacity, as `state=disabled` draws it — `Pagination.tsx`
- [x] T039 Truncated text no longer clips descenders (select value and options, table cells, top bar): `.truncate` block padding with a cancelling negative margin — `index.css`, additions
- [x] T040 Review of T032–T039: the Catalog card's add button no longer clips its own hit area; the 24px checkbox gets `hit-area`; spec 002 FR-012 / SC-005 amended for drawn sizes; `check-shell` and `check-a11y-responsive` hit-test the 44px area instead of reading its size (both fail on a clipped or missing area); an image refusal is announced; `useDeepLinkedRequest`, `Select`, `AssetFormPanel`, `ImageField` cleared of react-doctor findings — `SupplyCard.tsx`, `Checkbox.tsx`, `ImageField.tsx`, `deep-link.ts`, spec 002, scripts
- [x] T041 PR review: the Assets table's cells are readable text and the item name is the row's control, stretched over the row so the whole row still opens View Asset; Category carries `aria-required`; a failed refresh after a save keeps the list, says the save went through, and offers Refresh; a source refusal on a specification row clears as it is edited — `AssetsPage.tsx`, `AssetFormPanel.tsx`, `asset-store.ts`, `TableToolbar.tsx`
- [x] T042 Review of T041: a failed refresh after a save writes the saved asset into the stale list, so View and Update read what was saved and a second save cannot undo the first; one loader serves reload and save; the stale notice and the no-match line show together; the scrolling table is a focusable region, as the Requests Queue's is; the row's focus ring outlines the whole row; `check-assets` covers Stories 1–3 and the stale path (fails on the old behaviour) — `asset-store.ts`, `TableToolbar.tsx`, `AssetsPage.tsx`, `scripts/check-assets.mjs`
- [x] T043 Review of T042: the seeded `update` rejects an unknown id rather than throwing; new assets lead the list and Add returns the table to page 1, so the added row is in view (order recorded in the plan); `check-assets` records a timed-out step as a failed check, counts a crash as a failure, and asserts the notice clears; contracts README conflict 3 puts the threshold on Add and Update — `seeded-asset-source.ts`, `asset-store.ts`, `AssetsPage.tsx`, `scripts/check-assets.mjs`, plan, contracts README
- [x] T044 Review of T043: the plan no longer assumes a sort field the contract does not publish; the page-1 note is limited to an unfiltered table (filters are left as set); `check-assets` asserts the unknown-id rejection — plan, `AssetsPage.tsx`, `scripts/check-assets.mjs`

## Not in this feature

Inventory (BEN-150: BEN-107, BEN-108, BEN-152) · wiring to HTTP (spec D1) · delete / deactivate asset.
