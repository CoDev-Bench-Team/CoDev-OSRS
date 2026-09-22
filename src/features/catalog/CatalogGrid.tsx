import { Notice } from '../../shared/ui';
import { CatalogItemCard } from './CatalogItemCard';
import type { CatalogItem } from './types';

/** The grid, and the one empty state that belongs to it: filters that match
 *  nothing. An empty *catalog* is a different state and is handled a level up
 *  in `CatalogPage` — "no supplies encoded yet" and "nothing matches your
 *  search" are not the same message (FR-011). */
export function CatalogGrid({
  items,
  filtered,
  onClearFilters,
}: {
  items: CatalogItem[];
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
    <div className="flex flex-wrap gap-18">
      {items.map((item) => (
        <CatalogItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
