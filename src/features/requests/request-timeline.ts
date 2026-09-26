import { REQUEST_TONE, type RequestStatus, type TimelineNode, type TimelineNodeState } from '../../shared/ui';
import { formatDateTime } from './format';

/** The facts the timeline reads, and nothing more. Both the Employee's panel
 *  (spec 007) and the Admin's review panel (spec 008) hand their own read model
 *  in, so there is one mapping for both (spec 008 plan D11). */
export interface TimelineFacts {
  status: RequestStatus;
  submittedAt: string;
  handover?: 'For Delivery' | 'Ready for Pickup';
  approvedAt?: string;
  handedOverAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rejection?: { at: string };
  cancellation?: { at: string };
}

/** The design's five drawn nodes, mapped onto the eight legal states.
 *
 *  The drawing reads Submitted → Approved → For Delivery/For Pickup → Received
 *  → Complete (drift-2026-09-26 §2), which is the state machine itself
 *  (constitution 5.0.0 IV, ADR-0009): the third node is reached when the Admin
 *  sets `For Delivery` or `Ready for Pickup`, and names whichever it was. Before
 *  that it reads the drawn "For Delivery/For Pickup".
 *
 *  Each reached node takes the tone of the status pill it stands for (the
 *  project owner's decision, 2026-09-26).
 *
 *  The stopped endings follow `04.2 - Cancelled`: the timeline collapses to
 *  Submitted and the ending. Rejected is not drawn and takes the same shape in
 *  red (docs/design-system/additions.md). */
const APPROVED_OR_LATER = new Set<RequestStatus>(['Approved', 'For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const HANDED_OVER = new Set<RequestStatus>(['For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const RECEIVED_OR_LATER = new Set<RequestStatus>(['Received', 'Completed']);

export function requestTimeline(request: TimelineFacts): TimelineNode[] {
  const submitted: TimelineNode = {
    label: 'Submitted',
    state: 'reached',
    tone: REQUEST_TONE['Pending Approval'],
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
      tone: REQUEST_TONE.Approved,
      when: formatDateTime(request.approvedAt),
    },
    {
      label: request.handover ?? 'For Delivery/For Pickup',
      state: reached(HANDED_OVER.has(request.status)),
      tone: request.handover ? REQUEST_TONE[request.handover] : undefined,
      when: formatDateTime(request.handedOverAt),
    },
    {
      label: 'Received',
      state: reached(RECEIVED_OR_LATER.has(request.status)),
      tone: REQUEST_TONE.Received,
      when: formatDateTime(request.receivedAt),
    },
    {
      label: 'Complete',
      state: reached(request.status === 'Completed'),
      tone: REQUEST_TONE.Completed,
      when: formatDateTime(request.completedAt),
    },
  ];
}
