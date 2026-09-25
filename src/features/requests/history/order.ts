import type { EmployeeRequest } from '../detail/request-detail-types';

/** My Requests' order: newest first (spec 009 D2).
 *
 *  The page sorts rather than trusting the source, so a contract-backed source
 *  need not promise an order. Ties break on the request id, descending, so two
 *  requests submitted in the same instant still land the same way every time.
 *  A submission time that does not parse sorts last rather than first: a row
 *  whose date reads `—` is not the Employee's most recent request. */
export function newestFirst(requests: readonly EmployeeRequest[]): EmployeeRequest[] {
  const time = (r: EmployeeRequest) => {
    const t = Date.parse(r.submittedAt);
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  };
  return [...requests].sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    if (ta !== tb) return ta < tb ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}
