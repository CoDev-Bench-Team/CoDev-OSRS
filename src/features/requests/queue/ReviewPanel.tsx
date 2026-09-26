import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Avatar,
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
import { requestTimeline } from '../request-timeline';
import { reviewActions } from './review-actions';
import {
  pickupLabel,
  type HandoverStatus,
  type PickupLocation,
  type ReviewRefusal,
  type ReviewRequest,
  type TransitionResult,
} from './review-types';
import { UpdateStatusForm } from './UpdateStatusForm';

/** The Admin's review panel over the Requests Queue (BEN-47, spec 008). Frames:
 *  `02.2`, `02.2.1 - Approve`, `02.2.1 - Update Status`, `02.2.2`, `02.2.2.1`.
 *
 *  One panel, driven by status. The body (requester, lines, note, reasons,
 *  timeline) is the same in every state. Only the action area changes, and it
 *  offers exactly what `reviewActions(status)` returns (FR-005). An action that
 *  is not offered is not rendered, not merely disabled.
 *
 *  The panel never changes the request itself. It asks the page to run a
 *  transition, and the page reloads from the source and hands the fresh request
 *  back down (plan D3), so what the panel shows is always the source's word. */
const REFUSAL_COPY: Record<ReviewRefusal, string> = {
  'status-changed': 'This request was updated while you were viewing it. Its current status and actions are shown below.',
  'reason-required': 'Enter a reason for rejecting this request.',
  'location-required': 'Choose where the employee collects the items.',
  unavailable: 'This request could not be updated. Try again.',
};

const RELOAD_FAILED =
  'The change was saved, but the latest details could not be loaded. Close the panel to refresh the queue.';

const QTY_WIDTH: ColumnWidth = '48px';
const STOCK_WIDTH: ColumnWidth = '132px';

/** `02.2.2.1` draws the rejection reason as a red callout under the timeline.
 *  A cancellation reason takes the same shape in the Cancelled pill's slate. */
const REJECTED_TONE = 'border-status-rejected-fg bg-status-rejected-bg text-status-rejected-fg';
const CANCELLED_TONE = 'border-status-cancelled-fg bg-status-cancelled-bg text-status-cancelled-fg';

type Mode = 'idle' | 'rejecting' | 'updating';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || NO_VALUE;
}

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
  return <span className={`inline-flex rounded-8 px-10 py-4 type-pill tabular-nums ${tone}`}>{available} in stock</span>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-8 rounded-10 bg-surface-card p-20 shadow-card">
      <h3 className="type-ui-bold text-ink-primary">{title}</h3>
      {children}
    </section>
  );
}

