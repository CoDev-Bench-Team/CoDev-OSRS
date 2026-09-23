/** The SPA's only door to the network (`CLAUDE.md`: "HTTP access only through
 *  `src/shared/api.ts`").
 *
 *  Contract: <https://codev-osrs-backend.vercel.app/#/>, recorded in
 *  `specs/001-office-supplies-mvp/contracts/README.md`. Nothing here invents a
 *  route, a field or an error code (spec 003 FR-004, ARCHITECT.md §8) — callers
 *  pass the path the contract publishes and name the response type it documents.
 *
 *  Two decisions are worth stating, because the rest of the SPA depends on them:
 *
 *  1. Every request carries `credentials: 'include'`. The session IS an httpOnly
 *     cookie named `session`; JavaScript cannot read it, cannot attach it by
 *     hand, and there is no bearer token to fall back on. A single `fetch` that
 *     forgets this silently becomes an anonymous request.
 *
 *  2. `401` is NOT an error. A signed-out visitor asking `/auth/me` who they are
 *     gets a perfectly correct answer: nobody. Throwing there would force every
 *     caller to catch an exception in order to reach a normal state, and it is
 *     how a first-time visitor ends up being told their session expired. So the
 *     result is a discriminated union and `unauthenticated` is one of its arms.
 */

/** Where the API lives.
 *
 *  The default is the relative `/api`, which the Vite dev server proxies to the
 *  deployed backend — see `vite.config.ts`. That makes the API same-origin
 *  during development, which matters twice over: the backend currently returns
 *  no `Access-Control-Allow-Origin` for any origin, and a same-origin cookie is
 *  first-party, so no `SameSite` negotiation is involved either.
 *
 *  A deployed build sets `VITE_API_URL` to the absolute origin, and needs
 *  that origin on the backend's CORS allowlist (questionsToBackend.md §3). */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export type ApiResult<T> =
  /** 2xx, body parsed as `T`. */
  | { readonly kind: 'ok'; readonly data: T }
  /** 401. A state, not a failure — the caller decides what it means. */
  | { readonly kind: 'unauthenticated' }
  /** Anything else: a non-2xx status, a network error, or an unparseable body.
   *  `status` is absent when the request never got an answer at all. */
  | { readonly kind: 'failed'; readonly status?: number };

type RequestOptions = {
  readonly method?: 'GET' | 'POST';
  /** Serialised as JSON. Omitted entirely rather than sent as `null`. */
  readonly body?: unknown;
  /** Lets a caller abandon a request whose answer is no longer wanted. */
  readonly signal?: AbortSignal;
};

/** Issue one request against the published contract.
 *
 *  `path` is contract-relative and starts with a slash: `request('/auth/me')`.
 *  `T` is the shape the contract documents for that path; this function does
 *  not validate it, because a schema the SPA maintains would be a second,
 *  competing definition of a contract this repo does not own. Validation of the
 *  fields the SPA actually depends on happens where they are mapped into the
 *  SPA's own types — see `features/auth/api-source.ts`. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      // The session cookie. See note 1 above.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Offline, DNS failure, CORS refusal, or an aborted request. None of them
    // tell us anything about the session, so none of them may be reported as a
    // signed-out state — that would sign a user out every time the wifi dropped.
    return { kind: 'failed' };
  }

  if (response.status === 401) return { kind: 'unauthenticated' };
  if (!response.ok) return { kind: 'failed', status: response.status };

  try {
    return { kind: 'ok', data: (await response.json()) as T };
  } catch {
    // 2xx with a body we cannot read. Rare, but a truncated response must not
    // be mistaken for a successful one.
    return { kind: 'failed', status: response.status };
  }
}
