import { useEffect, useId, useRef, useState } from 'react';
import {
  Button,
  SidePanel,
  StatusPill,
  StatusTimeline,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  TableHead,
  tableColumnStyle,
  type ColumnWidth,
} from '../../../shared/ui';
import type { Office } from '../../auth/types';
import { keyedLines, NO_VALUE } from '../format';
import { ReasonForm } from '../ReasonForm';
import { Card, RequesterBlock, StoppedReason } from '../review-parts';
import { requestTimeline } from '../request-timeline';
import { reviewActions, type ReviewAction } from './review-actions';
import { pickupLabel, stockForRequest, type PickupLocation, type ReviewRequest, type UpdateStatusTarget } from './review-types';
import { requestLabel } from '../detail/request-detail-types';
import { UpdateStatusForm } from './UpdateStatusForm';

/** The Admin's review panel over the Requests Queue (BEN-47, spec 008). Frames:
 *  `02.2`, `02.2.1 - Approve`, `02.2.1 - Update Status`, `02.2.2`, `02.2.2.1`.
 *
 *  One panel, driven by status. The body (requester, lines, note, reasons,
 *  timeline) is the same in every state. Only the action area changes, and it
 *  offers exactly what `reviewActions(status)` returns (FR-005). An action that
 *  is not offered is not rendered, not merely disabled.
 *
 *  The panel never changes the request itself. Once an action is confirmed it
 *  hands it to the page, which closes the panel, runs the transition and
 *  reports it in a toast: loading, then success or the refusal (spec 008
 *  FR-013, amended 2026-10-03). What the panel checks before handing over, a
 *  missing reason or pickup location, it still says in place. */
const REJECT_REASON_REQUIRED = 'Enter a reason for rejecting this request.';
const CANCEL_REASON_REQUIRED = 'Enter a reason for cancelling this request.';

const RELOAD_FAILED =
  'The change was saved, but the latest details could not be loaded. Close the panel to refresh the queue.';

/** An action under way, as its button names it while it runs. */
export type PendingAction = Exclude<ReviewAction, 'close'>;
const PENDING_LABEL: Record<PendingAction, string> = {
  approve: 'Approving…',
  reject: 'Rejecting…',
  updateStatus: 'Updating…',
  cancel: 'Cancelling…',
  complete: 'Completing…',
};

/** How an action ended, shown in the panel when it ended with the panel open.
 *  A panel closed first leaves this to a toast. */
export type PanelNotice = { tone: 'success' | 'error'; title: string; body?: string };

const QTY_WIDTH: ColumnWidth = '48px';
const STOCK_WIDTH: ColumnWidth = '132px';

type Mode = 'idle' | 'rejecting' | 'updating' | 'cancelling';

function StockBadge({ available }: { available: number | null }) {
  if (available === null) {
    return (
      <span className="type-meta text-ink-secondary">
        {/* A generic span cannot carry an accessible name, so the words are
            real text for screen readers and the dash is for the eye. */}
        <span aria-hidden="true">{NO_VALUE}</span>
        <span className="sr-only">Stock figure unavailable</span>
      </span>
    );
  }
  const tone = available > 0 ? 'bg-status-available-bg text-status-available-fg' : 'bg-status-unavailable-bg text-status-unavailable-fg';
  return <span className={`inline-flex h-32 items-center rounded-8 px-10 type-pill tabular-nums ${tone}`}>{available} in stock</span>;
}

