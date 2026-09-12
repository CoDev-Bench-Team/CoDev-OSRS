import * as React from 'react';

export interface MdiClipboardTextOutlineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Outline clipboard-with-text glyph, 24×24 — heavier alternate of the request-list mark. */
export declare function MdiClipboardTextOutline(props: MdiClipboardTextOutlineProps): JSX.Element;
