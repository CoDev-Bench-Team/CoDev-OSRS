import type { User } from '../../auth/types';
import type { FieldProblem } from '../../../shared/validation';
import type { EmployeeRequest } from '../detail/request-detail-types';
import type { RequestListDraftInput } from './request-list-types';

/** How a submit ended, in the SPA's own vocabulary (spec 008 D8).
 *
 *  These are outcomes, not error codes. `refused.message` is the system's own
 *  text, passed through verbatim — the SPA never translates a refusal into a
 *  code or wording of its own (FR-014, constitution VII). */
export type SubmitResult =
  | { ok: true; request: EmployeeRequest }
  /** An RFC 9457 validation failure, already parsed (`shared/validation.ts`). */
  | { ok: false; reason: 'invalid'; problems: FieldProblem[] }
  /** Any other refusal, insufficient stock included. */
  | { ok: false; reason: 'refused'; message: string }
  /** The system could not be reached; the request was not sent. */
  | { ok: false; reason: 'unreachable' };

/** What a refusal says when the system gave no words of its own — a problem
 *  body with neither `detail` nor `title`, or an empty message. Never shown
 *  in place of anything the system did say. */
export const REFUSED_COPY = 'The request was refused.';

/** The submit boundary. The seeded implementation stands in until the contract
 *  publishes the success body and the insufficient-stock refusal (contract
 *  conflict 4); a live one then maps `POST /requests` into these types and
 *  nothing above this interface changes.
 *
 *  The lines go in list order, so a validation pointer `#/items/N/…` names row
 *  N of the drawer. */
export interface RequestSubmitSource {
  submit(user: User, draft: RequestListDraftInput): Promise<SubmitResult>;
}
