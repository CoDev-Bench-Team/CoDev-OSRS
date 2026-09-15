import * as React from 'react';

export interface CoDevWhiteMasterLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Rendered height in px. Native artwork is 142×39. */
  height?: number;
  /** Override the bitmap URL when the bundle-relative default cannot resolve. */
  src?: string;
}

/** The codev wordmark knocked out in white, for dark and photographic grounds. */
export declare function CoDevWhiteMasterLogo(props: CoDevWhiteMasterLogoProps): JSX.Element;
