import * as React from 'react';

export interface CheckCircleFillProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Filled check-in-circle glyph, 30×30 frame — confirmation and saved states. */
export declare function CheckCircleFill(props: CheckCircleFillProps): JSX.Element;
