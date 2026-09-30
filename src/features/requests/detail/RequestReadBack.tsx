import { StatusTimeline } from '../../../shared/ui';
import { SECTION_HEADING } from './detail-typography';
import type { EmployeeRequest } from './request-detail-types';
import { requestTimeline } from '../request-timeline';
import { ItemsRequested } from '../review-parts';
import { NO_REASON, stoppedReason } from '../stopped-reason';

/** The read-back of one request as the system holds it: Items Requested, the
 *  Note to Approver, a stopped request's reason, and the Status timeline.
 *
 *  Two panels draw it — the Employee's request detail (`04.1`) and the Request
 *  List's confirmation after submit (`03.1`, spec 011 D10) — so it lives once,
 *  and the two can never drift apart.
 *
 *  Type as both frames resolve it (`03.1`, `04.1`): the *Items Requested* and
 *  *Status* headings are `Body 1` with a character override to Inter **Bold**
 *  — Bold 14 / 1.5 — in `Ink-400`, 18px above what they head; the note
 *  card's title is Inter Bold 15 over Inter Regular 12 in `Ink-900`, 12px
 *  apart; sections sit 18px apart. */
export function RequestReadBack({ request }: { request: EmployeeRequest }) {
  // BEN-67 / BEN-70: a stopped request reads back why. The `04.2 - Cancelled`
  // frame does not draw it; Linear asks for it (additions.md §3e). One with no
  // stored reason says so (additions.md §3j).
  const stopped = stoppedReason(request);

  return (
    <div className="flex flex-col gap-18">
      <ItemsRequested lines={request.lines} />

      {request.noteToApprover ? (
        <section className="flex flex-col gap-12 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-subhead text-ink-primary">Note to Approver</h3>
          <p className="type-meta text-ink-strong">{request.noteToApprover}</p>
        </section>
      ) : null}

      {stopped ? (
        <section className="flex flex-col gap-12 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-subhead text-ink-primary">{stopped.label}</h3>
          <p className={`type-meta text-ink-strong ${stopped.reason ? '' : 'italic'}`}>{stopped.reason ?? NO_REASON}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-18" aria-labelledby="request-status">
        <h3 id="request-status" className={SECTION_HEADING}>
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>
    </div>
  );
}
