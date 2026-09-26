import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Button, ErrorBoundary, TopBar, type NavItem } from '../shared/ui';
import { navigationFor } from '../features/auth/navigation';
import { useSession } from '../features/auth/session-context';
import { ROLE_LABEL } from '../features/auth/types';
import { canRoleReach, DESTINATIONS, landingPath, SIGN_IN_PATH } from './destinations';
import { NavButton } from './NavButton';
import { useRequestList } from '../features/requests/create/request-draft';
import { useRequestListCount } from './request-list-count';

/** The persistent chrome every signed-in destination lives inside (FR-014).
 *
 *  One bar, on every screen: the product lockup, the navigation for the
 *  signed-in role, and the account cluster naming who is signed in and in what
 *  role. The Employee's request-list marker and its count are the only part
 *  that varies by role (FR-015).
 *
 *  There is no role switcher anywhere in here, by design (D5, FR-005).
 *  Changing role means signing out and signing in, which is also what makes the
 *  demo exercise the real sign-in path. */
export function AppLayout() {
  const { session, signOut } = useSession();
  const { count, notificationCount } = useRequestListCount();
  const { openList, closeList } = useRequestList();
  const location = useLocation();
  const navigate = useNavigate();

  // Exactly one item is current (FR-014). `startsWith` so a nested address —
  // /requests/REQ-2026-1847 — still marks My Requests, but only on a path
  // boundary, so /requests never lights up /request-something-else.
  const isCurrent = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  // FR-017b: a role that changes mid-session re-evaluates. Navigation derives
  // from `role` on every render, so it follows on its own; what needs saying is
  // what happens to someone standing on a screen their NEW role may not use.
  // They are moved to one it permits rather than left facing a refusal they did
  // nothing to earn.
  //
  // This is the only navigation in the shell that a guard does not perform, and
  // it cannot loop: it fires on a role TRANSITION, and a landing destination is
  // always reachable by the role that owns it.
  const lastRole = useRef(session?.role);
  useEffect(() => {
    const role = session?.role;
    if (!role || lastRole.current === role) return;
    lastRole.current = role;
    if (!canRoleReach(role, location.pathname)) void navigate(landingPath(role), { replace: true });
  }, [session?.role, location.pathname, navigate]);

  // Spec 010 FR-006a: the drawer opens only from the marker. Its open flag
  // lives above the routes, so leaving the Catalog by any path — browser Back
  // included, which never passes through the drawer's own close — must clear
  // it, or the next visit would open the drawer by itself. Keyed to the
  // TRANSITION off the Catalog, not to being elsewhere: the marker pressed on
  // another screen opens the list before the Catalog has mounted, and that
  // open must survive. (Not an unmount cleanup in the Catalog: StrictMode's
  // rehearsal unmount would close the list the marker had just opened.)
  // Leaving mid-submit closes the drawer too; the submit still lands, and the
  // session list holds its confirmation for the next open (D7).
  const onCatalog = isCurrent(DESTINATIONS.catalog.path);
  const wasOnCatalog = useRef(onCatalog);
  useEffect(() => {
    if (wasOnCatalog.current && !onCatalog) closeList();
    wasOnCatalog.current = onCatalog;
  }, [onCatalog, closeList]);

  if (!session) return null; // RequireAccess resolves this; belt and braces.

  const { user, role } = session;

  const nav: NavItem[] = navigationFor(role).map((destination) => ({
    label: destination.navLabel,
    href: destination.path,
    current: isCurrent(destination.path),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <TopBar
        nav={nav}
        onNavigate={(href, event) => {
          event.preventDefault();
          void navigate(href);
        }}
        user={{ name: user.name, role: ROLE_LABEL[role], initials: user.initials, color: user.avatarColor }}
        // FR-015: employees only. `undefined` removes the marker entirely for
        // the other two roles rather than showing them a zero.
        requestListCount={role === 'employee' ? count : undefined}
        // The marker is the only way into the Request List drawer, which sits
        // over the Catalog (spec 010 FR-006a, D3). From anywhere else it goes
        // to the Catalog first; the list itself lives for the session.
        onOpenRequestList={() => {
          if (!onCatalog) void navigate(DESTINATIONS.catalog.path);
          openList();
        }}
        // The 2026-09-15 export puts a notification marker in both bars, with a
        // count on the Admin one. It is a marker, not a control: the file draws
        // no panel for it to open, so it announces a count and does nothing —
        // better than a button that goes nowhere. See the drift document.
        notifications
        notificationCount={role === 'employee' ? undefined : notificationCount}
        // Profile left the navigation in that same export; the account cluster
        // is how the file's Profile screen is reached (FR-006, amended).
        onOpenAccount={() => void navigate(DESTINATIONS.profile.path)}
        actions={
          // Sign-out is not drawn anywhere in the design file; its placement in
          // the account cluster is an addition (docs/design-system/additions.md).
          // History is REPLACED so back cannot restore a signed-in screen
          // (FR-016).
          <Button
            variant="ghost"
            onClick={() => {
              void signOut().then(() => navigate(SIGN_IN_PATH, { replace: true }));
            }}
          >
            Sign Out
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-layout-page-width flex-1 flex-col px-layout-gutter">
        {/* FR-019: a screen that throws loses itself, not the shell. Keyed by
            address, so navigating away clears the failure. */}
        <ErrorBoundary
          key={location.pathname}
          action={<NavButton to={landingPath(role)} variant="ghost">{`Go to ${navigationFor(role)[0].navLabel}`}</NavButton>}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
