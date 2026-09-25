import type { InventoryStatus } from '../../shared/ui';
import type { CatalogItem } from './types';

/** The one place the stock rule lives (FR-003), in the design's `Inventory
 *  Status` vocabulary: `Available`, `Low in Stock`, `Out of Stock` (D10).
 *
 *  Read against Available at the selected office, not Total: reserved units
 *  cannot be requested (constitution III). The threshold is inclusive: an
 *  item sitting exactly on its low-quantity alert is already low, which is the
 *  only reading under which the alert fires before the shelf is emptier than
 *  intended.
 *
 *  Kept in this feature rather than in `shared/`. Inventory (Parent H) is the
 *  second caller and promoting this should be that feature's decision, not a
 *  speculative one taken here. */
export function stockStatus({ available, lowQtyAlert }: Pick<CatalogItem, 'available' | 'lowQtyAlert'>): InventoryStatus {
  if (available <= 0) return 'Out of Stock';
  if (available <= lowQtyAlert) return 'Low in Stock';
  return 'Available';
}

/** Whether an item can be added to a request list at all (FR-009). */
export function isRequestable(item: Pick<CatalogItem, 'available'>): boolean {
  return item.available > 0;
}

/** Clamp a requested quantity into what the shelf can actually satisfy
 *  (FR-010). Never returns less than 1 for a requestable item, and never more
 *  than is available at the selected office. */
export function clampQuantity(requested: number, available: number): number {
  if (available <= 0) return 0;
  return Math.min(Math.max(1, Math.trunc(requested)), available);
}
