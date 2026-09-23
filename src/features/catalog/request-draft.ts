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
 *  here — `docs/process-flow.md` and constitution III.
 *
 *  Adding an item that is already in the list is expected to MERGE into its
 *  existing line — one line per asset, quantities summed and capped at
 *  Available — not to open a second line. The card and the View Specs panel
 *  both call `add`, and the panel stays open after an add, so the same item
 *  can arrive more than once. The interim provider only counts calls; Parent C
 *  (BEN-43) owns the real list and this rule. */
export type RequestListDraft = {
  add(item: CatalogItem, quantity: number): void;
};

export const RequestListDraftContext = createContext<RequestListDraft>({ add: () => {} });

export function useRequestListDraft(): RequestListDraft {
  return use(RequestListDraftContext);
}
