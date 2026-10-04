import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { BoxiconsPenAlt, Button, SidePanel, StatusPill, usePanelTask } from '../../../shared/ui';
import { formatDateTime } from '../format';
import { ReasonForm } from '../ReasonForm';
import { AccountabilityForm } from './AccountabilityForm';
import { ACTION_LINE } from './detail-typography';
import { NO_SIGN_PROBLEMS, placeSignProblems, type PlacedSignProblems } from './place-sign-problems';
import { requestLabel, type CancelResult, type EmployeeRequest, type ReceiveResult, type Signature, type SignResult } from './request-detail-types';
import { RefusalAlert } from './RefusalAlert';
import { RequestReadBack } from './RequestReadBack';

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
 *    wide. A signature the system accepts completes the request in the same
 *    write, and the panel reads `Completed` back and says it was signed
 *    (constitution 10.0.0 IV, ADR-0013).
 *
 *  The Employee or an Admin sets `Received` (constitution 7.0.0 IV). There is
 *  no separate *Complete Request* control: signing is the completion. A
 *  cancelled or rejected request reads back its reason.
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

/** A refused result, carried through `usePanelTask` as its failure so a
 *  toast reports it as one when the panel was closed first. */
class Refused<R> extends Error {
  readonly result: R;
  constructor(result: R) {
    super('refused');
    this.result = result;
  }
}

/** One of the panel's actions, run through `usePanelTask` (one behaviour for
 *  every side drawer, 2026-10-03). Resolves to the result while the panel is
 *  open; to `null` once it has been closed and a toast has taken it over. A
 *  source that throws is `unavailable`. */
async function runAction<R extends { ok: boolean }>(
  task: ReturnType<typeof usePanelTask>,
  key: string,
  copy: { loading: string; done: string; failed: string; refused: (result: R) => string },
  work: () => Promise<R>,
  unavailable: R,
): Promise<R | null> {
  const outcome = await task.run(
    key,
    {
      loading: copy.loading,
      success: () => ({ title: copy.done }),
      failure: (error) => ({ title: copy.failed, body: copy.refused(error instanceof Refused ? (error.result as R) : unavailable) }),
    },
    async () => {
      let result: R;
      try {
        result = await work();
      } catch {
        result = unavailable;
      }
      if (!result.ok) throw new Refused(result);
      return result;
    },
  );
  if (outcome.detached) return null;
  if (outcome.ok) return outcome.value;
  return outcome.error instanceof Refused ? (outcome.error.result as R) : unavailable;
}

/** What the panel says for a refused mark: the system's words for a changed
 *  request, fixed copy when it did not answer (FR-019). */
const receiveRefusal = (result: Exclude<ReceiveResult, { ok: true }>) =>
  result.refusal === 'status-changed' ? (result.detail ?? RECEIVE_REFUSAL_COPY['status-changed']) : RECEIVE_REFUSAL_COPY.unavailable;

/** What the toast says for a refused signature. */
const signRefusalLine = (result: Exclude<SignResult, { ok: true }>) =>
  result.refusal === 'invalid'
    ? 'Open the request to correct the form.'
    : result.refusal === 'status-changed'
      ? (result.detail ?? SIGN_REFUSAL_COPY['status-changed'])
      : SIGN_REFUSAL_COPY.unavailable;

/** The panel's three actions, each run through `usePanelTask` with its own
 *  words. One at a time: a second press is dropped, so one signature per open
 *  form (FR-008) and one mark per confirmation (FR-018). Each resolves to its
 *  result while the panel is open, or to `null` when the press was dropped or
 *  the panel was closed and a toast took it over. */
