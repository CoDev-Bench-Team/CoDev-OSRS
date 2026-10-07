import { test as base, type Page } from '@playwright/test';
import { FakeApi, serve } from './fake-api';

/** Every spec gets a fresh fake API (test-only data; the app ships none). */
export const test = base.extend<{ api: FakeApi }>({
  api: [
    async ({ page }, use) => {
      const api = new FakeApi();
      await serve(page, api);
      apis.set(page, api);
      await use(api);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

const apis = new WeakMap<object, FakeApi>();

/** The fake behind a page, for the session helpers. */
export function apiFor(page: object): FakeApi {
  const api = apis.get(page);
  if (!api) throw new Error('No fake API on this page; import `test` from ./fixtures/test');
  return api;
}

/** Holds requests to `url` (only `method`'s, when given) until the returned
 *  function is called, so an in-flight state stays on screen to be checked. */
export async function hold(page: Page, url: string | RegExp, method?: string): Promise<() => void> {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(url, async (route) => {
    if (!method || route.request().method() === method) await held;
    await route.fallback();
  });
  return release;
}
