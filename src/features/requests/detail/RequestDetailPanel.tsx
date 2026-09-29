import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { BoxiconsPenAlt, Button, SidePanel, StatusPill } from '../../../shared/ui';
import { formatDateTime } from '../format';
import { ReasonForm } from '../ReasonForm';
import { AccountabilityForm } from './AccountabilityForm';
import { NO_SIGN_PROBLEMS, placeSignProblems, type PlacedSignProblems } from './place-sign-problems';
import type { CancelResult, EmployeeRequest, ReceiveResult, Signature, SignResult } from './request-detail-types';
import { RefusalAlert } from './RefusalAlert';
import { RequestReadBack } from './RequestReadBack';
import { useSingleFlight } from './use-single-flight';

/** The Employee's request detail — a side panel over My Requests (BEN-45,
 *  frames `04.1`, `04.2 - Cancel Request`, `04.2 - Cancelled`).
 *
 *  It reads the request back and offers at most one action, by status:
 *
 *  - **Cancel Request**, only while `Pending Approval` (spec 001 FR-009a);
 *  - **Mark as Received**, only while `For Delivery` or `Ready for Pickup`
 *    (spec 012 Story 0). It asks for confirmation first, because it assigns
 *    the items and cannot be undone; then the request is `Received`;
 *  - **Sign accountability form**, only on a `Received` request not yet signed
 *    (spec 012 FR-001). It turns the panel into the Accountability Form, 564px
 *    wide. A signature the system accepts is recorded on the request; the
 *    status stays `Received`, and the panel says it was signed (FR-009).
 *
 *  The Employee or an Admin sets `Received` (constitution 7.0.0 IV). Nothing
 *  here sets `Completed`, and there is no
 *  *Complete Request* control: `04.1` draws one, but only an Admin completes
 *  (spec 012 FR-001a). A cancelled or rejected request reads back its reason.
 *  Ownership needs no check here: the page only ever holds the signed-in
 *  Employee's own requests. */
const REFUSAL_COPY: Record<Exclude<CancelResult, { ok: true }>['refusal'], string> = {
  'status-changed':
    'This request was updated while you were viewing it and can no longer be cancelled. Its current status is shown above.',
  'reason-required': 'Enter a reason for cancelling this request.',
  unavailable: 'This request could not be cancelled. Close the panel and try again.',
};

/** What the panel says for a refused signature when the system gave no words
 *  of its own (spec 012 D12). */
const SIGN_REFUSAL_COPY = {
  'status-changed':
    'This request changed while you were signing and there is nothing left to sign. Its current state is shown above.',
  unavailable: 'Your signature was not sent. Try again.',
} as const;

/** What the panel says when marking received is refused and the system gave
 *  no words of its own (spec 012 D19). */
const RECEIVE_REFUSAL_COPY = {
  'status-changed': 'This request was updated while you were viewing it and can no longer be marked received. Its current status is shown above.',
  unavailable: 'This request was not marked received. Try again.',
} as const;

type Mode = 'read' | 'cancel' | 'sign' | 'receive';
/** Where focus goes after the panel changes mode (spec 012 D9a): the control
 *  that held it has just unmounted. */
type FocusTarget = 'heading' | 'sign-link' | 'alert' | 'receive-button' | 'receive-prompt';