export function ReviewPanel({
  request,
  pickupOffices,
  canComplete = true,
  reloadFailed,
  pending,
  notice,
  onLeave,
  onClose,
  onApprove,
  onReject,
  onUpdateStatus,
  onCancel,
  onComplete,
}: {
  request: ReviewRequest;
  pickupOffices: readonly Office[];
  /** `false` withholds Complete (spec 017 Story 4, contracts conflict 12). */
  canComplete?: boolean;
  /** The last transition went through but the reload after it failed. The
   *  panel keeps the last snapshot and says so (plan D3). */
  reloadFailed: boolean;
  /** The action on this request still in flight, or `null`. While it runs
   *  its button names it ("Approving…"), every action waits, so nothing is
   *  sent twice (FR-015), and the panel is busy: notes and scrolling locked.
   *  The panel can still be closed; the page then reports in a toast. */
  pending: PendingAction | null;
  /** How the last action ended, while the panel stayed open. */
  notice?: PanelNotice;
  /** The panel has started to close: hand any running action to a toast. */
  onLeave?: () => void;
  onClose: () => void;
  /** Each hands a confirmed action to the page, which runs it with the panel
   *  open and reports the outcome here, or in a toast if the panel is closed
   *  first. `notes` is the trimmed **Other Notes**, or `undefined` when
   *  blank. */
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string, notes?: string) => void;
  onUpdateStatus: (id: string, to: UpdateStatusTarget, pickup?: PickupLocation) => void;
  /** `reason` is trimmed and non-empty (spec 008 FR-021). */
  onCancel: (id: string, reason: string) => void;
  /** Completes a signed `Received` request. */
  onComplete: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('idle');
  const submitting = pending !== null;
  const label = (action: PendingAction, idle: string) => (pending === action ? PENDING_LABEL[action] : idle);
  // Frame `02.2`'s optional **Other Notes**, sent with the decision (FR-007a).
  // It lives here, not in the reject form, so backing out of a rejection keeps
  // it, and a refusal that keeps the status keeps it too (FR-014).
  const [otherNotes, setOtherNotes] = useState('');
  const otherNotesId = useId();
  const statusHeadingId = useId();
  const sentNotes = () => otherNotes.trim() || undefined;

  // Closing a form unmounts the control that held focus. Focus goes back to
  // the panel's heading rather than falling to <body>, so a screen-reader
  // user stays inside the dialog (FR-002). This is the same pattern as spec 007.
  const heading = useRef<HTMLHeadingElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) heading.current?.focus();
  });

  // A status change (ours, or someone else's surfaced by a refusal) ends any
  // open form: the form belonged to the old status.
  const [shownStatus, setShownStatus] = useState(request.status);
  if (shownStatus !== request.status) {
    setShownStatus(request.status);
    setMode('idle');
  }

  const toIdle = () => {
    refocus.current = true;
    setMode('idle');
  };

  const actions = reviewActions(request.status, Boolean(request.signedAt)).filter(
    (action) => canComplete || action !== 'complete',
  );
  // The notes box sits above the decision, so it is shown exactly where a
  // decision is offered.
  const deciding = actions.includes('approve') || actions.includes('reject');

  const footer = (close: () => void) => {
    if (mode === 'rejecting') {
      return (
        <ReasonForm
          label="Reason for rejection"
          placeholder="e.g item on hold, insufficient justification..."
          confirmLabel="Confirm Rejection"
          requiredMessage={REJECT_REASON_REQUIRED}
          submitting={submitting}
          submittingLabel={PENDING_LABEL.reject}
          onBack={toIdle}
          onConfirm={async (reason) => onReject(request.id, reason, sentNotes())}
        />
      );
    }
    // Undrawn: the Employee's `04.2` form, with the Admin's own placeholder
    // (additions.md §3h). The required reason is the deliberate step, so no
    // dialog follows it (FR-023).
    if (mode === 'cancelling') {
      return (
        <ReasonForm
          label="Reason for cancellation"
          placeholder="e.g item discontinued, no stock at this office..."
          confirmLabel="Confirm Cancellation"
          requiredMessage={CANCEL_REASON_REQUIRED}
          submitting={submitting}
          submittingLabel={PENDING_LABEL.cancel}
          onBack={toIdle}
          onConfirm={async (reason) => onCancel(request.id, reason)}
        />
      );
    }
    if (mode === 'updating') {
      return (
        <UpdateStatusForm
          status={request.status}
          requestorOffice={request.requestorOffice}
          pickupOffices={pickupOffices}
          submitting={submitting}
          submittingLabel={PENDING_LABEL.updateStatus}
          onBack={toIdle}
          onConfirm={async (to, pickup) => onUpdateStatus(request.id, to, pickup)}
        />
      );
    }

    // Unsigned `Received` offers nothing: no footer at all, rather than an
    // empty button row. Complete is in `actions` only after the signature.
    if (actions.length === 0) return null;

    return (
      <>
        {deciding ? (
          // `02.2`: a 1px rule across the whole panel, 12px above the line, so
          // the rule bleeds through the footer's 20px gutter.
          <p className="-mx-20 border-t border-line-default px-20 pt-12 text-center font-sans text-12 font-semibold text-ink-secondary">
            The employee will receive an email with your decision.
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-12">
          {actions.map((action) => {
            switch (action) {
              case 'reject':
                return (
                  <Button key={action} variant="ghost" disabled={submitting} onClick={() => setMode('rejecting')}>
                    Reject Request
                  </Button>
                );
              case 'approve':
                return (
                  <Button key={action} disabled={submitting} onClick={() => onApprove(request.id, sentNotes())}>
                    {label('approve', 'Approve Request')}
                  </Button>
                );
              case 'cancel':
                return (
                  <Button key={action} variant="ghost" className="flex-1" disabled={submitting} onClick={() => setMode('cancelling')}>
                    Cancel Request
                  </Button>
                );
              case 'updateStatus':
                return (
                  <Button key={action} className="flex-1" disabled={submitting} onClick={() => setMode('updating')}>
                    Update Status
                  </Button>
                );
              case 'complete':
                return (
                  <Button key={action} disabled={submitting} onClick={() => onComplete(request.id)}>
                    {label('complete', 'Complete')}
                  </Button>
                );
              case 'close':
                return (
                  <Button key={action} variant="ghost" className="w-full" onClick={close}>
                    Close
                  </Button>
                );
            }
          })}
        </div>
      </>
    );
  };

  return (
    <SidePanel
      title={`Review request ${requestLabel(request)}`}
      onClose={onClose}
      onLeave={onLeave}
      busy={submitting}
      header={
        <>
          <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
            {requestLabel(request)}
          </h2>
          <StatusPill status={request.status} />
        </>
      }
      footer={footer}
    >
      {notice ? (
        // How the action ended, in the panel it was taken in. A panel closed
        // mid-action leaves this to a toast instead.
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex flex-col gap-4 rounded-8 px-12 py-10 ${
            notice.tone === 'error' ? 'bg-status-rejected-bg text-status-rejected-fg' : 'bg-status-available-bg text-status-available-fg'
          }`}
        >
          <p className="type-ui-bold">{notice.title}</p>
          {notice.body ? <p className="type-meta">{notice.body}</p> : null}
        </div>
      ) : null}

      {reloadFailed ? (
        <p role="alert" className="rounded-8 bg-status-rejected-bg px-12 py-10 type-body text-status-rejected-fg">
          {RELOAD_FAILED}
        </p>
      ) : null}

      <RequesterBlock name={request.requestorName} email={request.requestorEmail} office={request.requestorOffice} />

      <section aria-label="Requested items">
        <TableCard>
          <TableHead cols={[['Item'], ['Qty', QTY_WIDTH], ['Current inventory', STOCK_WIDTH]]} />
          <ul>
            {keyedLines(request.lines).map(({ key, line }) => (
              <li key={key} className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                <span style={tableColumnStyle()} className="pr-8 type-ui-bold-wrap text-ink-primary">
                  {line.description}
                </span>
                <span style={tableColumnStyle(QTY_WIDTH)} className="type-ui-bold tabular-nums text-ink-primary">
                  {line.qty}
                </span>
                <span style={tableColumnStyle(STOCK_WIDTH)}>
                  <StockBadge available={stockForRequest(line, request.status)} />
                </span>
              </li>
            ))}
          </ul>
        </TableCard>
      </section>

      {request.noteToApprover ? (
        <Card title="Note to Approver">
          <p className="type-meta text-ink-body">{request.noteToApprover}</p>
        </Card>
      ) : null}

      {request.status === 'Ready for Pickup' && request.pickupLocation ? (
        <Card title="Pickup location">
          <p className="type-meta text-ink-body">{pickupLabel(request.pickupLocation)}</p>
        </Card>
      ) : null}

      <section className="flex flex-col gap-18" aria-labelledby={statusHeadingId}>
        <h3 id={statusHeadingId} className="font-sans text-14 font-bold leading-tight uppercase text-ink-secondary">
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>

      <StoppedReason request={request} />

      {deciding ? (
        // `02.2` draws the same field as the drawer's Note to Approver: Inter
        // Regular 11 `ink-secondary` label, 6px above a 78px r6 box with 12px
        // padding and Inter Regular 12 `ink-strong` text. `mt-auto` holds it at
        // the bottom of the body, over the actions, as drawn.
        <div className="mt-auto flex flex-col gap-6 pb-20">
          <label htmlFor={otherNotesId} className="type-caption text-ink-secondary">
            Other Notes (optional)
          </label>
          <textarea
            id={otherNotesId}
            rows={4}
            value={otherNotes}
            disabled={submitting}
            onChange={(e) => setOtherNotes(e.target.value)}
            className="min-h-[78px] w-full resize-y appearance-none rounded-6 border-none bg-surface-card p-12 type-meta text-ink-strong outline-none transition-osrs ring-default placeholder:text-ink-muted focus:ring-brand disabled:opacity-60"
          />
        </div>
      ) : null}
    </SidePanel>
  );
}
