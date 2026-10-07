import { cancelRequest, getRequest, listRequests, problemOutcome, readAllPages, receiveRequest, signRequest } from '../../../shared/api';
import { readRequest, toEmployeeRequest } from '../api-request-read';
import type { CancelResult, EmployeeRequestSource, ReceiveResult, SignResult } from './request-detail-types';

/** My Requests over `/requests` (spec 017 Story 2). An Employee receives only
 *  their own rows, and another's request is a `404`.
 *
 *  Signing completes the request in the same write (constitution 10.0.0 IV,
 *  ADR-0013); the request comes back `Completed`. */
export const apiEmployeeRequestSource: EmployeeRequestSource = {
  async list(user) {
    const rows = await readAllPages<unknown>((page, limit) =>
      listRequests({ requesterId: user.id, sort: 'newest', page, limit }),
    );
    return rows.map((row) => toEmployeeRequest(readRequest(row)));
  },

  async get(_user, id) {
    return toEmployeeRequest(readRequest(await getRequest(id)));
  },

  async cancel(_user, id, reason): Promise<CancelResult> {
    try {
      return { ok: true, request: toEmployeeRequest(readRequest(await cancelRequest(id, reason))) };
    } catch (error) {
      const outcome = problemOutcome(error);
      if (outcome.kind === 'invalid') return { ok: false, refusal: 'reason-required' };
      if (outcome.kind === 'status-changed') return { ok: false, refusal: 'status-changed' };
      return { ok: false, refusal: 'unavailable' };
    }
  },

  async markReceived(_user, id): Promise<ReceiveResult> {
    try {
      return { ok: true, request: toEmployeeRequest(readRequest(await receiveRequest(id))) };
    } catch (error) {
      const outcome = problemOutcome(error);
      if (outcome.kind === 'status-changed') return { ok: false, refusal: 'status-changed', detail: outcome.detail };
      return { ok: false, refusal: 'unavailable' };
    }
  },

  async sign(_user, id, signature): Promise<SignResult> {
    try {
      const body = { agreed: signature.agreed, fullName: signature.fullName };
      return { ok: true, request: toEmployeeRequest(readRequest(await signRequest(id, body))) };
    } catch (error) {
      const outcome = problemOutcome(error);
      if (outcome.kind === 'invalid') return { ok: false, refusal: 'invalid', problems: outcome.problems };
      if (outcome.kind === 'status-changed') return { ok: false, refusal: 'status-changed', detail: outcome.detail };
      return { ok: false, refusal: 'unavailable' };
    }
  },
};
