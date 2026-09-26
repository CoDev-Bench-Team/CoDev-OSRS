import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, SidePanel, StatusPill, TextField } from '../../../shared/ui';
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
  const [reason, setReason] = useState('');
  const [invalid, setInvalid] = useState(false);
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
    setReason('');
    setInvalid(false);
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    // Acceptance 3: an empty reason — or one that is only spaces — is refused
    // here, before anything is sent, and the status does not change.
    if (!reason.trim()) {
      setInvalid(true);
      return;
    }
    setSubmitting(true);
    setRefusal(null);
    // Sent trimmed (plan D6), so no source has to trim it again.
    let result: CancelResult;
    try {
      result = await onCancel(request.id, reason.trim());
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
    if (result.refusal === 'reason-required') {
      setInvalid(true);
      return;
    }
    backOut();
    setRefusal(REFUSAL_COPY[result.refusal]);
  };

  const footer = !cancellable ? undefined : confirming ? (
    <form onSubmit={confirm} className="flex flex-col gap-12" noValidate>
      <TextField
        label="Reason for cancellation"
        tone="danger"
        required
        autoFocus
        placeholder="e.g duplicate request..."
        value={reason}
        invalid={invalid}
        message={REFUSAL_COPY['reason-required']}
        onChange={(e) => {
          setReason(e.target.value);
          if (invalid && e.target.value.trim()) setInvalid(false);
        }}
      />
      <div className="flex items-center justify-center gap-12">
        <Button variant="ghost" onClick={backOut} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          Confirm Cancellation
        </Button>
      </div>
    </form>
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
