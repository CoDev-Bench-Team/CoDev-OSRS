import type { EmployeeRequestSource } from './request-detail-types';
import { requestStub } from './dev/request-stub';
import { seededEmployeeRequestSource } from './seeded-employee-request-source';

/** Which source My Requests reads. Today that is always the seeded one; when
 *  the contract publishes, a contract-backed source is returned here instead.
 *
 *  On the dev server only, `?requests=<mode>` wraps it in a stub that reaches
 *  the loading, empty and failure states and the refused-cancel and
 *  failed-reload paths the seed cannot (`dev/request-stub.ts`). `import.meta.env.DEV` is `false` in a production
 *  build, so the branch and the stub are dropped from it. */
export function employeeRequestSource(search: string): EmployeeRequestSource {
  if (import.meta.env.DEV) {
    const stub = requestStub(new URLSearchParams(search).get('requests'), seededEmployeeRequestSource);
    if (stub) return stub;
  }
  return seededEmployeeRequestSource;
}
