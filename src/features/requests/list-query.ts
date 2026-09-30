/** The list rules the Requests Queue (spec 004) and the Admin's History (spec
 *  013) share, so the two tables search, sort and page by one set of rules
 *  (spec 013 plan D3). */

/** The fields a request list searches. */
export interface Searchable {
  id: string;
  requestorName: string;
  requestorEmail?: string;
  items: readonly string[];
}

/** Id, name, email and item names, case-insensitive. `term` is already trimmed
 *  and lower-cased; an empty term matches everything (spec 004 FR-020). */
export function matchesSearch(request: Searchable, term: string): boolean {
  if (term === '') return true;
  return [request.id, request.requestorName, request.requestorEmail ?? '', ...request.items].some((field) =>
    field.toLowerCase().includes(term),
  );
}

/** A comparator over a time, newest first for `-1`. `time` returns `NaN` for an
 *  unusable value, which sorts after every dated request under both orders, so
 *  it never hides at the top of either (spec 004 FR-021). */
export function byTime<T>(time: (item: T) => number, direction: 1 | -1) {
  return (a: T, b: T) => {
    const ta = time(a);
    const tb = time(b);
    if (Number.isNaN(ta) || Number.isNaN(tb)) return Number.isNaN(ta) ? (Number.isNaN(tb) ? 0 : 1) : -1;
    return direction * (ta - tb);
  };
}

/** Every real change except paging returns to page 1 (spec 004 FR-022). A patch
 *  that sets a field to the value it already has — pressing the chip that is
 *  already selected — is not a change, so the page stays. One rule, in one
 *  place, rather than repeated in each control's handler. */
export function updateQuery<Q extends { page: number }>(query: Q, change: Partial<Q>): Q {
  const keys = Object.keys(change) as (keyof Q)[];
  if (keys.every((key) => change[key] === query[key])) return query;
  const next = { ...query, ...change };
  return keys.length === 1 && keys[0] === 'page' ? next : { ...next, page: 1 };
}
