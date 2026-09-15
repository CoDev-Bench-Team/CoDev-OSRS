import * as React from 'react';

export interface GoogleIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Figma size variant. */
  size?: '32x32' | '40x40' | '48x48';
}

/** The Google "G" mark at the three sizes the source defines. Third-party asset — do not restyle. */
export declare function GoogleIcon(props: GoogleIconProps): JSX.Element;
