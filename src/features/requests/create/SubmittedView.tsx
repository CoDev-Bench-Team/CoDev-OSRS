import type { EmployeeRequest } from '../detail/request-detail-types';
import { RequestReadBack } from '../detail/RequestReadBack';

/** The drawer after a successful submit — `03.1 - Request List - Request
 *  Submitted` (spec 008 Story 3, FR-012).
 *
 *  Everything here is read from the request the system returned, not from the
 *  list that was typed: the id, the lines and the note are the created
 *  request's (SC-005). The id and its pill sit in the panel header, which the
 *  drawer owns. The read-back below the card is the same one the Employee's
 *  request panel draws (D10).
 *
 *  The success card as the file resolves it: a `Border` (`border-warm`) hairline
 *  at r8 with 8px padding; a 37px `green-50` circle holding the frame's own
 *  outline tick — a 1px round-capped `green-700` stroke in a 21px box, its three
 *  points read from the vector network; then `H3` (Space Grotesk Medium 17,
 *  1.35) over `Body 3` (Inter Regular 12.5, 1.45), 8px apart. */
export function SubmittedView({ request }: { request: EmployeeRequest }) {
  return (
    <div className="flex flex-col gap-18">
      <section
        className="flex flex-col items-center rounded-8 bg-surface-card p-8 text-center ring-warm"
        aria-labelledby="request-submitted"
      >
        <span className="flex size-[37px] items-center justify-center rounded-circle bg-status-ready-bg text-status-ready-fg">
          <svg viewBox="0 0 21 21" className="size-[21px]" fill="none" aria-hidden="true">
            <path d="M3.5 10.5L7.876 14.874L17.5 5.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="miter" />
          </svg>
        </span>
        <div className="flex flex-col gap-8">
          <h3 id="request-submitted" className="font-display text-17 font-medium leading-[1.35] text-ink-primary">
            Request submitted
          </h3>
          <p className="font-sans text-12-5 leading-[1.45] text-ink-secondary">
            Your request has been sent to your approver. We&rsquo;ll email you whenever its status changes.
          </p>
        </div>
      </section>
      <RequestReadBack request={request} />
    </div>
  );
}
