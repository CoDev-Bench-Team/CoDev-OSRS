import { useEffect, useState } from 'react';

/** One counts read in flight, and the search it was asked for. */
export interface CountsRead<C> {
  counts: Promise<C>;
  search: string;
}

/** Starts a counts read. A read superseded before it settles is dropped, so
 *  its failure is swallowed here rather than reported as unhandled. */
export function startCounts<C>(read: () => Promise<C>, search: string): CountsRead<C> {
  const counts = read();
  counts.catch(() => {});
  return { counts, search };
}

/** The counts a table's chips and summary draw. Each load starts its counts
 *  read beside its rows read, and the page hands it here at once, so neither
 *  waits on the other: the rows are drawn when they arrive, and the counts
 *  when theirs do, whichever is first.
 *
 *  Every load (a page load, a refresh, an action's reload) brings its own
 *  counts read. Until it arrives the last counts stay. They still describe
 *  the same requests when only the chip, sort or page moved. `search` is the
 *  search the counts on screen were read for: the chip counts follow the
 *  search, so a caller shows them as loading while it differs from the one
 *  that matters to it. A failed read keeps what was there. */
export function usePageCounts<C>(
  /** The newest counts read, or `null` before the first. */
  read: CountsRead<C> | null,
): { counts: C | null; search: string | null } {
  const [settled, setSettled] = useState<{ search: string; counts: C } | null>(null);

  useEffect(() => {
    if (!read) return;
    let live = true;
    read.counts.then(
      (counts) => {
        if (live) setSettled({ search: read.search, counts });
      },
      () => {
        // The counts on screen stay; the next load brings its own.
      },
    );
    return () => {
      live = false;
    };
  }, [read]);

  return { counts: settled?.counts ?? null, search: settled?.search ?? null };
}

/** Whether a table has no requests at all, which tells "nothing here" apart
 *  from "nothing matches". `total` is the counts' unfiltered figure. Until the
 *  counts arrive, only a page with no search and no chip can say so. */
export function isNothingAtAll(
  total: number | undefined,
  table: { matchCount: number } | null,
  query: { chip: string; search: string } | null,
): boolean {
  if (total !== undefined) return total === 0;
  return table?.matchCount === 0 && query?.chip === 'All requests' && query.search.trim() === '';
}
