/** The request and stock status vocabulary.
 *
 *  The design file's pill defines eleven statuses. Six of them are the legal
 *  request states; three are stock states; and two — "Ready for Pickup" and
 *  "For Delivery" — are not states at all.
 *
 *  Constitution IV fixes the request state machine, so `RequestStatus` is the
 *  six legal states and nothing else: an illegal state is unrepresentable.
 *  Both mockup words survive as presentational labels for `Released`, naming
 *  how the items reach the employee: pickup matches the notification name in
 *  docs/process-flow.md ("Items Ready for Pickup / Released"), delivery is the
 *  handover-in-person wording. Neither adds a state (spec 002, D5 amended).
 */

export const REQUEST_STATUSES = [
  'Pending Approval',
  'Approved',
  'Rejected',
  'For Release',
  'Released',
  'Completed',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const AVAILABILITIES = ['available', 'unavailable'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** Colour meaning, fixed across the product:
 *  amber = waiting on a human · green = moving or done · red = stopped. */
export type StatusTone = 'pending' | 'ready' | 'rejected';

export const REQUEST_TONE: Record<RequestStatus, StatusTone> = {
  'Pending Approval': 'pending',
  Approved: 'ready',
  Rejected: 'rejected',
  'For Release': 'ready',
  Released: 'ready',
  Completed: 'ready',
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
