import type { Office } from '../auth/types';
import { unitRegister } from '../inventory/seeded-unit-register';
import type { CatalogOffice } from './types';

/** Seeded Available stock, per (asset, office), held in memory (spec 011 D11).
 *
 *  The catalog's seeded source reads from it and the seeded request submit
 *  reserves out of it, so a demo submit visibly lowers the Catalog's numbers
 *  before any backend exists. Like every seeded source it resets on reload
 *  (constitution IX: non-production placeholders).
 *
 *  It models Available only, and only for assets in its seed. An asset created
 *  in the session is not in that map: Available for it is the count of
 *  Available units in the unit register. Reserving one of those goes through
 *  the register, not this map, so a seeded asset's numbers stay on the map. */
declare global {
  /** Development-only hooks for the check scripts (spec 011 D19). Never set
   *  in production: every writer is behind `import.meta.env.DEV`. Each module
   *  that owns a hook declares its own field here, by interface merging. */
  interface OsrsDevHooks {
    seededStock?: SeededStock;
  }
  interface Window {
    __osrs?: OsrsDevHooks;
  }
}

export type SeededStock = {
  /** True when this asset's Available lives in the seeded map. */
  knows(assetId: string): boolean;
  available(assetId: string, office: CatalogOffice): number;
  /** All-or-nothing: every line is checked before any is moved. Each line's
   *  quantity must be a whole number of at least 1, and the lines for one
   *  asset, summed, must not exceed its Available. Returns the first line that
   *  cannot be satisfied and why — `invalid-quantity` or `short` — or `null`
   *  once all are reserved. Available never goes negative. */
  reserve(lines: readonly { assetId: string; quantity: number }[], office: CatalogOffice): ReserveFailure | null;
};

/** Why `reserve` refused, so the caller can word a bad quantity differently
 *  from a stock shortage. */
export type ReserveFailure = { assetId: string; reason: 'invalid-quantity' | 'short' };

export function createSeededStock(
  seed: readonly { id: string; stock: Partial<Record<CatalogOffice, number>> }[],
): SeededStock {
  const key = (assetId: string, office: CatalogOffice) => `${assetId}|${office}`;
  const levels = new Map<string, number>();
  const seededIds = new Set<string>();
  for (const { id, stock } of seed) {
    seededIds.add(id);
    for (const [office, n] of Object.entries(stock) as [CatalogOffice, number][]) levels.set(key(id, office), n);
  }
  const mapped = (assetId: string, office: CatalogOffice) => levels.get(key(assetId, office)) ?? 0;
  const available = (assetId: string, office: CatalogOffice) => {
    if (seededIds.has(assetId)) return mapped(assetId, office);
    return unitRegister.stockFor(assetId)[office as Office].available;
  };

  return {
    knows: (assetId) => seededIds.has(assetId),
    available,
    reserve(lines, office) {
      // Each line on its own first, so a 0 or a negative cannot hide inside a
      // valid sum; then per asset, so two lines for one asset cannot each pass
      // alone. Only seeded assets move this map. A session asset is short here
      // so a caller cannot decrement a key the register still holds.
      const wanted = new Map<string, number>();
      for (const { assetId, quantity } of lines) {
        if (!Number.isInteger(quantity) || quantity < 1) return { assetId, reason: 'invalid-quantity' };
        wanted.set(assetId, (wanted.get(assetId) ?? 0) + quantity);
      }
      for (const [assetId, quantity] of wanted) {
        if (!seededIds.has(assetId) || quantity > mapped(assetId, office)) return { assetId, reason: 'short' };
      }
      for (const [assetId, quantity] of wanted) levels.set(key(assetId, office), mapped(assetId, office) - quantity);
      return null;
    },
  };
}
