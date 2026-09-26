import {
  StatusTimeline,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  TableHead,
  tableColumnStyle,
  type ColumnWidth,
} from '../../../shared/ui';
import type { EmployeeRequest } from './request-detail-types';
import { requestTimeline } from './request-timeline';

const QTY_WIDTH: ColumnWidth = '50px';

/** The read-back of one request as the system holds it: Items Requested, the
 *  Note to Approver, a stopped request's reason, and the Status timeline.
 *
 *  Two panels draw it — the Employee's request detail (`04.1`) and the Request
 *  List's confirmation after submit (`03.1`, spec 008 D10) — so it lives once,
 *  and the two can never drift apart.
 *
 *  Type as both frames resolve it (`03.1`, `04.1`): the *Items Requested* and
 *  *Status* headings are `Body 1` with a character override to Inter **Bold**
 *  — Bold 14 / 1.5 — in `Ink-400`, 18px above what they head; the note
 *  card's title is Inter Bold 15 over Inter Regular 12 in `Ink-900`, 12px
 *  apart; sections sit 18px apart. */
export function RequestReadBack({ request }: { request: EmployeeRequest }) {
  // BEN-67 / BEN-70: a stopped request reads back why. The `04.2 - Cancelled`
  // frame does not draw it; Linear asks for it (additions.md §3e).
  const stopped =
    request.status === 'Cancelled' && request.cancellation
      ? { label: 'Reason for cancellation', reason: request.cancellation.reason }
      : request.status === 'Rejected' && request.rejection
        ? { label: 'Reason for rejection', reason: request.rejection.reason }
        : null;

  return (
    <div className="flex flex-col gap-18">
      <section className="flex flex-col gap-18" aria-labelledby="items-requested">
        <h3 id="items-requested" className="font-sans text-14 font-bold leading-body uppercase text-ink-muted">
          Items Requested
        </h3>
        <TableCard>
          <TableHead cols={[['Item'], ['Qty', QTY_WIDTH]]} />
          <ul>
            {request.lines.map((line, i) => (
              // Lines carry no id of their own, and a description need not be
              // unique; the list never reorders, so position is stable.
              <li key={i} className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                <span style={tableColumnStyle()} className="type-ui-bold text-ink-primary">
                  {line.description}
                </span>
                <span style={tableColumnStyle(QTY_WIDTH)} className="type-ui-bold tabular-nums text-ink-primary">
                  {line.qty}
                </span>
              </li>
            ))}
          </ul>
        </TableCard>
      </section>

      {request.noteToApprover ? (
        <section className="flex flex-col gap-12 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-subhead text-ink-primary">Note to Approver</h3>
          <p className="type-meta text-ink-strong">{request.noteToApprover}</p>
        </section>
      ) : null}

      {stopped ? (
        <section className="flex flex-col gap-12 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-subhead text-ink-primary">{stopped.label}</h3>
          <p className="type-meta text-ink-strong">{stopped.reason}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-18" aria-labelledby="request-status">
        <h3 id="request-status" className="font-sans text-14 font-bold leading-body uppercase text-ink-muted">
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>
    </div>
  );
}
