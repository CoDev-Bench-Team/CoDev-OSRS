import type { StockStatus } from '../../shared/ui';
import type { CatalogItem } from './types';

/** The one place the stock rule lives (FR-003).
 *
 *  The threshold is inclusive: an item sitting exactly on its low-quantity
 *  alert is already low, which is the only reading under which the alert
 *  fires before the shelf is emptier than intended.
 *
 *  Kept in this feature rather than in `shared/`. Inventory (Parent H) is the
 *  second caller and promoting this should be that feature's decision, not a
 *  speculative one taken here. */
export function stockStatus({ onHand, lowQtyAlert }: Pick<CatalogItem, 'onHand' | 'lowQtyAlert'>): StockStatus {
  if (onHand <= 0) return 'Out of Stock';
  if (onHand <= lowQtyAlert) return 'Low Stock';
  return 'In Stock';
}

/** Whether an item can be added to a request list at all (FR-009). */
export function isRequestable(item: Pick<CatalogItem, 'onHand' | 'lowQtyAlert'>): boolean {
  return item.onHand > 0;
}

/** Clamp a requested quantity into what the shelf can actually satisfy
 *  (FR-010). Never returns less than 1 for a requestable item, and never more
 *  than is on hand. */
export function clampQuantity(requested: number, onHand: number): number {
  if (onHand <= 0) return 0;
  return Math.min(Math.max(1, Math.trunc(requested)), onHand);
}
