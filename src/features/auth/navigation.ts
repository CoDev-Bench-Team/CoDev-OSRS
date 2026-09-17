import { DESTINATIONS, type Destination, type DestinationId } from '../../app/destinations';
import type { Role } from './types';

/** FR-006 / D1: navigation is DERIVED from the authorization matrix in
 *  ARCHITECT.md §7, per role, and never hand-maintained per screen.
 *
 *  Three sets, not the design file's two. The file merges Approver and Supply
 *  Admin into a single "Admin" identity, which constitution II forbids, so the
 *  Approver and Supply Admin sets are new design — flagged to the designer in
 *  spec 003's Known Gaps.
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
};

export function navigationFor(role: Role): readonly Destination[] {
  return NAVIGATION[role].map((id) => DESTINATIONS[id]);
}

/** Exported so a check can assert the sets without importing the map itself. */
export function navigationLabelsFor(role: Role): readonly string[] {
  return navigationFor(role).map((d) => d.navLabel);
}