export function RequestDetailPanel({
  request,
  onClose,
  onCancel,
  onSign,
  onMarkReceived,
}: {
  request: EmployeeRequest;
  onClose: () => void;
  /** Performs the cancel and refreshes the page's copy of the request. */
  onCancel: (id: string, reason: string) => Promise<CancelResult>;
  /** Sends the Accountability Form and refreshes the page's copy of the
   *  request (spec 012). */
  onSign: (id: string, signature: Signature) => Promise<SignResult>;
  /** Marks the request `Received` and refreshes the page's copy of it
   *  (spec 012 Story 0). */
  onMarkReceived: (id: string) => Promise<ReceiveResult>;
}) {
  const formId = useId();
  const [mode, setMode] = useState<Mode>('read');
  const [submitting, setSubmitting] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  // One signature per open form (FR-008), one mark per confirmation (FR-018).
  const [signing, runSign] = useSingleFlight();
  const [receiving, runReceive] = useSingleFlight();
  const [signProblems, setSignProblems] = useState<PlacedSignProblems>(NO_SIGN_PROBLEMS);
  const [signRefusal, setSignRefusal] = useState<string | null>(null);

  const heading = useRef<HTMLHeadingElement>(null);
  const signLink = useRef<HTMLButtonElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const receiveButton = useRef<HTMLButtonElement>(null);
  const receivePrompt = useRef<HTMLParagraphElement>(null);
  const focusNext = useRef<FocusTarget | null>(null);
  // Changing mode unmounts the control that held focus. Put focus where the
  // Employee expects it rather than leaving it on <body>, so a screen-reader
  // user stays inside the dialog (spec 007 FR-002, spec 012 D9a).
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const refs: Record<FocusTarget, RefObject<HTMLElement | null>> = {
      heading,
      'sign-link': signLink,
      alert,
      'receive-button': receiveButton,
      'receive-prompt': receivePrompt,
    };
    (refs[target].current ?? heading.current)?.focus();
  });

  const cancellable = request.status === 'Pending Approval';
  const receivable = request.status === 'For Delivery' || request.status === 'Ready for Pickup';
  const signable = request.status === 'Received' && !request.signedAt;
  const isSigned = request.status === 'Received' && Boolean(request.signedAt);

  const backOut = () => {
    focusNext.current = 'heading';
    setMode('read');
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
    focusNext.current = 'alert';
    setRefusal(REFUSAL_COPY[result.refusal]);
  };

  const confirmReceived = async () => {
    const result = await runReceive(async (): Promise<ReceiveResult> => {
      setRefusal(null);
      try {
        return await onMarkReceived(request.id);
      } catch {
        return { ok: false, refusal: 'unavailable' };
      }
    });
    if (!result) return; // a second press, dropped
    setMode('read');
    if (result.ok) {
      // The next step is the signature, so that is where focus goes.
      focusNext.current = 'sign-link';
      return;
    }
    focusNext.current = 'alert';
    setRefusal(result.detail ?? RECEIVE_REFUSAL_COPY[result.refusal]);
  };

  const openSign = () => {
    setRefusal(null);
    setSignProblems(NO_SIGN_PROBLEMS);
    setSignRefusal(null);
    focusNext.current = 'heading';
    setMode('sign');
  };

  const leaveSign = (focus: FocusTarget) => {
    focusNext.current = focus;
    setMode('read');
    setSignProblems(NO_SIGN_PROBLEMS);
    setSignRefusal(null);
  };

  const sign = async (signature: Signature) => {
    const result = await runSign(async (): Promise<SignResult> => {
      setSignProblems(NO_SIGN_PROBLEMS);
      setSignRefusal(null);
      try {
        return await onSign(request.id, signature);
      } catch {
        return { ok: false, refusal: 'unavailable' };
      }
    });
    if (!result) return; // a second press, dropped
    // FR-009: the page has reloaded; the panel reads `Received` back.
    if (result.ok) {
      leaveSign('heading');
      return;
    }
    // FR-011: the system refused the fields; the form stays, messages placed.
    if (result.refusal === 'invalid') {
      setSignProblems(placeSignProblems(result.problems));
      return;
    }
    // FR-012: the system did not answer; keep what was typed, allow a retry.
    if (result.refusal === 'unavailable') {
      setSignRefusal(result.detail ?? SIGN_REFUSAL_COPY.unavailable);
      return;
    }
    // FR-010: the request changed underneath; show it as it is now.
    leaveSign('alert');
    setRefusal(result.detail ?? SIGN_REFUSAL_COPY['status-changed']);
  };

  const renderFooter = () => {
    if (mode === 'sign') {
      return (
        <div className="flex items-center justify-center gap-12">
          <Button variant="ghost" onClick={() => leaveSign('sign-link')} disabled={signing}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={signing}>
            I acknowledge and sign
          </Button>
        </div>
      );
    }

    if (receivable && mode === 'receive') {
      return (
        <div className="flex flex-col gap-12">
          {/* Focus lands on the prompt, not on Confirm: a second Enter must not
              assign the items by accident (review of #47). */}
          <p ref={receivePrompt} tabIndex={-1} className="type-body text-ink-strong outline-none">
            Confirm you have received every item listed above. This can't be undone.
          </p>
          <div className="flex items-center justify-center gap-12">
            <Button
              variant="ghost"
              onClick={() => {
                focusNext.current = 'receive-button';
                setMode('read');
              }}
              disabled={receiving}
            >
              Cancel
            </Button>
            <Button onClick={() => void confirmReceived()} disabled={receiving}>
              Confirm Received
            </Button>
          </div>
        </div>
      );
    }

    if (receivable) {
      return (
        <Button
          ref={receiveButton}
          variant="ghost"
          className="w-full"
          onClick={() => {
            focusNext.current = 'receive-prompt';
            setMode('receive');
          }}
        >
          Mark as Received
        </Button>
      );
    }

    if (cancellable && mode === 'cancel') {
      return (
        <ReasonForm
          label="Reason for cancellation"
          placeholder="e.g duplicate request..."
          confirmLabel="Confirm Cancellation"
          requiredMessage={REFUSAL_COPY['reason-required']}
          submitting={submitting}
          onBack={backOut}
          onConfirm={confirm}
        />
      );
    }

    if (cancellable) {
      return (
        <Button variant="ghost" className="w-full" onClick={() => setMode('cancel')}>
          Cancel Request
        </Button>
      );
    }

    return undefined;
  };

  return (
    <SidePanel
      title={mode === 'sign' ? `Accountability Form for ${request.id}` : `Request ${request.id}`}
      onClose={onClose}
      width={mode === 'sign' ? 'wide' : 'default'}
      dismissible={!signing && !receiving}
      header={
        mode === 'sign' ? (
          <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
            Accountability Form
          </h2>
        ) : (
          <>
            <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
              {request.id}
            </h2>
            <StatusPill status={request.status} />
          </>
        )
      }
      footer={renderFooter()}
    >
      {mode === 'sign' ? (
        <AccountabilityForm
          id={formId}
          request={request}
          submitting={signing}
          problems={signProblems}
          refusal={signRefusal}
          onSign={(signature) => void sign(signature)}
        />
      ) : (
        <>
          {refusal ? <RefusalAlert ref={alert} messages={[refusal]} /> : null}

          <RequestReadBack request={request} />

          {signable ? (
            <button
              ref={signLink}
              type="button"
              onClick={openSign}
              className="hit-area inline-flex cursor-pointer items-center gap-4 self-start border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-[1.3] text-brand-primary-alt transition-osrs hover:text-brand-primary"
            >
              <BoxiconsPenAlt />
              Sign accountability form
            </button>
          ) : null}

          {/* D18: signing changes no status, so this says it landed. */}
          {isSigned ? (
            <p className="inline-flex items-center gap-4 self-start font-sans text-11-5 font-bold leading-[1.3] text-ink-muted">
              <BoxiconsPenAlt />
              Accountability form signed · {formatDateTime(request.signedAt)}
            </p>
          ) : null}
        </>
      )}
    </SidePanel>
  );
}
