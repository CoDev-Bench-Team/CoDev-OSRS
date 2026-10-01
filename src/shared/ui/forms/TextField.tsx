import { useId, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';

/** A labelled text box. The design draws one, the cancel reason in
 *  `04.2 - Cancel Request`, and that is `tone="danger"`.
 *
 *  - `danger` — the drawn pink block, red label and red outline, around a 58px
 *    white box. It marks a destructive step, so it is the block's resting look.
 *  - `neutral` (default) — a plain white card with the same box inside, for any
 *    field that is not a destructive step. It turns pink only when invalid.
 *
 *  The box is a one-row textarea that grows with its text (`field-sizing`), up
 *  to 160px, then scrolls; a browser without `field-sizing` keeps the 58px box
 *  and scrolls sooner. Enter still submits the form, as a one-line field would, and
 *  Shift+Enter breaks the line. `required` draws the asterisk; `invalid` rings
 *  the box in red and adds the message that says why, announced to a screen
 *  reader through `aria-describedby`. Validation itself is the caller's — this
 *  only shows the result.
 *
 *  For a one-line field, use `InputField` (`04.1`'s *Type full name to sign*).
 *  The two share `required` / `invalid` / `message` and the `aria-describedby`
 *  wiring, so a form treats them alike (spec 012 D6). */
/** The block and label colours: a danger field keeps its pink at rest; a
 *  neutral one turns pink only when invalid. */
const LOOK = {
  danger: { block: 'bg-status-rejected-bg ring-brand-alt', label: 'text-brand-primary-alt' },
  invalid: { block: 'bg-status-rejected-bg ring-brand', label: 'text-status-rejected-fg' },
  resting: { block: 'bg-surface-card ring-default', label: 'text-ink-strong' },
} as const;

const SIZE = {
  md: { label: 'type-subhead', box: 'min-h-[58px] text-14' },
  sm: { label: 'font-sans text-13 font-bold leading-tight', box: 'min-h-[56px] text-12' },
} as const;

/** Enter submits the form, as a one-line field would; Shift+Enter, an input
 *  method's composition, or a handler that already took the key does not. */
function submitsOnEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
  return !e.defaultPrevented && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing;
}

export function TextField({
  label,
  required,
  invalid,
  message,
  tone = 'neutral',
  size = 'md',
  className,
  onKeyDown,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  message?: string;
  tone?: 'neutral' | 'danger';
  /** `sm` is Inventory's `Reason for removal *`: a 13px label over 12px text
   *  in a 56px box (spec 015). */
  size?: keyof typeof SIZE;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const showMessage = invalid === true && !!message;
  const look = LOOK[tone === 'danger' ? 'danger' : invalid ? 'invalid' : 'resting'];
  const submitOnEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (!submitsOnEnter(e)) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };
  return (
    <div className={`flex flex-col gap-12 rounded-10 p-20 ${look.block} ${className ?? ''}`}>
      <label htmlFor={id} className={`${SIZE[size].label} ${look.label}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        id={id}
        rows={1}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={showMessage ? messageId : undefined}
        onKeyDown={submitOnEnter}
        className={`${SIZE[size].box} max-h-[160px] w-full resize-none [field-sizing:content] appearance-none rounded-8 border-none bg-surface-card px-14 py-14 font-sans text-ink-primary outline-none transition-osrs placeholder:text-ink-muted focus:ring-brand ${invalid ? 'ring-brand' : 'ring-default'}`}
        {...rest}
      />
      {showMessage ? (
        <span id={messageId} className="type-meta text-status-rejected-fg">
          {message}
        </span>
      ) : null}
    </div>
  );
}
