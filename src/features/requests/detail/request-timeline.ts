import { HANDOVER_LABEL, type RequestStatus, type TimelineNode, type TimelineNodeState } from '../../../shared/ui';
import { formatDateTime } from '../format';
import type { EmployeeRequest } from './request-detail-types';

/** The design's four drawn nodes, mapped onto the seven legal states.
 *
 *  The drawing reads Submitted → Approved → For Delivery/For Pickup → Complete;
 *  none of those but Approved is a state name, and `For Release` has no node.
 *  So `For Release` leaves the handover node Pending — the items are being
 *  prepared, not yet handed over — and the handover node names the route the
 *  items take once the request is `Released`, falling back to the drawn
 *  "For Delivery/For Pickup" while that route is not yet known.
 *
 *  The stopped endings follow `04.2 - Cancelled`: the timeline collapses to
 *  Submitted and the ending. Rejected is not drawn and takes the same shape in
 *  red (docs/design-system/additions.md). */
const APPROVED_OR_LATER = new Set<RequestStatus>(['Approved', 'For Release', 'Released', 'Completed']);
const HANDED_OVER = new Set<RequestStatus>(['Released', 'Completed']);

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
  const handoverLabel = request.handover ? HANDOVER_LABEL[request.handover].Released : undefined;

  return [
    submitted,
    {
      label: 'Approved',
      state: reached(APPROVED_OR_LATER.has(request.status)),
      when: formatDateTime(request.approvedAt),
    },
    {
      label: handoverLabel ?? 'For Delivery/For Pickup',
      state: reached(HANDED_OVER.has(request.status)),
      when: formatDateTime(request.releasedAt),
    },
    {
      label: 'Complete',
      state: reached(request.status === 'Completed'),
      when: formatDateTime(request.completedAt),
    },
  ];
}
