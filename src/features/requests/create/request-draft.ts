import { createContext, use } from 'react';
import type { CatalogItem } from '../../catalog/types';
import type { EmployeeRequest } from '../detail/request-detail-types';
import { NO_PROBLEMS, type PlacedProblems } from './place-problems';
import type { RequestListLine } from './request-list-types';

/** The seam between the Catalog (spec 005) and the Request List (spec 010).
 *
 *  The catalog's job ends at "the Employee chose this item and this quantity",
 *  so the card and the View Specs panel see one method, `add`, and nothing
 *  else. Adding reserves nothing: stock moves on submit, not here
 *  (`docs/process-flow.md`, constitution III).
 *
 *  An add for an asset already in the list MERGES into its line — quantities
 *  summed, capped at the item's Available — rather than opening a second line
 *  (spec 010 FR-002). */
export type RequestListDraft = {
  add(item: CatalogItem, quantity: number): void;
};

/** Everything the drawer and the shell need from the list. */
export type RequestList = RequestListDraft & {
  lines: readonly RequestListLine[];
  note: string;
  setNote(note: string): void;
  /** Steps a line. Never below 1, and never raised above Available — but a
   *  line already above a fresher Available is not lowered (FR-003). */
  setQuantity(assetId: string, quantity: number): void;
  remove(assetId: string): void;
  /** Records a fresh read of Available at the Employee's office. An asset the
   *  read no longer lists has none (FR-006b, D6). */
  refreshAvailability(available: ReadonlyMap<string, number>): void;
  /** The drawer opens only from the top-bar marker (FR-006a, D3). */
  isOpen: boolean;
  openList(): void;
  closeList(): void;
  /** Claims the session's one submit slot, returning a ticket; `null` while a
   *  submit is already in flight, from this drawer or an earlier one (FR-010).
   *  Starting a submit clears the last refusal. `sent` is what this submit
   *  carries, so its success removes exactly that. Every ticket MUST be handed
   *  back to `endSubmit` once the system has answered. */
  beginSubmit(sent: SubmittedDraft): SubmitTicket | null;
  /** Settles the ticket's submit. `created` takes the submitted quantities out
   *  of the list — lines added while it was in flight stay — and clears the
   *  note if it is still the one sent (FR-011, D18), and holds the request as `submitted`; `problems` holds the
   *  refusal, placed field by field (FR-013–FR-015). Either way the outcome is
   *  held whether or not a drawer is mounted (D7). A ticket from before the
   *  signed-in user changed is a no-op: its outcome belongs to nobody here. */
  endSubmit(ticket: SubmitTicket, outcome: { created: EmployeeRequest } | { problems: PlacedProblems }): void;
  /** A submit is in flight (FR-010a). */
  submitting: boolean;
  /** The request the last submit created, until the Employee closes its
   *  confirmation (FR-012, D7). Held for the session, so a drawer closed by
   *  leaving the Catalog mid-submit still shows it on the next open. */
  submitted: EmployeeRequest | null;
  dismissSubmitted(): void;
  /** The last submit's refusal, until a new submit starts, a submit succeeds,
   *  the user changes, or the Employee edits the field it names. Closing the
   *  drawer keeps it, so a refusal that lands while no drawer is mounted is
   *  shown on the next open (Story 4 AC5, D7). */
  problems: PlacedProblems;
  /** Counts refusals, so the drawer moves focus once per refusal, not per
   *  edit. */
  refusals: number;
  /** Counts successful submits, so the Catalog mounted when one lands re-reads
   *  the stock it moved (FR-011, D18) — whether or not a drawer is open. */
  submissions: number;
  /** Clears messages as the Employee edits what they name. */
  editProblems(update: (problems: PlacedProblems) => PlacedProblems): void;
};

/** Which submit an answer belongs to (FR-010). Opaque to the drawer. */
export type SubmitTicket = number;

/** The lines and the note as they were when a submit started. */
export type SubmittedDraft = {
  lines: readonly { assetId: string; quantity: number }[];
  note: string;
};

const noop = () => {};

export const RequestListContext = createContext<RequestList>({
  add: noop,
  lines: [],
  note: '',
  setNote: noop,
  setQuantity: noop,
  remove: noop,
  refreshAvailability: noop,
  isOpen: false,
  openList: noop,
  closeList: noop,
  beginSubmit: () => null,
  endSubmit: noop,
  submitting: false,
  submitted: null,
  dismissSubmitted: noop,
  problems: NO_PROBLEMS,
  refusals: 0,
  submissions: 0,
  editProblems: noop,
});

export function useRequestList(): RequestList {
  return use(RequestListContext);
}

/** The Catalog's narrow view of the list. */
export function useRequestListDraft(): RequestListDraft {
  return use(RequestListContext);
}
