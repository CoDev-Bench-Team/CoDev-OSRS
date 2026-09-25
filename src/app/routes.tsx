import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { NotFoundScreen } from '../shared/ui';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RequireAccess } from '../features/auth/RequireAccess';
import { ProfilePage } from '../features/profile/ProfilePage';
import { useSession } from '../features/auth/session-context';
import { QueuePage } from '../features/requests/queue/QueuePage';
import { AppLayout } from './AppLayout';
import { DESTINATIONS, landingPath, SIGN_IN_PATH, type DestinationId } from './destinations';
import { NavButton } from './NavButton';
import {
  AssetsPlaceholder,
  CatalogPlaceholder,
  HistoryPlaceholder,
  InventoryPlaceholder,
  RequestDetailPlaceholder,
  RequestsPlaceholder,
} from './placeholders';

/** The route map — the destination set in `destinations.ts`, made addressable.
 *
 *  One source of truth, and every protected element goes through the same
 *  guard with the roles that destination's row declares. There is no route here
 *  whose authorization is written by hand (FR-010). */

function guarded(id: DestinationId, element: ReactNode) {
  return <RequireAccess allow={DESTINATIONS[id].roles}>{element}</RequireAccess>;
}

/** `/` is not a destination: it resolves to wherever this role's work starts
 *  (FR-007). Signed out, the outer guard has already sent the visitor to
 *  sign-in, so this only ever runs with a session. */
function LandingRedirect() {
  const { session } = useSession();
  if (!session) return <Navigate to={SIGN_IN_PATH} replace />;
  return <Navigate to={landingPath(session.role)} replace />;
}

/** FR-012: an address matching no destination. Rendered INSIDE the shell, so
 *  the chrome and navigation survive, and distinguishable from a refusal so a
 *  mistyped address stays diagnosable. */
function NotFoundRoute() {
  const { session } = useSession();
  const location = useLocation();
  return (
    <NotFoundScreen
      path={location.pathname}
      action={session ? <NavButton to={landingPath(session.role)}>Go to Your Home Screen</NavButton> : undefined}
    />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* No shell chrome on sign-in (FR-014 / Story 5 AC5): it is outside the
          layout route, not a layout that hides its own bar. */}
      <Route path={SIGN_IN_PATH} element={<LoginScreen />} />

      {/* Everything below requires a session (FR-001). The outer guard carries
          no `allow`, so it checks only that someone is signed in; the inner
          guard on each element checks the role. */}
      <Route
        element={
          <RequireAccess>
            <AppLayout />
          </RequireAccess>
        }
      >
        <Route index element={<LandingRedirect />} />
        <Route path={DESTINATIONS.catalog.path} element={guarded('catalog', <CatalogPlaceholder />)} />
        <Route path={DESTINATIONS.requests.path} element={guarded('requests', <RequestsPlaceholder />)} />
        <Route
          path={DESTINATIONS.requestDetail.path}
          element={guarded('requestDetail', <RequestDetailPlaceholder />)}
        />
        <Route path={DESTINATIONS.queue.path} element={guarded('queue', <QueuePage />)} />
        <Route path={DESTINATIONS.assets.path} element={guarded('assets', <AssetsPlaceholder />)} />
        <Route path={DESTINATIONS.inventory.path} element={guarded('inventory', <InventoryPlaceholder />)} />
        <Route path={DESTINATIONS.history.path} element={guarded('history', <HistoryPlaceholder />)} />
        <Route path={DESTINATIONS.profile.path} element={guarded('profile', <ProfilePage />)} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  );
}
