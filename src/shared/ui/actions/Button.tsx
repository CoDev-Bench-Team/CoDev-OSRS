import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { BUTTON_SHAPE, BUTTON_VARIANT, type ButtonVariant } from './button-styles';

/** Promoted from the UI kit's local helper (spec 002 FR-006). The class
 *  strings live in `button-styles.ts` so a link that must look like a button
 *  can share them; see that file for why the two reds and the ring exist. */
export function Button({
  variant = 'primary',
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <button type="button" className={`${BUTTON_SHAPE} ${BUTTON_VARIANT[variant]} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}
