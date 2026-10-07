import { defineConfig, devices } from '@playwright/test';

/** The suite drives the Vite app in Chromium, in API mode, against the
 *  test-only fake in `e2e/fixtures/fake-api.ts` (spec 017): the app ships no
 *  seeded data. `VITE_API_BASE_URL` is a host no request reaches — the fake
 *  answers `/auth` and `/api` in the page — and the Google client id is
 *  blanked so no Google script loads. Port 5174 stays off a dev server
 *  someone already has on 5173. One worker: each test's fake is its own. */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 240_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174',
    env: { VITE_API_BASE_URL: 'http://api.e2e.invalid', VITE_GOOGLE_CLIENT_ID: '' },
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
