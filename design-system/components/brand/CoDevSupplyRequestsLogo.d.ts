import * as React from 'react';

export interface CoDevSupplyRequestsLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Product line set under the mark. Defaults to the Figma value. */
  productName?: string;
  /** Height of the codev mark above the product line. */
  markHeight?: number;
}

/** Product lockup: the codev mark stacked over a 14px semibold product line. */
export declare function CoDevSupplyRequestsLogo(props: CoDevSupplyRequestsLogoProps): JSX.Element;
