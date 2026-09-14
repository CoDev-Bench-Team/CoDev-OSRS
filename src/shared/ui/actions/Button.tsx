import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Promoted from the UI kit's local helper (spec 002 FR-006).
 *
 *  `accent` is not a mistake: the source uses a second red
 *  (`--osrs-red-500`) on "+ Add Catalog Item" and the catalog card's add
 *  button. Both reds are deliberate and both are tokenised.
 *
 *  The primary variant carries a same-colour ring so it keeps its silhouette
 *  on white — the one place the design system allows a shadow-bearing shape
 *  and a ring on the same element. */
export type ButtonVariant = 'primary' | 'accent' | 'ghost';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary ring-brand text-brand-on-primary hover:bg-osrs-red-550',
  accent: 'bg-brand-primary-alt text-brand-on-primary hover:bg-osrs-red-550',
  ghost: 'bg-surface-card ring-default text-ink-strong hover:text-ink-secondary',
};

export function Button({
  variant = 'primary',
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex h-control-height-md min-w-touch-target cursor-pointer items-center justify-center rounded-10 border-none px-18 type-ui-bold whitespace-nowrap transition-osrs ${VARIANT[variant]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
