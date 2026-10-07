import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Button, ErrorBoundary, TopBar, type NavItem } from '../shared/ui';
import { navigationFor } from '../features/auth/navigation';
import { useSession } from '../features/auth/session-context';
import { ROLE_LABEL } from '../features/auth/types';
import { canRoleReach, destinationFor, DESTINATIONS, landingPath, SIGN_IN_PATH } from './destinations';
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
  const { status, session, signOut } = useSession();
  const { count } = useRequestListCount();
  const { openList, closeList } = useRequestList();
  const location = useLocation();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState<string | null>(null);

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
    // The first role the session resolves to is not a change: the shell
    // mounts while the session is still unknown, and an address that role may
    // not use gets the guard's refusal, not a silent redirect (FR-011).
    const first = lastRole.current === undefined;
    lastRole.current = role;
    if (first) return;
    if (!canRoleReach(role, location.pathname)) void navigate(landingPath(role), { replace: true });
  }, [session?.role, location.pathname, navigate]);

  // Spec 011 FR-006a: the drawer opens only from the marker. Its open flag
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

  const pending = status === 'unknown';
  /** The screen the address shows: `/queue` and `/queue/:id` are one screen,
   *  as are `/requests` and `/requests/:id`, so opening or closing a panel
   *  neither remounts the list nor clears a failure. */
  const shownDestination = destinationFor(location.pathname)?.id;
  const screenKey =
    shownDestination === 'queueRequest'
      ? DESTINATIONS.queue.path
      : shownDestination === 'requestDetail'
        ? DESTINATIONS.requests.path
        : location.pathname;
  if (!session && !pending) return null; // RequireAccess resolves this; belt and braces.

  // The session is still resolving: the chrome stands where it will, with who
  // is signed in drawn as skeletons. The navigation is drawn only when the
  // address names the role; otherwise (`/`) it is left out until the session
  // lands and `/` resolves to the role's home, the Requests Queue for an
  // Admin. The screen renders beneath it and holds its reads
  // until the session is known (FR-018). Only the bar differs between the two
  // states; `main` and the screen inside it stay mounted when the session
  // arrives, so nothing is drawn twice.
  let bar: ReactNode;
  if (!session) {
    const destination = destinationFor(location.pathname);
    const owner = destination?.roles.length === 1 ? destination.roles[0] : undefined;
    bar = (
      <div inert>
        <TopBar
          nav={
            owner
              ? navigationFor(owner).map((d) => ({ label: d.navLabel, href: d.path, current: isCurrent(d.path) }))
              : []
          }
          user="pending"
        />
      </div>
    );
  } else {
    const { user, role } = session;
    const nav: NavItem[] = navigationFor(role).map((destination) => ({
      label: destination.navLabel,
      href: destination.path,
      current: isCurrent(destination.path),
    }));
    bar = (
      <TopBar
        nav={nav}
        onNavigate={(href, event) => {
          event.preventDefault();
          void navigate(href);
        }}
        user={{
          name: user.name?.trim() ? user.name : ROLE_LABEL[role],
          role: ROLE_LABEL[role],
          initials: user.name?.trim() ? user.initials : '',
          color: user.avatarColor,
        }}
        // FR-015: employees only. `undefined` removes the marker entirely for
        // the other two roles rather than showing them a zero.
        requestListCount={role === 'employee' ? count : undefined}
        // The marker is the only way into the Request List drawer, which sits
        // over the Catalog (spec 011 FR-006a, D3). From anywhere else it goes
        // to the Catalog first; the list itself lives for the session.
        onOpenRequestList={() => {
          if (!onCatalog) void navigate(DESTINATIONS.catalog.path);
          openList();
        }}
        // No notification marker: the 2026-09-15 export draws a bell, but it
        // had nothing to open, so it was taken out (spec 003 FR-014, amended
        // 2026-10-06).
        // Profile left the navigation in that same export; the account cluster
        // is how the file's Profile screen is reached (FR-006, amended).
        onOpenAccount={() => void navigate(DESTINATIONS.profile.path)}
        actions={
          // Sign-out is not drawn anywhere in the design file; its placement in
          // the account cluster is an addition (docs/design-system/additions.md).
          // History is REPLACED so back cannot restore a signed-in screen
          // (FR-016).
          <div className="flex flex-col items-end gap-4">
            {signOutError ? (
              <p role="alert" className="max-w-xs text-right type-body text-red-error">
                {signOutError}
              </p>
            ) : null}
            <Button
              variant="ghost"
              onClick={() => {
                setSignOutError(null);
                void signOut()
                  .then(() => navigate(SIGN_IN_PATH, { replace: true }))
                  .catch((error: unknown) => {
                    setSignOutError(
                      error instanceof Error ? error.message : 'Sign-out did not succeed. Please try again.',
                    );
                  });
              }}
            >
              Sign Out
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      {bar}

      <main className="mx-auto flex w-full max-w-layout-page-width flex-1 flex-col px-layout-gutter">
        {/* FR-019: a screen that throws loses itself, not the shell. Keyed by
            address, so navigating away clears the failure. */}
        <ErrorBoundary
          key={screenKey}
          action={
            session ? (
              <NavButton to={landingPath(session.role)} variant="ghost">{`Go to ${navigationFor(session.role)[0].navLabel}`}</NavButton>
            ) : undefined
          }
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
