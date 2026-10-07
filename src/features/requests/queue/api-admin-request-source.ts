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
import { API_SORT, countsFor, forgetCounts, getRequestByAnyId, pageOf, readClampedPage, searchFilter } from '../api-request-query';
import { readRequest, toReviewRequest } from '../api-request-read';
import { buildQueueViewModel } from './queue-model';
import { LIVE_STATUSES, QUEUE_CHIPS, type QueueChip, type QueueQuery } from './queue-types';
import { officeLabel, type AdminRequestSource, type ReviewRequest, type TransitionResult } from './review-types';

/** The Requests Queue and review panel over `/requests` (spec 017 Story 3).
 *
 *  - Search maps to one parameter (plan D4, contracts C13).
 *  - "All requests" is one list call with no status; resolved rows it
 *    returns are dropped (plan D5, amended 2026-10-06; C14).
 *  - Pending approval, In Processing and the chip counts come from
 *    `/requests/counts`, read beside the rows: the table never waits on it.
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

/** The rows of one page and how many the chip and search match, in one
 *  list read, without the counts: the list's own `total` says how many
 *  match. *All requests* sends no status (plan D5, amended 2026-10-06). The
 *  API then also returns resolved requests, which the projection drops, so
 *  such a page can hold fewer rows than its size, and its total counts them
 *  too, until the API takes a live-only filter (contracts C14). */
async function rowsFor(query: QueueQuery): Promise<{ rows: ReviewRequest[]; matches: number; page: number }> {
  const { body, page } = await readClampedPage(query.page, query.pageSize, (page) =>
    listRequests({
      ...searchFilter(query.search),
      sort: API_SORT[query.sort],
      ...(query.chip === 'All requests' ? {} : { status: toApiStatus(query.chip) }),
      page,
      limit: query.pageSize,
    }).then((body) => pageOf(body, 'requests')),
  );
  return { rows: body.data.map(read), matches: body.total, page };
}

const live = (byStatus: Record<string, number>) =>
  LIVE_STATUSES.reduce((sum, status) => sum + (byStatus[toApiStatus(status)] ?? 0), 0);

export const apiAdminRequestSource: AdminRequestSource = {
  pickupOffices: OFFICES,
  canComplete: false,

  async page(query) {
    const { rows, matches, page } = await rowsFor(query);
    // The API chose and paged the rows; the projection the queue has always
    // used formats and orders them, and keeps only the live ones.
    const projected = buildQueueViewModel({ requests: rows }, { ...query, search: '', page: 1 });
    return { queue: { rows: projected.rows, matchCount: matches, page }, requests: rows };
  },

  async counts(query, options) {
    // Refresh means now: the summary cards must not reuse cached counts.
    if (options?.fresh) forgetCounts();
    const { all, matched } = await countsFor(searchFilter(query.search));
    const chipCounts = Object.fromEntries(
      QUEUE_CHIPS.map((chip) => [
        chip,
        chip === 'All requests' ? live(matched.byStatus) : (matched.byStatus[toApiStatus(chip)] ?? 0),
      ]),
    ) as Record<QueueChip, number>;
    return {
      pendingApprovalCount: all.byStatus.pending_approval ?? 0,
      inProcessingCount: all.inProcessing,
      liveCount: live(all.byStatus),
      chipCounts,
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
    // The Employee's signature completes the request (ADR-0013).
    return { ok: false, refusal: 'unavailable' };
  },
};
