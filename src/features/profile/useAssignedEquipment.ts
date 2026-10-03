import { useEffect, useState } from 'react';
import type { AssignedItem } from './assigned-source';
import { apiAssignedSource } from './api-assigned-source';

/** Spec 006 FR-007 and FR-011, one branch per state:
 *
 *  - `unavailable` — no source (state c); the section renders nothing
 *  - `loading`     — a source exists and has not answered
 *  - `failed`      — the source rejected; never shown as the empty state
 *  - `loaded`      — `items` empty is state (b), non-empty is state (a) */
export type AssignedEquipmentState =
  | { kind: 'unavailable' }
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; items: AssignedItem[] };

/** Loads the signed-in user's assigned equipment from the API (spec 017
 *  Story 6).
 *
 *  The caller keys the component by user id, so a different user always
 *  starts from a fresh state and never shows the previous rows (FR-006).
 *  Within one mount, a response that lands after the effect was torn down is
 *  dropped. */
export function useAssignedEquipment(userId: string | null): AssignedEquipmentState {
  const [state, setState] = useState<AssignedEquipmentState>({ kind: 'loading' });

  useEffect(() => {
    // No user yet: the session is still resolving, and the section stays in
    // its skeleton.
    if (!userId) return;
    let live = true;
    void (async () => {
      try {
        const items = await apiAssignedSource(userId).assignedToMe();
        if (live) setState({ kind: 'loaded', items });
      } catch (error) {
        // The page says only that it failed. The reason is not logged: the
        // response can carry a unit's secrets (contracts G3).
        void error;
        if (live) setState({ kind: 'failed' });
      }
    })();
    return () => {
      live = false;
    };
  }, [userId]);

  return state;
}
