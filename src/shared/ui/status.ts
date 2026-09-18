/** The request and stock status vocabulary.
 *
 *  `RequestStatus` is exactly the states constitution IV admits and nothing
 *  else: an illegal state is unrepresentable. Two of the design file's labels —
 *  "Ready for Pickup" and "For Delivery" — are not states at all; they survive
 *  as presentational labels for `Released`, naming how the items reach the
 *  employee. Pickup matches the notification name in docs/process-flow.md
 *  ("Items Ready for Pickup / Released"); delivery is the handover wording.
 *  Neither adds a state (spec 002, D5 amended).
 *
 *  `Cancelled` DOES add one. It arrived with the 2026-09-15 design re-export
 *  and is a stopped-before-completion terminal state, distinct from `Rejected`:
 *  a rejection is an Approver's decision on a pending request, a cancellation
 *  is the requester or the Supply Admin stopping a request that was never
 *  refused. Constitution 2.0.0 redefines principle IV to admit it; the path,
 *  the inventory restore and the notification are in docs/process-flow.md.
 */

export const REQUEST_STATUSES = [
  'Pending Approval',
  'Approved',
  'Rejected',
  'For Release',
  'Released',
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
 *  docs/design-system/drift-2026-09-15.md. */
export type StatusTone = 'pending' | 'ready' | 'rejected' | 'completed' | 'cancelled';

export const REQUEST_TONE: Record<RequestStatus, StatusTone> = {
  'Pending Approval': 'pending',
  Approved: 'ready',
  Rejected: 'rejected',
  'For Release': 'ready',
  Released: 'ready',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

export const STOCK_TONE: Record<StockStatus, StatusTone> = {
  'In Stock': 'ready',
  'Low Stock': 'pending',
  'Out of Stock': 'rejected',
};

/** How released items reach the employee. This is presentation only — the
 *  request is `Released` either way. */
export const HANDOVERS = ['pickup', 'delivery'] as const;
export type Handover = (typeof HANDOVERS)[number];

/** Presentational labels that differ from the state name. The underlying
 *  status is unchanged — this affects what the pill reads and, because each
 *  handover has its own colour pair, how it is coloured. */
export const HANDOVER_LABEL: Record<Handover, Partial<Record<RequestStatus, string>>> = {
  pickup: { Released: 'Ready for Pickup' },
  delivery: { Released: 'For Delivery' },
};
