import type { Role } from './session-source';

/** Navigation derived from a role, never hand-maintained per screen
 *  (spec 003 FR-006, D1).
 *
 *  The Supply Admin's set is the drawn admin bar, requested by the project
 *  owner on 2026-09-15: [Requests Queue, History, Inventory]. The Approver's
 *  and the Employee's have no drawn source and come from the authorization
 *  matrix in `ARCHITECT.md` §7; both are flagged to the designer in
 *  docs/design-system/additions.md.
 *
 *  Roles are still three and still distinct — a Supply Admin cannot approve and
 *  an Approver cannot encode stock, whatever either bar says. What changed is
 *  the label set on one bar, not the authorization behind it.
 *
 *  This is a pure function of role, so it is directly testable and cannot
 *  drift from what the guards allow.
 */
export type Destination = { label: string; path: string };

export const NAVIGATION: Record<Role, Destination[]> = {
  employee: [
    { label: 'Catalog', path: '/catalog' },
    { label: 'My Requests', path: '/requests' },
    { label: 'Profile', path: '/profile' },
  ],
  approver: [
    { label: 'Requests Queue', path: '/approvals' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Profile', path: '/profile' },
  ],
  // The drawn admin bar, verbatim (figma 88:22807): Requests Queue, History,
  // Inventory. Catalog and Profile stay *reachable* for this role — the
  // authorization matrix grants both — but the bar shows what the designer
  // drew. Navigation and authorization are separate questions, and only the
  // second one is the constitution's.
  supply_admin: [
    { label: 'Requests Queue', path: '/fulfillment' },
    { label: 'History', path: '/history' },
    { label: 'Inventory', path: '/inventory' },
  ],
};

/** Where each role lands after signing in (FR-007).
 *
 *  Spec 003 names the Supply Admin's landing destination as the fulfillment
 *  queue. That screen has no visual source — `DESIGN.md` §11 lists the missing
 *  prepare/release design as a known gap — and ships here as a placeholder, so
 *  the Supply Admin lands on Inventory, which is drawn and built. Move this
 *  back to `/fulfillment` when that screen exists. */
export const LANDING: Record<Role, string> = {
  employee: '/catalog',
  approver: '/approvals',
  supply_admin: '/inventory',
};

/** Which navigation item is current. A child address keeps its parent marked —
 *  the item drawer at `/inventory/new` is still Inventory (FR-014). */
export function isCurrent(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}
