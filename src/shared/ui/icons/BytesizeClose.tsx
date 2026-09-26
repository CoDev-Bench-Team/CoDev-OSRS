import type { SVGProps } from 'react';

/** bytesize `close`, 16x16 — the dismiss glyph the item drawer draws
 *  (figma 113:27537 / 113:28129). Two strokes, round caps, no fill; it paints
 *  with `currentColor` like every other icon in the library.
 *
 *  The vendored export predates these frames and ships no close icon, so this
 *  is a new port rather than one of spec 002's 17 families. Logged in
 *  docs/design-system/additions.md. */
export function BytesizeClose({ size = 16, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d="M1 15L15 1M15 15L1 1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
