import { pointerPath, type FieldProblem } from '../validation';
import { ApiProblemError, SessionUnreachable } from './client';
import { problemMessage } from './problem';

/** How a refused or failed write ends, in the screens' own vocabulary (plan
 *  D11). The API's words are carried, never replaced. */
export type ProblemOutcome =
  | { kind: 'invalid'; problems: FieldProblem[] }
  | { kind: 'refused'; message: string }
  | { kind: 'status-changed'; detail?: string }
  | { kind: 'unavailable' }
  | { kind: 'unreachable' };

/** `400` with field pointers is `invalid`; any other `400` is `refused` with
 *  the API's message (a stock refusal on submit, for one). `404` is
 *  `unavailable`, `409` is `status-changed`. A `401`/`403` already ended the
 *  session in the client; it reads as `unavailable` here and is not retried.
 *  Anything that is not an API problem is rethrown. */
export function problemOutcome(error: unknown): ProblemOutcome {
  if (error instanceof SessionUnreachable) return { kind: 'unreachable' };
  if (!(error instanceof ApiProblemError)) throw error;
  const { status, problem } = error;
  if (status === 400) {
    const problems = (problem.errors ?? []).map((entry) => ({ path: pointerPath(entry.pointer), detail: entry.detail }));
    if (problems.length > 0) return { kind: 'invalid', problems };
    return { kind: 'refused', message: problemMessage(problem, error.message) };
  }
  if (status === 409) {
    const detail = problemMessage(problem, '');
    return detail ? { kind: 'status-changed', detail } : { kind: 'status-changed' };
  }
  return { kind: 'unavailable' };
}
