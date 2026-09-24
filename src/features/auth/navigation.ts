import { DESTINATIONS, type Destination, type DestinationId } from '../../app/destinations';
import type { Role } from './types';

/** FR-006 / D1: navigation is DERIVED per role and never hand-maintained per
 *  screen.
 *
 *  Two sets, and both are the bars the 2026-09-22 design file draws — nothing
 *  here is invented any more. The three-set split that overrode the file's
 *  merged "Admin" bar is withdrawn with constitution 3.0.0 II (ADR-0005).
 *
 *  Order is the drawn order: the role's own work first, then what it consults.
 *  Profile is not a navigation item — the account cluster is the way in. The
 *  Admin may still open the catalog by address (ARCHITECT.md §7), but the drawn
 *  Admin bar does not offer it.
 *
 *  A pure function over a constant table, so SC-001's navigation half is
 *  assertable without rendering anything. */
const NAVIGATION: Record<Role, readonly DestinationId[]> = {
  employee: ['catalog', 'requests'],
  admin: ['queue', 'assets', 'inventory', 'history'],
};

export function navigationFor(role: Role): readonly Destination[] {
  return NAVIGATION[role].map((id) => DESTINATIONS[id]);
}

/** Exported so a check can assert the sets without importing the map itself. */
export function navigationLabelsFor(role: Role): readonly string[] {
  return navigationFor(role).map((d) => d.navLabel);
}
