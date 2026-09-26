import { parseValidationProblem } from '../../../shared/validation';
import type { User } from '../../auth/types';
import { seededAsset, seededStock } from '../../catalog/seeded-source';
import { OFFICES } from '../../catalog/types';
import type { EmployeeRequest } from '../detail/request-detail-types';
import { appendSeededRequest, nextSeededRequestId } from '../detail/seeded-employee-request-source';
import type { RequestListDraftInput } from './request-list-types';
import { REFUSED_COPY, type RequestSubmitSource, type SubmitResult } from './request-submit-source';

/** A stand-in for `POST /requests` until the contract publishes its success
 *  body and its insufficient-stock refusal (contract conflict 4; spec 010,
 *  Clarifications 2026-09-25).
 *
 *  It keeps the rules the system must keep, so the feature can be demonstrated
 *  honestly before the backend exists:
 *
 *  - the request is made from the Employee's own office;
 *  - it is all-or-nothing — if any line's quantity is not a whole number of
 *    at least 1, or any asset's lines exceed Available there, nothing is
 *    reserved and no request exists (FR-009, constitution III) — and the two
 *    are refused with different messages, so a bad quantity is never called
 *    a stock shortage;
 *  - a successful submit moves each quantity out of Available (the Catalog
 *    reads the same store) and creates one `Pending Approval` request.
 *
 *  Its refusal copy is the stand-in system's own. The drawer shows whatever a
 *  source returns, verbatim, so the live source's message replaces it without
 *  any change above this file (FR-014). */

declare global {
  /** This module's development-only hooks (D19); see `seeded-stock.ts`. */
  interface OsrsDevHooks {
    /** Answers the next submit with this problem body, once. */
    submitFixture?: unknown;
    /** How many submits have reached this source since the page loaded — so
     *  a check can prove a second click sent nothing (FR-010). */
    submitCalls?: number;
  }
  interface Window {
    __osrs?: OsrsDevHooks;
  }
}

/** A problem body's own `detail`, else its `title` (RFC 9457) — what a refusal
 *  that places nothing shows at the top of the drawer. Only a body with
 *  neither gets the stand-in system's own words. */
function problemMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const { detail, title } = body as { detail?: unknown; title?: unknown };
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof title === 'string' && title.trim()) return title;
  }
  return REFUSED_COPY;
}

/** DEVELOPMENT ONLY. `import.meta.env.DEV` is `false` in a production build, so
 *  this branch — and with it the fixture hook — is dropped (D19).
 *
 *  - `window.__osrs.submitFixture = <problem body>` answers the next submit
 *    with that body, once, as the system would answer a 400. It is how the
 *    contract's documented validation example reaches the drawer before a live
 *    source exists; the UI itself cannot produce an invalid body.
 *  - `?fail-submit` makes every submit unreachable.
 *  - `?slow-submit=<ms>` holds every submit in flight that long (capped at
 *    5s), so `Submitting…` and the FR-010 guard can be seen and checked; the
 *    seeded source otherwise answers within a microtask.
 *  - `window.__osrs.submitCalls` counts the submits that reached this source. */
async function devOverride(): Promise<SubmitResult | null> {
  if (!import.meta.env.DEV) return null;
  window.__osrs = { ...window.__osrs, submitCalls: (window.__osrs?.submitCalls ?? 0) + 1 };
  const ms = Number(new URLSearchParams(window.location.search).get('slow-submit'));
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 5000)));
  const hooks = window.__osrs;
  if (hooks && hooks.submitFixture !== undefined) {
    const body = hooks.submitFixture;
    hooks.submitFixture = undefined;
    const problems = parseValidationProblem(body);
    return problems ? { ok: false, reason: 'invalid', problems } : { ok: false, reason: 'refused', message: problemMessage(body) };
  }
  if (new URLSearchParams(window.location.search).has('fail-submit')) return { ok: false, reason: 'unreachable' };
  return null;
}

export const seededRequestSubmitSource: RequestSubmitSource = {
  async submit(user: User, draft: RequestListDraftInput): Promise<SubmitResult> {
    const override = await devOverride();
    if (override) return override;

    const office = OFFICES.find((o) => o === user.office);
    if (user.role !== 'employee' || !office) {
      return { ok: false, reason: 'refused', message: 'Only an Employee with a home office can submit a request.' };
    }
    if (draft.lines.length === 0) return { ok: false, reason: 'refused', message: 'A request needs at least one item.' };

    const failed = seededStock.reserve(draft.lines, office);
    if (failed?.reason === 'invalid-quantity') {
      return {
        ok: false,
        reason: 'refused',
        message: 'Each quantity must be a whole number of at least 1. Nothing was reserved.',
      };
    }
    if (failed) {
      const name = seededAsset(failed.assetId)?.name ?? 'an item';
      const left = seededStock.available(failed.assetId, office);
      return {
        ok: false,
        reason: 'refused',
        message: `Not enough stock: ${left} of ${name} available at ${office}. Nothing was reserved.`,
      };
    }

    const request: EmployeeRequest = {
      id: nextSeededRequestId(),
      submittedAt: new Date().toISOString(),
      status: 'Pending Approval',
      lines: draft.lines.map(({ assetId, quantity }) => {
        const asset = seededAsset(assetId);
        const name = asset?.name ?? assetId;
        return { name, description: asset ? `${asset.name} - ${asset.model}` : name, qty: quantity };
      }),
      ...(draft.note ? { noteToApprover: draft.note } : {}),
    };
    appendSeededRequest(user, request);
    return { ok: true, request };
  },
};
