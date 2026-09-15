import * as React from 'react';

export interface SignInButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Figma variant axis `Darkmode`. `true` = blue shell + white label. */
  darkmode?: boolean;
  /** Figma variant axis `Mobile`. `true` drops the 32px trailing pad. */
  mobile?: boolean;
  /** Label copy (Figma prop `CTA`). */
  cta?: string;
  /** Padding on the white icon block. The login instance overrides this to fit the 242×64 pill. */
  iconPadding?: string | number;
  /** Padding on the label block. */
  labelPadding?: string | number;
  style?: React.CSSProperties;
}

/** Google's standard sign-in button, all four Darkmode × Mobile variants. The only auth entry point in OSRS. */
export declare function SignInButton(props: SignInButtonProps): JSX.Element;
