import { useCallback, useEffect, useRef, useState } from 'react';
import type { InventorySource } from './inventory-source';
import type { UnitBatchDraft, UnitDetail, UnitDraft, UnitRow } from './types';

export type InventoryState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  /** `stale`: a save went through but the reload after it failed, so apart
   *  from the saved units the list may be out of date. */
  | { kind: 'loaded'; units: UnitRow[]; stale?: boolean };

/** A detail read back as a row, dropping the secrets: the list state never
 *  holds one (spec 015 FR-002). */
function toRow(unit: UnitDetail): UnitRow {
  const { id, assetId, itemName, model, category, pr, serialNumber, location, status, assignee, createdAt } = unit;
  return { id, assetId, itemName, model, category, pr, serialNumber, location, status, assignee, createdAt };
}

type Change = { saved: UnitRow[] } | { removed: string };

/** Loads every unit and exposes the saves, in the shape of Assets'
 *  `useAssets()` (spec 015 plan P10). A save resolves after the list has been
 *  reloaded, or rejects with whatever the source rejected with. If only the
 *  reload fails, the save still resolves: the list on screen stays, with the
 *  change written into it, and is marked stale.
 *
 *  Nothing is logged: a unit's secrets must never reach a console (FR-012).
 *
 *  `source` must be referentially stable; it is an effect dependency. */
const LOADING: InventoryState = { kind: 'loading' };

export function useInventory(source: InventorySource) {
  // The state is held with the source it came from, so a new source reads as
  // loading until its own list lands.
  const [held, setHeld] = useState<{ source: InventorySource; state: InventoryState }>({ source, state: LOADING });
  const state = held.source === source ? held.state : LOADING;
  const setState = useCallback(
    (next: InventoryState | ((s: InventoryState) => InventoryState)) =>
      setHeld((h) => {
        const prior = h.source === source ? h.state : LOADING;
        return { source, state: typeof next === 'function' ? next(prior) : next };
      }),
    [source],
  );

  // A response that lands after unmount is dropped.
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const load = useCallback(
    (change?: Change) =>
      source.list().then(
        (units) => {
          if (live.current) setState({ kind: 'loaded', units });
        },
        () => {
          if (!live.current) return;
          setState((s) => {
            if (s.kind !== 'loaded') return { kind: 'failed' };
            if (!change) return s;
            let units = s.units;
            if ('removed' in change) units = units.filter((u) => u.id !== change.removed);
            else {
              const saved = new Map(change.saved.map((u) => [u.id, u]));
              const known = units.map((u) => saved.get(u.id) ?? u);
              units = [...change.saved.filter((u) => !units.some((k) => k.id === u.id)), ...known];
            }
            return { kind: 'loaded', units, stale: true };
          });
        },
      ),
    [source, setState],
  );

  const reload = useCallback(() => {
    setState((s) => (s.kind === 'failed' ? { kind: 'loading' } : s));
    return load();
  }, [load, setState]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    state,
    reload,
    get: useCallback((id: string) => source.get(id), [source]),
    create: useCallback(
      async (draft: UnitDraft) => {
        const saved = await source.create(draft);
        await load({ saved: [toRow(saved)] });
        return saved;
      },
      [source, load],
    ),
    createBatch: useCallback(
      async (draft: UnitBatchDraft) => {
        const saved = await source.createBatch(draft);
        await load({ saved });
        return saved;
      },
      [source, load],
    ),
    update: useCallback(
      async (id: string, draft: UnitDraft) => {
        const saved = await source.update(id, draft);
        await load({ saved: [toRow(saved)] });
        return saved;
      },
      [source, load],
    ),
    remove: useCallback(
      async (id: string, reason: string) => {
        await source.remove(id, reason);
        await load({ removed: id });
      },
      [source, load],
    ),
  };
}
