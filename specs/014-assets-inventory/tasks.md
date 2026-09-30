# Tasks: Assets

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)
**Amended**: 2026-09-30 — Inventory (old T010, T011) withdrawn to BEN-107 / BEN-108; Phase 5 realigns to constitution 7.0.0

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
- [x] T009 [BEN-84] View Asset panel; Update Asset (prefill + custom-spec row) — `src/features/assets/ViewAssetPanel.tsx`, `AssetFormPanel.tsx`

## Phase 3 — Inventory (withdrawn 2026-09-30)

- ~~T010 [BEN-107] Inventory table, derived pill, disabled `+ Add Inventory` (D10)~~ — retired by ADR-0008; BEN-107 builds the unit table
- ~~T011 [BEN-108] Update stocks panel: threshold, five steppers floored at Reserved, atomic save~~ — retired by ADR-0008; BEN-108 builds the unit panels; the threshold moves to T017

## Phase 4 — Records and checks

- [x] T012 Record the contract conflicts — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T013 List spec 014 — `specs/README.md`
- [x] T014 [BEN-85] `npm run lint`, `npm run build`; walk the success criteria in the browser

## Phase 5 — Realign to constitution 7.0.0 (2026-09-30)

- [x] T015 Renumber the spec folder 008 → 014 and contract conflicts 4/5 → 8/9 — `specs/`, `contracts/README.md`, `src/features/assets/*`
- [x] T016 Stock as counts of units by status: `StockLevels = { available, reserved }`, `deployed` → `assigned`; drop `setStock` / `StockChange` (D9) — `types.ts`, `stock.ts`, `asset-source.ts`, `asset-store.ts`, `seeded-asset-source.ts`
- [x] T017 [BEN-84] `STOCKS · Low-stock threshold` on Update Asset; whole number ≥ 0 (D8, FR-007) — `AssetFormPanel.tsx`, `category-fields.ts`
- [x] T018 [BEN-82] Subtitle `Assigned and available units`; column `ASSIGNED UNITS` — `AssetsPage.tsx`
- [x] T019 Remove the Inventory screen and Update stocks panel; restore the `/inventory` placeholder — `src/features/inventory/`, `src/app/routes.tsx`, `src/app/placeholders.tsx`
- [x] T020 Amend spec, plan, tasks and additions §3k — `specs/014-assets-inventory/*`, `docs/design-system/additions.md`
- [x] T021 `npm run lint`, `npm run build`; walk SC-001–SC-003 in the browser

## Not in this feature

Inventory (BEN-107, BEN-108) · wiring to HTTP (spec D1) · delete / deactivate asset.
