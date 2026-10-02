import type { ReactNode } from 'react';
import { FilterChip, LoadingState, Notice, Pagination, Search, Select, type StockStatus } from '../../shared/ui';
import { CATEGORIES } from './types';
import { ALL_CATEGORIES, type TableQuery } from './useTableQuery';

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
            count={query.counts.of(status)}
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
  loadingLabel,
  failedTitle,
}: {
  state: TableLoadState;
  empty: string;
  rowCount: number;
  onRetry: () => void;
  loadingLabel: string;
  failedTitle: string;
}): ReactNode {
  if (state.kind === 'loading') {
    // The shell's LoadingState fills the screen; inside a table it gets the
    // height of a few rows instead.
    return (
      <div className="[&>div]:min-h-[204px]">
        <LoadingState label={loadingLabel} />
      </div>
    );
  }
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
  const nothing =
    rowCount === 0 ? (
      <p className="flex h-row-height-inventory items-center px-20 type-body text-ink-secondary">{empty}</p>
    ) : null;
  return (
    <>
      {stale}
      {nothing}
    </>
  );
}

export function TablePager({
  query,
}: {
  query: Pick<TableQuery, 'page' | 'pageSize' | 'pageSizes' | 'total' | 'setPage' | 'setPageSize'>;
}) {
  return (
    <div className="mt-auto pt-32">
      <Pagination
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
