import { FilterChip, Search, Select } from '../../shared/ui';
import { CATEGORIES } from '../assets/types';
import { ALL_CATEGORIES, type TableQuery } from '../assets/useTableQuery';
import { UNIT_CHIPS, type UnitChip } from './types';

/** Search beside the category select, then the status chips — the Assets
 *  toolbar's layout with Inventory's copy and chips (spec 015 plan P9). */
export function InventoryToolbar({ query }: { query: TableQuery<UnitChip> }) {
  return (
    <>
      <div className="mt-18 flex flex-wrap items-center gap-16">
        <Search
          placeholder="Search inventory by item name or code"
          aria-label="Search by item name, model, PR or serial number"
          value={query.search}
          onChange={(e) => query.setSearch(e.target.value)}
          className="min-w-[260px] flex-1"
        />
        {/* `Select` fills its parent, so the drawn 210px lives on a wrapper. */}
        <div className="w-[210px] shrink-0">
          <Select
            label="Filter by category"
            options={[ALL_CATEGORIES, ...CATEGORIES]}
            value={query.category}
            onChange={query.setCategory}
          />
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-10" role="group" aria-label="Filter by unit status">
        <FilterChip label="All items" count={query.counts.all} selected={query.status === null} onSelect={() => query.setStatus(null)} />
        {UNIT_CHIPS.map((status) => (
          <FilterChip
            key={status}
            label={status}
            count={query.counts.of(status)}
            selected={query.status === status}
            onSelect={() => query.setStatus(status)}
          />
        ))}
      </div>
    </>
  );
}
