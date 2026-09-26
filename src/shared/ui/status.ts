/** The request and stock status vocabulary.
 *
 *  `RequestStatus` is exactly the states constitution 4.0.0 IV admits and
 *  nothing else: an illegal state is unrepresentable.
 *
 *  After `Approved` the Admin sets either `For Delivery` or `Ready for Pickup`.
 *  They are peers, not a sequence — the Requests Queue filters by each, and a
 *  filter counts a stored value, not a label — and the Admin then sets
 *  `Completed`. The pickup state is named as the design's `Request Status`
 *  component names it, not as the queue's `For Pickup` chip does; the project
 *  owner chose the component (drift-2026-09-24 §6, constitution 3.0.1).
 *  `For Release` and `Released` are retired.
 *
 *  `Received` follows either handover state: the System sets it when the
 *  owning Employee submits the Accountability Form, and it is where stock is
 *  consumed. The Admin then sets `Completed`, from `Received` only
 *  (constitution 4.0.0, ADR-0008).
 *
 *  `Rejected` and `Cancelled` are both terminal and both need a reason, but
 *  they are different acts: a rejection is the Admin's decision on a pending
 *  request; a cancellation stops a request that was never refused — the owning
 *  Employee while it is pending, the Admin once it is approved or handed over.
 */

export const REQUEST_STATUSES = [
  'Pending Approval',
  'Approved',
  'Rejected',
  'For Delivery',
  'Ready for Pickup',
  'Received',
  'Completed',
  'Cancelled',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const AVAILABILITIES = ['available', 'unavailable'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** The design's `Inventory Status` component as the catalog uses it (2026-09-24
 *  export): the stock band of one asset at one office, drawn on the squarer
 *  8px chip. `02 - Catalog` and `02.1 - Catalog - View Specs` use it, and it
 *  replaced the `In Stock` label with `Available`.
 *
 *  The same component also carries per-unit states — `Assigned`,
 *  `In Storage`, `Reserved`, `Inactive` — for the unit register, which is out
 *  of scope for the MVP (constitution VIII). They are not modelled here.
 *
 *  `StockStatus` above is a different vocabulary on a different pill, and the
 *  Assets screen's chips still use it ("In stock / Low stock / Out of stock"). */
export const INVENTORY_STATUSES = ['Available', 'Low in Stock', 'Out of Stock'] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

/** Colour meaning: amber = waiting on a human · green = moving · red = stopped
 *  by a decision · purple = closed, done · slate = stopped without a decision ·
 *  pink / blue = handed over, by delivery / for pickup · orange = received,
 *  signed for, awaiting the Admin's close (drift-2026-09-26 §2).
 *
 *  The first three were the whole vocabulary until the 2026-09-15 re-export.
 *  The designer then gave `Completed` a purple of its own — it is no longer
 *  "green, moving or done" but an end state — and `Cancelled` the neutral slate
 *  the file already carries as `Status/Cancelled`. Both are recorded in
 *  docs/design-system/drift-2026-09-15.md.
 *
 *  ADR-0007 first put both handover states in green. Every screen drawn since,
 *  and the `Request Status` component, paint `For Delivery` pink and
 *  `Ready for Pickup` blue, and the project owner adopted the drawn pairs on
 *  2026-09-24 (drift-2026-09-24 §6). */
export type StatusTone =
  | 'pending'
  | 'ready'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'delivery'
  | 'pickup'
  | 'received';

export const REQUEST_TONE: Record<RequestStatus, StatusTone> = {
  'Pending Approval': 'pending',
  Approved: 'ready',
  Rejected: 'rejected',
  'For Delivery': 'delivery',
  'Ready for Pickup': 'pickup',
  Received: 'received',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

export const STOCK_TONE: Record<StockStatus, StatusTone> = {
  'In Stock': 'ready',
  'Low Stock': 'pending',
  'Out of Stock': 'rejected',
};
