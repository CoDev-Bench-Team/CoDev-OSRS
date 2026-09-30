import type { AdminRequestSource, ReviewRequest, ReviewSnapshot } from '../../queue/review-types';
import { isResolved } from '../history-model';
import type { HistorySource } from '../history-source';

/** DEV-ONLY STUB. It is reached only through `history-source.ts`, behind
 *  `import.meta.env.DEV`, so a production build drops it.
 *
 *  `?history=<mode>` on `/history` reaches what the seed cannot:
 *
 *  - `failing`: every load fails, so the page shows its failure notice and
 *    **Try again** (spec 012 FR-012).
 *  - `recovers`: every load fails until `window.__recoverHistory()` is called,
 *    then succeeds, so **Try again** can be shown to reload (spec 012 FR-012).
 *    Not "fail once": StrictMode's second mount would load before the failure
 *    ever showed.
 *  - `slow`: the load is held until `window.__releaseHistory()` is called, so
 *    the loading state can be seen and checked.
 *  - `empty`: no request has been resolved yet; the table shows its empty state.
 *  - `no-reason`: the first Rejected and the first Cancelled request lose their
 *    stored reason, so the panel shows *No reason recorded* (spec 012 edge
 *    case). The seed always stores one, as constitution IV requires.
 *  - `received`: REQ-2026-1715 has been received, so the data set holds all
 *    eight statuses; `Received` is live and must stay off History (spec 012
 *    edge case, SC-001).
 *  - `no-resolved-date`: the first Completed request in the seed loses its completed time,
 *    so RESOLVED shows the em dash and it sorts last under both date orders
 *    (spec 012 plan R3).
 *
 *  Each mode builds its own seed, so a stubbed session never disturbs the
 *  shared one. */

declare global {
  interface Window {
    /** Set by `?history=slow` while a load is held. */
    __releaseHistory?: () => void;
    /** Set by `?history=recovers`; lets later loads succeed. */
    __recoverHistory?: () => void;
    __historyRecovered?: boolean;
  }
}

function mapped(fresh: () => AdminRequestSource, change: (requests: ReviewRequest[]) => ReviewRequest[]): HistorySource {
  const seeded = fresh();
  return {
    async load(): Promise<ReviewSnapshot> {
      const snapshot = await seeded.load();
      return { ...snapshot, requests: change([...snapshot.requests]) };
    },
  };
}

export function historyStub(mode: string | null, fresh: () => AdminRequestSource): HistorySource | null {
  switch (mode) {
    case 'failing':
      return {
        load: () => Promise.reject(new Error('history stub: load failed')),
      };
    case 'recovers': {
      // The flag lives on window, not in this closure: StrictMode builds the
      // source twice in development, and either copy may be the one in use.
      const seeded = fresh();
      window.__historyRecovered = false;
      window.__recoverHistory = () => {
        window.__historyRecovered = true;
      };
      return {
        load: () =>
          window.__historyRecovered ? seeded.load() : Promise.reject(new Error('history stub: not yet recovered')),
      };
    }
    case 'slow': {
      const seeded = fresh();
      return {
        load: () =>
          new Promise<void>((resolve) => {
            window.__releaseHistory = () => {
              window.__releaseHistory = undefined;
              resolve();
            };
          }).then(() => seeded.load()),
      };
    }
    case 'empty':
      return mapped(fresh, (requests) => requests.filter((request) => !isResolved(request)));
    case 'no-reason':
      // Decided per load, not once: StrictMode and Try Again both load again,
      // and each load must drop the same two reasons.
      return mapped(fresh, (requests) => {
        const rejected = requests.find((request) => request.status === 'Rejected');
        const cancelled = requests.find((request) => request.status === 'Cancelled');
        return requests.map((request) =>
          request === rejected
            ? { ...request, rejection: undefined }
            : request === cancelled
              ? { ...request, cancellation: undefined }
              : request,
        );
      });
    case 'received':
      return mapped(fresh, (requests) =>
        requests.map((request) =>
          request.id === 'REQ-2026-1715' ? { ...request, status: 'Received', receivedAt: '2026-08-09T02:00:00Z' } : request,
        ),
      );
    case 'no-resolved-date':
      return mapped(fresh, (requests) => {
        const completed = requests.find((request) => request.status === 'Completed');
        return requests.map((request) => (request === completed ? { ...request, completedAt: undefined } : request));
      });
    default:
      return null;
  }
}
