import { problemMessage, readProblem, type ApiProblem } from './problem';
import { notifiesSessionEnded, sessionFailure } from './session-failure';

/** The configured API could not be reached. Callers must not substitute the
 *  seeded session. */
export class SessionUnreachable extends Error {
  constructor() {
    super('The API could not be reached.');
    this.name = 'SessionUnreachable';
  }
}

/** A non-OK response. The message is the same sentence sign-in shows. This
 *  client does not retry. */
export class ApiProblemError extends Error {
  readonly status: number;
  readonly problem: ApiProblem;

  constructor(status: number, problem: ApiProblem) {
    super(problemMessage(problem, `API request failed (${status})`));
    this.name = 'ApiProblemError';
    this.status = status;
    this.problem = problem;
  }
}

const sessionEnded = new Set<() => void>();

/** Wake the session boundary after a `401`, or a `403` on a session-ending
 *  write. The listener carries no user and no role. */
export function onSessionEnded(listener: () => void): () => void {
  sessionEnded.add(listener);
  return () => sessionEnded.delete(listener);
}

function notifySessionEnded(): void {
  for (const listener of sessionEnded) listener();
}

/** Same-origin where a proxy keeps the session cookie on this host: the Vite
 *  dev server, and a Netlify build. Any other production build calls the
 *  configured base directly, so that host must be the same site as the API. */
export function apiUrl(path: string): string {
  if (import.meta.env.DEV || __OSRS_NETLIFY__) return path;
  const configured = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
  return `${configured.replace(/\/$/, '')}${path}`;
}

export function apiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
}

/** One request. Sends the session cookie. Does not read or write browser
 *  storage. A `401` or `403` is sent once. */
export async function apiRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const headers = new Headers();
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      credentials: 'include',
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new SessionUnreachable();
  }

  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const problem = readProblem(payload, response.status);
    const action = sessionFailure(response.status, method, path);
    if (action === 'sign-in' && notifiesSessionEnded(method, path)) notifySessionEnded();
    throw new ApiProblemError(response.status, problem);
  }

  return payload as T;
}
