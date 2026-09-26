import { useEffect, useState } from 'react';
import type { AssignedItem } from './assigned-source';
import { resolveAssignedSource } from './assigned-source-registry';

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

/** Loads the signed-in user's assigned equipment.
 *
 *  The caller keys the component by user id and query, so a different user or
 *  a different stub mode always starts from a fresh state and never shows the
 *  previous rows (FR-006). Within one mount, a response that lands after the
 *  effect was torn down is dropped. */
export function useAssignedEquipment(search: string): AssignedEquipmentState {
  // Starts as `unavailable` so nothing renders while the source is resolved;
  // in production that resolution is `null` and nothing ever renders.
  const [state, setState] = useState<AssignedEquipmentState>({ kind: 'unavailable' });

  useEffect(() => {
    let live = true;
    void (async () => {
      // Resolution sits inside the same `try` as the load: a source that fails
      // to resolve is "could not find out", never "no source" (FR-008).
      try {
        const source = await resolveAssignedSource(search);
        if (!live) return;
        if (!source) {
          setState({ kind: 'unavailable' });
          return;
        }
        setState({ kind: 'loading' });
        const items = await source.assignedToMe();
        if (live) setState({ kind: 'loaded', items });
      } catch (error) {
        // The page says only that it failed; the console keeps the reason.
        console.error('[profile] assigned equipment could not be loaded', error);
        if (live) setState({ kind: 'failed' });
      }
    })();
    return () => {
      live = false;
    };
  }, [search]);

  return state;
}
