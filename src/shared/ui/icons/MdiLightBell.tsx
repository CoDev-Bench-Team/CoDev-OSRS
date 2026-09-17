import type { SVGProps } from 'react';

/** MdiLightBell — `mdi-light:bell`, the notification marker the 2026-09-15
 *  design export added to both top-bar variants.
 *
 *  The design system ships no bell, so the path is taken from the `.fig`
 *  itself: the glyph's own 17x19 outline, drawn at (3, 3) in a 24x24 frame,
 *  exactly as the file positions it. It is MDI at 24x24 in the light weight,
 *  which is the register the design system's readme prescribes for an icon the
 *  file does not otherwise define. Paints with `currentColor` (spec 002
 *  FR-014). */
export function MdiLightBell({ size = 24, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
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
      <g transform="translate(3.0 3.0) scale(1.0 1.0)">
        <path
          d="M 9 1.5 C 9 1.367 8.947 1.24 8.854 1.146 C 8.76 1.053 8.633 1 8.5 1 C 8.367 1 8.24 1.053 8.146 1.146 C 8.053 1.24 8 1.367 8 1.5 L 8 3.03 C 5.75 3.28 4 5.18 4 7.5 L 4 13.41 L 2.41 15 L 14.59 15 L 13 13.41 L 13 7.5 C 13 5.18 11.25 3.28 9 3.03 L 9 1.5 Z M 8.5 0 C 8.898 0 9.279 0.158 9.561 0.439 C 9.842 0.721 10 1.102 10 1.5 L 10 2.21 C 12.31 2.86 14 5 14 7.5 L 14 13 L 17 16 L 0 16 L 3 13 L 3 7.5 C 3 5 4.69 2.86 7 2.21 L 7 1.5 C 7 1.102 7.158 0.721 7.439 0.439 C 7.721 0.158 8.102 0 8.5 0 Z M 8.5 19 C 7.924 19 7.365 18.801 6.919 18.437 C 6.472 18.072 6.165 17.565 6.05 17 L 7.09 17 C 7.193 17.292 7.384 17.545 7.636 17.723 C 7.889 17.902 8.191 17.998 8.5 17.998 C 8.809 17.998 9.111 17.902 9.364 17.723 C 9.616 17.545 9.807 17.292 9.91 17 L 10.95 17 C 10.835 17.565 10.528 18.072 10.081 18.437 C 9.635 18.801 9.076 19 8.5 19 Z"
          fill="currentColor"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}
