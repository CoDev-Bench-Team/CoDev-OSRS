import { apiRequest } from './client';
import type { ApiRequestStatus } from './maps';
import { withQuery } from './query';

/** `/requests`, as published on 2026-10-03. Each operation is defined once
 *  here (spec 017 FR-003). There is deliberately no sign: the published
 *  `/sign` completes the request, which constitution IV forbids (spec 017
 *  Story 4, contracts conflict 12). Responses stay `unknown` until a mapper
 *  reads them against the live field record (plan D15). */

export type RequestSort = 'newest' | 'oldest' | 'employee_name_asc';

type RequestFilters = {
  displayId?: string;
  /** First name, last name or email. */
  requester?: string;
  requesterId?: string;
  itemName?: string;
};

export type ListRequestsParams = RequestFilters & {
  page?: number;
  limit?: number;
  status?: ApiRequestStatus;
  sort?: RequestSort;
};

export type RequestHistoryParams = RequestFilters & {
  page?: number;
  limit?: number;
  status?: 'completed' | 'rejected' | 'cancelled';
  sort?: RequestSort;
};

/** `POST /requests`. No office: the API reserves at the requester's own. */
export type CreateRequestBody = {
  purpose?: string;
  items: { assetId: number; quantity: number }[];
};

/** The four targets `PATCH` publishes. `received` and `completed` are not
 *  among them. */
export type UpdateRequestStatusBody =
  | { status: 'approved' }
  | { status: 'rejected'; rejectionReason: string }
  | { status: 'ready_for_pickup'; pickupLocation: string }
  | { status: 'for_delivery' };

const one = (id: string) => `/requests/${encodeURIComponent(id)}`;

/** `POST /requests`. Added by BEN-156. A session-ending write (BEN-157). */
export function createRequest(body: CreateRequestBody): Promise<unknown> {
  return apiRequest('/requests', { method: 'POST', body });
}

/** `GET /requests`. An Employee receives only their own. Added by BEN-155;
 *  reused by BEN-159. */
export function listRequests(params: ListRequestsParams): Promise<unknown> {
  return apiRequest(withQuery('/requests', params));
}

/** `GET /requests/:id`, by the numeric id; never the display id. Added by
 *  BEN-155; reused by BEN-159 and BEN-160. */
export function getRequest(id: string): Promise<unknown> {
  return apiRequest(one(id));
}

/** `POST /requests/:id/cancel`. Never `DELETE`. Added by BEN-155; reused by
 *  BEN-159. */
export function cancelRequest(id: string, reason: string): Promise<unknown> {
  return apiRequest(`${one(id)}/cancel`, { method: 'POST', body: { reason } });
}

/** `POST /requests/:id/receive`, no body, by the owning Employee or an Admin.
 *  Added by BEN-155; reused by BEN-159. A session-ending write (BEN-157). */
export function receiveRequest(id: string): Promise<unknown> {
  return apiRequest(`${one(id)}/receive`, { method: 'POST' });
}

/** `GET /requests/counts`: `total`, `byStatus`, `inProcessing`. Added by
 *  BEN-159; reused by BEN-160. */
export function requestCounts(params: RequestFilters): Promise<unknown> {
  return apiRequest(withQuery('/requests/counts', params));
}

/** `PATCH /requests/:id`, Admin only. Nothing but `status` and the field its
 *  target requires is sent: no Other Notes (contracts conflict 6). Added by
 *  BEN-159. */
export function updateRequestStatus(id: string, body: UpdateRequestStatusBody): Promise<unknown> {
  return apiRequest(one(id), { method: 'PATCH', body });
}

/** `GET /requests/history`, Admin only. Added by BEN-160. */
export function requestHistory(params: RequestHistoryParams): Promise<unknown> {
  return apiRequest(withQuery('/requests/history', params));
}
