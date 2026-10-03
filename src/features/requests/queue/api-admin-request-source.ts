import {
  cancelRequest,
  listRequests,
  problemOutcome,
  receiveRequest,
  toApiStatus,
  updateRequestStatus,
  type UpdateRequestStatusBody,
} from '../../../shared/api';
import { OFFICES } from '../../auth/types';
import { API_SORT, clampPage, countsFor, forgetCounts, getRequestByAnyId, pageOf, searchFilter } from '../api-request-query';
import { readRequest, toReviewRequest } from '../api-request-read';
import { buildQueueViewModel } from './queue-model';
import { LIVE_STATUSES, QUEUE_CHIPS, type QueueChip, type QueueQuery } from './queue-types';
import { officeLabel, type AdminRequestSource, type ReviewRequest, type TransitionResult } from './review-types';

/** The Requests Queue and review panel over `/requests` (spec 017 Story 3).
 *
 *  - Search maps to one parameter (plan D4, contracts C13).
 *  - "All requests" lists live statuses only: one call per live status,
 *    merged into full pages (plan D5, C14).
 *  - Pending approval and In Processing come from `/requests/counts`.
 *  - Other Notes is never sent (C6). Complete is withheld (Story 4, C12). */

const toResult = (error: unknown): TransitionResult => {
  const outcome = problemOutcome(error);
  if (outcome.kind === 'status-changed') return { ok: false, refusal: 'status-changed' };
  return { ok: false, refusal: 'unavailable' };
};

async function run(write: () => Promise<unknown>): Promise<TransitionResult> {
  try {
    await write();
    return { ok: true };
  } catch (error) {
    return toResult(error);
  } finally {
    // Written or refused, the counts may have moved; read them afresh.
    forgetCounts();
  }
}

const read = (body: unknown) => toReviewRequest(readRequest(body));

async function rowsFor(
  query: QueueQuery,
  matches: number,
  page: number,
  byStatus: Record<string, number>,
): Promise<ReviewRequest[]> {
  const filters = { ...searchFilter(query.search), sort: API_SORT[query.sort] };
  if (query.chip !== 'All requests') {
    const body = await listRequests({ ...filters, status: toApiStatus(query.chip), page, limit: query.pageSize });
    return pageOf(body, 'requests').data.map(read);
  }
  if (matches === 0) return [];
  // Every live status's first `page × size` rows, merged in the API's order,
  // hold the requested page. The cost grows with the page number (plan D5).
  const enough = page * query.pageSize;
  // A status with no match has no rows to merge, so it is not asked.
  const asked = LIVE_STATUSES.filter((status) => (byStatus[toApiStatus(status)] ?? 0) > 0);
  const lists = await Promise.all(
    asked.map((status) => listRequests({ ...filters, status: toApiStatus(status), page: 1, limit: enough })),
  );
  return lists.flatMap((body) => pageOf(body, 'requests').data.map(read));
}

export const apiAdminRequestSource: AdminRequestSource = {
  pickupOffices: OFFICES,
  canComplete: false,

  async page(query) {
    const search = searchFilter(query.search);
    const { all, matched } = await countsFor(search);
    const live = (byStatus: Record<string, number>) =>
      LIVE_STATUSES.reduce((sum, status) => sum + (byStatus[toApiStatus(status)] ?? 0), 0);
    const chipCounts = Object.fromEntries(
      QUEUE_CHIPS.map((chip) => [
        chip,
        chip === 'All requests' ? live(matched.byStatus) : (matched.byStatus[toApiStatus(chip)] ?? 0),
      ]),
    ) as Record<QueueChip, number>;
    const matchCount = chipCounts[query.chip];
    const page = clampPage(query.page, matchCount, query.pageSize);
    const fetched = await rowsFor(query, matchCount, page, matched.byStatus);
    // The page's rows, formatted and ordered by the same projection the queue
    // has always used; the API decided which rows they are.
    const projected = buildQueueViewModel(
      { requests: fetched },
      { ...query, search: '', page: query.chip === 'All requests' ? page : 1 },
    );
    return {
      queue: {
        ...projected,
        pendingApprovalCount: all.byStatus.pending_approval ?? 0,
        inProcessingCount: all.inProcessing,
        liveCount: live(all.byStatus),
        chipCounts,
        matchCount,
        page,
      },
      requests: fetched,
    };
  },

  async get(id) {
    return read(await getRequestByAnyId(id));
  },

  approve(id) {
    // Other Notes is collected by the panel and never sent (contracts C6).
    return run(() => updateRequestStatus(id, { status: 'approved' }));
  },

  async reject(id, reason) {
    const trimmed = reason.trim();
    if (!trimmed) return { ok: false, refusal: 'reason-required' };
    return run(() => updateRequestStatus(id, { status: 'rejected', rejectionReason: trimmed }));
  },

  async updateStatus(id, to, pickup) {
    if (to === 'Received') return run(() => receiveRequest(id));
    let body: UpdateRequestStatusBody;
    if (to === 'Ready for Pickup') {
      if (!pickup) return { ok: false, refusal: 'location-required' };
      const pickupLocation = pickup.kind === 'office' ? officeLabel(pickup.office) : pickup.text.trim();
      if (!pickupLocation) return { ok: false, refusal: 'location-required' };
      body = { status: 'ready_for_pickup', pickupLocation };
    } else {
      body = { status: 'for_delivery' };
    }
    return run(() => updateRequestStatus(id, body));
  },

  async cancel(id, reason) {
    const trimmed = reason.trim();
    if (!trimmed) return { ok: false, refusal: 'reason-required' };
    return run(() => cancelRequest(id, trimmed));
  },

  async complete() {
    // No Admin complete is published (contracts conflict 12).
    return { ok: false, refusal: 'unavailable' };
  },
};
