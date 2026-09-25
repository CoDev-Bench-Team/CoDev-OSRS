import type { StockStatus } from '../../shared/ui';
import { OFFICES } from '../auth/types';
import type { Asset, StockLevels } from './types';

/** The stock arithmetic, in one place (constitution III, spec 008 D9, D11). */

export function available({ total, reserved }: StockLevels): number {
  return total - reserved;
}

/** An asset's stock summed over the five offices. */
export function stockTotals(asset: Pick<Asset, 'stock'>): { total: number; available: number; reserved: number } {
  let total = 0;
  let reserved = 0;
  for (const office of OFFICES) {
    total += asset.stock[office].total;
    reserved += asset.stock[office].reserved;
  }
  return { total, available: total - reserved, reserved };
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

/** Clamp a proposed office Total so it can never undercut what is already
 *  reserved there — the only way the UI could break `Total = Available +
 *  Reserved` or make Available negative. Non-numbers fall back to the floor. */
export function clampTotal(proposed: number, reserved: number): number {
  if (!Number.isFinite(proposed)) return reserved;
  return Math.max(reserved, Math.trunc(proposed));
}
