import type { RequestStatus } from '../../../shared/ui';

/** What the review panel offers, derived from the request's status alone
 *  (spec 008 FR-005, plan D1).
 *
 *  An action missing from a status's row is never rendered. There is no
 *  "disabled" branch, so an illegal transition cannot be clicked because it is
 *  not on screen at all.
 *
 *  The table is exhaustive over `RequestStatus` (`satisfies Record<…>`), so a
 *  new status stops the build until it is given its row (plan D2). Complete is
 *  not in the table: it is offered only for a signed `Received` request. */
export type ReviewAction = 'approve' | 'reject' | 'updateStatus' | 'cancel' | 'complete' | 'close';

const ACTIONS = {
  'Pending Approval': ['reject', 'approve'],
  // Cancel sits left of the forward action, as Reject does (spec 008 plan D14).
  Approved: ['cancel', 'updateStatus'],
  // Its items are out with the delivery, so it cannot be cancelled; a failed
  // delivery goes back to Ready for Pickup first (constitution 8.0.0 IV).
  'For Delivery': ['updateStatus'],
  'Ready for Pickup': ['cancel', 'updateStatus'],
  // Unsigned `Received` offers nothing. Complete appears only once the
  // Accountability Form is signed (`reviewActions` second argument).
  Received: [],
  Rejected: ['close'],
  Cancelled: ['close'],
  Completed: ['close'],
} as const satisfies Record<RequestStatus, readonly ReviewAction[]>;

export function reviewActions(status: RequestStatus, signed = false): readonly ReviewAction[] {
  if (status === 'Received' && signed) return ['complete'];
  return ACTIONS[status];
}
