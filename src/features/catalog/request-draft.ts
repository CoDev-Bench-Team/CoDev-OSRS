import { createContext, use } from 'react';
import type { CatalogItem } from './types';

/** The seam between this feature and Parent C (BEN-43).
 *
 *  The catalog's job ends at "the Employee chose this item and this quantity".
 *  The request list drawer, its line editing and submit belong to Parent C, so
 *  this exposes the narrowest thing that makes Story 3 demonstrable now and
 *  does not move when that feature lands: one method.
 *
 *  Adding to the draft does NOT change stock. Inventory moves on submit, not
 *  here — `docs/process-flow.md` and constitution III. */
export type RequestListDraft = {
  add(item: CatalogItem, quantity: number): void;
};

export const RequestListDraftContext = createContext<RequestListDraft>({ add: () => {} });

export function useRequestListDraft(): RequestListDraft {
  return use(RequestListDraftContext);
}
