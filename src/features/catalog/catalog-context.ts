import { createContext, use } from 'react';
import type { CatalogItem } from './types';

/** The four outcomes FR-011 requires the page to tell apart. An empty catalog
 *  and an unreachable one are different states, never the same blank grid. */
export type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; items: CatalogItem[] }
  | { status: 'failed'; retry: () => void };

export const CatalogContext = createContext<CatalogState>({ status: 'loading' });

export function useCatalog(): CatalogState {
  return use(CatalogContext);
}
