import { isRequestable } from './stock';
import type { CatalogItem, CatalogOffice } from './types';

/** What the request control says, or `null` when it is not offered at all. */
export type RequestAction = { label: string; enabled: boolean } | null;

/** The one place the request rules for a card are decided, shared by the card
 *  and its View Specs panel so the two can never disagree.
 *
 *  - Only an Employee is offered the control (FR-008, constitution II).
 *  - Only at their own office: the MVP does not request stock held at another
 *    office (spec 001 Out of Scope), so browsing elsewhere is read-only
 *    (spec 005 FR-014).
 *  - Never with nothing available (FR-009). */
export function requestAction(
  item: CatalogItem,
  office: CatalogOffice,
  role: string | undefined,
  homeOffice: CatalogOffice | undefined,
): RequestAction {
  if (role !== 'employee') return null;
  if (homeOffice !== undefined && office !== homeOffice) return { label: 'Your office only', enabled: false };
  if (!isRequestable(item)) return { label: 'Out of stock', enabled: false };
  return { label: 'Add to Request List', enabled: true };
}
