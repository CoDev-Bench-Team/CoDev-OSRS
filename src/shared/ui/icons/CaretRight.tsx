import type { SVGProps } from 'react';

/** CaretRight — ported verbatim from design-system/components/icons/CaretRight.jsx
 *  (figma node 30:3083 caret-right). Paints with `currentColor`, so colour it from the
 *  parent rather than passing a fill (spec 002 FR-014). */
export function CaretRight({ size = 30, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <g transform="translate(10.312 4.687) scale(1.0 1.0)">
        <path d="M 10.976 10.976 L 1.601 20.351 C 1.514 20.438 1.411 20.508 1.297 20.555 C 1.183 20.602 1.061 20.626 0.938 20.626 C 0.815 20.626 0.693 20.602 0.579 20.555 C 0.465 20.508 0.362 20.438 0.275 20.351 C 0.188 20.264 0.119 20.161 0.071 20.047 C 0.024 19.933 0 19.811 0 19.688 C 0 19.565 0.024 19.443 0.071 19.329 C 0.119 19.215 0.188 19.112 0.275 19.025 L 8.988 10.313 L 0.275 1.601 C 0.099 1.425 0 1.187 0 0.938 C 0 0.689 0.099 0.451 0.275 0.275 C 0.451 0.099 0.689 0 0.938 0 C 1.187 0 1.425 0.099 1.601 0.275 L 10.976 9.65 C 11.063 9.737 11.133 9.84 11.18 9.954 C 11.227 10.068 11.251 10.19 11.251 10.313 C 11.251 10.436 11.227 10.558 11.18 10.672 C 11.133 10.786 11.063 10.889 10.976 10.976 Z" fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  );
}
