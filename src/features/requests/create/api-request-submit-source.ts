import { createRequest, problemOutcome } from '../../../shared/api';
import { readRequest, toEmployeeRequest } from '../api-request-read';
import { REFUSED_COPY, type RequestSubmitSource, type SubmitResult } from './request-submit-source';

/** Submit over `POST /requests` (spec 017 Story 1). No office is sent: the
 *  API reserves at the requester's own. The confirmation reads back what the
 *  API returned, and the numeric id is kept for later reads (FR-016). */
export const apiRequestSubmitSource: RequestSubmitSource = {
  async submit(_user, draft): Promise<SubmitResult> {
    const note = draft.note?.trim();
    try {
      const body = await createRequest({
        ...(note ? { purpose: note } : {}),
        items: draft.lines.map((line) => ({ assetId: Number(line.assetId), quantity: line.quantity })),
      });
      return { ok: true, request: toEmployeeRequest(readRequest(body)) };
    } catch (error) {
      const outcome = problemOutcome(error);
      switch (outcome.kind) {
        case 'invalid':
          return { ok: false, reason: 'invalid', problems: outcome.problems };
        case 'unreachable':
          return { ok: false, reason: 'unreachable' };
        case 'refused':
          return { ok: false, reason: 'refused', message: outcome.message || REFUSED_COPY };
        case 'status-changed':
          return { ok: false, reason: 'refused', message: outcome.detail ?? REFUSED_COPY };
        case 'unavailable':
          return { ok: false, reason: 'refused', message: REFUSED_COPY };
      }
    }
  },
};
