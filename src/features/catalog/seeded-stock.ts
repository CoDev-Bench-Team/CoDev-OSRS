import type { CatalogOffice } from './types';

/** Seeded Available stock, per (asset, office), held in memory (spec 011 D11).
 *
 *  The catalog's seeded source reads from it and the seeded request submit
 *  reserves out of it, so a demo submit visibly lowers the Catalog's numbers
 *  before any backend exists. Like every seeded source it resets on reload
 *  (constitution IX: non-production placeholders).
 *
 *  It models Available only. Reserved and Total are the backend's (constitution
 *  III); nothing in the SPA reads them yet. */
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
  for (const { id, stock } of seed) {
    for (const [office, n] of Object.entries(stock) as [CatalogOffice, number][]) levels.set(key(id, office), n);
  }
  const available = (assetId: string, office: CatalogOffice) => levels.get(key(assetId, office)) ?? 0;

  return {
    available,
    reserve(lines, office) {
      // Each line on its own first, so a 0 or a negative cannot hide inside a
      // valid sum; then per asset, so two lines for one asset cannot each pass
      // alone.
      const wanted = new Map<string, number>();
      for (const { assetId, quantity } of lines) {
        if (!Number.isInteger(quantity) || quantity < 1) return { assetId, reason: 'invalid-quantity' };
        wanted.set(assetId, (wanted.get(assetId) ?? 0) + quantity);
      }
      for (const [assetId, quantity] of wanted) {
        if (quantity > available(assetId, office)) return { assetId, reason: 'short' };
      }
      for (const [assetId, quantity] of wanted) levels.set(key(assetId, office), available(assetId, office) - quantity);
      return null;
    },
  };
}
