import { useRef, useState, type FormEvent } from 'react';
import { Checkbox, InputField } from '../../../shared/ui';
import { ACKNOWLEDGEMENT } from './accountability-conditions';
import type { PlacedSignProblems } from './place-sign-problems';
import type { EmployeeRequest, Signature } from './request-detail-types';
import { RefusalAlert } from './RefusalAlert';
import { RequestLinesTable } from './RequestLinesTable';
import { useReadToEnd } from './use-read-to-end';

/** The copy the form speaks in its own voice (spec 012 D8a, D10). Everything
 *  the system says is shown as the system worded it. */
const SIGN_COPY = {
  agree: 'Tick the box to confirm you agree to the conditions.',
  readFirst: 'Scroll to the end of the acknowledgement and read it before agreeing.',
  name: 'Type your full name to sign.',
} as const;

const HEADING = 'font-sans text-14 font-bold leading-body uppercase text-ink-muted';

/** The Accountability Form's body (spec 012, `04.1`'s form view): EQUIPMENT
 *  ASSIGNED, the ACKNOWLEDGEMENT in its scrolling box, the agreement, and the
 *  typed name. The panel renders the submit buttons in its pinned footer and
 *  points them at this form by `id` (D4), and owns what happens after a
 *  signature is sent (D12).
 *
 *  This owns what happens before: nothing is sent until the agreement is
 *  ticked and the name is not blank (FR-005, FR-006), and the agreement cannot
 *  be ticked until the acknowledgement has been scrolled to its end
 *  (FR-005a). Opening the form again mounts it afresh, so the gate starts over.
 *
 *  The drawn *Other Notes* card is not here: it is a note from the Admin side
 *  and waits on a design change (spec 012, Out of Scope). */
export function AccountabilityForm({
  id,
  request,
  submitting,
  problems,
  refusal,
  onSign,
}: {
  id: string;
  request: EmployeeRequest;
  submitting: boolean;
  /** The system's refusal, placed by field (D13). */
  problems: PlacedSignProblems;
  /** A refusal of the whole form that the system gave no words for (D12). */
  refusal: string | null;
  onSign: (signature: Signature) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const read = useReadToEnd(box);
  const checkbox = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agreedMessage, setAgreedMessage] = useState<string | null>(null);
  const [nameInvalid, setNameInvalid] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const name = fullName.trim();
    const agreeProblem = agreed ? null : read ? SIGN_COPY.agree : SIGN_COPY.readFirst;
    setAgreedMessage(agreeProblem);
    setNameInvalid(!name);
    if (agreeProblem) {
      checkbox.current?.focus();
      return;
    }
    if (!name) {
      nameInput.current?.focus();
      return;
    }
    onSign({ agreed: true, fullName: name });
  };

  // The form's own message wins; the system's, when it named the field, shows
  // otherwise.
  // FR-005a: the read-first message goes the moment the gate opens.
  const ownAgreed = read && agreedMessage === SIGN_COPY.readFirst ? null : agreedMessage;
  const agreedShown = ownAgreed ?? (problems.agreed.length ? problems.agreed.join(' ') : undefined);
  const nameShown = nameInvalid ? SIGN_COPY.name : problems.fullName.length ? problems.fullName.join(' ') : undefined;
  const topMessages = [...(refusal ? [refusal] : []), ...problems.form];

  return (
    <form id={id} onSubmit={submit} noValidate className="flex flex-col gap-16">
      {topMessages.length ? <RefusalAlert messages={topMessages} /> : null}

      <section className="flex flex-col gap-8" aria-labelledby={`${id}-equipment`}>
        <h3 id={`${id}-equipment`} className={HEADING}>
          Equipment Assigned
        </h3>
        <RequestLinesTable lines={request.lines} />
      </section>

      <section className="flex flex-col gap-8" aria-labelledby={`${id}-acknowledgement`}>
        <h3 id={`${id}-acknowledgement`} className={HEADING}>
          Acknowledgement
        </h3>
        {/* 412px, as drawn; the text runs longer, so the box scrolls, and it
            takes focus so a keyboard can scroll it to its end (D8, D8a). The
            border binds the file's `Border-Strong` (`--color-osrs-border-strong`) — not the black
            `--color-line-strong` the cached paint suggests. */}
        <div
          ref={box}
          role="region"
          aria-label="Acknowledgement"
          tabIndex={0}
          className="flex h-[412px] flex-col gap-10 overflow-y-auto rounded-8 border border-osrs-border-strong p-10 font-sans text-12-5 leading-[1.45] text-ink-primary"
        >
          <p>{ACKNOWLEDGEMENT.leadIn}</p>
          <ol className="flex list-decimal flex-col gap-4 pl-20">
            {ACKNOWLEDGEMENT.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <p>{ACKNOWLEDGEMENT.closing}</p>
        </div>
        <Checkbox
          ref={checkbox}
          label="I have read and agree to the above"
          checked={agreed}
          unavailable={!read}
          invalid={Boolean(agreedShown) && read}
          message={agreedShown}
          onBlockedAttempt={() => setAgreedMessage(SIGN_COPY.readFirst)}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setAgreedMessage(null);
          }}
        />
      </section>

      <InputField
        ref={nameInput}
        label="Type full name to sign"
        required
        autoComplete="name"
        value={fullName}
        invalid={Boolean(nameShown)}
        message={nameShown}
        readOnly={submitting}
        onChange={(e) => {
          setFullName(e.target.value);
          if (nameInvalid && e.target.value.trim()) setNameInvalid(false);
        }}
      />
    </form>
  );
}