function useDetailActions(
  request: EmployeeRequest,
  run: {
    onCancel: (id: string, reason: string) => Promise<CancelResult>;
    onMarkReceived: (id: string) => Promise<ReceiveResult>;
    onSign: (id: string, signature: Signature) => Promise<SignResult>;
  },
) {
  const task = usePanelTask();
  const label = requestLabel(request);
  const start = <R extends { ok: boolean }>(
    key: string,
    copy: { loading: string; done: string; failed: string; refused: (result: R) => string },
    work: () => Promise<R>,
    unavailable: R,
  ): Promise<R | null> => (task.inFlight() ? Promise.resolve(null) : runAction<R>(task, key, copy, work, unavailable));

  return {
    busy: task.busy,
    handOff: () => task.handOff(),
    cancelling: task.isRunning('cancel'),
    receiving: task.isRunning('receive'),
    signing: task.isRunning('sign'),
    cancel: (reason: string) =>
      start<CancelResult>(
        'cancel',
        {
          loading: `Cancelling ${label}…`,
          done: `${label} cancelled`,
          failed: `${label} could not be cancelled`,
          refused: (r) => (r.ok ? '' : REFUSAL_COPY[r.refusal]),
        },
        () => run.onCancel(request.id, reason),
        { ok: false, refusal: 'unavailable' },
      ),
    markReceived: () =>
      start<ReceiveResult>(
        'receive',
        {
          loading: `Marking ${label} as received…`,
          done: `${label} marked as received`,
          failed: `${label} could not be marked as received`,
          refused: (r) => (r.ok ? '' : receiveRefusal(r)),
        },
        () => run.onMarkReceived(request.id),
        { ok: false, refusal: 'unavailable' },
      ),
    sign: (signature: Signature) =>
      start<SignResult>(
        'sign',
        {
          loading: `Signing the Accountability Form for ${label}…`,
          done: `Accountability Form signed for ${label}`,
          failed: `The Accountability Form for ${label} was not signed`,
          refused: (r) => (r.ok ? '' : signRefusalLine(r)),
        },
        () => run.onSign(request.id, signature),
        { ok: false, refusal: 'unavailable' },
      ),
  };
}

type Mode = 'read' | 'cancel' | 'sign' | 'receive';
/** Where focus goes after the panel changes mode (spec 012 D9a): the control
 *  that held it has just unmounted. */
type FocusTarget = 'heading' | 'sign-link' | 'alert' | 'receive-button' | 'receive-prompt';

/** The panel's footer for its mode and the request's status: the sign
 *  form's buttons, the receive confirmation, Mark as Received, the cancel
 *  reason form, or Cancel Request — or nothing. Each button names its action
 *  while it runs. */
function DetailFooter({
  mode,
  formId,
  receivable,
  cancellable,
  inFlight,
  locked,
  receivePrompt,
  receiveButton,
  on,
}: {
  mode: Mode;
  formId: string;
  receivable: boolean;
  cancellable: boolean;
  inFlight: { signing: boolean; receiving: boolean; cancelling: boolean };
  /** An action is still running: the entry points wait for it. */
  locked: boolean;
  receivePrompt: RefObject<HTMLParagraphElement | null>;
  receiveButton: RefObject<HTMLButtonElement | null>;
  on: {
    leaveSign: () => void;
    startReceive: () => void;
    backOutOfReceive: () => void;
    confirmReceived: () => void;
    startCancel: () => void;
    backOut: () => void;
    confirmCancel: (reason: string) => Promise<'reason-required' | void>;
  };
}) {
  const { signing, receiving, cancelling } = inFlight;
  if (mode === 'sign') {
    return (
      <div className="flex items-center justify-center gap-12">
        <Button variant="ghost" onClick={on.leaveSign} disabled={signing}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={signing}>
          {signing ? 'Signing…' : 'I acknowledge and sign'}
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
          <Button variant="ghost" onClick={on.backOutOfReceive} disabled={receiving}>
            Cancel
          </Button>
          <Button onClick={on.confirmReceived} disabled={receiving}>
            {receiving ? 'Confirming…' : 'Confirm Received'}
          </Button>
        </div>
      </div>
    );
  }

  if (receivable) {
    return (
      <Button ref={receiveButton} variant="ghost" className="w-full" disabled={locked} onClick={on.startReceive}>
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
        submitting={cancelling}
        submittingLabel="Cancelling…"
        onBack={on.backOut}
        onConfirm={on.confirmCancel}
      />
    );
  }

  if (cancellable) {
    return (
      <Button variant="ghost" className="w-full" disabled={locked} onClick={on.startCancel}>
        Cancel Request
      </Button>
    );
  }

  return null;
}

