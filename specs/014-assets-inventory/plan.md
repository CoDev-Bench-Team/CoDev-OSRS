# Implementation Plan: Assets

**Spec**: [spec.md](spec.md) · **Linear**: BEN-48 (H1 [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81))
**Date**: 2026-09-24 · **Amended**: 2026-09-30 (constitution 7.0.0; Inventory split out) · **Status**: Draft

## Summary

One Admin screen and three panels, running on an in-memory seeded source behind an `AssetSource` boundary (spec D1). The category-dependent form is driven by one data table (D5). Stock status and the stock sums each live in one function. Stock is read-only here: counts of units by status (D9).

## Constitution Check (7.0.0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Spec 014, amended 2026-09-30 citing drift-2026-09-26 §2 |
| II. Two roles | PASS | Admin only (D12) |
| III. Inventory integrity | PASS | Counts are read, never written; Total is derived as Available + Reserved (D9) |
| VII. Typed contracts | PASS | No HTTP. The source speaks SPA vocabulary; its validation failures use the published RFC 9457 shape. Conflicts 8 and 9 recorded (D6, D7) |
| VIII. MVP restraint | PASS | Assets only. The unit register is in scope, and is BEN-107 / BEN-108 |

## API shape assumed

**None is called.** What wiring will need, recorded in `contracts/README.md`:

| SPA need | Live contract | Gap |
|----------|---------------|-----|
| Asset CRUD | `GET/POST /assets`, `GET/PATCH /assets/{id}` | `model` required for all (conflict 8); no custom spec (conflict 9) |
| Units per asset by status | `GET /assets` returns `quantity` = Available units | Reserved and Assigned are not returned (conflict 1) |
| Threshold | `lowQtyAlert` on the asset, default 5 | none |

## Modules

```
src/features/assets/
  types.ts              Category, Asset, AssetDraft, StockLevels
  category-fields.ts    the per-category field table (D5, D6); threshold check
  stock.ts              stockTotals(), stockStatus()  (D9, D11)
  asset-source.ts       AssetSource interface
  seeded-asset-source.ts in-memory source; validation failures as problem+json
  asset-store.ts        useAssets(): list + mutations over the active source
  AssetsPage.tsx        /assets
  AssetFormPanel.tsx    Add Asset / Update Asset
  ViewAssetPanel.tsx    View Asset
  ImageField.tsx        drop-or-browse uploader, .jpeg/.png, ≤25 MB
  TableToolbar.tsx      search + category + chips
  useTableQuery.ts      filter + chip counts + pagination state
src/shared/
  ui/forms/fields.tsx   Field, TextInput, TextArea — the panel's drawn 39px field
```

`src/shared/validation.ts` (`fieldErrors`, `pointerToField`) is on `dev` already. Reused from `dev`: `SidePanel`, `Pagination`, `FilterChip` and the `table-columns` helpers.

The seeded store is module state, so it resets on reload.

## Key shapes

```ts
type StockLevels = { available: number; reserved: number };  // units by status; total = available + reserved
type Asset = {
  id: string; name: string; category: Category; model?: string; description?: string;
  image?: string;                                // data URI
  specs: Partial<Record<SpecKey, string>>;       // ram · storage · processor · graphics · operatingSystem
  customSpecs: { key: string; value: string }[]; // D7
  lowStockThreshold: number;                     // D8
  assigned: number;                              // units in Assigned
  stock: Record<Office, StockLevels>;
};
type AssetDraft = Pick<Asset, 'name' | 'category' | 'model' | 'description' | 'image' | 'specs' | 'customSpecs'>
  & { lowStockThreshold?: number };             // Update Asset only
interface AssetSource {
  list(): Promise<Asset[]>;
  create(draft: AssetDraft): Promise<Asset>;
  update(id: string, draft: AssetDraft): Promise<Asset>;
}
```

`SpecKey` values are the contract's own field names, so wiring maps them one-to-one; `lowStockThreshold` maps to `lowQtyAlert`.

## Validation

Client-side first: the category's required set, the image rules, and a whole number ≥ 0 for the threshold. Anything the source refuses arrives as `{ type, title, status, errors: [{ detail, pointer }] }`; `fieldErrors()` turns `#/name` into `name` and the form shows `detail` under it. The client and the source share the rule table, so the source only refuses what the client already missed.

## Geometry

From the 2026-09-22 frames (unchanged in layout since) and the 2026-09-18 draft on `imp-admin-initial-screens`:

- Table header 48px `#f0f2f5`, 11px bold `#667085`; rows 68px (`row-height-inventory`) with a `#e3e6ec` rule.
- Assets columns 300 / 160 / 200 / 160 / 200 / fill.
- Panel 400px, header 22px display title with a close control, groups 32px apart, 14px heading→fields, 12px between fields, group heading 14px bold muted, Cancel / Save Changes centred at the foot.
- Chips, pager and side panel are the shared components, as the Requests Queue uses them.

## Risks

- The seeded numbers are the design's; the chip counts are computed, so they will not read `(238)` / `(7)` as drawn.
- When the contract publishes per-asset counts, `seeded-asset-source.ts` is replaced. If the counts arrive per office rather than summed, `stockTotals` is where that lands.
