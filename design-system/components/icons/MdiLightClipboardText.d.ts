import * as React from 'react';

export interface MdiLightClipboardTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered square size in px. Defaults to the Figma frame size. */
  size?: number;
  /** Glyph colour. The path paints with currentColor. */
  color?: string;
}

/** Light-weight clipboard-with-text glyph, 24×24 — the Request List marker in the top bar. */
export declare function MdiLightClipboardText(props: MdiLightClipboardTextProps): JSX.Element;
