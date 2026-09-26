import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogRead } from './catalog-context';
import type { CatalogSource } from './catalog-source';
import type { CatalogOffice } from './types';

/** Resolves the catalog boundary into the page's state.
 *
 *  A rejection becomes `failed`, never an empty list: showing "no supplies are
 *  encoded" when the truth is "we could not reach the catalog" would present a
 *  stale reading as current, which spec 005's Story 4 AC3 forbids.
 *
 *  Changing the office re-reads the catalog and passes back through `loading`:
 *  the previous office's numbers are never shown under the new office's name.
 *  `reload` is the one re-read, whatever the state: the retry after a failure
 *  and the re-read after a submit. */
export function CatalogProvider({
  source,
  office,
  children,
}: {
  source: CatalogSource;
  office: CatalogOffice;
  children: ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const [state, setState] = useState<CatalogRead>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    source
      .items(office)
      .then((items) => {
        if (live) setState({ status: 'ready', items });
      })
      .catch(() => {
        if (live) setState({ status: 'failed' });
      });
    return () => {
      live = false;
    };
  }, [source, office, attempt]);

  const value = useMemo(() => ({ ...state, reload }), [state, reload]);
  return <CatalogContext value={value}>{children}</CatalogContext>;
}
