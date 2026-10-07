import { useEffect, useState } from 'react';

/** What the Requests Queue and History share over a source that pages itself
 *  (the API, spec 017 plan D1, D6, D7). */

/** A paged source waits this long after the last keystroke before it asks. */
const SEARCH_DEBOUNCE_MS = 300;

/** `query` with its search held back until typing settles, for a paged source.
 *  Every other change passes straight through. Unpaged, it is `query`.
 *
 *  The result keeps its identity until a field it carries changes. Pages fetch
 *  in an effect keyed on it, so a keystroke that only moves the unsettled
 *  search must not hand back a new, equal object: that would ask the API
 *  again, with the old search, on every letter. */
export function useSettledQuery<Q extends { search: string }>(query: Q, paged: boolean): Q {
  const [settledSearch, setSettledSearch] = useState(query.search);
  useEffect(() => {
    if (!paged || query.search === settledSearch) return;
    const timer = setTimeout(() => setSettledSearch(query.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query.search, settledSearch, paged]);
  const next = !paged || query.search === settledSearch ? query : { ...query, search: settledSearch };
  // Adjusted during render, React's pattern for state derived from props, so
  // the effect never sees the intermediate object.
  const [stable, setStable] = useState(next);
  if (!shallowEqual(stable, next)) {
    setStable(next);
    return next;
  }
  return stable;
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;
  const keys = Object.keys(a) as (keyof T)[];
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
}

type ReadsOne<R> = { get?(id: string): Promise<R> };

/** The request a deep link names, read by id when the source pages (plan D7,
 *  D17). `'pending'` until the read settles. `null` when there is nothing to
 *  read, or the read failed, which leaves the link to miss. */
export function useLinkedRequest<R>(source: ReadsOne<R>, linkId: string | undefined): R | null | 'pending' {
  const [result, setResult] = useState<{ id: string; request: R | null } | null>(null);
  useEffect(() => {
    if (!linkId || !source.get) return;
    let live = true;
    source.get(linkId).then(
      (request) => live && setResult({ id: linkId, request }),
      () => live && setResult({ id: linkId, request: null }),
    );
    return () => {
      live = false;
    };
  }, [source, linkId]);
  if (!linkId || !source.get) return null;
  return result?.id === linkId ? result.request : 'pending';
}

/** The open request in full: the API's rows are partial, so the panel reads
 *  it by id. Until the read arrives the last version is kept, so the panel
 *  stays mounted through a reload. When a transition takes the request off
 *  the current page (a cancel or a reject makes it terminal), it is still
 *  read by id, so the panel shows the result instead of closing (spec 017
 *  FR-006). A failed read falls back to the row, if there is one. */
export function useOpenRequest<R extends { id: string; displayId?: string }>(
  source: ReadsOne<R>,
  shownId: string | null | undefined,
  row: R | undefined,
  /** The page's loaded snapshot: each reload re-reads the open request, so a
   *  request whose row object never changes (one read for a deep link)
   *  still follows an action's result. */
  version?: unknown,
): R | undefined {
  /** The full read, with the row it was read for. */
  const [full, setFull] = useState<{ request: R; row: R | undefined } | null>(null);
  const target = row?.id ?? shownId ?? undefined;
  useEffect(() => {
    if (!target || !source.get) return;
    let live = true;
    source.get(target).then(
      (request) => live && setFull({ request, row }),
      // With no row to fall back on, the last copy stays rather than the
      // panel vanishing; with one, the row is shown.
      () => live && setFull((was) => (row === undefined ? was : null)),
    );
    return () => {
      live = false;
    };
    // `row` is a dependency on purpose: a reload hands in a new row, which
    // re-reads, so the panel follows a transition's result.
  }, [source, target, row, version]);
  if (!target) return undefined;
  // A full read counts only for the row it was read for. A newer row (a
  // reload after a transition, the panel reopened since) is the source's
  // later word: it is shown until its own full read arrives, never an older
  // full copy with the old status, timeline and actions.
  // With no row at all (a transition took the request off this page), the
  // last full copy stays until its re-read lands or fails, so the panel is
  // not unmounted in the middle of showing how the action ended.
  const { request } = full ?? {};
  const sameRequest = request !== undefined && (request.id === target || request.displayId === target);
  if (full && sameRequest && (full.row === row || row === undefined)) return request;
  return row;
}