export function RequestDetailPanel({
  request,
  canSign = true,
  signerName,
  pending = false,
  onClose,
  onCancel,
  onSign,
  onMarkReceived,
}: {
  request: EmployeeRequest;
  /** `false` withholds the Accountability Form and says why (spec 017
   *  Story 4). */
  canSign?: boolean;
  /** The signed-in Employee's full name, signed as-is. */
  signerName: string;
  /** An action on this request is still running, from this panel or one
   *  closed since: every action waits for it. */
  pending?: boolean;
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
  const [refusal, setRefusal] = useState<string | null>(null);
  // The panel's action in flight; closing the panel hands it to a toast.
  const actions = useDetailActions(request, { onCancel, onMarkReceived, onSign });
  const { cancelling: submitting, receiving, signing } = actions;
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
  const isSigned = Boolean(request.signedAt);

  const backOut = () => {
    focusNext.current = 'heading';
    setMode('read');
  };

  // Acceptance 3: `ReasonForm` refuses an empty or whitespace-only reason
  // before this runs, and hands it over trimmed (plan D6).
  const confirm = async (reason: string) => {
    setRefusal(null);
    const result = await actions.cancel(reason);
    if (!result) return; // closed: a toast reports it
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
    setRefusal(null);
    const result = await actions.markReceived();
    if (!result) return; // closed: a toast reports it
    setMode('read');
    if (result.ok) {
      // The next step is the signature, so that is where focus goes.
      focusNext.current = 'sign-link';
      return;
    }
    focusNext.current = 'alert';
    setRefusal(receiveRefusal(result));
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
    setSignProblems(NO_SIGN_PROBLEMS);
    setSignRefusal(null);
    const result = await actions.sign(signature);
    if (!result) return; // closed: a toast reports it
    // The page has reloaded; the panel reads `Completed` back.
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
      setSignRefusal(SIGN_REFUSAL_COPY.unavailable);
      return;
    }
    // FR-010: the request changed underneath; show it as it is now.
    leaveSign('alert');
    setRefusal(result.detail ?? SIGN_REFUSAL_COPY['status-changed']);
  };


  return (
    <SidePanel
      title={mode === 'sign' ? `Accountability Form for ${requestLabel(request)}` : `Request ${requestLabel(request)}`}
      onClose={onClose}
      width={mode === 'sign' ? 'wide' : 'default'}
      busy={actions.busy || pending}
      onLeave={actions.handOff}
      header={
        mode === 'sign' ? (
          <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
            Accountability Form
          </h2>
        ) : (
          <>
            <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
              {requestLabel(request)}
            </h2>
            <StatusPill status={request.status} />
          </>
        )
      }
      // Only when there is something to offer: no footer band otherwise.
      footer={
        mode === 'sign' || receivable || cancellable ? (
        <DetailFooter
          mode={mode}
          formId={formId}
          receivable={receivable}
          cancellable={cancellable}
          inFlight={{ signing, receiving, cancelling: submitting }}
          locked={pending}
          receivePrompt={receivePrompt}
          receiveButton={receiveButton}
          on={{
            leaveSign: () => leaveSign('sign-link'),
            startReceive: () => {
              focusNext.current = 'receive-prompt';
              setMode('receive');
            },
            backOutOfReceive: () => {
              focusNext.current = 'receive-button';
              setMode('read');
            },
            confirmReceived: () => void confirmReceived(),
            startCancel: () => setMode('cancel'),
            backOut,
            confirmCancel: confirm,
          }}
        />
        ) : undefined
      }
    >
      {mode === 'sign' ? (
        <AccountabilityForm
          id={formId}
          request={request}
          submitting={signing}
          problems={signProblems}
          refusal={signRefusal}
          signerName={signerName}
          onSign={(signature) => void sign(signature)}
        />
      ) : (
        <>
          {refusal ? <RefusalAlert ref={alert} messages={[refusal]} /> : null}

          <RequestReadBack request={request} />

          {/* Spec 017 Story 4: the API's sign would complete the request. */}
          {signable && !canSign ? (
            <p className={`${ACTION_LINE} text-ink-muted`}>
              <BoxiconsPenAlt />
              Signing is not available yet.
            </p>
          ) : null}

          {signable && canSign ? (
            <button
              ref={signLink}
              type="button"
              disabled={pending}
              onClick={openSign}
              className={`hit-area ${ACTION_LINE} cursor-pointer border-none bg-transparent p-0 text-brand-primary-alt transition-osrs hover:text-brand-primary`}
            >
              <BoxiconsPenAlt />
              Sign accountability form
            </button>
          ) : null}

          {/* Says when the form was signed; signing completed the request. */}
          {isSigned ? (
            <p className={`${ACTION_LINE} text-ink-muted`}>
              <BoxiconsPenAlt />
              Accountability form signed · {formatDateTime(request.signedAt)}
            </p>
          ) : null}
        </>
      )}
    </SidePanel>
  );
}
