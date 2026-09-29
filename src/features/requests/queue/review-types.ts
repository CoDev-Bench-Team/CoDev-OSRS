import type { RequestStatus } from '../../../shared/ui';
import type { Office } from '../../auth/types';
import type { QueueRequest, QueueSnapshot, QueueSource } from './queue-types';

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
export interface AdminRequestSource extends QueueSource {
  /** The pickup points offered for `Ready for Pickup`. They come from the
   *  source, never a literal in the panel (plan D7; contracts conflict 2). */
  readonly pickupOffices: readonly Office[];
  load(): Promise<ReviewSnapshot>;
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
  // complete(id) lands with BEN-134 (constitution 4.0.0), plan D9.
}

/** "Cebu Office", as the design labels an office everywhere it names one. */
export const officeLabel = (office: Office): string => `${office} Office`;

export function pickupLabel(location: PickupLocation): string {
  return location.kind === 'office' ? officeLabel(location.office) : location.text;
}

/** Said when a `Ready for Pickup` has no location, by the form before it sends
 *  and by the panel when the source refuses one. */
export const LOCATION_REQUIRED = 'Choose where the employee collects the items.';
