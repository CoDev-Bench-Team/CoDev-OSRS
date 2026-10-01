import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetSource } from './asset-source';
import { seededAssetSource } from './seeded-asset-source';
import type { Asset, AssetDraft } from './types';

/** The active source. Seeded until the contract publishes the unit counts
 *  (spec 014 D1); a contract-backed source replaces this one line. */
const source: AssetSource = seededAssetSource;

export type AssetsState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  /** `stale`: a save went through but the reload after it failed, so apart
   *  from the saved asset the list may be out of date. */
  | { kind: 'loaded'; assets: Asset[]; stale?: boolean };

/** Loads every asset and exposes the two mutations. A mutation resolves with
 *  the saved asset after the list has been reloaded, or rejects with whatever
 *  the source rejected with — a `ValidationProblem` the form maps to fields.
 *  If only the reload fails, the mutation still resolves (the save stands): the
 *  list already on screen stays, with the saved asset written into it so View
 *  and Update read what was saved, and is marked stale, as the Requests Queue
 *  keeps its snapshot. */
export function useAssets() {
  const [state, setState] = useState<AssetsState>({ kind: 'loading' });

  // A response that lands after unmount is dropped.
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  /** `saved`: the asset a save just returned, kept on screen if the reload
   *  fails. A failed reload never replaces a list already loaded. */
  const load = useCallback(
    (saved?: Asset) =>
      source.list().then(
        (assets) => {
          if (live.current) setState({ kind: 'loaded', assets });
        },
        (error: unknown) => {
          console.error(saved ? '[assets] saved, but the list could not be reloaded' : '[assets] could not be loaded', error);
          if (!live.current) return;
          setState((s) => {
            if (s.kind !== 'loaded') return { kind: 'failed' };
            if (!saved) return s;
            const known = s.assets.some((a) => a.id === saved.id);
            const assets = known ? s.assets.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...s.assets];
            return { kind: 'loaded', assets, stale: true };
          });
        },
      ),
    [],
  );

  const reload = useCallback(() => load(), [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const after = useCallback(
    async (saving: Promise<Asset>) => {
      const saved = await saving;
      await load(saved);
      return saved;
    },
    [load],
  );

  return {
    state,
    reload,
    create: useCallback((draft: AssetDraft) => after(source.create(draft)), [after]),
    update: useCallback((id: string, draft: AssetDraft) => after(source.update(id, draft)), [after]),
  };
}
