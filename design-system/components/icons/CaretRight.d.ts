import * as React from 'react';

export interface CaretRightProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Thin right chevron, 30×30 frame — forward navigation and disclosure. */
export declare function CaretRight(props: CaretRightProps): JSX.Element;
