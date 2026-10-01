import { useId, useState, type InputHTMLAttributes, type KeyboardEvent, type MouseEvent, type Ref } from 'react';

/** A labelled checkbox, as the file's `.bases / checkbox` draws it (`04.1`'s
 *  *I have read and agree to the above*): a 24px box holding a 22px thumb,
 *  `r=6`. Unticked, the thumb is white with a 1px inside black border; ticked,
 *  it is solid black. The drawn paints are unbound raw black, so they take
 *  `--color-black` (spec 012 D5). The label is `Body 1` in `Ink-900`, 4px after
 *  the box.
 *
 *  The input is a real `<input type="checkbox">`, visually hidden over the
 *  drawn box, so keyboard, form and screen-reader behaviour are the platform's.
 *  Native attributes pass through to it: `required` is announced as required
 *  (spec 012 FR-014); no asterisk is drawn, as the file draws none.
 *
 *  Two states the file does not draw (additions §3i):
 *
 *  - `invalid`: the box takes the red ring, and `message` shows under it,
 *    announced through `aria-describedby`, as `TextField` does.
 *  - `unavailable`: `aria-disabled="true"`, **never** the native `disabled`.
 *    A disabled input fires no click and cannot take focus, so it could never
 *    tell anyone why it will not tick. While unavailable, the box stays
 *    focusable, refuses to change, and calls `onBlockedAttempt` on a click or
 *    Space, so the caller can say why. The thumb takes `Border-Strong` and the
 *    label `Ink-400`. `unavailableHint`, when given, is read out as the box's
 *    description until a `message` replaces it, so a screen-reader user hears
 *    why it is locked before trying it (review of #47).
 *
 *  The tick is not drawn: the ticked state's icon slot holds the library's
 *  `favorite` placeholder in black on a black thumb. A white check stands in. */
export function Checkbox({
  label,
  checked,
  invalid,
  unavailable,
  message,
  unavailableHint,
  onBlockedAttempt,
  onChange,
  className,
  ref,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'disabled'> & {
  label: string;
  checked: boolean;
  invalid?: boolean;
  unavailable?: boolean;
  message?: string;
  /** Read out while unavailable and no `message` is showing. */
  unavailableHint?: string;
  onBlockedAttempt?: () => void;
  ref?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const { shownMessage, shownHint, describedBy, thumb } = checkboxLook({ id, checked, invalid, unavailable, message, unavailableHint });
  // Counts blocked attempts, so each one is announced, not only the first.
  const [attempts, setAttempts] = useState(0);
  // A box locked again later must wait for a new attempt before it speaks.
  if (attempts > 0 && !unavailable) setAttempts(0);

  // A click on the input or its label toggles the box before `change` fires,
  // so the refusal belongs here: cancel the toggle and say why.
  const blockClick = (e: MouseEvent<HTMLInputElement>) => {
    if (!unavailable) {
      rest.onClick?.(e);
      return;
    }
    e.preventDefault();
    setAttempts((n) => n + 1);
    onBlockedAttempt?.();
  };
  // Cancelling Space on keydown stops Chromium from synthesising the click,
  // so the refusal is said here too. A browser that still clicks reaches
  // `blockClick` as well, which says the same thing again.
  const blockKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (unavailable && e.key === ' ') {
      e.preventDefault();
      setAttempts((n) => n + 1);
      onBlockedAttempt?.();
    }
    rest.onKeyDown?.(e);
  };

  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <label htmlFor={id} className={`flex items-center gap-4 ${unavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className="hit-area flex size-24 shrink-0 items-center justify-center rounded-8 has-focus-visible:shadow-[0_0_0_2px_var(--color-brand-primary)]">
          <input
            {...rest}
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            aria-disabled={unavailable || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onClick={blockClick}
            onChange={(e) => {
              if (!unavailable) onChange?.(e);
            }}
            onKeyDown={blockKey}
            className="absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0 outline-none"
          />
          <span
            aria-hidden="true"
            className={`flex size-22 items-center justify-center rounded-6 transition-osrs ${thumb}`}
          >
            {checked ? (
              <svg viewBox="0 0 16 16" className="size-16" fill="none">
                <path d="M3.5 8.5L6.5 11.5L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
        </span>
        <span className={`type-body ${unavailable ? 'text-ink-muted' : 'text-ink-strong'}`}>{label}</span>
      </label>
      {shownMessage ? (
        <span id={`${id}-message`} className="type-meta text-status-rejected-fg">
          {shownMessage}
        </span>
      ) : null}
      {/* A blocked attempt keeps focus on the box, so its message is announced
          here. Only after one: a message that arrives with focus is already
          read as the description. Always mounted: a live region that appears
          with its text is not reliably read out. Its text is keyed by the
          attempt, so a repeated attempt replaces the node and is read again. */}
      <span role="status" className="sr-only">
        {attempts > 0 && unavailable ? <span key={attempts}>{shownMessage}</span> : null}
      </span>
      {shownHint ? (
        <span id={`${id}-hint`} className="sr-only">
          {shownHint}
        </span>
      ) : null}
    </div>
  );
}

/** What the box shows for its state: which message or hint is out, what
 *  describes the input, and the thumb's paint. */
function checkboxLook({
  id,
  checked,
  invalid,
  unavailable,
  message,
  unavailableHint,
}: {
  id: string;
  checked: boolean;
  invalid?: boolean;
  unavailable?: boolean;
  message?: string;
  unavailableHint?: string;
}) {
  const shownMessage = message && (invalid || unavailable) ? message : undefined;
  const shownHint = unavailable && !shownMessage ? unavailableHint : undefined;
  let describedBy: string | undefined;
  if (shownMessage) describedBy = `${id}-message`;
  else if (shownHint) describedBy = `${id}-hint`;
  let thumb: string;
  if (unavailable) thumb = 'bg-osrs-border-strong';
  else if (checked) thumb = 'bg-black';
  else thumb = `bg-surface-card ${invalid ? 'ring-brand' : 'ring-ink'}`;
  return { shownMessage, shownHint, describedBy, thumb };
}
