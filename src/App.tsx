import { lazy, Suspense, useSyncExternalStore } from 'react';
import { Gallery } from './shared/ui/gallery/Gallery';

/** Spec 002 delivers the component library, not product screens, and FR-016
 *  forbids routing here. So the gallery is simply what the app renders; its
 *  sections are reached by in-page anchors. Spec 003 replaces this with the
 *  routed shell.
 *
 *  `#compare` is a development-only branch, not a route: it mounts the fidelity
 *  harness, which imports the vendored design-system source.
 *
 *  The `import.meta.env.DEV &&` guard must wrap the `lazy()` call itself, not
 *  just its use. Vite replaces DEV with `false` in a production build, which
 *  lets Rollup drop the dynamic import entirely. Declaring the lazy component
 *  unconditionally and only *using* it behind the guard still emits the chunk,
 *  so design-system/ would ship. */
const CompareHarness = import.meta.env.DEV
  ? lazy(() => import('./shared/ui/gallery/compare/CompareHarness').then((m) => ({ default: m.CompareHarness })))
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
  return <Gallery />;
}
