import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogState } from './catalog-context';
import type { CatalogSource } from './catalog-source';

/** Resolves the catalog boundary into the page's state.
 *
 *  A rejection becomes `failed`, never an empty list: showing "no supplies are
 *  encoded" when the truth is "we could not reach the catalog" would present a
 *  stale reading as current, which spec 005's Story 4 AC3 forbids. */
export function CatalogProvider({ source, children }: { source: CatalogSource; children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    source
      .items()
      .then((items) => {
        if (live) setState({ status: 'ready', items });
      })
      .catch(() => {
        if (live) setState({ status: 'failed', retry });
      });
    return () => {
      live = false;
    };
  }, [source, attempt, retry]);

  const value = useMemo(() => state, [state]);
  return <CatalogContext value={value}>{children}</CatalogContext>;
}
