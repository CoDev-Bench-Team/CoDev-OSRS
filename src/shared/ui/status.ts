/** The request and stock status vocabulary.
 *
 *  `RequestStatus` is exactly the states constitution 3.0.0 IV admits and
 *  nothing else: an illegal state is unrepresentable.
 *
 *  After `Approved` the Admin sets either `For Delivery` or `For Pickup`. They
 *  are peers, not a sequence — the Requests Queue filters by each, and a filter
 *  counts a stored value, not a label — and the Admin then sets `Completed`.
 *  `For Release` and `Released` are retired, and so is the employee's
 *  confirm-receipt step (ADR-0007).
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
  'For Pickup',
  'Completed',
  'Cancelled',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const AVAILABILITIES = ['available', 'unavailable'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** Colour meaning: amber = waiting on a human · green = moving · red = stopped
 *  by a decision · purple = closed, done · slate = stopped without a decision.
 *
 *  The first three were the whole vocabulary until the 2026-09-15 re-export.
 *  The designer then gave `Completed` a purple of its own — it is no longer
 *  "green, moving or done" but an end state — and `Cancelled` the neutral slate
 *  the file already carries as `Status/Cancelled`. Both are recorded in
 *  docs/design-system/drift-2026-09-15.md. `For Delivery` and `For Pickup` are
 *  moving, so both are green — ADR-0007 adds no colour for them. */
export type StatusTone = 'pending' | 'ready' | 'rejected' | 'completed' | 'cancelled';

export const REQUEST_TONE: Record<RequestStatus, StatusTone> = {
  'Pending Approval': 'pending',
  Approved: 'ready',
  Rejected: 'rejected',
  'For Delivery': 'ready',
  'For Pickup': 'ready',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

export const STOCK_TONE: Record<StockStatus, StatusTone> = {
  'In Stock': 'ready',
  'Low Stock': 'pending',
  'Out of Stock': 'rejected',
};
