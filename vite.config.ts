import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

/** Serves design-system/assets at /assets during development only.
 *
 *  The vendored source components build asset paths relative to the page
 *  (`assets/logo-codev-red.png`), because in the design system they sit next to
 *  a bundle file. Under the dev server those 404, so the fidelity comparison
 *  would diff the port against broken-image icons and report differences that
 *  are not real. `apply: 'serve'` keeps this out of any build. */
function designSystemAssets(): Plugin {
  const root = fileURLToPath(new URL('./design-system/assets', import.meta.url))
  return {
    name: 'design-system-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const rel = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]))
        if (rel.includes('..')) return next()
        const file = join(root, rel)
        if (!existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

/** The published contract's origin. Recorded in
 *  specs/001-office-supplies-mvp/contracts/README.md. */
const API_ORIGIN = 'https://codev-osrs-backend.vercel.app'

export default defineConfig({
  plugins: [react(), tailwindcss(), designSystemAssets()],
  /** Proxies /api to the deployed backend during development only.
   *
   *  Two problems disappear because the browser then sees a same-origin URL:
   *
   *  1. The backend returns no `Access-Control-Allow-Origin` for any origin we
   *     have tried, so a direct cross-origin call is blocked before it starts.
   *     Raised with the backend team in RG_DOCS/questionsToBackend.md §3.
   *  2. The session is an httpOnly cookie. Same-origin makes it first-party,
   *     so it is stored and sent without depending on SameSite=None; Secure.
   *
   *  `changeOrigin` rewrites the Host header, which Vercel routes on. The
   *  rewrite strips the /api prefix, because the contract's paths are
   *  /auth/me, not /api/auth/me — the prefix exists only to give the proxy
   *  something to match. A deployed build sets VITE_API_URL instead and
   *  never reaches this. */
  server: {
    /** Pinned, and `strictPort` so a busy 5173 is an ERROR rather than a silent
     *  move to 5174.
     *
     *  Google refuses any origin not listed in the OAuth client's Authorized
     *  JavaScript origins, and only `http://localhost:5173` is registered. When
     *  Vite quietly picked the next free port — which it does whenever a dev
     *  server is already running — sign-in failed with nothing to go on but the
     *  screen's generic "Sign-in did not succeed", because the SPA never learns
     *  why Google refused.
     *
     *  Failing to start is a far better outcome than starting on a port where
     *  authentication cannot work. */
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_ORIGIN,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      // Resolves the vendored design-system source for the dev-only fidelity
      // harness (spec 002 FR-005a). Never used by product code.
      '@ds': fileURLToPath(new URL('./design-system', import.meta.url)),
    },
  },
})
