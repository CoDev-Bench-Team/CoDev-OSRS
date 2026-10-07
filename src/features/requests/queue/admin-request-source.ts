import { apiAdminRequestSource } from './api-admin-request-source';
import type { AdminRequestSource } from './review-types';

/** Which source the Requests Queue and its review panel read: the published
 *  API (spec 017 Story 3). There is no seeded source and no dev stub. */
export function adminRequestSource(): AdminRequestSource {
  return apiAdminRequestSource;
}
