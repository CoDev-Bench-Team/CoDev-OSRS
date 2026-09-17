import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { SessionProvider } from '../features/auth/SessionProvider';
import { RequestListCountProvider } from './RequestListCountProvider';
import { AppRoutes } from './routes';

/** The application root: history, then session, then the count the top bar
 *  shows, then the routes.
 *
 *  Order matters. The router is outermost because guards redirect, and a guard
 *  is rendered by a route. The session provider sits above every route so a
 *  single resolution serves all of them — and so `status` is shared, which is
 *  what makes the loading state a property of the application rather than of a
 *  screen.
 *
 *  Spec 002's component gallery is not a destination; it is the design system's
 *  own surface and the fidelity gates run against it. It stays reachable in
 *  development at `/__gallery` and `/__compare`, outside the destination set
 *  and outside any guard, and — like the compare harness before it — is
 *  dropped from production builds entirely.
 *
 *  The `import.meta.env.DEV &&` guard must wrap the `lazy()` call itself, not
 *  just its use. Vite replaces DEV with `false` in a production build, which
 *  lets Rollup drop the dynamic import. Declaring the lazy component
 *  unconditionally and only *using* it behind the guard still emits the chunk,
 *  so the gallery — and through the harness, design-system/ — would ship. */
const Gallery = import.meta.env.DEV
  ? lazy(() => import('../shared/ui/gallery/Gallery').then((m) => ({ default: m.Gallery })))
  : null;

const CompareHarness = import.meta.env.DEV
  ? lazy(() => import('../shared/ui/gallery/compare/CompareHarness').then((m) => ({ default: m.CompareHarness })))
  : null;

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <RequestListCountProvider>
          {Gallery && CompareHarness ? (
            <Routes>
              <Route
                path="/__gallery"
                element={
                  <Suspense fallback={null}>
                    <Gallery />
                  </Suspense>
                }
              />
              <Route
                path="/__compare"
                element={
                  <Suspense fallback={null}>
                    <CompareHarness />
                  </Suspense>
                }
              />
              <Route path="*" element={<AppRoutes />} />
            </Routes>
          ) : (
            <AppRoutes />
          )}
        </RequestListCountProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
