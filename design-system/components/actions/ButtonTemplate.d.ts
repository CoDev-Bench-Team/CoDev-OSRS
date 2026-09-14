import * as React from 'react';

export interface ButtonTemplateProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Figma variant axis `state`. `saved` dims to 40% and swaps the glyph. */
  state?: 'default' | 'saved';
  /** Button copy. Rendered uppercase. */
  label?: string;
  /** Replace the leading glyph. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Outlined 46px purple-stroke action button with a leading glyph and a saved state.
 * @startingPoint section="Actions" subtitle="Template + icon buttons, Google sign-in" viewport="700x220"
 */
export declare function ButtonTemplate(props: ButtonTemplateProps): JSX.Element;
