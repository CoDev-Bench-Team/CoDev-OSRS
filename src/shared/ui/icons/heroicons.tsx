import type { SVGProps } from 'react';

/** The three chevrons the inventory frame's pagination uses — heroicons-mini
 *  at 16x16, ported verbatim from the exported paths (figma I113:27409;1:2294,
 *  I113:27415;1:2304, I113:27418;1:2377).
 *
 *  They arrive with the pagination control, which — like `ButtonTemplate` and
 *  `ButtonWithIcon` — is a component the designer imported from another
 *  library rather than one the OSRS system defines. That is why the glyph set
 *  is heroicons rather than the MDI register `DESIGN.md` §7 establishes: these
 *  are transcribed, not chosen. The source fills them with an untokenised mid
 *  grey; they paint with `currentColor` here so the caller colours them from a
 *  token, as every other icon in the library does.
 */
type ChevronProps = SVGProps<SVGSVGElement> & { size?: number };

function Chevron({ size = 16, className, d, ...rest }: ChevronProps & { d: string }) {
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
      <path fillRule="evenodd" clipRule="evenodd" d={d} fill="currentColor" />
    </svg>
  );
}

export function HeroChevronLeft(props: ChevronProps) {
  return (
    <Chevron
      {...props}
      d="M10.2325 4.18414C10.4622 4.423 10.4547 4.80282 10.2159 5.0325L7.06566 8L10.2159 10.9675C10.4547 11.1972 10.4622 11.577 10.2325 11.8159C10.0028 12.0547 9.623 12.0622 9.38413 11.8325L5.78413 8.4325C5.66649 8.31938 5.6 8.16321 5.6 8C5.6 7.83679 5.66649 7.68062 5.78413 7.5675L9.38413 4.1675C9.623 3.93783 10.0028 3.94527 10.2325 4.18414Z"
    />
  );
}

export function HeroChevronRight(props: ChevronProps) {
  return (
    <Chevron
      {...props}
      d="M5.7675 11.8159C5.53783 11.577 5.54527 11.1972 5.78414 10.9675L8.93434 8L5.78414 5.0325C5.54527 4.80282 5.53782 4.423 5.7675 4.18413C5.99718 3.94527 6.377 3.93782 6.61587 4.1675L10.2159 7.5675C10.3335 7.68062 10.4 7.83679 10.4 8C10.4 8.16321 10.3335 8.31938 10.2159 8.4325L6.61587 11.8325C6.377 12.0622 5.99718 12.0547 5.7675 11.8159Z"
    />
  );
}

export function HeroChevronDown(props: ChevronProps) {
  return (
    <Chevron
      {...props}
      d="M4.18414 5.7675C4.423 5.53783 4.80282 5.54527 5.0325 5.78414L8 8.93434L10.9675 5.78414C11.1972 5.54527 11.577 5.53783 11.8159 5.7675C12.0547 5.99718 12.0622 6.377 11.8325 6.61587L8.4325 10.2159C8.31938 10.3335 8.16321 10.4 8 10.4C7.83679 10.4 7.68062 10.3335 7.5675 10.2159L4.1675 6.61587C3.93783 6.377 3.94527 5.99718 4.18414 5.7675Z"
    />
  );
}
