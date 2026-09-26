import type { RequestStatus } from '../../../shared/ui';
import type { User } from '../../auth/types';

/** The Employee's own view of a request — a feature-local read model, not a
 *  backend response shape. When the contract publishes, a new source maps the
 *  API INTO these types and nothing above the source changes (ARCHITECT.md §8,
 *  the same boundary BEN-46's approval queue uses). */
export interface RequestLine {
  /** The short name the list summarises: "Laptop". */
  name: string;
  /** The line as the panel shows it: "Business Laptop - Dell Latitude". */
  description: string;
  qty: number;
}

export interface EmployeeRequest {
  id: string;
  submittedAt: string;
  lines: readonly RequestLine[];
  noteToApprover?: string;
  status: RequestStatus;
  /** The handover state the request went through, kept once it is set so a
   *  `Completed` request still names its route on the timeline (ADR-0007). */
  handover?: 'For Delivery' | 'Ready for Pickup';
  approvedAt?: string;
  handedOverAt?: string;
  /** Set by the System when the Employee submits the Accountability Form
   *  (constitution 5.0.0). */
  receivedAt?: string;
  completedAt?: string;
  /** A stopped request carries why, and the panel reads it back (BEN-67,
   *  BEN-70). */
  rejection?: { reason: string; at: string };
  cancellation?: { reason: string; at: string };
}

/** Why a cancel was refused. `status-changed` is the one an Employee can meet
 *  in practice: the request was approved (or cancelled elsewhere) while the
 *  panel was open. */
export type CancelRefusal = 'status-changed' | 'reason-required' | 'unavailable';

export type CancelResult = { ok: true; request: EmployeeRequest } | { ok: false; refusal: CancelRefusal };

export interface EmployeeRequestSource {
  /** The signed-in Employee's own requests, and nobody else's. */
  list(user: User): Promise<readonly EmployeeRequest[]>;
  /** Cancel one of the Employee's own requests (spec 001 FR-009a). The reason
   *  is required whoever cancels (constitution 3.0.0 IV). */
  cancel(user: User, id: string, reason: string): Promise<CancelResult>;
}
