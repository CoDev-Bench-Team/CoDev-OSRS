import { useEffect, useRef, useState } from 'react';
import { Button, SidePanel, StatusPill } from '../../../shared/ui';
import { ReasonForm } from '../ReasonForm';
import type { CancelResult, EmployeeRequest } from './request-detail-types';
import { RefusalAlert } from './RefusalAlert';
import { RequestReadBack } from './RequestReadBack';

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
      // A source that throws is the system not answering: shown as a refusal,
      // never left to escape with the button stuck on submitting.
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
      {refusal ? <RefusalAlert messages={[refusal]} /> : null}

      <RequestReadBack request={request} />
    </SidePanel>
  );
}
