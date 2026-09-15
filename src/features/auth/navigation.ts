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
 *  consult, then themselves.
 *
 *  A pure function over a constant table, so SC-001's navigation half is
 *  assertable without rendering anything. */
const NAVIGATION: Record<Role, readonly DestinationId[]> = {
  employee: ['catalog', 'requests', 'profile'],
  approver: ['approvals', 'catalog', 'profile'],
  supply_admin: ['fulfillment', 'inventory', 'catalog', 'profile'],
};

export function navigationFor(role: Role): readonly Destination[] {
  return NAVIGATION[role].map((id) => DESTINATIONS[id]);
}

/** Exported so a check can assert the sets without importing the map itself. */
export function navigationLabelsFor(role: Role): readonly string[] {
  return navigationFor(role).map((d) => d.navLabel);
}
