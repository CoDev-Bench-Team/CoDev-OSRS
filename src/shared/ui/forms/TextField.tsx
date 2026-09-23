import { useId, type InputHTMLAttributes } from 'react';

/** The labelled input from the cancel form (`04.2 - Cancel Request`).
 *
 *  `required` draws the asterisk the file uses; `invalid` is the pink block the
 *  file draws around the field, plus the message that says why, announced to a
 *  screen reader through `aria-describedby`. Validation itself is the caller's —
 *  this only shows the result. */
export function TextField({
  label,
  required,
  invalid,
  message,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  message?: string;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div
      className={`flex flex-col gap-8 rounded-8 p-12 ring-default ${invalid ? 'bg-status-rejected-bg ring-brand' : 'bg-surface-card'} ${className ?? ''}`}
    >
      <label htmlFor={id} className={`type-ui-bold ${invalid ? 'text-status-rejected-fg' : 'text-ink-strong'}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && message ? messageId : undefined}
        className="h-control-height-md w-full appearance-none rounded-8 border-none bg-surface-card px-12 font-sans text-13 text-ink-primary ring-default outline-none transition-osrs placeholder:text-ink-muted focus:ring-brand"
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
