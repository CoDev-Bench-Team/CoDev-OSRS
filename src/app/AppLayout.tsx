import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { LoadingState, TopBar, type NavItem } from '../shared/ui';
import { useSession } from '../features/auth/SessionProvider';
import { NAVIGATION, isCurrent } from '../features/auth/navigation';
import { ROLE_LABEL, type Role } from '../features/auth/session-source';

/** The avatar colours the source draws. It designs two identities — an orange
 *  Employee and a deep-green Supply Admin — so the Approver's is an addition,
 *  logged in docs/design-system/additions.md for ratification. */
const AVATAR_COLOR: Record<Role, string> = {
  employee: 'var(--color-osrs-avatar-orange)',
  approver: 'var(--color-osrs-gray-500)',
  supply_admin: 'var(--color-osrs-avatar-green)',
};

/** What the drawn bar shows. Replace with a real count when notifications land. */
const DRAWN_NOTIFICATION_COUNT = 3;

/** The persistent chrome every signed-in screen carries (spec 003 FR-014).
 *
 *  The bar is the only element on every screen, so if it is wrong every screen
 *  is wrong. For the Supply Admin it is the drawn `Top Navigation` component
 *  (figma 88:22807) verbatim — lockup, [Requests Queue, History, Inventory],
 *  the bell with its count, the divider, and the account cluster — at the
 *  project owner's request on 2026-09-15.
 *
 *  The bell's count is sample data, like the inventory screen's 238 and 1,250:
 *  notifications are sent by the API and this repo has no notification feature
 *  (FR-024), so the marker is presentational until one exists. The Employee's
 *  request-list marker (FR-015) takes the same slot for that role.
 *
 *  Sign-out is drawn nowhere in the source, so it sits inside the account
 *  cluster rather than beside it, keeping the bar's drawn silhouette (FR-016).
 */
export function AppLayout() {
  const { status, session, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // FR-018: while the session is undetermined the shell waits rather than
  // flashing the sign-in screen at someone who is already signed in.
  if (status === 'unknown') {
    return (
      <div className="min-h-dvh bg-surface-page">
        <LoadingState label="Checking your session" />
      </div>
    );
  }

  if (status === 'signed-out' || !session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  const nav: NavItem[] = NAVIGATION[session.role].map((d) => ({
    label: d.label,
    href: d.path,
    current: isCurrent(d.path, location.pathname),
    // A real href keeps middle-click and "open in new tab" working; the plain
    // left-click is intercepted so navigation stays client-side.
    onClick: (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      void navigate(d.path);
    },
  }));

  async function onSignOut() {
    await signOut();
    // Replace, so browser back cannot restore a signed-in screen (FR-016).
    void navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-page">
      <TopBar
        nav={nav}
        user={{
          name: session.user.name,
          role: ROLE_LABEL[session.role],
          initials: session.user.initials,
          color: AVATAR_COLOR[session.role],
        }}
        notificationCount={session.role === 'supply_admin' ? DRAWN_NOTIFICATION_COUNT : undefined}
        onSignOut={() => void onSignOut()}
      />
      {/* The drawn content column: 32px from the left edge, 1344px wide at the
          design width, which is where the frame puts the title and the table.
          Below 1440 the gutters go symmetric. */}
      <main className="mx-auto flex w-full max-w-layout-page-width flex-1 flex-col px-layout-gutter pt-[34px] pb-32 min-[1440px]:pr-[64px]">
        <Outlet />
      </main>
    </div>
  );
}
