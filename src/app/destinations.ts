import { matchPath } from 'react-router';
import { ROLES, type Role } from '../features/auth/types';

/** The destination set — spec 003's table, in one place.
 *
 *  The route map, the role navigation and the post-sign-in return all read
 *  THIS, so a destination's address and the roles permitted to reach it cannot
 *  drift apart (FR-006, FR-010). Adding a screen means adding a row here.
 *
 *  Copy follows docs/design-system/content-conventions.md: nav items are Title
 *  Case, page titles sentence case, subtitles one sentence with no period. The
 *  titles the design file draws are used verbatim.
 *
 *  `history` arrived with the 2026-09-15 design export, which puts it in the
 *  Admin bar and draws the screen: resolved requests across all requestors,
 *  with a REQUESTER column and a RESOLVED date. Under the three-role split
 *  (D1) that is the Approver's and the Supply Admin's, never the Employee's —
 *  an Employee's own history is My Requests. */

export type DestinationId =
  | 'catalog'
  | 'requests'
  | 'requestDetail'
  | 'approvals'
  | 'fulfillment'
  | 'inventory'
  | 'history'
  | 'profile';

export type Destination = {
  id: DestinationId;
  /** Route path, relative to the application root. May carry parameters. */
  path: string;
  /** Title Case, for the top bar. */
  navLabel: string;
  /** Sentence case, for the screen itself. */
  title: string;
  /** One sentence, no period. */
  purpose: string;
  /** Roles permitted to reach the address at all. An Employee reaches
   *  `/requests/:id` only for their own requests; that decision needs a request
   *  before it can be made, so it lives on the screen (FR-012a), not here. */
  roles: readonly Role[];
};

export const DESTINATIONS: Record<DestinationId, Destination> = {
  catalog: {
    id: 'catalog',
    path: '/catalog',
    navLabel: 'Catalog',
    title: 'Supply Catalog',
    purpose: 'Browse available equipment and office essentials',
    roles: ROLES,
  },
  requests: {
    id: 'requests',
    path: '/requests',
    navLabel: 'My Requests',
    title: 'My Requests',
    purpose: 'Track every request you have submitted and its current status',
    roles: ['employee'],
  },
  requestDetail: {
    id: 'requestDetail',
    path: '/requests/:id',
    navLabel: 'Request',
    title: 'Request detail',
    purpose: 'Everything recorded about one request',
    roles: ROLES,
  },
  approvals: {
    id: 'approvals',
    path: '/approvals',
    navLabel: 'Requests Queue',
    title: 'Requests Queue',
    purpose: 'Review and decide on pending supply requests',
    roles: ['approver'],
  },
  fulfillment: {
    id: 'fulfillment',
    path: '/fulfillment',
    navLabel: 'Fulfillment',
    title: 'Fulfillment queue',
    purpose: 'Prepare and release approved requests',
    roles: ['supply_admin'],
  },
  inventory: {
    id: 'inventory',
    path: '/inventory',
    navLabel: 'Inventory',
    title: 'Inventory management',
    purpose: 'Monitor stock levels, manage reservations, and keep office essentials ready for every team',
    roles: ['supply_admin'],
  },
  history: {
    id: 'history',
    path: '/history',
    navLabel: 'History',
    title: 'History',
    purpose: 'Every resolved request — completed, rejected and cancelled — across all requestors',
    roles: ['approver', 'supply_admin'],
  },
  profile: {
    id: 'profile',
    path: '/profile',
    navLabel: 'Profile',
    title: 'Profile',
    purpose: 'Your details and currently assigned supplies',
    roles: ROLES,
  },
};

export const SIGN_IN_PATH = '/login';

/** FR-007. Each role starts where its job starts. */
export const LANDING: Record<Role, DestinationId> = {
  employee: 'catalog',
  approver: 'approvals',
  supply_admin: 'fulfillment',
};

export function landingPath(role: Role): string {
  return DESTINATIONS[LANDING[role]].path;
}

export function landingDestination(role: Role): Destination {
  return DESTINATIONS[LANDING[role]];
}

/** Whether a role may reach an address at all — used to decide whether a
 *  visitor returning from sign-in goes to the destination they asked for or to
 *  their own landing screen (FR-013). An address matching no destination is not
 *  reachable by anyone, so a stale deep link cannot strand them on not-found. */
export function canRoleReach(role: Role, pathname: string): boolean {
  const destination = destinationFor(pathname);
  return !!destination && destination.roles.includes(role);
}

export function destinationFor(pathname: string): Destination | undefined {
  return Object.values(DESTINATIONS).find((d) => matchPath({ path: d.path, end: true }, pathname));
}
