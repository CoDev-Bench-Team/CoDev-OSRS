import type { StockStatus } from '../../shared/ui';
import { OFFICES } from '../auth/types';
import type { Asset } from './types';

/** The stock arithmetic, in one place (constitution III, spec 014 D9, D11). */

/** An asset's stock summed over the five offices. Total is Available +
 *  Reserved: the units still in the store. */
export function stockTotals(asset: Pick<Asset, 'stock'>): { total: number; available: number; reserved: number } {
  let available = 0;
  let reserved = 0;
  for (const office of OFFICES) {
    available += asset.stock[office].available;
    reserved += asset.stock[office].reserved;
  }
  return { total: available + reserved, available, reserved };
}

/** Derived, never stored. The threshold is inclusive: an item sitting exactly
 *  on it is already low — the same rule as the live contract's `stockLevel`
 *  filter and the catalog. */
export function stockStatus(availableUnits: number, lowStockThreshold: number): StockStatus {
  if (availableUnits <= 0) return 'Out of Stock';
  if (availableUnits <= lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}

export function assetStockStatus(asset: Pick<Asset, 'stock' | 'lowStockThreshold'>): StockStatus {
  return stockStatus(stockTotals(asset).available, asset.lowStockThreshold);
}
