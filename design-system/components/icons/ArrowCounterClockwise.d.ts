import * as React from 'react';

export interface ArrowCounterClockwiseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Counter-clockwise refresh arrow, 30×30 frame — the regenerate affordance. */
export declare function ArrowCounterClockwise(props: ArrowCounterClockwiseProps): JSX.Element;
