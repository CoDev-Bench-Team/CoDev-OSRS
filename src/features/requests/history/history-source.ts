import { apiHistorySource } from './api-history-source';
import type { AdminRequestSource, ReviewRequest } from '../queue/review-types';
import type { HistoryCounts, HistoryQuery, HistoryTable } from './history-types';

/** What History may do with the Admin's requests: read them. The transitions
 *  are not in the type, so nothing on History can change a request (spec 013
 *  FR-011, plan D1). */
export type HistorySource = Pick<AdminRequestSource, 'get'> & {
  /** One page of History, asked of the API (spec 017 plan D1). */
  page(query: HistoryQuery): Promise<HistoryPageResult>;
  /** The chip counts for the query's search. The page asks it alongside
   *  `page`, and draws each when it arrives. */
  counts(query: HistoryQuery): Promise<HistoryCounts>;
};

/** One page of History as the API answers it, and the requests behind it.
 *  The counts are a separate read: the table never waits on them, nor they
 *  on it. */
export interface HistoryPageResult {
  history: HistoryTable;
  requests: readonly ReviewRequest[];
}

/** Which source History reads: the published API (spec 017 Story 5). There
 *  is no seeded source and no dev stub. */
export function historySource(): HistorySource {
  return apiHistorySource;
}
