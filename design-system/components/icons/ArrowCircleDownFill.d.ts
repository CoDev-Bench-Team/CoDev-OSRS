import * as React from 'react';

export interface ArrowCircleDownFillProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Filled down-arrow-in-circle glyph, 30×30 frame. */
export declare function ArrowCircleDownFill(props: ArrowCircleDownFillProps): JSX.Element;
