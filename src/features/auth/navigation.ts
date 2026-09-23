import { DESTINATIONS, type Destination, type DestinationId } from '../../app/destinations';
import type { Role } from './types';

/** FR-006 / D1: navigation is DERIVED from the authorization matrix in
 *  ARCHITECT.md §7, per role, and never hand-maintained per screen.
 *
 *  Four sets. The design file draws two — Employee, and a merged "Admin" — and
 *  the published contract issues exactly those two, so `admin` is the bar the
 *  file drew. The separate `approver` and `supply_admin` sets remain new design
 *  (flagged to the designer in spec 003's Known Gaps); they are not issued by
 *  the contract and are exercised only by the seeded demo source, which is what
 *  lets each pipeline stage be demonstrated on its own.
 *
 *  Order is the order each role works in: their own queue first, then what they
 *  consult.
 *
 *  Amended 2026-09-15 from the design re-export: **Profile is no longer a
 *  navigation item** — the file's Profile screen shows no current item, and the
 *  account cluster is the way in — and **History joins the Admin bar**, which
 *  under the three-role split means the Approver's and the Supply Admin's.
 *  Catalog stays for all three, which the file's merged Admin bar omits: the
 *  authorization matrix in ARCHITECT.md §7 gives every role the catalog, and
 *  D1 already overrides that bar.
 *
 *  A pure function over a constant table, so SC-001's navigation half is
 *  assertable without rendering anything. */
const NAVIGATION: Record<Role, readonly DestinationId[]> = {
  employee: ['catalog', 'requests'],
  approver: ['approvals', 'history', 'catalog'],
  supply_admin: ['fulfillment', 'inventory', 'history', 'catalog'],
  // The contract's admin: the union of the two, in pipeline order — decide,
  // then prepare and release, then the stock behind it. This is the bar the
  // design file actually drew, before D1 split it (see the note above).
  admin: ['approvals', 'fulfillment', 'inventory', 'history', 'catalog'],
};

export function navigationFor(role: Role): readonly Destination[] {
  return NAVIGATION[role].map((id) => DESTINATIONS[id]);
}

/** Exported so a check can assert the sets without importing the map itself. */
export function navigationLabelsFor(role: Role): readonly string[] {
  return navigationFor(role).map((d) => d.navLabel);
}
