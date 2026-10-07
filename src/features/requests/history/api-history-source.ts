import { requestHistory, toApiStatus } from '../../../shared/api';
import { API_SORT, countsFor, getRequestByAnyId, pageOf, readClampedPage, searchFilter } from '../api-request-query';
import { readRequest, toReviewRequest } from '../api-request-read';
import { buildHistoryViewModel } from './history-model';
import type { HistorySource } from './history-source';
import { HISTORY_CHIPS, TERMINAL_STATUSES, type HistoryChip } from './history-types';

/** History over `/requests/history` (spec 017 Story 5): completed, rejected
 *  and cancelled requests, sorted by when they were resolved. Read-only: no
 *  delete. A reason renders only when the payload carries it. */

const read = (body: unknown) => toReviewRequest(readRequest(body));

export const apiHistorySource: HistorySource = {
  async page(query) {
    // The list's own `total` says how many match, so the rows never wait on
    // the counts.
    const { body, page } = await readClampedPage(query.page, query.pageSize, (page) =>
      requestHistory({
        ...searchFilter(query.search),
        sort: API_SORT[query.sort],
        ...(query.chip === 'All requests' ? {} : { status: toApiStatus(query.chip) as 'completed' | 'rejected' | 'cancelled' }),
        page,
        limit: query.pageSize,
      }).then((body) => pageOf(body, 'history')),
    );
    const requests = body.data.map(read);
    // Rows formatted by the projection History has always used; the API chose
    // them and their order.
    const projected = buildHistoryViewModel({ requests }, { ...query, search: '', page: 1 });
    return { history: { rows: projected.rows, matchCount: body.total, page }, requests };
  },

  async counts(query) {
    const { all, matched } = await countsFor(searchFilter(query.search));
    const resolved = (byStatus: Record<string, number>) =>
      TERMINAL_STATUSES.reduce((sum, status) => sum + (byStatus[toApiStatus(status)] ?? 0), 0);
    const chipCounts = Object.fromEntries(
      HISTORY_CHIPS.map((chip) => [
        chip,
        chip === 'All requests' ? resolved(matched.byStatus) : (matched.byStatus[toApiStatus(chip)] ?? 0),
      ]),
    ) as Record<HistoryChip, number>;
    return { resolvedCount: resolved(all.byStatus), chipCounts };
  },

  async get(id) {
    return read(await getRequestByAnyId(id));
  },
};
