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
 *  (constitution 7.0.0 IV, ADR-0009): the third node is reached when the Admin
 *  sets `For Delivery` or `Ready for Pickup`, and names whichever it was. Before
 *  that it reads the drawn "For Delivery/For Pickup".
 *
 *  Each reached node takes the tone of the status pill it stands for (the
 *  project owner's decision, 2026-09-26).
 *
 *  The stopped endings follow `04.2 - Cancelled`: Submitted, then the ending.
 *  Rejected is not drawn and takes the same shape in red. A rejection only
 *  happens from `Pending Approval`, so that is its only shape.
 *
 *  A request cancelled after approval keeps the nodes it reached before the
 *  ending, each dated: Submitted → Approved → [handover] → Cancelled (spec 013
 *  FR-009a, additions.md §3j). The terminal status cannot say how far it got,
 *  so the timestamps do, and a node is drawn only when all of its facts are
 *  present. `Received` cannot be cancelled, so no longer shape exists. */
const APPROVED_OR_LATER = new Set<RequestStatus>(['Approved', 'For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const HANDED_OVER = new Set<RequestStatus>(['For Delivery', 'Ready for Pickup', 'Received', 'Completed']);
const RECEIVED_OR_LATER = new Set<RequestStatus>(['Received', 'Completed']);

/** Who reads the timeline: the requester (spec 007) or an Admin (spec 008,
 *  013). It changes only how the next step's wait is worded. */
export type TimelineViewer = 'employee' | 'admin';

/** What the request is waiting on, said on the next step in place of
 *  "Pending" (spec 008 FR-018a, amended 2026-10-06). Every later step stays
 *  "Pending". `undefined` for a status with no next step. */
function awaiting(request: TimelineFacts, viewer: TimelineViewer): string | undefined {
  const mine = viewer === 'employee';
  switch (request.status) {
    case 'Pending Approval':
      return 'Awaiting review by an Admin';
    case 'Approved':
      return mine ? 'Awaiting the Workplace team to arrange delivery or pickup' : 'Awaiting an Admin to arrange delivery or pickup';
    case 'For Delivery':
      return mine ? 'Awaiting delivery. Mark it received once it arrives' : 'Awaiting delivery. Mark it received once handed over';
    case 'Ready for Pickup':
      return mine ? 'Awaiting your pickup. Mark it received once collected' : 'Awaiting pickup. Mark it received once collected';
    case 'Received':
      return mine
        ? 'Awaiting your signature on the Accountability Form'
        : "Awaiting the employee's signature on the Accountability Form";
    default:
      return undefined;
  }
}

export function requestTimeline(request: TimelineFacts, viewer: TimelineViewer): TimelineNode[] {
  const submitted: TimelineNode = {
    label: 'Submitted',
    state: 'reached',
    tone: REQUEST_TONE['Pending Approval'],
    when: formatDateTime(request.submittedAt),
  };

  if (request.status === 'Cancelled') {
    const reached: TimelineNode[] = [submitted];
    if (request.approvedAt) {
      reached.push({
        label: 'Approved',
        state: 'reached',
        tone: REQUEST_TONE.Approved,
        when: formatDateTime(request.approvedAt),
      });
      if (request.handover && request.handedOverAt) {
        reached.push({
          label: request.handover,
          state: 'reached',
          tone: REQUEST_TONE[request.handover],
          when: formatDateTime(request.handedOverAt),
        });
      }
    }
    return [...reached, { label: 'Cancelled', state: 'cancelled', when: formatDateTime(request.cancellation?.at) }];
  }
  if (request.status === 'Rejected') {
    return [submitted, { label: 'Rejected', state: 'rejected', when: formatDateTime(request.rejection?.at) }];
  }

  const reached = (yes: boolean): TimelineNodeState => (yes ? 'reached' : 'pending');

  const nodes: TimelineNode[] = [
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
  const next = nodes.findIndex((n) => n.state === 'pending');
  if (next === -1) return nodes;
  return nodes.map((n, i) => (i === next ? { ...n, awaiting: awaiting(request, viewer) } : n));
}
