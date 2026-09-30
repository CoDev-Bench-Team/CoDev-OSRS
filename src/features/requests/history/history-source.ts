import { adminRequestSource } from '../queue/admin-request-source';
import { createSeededAdminRequestSource } from '../queue/seeded-admin-request-source';
import type { AdminRequestSource } from '../queue/review-types';
import { historyStub } from './dev/history-stub';

/** What History may do with the Admin's requests: read them. The transitions
 *  are not in the type, so nothing on History can change a request (spec 013
 *  FR-011, plan D1). */
export type HistorySource = Pick<AdminRequestSource, 'load'>;

/** Which source History reads: the same store as the Requests Queue, so a
 *  request decided there is in History on the next load, as it would be
 *  against the API. When the contract publishes, `adminRequestSource` returns
 *  the contract-backed one and this follows (contracts conflict 7).
 *
 *  On the dev server only, `?history=<mode>` builds a stub over a FRESH seed to
 *  reach what the seed cannot (`dev/history-stub.ts`). `import.meta.env.DEV` is
 *  `false` in a production build, so the branch and the stub are dropped. */
export function historySource(search: string): HistorySource {
  if (import.meta.env.DEV) {
    const stub = historyStub(new URLSearchParams(search).get('history'), createSeededAdminRequestSource);
    if (stub) return stub;
  }
  return adminRequestSource(search);
}
