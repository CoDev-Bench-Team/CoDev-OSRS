# Tasks: Assets and Inventory

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Format: `- [ ] [TaskID] [Linear] Description — path`

## Phase 1 — Foundations

- [x] T001 Move `Office` to the contract's `Ortigas` (D3) — `src/features/auth/types.ts`
- [x] T002 Shared problem+json parser (spec 001 T003a) — `src/shared/validation.ts`
- [x] T003 Panel fields; reuse `SidePanel`, `Pagination`, `FilterChip`, `table-columns` from `dev` — `src/shared/ui/forms/fields.tsx`, `src/shared/ui/index.ts`
- [x] T004 Asset model, category field table, stock rules — `src/features/assets/types.ts`, `category-fields.ts`, `stock.ts`
- [x] T005 `AssetSource`, seeded source, `useAssets` — `src/features/assets/asset-source.ts`, `seeded-asset-source.ts`, `asset-store.ts`
- [x] T006 Replace the `/assets` and `/inventory` placeholders from BEN-114 (D12) — `src/app/routes.tsx`, `src/app/placeholders.tsx`

## Phase 2 — Assets

- [x] T007 [BEN-82] Assets table, toolbar, chips, pagination, empty state, row → View — `src/features/assets/AssetsPage.tsx`, `TableToolbar.tsx`, `useTableQuery.ts`
- [x] T008 [BEN-83] Add Asset panel from the field table; image uploader; per-field errors — `src/features/assets/AssetFormPanel.tsx`, `ImageField.tsx`
- [x] T009 [BEN-84] View Asset panel; Update Asset (prefill + custom-spec row) — `src/features/assets/ViewAssetPanel.tsx`, `AssetFormPanel.tsx`

## Phase 3 — Inventory

- [x] T010 [BEN-107] Inventory table, derived pill, disabled `+ Add Inventory` (D10) — `src/features/inventory/InventoryPage.tsx`
- [x] T011 [BEN-108] Update stocks panel: threshold, five steppers floored at Reserved, atomic save, link to Update Asset — `src/features/inventory/UpdateStocksPanel.tsx`

## Phase 4 — Records and checks

- [x] T012 Record conflicts 1–5 as of 2026-09-24 — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T013 List spec 008 — `specs/README.md`
- [x] T014 [BEN-85] `npm run lint`, `npm run build`; walk SC-001–SC-003 in the browser

## Not in this feature

Wiring to HTTP (spec D1) · per-unit register (D10) · delete / deactivate asset.
