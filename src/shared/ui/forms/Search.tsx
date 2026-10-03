import { useRef, type InputHTMLAttributes } from 'react';

/** The 46px catalog / inventory search field. Ringed rather than shadowed,
 *  following the source's rule that interactive inputs get the ring.
 *
 *  The input is stretched over the whole field, so the global `:focus-visible`
 *  outline wraps the field exactly as it wraps `Select`'s trigger. It used to
 *  carry `outline-none` and rely on the wrapper's ring alone. That failed the
 *  shell's keyboard gate (spec 003 FR-014), which asks the focused element
 *  itself for an indicator, as soon as the Requests Queue put a search on
 *  `/queue`. The wrapper's old `focus-within:ring-brand` went with it: the
 *  outline is the one indicator, not a second red ring inside it.
 *
 *  The input's left padding is the wrapper's `px-16`, the icon's `w-18` and the
 *  wrapper's `gap-10`, written as the sum of those same tokens so the text
 *  cannot sit on the glyph; change one of the three and change the sum. An
 *  absolute input gives the field no intrinsic width, so the source's 226px
 *  default is restated as a minimum.
 *
 *  With `onClear`, a field holding text shows a clear button (×) at its far
 *  right. Pressing it calls `onClear`, which empties the caller's value, and
 *  puts focus back in the field. The browser's own cancel button stays
 *  hidden, so there is only ever one. Not drawn in the design file; recorded in
 *  docs/design-system/additions.md. */
export function Search({
  placeholder = 'Search supplies by name or category',
  className,
  onClear,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  /** Empties the field. The clear button shows only when this is given and
   *  the field has text. */
  onClear?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const clearable = Boolean(onClear) && !rest.disabled && typeof rest.value === 'string' && rest.value !== '';
  return (
    <div
      className={`relative flex h-control-height-lg min-w-[226px] items-center gap-10 rounded-10 bg-surface-card px-16 ring-default text-ink-secondary transition-osrs ${className ?? ''}`}
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
        ref={input}
        className={`absolute inset-0 min-w-0 appearance-none rounded-10 border-none bg-transparent ${clearable ? 'pr-[48px]' : 'pr-16'} pl-[calc(var(--spacing-16)+var(--spacing-18)+var(--spacing-10))] font-sans text-14 leading-tight text-ink-primary placeholder:text-ink-secondary [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none`}
        {...rest}
      />
      {clearable ? (
        // 32px square inside the 46px field, 8px from its right edge; the
        // glyph is 16px. Positioned above the stretched input so it is the
        // click target, not the field.
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onClear?.();
            input.current?.focus();
          }}
          className="absolute top-1/2 right-8 flex size-32 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill border-none bg-transparent p-0 text-ink-secondary transition-osrs hover:bg-osrs-neutral-100 hover:text-ink-primary"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" className="size-16">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
