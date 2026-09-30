import type { RequestStatus } from '../../../shared/ui';
import type { FieldProblem } from '../../../shared/validation';
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
  /** Set when the handover is marked `Received`, by an Admin or the owning
   *  Employee (constitution 7.0.0). */
  receivedAt?: string;
  /** When the owning Employee signed the Accountability Form on the
   *  `Received` request. Signing records this and changes no status; the
   *  Admin's Complete waits on it (constitution 7.0.0 IV, ADR-0011). */
  signedAt?: string;
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

/** What the Employee signs on the Accountability Form (spec 012). A UI type,
 *  not a payload: a contract-backed source translates it into whatever the
 *  backend publishes (plan, Data Model). `agreed` is the literal `true`, so an
 *  unagreed signature cannot get past the form. `fullName` arrives trimmed. */
export interface Signature {
  agreed: true;
  fullName: string;
}

/** Why a signature was refused (spec 012 D12).
 *
 *  - `status-changed`: the request changed while the form was open, and there
 *    is nothing left to sign (for example, it was signed from another tab).
 *  - `unavailable`: the system did not answer, or would not say why.
 *  - `invalid`: the system refused the fields, as BEN-98 problems.
 *
 *  `detail` is the system's own message on `status-changed`, shown in
 *  preference to SPA copy. `unavailable` carries none: its wording is fixed,
 *  because it must say the signature was not sent (FR-012, plan D12). */
export type SignResult =
  | { ok: true; request: EmployeeRequest }
  | { ok: false; refusal: 'status-changed'; detail?: string }
  | { ok: false; refusal: 'unavailable' }
  | { ok: false; refusal: 'invalid'; problems: readonly FieldProblem[] };

/** The outcome of the Employee's **Mark as Received** (spec 012 D19).
 *  `status-changed`: the request left `For Delivery` / `Ready for Pickup`
 *  while the panel was open; `detail` is the system's own message.
 *  `unavailable` carries none: it must say the request was not marked
 *  received (FR-019). */
export type ReceiveResult =
  | { ok: true; request: EmployeeRequest }
  | { ok: false; refusal: 'status-changed'; detail?: string }
  | { ok: false; refusal: 'unavailable' };

export interface EmployeeRequestSource {
  /** The signed-in Employee's own requests, and nobody else's. */
  list(user: User): Promise<readonly EmployeeRequest[]>;
  /** Cancel one of the Employee's own requests (spec 001 FR-009a). The reason
   *  is required whoever cancels (constitution 3.0.0 IV). */
  cancel(user: User, id: string, reason: string): Promise<CancelResult>;
  /** Sign the Accountability Form on one of the Employee's own unsigned
   *  `Received` requests. On acceptance the request carries `signedAt`; its
   *  status does not change (constitution 7.0.0 IV, spec 012). */
  sign(user: User, id: string, signature: Signature): Promise<SignResult>;
  /** Mark one of the Employee's own `For Delivery` / `Ready for Pickup`
   *  requests `Received`: the items are in hand, and the units become
   *  theirs (constitution 7.0.0 IV, spec 012 Story 0). */
  markReceived(user: User, id: string): Promise<ReceiveResult>;
}
