import * as React from 'react';

export interface ButtonWithIconProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Figma variant axis `Property 1`. `hover` lightens the ink. */
  property1?: 'default' | 'hover';
  /** Button copy. */
  label?: string;
  /** Replace the leading glyph. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Chromeless text-plus-glyph button with an explicit hover variant. */
export declare function ButtonWithIcon(props: ButtonWithIconProps): JSX.Element;
