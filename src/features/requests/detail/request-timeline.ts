import { type RequestStatus, type TimelineNode, type TimelineNodeState } from '../../../shared/ui';
import { formatDateTime } from '../format';
import type { EmployeeRequest } from './request-detail-types';

/** The design's five drawn nodes, mapped onto the eight legal states.
 *
 *  The drawing reads Submitted → Approved → For Delivery/For Pickup → Received
 *  → Complete (drift-2026-09-26 §2),
 *  which is the state machine itself (ADR-0007): the third node is reached when
 *  the Admin sets `For Delivery` or `Ready for Pickup`, and names whichever it
 *  was (constitution 3.0.1). Before that it reads the drawn "For Delivery/For
 *  Pickup".
 *
 *  The stopped endings follow `04.2 - Cancelled`: the timeline collapses to
 *  Submitted and the ending. Rejected is not drawn and takes the same shape in
 *  red (docs/design-system/additions.md). */
const APPROVED_OR_LATER = new Set<RequestStatus>(['Approved', 'For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const HANDED_OVER = new Set<RequestStatus>(['For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const RECEIVED_OR_LATER = new Set<RequestStatus>(['Received', 'Completed']);

export function requestTimeline(request: EmployeeRequest): TimelineNode[] {
  const submitted: TimelineNode = {
    label: 'Submitted',
    state: 'reached',
    when: formatDateTime(request.submittedAt),
  };

  if (request.status === 'Cancelled') {
    return [submitted, { label: 'Cancelled', state: 'cancelled', when: formatDateTime(request.cancellation?.at) }];
  }
  if (request.status === 'Rejected') {
    return [submitted, { label: 'Rejected', state: 'rejected', when: formatDateTime(request.rejection?.at) }];
  }

  const reached = (yes: boolean): TimelineNodeState => (yes ? 'reached' : 'pending');

  return [
    submitted,
    {
      label: 'Approved',
      state: reached(APPROVED_OR_LATER.has(request.status)),
      when: formatDateTime(request.approvedAt),
    },
    {
      label: request.handover ?? 'For Delivery/For Pickup',
      state: reached(HANDED_OVER.has(request.status)),
      when: formatDateTime(request.handedOverAt),
    },
    {
      label: 'Received',
      state: reached(RECEIVED_OR_LATER.has(request.status)),
      when: formatDateTime(request.receivedAt),
    },
    {
      label: 'Complete',
      state: reached(request.status === 'Completed'),
      when: formatDateTime(request.completedAt),
    },
  ];
}
