import type { RequestStatus } from '../../shared/ui';

/** `02.2.2.1` draws the rejection reason as a red callout under the timeline.
 *  A cancellation reason takes the same shape in the Cancelled pill's slate
 *  (additions.md §3h, §3i). */
const REJECTED_TONE = 'border-status-rejected-fg bg-status-rejected-bg text-status-rejected-fg';
const CANCELLED_TONE = 'border-status-cancelled-fg bg-status-cancelled-bg text-status-cancelled-fg';

export interface StoppedFacts {
  status: RequestStatus;
  rejection?: { reason: string };
  cancellation?: { reason: string };
}

export interface Stopped {
  label: 'Reason for rejection' | 'Reason for cancellation';
  reason: string;
  tone: string;
}

/** Why a stopped request stopped, with the label and tone its status takes.
 *  `null` for any other status, and for one with no stored reason. */
export function stoppedReason(request: StoppedFacts): Stopped | null {
  if (request.status === 'Rejected' && request.rejection) {
    return { label: 'Reason for rejection', reason: request.rejection.reason, tone: REJECTED_TONE };
  }
  if (request.status === 'Cancelled' && request.cancellation) {
    return { label: 'Reason for cancellation', reason: request.cancellation.reason, tone: CANCELLED_TONE };
  }
  return null;
}
