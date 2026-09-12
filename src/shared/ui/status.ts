/** The request and stock status vocabulary.
 *
 *  The design file's pill defines eleven statuses. Six of them are the legal
 *  request states; three are stock states; and two — "Ready for Pickup" and
 *  "For Delivery" — are not states at all.
 *
 *  Constitution IV fixes the request state machine, so `RequestStatus` is the
 *  six legal states and nothing else: an illegal state is unrepresentable.
 *  "Ready for Pickup" survives as a presentational label for `Released`,
 *  matching the notification docs/process-flow.md names "Items Ready for
 *  Pickup / Released". "For Delivery" is dropped — no transition produces it.
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

/** Presentational labels that differ from the state name. The underlying
 *  status is unchanged — this only affects what the pill reads. */
export const PICKUP_LABEL: Partial<Record<RequestStatus, string>> = {
  Released: 'Ready for Pickup',
};
