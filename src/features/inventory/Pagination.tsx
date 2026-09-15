import { HeroChevronLeft, HeroChevronRight, Select } from '../../shared/ui';

/** The inventory table's pager — figma 113:27405.
 *
 *  Like `ButtonTemplate` and `ButtonWithIcon`, this control is one the designer
 *  imported from another library, and it brings that library's values with it:
 *  a 4px radius, a 36px height, 14px/20px text, and a near-black text grey and
 *  a pale border grey that the OSRS token set does not carry. Raw hex is a
 *  build failure here and inventing two tokens for an imported control would be
 *  worse, so those two greys are rendered with the nearest OSRS tokens —
 *  `ink-strong` and `line-default`. Recorded in
 *  docs/design-system/additions.md; it is the one place on these screens where
 *  a drawn colour is not reproduced exactly.
 */
export function Pagination({
  rangeLabel,
  pages,
  current,
  onSelectPage,
  perPage,
  onSelectPerPage,
}: {
  rangeLabel: string;
  pages: number[];
  current: number;
  onSelectPage: (page: number) => void;
  perPage: string;
  onSelectPerPage: (value: string) => void;
}) {
  const box = 'h-[36px] rounded-4 border border-line-default bg-surface-card px-12 font-sans text-14 leading-[20px]';

  return (
    <div className="flex flex-wrap items-center justify-between gap-16">
      <p className="font-sans text-14 leading-[20px] text-ink-strong">{rangeLabel}</p>

      <div className="flex flex-wrap items-center gap-[48px]">
        <nav aria-label="Inventory pages" className="flex flex-wrap items-center justify-end gap-6">
          <button
            type="button"
            onClick={() => onSelectPage(Math.max(pages[0], current - 1))}
            disabled={current === pages[0]}
            className={`${box} flex cursor-pointer items-center justify-center gap-4 text-ink-strong transition-osrs hover:text-brand-primary`}
          >
            <HeroChevronLeft />
            Back
          </button>

          {pages.map((page) => {
            const active = page === current;
            return (
              <button
                key={page}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelectPage(page)}
                className={`${
                  active
                    ? 'h-[36px] rounded-4 border-none bg-brand-primary-alt px-12 font-sans text-14 leading-[20px] font-bold text-brand-on-primary'
                    : `${box} text-ink-strong hover:text-brand-primary`
                } cursor-pointer transition-osrs`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onSelectPage(Math.min(pages[pages.length - 1], current + 1))}
            disabled={current === pages[pages.length - 1]}
            className={`${box} flex cursor-pointer items-center justify-center gap-4 text-ink-strong transition-osrs hover:text-brand-primary`}
          >
            Next
            <HeroChevronRight />
          </button>
        </nav>

        <div className="flex items-center gap-8">
          <span className="font-sans text-14 leading-[20px] whitespace-nowrap text-ink-primary">Result per page</span>
          <div className="w-[86px] shrink-0">
            <Select
              size="sm"
              label="Results per page"
              options={['25', '50', '100']}
              value={perPage}
              onChange={onSelectPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
