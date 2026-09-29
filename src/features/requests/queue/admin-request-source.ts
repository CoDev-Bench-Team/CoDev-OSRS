import type { AdminRequestSource } from './review-types';
import { reviewStub } from './dev/review-stub';
import { createSeededAdminRequestSource, seededAdminRequestSource } from './seeded-admin-request-source';

/** Which source the Requests Queue and its review panel read. Today that is
 *  always the seeded one. When the contract publishes, a contract-backed source
 *  is returned here instead.
 *
 *  On the dev server only, `?review=<mode>` wraps a FRESH seed in a stub that
 *  reaches the refused, failed and failed-reload paths the seed cannot
 *  (`dev/review-stub.ts`, spec 008 FR-014). `import.meta.env.DEV` is `false` in
 *  a production build, so the branch and the stub are dropped from it. */
export function adminRequestSource(search: string): AdminRequestSource {
  if (import.meta.env.DEV) {
    const stub = reviewStub(new URLSearchParams(search).get('review'), createSeededAdminRequestSource);
    if (stub) return stub;
  }
  return seededAdminRequestSource;
}