export function ReviewPanel({
  request,
  pickupOffices,
  reloadFailed,
  onClose,
  onApprove,
  onReject,
  onUpdateStatus,
}: {
  request: ReviewRequest;
  pickupOffices: readonly Office[];
  /** The last transition went through but the reload after it failed. The
   *  panel keeps the last snapshot and says so (plan D3). */
  reloadFailed: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<TransitionResult>;
  onReject: (id: string, reason: string) => Promise<TransitionResult>;
  onUpdateStatus: (id: string, to: HandoverStatus, pickup?: PickupLocation) => Promise<TransitionResult>;
}) {
  const [mode, setMode] = useState<Mode>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

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

  /** Runs one transition. A refusal other than a field-level one closes the
   *  form and shows why, and the page has already reloaded, so the panel shows
   *  the current status. A field-level refusal keeps the form open. */
  const run = async (transition: () => Promise<TransitionResult>): Promise<ReviewRefusal | undefined> => {
    if (submitting) return undefined;
    setSubmitting(true);
    setRefusal(null);
    let result: TransitionResult;
    try {
      result = await transition();
    } catch {
      // A source that throws (a dropped connection, say) is a failure like any
      // other. The status stays, the form keeps its input, and the buttons come
      // back, so the Admin can retry (FR-014).
      result = { ok: false, refusal: 'unavailable' };
    } finally {
      setSubmitting(false);
    }
    if (result.ok) {
      toIdle();
      return undefined;
    }
    if (result.refusal === 'reason-required' || result.refusal === 'location-required') return result.refusal;
    if (result.refusal === 'status-changed') toIdle();
    // `unavailable` keeps the form and its input, so the Admin can retry
    // (FR-014).
    setRefusal(REFUSAL_COPY[result.refusal]);
    return result.refusal;
  };

  const actions = reviewActions(request.status);

  const stopped =
    request.status === 'Rejected' && request.rejection
      ? { label: 'Reason for rejection', reason: request.rejection.reason, tone: REJECTED_TONE }
      : request.status === 'Cancelled' && request.cancellation
        ? { label: 'Reason for cancellation', reason: request.cancellation.reason, tone: CANCELLED_TONE }
        : null;

  const footer = (close: () => void) => {
    if (mode === 'rejecting') {
      return (
        <ReasonForm
          label="Reason for rejection"
          placeholder="e.g item on hold, insufficient justification..."
          confirmLabel="Confirm Rejection"
          requiredMessage={REFUSAL_COPY['reason-required']}
          submitting={submitting}
          onBack={toIdle}
          onConfirm={async (reason) => {
            const refused = await run(() => onReject(request.id, reason));
            if (refused === 'reason-required') return 'reason-required';
          }}
        />
      );
    }
    if (mode === 'updating') {
      return (
        <UpdateStatusForm
          status={request.status}
          pickupLocation={request.pickupLocation}
          requestorOffice={request.requestorOffice}
          pickupOffices={pickupOffices}
          submitting={submitting}
          onBack={toIdle}
          onConfirm={async (to, pickup) => {
            const refused = await run(() => onUpdateStatus(request.id, to, pickup));
            if (refused === 'location-required') return 'location-required';
          }}
        />
      );
    }

    return (
      <>
        {actions.includes('approve') || actions.includes('reject') ? (
          <p className="text-center type-meta text-ink-secondary">The employee will receive an email with your decision.</p>
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
                  <Button key={action} disabled={submitting} onClick={() => void run(() => onApprove(request.id))}>
                    Approve Request
                  </Button>
                );
              case 'updateStatus':
                return (
                  <Button key={action} className="w-full" disabled={submitting} onClick={() => setMode('updating')}>
                    Update Status
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
      title={`Review request ${request.id}`}
      onClose={onClose}
      header={
        <>
          <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
            {request.id}
          </h2>
          <StatusPill status={request.status} />
        </>
      }
      footer={footer}
    >
      {/* Both can hold at once: a change was saved but unseen, and a later
          attempt was refused. The saved-but-stale warning comes first, because
          it explains the refusal. */}
      {reloadFailed ? (
        <p role="alert" className="rounded-8 bg-status-rejected-bg px-12 py-10 type-body text-status-rejected-fg">
          {RELOAD_FAILED}
        </p>
      ) : null}
      {refusal ? (
        <p role="alert" className="rounded-8 bg-status-rejected-bg px-12 py-10 type-body text-status-rejected-fg">
          {refusal}
        </p>
      ) : null}

      <section className="flex flex-col gap-10" aria-labelledby="requested-by">
        <h3 id="requested-by" className="type-eyebrow uppercase text-ink-secondary">
          Requested by:
        </h3>
        <div className="flex items-center gap-12 rounded-10 bg-surface-card p-20 shadow-card">
          <Avatar initials={initials(request.requestorName)} />
          <div className="flex min-w-0 flex-col gap-4">
            <span className="truncate type-ui-bold text-ink-primary">{request.requestorName}</span>
            <span className="truncate type-meta text-ink-secondary">
              {[request.requestorEmail, `${request.requestorOffice} Office`].filter(Boolean).join(' • ')}
            </span>
          </div>
        </div>
      </section>

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
                  <StockBadge available={line.available} />
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

      <section className="flex flex-col gap-18" aria-labelledby="review-status">
        <h3 id="review-status" className="font-sans text-14 font-bold leading-tight uppercase text-ink-secondary">
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>

      {stopped ? (
        <section className={`flex flex-col gap-9 rounded-10 border p-20 ${stopped.tone}`}>
          <h3 className="type-ui-bold">{stopped.label}</h3>
          <p className="font-sans text-12-5 font-regular">{stopped.reason}</p>
        </section>
      ) : null}
    </SidePanel>
  );
}
