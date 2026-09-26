import type { RequestStatus } from '../../../shared/ui';

/** What the review panel offers, derived from the request's status alone
 *  (spec 008 FR-005, plan D1).
 *
 *  An action missing from a status's row is never rendered. There is no
 *  "disabled" branch, so an illegal transition cannot be clicked because it is
 *  not on screen at all.
 *
 *  The table is exhaustive over `RequestStatus` (`satisfies Record<…>`), so a
 *  new status stops the build until it is given its row (plan D2). No status
 *  offers Complete yet (spec 008 FR-010, FR-012). */
export type ReviewAction = 'approve' | 'reject' | 'updateStatus' | 'close';

const ACTIONS = {
  'Pending Approval': ['reject', 'approve'],
  Approved: ['updateStatus'],
  'For Delivery': ['updateStatus'],
  'Ready for Pickup': ['updateStatus'],
  // Constitution 5.0.0 adopted `Received` (ADR-0009). Complete is its action,
  // and it is not built yet (spec 008 Story 4). Until it is, the panel offers
  // nothing here; ✕ still closes it.
  Received: [],
  Rejected: ['close'],
  Cancelled: ['close'],
  Completed: ['close'],
} as const satisfies Record<RequestStatus, readonly ReviewAction[]>;

export function reviewActions(status: RequestStatus): readonly ReviewAction[] {
  return ACTIONS[status];
}
