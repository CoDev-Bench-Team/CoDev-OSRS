import type { RequestStatus } from '../../shared/ui';

/** `02.2.2.1` draws the rejection reason as a red callout under the timeline.
 *  A cancellation reason takes the same shape in the Cancelled pill's slate
 *  (additions.md §3h, §3j). */
const REJECTED_TONE = 'border-status-rejected-fg bg-status-rejected-bg text-status-rejected-fg';
const CANCELLED_TONE = 'border-status-cancelled-fg bg-status-cancelled-bg text-status-cancelled-fg';

export interface StoppedFacts {
  status: RequestStatus;
  rejection?: { reason: string };
  cancellation?: { reason: string };
}

export interface Stopped {
  label: 'Reason for rejection' | 'Reason for cancellation';
  /** `null` when the source stored none. Constitution IV requires one, but a
   *  source can still omit it, and the panel says so rather than showing an
   *  empty callout (spec 013 edge case, additions.md §3j). */
  reason: string | null;
  tone: string;
}

/** Said in place of a reason the source did not store. */
export const NO_REASON = 'No reason recorded';

/** Why a stopped request stopped, with the label and tone its status takes.
 *  `null` for any status other than `Rejected` and `Cancelled`. */
export function stoppedReason(request: StoppedFacts): Stopped | null {
  if (request.status === 'Rejected') {
    return { label: 'Reason for rejection', reason: request.rejection?.reason.trim() || null, tone: REJECTED_TONE };
  }
  if (request.status === 'Cancelled') {
    return { label: 'Reason for cancellation', reason: request.cancellation?.reason.trim() || null, tone: CANCELLED_TONE };
  }
  return null;
}
