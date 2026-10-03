import { apiEmployeeRequestSource } from './api-employee-request-source';
import type { EmployeeRequestSource } from './request-detail-types';

/** Which source My Requests reads: the published API (spec 017 Story 2).
 *  There is no seeded source and no dev stub. */
export function employeeRequestSource(): EmployeeRequestSource {
  return apiEmployeeRequestSource;
}
