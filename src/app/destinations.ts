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
 *  Addresses and owners follow the route table in ARCHITECT.md §7, which is
 *  the 2026-09-22 design export's: one Admin reviews, fulfils and owns Assets
 *  and Inventory (constitution 3.0.0 II, ADR-0005), so there is one queue —
 *  `/queue` — and no separate fulfilment destination. `history` is resolved
 *  requests across all requestors and is the Admin's; an Employee's own
 *  history is My Requests. */

export type DestinationId =
  | 'catalog'
  | 'requests'
  | 'requestDetail'
  | 'queue'
  | 'assets'
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
  /** Roles permitted to reach the address at all. `/requests/:id` is the
   *  Admin's only: an Employee's request detail is a side panel on My Requests
   *  with no address of its own (spec 003, 2026-09-23; Linear BEN-45). */
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
    purpose: 'Track every request from submission through pickup and completion',
    roles: ['employee'],
  },
  requestDetail: {
    id: 'requestDetail',
    path: '/requests/:id',
    navLabel: 'Request',
    title: 'Request detail',
    purpose: 'Everything recorded about one request',
    roles: ['admin'],
  },
  queue: {
    id: 'queue',
    path: '/queue',
    navLabel: 'Requests Queue',
    title: 'Requests Queue',
    purpose: 'Review, approve, and fulfill supply requests',
    roles: ['admin'],
  },
  assets: {
    id: 'assets',
    path: '/assets',
    navLabel: 'Assets',
    title: 'Assets',
    purpose: 'Deployed and available units',
    roles: ['admin'],
  },
  inventory: {
    id: 'inventory',
    path: '/inventory',
    navLabel: 'Inventory',
    title: 'Inventory',
    purpose: 'Monitor stock levels, manage reservations, and keep office essentials ready',
    roles: ['admin'],
  },
  history: {
    id: 'history',
    path: '/history',
    navLabel: 'History',
    title: 'History',
    purpose: 'Every resolved request — completed, rejected and cancelled — across all requestors',
    roles: ['admin'],
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
  admin: 'queue',
};

export function landingPath(role: Role): string {
  return DESTINATIONS[LANDING[role]].path;
}

export function landingDestination(role: Role): Destination {
  return DESTINATIONS[LANDING[role]];
}

/** The concrete request-detail address for one request, derived from the
 *  canonical `requestDetail` destination rather than restated by hand, so a
 *  caller's link cannot drift from the route map if the path ever changes. */
export function requestDetailPath(id: string): string {
  return DESTINATIONS.requestDetail.path.replace(':id', encodeURIComponent(id));
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
