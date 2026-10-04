import type { RequestStatus } from '../../../shared/ui';
import type { Office } from '../../auth/types';
import type { QueueQuery, QueueRequest, QueueSnapshot, QueueViewModel } from './queue-types';

/** The Admin's view of one request in the review panel. This is a feature-local
 *  read model, not a backend response shape. When the contract publishes, a new
 *  source maps the API INTO these types and nothing above the source changes
 *  (ARCHITECT.md §8, the boundary the queue and spec 007 already use). */

export type HandoverStatus = 'For Delivery' | 'Ready for Pickup';
export const HANDOVER_STATUSES = ['For Delivery', 'Ready for Pickup'] as const satisfies readonly HandoverStatus[];

/** What **Update Status** can set. `Received` only from a handover state: the
 *  Admin records the handover; the Employee signs for it afterwards
 *  (constitution 7.0.0 IV, ADR-0010, ADR-0011). */
export type UpdateStatusTarget = HandoverStatus | 'Received';

/** The Status select's options for a request in `status`. The current status
 *  is never one of them: choosing it would change nothing. */
export function updateStatusTargets(status: RequestStatus): readonly UpdateStatusTarget[] {
  return status === 'For Delivery' || status === 'Ready for Pickup'
    ? ['Received', ...HANDOVER_STATUSES.filter((s) => s !== status)]
    : HANDOVER_STATUSES;
}

export interface ReviewLine {
  /** The line as the panel shows it: "Business Laptop - Dell Latitude". */
  description: string;
  qty: number;
  /** Available at the request's office, as the source reports it (spec 008
   *  FR-004). `null` when the source has no figure. The panel then shows a
   *  marker, never `0 in stock`. */
  available: number | null;
}

/** The statuses in which a request still holds its units as `Reserved`:
 *  submit reserved them, and only reject, cancel and `Received` move them
 *  out (constitution III). */
const HOLDS_RESERVATION: ReadonlySet<RequestStatus> = new Set([
  'Pending Approval',
  'Approved',
  'For Delivery',
  'Ready for Pickup',
]);

/** CURRENT INVENTORY for a line: the units at the office open to THIS
 *  request. While it holds its reservation, its own `qty` units are Reserved,
 *  not Available, so the Available figure alone would read `0 in stock` for a
 *  request holding the last unit. They are counted back in. Once the request
 *  is received, rejected or cancelled it holds nothing, and Available is the
 *  figure. `null` stays `null` (spec 008 FR-004, amended 2026-10-03). */
export function stockForRequest(line: Pick<ReviewLine, 'available' | 'qty'>, status: RequestStatus): number | null {
  if (line.available === null) return null;
  return HOLDS_RESERVATION.has(status) ? line.available + line.qty : line.available;
}

/** Where a `Ready for Pickup` request is collected (spec 008 FR-009). */
export type PickupLocation = { kind: 'office'; office: Office } | { kind: 'other'; text: string };

/** A structural superset of `QueueRequest`, so the queue's projection reads it
 *  unchanged (plan D4). */
export interface ReviewRequest extends QueueRequest {
  requestorOffice: Office;
  lines: readonly ReviewLine[];
  noteToApprover?: string;
  /** The Admin's optional **Other Notes**, sent with the decision (frame
   *  `02.2`, spec 008 FR-007a). Held by the seeded source only: the contract
   *  has no field for it yet (contracts conflict 6), and no frame reads it
   *  back. */
  otherNotes?: string;
  /** The handover state the request took, kept once it moves on, so the
   *  timeline still names it. */
  handover?: HandoverStatus;
  pickupLocation?: PickupLocation;
  approvedAt?: string;
  handedOverAt?: string;
  /** Set when it moves to `Received`: by the Admin's Update Status, or by the
   *  owning Employee's Mark as Received (constitution 7.0.0 IV). */
  receivedAt?: string;
  /** Set when the owning Employee signs. Complete is offered only then. */
  signedAt?: string;
  completedAt?: string;
  rejection?: { reason: string; at: string };
  cancellation?: { reason: string; at: string };
}

/** Why a transition was refused. `status-changed` is the one an Admin meets in
 *  practice: someone else acted while the panel was open. */
export type ReviewRefusal = 'status-changed' | 'reason-required' | 'location-required' | 'unavailable';

export type TransitionResult = { ok: true } | { ok: false; refusal: ReviewRefusal };

/** The queue's snapshot, carrying the full review read model. The panel reads
 *  its request straight out of the snapshot the table shows, so the two cannot
 *  disagree (spec 008 FR-013). */
export interface ReviewSnapshot extends QueueSnapshot {
  requests: readonly ReviewRequest[];
}

/** The one store behind the queue AND the panel, so a transition and the
 *  reload that follows see the same data (plan D3, D4). */
/** One page of the queue as the API answers it: the projection the table
 *  draws, and the requests behind its rows for the panel (spec 017 plan D1). */
export interface QueuePageResult {
  queue: QueueViewModel;
  requests: readonly ReviewRequest[];
}

export interface AdminRequestSource {
  /** One page of the queue, asked of the API (spec 017 plan D1). */
  page(query: QueueQuery): Promise<QueuePageResult>;
  /** One request in full, for the panel and for a deep link a page does not
   *  hold. */
  get(id: string): Promise<ReviewRequest>;
  /** `false` withholds Complete: the Employee's signature completes the
   *  request, so there is no Admin complete (constitution 10.0.0 IV,
   *  ADR-0013). Absent means `false` (spec 017 FR-023). */
  readonly canComplete?: boolean;
  /** The pickup points offered for `Ready for Pickup`. They come from the
   *  source, never a literal in the panel (plan D7; contracts conflict 2). */
  readonly pickupOffices: readonly Office[];
  /** `notes` is the optional **Other Notes**, sent trimmed, and left out when
   *  blank (FR-007a). */
  approve(id: string, notes?: string): Promise<TransitionResult>;
  /** `reason` is sent trimmed and non-empty. The source still refuses one that
   *  is not. `notes` is as for `approve`. */
  reject(id: string, reason: string, notes?: string): Promise<TransitionResult>;
  /** `Received` is accepted only from `For Delivery` or `Ready for Pickup`,
   *  and keeps the handover and pickup location it had. A target equal to the
   *  current status is refused `status-changed`: the form never offers it. */
  updateStatus(id: string, to: UpdateStatusTarget, pickup?: PickupLocation): Promise<TransitionResult>;
  /** Stops an `Approved` or `Ready for Pickup` request that cannot be
   *  fulfilled (spec 008 FR-020). Any other status, `For Delivery` included,
   *  is refused `status-changed`. `reason` is as for `reject`. */
  cancel(id: string, reason: string): Promise<TransitionResult>;
  /** From a signed `Received` request only. Does not move units. */
  complete(id: string): Promise<TransitionResult>;
}

/** "Cebu Office", as the design labels an office everywhere it names one. */
export const officeLabel = (office: Office): string => `${office} Office`;

export function pickupLabel(location: PickupLocation): string {
  return location.kind === 'office' ? officeLabel(location.office) : location.text;
}

/** Said when a `Ready for Pickup` has no location, by the form before it sends
 *  and by the panel when the source refuses one. */
export const LOCATION_REQUIRED = 'Choose where the employee collects the items.';
