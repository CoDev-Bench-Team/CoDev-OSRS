import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { LoadingState, NotFoundScreen, Placeholder } from '../shared/ui';
import { AppLayout } from './AppLayout';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RequireAccess } from '../features/auth/RequireAccess';
import { BackToWork } from '../features/auth/BackToWork';
import { useSession } from '../features/auth/SessionProvider';
import { LANDING } from '../features/auth/navigation';
import { ROLES } from '../features/auth/session-source';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { AddCatalogItemRoute, UpdateStockRoute } from '../features/inventory/drawer-routes';

/** The route map — the concrete form of spec 003's Destination Set, and the
 *  one place that says who may reach what.
 *
 *  Every protected element is wrapped in `RequireAccess`, so authorization is
 *  checked on entry rather than being remembered per screen (FR-010). The
 *  destinations whose own features have not been built render a `Placeholder`
 *  that names them and says so, which FR-020 requires to be distinguishable
 *  from a not-found and from an error.
 *
 *  Only Inventory is built. It is also where the Supply Admin lands, because
 *  the fulfillment queue spec 003 names as their landing destination has no
 *  design yet (`navigation.ts`).
 *
 *  The gallery is a development surface, not a destination: like the fidelity
 *  harness it is lazily imported behind `import.meta.env.DEV`, so Rollup drops
 *  it — and the vendored design system it reaches — from a production build.
 */
const Gallery = import.meta.env.DEV
  ? lazy(() => import('../shared/ui/gallery/Gallery').then((m) => ({ default: m.Gallery })))
  : null;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {Gallery ? (
        <Route
          path="/gallery"
          element={
            <Suspense fallback={<LoadingState />}>
              <Gallery />
            </Suspense>
          }
        />
      ) : null}

      <Route element={<AppLayout />}>
        <Route index element={<LandingRedirect />} />

        <Route
          path="catalog"
          element={
            <RequireAccess allow={ROLES}>
              <Placeholder name="Catalog" />
            </RequireAccess>
          }
        />
        <Route
          path="requests"
          element={
            <RequireAccess allow={['employee']}>
              <Placeholder name="My requests" />
            </RequireAccess>
          }
        />
        <Route
          path="approvals"
          element={
            <RequireAccess allow={['approver']}>
              <Placeholder name="Requests queue" />
            </RequireAccess>
          }
        />
        <Route
          path="history"
          element={
            <RequireAccess allow={['supply_admin']}>
              <Placeholder name="Request history" />
            </RequireAccess>
          }
        />
        <Route
          path="fulfillment"
          element={
            <RequireAccess allow={['supply_admin']}>
              <Placeholder
                name="Requests queue"
                note="The Supply Admin's queue — preparing and releasing approved requests — has no design in the source file yet, so this screen is waiting on one."
              />
            </RequireAccess>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAccess allow={ROLES}>
              <Placeholder name="Profile" />
            </RequireAccess>
          }
        />

        <Route
          path="inventory"
          element={
            <RequireAccess allow={['supply_admin']}>
              <InventoryPage />
            </RequireAccess>
          }
        >
          <Route path="new" element={<AddCatalogItemRoute />} />
          <Route path=":itemId/stock" element={<UpdateStockRoute />} />
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  );
}

/** `/` is not a screen: it is whichever screen the signed-in role starts from
 *  (FR-007). Signed out, `AppLayout` has already sent the visitor to sign-in. */
function LandingRedirect() {
  const { session } = useSession();
  if (!session) return null;
  return <Navigate to={LANDING[session.role]} replace />;
}

function NotFoundRoute() {
  const { session } = useSession();
  return <NotFoundScreen action={session ? <BackToWork to={LANDING[session.role]} /> : null} />;
}
