import * as React from 'react';

export interface CoDevRedMasterLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Rendered height in px. Native artwork is 142×39. */
  height?: number;
  /** Override the bitmap URL when the bundle-relative default cannot resolve. */
  src?: string;
}

/**
 * The codev wordmark in brand red — the primary master logo.
 * @startingPoint section="Brand" subtitle="codev master logo, red and white" viewport="700x150"
 */
export declare function CoDevRedMasterLogo(props: CoDevRedMasterLogoProps): JSX.Element;
