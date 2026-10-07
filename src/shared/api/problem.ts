/** A published `application/problem+json` body. Field errors keep the
 *  contract's `pointer`. `pointerPath` in `validation.ts` is the only decoder;
 *  this reader does not parse pointers a second way. */
export type ApiFieldError = { detail: string; pointer: string };

export type ApiProblem = {
  title?: string;
  status?: number;
  detail?: string;
  errors?: ApiFieldError[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a response body as a problem. Missing fields stay absent. The
 *  contract's pointer string is kept as published. */
export function readProblem(body: unknown, status: number): ApiProblem {
  if (!isRecord(body)) return { status };
  const errors: ApiFieldError[] = [];
  if (Array.isArray(body.errors)) {
    for (const entry of body.errors) {
      if (!isRecord(entry) || typeof entry.detail !== 'string') continue;
      const pointer = typeof entry.pointer === 'string' ? entry.pointer : '';
      errors.push({ detail: entry.detail, pointer });
    }
  }
  return {
    title: typeof body.title === 'string' ? body.title : undefined,
    status: typeof body.status === 'number' ? body.status : status,
    detail: typeof body.detail === 'string' ? body.detail : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/** `POST /auth/google` puts the explanation in `title` and the HTTP reason
 *  phrase in `detail` (`Unauthorized`, `Forbidden`; `Conflict` on a 409). A detail that is only
 *  that phrase is not the refusal sentence. */
const HTTP_REASON = /^(unauthorized|forbidden|not found|conflict|bad request)$/i;

/** The sentence the sign-in screen shows. A specific `detail` wins. When
 *  `detail` is only the HTTP reason phrase, `title` wins. Otherwise the
 *  shell's existing refusal. */
export function problemMessage(problem: ApiProblem, fallback: string): string {
  const detail = problem.detail?.trim() ?? '';
  const title = problem.title?.trim() ?? '';
  if (detail && !HTTP_REASON.test(detail)) return detail;
  if (title && !HTTP_REASON.test(title)) return title;
  if (detail) return detail;
  if (title) return title;
  return fallback;
}
