import { getRequest, listRequests, readPage, requestCounts, type ListRequestsParams, type RequestSort } from '../../shared/api';
import { readRequest } from './api-request-read';
import type { QueueSort } from './queue/queue-types';

/** The list rules the Requests Queue and History share against the API
 *  (spec 017 plan D4). */

export const API_SORT: Record<QueueSort, RequestSort> = {
  'Newest First': 'newest',
  'Oldest First': 'oldest',
  'Employee (A-Z)': 'employee_name_asc',
};

/** One search box, one published parameter: the display id for text that
 *  starts with `REQ-`, the requester's name or email otherwise. The API has
 *  no single search across both and the item name (contracts conflict 13). */
export function searchFilter(search: string): Pick<ListRequestsParams, 'displayId' | 'requester'> {
  const term = search.trim();
  if (!term) return {};
  return /^req-/i.test(term) ? { displayId: term } : { requester: term };
}

/** `/requests/counts`: `byStatus` per published status, and `inProcessing`. */
export function readCounts(body: unknown): { byStatus: Record<string, number>; inProcessing: number } {
  if (typeof body !== 'object' || body === null) throw new Error('counts: not an object');
  const { byStatus, inProcessing } = body as { byStatus?: unknown; inProcessing?: unknown };
  if (typeof byStatus !== 'object' || byStatus === null || typeof inProcessing !== 'number') {
    throw new Error('counts: no byStatus or inProcessing');
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(byStatus)) if (typeof value === 'number') out[key] = value;
  return { byStatus: out, inProcessing };
}

export type RequestCounts = ReturnType<typeof readCounts>;

/** How long the unfiltered counts are reused before they are read again. */
const UNFILTERED_FRESH_MS = 30_000;
let unfiltered: { at: number; read: Promise<RequestCounts> } | null = null;

/** `/requests/counts` with no filter, and with the search's filter.
 *
 *  What decides which rows are fetched and how the page is clamped is always
 *  read fresh: a request submitted elsewhere a moment ago must not be skipped.
 *  With no search that is the unfiltered read itself, which also refreshes
 *  the cache. With a search it is the filtered read, and only the summary
 *  cards (`all`) reuse the unfiltered counts for a short while, as they do
 *  not change as the Admin types. A failed read is not kept. */
export async function countsFor(
  search: Pick<ListRequestsParams, 'displayId' | 'requester'>,
): Promise<{ all: RequestCounts; matched: RequestCounts }> {
  const filtered = Object.keys(search).length > 0;
  if (!filtered || !unfiltered || Date.now() - unfiltered.at > UNFILTERED_FRESH_MS) {
    const read = requestCounts({}).then(readCounts);
    unfiltered = { at: Date.now(), read };
    read.catch(() => {
      if (unfiltered?.read === read) unfiltered = null;
    });
  }
  const [all, matched] = await Promise.all([
    unfiltered.read,
    filtered ? requestCounts(search).then(readCounts) : unfiltered.read,
  ]);
  return { all, matched };
}

/** Drop the reused counts: a write just changed them. */
export function forgetCounts(): void {
  unfiltered = null;
}

export function pageOf(body: unknown, what: string) {
  const read = readPage<unknown>(body);
  if (!read) throw new Error(`${what}: not a page`);
  return read;
}

/** A requested page clamped to the pages that exist. */
export function clampPage(page: number, matches: number, pageSize: number): number {
  const pageCount = Math.max(1, Math.ceil(matches / pageSize));
  return Math.min(Math.max(1, Math.floor(page)), pageCount);
}

/** One request by either of its ids. A link (an email's *View request*,
 *  `/queue/:id`) carries the display id, `REQ-2026-2`, which `GET
 *  /requests/:id` is not documented to take: it is found through the list's
 *  `displayId` filter, every status included, and then read by its own id. */
export async function getRequestByAnyId(id: string): Promise<unknown> {
  if (!/^req-/i.test(id)) return getRequest(id);
  // The filter matches a substring, so REQ-2026-2 also finds REQ-2026-20…29
  // and on. Every other match has more digits, so it was created later:
  // oldest first puts the exact one at the top of the first page.
  const page = pageOf(await listRequests({ displayId: id, sort: 'oldest', page: 1, limit: 10 }), 'requests');
  const match = page.data.map(readRequest).find((r) => r.displayId.toLowerCase() === id.toLowerCase());
  if (!match) throw new Error(`requests: no ${id}`);
  return getRequest(match.id);
}
