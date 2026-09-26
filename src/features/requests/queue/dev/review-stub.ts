import type { AdminRequestSource, TransitionResult } from '../review-types';

/** DEV-ONLY STUB. It is reached only through `admin-request-source.ts`, behind
 *  `import.meta.env.DEV`, so a production build drops it.
 *
 *  The seed never refuses for a changed status, never fails a transition, and
 *  never fails a reload. `?review=<mode>` on `/queue` reaches what it cannot:
 *
 *  - `changes`: another Admin approved the request first. Approve, reject and
 *    update-status are refused `status-changed`, and the reload shows the
 *    request `Approved` (or, if it already was, `For Delivery`) (spec 008
 *    FR-014).
 *  - `failing`: every transition fails outright. The status is unchanged and
 *    the form keeps its input (FR-014).
 *  - `reload-fails`: the transition goes through, then the reload fails. The
 *    panel stays open on the last snapshot and says so (plan D3).
 *
 *  Each mode builds its own seed, so a stubbed session never disturbs the
 *  shared one. */
export function reviewStub(mode: string | null, fresh: () => AdminRequestSource): AdminRequestSource | null {
  switch (mode) {
    case 'changes': {
      const seeded = fresh();
      // Moves the request one step on as "someone else", then refuses.
      const overtaken = async (id: string): Promise<TransitionResult> => {
        const request = (await seeded.load()).requests.find((r) => r.id === id);
        if (!request) return { ok: false, refusal: 'unavailable' };
        if (request.status === 'Pending Approval') await seeded.approve(id);
        else await seeded.updateStatus(id, 'For Delivery');
        return { ok: false, refusal: 'status-changed' };
      };
      return { ...seeded, approve: overtaken, reject: overtaken, updateStatus: overtaken };
    }
    case 'failing': {
      const seeded = fresh();
      const failed = async (): Promise<TransitionResult> => ({ ok: false, refusal: 'unavailable' });
      return { ...seeded, approve: failed, reject: failed, updateStatus: failed };
    }
    case 'reload-fails': {
      const seeded = fresh();
      let changed = false;
      const after =
        <A extends unknown[]>(run: (...args: A) => Promise<TransitionResult>) =>
        async (...args: A) => {
          const result = await run(...args);
          if (result.ok) changed = true;
          return result;
        };
      return {
        ...seeded,
        load: () => (changed ? Promise.reject(new Error('stubbed reload failure')) : seeded.load()),
        approve: after(seeded.approve),
        reject: after(seeded.reject),
        updateStatus: after(seeded.updateStatus),
      };
    }
    default:
      return null;
  }
}
