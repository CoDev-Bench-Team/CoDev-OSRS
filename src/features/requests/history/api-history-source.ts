import { requestHistory, toApiStatus } from '../../../shared/api';
import { API_SORT, clampPage, countsFor, getRequestByAnyId, pageOf, searchFilter } from '../api-request-query';
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
    const search = searchFilter(query.search);
    const { all, matched } = await countsFor(search);
    const resolved = (byStatus: Record<string, number>) =>
      TERMINAL_STATUSES.reduce((sum, status) => sum + (byStatus[toApiStatus(status)] ?? 0), 0);
    const chipCounts = Object.fromEntries(
      HISTORY_CHIPS.map((chip) => [
        chip,
        chip === 'All requests' ? resolved(matched.byStatus) : (matched.byStatus[toApiStatus(chip)] ?? 0),
      ]),
    ) as Record<HistoryChip, number>;
    const matchCount = chipCounts[query.chip];
    const page = clampPage(query.page, matchCount, query.pageSize);
    if (matchCount === 0) {
      const projected = buildHistoryViewModel({ requests: [] }, { ...query, search: '', page: 1 });
      return { history: { ...projected, resolvedCount: resolved(all.byStatus), chipCounts, matchCount, page }, requests: [] };
    }
    const body = await requestHistory({
      ...search,
      sort: API_SORT[query.sort],
      ...(query.chip === 'All requests' ? {} : { status: toApiStatus(query.chip) as 'completed' | 'rejected' | 'cancelled' }),
      page,
      limit: query.pageSize,
    });
    const requests = pageOf(body, 'history').data.map(read);
    // Rows formatted by the projection History has always used; the API chose
    // them and their order.
    const projected = buildHistoryViewModel(
      { requests },
      { ...query, search: '', page: 1 },
    );
    return {
      history: { ...projected, resolvedCount: resolved(all.byStatus), chipCounts, matchCount, page },
      requests,
    };
  },

  async get(id) {
    return read(await getRequestByAnyId(id));
  },
};
