import { useMemo, useState } from 'react';
import type { Category } from './types';

export const ALL_CATEGORIES = 'All categories';

/** Search, category, status chip and page over an in-memory list — the Assets
 *  toolbar (spec 014 Story 1) and Inventory's (spec 015 Story 1).
 *
 *  Chip counts describe the rows the search and category select leave, before
 *  the chip itself applies, so each chip says how many rows pressing it would
 *  show. A row whose status has no chip counts under All only. Any filter
 *  change returns to page 1. */
export function useTableQuery<T, S extends string>(
  items: readonly T[],
  describe: (item: T) => { text: string; category: Category; status: S },
  { statuses, pageSizes, pageSize: initialPageSize }: { statuses: readonly S[]; pageSizes: readonly number[]; pageSize: number },
) {
  const [search, setSearchState] = useState('');
  const [category, setCategoryState] = useState<string>(ALL_CATEGORIES);
  const [status, setStatusState] = useState<S | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const { counts, filtered } = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const scoped = items
      .map((item) => ({ item, ...describe(item) }))
      .filter((r) => (!needle || r.text.toLowerCase().includes(needle)) && (category === ALL_CATEGORIES || r.category === category));
    const byStatus = new Map<S, number>(statuses.map((s) => [s, 0]));
    for (const r of scoped) {
      const n = byStatus.get(r.status);
      if (n !== undefined) byStatus.set(r.status, n + 1);
    }
    return {
      counts: { all: scoped.length, of: (s: S) => byStatus.get(s) ?? 0 },
      filtered: scoped.filter((r) => status === null || r.status === status).map((r) => r.item),
    };
    // `describe` is a pure mapping declared inline by each page, and
    // `statuses` a module constant; the list and the filters are what change
    // the result.
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
    pageSizes,
    setPageSize: reset(setPageSizeState),
  };
}

export type TableQuery<S extends string = string> = ReturnType<typeof useTableQuery<unknown, S>>;
