import type { EmployeeRequest, EmployeeRequestSource } from '../request-detail-types';

/** DEV-ONLY STUB — reached only through `employee-request-source.ts`, behind
 *  `import.meta.env.DEV`, so a production build drops it.
 *
 *  The seed answers at once, always has Maya's seven requests, and never refuses
 *  a cancel for a changed status or fails a reload. `?requests=<mode>` on
 *  `/requests` reaches what it cannot:
 *
 *  - `loading` — the list takes two seconds (spec 007 FR-011).
 *  - `empty` — the Employee has no requests (FR-011).
 *  - `failing` — every list call fails, Try Again included (FR-011). It must
 *    fail every call, not just the first: StrictMode loads the list twice on
 *    mount in dev, and the first result is discarded.
 *  - `changes` — the Admin approves the request while the panel is open. The
 *    cancel is refused `status-changed` and the reload shows it `Approved`
 *    (Story 2 AC5, FR-008).
 *  - `refresh-fails` — the cancel goes through, then the reload after it fails.
 *    The panel stays open and shows `Cancelled` (review of #38).
 *  - `blank-items` — one request with no item names and one with a blank name
 *    among real ones, so the shared `summarizeItems` guard shows on My Requests.
 *  - `changes-reload-fails` — both: refused, and the reload fails, so the panel
 *    cannot show a current status and must not claim to (second review). */
const LOADING_MS = 2000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const fail = () => Promise.reject(new Error('stubbed list failure'));

export function requestStub(mode: string | null, seeded: EmployeeRequestSource): EmployeeRequestSource | null {
  switch (mode) {
    case 'loading':
      return {
        ...seeded,
        async list(user) {
          await delay(LOADING_MS);
          return seeded.list(user);
        },
      };
    case 'empty':
      return { ...seeded, list: async () => [] };
    case 'blank-items':
      return {
        ...seeded,
        async list(user) {
          return (await seeded.list(user)).map((r) =>
            r.id === 'REQ-2026-1805'
              ? { ...r, lines: [] }
              : r.id === 'REQ-2026-1842'
                ? { ...r, lines: [{ name: '  ', description: 'Unnamed line', qty: 1 }, ...r.lines] }
                : r,
          );
        },
      };
    case 'failing':
      return { ...seeded, list: fail };
    case 'changes':
    case 'changes-reload-fails': {
      const approved = new Map<string, EmployeeRequest>();
      let refused = false;
      return {
        async list(user) {
          if (refused && mode === 'changes-reload-fails') return fail();
          return (await seeded.list(user)).map((r) => approved.get(r.id) ?? r);
        },
        async cancel(user, id) {
          const request = (await seeded.list(user)).find((r) => r.id === id);
          if (!request) return { ok: false, refusal: 'unavailable' };
          approved.set(id, { ...request, status: 'Approved', approvedAt: new Date().toISOString() });
          refused = true;
          return { ok: false, refusal: 'status-changed' };
        },
      };
    }
    case 'refresh-fails': {
      let cancelled = false;
      return {
        list(user) {
          return cancelled ? fail() : seeded.list(user);
        },
        async cancel(user, id, reason) {
          const result = await seeded.cancel(user, id, reason);
          if (result.ok) cancelled = true;
          return result;
        },
      };
    }
    default:
      return null;
  }
}
