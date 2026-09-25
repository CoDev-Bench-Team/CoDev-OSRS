# Implementation Plan: Assets and Inventory

**Spec**: [spec.md](spec.md) · **Linear**: BEN-48 (H1 [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81))
**Date**: 2026-09-24 · **Status**: Draft

## Summary

Two Admin screens and four panels, running on an in-memory seeded source behind an `AssetSource` boundary (spec D1). The category-dependent form is driven by one data table (D5). Stock status and the per-office arithmetic each live in one function.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Spec 008, citing drift-2026-09-22 §4 |
| II. Two roles | PASS | Admin only (D12) |
| III. Inventory integrity | PASS | The UI edits Total per office, floored at Reserved; Available is derived (D9) |
| VII. Typed contracts | PASS | No HTTP. The source speaks SPA vocabulary; its validation failures use the published RFC 9457 shape. Two new conflicts recorded (D6, D7) |
| VIII. MVP restraint | PASS | No per-unit field; `+ Add Inventory` disabled (D10) |

## API shape assumed

**None is called.** What wiring will need, recorded in `contracts/README.md`:

| SPA need | Live contract (2026-09-24) | Gap |
|----------|----------------------------|-----|
| Asset CRUD | `GET/POST /assets`, `GET/PATCH /assets/{id}` | `model` required for all (conflict 4); no custom spec (conflict 5) |
| Available per asset / office | `GET /assets?location=` returns `quantity` = Available units | Reserved, Total and Deployed are not returned |
| Set stock per office | — | Only per-unit create/delete on `/inventory-items` (conflict 1) |
| Threshold | `lowQtyAlert` on the asset | none |

## Modules

```
src/features/assets/
  types.ts              Category, Asset, AssetDraft, StockLevels, OFFICES
  category-fields.ts    the per-category field table (D5, D6)
  stock.ts              stockTotals(), stockStatus()  (D9, D11)
  asset-source.ts       AssetSource interface
  seeded-asset-source.ts in-memory source; validation failures as problem+json
  asset-store.ts        useAssets(): list + mutations over the active source
  AssetsPage.tsx        /assets
  AssetFormPanel.tsx    Add Asset / Update Asset
  ViewAssetPanel.tsx    View Asset
  ImageField.tsx        drop-or-browse uploader, .jpeg/.png, ≤25 MB
  TableToolbar.tsx      search + category + chips, shared by both pages
  useTableQuery.ts      filter + chip counts + pagination state
src/features/inventory/
  InventoryPage.tsx     /inventory
  UpdateStocksPanel.tsx threshold + one stepper per office
src/shared/
  validation.ts         problem+json → { field: message } (T003a; BEN-59 reuses it)
  ui/forms/fields.tsx   Field, TextInput, TextArea — the panel's drawn 39px field
```

Reused from `dev` rather than added: `SidePanel` (BEN-45), `Pagination`, `FilterChip` and the `table-columns` helpers (BEN-46).

Assets and Inventory read the same source, so an edit on one screen is on the other when you navigate. The seeded store is module state, so it resets on reload.

## Key shapes

```ts
type Office = 'Cebu' | 'Bacolod' | 'Makati' | 'Ortigas' | 'Davao';
type StockLevels = { total: number; reserved: number };  // available = total − reserved
type Asset = {
  id: string; name: string; category: Category; model?: string; description?: string;
  image?: string;                                // data URI
  specs: Partial<Record<SpecKey, string>>;       // ram · storage · processor · graphics · operatingSystem
  customSpecs: { key: string; value: string }[]; // D7
  lowStockThreshold: number;                     // D8
  deployed: number;                              // units consumed by completed requests
  stock: Record<Office, StockLevels>;
};
interface AssetSource {
  list(): Promise<Asset[]>;
  create(draft: AssetDraft): Promise<Asset>;
  update(id: string, draft: AssetDraft): Promise<Asset>;
  setStock(id: string, change: { lowStockThreshold: number; totals: Record<Office, number> }): Promise<Asset>;
}
```

`SpecKey` values are the contract's own field names, so wiring maps them one-to-one.

## Validation

Client-side first: the category's required set, the image rules, and integer ≥ 0 for the threshold. Anything the source refuses arrives as `{ type, title, status, errors: [{ detail, pointer }] }`; `fieldErrors()` turns `#/name` into `name` and the form shows `detail` under it. The client and the source share the rule table, so the source only refuses what the client already missed.

## Geometry

From the 2026-09-22 frames and the 2026-09-18 draft on `imp-admin-initial-screens`, which ported the same table and panel family:

- Table header 48px `#f0f2f5`, 11px bold `#667085`; rows 68px (`row-height-inventory`) with a `#e3e6ec` rule.
- Inventory columns 300 / 180 / 140 / 170 / 190 / fill / 92; Assets columns 300 / 160 / 200 / 160 / 200 / fill.
- Panel 400px, header 22px display title with a close control, groups 32px apart, 14px heading→fields, 12px between fields, group heading 14px bold muted, Cancel / Save Changes centred at the foot.
- Chips, pager and side panel are the shared components, as the Requests Queue uses them.

## Risks

- The seeded numbers are the design's; the chip counts are computed, so they will not read `(238)` / `(7)` as drawn.
- When the stock model is decided, `seeded-asset-source.ts` is replaced; if the answer is per-unit, D9's stepper becomes "add units / retire units" and this plan is revised.
