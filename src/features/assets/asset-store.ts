import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetSource } from './asset-source';
import { seededAssetSource } from './seeded-asset-source';
import type { Asset, AssetDraft, StockChange } from './types';

/** The active source. Seeded until the stock model is settled (spec 008 D1);
 *  a contract-backed source replaces this one line. */
const source: AssetSource = seededAssetSource;

export type AssetsState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; assets: Asset[] };

/** Loads every asset and exposes the three mutations. A mutation resolves with
 *  the saved asset after the list has been reloaded, or rejects with whatever
 *  the source rejected with — a `ValidationProblem` the form maps to fields. */
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

  const reload = useCallback(
    () =>
      source.list().then(
        (assets) => {
          if (live.current) setState({ kind: 'loaded', assets });
        },
        (error: unknown) => {
          console.error('[assets] could not be loaded', error);
          if (live.current) setState({ kind: 'failed' });
        },
      ),
    [],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const after = useCallback(
    async (saving: Promise<Asset>) => {
      const saved = await saving;
      await reload();
      return saved;
    },
    [reload],
  );

  return {
    state,
    reload,
    create: useCallback((draft: AssetDraft) => after(source.create(draft)), [after]),
    update: useCallback((id: string, draft: AssetDraft) => after(source.update(id, draft)), [after]),
    setStock: useCallback((id: string, change: StockChange) => after(source.setStock(id, change)), [after]),
  };
}
