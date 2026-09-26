import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogState } from './catalog-context';
import type { CatalogSource } from './catalog-source';
import type { CatalogOffice } from './types';

/** Resolves the catalog boundary into the page's state.
 *
 *  A rejection becomes `failed`, never an empty list: showing "no supplies are
 *  encoded" when the truth is "we could not reach the catalog" would present a
 *  stale reading as current, which spec 005's Story 4 AC3 forbids.
 *
 *  Changing the office re-reads the catalog and passes back through `loading`:
 *  the previous office's numbers are never shown under the new office's name. */
export function CatalogProvider({
  source,
  office,
  children,
}: {
  source: CatalogSource;
  office: CatalogOffice;
  children: ReactNode;
}) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    source
      .items(office)
      .then((items) => {
        if (live) setState({ status: 'ready', items });
      })
      .catch(() => {
        if (live) setState({ status: 'failed', retry });
      });
    return () => {
      live = false;
    };
  }, [source, office, attempt, retry]);

  const value = useMemo(() => state, [state]);
  return <CatalogContext value={value}>{children}</CatalogContext>;
}
