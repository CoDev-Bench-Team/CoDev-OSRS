import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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
/** A Netlify build is a different site from the API. The browser calls `/auth`
 *  on the Netlify host, and this rule — above the SPA fallback — proxies it to
 *  the configured base so the session cookie stays first-party. */
function netlifyAuthProxy(apiBase: string | undefined): Plugin {
  return {
    name: 'netlify-auth-proxy',
    apply: 'build',
    closeBundle() {
      if (process.env.NETLIFY !== 'true' || !apiBase) return
      const target = apiBase.replace(/\/$/, '')
      const file = fileURLToPath(new URL('./dist/_redirects', import.meta.url))
      const existing = existsSync(file) ? readFileSync(file, 'utf8') : '/*  /index.html  200\n'
      const rule = `/auth/*  ${target}/auth/:splat  200`
      if (existing.startsWith('/auth/*')) return
      writeFileSync(file, `${rule}\n${existing}`)
    },
  }
}

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL?.trim()
  return {
    plugins: [react(), tailwindcss(), designSystemAssets(), netlifyAuthProxy(apiBase)],
    define: {
      __OSRS_NETLIFY__: JSON.stringify(process.env.NETLIFY === 'true'),
    },
    // Dev only. Vite does not apply `server.proxy` to a production build.
    // `/auth` alone: `/assets` is already the design-system middleware.
    server: {
      // Google's OAuth client authorizes http://localhost:5173 only. A busy
      // port must fail to start rather than move to a port sign-in cannot use.
      port: 5173,
      strictPort: true,
      ...(apiBase
        ? {
            proxy: {
              '/auth': { target: apiBase, changeOrigin: true },
            },
          }
        : {}),
    },
    resolve: {
      alias: {
        // Resolves the vendored design-system source for the dev-only fidelity
        // harness (spec 002 FR-005a). Never used by product code.
        '@ds': fileURLToPath(new URL('./design-system', import.meta.url)),
      },
    },
  }
})
