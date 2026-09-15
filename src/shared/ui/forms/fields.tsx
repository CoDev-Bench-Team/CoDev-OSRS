import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

/** The labelled form field drawn in the item drawer (figma 98:23378 "Field").
 *
 *  It is the first text input the design system has: spec 002 ported `Search`
 *  and nothing else, because no earlier frame contained a form. The geometry is
 *  the drawn one and differs from `Search` deliberately — 39px rather than 46,
 *  a 6px radius rather than 10, 12px text rather than 14, and a real 1px warm
 *  border rather than the ring. Both the height and the radius are values the
 *  vendored token export does not carry; see docs/design-system/additions.md.
 *
 *  `children` is a function rather than a node so the label's `htmlFor` and the
 *  control's `id` cannot drift apart: a field with no accessible name is not
 *  expressible through this component. */
export function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  /** Renders the drawn red asterisk and marks the control required. */
  required?: boolean;
  children: (control: { id: string; required: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex w-full flex-col gap-6 ${className ?? ''}`}>
      {/* 11px bold, but on the browser's normal line box rather than the
          eyebrow role's 100%: the drawn label occupies 13px, and that 2px is
          what keeps a column of fields on the frame's 58px rhythm. */}
      <label htmlFor={id} className="font-sans text-11 font-bold text-osrs-ink-800">
        {label}
        {required ? <span className="text-brand-primary"> *</span> : null}
      </label>
      {children({ id, required: required === true })}
    </div>
  );
}

/** The drawn input box. 39px tall, 6px radius, 12px text, warm hairline
 *  border. The focus indicator comes from the global `:focus-visible` rule in
 *  index.css — never suppress it. */
export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-[39px] w-full rounded-6 border border-osrs-border-warm bg-surface-card px-12 type-meta text-osrs-ink-800 transition-osrs placeholder:text-ink-muted ${className ?? ''}`}
      {...rest}
    />
  );
}
