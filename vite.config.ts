import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// `@ds` resolves to the vendored design-system source. It exists so the
// dev-only compare harness can render the designer's original components beside
// the ported ones and diff computed styles (spec 002 FR-005a). The alias is
// never used by product code, and the harness is gated behind import.meta.env.DEV,
// so nothing under design-system/ reaches a production bundle.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@ds': fileURLToPath(new URL('./design-system', import.meta.url)),
    },
  },
})
