import { useId } from 'react';

/** The table footer from `02 - Requests Queue`: a `first-last of total` range
 *  label on the left; Back, numbered pages, Next and `Result per page` on the
 *  right. Built to the file's `pagination control` / `pagination page` /
 *  `pagination result per page` components at `size=md` (drift-2026-09-24 §7):
 *  36px high, r4, a 1px neutral-200 ring, neutral-100 on hover, neutral-800
 *  ink, and the current page in Codev Red with bold white numerals
 *  (token-map.md). The component's cached fill for the active page is black;
 *  the queue's instance binds it to the `Codev Red` style, and the style is the
 *  authority (drift-2026-09-22 §9).
 *
 *  Shared rather than feature-local: Assets, Inventory and History draw the
 *  same footer (spec 001 FR-018). */

/** Geometry only. Fill, ink and ring differ between the resting controls and
 *  the current page, so each supplies its own: two background utilities on one
 *  element resolve by stylesheet order, not by class order. */
const BOX = 'inline-flex h-[36px] items-center justify-center rounded-4 border-none font-sans text-14 leading-none transition-osrs';
const RESTING = `${BOX} bg-surface-card shadow-[inset_0_0_0_1px_var(--color-osrs-neutral-200)]`;
const CONTROL = `${RESTING} text-osrs-neutral-800`;
const ENABLED = `${CONTROL} cursor-pointer hover:bg-osrs-neutral-100`;
const DISABLED = `${RESTING} cursor-default text-ink-muted`;

/** Heroicons mini, the set the file's `Icon (heroicons-mini)` instances use. */
function Chevron({ direction }: { direction: 'left' | 'right' | 'down' }) {
  const d = {
    left: 'M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z',
    right: 'M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z',
    down: 'M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z',
  }[direction];
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-16 w-16 shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  );
}

/** Which page numbers to draw. Every page when there are seven or fewer;
 *  otherwise the first, the last, and the current page with one neighbour
 *  each side, with a gap marker wherever pages are skipped. That keeps the
 *  control's width bounded however many pages there are. */
function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const shown = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...shown].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const count = (n: number) => n.toLocaleString('en-US');

export function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  label = 'Pagination',
}: {
  /** 1-based, and already clamped to the available pages by the caller. */
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Names the landmark; pass one when a screen has more than one table. */
  label?: string;
}) {
  const sizeId = useId();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-16">
      {/* Not a live region: the screen owning the table already announces its
          result count, and a second region here would speak over it on every
          keystroke of a search. */}
      <p className="font-sans text-14 leading-tight text-osrs-neutral-800">
        {count(first)}-{count(last)} of {count(total)}
      </p>

      <div className="flex flex-wrap items-center gap-x-[48px] gap-y-12">
        <div className="flex flex-wrap items-center gap-6">
          {/* `aria-disabled`, not `disabled`, on Back and Next: reaching the
              last page disables the very button that was pressed, and a
              `disabled` element drops keyboard focus to <body>. The global
              `[aria-disabled='true']` rule dims it and blocks the pointer; the
              guard blocks Enter and Space. */}
          <button
            type="button"
            aria-disabled={atStart}
            onClick={() => {
              if (!atStart) onPageChange(page - 1);
            }}
            className={`${atStart ? DISABLED : ENABLED} gap-4 px-12`}
          >
            <Chevron direction="left" />
            Back
          </button>

          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden="true" className={`${CONTROL} px-12`}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                /* The current page is not a navigation: calling back with the
                   page already shown would make a caller that fetches on page
                   change fetch again for nothing. */
                onClick={() => {
                  if (p !== page) onPageChange(p);
                }}
                className={
                  p === page
                    ? `${BOX} cursor-default bg-brand-primary-alt px-12 font-bold text-brand-on-primary`
                    : `${ENABLED} px-12`
                }
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            aria-disabled={atEnd}
            onClick={() => {
              if (!atEnd) onPageChange(page + 1);
            }}
            className={`${atEnd ? DISABLED : ENABLED} gap-4 px-12`}
          >
            Next
            <Chevron direction="right" />
          </button>
        </div>

        <div className="flex items-center gap-8">
          <label htmlFor={sizeId} className="font-sans text-14 leading-tight text-black">
            Result per page
          </label>
          {/* Native, not the shared `Select`: that trigger is the 46px, r10
              form control, and the file draws this one at 36px, r4. The
              platform's own listbox also keeps keyboard and screen-reader
              behaviour for free. */}
          <span className="relative inline-flex text-osrs-neutral-800">
            <select
              id={sizeId}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={`${ENABLED} appearance-none pr-[36px] pl-12 focus-visible:shadow-[inset_0_0_0_1px_var(--color-osrs-neutral-400)]`}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2">
              <Chevron direction="down" />
            </span>
          </span>
        </div>
      </div>
    </nav>
  );
}
