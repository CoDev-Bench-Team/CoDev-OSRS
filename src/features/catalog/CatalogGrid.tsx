import { Notice } from '../../shared/ui';
import { CatalogItemCard } from './CatalogItemCard';
import type { CatalogItem, CatalogOffice } from './types';

/** The grid, and the one empty state that belongs to it: filters that match
 *  nothing. An empty *catalog* is a different state and is handled a level up
 *  in `CatalogPage` — "no supplies encoded yet" and "nothing matches your
 *  search" are not the same message (FR-011).
 *
 *  Three columns of 436px with a 27px gutter both ways, as `02 - Catalog`
 *  lays them out; fewer columns below the design width. */
export function CatalogGrid({
  items,
  office,
  homeOffice,
  filtered,
  onClearFilters,
}: {
  items: CatalogItem[];
  office: CatalogOffice;
  homeOffice: CatalogOffice | undefined;
  filtered: boolean;
  onClearFilters: () => void;
}) {
  if (items.length === 0 && filtered) {
    return (
      <Notice
        eyebrow="No matches"
        title="No supplies match these filters"
        body="Try a different search term, or clear the filters to see the whole catalog."
        actions={
          <button
            type="button"
            onClick={onClearFilters}
            className="hit-area inline-flex h-control-height-md cursor-pointer items-center rounded-10 border-none bg-brand-primary px-18 type-ui-bold text-brand-on-primary ring-brand transition-osrs hover:bg-osrs-red-550"
          >
            Clear filters
          </button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[27px] md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        /* Keyed by office as well as item, so a quantity chosen against one
           office's stock never carries over to another's. */
        <CatalogItemCard key={`${office}:${item.id}`} item={item} office={office} homeOffice={homeOffice} />
      ))}
    </div>
  );
}
