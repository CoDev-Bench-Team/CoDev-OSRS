import { useId, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';

/** The labelled reason box from the cancel form (`04.2 - Cancel Request`).
 *
 *  The file draws it as a pink block — red label, red outline — around a white
 *  box whose placeholder sits at the top, so the box is a textarea that wraps a
 *  long reason. Enter still submits the form, as a one-line field would;
 *  Shift+Enter breaks the line. `required` draws the asterisk; `invalid` rings
 *  the box in red and adds the message that says why, announced to a screen
 *  reader through `aria-describedby`. Validation itself is the caller's — this
 *  only shows the result. */
export function TextField({
  label,
  required,
  invalid,
  message,
  className,
  onKeyDown,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  message?: string;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const submitOnEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };
  return (
    <div
      className={`flex flex-col gap-12 rounded-10 bg-status-rejected-bg p-20 ring-brand-alt ${className ?? ''}`}
    >
      <label htmlFor={id} className="type-subhead text-brand-primary-alt">
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
        className={`min-h-[58px] w-full resize-none appearance-none rounded-8 border-none bg-surface-card px-14 py-14 font-sans text-14 text-ink-primary outline-none transition-osrs placeholder:text-ink-muted focus:ring-brand ${invalid ? 'ring-brand' : 'ring-default'}`}
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
