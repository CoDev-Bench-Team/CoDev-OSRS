import type { ReactNode } from 'react';
import { FilterChip, LoadingState, Notice, Pagination, Search, Select, type StockStatus } from '../../shared/ui';
import type { AssetsState } from './asset-store';
import { CATEGORIES } from './types';
import { ALL_CATEGORIES, PAGE_SIZES, type TableQuery } from './useTableQuery';

/** The toolbar both admin tables share: search beside the category select,
 *  then the four stock chips. Only the first chip's noun differs —
 *  `All assets` on Assets, `All items` on Inventory. */
const CHIPS: [label: string, status: StockStatus][] = [
  ['In stock', 'In Stock'],
  ['Low stock', 'Low Stock'],
  ['Out of stock', 'Out of Stock'],
];

export function TableToolbar({ query, allLabel }: { query: TableQuery; allLabel: string }) {
  return (
    <>
      <div className="mt-18 flex flex-wrap items-center gap-16">
        <Search
          placeholder="Search inventory by item name or code"
          aria-label="Search by item name or code"
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

      <div className="mt-16 flex flex-wrap items-center gap-10" role="group" aria-label="Filter by stock status">
        <FilterChip
          label={allLabel}
          count={query.counts.all}
          selected={query.status === null}
          onSelect={() => query.setStatus(null)}
        />
        {CHIPS.map(([label, status]) => (
          <FilterChip
            key={label}
            label={label}
            count={query.counts[status]}
            selected={query.status === status}
            onSelect={() => query.setStatus(status)}
          />
        ))}
      </div>
    </>
  );
}

/** The table card's body for the three states that are not rows: loading, a
 *  failed load, and nothing matching. Returns `null` when there are rows. */
export function TableState({
  state,
  empty,
  rowCount,
  onRetry,
}: {
  state: AssetsState;
  empty: string;
  rowCount: number;
  onRetry: () => void;
}): ReactNode {
  if (state.kind === 'loading') {
    // The shell's LoadingState fills the screen; inside a table it gets the
    // height of a few rows instead.
    return (
      <div className="[&>div]:min-h-[204px]">
        <LoadingState label="Loading stock" />
      </div>
    );
  }
  if (state.kind === 'failed') {
    return (
      <Notice
        eyebrow="Could not load"
        tone="stopped"
        title="Stock could not be loaded"
        body="Nothing was changed. Try again in a moment"
        actions={
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer border-none bg-transparent p-0 type-ui-bold text-ink-link"
          >
            Try again
          </button>
        }
      />
    );
  }
  if (rowCount === 0) {
    return <p className="flex h-row-height-inventory items-center px-20 type-body text-ink-secondary">{empty}</p>;
  }
  return null;
}

export function TablePager({ query }: { query: TableQuery }) {
  return (
    <div className="mt-auto pt-32">
      <Pagination
        page={query.page}
        pageSize={query.pageSize}
        total={query.total}
        pageSizeOptions={PAGE_SIZES}
        onPageChange={query.setPage}
        onPageSizeChange={query.setPageSize}
      />
    </div>
  );
}
