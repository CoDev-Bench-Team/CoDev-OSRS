import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

/** The labelled field drawn in the admin side panels (`03.1 Add Asset`,
 *  `03.4 - Update Stocks`, and the 2026-09-18 item drawer before them).
 *
 *  The drawn geometry differs from `Search` deliberately: 39px rather than 46,
 *  a 6px radius rather than 10, 12px text rather than 14, and a warm hairline
 *  rather than the ring.
 *
 *  `children` is a function so the label's `htmlFor`, the control's `id` and
 *  the message's `aria-describedby` cannot drift apart. `error` is the one
 *  message shown beneath the control — from client-side checks or from the
 *  contract's `errors[].pointer` via `shared/validation.ts`. */
export type FieldControl = {
  id: string;
  required: boolean;
  invalid: boolean;
  describedBy: string | undefined;
};

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  /** Standing help under the control, e.g. an uploader's accepted formats.
   *  Replaced by `error` when there is one. */
  hint?: ReactNode;
  children: (control: FieldControl) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={`flex w-full flex-col gap-6 ${className ?? ''}`}>
      <label htmlFor={id} className="font-sans text-11 font-bold text-osrs-ink-800">
        {label}
        {required ? <span className="text-brand-primary"> *</span> : null}
      </label>
      {children({ id, required: required === true, invalid: !!error, describedBy: message ? messageId : undefined })}
      {message ? (
        <span
          id={messageId}
          className={`type-meta leading-body ${error ? 'text-status-rejected-fg' : 'text-ink-secondary'}`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}

const BOX =
  'w-full rounded-6 border bg-surface-card px-12 type-meta text-osrs-ink-800 transition-osrs placeholder:text-ink-muted read-only:bg-osrs-surface-subtle disabled:bg-osrs-surface-subtle disabled:text-ink-secondary';

/** 39px, 6px radius, 12px text, warm hairline; red hairline when invalid. The
 *  focus indicator is the global `:focus-visible` rule — never suppress it. */
export function TextInput({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`h-[39px] ${BOX} ${invalid ? 'border-status-rejected-fg' : 'border-osrs-border-warm'} ${className ?? ''}`}
      {...rest}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`min-h-[88px] resize-y py-10 leading-body ${BOX} ${invalid ? 'border-status-rejected-fg' : 'border-osrs-border-warm'} ${className ?? ''}`}
      {...rest}
    />
  );
}

/** A band of fields under an uppercase heading: BASICS, SPECIFICATIONS, STOCKS. */
export function FieldGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-14">
      <h3 className="font-sans text-14 font-bold leading-body text-ink-muted">{heading}</h3>
      <div className="flex w-full flex-col gap-12">{children}</div>
    </section>
  );
}
