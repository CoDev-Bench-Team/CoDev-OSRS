import { useId, type InputHTMLAttributes, type KeyboardEvent, type MouseEvent, type Ref } from 'react';

/** A labelled checkbox, as the file's `.bases / checkbox` draws it (`04.1`'s
 *  *I have read and agree to the above*): a 24px box holding a 22px thumb,
 *  `r=6`. Unticked, the thumb is white with a 1px inside black border; ticked,
 *  it is solid black. The drawn paints are unbound raw black, so they take
 *  `--color-black` (spec 012 D5). The label is `Body 1` in `Ink-900`, 4px after
 *  the box.
 *
 *  The input is a real `<input type="checkbox">`, visually hidden over the
 *  drawn box, so keyboard, form and screen-reader behaviour are the platform's.
 *
 *  Two states the file does not draw (additions §3h):
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
  const messageId = `${id}-message`;
  const hintId = `${id}-hint`;
  const shownMessage = message && (invalid || unavailable) ? message : undefined;
  const shownHint = unavailable && !shownMessage ? unavailableHint : undefined;

  // A click on the input or its label toggles the box before `change` fires,
  // so the refusal belongs here: cancel the toggle and say why.
  const blockClick = (e: MouseEvent<HTMLInputElement>) => {
    if (!unavailable) {
      rest.onClick?.(e);
      return;
    }
    e.preventDefault();
    onBlockedAttempt?.();
  };
  // Space toggles a checkbox on keyup; cancelling keydown alone does not stop
  // it in every browser, but the click it synthesises is caught above. This
  // only keeps the page from scrolling.
  const blockKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (unavailable && e.key === ' ') e.preventDefault();
    rest.onKeyDown?.(e);
  };

  const thumb = unavailable
    ? 'bg-osrs-border-strong'
    : checked
      ? 'bg-black'
      : `bg-surface-card ${invalid ? 'ring-brand' : 'ring-ink'}`;

  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <label htmlFor={id} className={`flex items-center gap-4 ${unavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className="relative flex size-24 shrink-0 items-center justify-center rounded-8 has-focus-visible:shadow-[0_0_0_2px_var(--color-brand-primary)]">
          <input
            {...rest}
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            aria-disabled={unavailable || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={shownMessage ? messageId : shownHint ? hintId : undefined}
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
        <span id={messageId} role={unavailable ? 'status' : undefined} className="type-meta text-status-rejected-fg">
          {shownMessage}
        </span>
      ) : null}
      {shownHint ? (
        <span id={hintId} className="sr-only">
          {shownHint}
        </span>
      ) : null}
    </div>
  );
}
