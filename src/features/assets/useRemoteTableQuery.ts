import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ALL_CATEGORIES } from './table-query';
import { readPageSize, savePageSize, type PagedTable } from '../../shared/page-size-preference';
import { fieldsFrom, useAddressFields } from '../../shared/address-fields';

/** The field these tables keep in their address. They draw no sort. */
const SEARCH_FIELD = ['search'] as const;

/** What a paged source is asked for one page of a table (spec 017 plan D1). */
export type RemoteTableQuery<S extends string> = {
  search: string;
  /** `ALL_CATEGORIES` or one category. */
  category: string;
  status: S | null;
  /** 1-based. */
  page: number;
  pageSize: number;
};

/** The chip counts for a search and category, before the chip applies, so
 *  each chip says how many rows pressing it would show. */
export type RemoteTableCounts<S extends string> = { all: number; of: Partial<Record<S, number>> };

/** One page and its total across pages, with the chip counts when the
 *  response carries them. */
export type RemoteTablePage<T, S extends string> = {
  rows: T[];
  total: number;
  counts?: RemoteTableCounts<S>;
};

/** A paged source. Each page's response carries the chip counts with it. */
export type FetchRemotePage<T, S extends string> = (query: RemoteTableQuery<S>) => Promise<RemoteTablePage<T, S>>;

export type RemoteTableState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; stale?: boolean };

const SEARCH_DEBOUNCE_MS = 300;

/** A table over a source that pages itself: every change
 *  asks the source again, search after typing settles, and the page on
 *  screen stays until the next one arrives. A failed reload keeps it and
 *  marks it stale, as the seeded tables do. The chip counts come with every
 *  page; a page without them leaves the chips without counts. */
export function useRemoteTableQuery<T, S extends string>(
  fetchPage: FetchRemotePage<T, S>,
  {
    pageSizes,
    table,
    enabled = true,
  }: {
    pageSizes: readonly number[];
    table: PagedTable;
    /** False holds every read, the table staying in `loading`, until it is
     *  true (the session is still resolving). */
    enabled?: boolean;
  },
) {
  // The search opens on the address's `?search=` and is kept there (FR-056).
  const { search: address } = useLocation();
  const [opening] = useState(() => fieldsFrom(address, SEARCH_FIELD).search);
  const [search, setSearchState] = useState(opening);
  const [settledSearch, setSettledSearch] = useState(opening);
  useAddressFields(SEARCH_FIELD, { search }, (fields) => setSearchState(fields.search));
  const [category, setCategoryState] = useState<string>(ALL_CATEGORIES);
  const [status, setStatusState] = useState<S | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => readPageSize(table, pageSizes));
  const [state, setState] = useState<RemoteTableState>({ kind: 'loading' });
  const [data, setData] = useState<RemoteTablePage<T, S> & { counts: RemoteTableCounts<S> }>({
    rows: [],
    total: 0,
    counts: { all: 0, of: {} },
  });
  /** The key whose counts were last settled, read or failed. While it is not
   *  the current one, the chips show that their counts are loading. */
  const [settled, setSettled] = useState<string | null>(null);
  /** The key whose page answered without counts: its chips show none. */
  const [uncounted, setUncounted] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (search === settledSearch) return;
    const timer = setTimeout(() => {
      setSettledSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, settledSearch]);

  const ask = useCallback(
    () => fetchPage({ search: settledSearch, category, status, page, pageSize }),
    [fetchPage, settledSearch, category, status, page, pageSize],
  );

  /** The query and attempt the data on screen answers. While it differs from
   *  the one being asked, the next page is in flight. */
  const [answered, setAnswered] = useState<{ ask: typeof ask; attempt: number } | null>(null);

  const countsKey = JSON.stringify([settledSearch, category, attempt]);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    ask().then(
      (next) => {
        if (!current) return;
        // A page without counts leaves the chips without them, rather than a
        // stale or empty count shown as if it were real.
        setSettled(countsKey);
        setUncounted(next.counts ? null : countsKey);
        setData((was) => ({ rows: next.rows, total: next.total, counts: next.counts ?? was.counts }));
        setState({ kind: 'loaded' });
        setAnswered({ ask, attempt });
        // The page asked for no longer exists (its last rows were removed):
        // go to the last one that does, which asks for its rows.
        const last = Math.max(1, Math.ceil(next.total / pageSize));
        if (page > last) setPage(last);
      },
      () => {
        if (!current) return;
        setSettled(countsKey);
        setState((s) => (s.kind === 'loaded' ? { kind: 'loaded', stale: true } : { kind: 'failed' }));
        setAnswered({ ask, attempt });
      },
    );
    return () => {
      current = false;
    };
  }, [ask, attempt, countsKey, enabled, page, pageSize]);

  const reset = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize));
  return {
    state,
    /** A page is loaded and the next one is being fetched: the table keeps
     *  its rows and shows that it is updating. */
    fetching: state.kind === 'loaded' && (answered?.ask !== ask || answered.attempt !== attempt),
    /** Ask again with the current query. */
    reload: useCallback(() => setAttempt((n) => n + 1), []),
    query: {
      search,
      setSearch: setSearchState,
      category,
      setCategory: reset(setCategoryState),
      status,
      setStatus: reset(setStatusState),
      counts: { all: data.counts.all, of: (s: S) => data.counts.of[s] ?? 0 },
      /** The chips show no counts: they are being read and the ones on
       *  screen may be wrong, or the page answered without them. */
      countsLoading: settled !== countsKey || uncounted === countsKey,
      /** The current search and category answered without counts. */
      uncounted: settled === countsKey && uncounted === countsKey,
      rows: data.rows,
      total: data.total,
      page: Math.min(page, pageCount),
      setPage,
      pageSize,
      pageSizes,
      setPageSize: reset((size: number) => {
        setPageSizeState(size);
        savePageSize(table, size);
      }),
    },
  };
}
