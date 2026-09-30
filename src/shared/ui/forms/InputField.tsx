import { useId, type InputHTMLAttributes, type Ref } from 'react';

/** A labelled one-line text input, as `04.1`'s Accountability Form draws its
 *  `Field` (*Type full name to sign*): the label in Inter Bold 11, `Ink-900`,
 *  6px above a 39px box with the file's `Border` stroke, `r=6`, 12px side
 *  padding, value in Inter Regular 12.
 *
 *  Not `TextField`: that is `04.2`'s growing textarea inside a card, drawn for
 *  a reason that may run long. This is for one line. The two share
 *  `required` / `invalid` / `message` and the `aria-describedby` wiring, so a
 *  form treats them alike (spec 012 D6). `required` draws the asterisk;
 *  `invalid` rings the box in red and shows the message. Validation is the
 *  caller's — this only shows the result. */
export function InputField({
  label,
  required,
  invalid,
  message,
  className,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  message?: string;
  ref?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <label htmlFor={id} className="font-sans text-11 font-bold leading-none text-ink-strong">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        type="text"
        {...rest}
        ref={ref}
        id={id}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && message ? messageId : undefined}
        className={`h-[39px] w-full appearance-none rounded-6 border-none bg-surface-card px-12 font-sans text-12 text-ink-strong transition-osrs placeholder:text-ink-muted focus:ring-brand ${invalid ? 'ring-brand' : 'ring-warm'}`}
      />
      {invalid && message ? (
        <span id={messageId} className="type-meta text-status-rejected-fg">
          {message}
        </span>
      ) : null}
    </div>
  );
}
