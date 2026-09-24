import type { Asset, AssetDraft, StockChange } from './types';

/** The Assets and Inventory boundary (spec 008 D1; mirrors spec 003's
 *  `SessionSource` and spec 006's `AssignedEquipmentSource`).
 *
 *  No endpoint, payload or error code lives behind this name. The live contract
 *  keeps stock as one row per physical unit and exposes no per-office Total /
 *  Reserved and no way to set a quantity per office, so today's only
 *  implementation is seeded (`seeded-asset-source.ts`). When the stock model is
 *  settled, a contract-backed implementation replaces it in `asset-store.ts`
 *  and no page changes.
 *
 *  Every mutation either resolves with the saved asset or rejects. A refusal a
 *  form can act on rejects with the published `ValidationProblem`
 *  (`shared/validation.ts`), whose pointers name fields in `AssetDraft` /
 *  `StockChange` terms. `setStock` applies the threshold and all five offices
 *  together or not at all (FR-007). */
export interface AssetSource {
  list(): Promise<Asset[]>;
  create(draft: AssetDraft): Promise<Asset>;
  update(id: string, draft: AssetDraft): Promise<Asset>;
  setStock(id: string, change: StockChange): Promise<Asset>;
}
