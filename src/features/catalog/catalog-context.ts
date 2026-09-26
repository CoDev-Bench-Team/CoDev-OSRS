import { createContext, use } from 'react';
import type { CatalogItem } from './types';

/** The four outcomes FR-011 requires the page to tell apart. An empty catalog
 *  and an unreachable one are different states, never the same blank grid. */
export type CatalogRead =
  | { status: 'loading' }
  | { status: 'ready'; items: CatalogItem[] }
  | { status: 'failed' };

export type CatalogState = CatalogRead & {
  /** Re-reads the same office, in every state: the retry after a failure, and
   *  the re-read after a submit has moved stock (spec 011 FR-011). A reload
   *  while `loading` drops the read in flight, which may have started before
   *  the stock moved, and starts a fresh one. */
  reload: () => void;
};

export const CatalogContext = createContext<CatalogState>({ status: 'loading', reload: () => {} });

export function useCatalog(): CatalogState {
  return use(CatalogContext);
}
