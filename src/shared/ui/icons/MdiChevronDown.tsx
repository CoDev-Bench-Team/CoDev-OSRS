import type { SVGProps } from 'react';

/** Material Design Icons `chevron-down`, 24x24.
 *
 *  The source draws this affordance as the text character "⌄", whose ink
 *  (15px) overflows its own line box (12px). That makes its size and vertical
 *  position depend on line-box rounding rather than on anything intentional,
 *  which is why it read as misaligned and undersized.
 *
 *  The design system's readme says that when an icon is needed which the file
 *  does not define, reach for MDI at 24x24 rather than hand-drawing one. That
 *  is what this is. Recorded in docs/design-system/additions.md. */
export function MdiChevronDown({ size = 20, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d="M7.41 8.58 12 13.17l4.59-4.59L18 10l-6 6-6-6 1.41-1.42Z" fill="currentColor" />
    </svg>
  );
}
