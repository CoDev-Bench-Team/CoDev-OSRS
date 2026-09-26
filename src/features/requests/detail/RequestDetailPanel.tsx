import { useEffect, useRef, useState } from 'react';
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
import type { CancelResult, EmployeeRequest } from './request-detail-types';
import { keyedLines } from '../format';
import { ReasonForm } from '../ReasonForm';
import { requestTimeline } from '../request-timeline';

/** The Employee's request detail — a side panel over My Requests (BEN-45,
 *  frames `04.1`, `04.2 - Cancel Request`, `04.2 - Cancelled`).
 *
 *  It reads the request back and offers exactly one action: **Cancel Request**,
 *  and only while the request is `Pending Approval` (spec 001 FR-009a). There
 *  is no confirm-receipt control in any state — an Admin completes a
 *  request (FR-012a, ADR-0007). A cancelled or rejected request reads back
 *  its reason. Ownership needs no check here: the page only
 *  ever holds the signed-in Employee's own requests. */
const REFUSAL_COPY: Record<Exclude<CancelResult, { ok: true }>['refusal'], string> = {
  'status-changed':
    'This request was updated while you were viewing it and can no longer be cancelled. Its current status is shown above.',
  'reason-required': 'Enter a reason for cancelling this request.',
  unavailable: 'This request could not be cancelled. Close the panel and try again.',
};

const QTY_WIDTH: ColumnWidth = '48px';

export function RequestDetailPanel({
  request,
  onClose,
  onCancel,
}: {
  request: EmployeeRequest;
  onClose: () => void;
  /** Performs the cancel and refreshes the page's copy of the request. */
  onCancel: (id: string, reason: string) => Promise<CancelResult>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  // Closing the cancel form unmounts the control that held focus. Put focus
  // back on the panel's heading rather than leaving it on <body>, so a
  // screen-reader user stays inside the dialog (FR-002).
  const heading = useRef<HTMLHeadingElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) heading.current?.focus();
  });

  const cancellable = request.status === 'Pending Approval';
  // BEN-67 / BEN-70: a stopped request reads back why. The `04.2 - Cancelled`
  // frame does not draw it; Linear asks for it (additions.md §3e).
  const stopped =
    request.status === 'Cancelled' && request.cancellation
      ? { label: 'Reason for cancellation', reason: request.cancellation.reason }
      : request.status === 'Rejected' && request.rejection
        ? { label: 'Reason for rejection', reason: request.rejection.reason }
        : null;

  const backOut = () => {
    refocus.current = true;
    setConfirming(false);
  };

  // Acceptance 3: `ReasonForm` refuses an empty or whitespace-only reason
  // before this runs, and hands it over trimmed (plan D6).
  const confirm = async (reason: string) => {
    setSubmitting(true);
    setRefusal(null);
    let result: CancelResult;
    try {
      result = await onCancel(request.id, reason);
    } catch {
      // A thrown cancel reads as `unavailable`, and the buttons come back.
      result = { ok: false, refusal: 'unavailable' };
    } finally {
      setSubmitting(false);
    }
    if (result.ok) {
      backOut();
      return;
    }
    if (result.refusal === 'reason-required') return 'reason-required' as const;
    backOut();
    setRefusal(REFUSAL_COPY[result.refusal]);
  };

  const footer = !cancellable ? undefined : confirming ? (
    <ReasonForm
      label="Reason for cancellation"
      placeholder="e.g duplicate request..."
      confirmLabel="Confirm Cancellation"
      requiredMessage={REFUSAL_COPY['reason-required']}
      submitting={submitting}
      onBack={backOut}
      onConfirm={confirm}
    />
  ) : (
    <Button variant="ghost" className="w-full" onClick={() => setConfirming(true)}>
      Cancel Request
    </Button>
  );

  return (
    <SidePanel
      title={`Request ${request.id}`}
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
      {refusal ? (
        <p role="alert" className="rounded-8 bg-status-rejected-bg px-12 py-10 type-body text-status-rejected-fg">
          {refusal}
        </p>
      ) : null}

      <section className="flex flex-col gap-10" aria-labelledby="items-requested">
        <h3 id="items-requested" className="type-eyebrow uppercase text-ink-secondary">
          Items Requested
        </h3>
        <TableCard>
          <TableHead cols={[['Item'], ['Qty', QTY_WIDTH]]} />
          <ul>
            {keyedLines(request.lines).map(({ key, line }) => (
              <li key={key} className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                <span style={tableColumnStyle()} className="type-ui-bold-wrap text-ink-primary">
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
        <section className="flex flex-col gap-8 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-ui-bold text-ink-primary">Note to Approver</h3>
          <p className="type-meta text-ink-body">{request.noteToApprover}</p>
        </section>
      ) : null}

      {stopped ? (
        <section className="flex flex-col gap-8 rounded-10 bg-surface-card p-20 shadow-card">
          <h3 className="type-ui-bold text-ink-primary">{stopped.label}</h3>
          <p className="type-meta text-ink-body">{stopped.reason}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-18" aria-labelledby="request-status">
        <h3 id="request-status" className="font-sans text-14 font-bold leading-tight uppercase text-ink-secondary">
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>
    </SidePanel>
  );
}
