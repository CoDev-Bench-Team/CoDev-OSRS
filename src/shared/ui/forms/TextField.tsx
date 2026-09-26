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
 *  only shows the result. */
export function TextField({
  label,
  required,
  invalid,
  message,
  tone = 'neutral',
  className,
  onKeyDown,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  message?: string;
  tone?: 'neutral' | 'danger';
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const submitOnEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };
  const block =
    tone === 'danger'
      ? 'bg-status-rejected-bg ring-brand-alt'
      : invalid
        ? 'bg-status-rejected-bg ring-brand'
        : 'bg-surface-card ring-default';
  const labelColour =
    tone === 'danger' ? 'text-brand-primary-alt' : invalid ? 'text-status-rejected-fg' : 'text-ink-strong';
  return (
    <div className={`flex flex-col gap-12 rounded-10 p-20 ${block} ${className ?? ''}`}>
      <label htmlFor={id} className={`type-subhead ${labelColour}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        id={id}
        rows={1}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && message ? messageId : undefined}
        onKeyDown={submitOnEnter}
        className={`min-h-[58px] max-h-[160px] w-full resize-none [field-sizing:content] appearance-none rounded-8 border-none bg-surface-card px-14 py-14 font-sans text-14 text-ink-primary outline-none transition-osrs placeholder:text-ink-muted focus:ring-brand ${invalid ? 'ring-brand' : 'ring-default'}`}
        {...rest}
      />
      {invalid && message ? (
        <span id={messageId} className="type-meta text-status-rejected-fg">
          {message}
        </span>
      ) : null}
    </div>
  );
}
