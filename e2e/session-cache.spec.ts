import { expect, hold, test } from './fixtures/test';
import { PEOPLE } from './fixtures/fake-api';
import { signIn } from './fixtures/session';

/** FR-058: the signed-in user is kept, a load renders from it, and
 *  `/auth/me` follows in the background. */

const KEY = 'osrs.session';
const kept = (page: import('@playwright/test').Page) => page.evaluate((key) => localStorage.getItem(key), KEY);

test('a reload renders from the kept user without waiting for the current-user read', async ({ page }) => {
  await signIn(page, 'Maya Santos');
  await page.goto('/requests');
  await expect(page.getByRole('heading', { name: 'My Requests', level: 1 })).toBeVisible();
  expect(await kept(page)).toContain('Maya');

  // The current-user read is held: My Requests (which needs the user's id)
  // and the top bar still draw.
  const release = await hold(page, '**/auth/me');
  const listed = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/requests');
  await page.reload();
  await listed;
  await expect(page.getByText('Maya Santos').first()).toBeVisible();
  release();
});

test('the current-user read follows the screen’s own reads', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue/);

  const order: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/auth/me') order.push('me:start');
  });
  page.on('requestfinished', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/api/requests') order.push('list:done');
  });
  const me = page.waitForRequest((request) => new URL(request.url()).pathname === '/auth/me');
  await page.reload();
  await me;
  expect(order.indexOf('list:done')).toBeGreaterThanOrEqual(0);
  expect(order.indexOf('list:done')).toBeLessThan(order.indexOf('me:start'));
});

test('signing out forgets the kept user', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  expect(await kept(page)).not.toBeNull();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await kept(page)).toBeNull();

  // A reload does not bring the person back.
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});

test('an ended session is forgotten and said so', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  expect(await kept(page)).not.toBeNull();
  api.current = null;
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Your session ended. Sign in again to continue.')).toBeVisible();
  expect(await kept(page)).toBeNull();
});

test('an API that cannot be reached keeps the user signed in', async ({ page }) => {
  await signIn(page, 'Maya Santos');
  await page.goto('/requests');
  await expect(page.getByRole('heading', { name: 'My Requests', level: 1 })).toBeVisible();

  // The background read fails with a 5xx, then with no answer at all: neither
  // ends the session nor forgets the kept user.
  await page.route('**/auth/me', (route) =>
    route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ status: 503, title: 'Service Unavailable' }) }),
  );
  const failed = page.waitForResponse((response) => new URL(response.url()).pathname === '/auth/me');
  await page.reload();
  await failed;
  await expect(page).toHaveURL(/\/requests$/);
  await expect(page.getByRole('heading', { name: 'My Requests', level: 1 })).toBeVisible();
  expect(await kept(page)).toContain('Maya');

  await page.unroute('**/auth/me');
  await page.route('**/auth/me', (route) => route.abort('connectionrefused'));
  const aborted = page.waitForEvent('requestfailed', (request) => new URL(request.url()).pathname === '/auth/me');
  await page.reload();
  await aborted;
  await expect(page).toHaveURL(/\/requests$/);
  await expect(page.getByText('Maya Santos').first()).toBeVisible();
  expect(await kept(page)).toContain('Maya');
});

test('the background read replaces a kept user whose role changed', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue/);
  // The account is now an Employee's; the kept user still says Admin.
  api.current = PEOPLE['Maya Santos'];
  await page.reload();
  // A role that changes mid-session is taken to its own home (FR-017b).
  await expect(page).toHaveURL(/\/catalog$/);
  await expect.poll(() => kept(page)).toContain('employee');
});
