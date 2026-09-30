import { formatDate, summarizeItems } from '../format';
import { byTime, matchesSearch } from '../list-query';
import type { ReviewRequest, ReviewSnapshot } from '../queue/review-types';
import {
  HISTORY_CHIPS,
  TERMINAL_STATUSES,
  type HistoryChip,
  type HistoryQuery,
  type HistoryViewModel,
  type TerminalStatus,
} from './history-types';

export type ResolvedRequest = ReviewRequest & { status: TerminalStatus };

const TERMINAL = new Set<ReviewRequest['status']>(TERMINAL_STATUSES);
export const isResolved = (request: ReviewRequest): request is ResolvedRequest => TERMINAL.has(request.status);

/** When the request reached its terminal status: the time that status was
 *  set, as the source records it. `undefined` for a live request, or a
 *  terminal one missing its time.
 *
 *  The one place History reads a resolved time (spec 013 plan D2, R3). The
 *  RESOLVED label and both date sorts go through it, so when the contract says
 *  how it carries the time (contracts conflict 7), only this changes. */
export function resolvedAt(request: ReviewRequest): string | undefined {
  switch (request.status) {
    case 'Completed':
      return request.completedAt;
    case 'Rejected':
      return request.rejection?.at;
    case 'Cancelled':
      return request.cancellation?.at;
    default:
      return undefined;
  }
}

/** `NaN` for a missing or unparseable time, which sorts last (list-query). */
const resolvedTime = (request: ReviewRequest) => new Date(resolvedAt(request) ?? NaN).getTime();

const NEWEST = byTime(resolvedTime, -1);
const COMPARE: Record<HistoryQuery['sort'], (a: ReviewRequest, b: ReviewRequest) => number> = {
  'Newest First': NEWEST,
  'Oldest First': byTime(resolvedTime, 1),
  'Employee (A-Z)': (a, b) =>
    a.requestorName.localeCompare(b.requestorName, 'en', { sensitivity: 'base' }) || NEWEST(a, b),
};

/** The one projection, as the queue's: de-duplicate, keep terminal statuses,
 *  search, count per chip, filter by chip, sort, clamp the page, slice. Counts,
 *  range and rows come out of one pass over one snapshot and one query, so
 *  they cannot disagree. */
export function buildHistoryViewModel(snapshot: ReviewSnapshot, query: HistoryQuery): HistoryViewModel {
  const seenIds = new Set<string>();
  const resolved = snapshot.requests.filter((request): request is ResolvedRequest => {
    if (seenIds.has(request.id)) return false;
    seenIds.add(request.id);
    return isResolved(request);
  });

  const term = query.search.trim().toLowerCase();
  const matches = resolved.filter((request) => matchesSearch(request, term));

  const chipCounts = Object.fromEntries(HISTORY_CHIPS.map((chip) => [chip, 0])) as Record<HistoryChip, number>;
  chipCounts['All requests'] = matches.length;
  for (const request of matches) chipCounts[request.status] += 1;

  const filtered = (
    query.chip === 'All requests' ? matches : matches.filter((request) => request.status === query.chip)
  ).sort(COMPARE[query.sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(Math.max(1, Math.floor(query.page)), pageCount);
  const start = (page - 1) * query.pageSize;

  return {
    resolvedCount: resolved.length,
    chipCounts,
    matchCount: filtered.length,
    page,
    rows: filtered.slice(start, start + query.pageSize).map((request) => ({
      id: request.id,
      requestorName: request.requestorName,
      requestorContext: request.requestorContext,
      itemSummary: summarizeItems(request.items, 3),
      // A missing time reads as the em dash, as an unparseable one does.
      resolvedLabel: formatDate(resolvedAt(request) ?? ''),
      status: request.status,
    })),
  };
}
