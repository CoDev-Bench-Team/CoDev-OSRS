import type { Asset, AssetDraft } from './types';

/** The Assets boundary (spec 014 D1; mirrors spec 003's `SessionSource` and
 *  spec 006's `AssignedEquipmentSource`).
 *
 *  No endpoint, payload or error code lives behind this name. The live
 *  contract's `GET /assets` returns Available alone and no Reserved or Assigned
 *  count, so today's only implementation is seeded (`seeded-asset-source.ts`).
 *  When the counts are published, a contract-backed implementation replaces it
 *  in `asset-store.ts` and no page changes.
 *
 *  Stock is read-only here. Units are added, removed and made inactive on
 *  Inventory (BEN-107, BEN-108), and only the request pipeline reserves or
 *  assigns them (constitution III).
 *
 *  Every mutation either resolves with the saved asset or rejects. A refusal a
 *  form can act on rejects with the published `ValidationProblem`
 *  (`shared/validation.ts`), whose pointers name fields in `AssetDraft` terms. */
export interface AssetSource {
  list(): Promise<Asset[]>;
  create(draft: AssetDraft): Promise<Asset>;
  update(id: string, draft: AssetDraft): Promise<Asset>;
}
