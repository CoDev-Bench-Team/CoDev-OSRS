import { useMemo, useState } from 'react';
import { STOCK_STATUSES, type StockStatus } from '../../shared/ui';
import type { Category } from './types';

export const ALL_CATEGORIES = 'All categories';
export const PAGE_SIZES = [10, 25, 50] as const;

/** Search, category, stock chip and page over an in-memory list — the Assets
 *  and Inventory toolbars (spec 008 Story 1, Story 4).
 *
 *  Chip counts describe the rows the search and category select leave, before
 *  the chip itself applies, so each chip says how many rows pressing it would
 *  show. Any filter change returns to page 1. */
export function useTableQuery<T>(
  items: readonly T[],
  describe: (item: T) => { text: string; category: Category; status: StockStatus },
) {
  const [search, setSearchState] = useState('');
  const [category, setCategoryState] = useState<string>(ALL_CATEGORIES);
  const [status, setStatusState] = useState<StockStatus | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGE_SIZES[0]);

  const { counts, filtered } = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const scoped = items
      .map((item) => ({ item, ...describe(item) }))
      .filter((r) => (!needle || r.text.toLowerCase().includes(needle)) && (category === ALL_CATEGORIES || r.category === category));
    const byStatus = Object.fromEntries(STOCK_STATUSES.map((s) => [s, 0])) as Record<StockStatus, number>;
    for (const r of scoped) byStatus[r.status] += 1;
    return {
      counts: { all: scoped.length, ...byStatus },
      filtered: scoped.filter((r) => status === null || r.status === status).map((r) => r.item),
    };
    // `describe` is a pure mapping declared inline by each page; the list and
    // the filters are what change the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, category, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const reset = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setPage(1);
  };

  return {
    search,
    setSearch: reset(setSearchState),
    category,
    setCategory: reset(setCategoryState),
    status,
    setStatus: reset(setStatusState),
    counts,
    rows,
    total: filtered.length,
    page: current,
    setPage,
    pageSize,
    setPageSize: reset(setPageSizeState),
  };
}

export type TableQuery = ReturnType<typeof useTableQuery>;
