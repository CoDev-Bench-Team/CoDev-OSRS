import type { ReactNode } from 'react';
import { EmptyState, FilterChip, Notice, Pagination, Search, Select, type StockStatus } from '../../shared/ui';
import { CATEGORIES } from './types';
import { ALL_CATEGORIES, type TableQuery } from './table-query';

/** The Assets toolbar: search beside the category select, then the four stock
 *  chips. Inventory's unit table filters by unit status instead (BEN-107), so
 *  it does not share these chips. */
const CHIPS: [label: string, status: StockStatus][] = [
  ['In stock', 'In Stock'],
  ['Low stock', 'Low Stock'],
  ['Out of stock', 'Out of Stock'],
];

export function TableToolbar({ query, allLabel }: { query: TableQuery<StockStatus>; allLabel: string }) {
  return (
    <>
      <div className="mt-18 flex flex-wrap items-center gap-16">
        <Search
          placeholder="Search asset by item name or model"
          aria-label="Search by item name or model"
          value={query.search}
          onChange={(e) => query.setSearch(e.target.value)}
          onClear={() => query.setSearch('')}
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
          loading={query.countsLoading}
          selected={query.status === null}
          onSelect={() => query.setStatus(null)}
        />
        {CHIPS.map(([label, status]) => (
          <FilterChip
            key={label}
            label={label}
            count={query.counts.of(status)}
            loading={query.countsLoading}
            selected={query.status === status}
            onSelect={() => query.setStatus(status)}
          />
        ))}
      </div>
    </>
  );
}

/** A list's load state as `TableState` reads it. `stale`: a save went through
 *  but the reload after it failed. */
export type TableLoadState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; stale?: boolean };

/** The table card's body for the states that are not rows: loading, a failed
 *  load, a list left stale by a failed refresh after a save, and nothing
 *  matching. The last two can show together, above any rows. */
export function TableState({
  state,
  empty,
  rowCount,
  onRetry,
  loading,
  fetching = false,
  failedTitle,
}: {
  state: TableLoadState;
  empty: string;
  rowCount: number;
  onRetry: () => void;
  /** The table's skeleton rows, shown until the first page arrives. */
  loading: ReactNode;
  /** The next page is in flight. If the page on screen is empty it answers
   *  the previous query, so its empty message would describe the wrong
   *  filter: the skeleton stands there instead until the answer arrives. */
  fetching?: boolean;
  failedTitle: string;
}): ReactNode {
  if (state.kind === 'loading' || (fetching && rowCount === 0)) return loading;
  if (state.kind === 'failed') {
    return (
      <Notice
        eyebrow="Could not load"
        tone="stopped"
        title={failedTitle}
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
  const stale = state.stale ? (
    <Notice
      eyebrow="Not refreshed"
      tone="info"
      title="Saved, but the list could not be refreshed"
      body="Your change is shown. Other changes since may be missing"
      actions={
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer border-none bg-transparent p-0 type-ui-bold text-ink-link"
        >
          Refresh
        </button>
      }
    />
  ) : null;
  // Five of these tables' 68px rows: the skeleton's height.
  const nothing = rowCount === 0 ? <EmptyState label={empty} className="min-h-[340px]" /> : null;
  return (
    <>
      {stale}
      {nothing}
    </>
  );
}

export function TablePager({
  query,
  hidden = false,
}: {
  query: Pick<TableQuery, 'page' | 'pageSize' | 'pageSizes' | 'total' | 'setPage' | 'setPageSize'>;
  /** The first page has not arrived, or the next one is in flight. */
  hidden?: boolean;
}) {
  // Directly under the table, 34px below it as the design draws it, not
  // pinned to the page foot.
  return (
    <div className="mt-[34px]">
      <Pagination
        hidden={hidden}
        page={query.page}
        pageSize={query.pageSize}
        total={query.total}
        pageSizeOptions={query.pageSizes}
        onPageChange={query.setPage}
        onPageSizeChange={query.setPageSize}
      />
    </div>
  );
}
