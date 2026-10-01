# Implementation Plan: Assets

**Spec**: [spec.md](spec.md) · **Linear**: BEN-48 (H1 [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81))
**Date**: 2026-09-24 · **Amended**: 2026-10-01 (rebased on constitution 8.0.0; realigned to the 2026-10-01 export, [drift-2026-10-01](../../docs/design-system/drift-2026-10-01.md)); 2026-09-30 (constitution 7.0.0; Inventory split out) · **Status**: Draft

## Summary

One Admin screen and three panels, running on an in-memory seeded source behind an `AssetSource` boundary (spec D1). The category-dependent form is driven by one data table (D5). Stock status and the stock sums each live in one function. Stock is read-only here: counts of units by status (D9).

## Constitution Check (8.0.0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Spec 014, amended 2026-09-30 citing drift-2026-09-26 §2 and 2026-10-01 citing drift-2026-10-01 §4 |
| II. Two roles | PASS | Admin only (D12) |
| III. Inventory integrity | PASS | Counts are read, never written; Total is derived as Available + Reserved (D9) |
| VII. Typed contracts | PASS | No HTTP. The source speaks SPA vocabulary; its validation failures use the published RFC 9457 shape. Conflict 9 recorded (D6); conflict 10 withdrawn (D7) |
| VIII. MVP restraint | PASS | Assets only. The unit register is in scope, and is BEN-107 / BEN-108 |

## API shape assumed

**None is called.** What wiring will need, recorded in `contracts/README.md`:

| SPA need | Live contract | Gap |
|----------|---------------|-----|
| Asset CRUD | `GET/POST /assets`, `GET/PATCH /assets/{id}` | `model` required for all (conflict 9) |
| Units per asset by status | `GET /assets` returns `quantity` = Available units | Reserved and Assigned are not returned (conflict 1) |
| Threshold | `lowQtyAlert` on the asset, default 5 | none |

## Modules

```
src/features/assets/
  types.ts              Category, Asset, AssetDraft, StockLevels
  category-fields.ts    the per-category field table (D5, D6); threshold check
  stock.ts              stockTotals(), stockStatus(), assetInventoryStatus()  (D9, D11)
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

The seeded store is module state, so it resets on reload. It lists newest first: `create` puts the new asset at the head, and a save from Add Asset returns the table to page 1, so with no filter set the Admin sees the row they added. Wiring keeps that order if the contract's list is newest first; if it is not, the order is raised in `contracts/README.md` rather than sorted on a field the contract does not publish. Every mutation resolves with the saved asset or rejects; none throws.

## Key shapes

```ts
type StockLevels = { available: number; reserved: number };  // units by status; total = available + reserved
type Asset = {
  id: string; name: string; category: Category; model?: string; description?: string;
  image?: string;                                // data URI
  specs: Partial<Record<SpecKey, string>>;       // ram · storage · processor · graphics · operatingSystem
  lowStockThreshold: number;                     // D8: set on Add (prefilled 5), edited on Update
  assigned: number;                              // units in Assigned
  stock: Record<Office, StockLevels>;
};
type AssetDraft = Pick<Asset, 'name' | 'category' | 'model' | 'description' | 'image' | 'specs' | 'lowStockThreshold'>;
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

From the 2026-09-22 frames, re-read against the 2026-10-01 export, and the 2026-09-18 draft on `imp-admin-initial-screens`:

- Table header 48px `#f0f2f5`, 11px bold `#667085`; rows 68px (`row-height-inventory`) with a `#e3e6ec` rule.
- Assets columns 320 / 180 / 264 / 180 / 180 / fill. The selected filter chip's label is bold; 4px between a chip's label and its count.
- Panel 400px, header 22px display title with a close control, groups 32px apart, 14px heading→fields, 6px label→control and 12px between fields on Add and Update (line height = font size, so the gaps are the visible ones), group heading 14px bold muted. SPECIFICATIONS inputs carry an `e.g.` sample placeholder. The body is inset 14px (Add / Update) or 16px (View); the footer is a full-width band under a `border-warm` hairline, 9px over and 8px under its centred buttons.
- Fields 39px with a 6px radius and a `border-warm` hairline; Category is the same 39px box. Description is a single-line field on Add Asset and a 99px multi-line one on Update Asset (spec open question 4).
- Image uploader: a solid `border-strong` box with a 24px cloud-upload glyph, `Drop file or browse` 14px bold, and the format hint 13.5px in `ink-secondary`, 4px apart.
- Image 158px tall, full panel width, 8px radius. On Update Asset, three 40px chips (Replace, Download, Remove) stack 8px apart at the image's top right; each holds an 18px tinted tile (drift-2026-10-01 A5, A6).
- View Asset: Item Name carries the inventory pill; the last row is Low Stock Threshold; no Category row (A3). Labels 14px bold muted, values 14px bold `osrs-ink-800`, both on 21px lines; 6px label→value, each row at least 58px (the frame's fixed field height), 8px between rows, no rules.
- Chips, pager and side panel are the shared components, as the Requests Queue uses them.

## Risks

- The seeded numbers are the design's; the chip counts are computed, so they will not read `(238)` / `(7)` as drawn.
- When the contract publishes per-asset counts, `seeded-asset-source.ts` is replaced. If the counts arrive per office rather than summed, `stockTotals` is where that lands.
