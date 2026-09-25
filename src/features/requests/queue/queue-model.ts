import {
  LIVE_STATUSES,
  QUEUE_CHIPS,
  type LiveStatus,
  type QueueChip,
  type QueueQuery,
  type QueueRequest,
  type QueueSnapshot,
  type QueueViewModel,
} from './queue-types';
import { formatDate, NO_VALUE, summarizeItems } from '../format';

/** Re-exported for the page, which has to recognise a placeholder — it is not
 *  worth a tooltip. */
export { NO_VALUE };

/** Non-terminal and past approval: the three statuses an Admin still has to
 *  hand over or complete (constitution 3.0.1 IV, ADR-0007). */
const IN_PROCESSING = new Set<QueueRequest['status']>(['Approved', 'For Delivery', 'Ready for Pickup']);

const LIVE = new Set<QueueRequest['status']>(LIVE_STATUSES);
const isLive = (request: QueueRequest): request is QueueRequest & { status: LiveStatus } => LIVE.has(request.status);

/** `NaN` for an unparseable value, so callers decide what that means. Sorting
 *  needs the number; the SUBMITTED label comes from the shared `formatDate`,
 *  pinned to Manila so every Admin reads the same date. */
const submittedTime = (value: string) => new Date(value).getTime();

/** FR-020: id, name, email and item names, case-insensitive, trimmed. */
function matchesSearch(request: QueueRequest, term: string) {
  if (term === '') return true;
  return [request.id, request.requestorName, request.requestorEmail ?? '', ...request.items].some((field) =>
    field.toLowerCase().includes(term),
  );
}

/** Newest first. An unusable timestamp sorts after every dated request under
 *  both date orders (FR-021), so it never hides at the top of either. */
function byDate(direction: 1 | -1) {
  return (a: QueueRequest, b: QueueRequest) => {
    const ta = submittedTime(a.submittedAt);
    const tb = submittedTime(b.submittedAt);
    if (Number.isNaN(ta) || Number.isNaN(tb)) return Number.isNaN(ta) ? (Number.isNaN(tb) ? 0 : 1) : -1;
    return direction * (ta - tb);
  };
}

const NEWEST = byDate(-1);
const COMPARE: Record<QueueQuery['sort'], (a: QueueRequest, b: QueueRequest) => number> = {
  'Newest First': NEWEST,
  'Oldest First': byDate(1),
  'Employee (A-Z)': (a, b) =>
    a.requestorName.localeCompare(b.requestorName, 'en', { sensitivity: 'base' }) || NEWEST(a, b),
};

/** The one projection (FR-023): de-duplicate, keep live statuses, search,
 *  count per chip, filter by chip, sort, clamp the page, slice. Counts, the
 *  range and the rows all come out of this single pass over one snapshot and
 *  one query, so they cannot disagree. */
export function buildQueueViewModel(snapshot: QueueSnapshot, query: QueueQuery): QueueViewModel {
  /** One de-duplication pass before anything is counted: a malformed source
   *  must not inflate one metric while another absorbs the same repeat. */
  const seenIds = new Set<string>();
  const requests = snapshot.requests.filter((request) => {
    if (seenIds.has(request.id)) return false;
    seenIds.add(request.id);
    return true;
  });

  const live = requests.filter(isLive);
  const term = query.search.trim().toLowerCase();
  const matches = live.filter((request) => matchesSearch(request, term));

  const chipCounts = Object.fromEntries(QUEUE_CHIPS.map((chip) => [chip, 0])) as Record<QueueChip, number>;
  chipCounts['All requests'] = matches.length;
  for (const request of matches) chipCounts[request.status] += 1;

  const filtered = (
    query.chip === 'All requests' ? matches : matches.filter((request) => request.status === query.chip)
  ).sort(COMPARE[query.sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(Math.max(1, Math.floor(query.page)), pageCount);
  const start = (page - 1) * query.pageSize;

  return {
    pendingApprovalCount: live.filter((request) => request.status === 'Pending Approval').length,
    inProcessingCount: live.filter((request) => IN_PROCESSING.has(request.status)).length,
    lowStockAlertCount: snapshot.lowStockAlertCount,
    liveCount: live.length,
    chipCounts,
    matchCount: filtered.length,
    page,
    rows: filtered.slice(start, start + query.pageSize).map((request) => ({
      id: request.id,
      requestorName: request.requestorName,
      requestorContext: request.requestorContext,
      itemSummary: summarizeItems(request.items, 3),
      submittedLabel: formatDate(request.submittedAt),
      status: request.status,
    })),
  };
}

/** Every real change except paging returns to page 1 (FR-022). A patch that
 *  sets a field to the value it already has — pressing the chip that is
 *  already selected — is not a change, so the page stays. One rule, in one
 *  place, rather than repeated in each control's handler. */
export function updateQuery(query: QueueQuery, change: Partial<QueueQuery>): QueueQuery {
  const keys = Object.keys(change) as (keyof QueueQuery)[];
  if (keys.every((key) => change[key] === query[key])) return query;
  const next = { ...query, ...change };
  return keys.length === 1 && keys[0] === 'page' ? next : { ...next, page: 1 };
}
