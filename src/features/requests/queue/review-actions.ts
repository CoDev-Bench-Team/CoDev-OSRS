import type { RequestStatus } from '../../../shared/ui';

/** What the review panel offers, derived from the request's status alone
 *  (spec 008 FR-005, plan D1).
 *
 *  An action missing from a status's row is never rendered. There is no
 *  "disabled" branch, so an illegal transition cannot be clicked because it is
 *  not on screen at all.
 *
 *  The table is exhaustive over `RequestStatus` (`satisfies Record<…>`). When
 *  BEN-134 (constitution 4.0.0) adds `Received`, this file stops compiling until
 *  that status is given its row, which is where Complete goes (plan D2, D9).
 *  Until then, no status offers Complete (spec 008 FR-010, FR-012). */
export type ReviewAction = 'approve' | 'reject' | 'updateStatus' | 'close';

const ACTIONS = {
  'Pending Approval': ['reject', 'approve'],
  Approved: ['updateStatus'],
  'For Delivery': ['updateStatus'],
  'Ready for Pickup': ['updateStatus'],
  Rejected: ['close'],
  Cancelled: ['close'],
  Completed: ['close'],
} as const satisfies Record<RequestStatus, readonly ReviewAction[]>;

export function reviewActions(status: RequestStatus): readonly ReviewAction[] {
  return ACTIONS[status];
}
