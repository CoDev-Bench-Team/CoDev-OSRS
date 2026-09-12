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

export default defineConfig({
  plugins: [react(), tailwindcss(), designSystemAssets()],
  resolve: {
    alias: {
      // Resolves the vendored design-system source for the dev-only fidelity
      // harness (spec 002 FR-005a). Never used by product code.
      '@ds': fileURLToPath(new URL('./design-system', import.meta.url)),
    },
  },
})
