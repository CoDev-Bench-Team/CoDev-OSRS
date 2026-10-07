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
  | 'queueRequest'
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
  /** The subtitle the screen's frame draws, where it differs from `purpose`. */
  subtitle?: string;
  /** Roles permitted to reach the address at all. */
  roles: readonly Role[];
};

export const DESTINATIONS: Record<DestinationId, Destination> = {
  catalog: {
    id: 'catalog',
    path: '/catalog',
    navLabel: 'Catalog',
    title: 'Supply Catalog',
    purpose: 'Browse available equipment and office essentials',
    /** `02 - Catalog` draws two sentences (spec 005 D9). */
    subtitle: 'Browse available equipment and office essentials. Inventory updates in real time.',
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
  /** A deep link, not a screen: it opens the request's panel over the list the
   *  role works from — the review panel on `/queue` for an Admin, the request
   *  panel on `/requests` for its owning Employee (spec 003, Session
   *  2026-09-26). Listed so the link survives sign-in (FR-013). It is in no
   *  navigation set. */
  requestDetail: {
    id: 'requestDetail',
    path: '/requests/:id',
    navLabel: 'Request',
    title: 'Request',
    purpose: 'Open one request in its panel',
    roles: ROLES,
  },
  queue: {
    id: 'queue',
    path: '/queue',
    navLabel: 'Requests Queue',
    title: 'Requests Queue',
    purpose: 'Review, approve, and fulfill supply requests',
    roles: ['admin'],
  },
  /** One request's review panel over the queue: the address an email's
   *  *View request* reaches for an Admin, `/requests/:id` redirecting here
   *  (spec 008 FR-001b). The Requests Queue renders it; it is not in the
   *  navigation. */
  queueRequest: {
    id: 'queueRequest',
    path: '/queue/:id',
    navLabel: 'Request',
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
    subtitle: 'Assigned and available units',
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
    /** `04 - History`'s drawn subheading (spec 013 Story 1). */
    purpose: 'Full audit trail — completed, cancelled, and rejected requests',
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

/** The subtitle a screen's header shows: the drawn one, else its purpose. */
export function pageSubtitle(destination: Destination): string {
  return destination.subtitle ?? destination.purpose;
}

/** `/queue/:id` for a request id. */
export function queueRequestPath(id: string): string {
  return `${DESTINATIONS.queue.path}/${encodeURIComponent(id)}`;
}

/** `/requests/:id` for a request id: the Employee's panel over My Requests. */
export function requestPath(id: string): string {
  return `${DESTINATIONS.requests.path}/${encodeURIComponent(id)}`;
}
