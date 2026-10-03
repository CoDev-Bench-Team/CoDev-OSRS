import type { InventoryStatus, StockStatus } from '../../shared/ui';
import type { Asset } from './types';

/** The stock arithmetic, in one place (constitution III, spec 014 D9, D11). */

/** Derived, never stored. The threshold is inclusive: an item sitting exactly
 *  on it is already low — the same rule as the live contract's `stockLevel`
 *  filter and the catalog. */
function stockStatus(availableUnits: number, lowStockThreshold: number): StockStatus {
  if (availableUnits <= 0) return 'Out of Stock';
  if (availableUnits <= lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}

/** The same band in the `Inventory Status` pill's words, as View Asset draws
 *  it beside the item name — the catalog's labels for the catalog's rule. */
const PILL: Record<StockStatus, InventoryStatus> = {
  'In Stock': 'Available',
  'Low Stock': 'Low in Stock',
  'Out of Stock': 'Out of Stock',
};

export function assetInventoryStatus(asset: Pick<Asset, 'available' | 'lowStockThreshold'>): InventoryStatus {
  return PILL[stockStatus(asset.available, asset.lowStockThreshold)];
}
