import { lazy, Suspense, useSyncExternalStore } from 'react';
import { BrowserRouter } from 'react-router';
import { SessionProvider } from '../features/auth/SessionProvider';
import { AppRoutes } from './routes';

/** The application shell (spec 003): a router for durable addresses, a session
 *  boundary for identity and role, and one guard between them.
 *
 *  `#compare` is a development-only branch, not a route: it mounts the fidelity
 *  harness, which imports the vendored design-system source. It stays outside
 *  the router because it is not part of the product.
 *
 *  The `import.meta.env.DEV &&` guard must wrap the `lazy()` call itself, not
 *  just its use. Vite replaces DEV with `false` in a production build, which
 *  lets Rollup drop the dynamic import entirely. Declaring the lazy component
 *  unconditionally and only *using* it behind the guard still emits the chunk,
 *  so design-system/ would ship. */
const CompareHarness = import.meta.env.DEV
  ? lazy(() => import('../shared/ui/gallery/compare/CompareHarness').then((m) => ({ default: m.CompareHarness })))
  : null;

/** Reading `location.hash` during render is not enough: changing the hash on an
 *  already-open page fires `hashchange` without reloading, so React would never
 *  re-render and `#compare` would appear to do nothing. */
function useHash() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange);
      return () => window.removeEventListener('hashchange', onChange);
    },
    () => window.location.hash,
    () => '',
  );
}

export default function App() {
  const hash = useHash();
  if (CompareHarness && hash === '#compare') {
    return (
      <Suspense fallback={null}>
        <CompareHarness />
      </Suspense>
    );
  }
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}
