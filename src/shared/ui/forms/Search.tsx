import type { InputHTMLAttributes } from 'react';

/** The 46px catalog / inventory search field. Ringed rather than shadowed,
 *  following the source's rule that interactive inputs get the ring.
 *
 *  The input is stretched over the whole field, so the global `:focus-visible`
 *  outline wraps the field exactly as it wraps `Select`'s trigger. It used to
 *  carry `outline-none` and rely on the wrapper's ring alone. That failed the
 *  shell's keyboard gate (spec 003 FR-014), which asks the focused element
 *  itself for an indicator, as soon as the Requests Queue put a search on
 *  `/queue`. An absolute input gives the field no intrinsic width, so the
 *  source's 226px default is restated as a minimum. */
export function Search({
  placeholder = 'Search supplies by name or category',
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={`relative flex h-control-height-lg min-w-[226px] items-center gap-10 rounded-10 bg-surface-card px-16 ring-default text-ink-secondary transition-osrs focus-within:ring-brand ${className ?? ''}`}
    >
      {/* The source's exact path, not a redrawn magnifier: a 13.5x13.5 glyph
          inset 2.25px inside an 18x18 box. A hand-drawn circle-and-handle
          looks close at a glance and differs on every pixel.
          The path's ink extends 0.5 past its nominal 13.5 box on every side
          (ring stroke at -0.5, handle cap at 14.05), so the SVG spans the
          full 18x18 box and the viewBox is offset by the inset instead of
          positioning a 13.5x13.5 SVG that would clip the edges. */}
      <span className="relative block h-18 w-18 shrink-0" aria-hidden="true">
        <svg
          viewBox="-2.25 -2.25 18 18"
          fill="none"
          className="absolute inset-0 h-full w-full"
        >
          <path d="M 13.147 13.854 C 13.342 14.049 13.658 14.049 13.854 13.854 C 14.049 13.658 14.049 13.342 13.854 13.147 L 13.5 13.5 L 13.147 13.854 Z M 10.599 9.892 C 10.403 9.696 10.087 9.696 9.892 9.892 C 9.696 10.087 9.696 10.403 9.892 10.599 L 10.245 10.245 L 10.599 9.892 Z M 13.5 13.5 L 13.854 13.147 L 10.599 9.892 L 10.245 10.245 L 9.892 10.599 L 13.147 13.854 L 13.5 13.5 Z M 12 6 L 11.5 6 C 11.5 9.038 9.038 11.5 6 11.5 L 6 12 L 6 12.5 C 9.59 12.5 12.5 9.59 12.5 6 L 12 6 Z M 6 12 L 6 11.5 C 2.962 11.5 0.5 9.038 0.5 6 L 0 6 L -0.5 6 C -0.5 9.59 2.41 12.5 6 12.5 L 6 12 Z M 0 6 L 0.5 6 C 0.5 2.962 2.962 0.5 6 0.5 L 6 0 L 6 -0.5 C 2.41 -0.5 -0.5 2.41 -0.5 6 L 0 6 Z M 6 0 L 6 0.5 C 9.038 0.5 11.5 2.962 11.5 6 L 12 6 L 12.5 6 C 12.5 2.41 9.59 -0.5 6 -0.5 L 6 0 Z" fill="currentColor" fillRule="nonzero" />
        </svg>
      </span>
      <input
        type="search"
        placeholder={placeholder}
        className="absolute inset-0 min-w-0 appearance-none rounded-10 border-none bg-transparent pr-16 pl-[44px] font-sans text-14 leading-tight text-ink-primary placeholder:text-ink-secondary [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        {...rest}
      />
    </div>
  );
}
