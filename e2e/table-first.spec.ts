import { expect, hold, test } from './fixtures/test';
import { signIn } from './fixtures/session';

const queueRows = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Requests table' }).getByRole('button', { name: /^Review request/ });

test('the queue shows its rows before the counts arrive', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue/);
  await expect(queueRows(page).first()).toBeVisible();

  const release = await hold(page, '**/api/requests/counts**');
  await page.reload();

  // The rows are drawn while the counts are still held; the cards wait.
  await expect(queueRows(page).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Requests workload summary' })).toHaveCount(0);

  release();
  await expect(page.getByRole('region', { name: 'Requests workload summary' })).toBeVisible();
});

test('signed out, nothing is read before the session answers', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);

  const release = await hold(page, '**/auth/me');
  const reads: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/requests([?/]|$)/.test(request.url())) reads.push(request.url());
  });
  await page.goto('/queue');
  await page.waitForTimeout(500);
  expect(reads).toEqual([]);
  release();
  await expect(page).toHaveURL(/\/login/);
});

test('All requests is one list call, with no status', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(queueRows(page).first()).toBeVisible();

  const lists: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/requests') lists.push(url);
  });
  await page.reload();
  await expect(queueRows(page).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Requests workload summary' })).toBeVisible();

  expect(lists).toHaveLength(1);
  expect(lists[0].searchParams.has('status')).toBe(false);
  // Resolved requests the call returns stay off the queue.
  await expect(page.getByRole('region', { name: 'Requests table' }).getByText(/^(Rejected|Cancelled|Completed)$/)).toHaveCount(0);
});

test('the counts are asked beside the rows, not after them', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(queueRows(page).first()).toBeVisible();

  // The list is held: the counts read still goes out.
  const release = await hold(page, /\/api\/requests\?/);
  const counted = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/requests/counts');
  await page.reload();
  await counted;
  release();
  await expect(queueRows(page).first()).toBeVisible();
});

test('the queue shows its counts before the rows arrive', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(queueRows(page).first()).toBeVisible();

  const release = await hold(page, /\/api\/requests\?/);
  await page.reload();

  // The cards and chips are drawn while the rows are still held.
  await expect(page.getByRole('region', { name: 'Requests workload summary' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Filter by status' })).toContainText(/\(\d+\)/);
  await expect(queueRows(page)).toHaveCount(0);

  release();
  await expect(queueRows(page).first()).toBeVisible();
});

test('a queue search sends the one published search to the rows and the counts', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(queueRows(page)).toHaveCount(2);

  const searched = (pathname: string) =>
    page
      .waitForRequest((request) => {
        const url = new URL(request.url());
        return url.pathname === pathname && url.searchParams.get('search') === 'Latitude';
      })
      .then((request) => new URL(request.url()));
  const asked = Promise.all([searched('/api/requests'), searched('/api/requests/counts')]);
  // An item model: neither a display id nor a requester, so only `search`
  // can match it (contracts conflict 13).
  await page.getByRole('searchbox', { name: 'Search requests' }).fill('Latitude');
  for (const url of await asked) {
    for (const old of ['displayId', 'requester', 'itemName']) expect(url.searchParams.has(old)).toBe(false);
  }
  await expect(page).toHaveURL(/search=Latitude/);
  await expect(queueRows(page)).toHaveCount(2);

  await page.getByRole('searchbox', { name: 'Search requests' }).fill('Samantha');
  await expect(queueRows(page)).toHaveCount(1);
});

test('an Inventory search is one list call, its counts on it', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  await expect(page.locator('[data-unit]').first()).toBeVisible();

  const lists: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/inventory-items') lists.push(url);
  });
  await page.getByRole('searchbox', { name: /^Search by item name/ }).fill('lat');
  await expect(page).toHaveURL(/search=lat/);
  await expect(page.getByRole('group', { name: 'Filter by unit status' }).getByRole('button', { name: /^All items/ })).toHaveText(/\d/);
  await page.waitForTimeout(400);

  expect(lists).toHaveLength(1);
  expect(lists[0].searchParams.get('search')).toBe('lat');
  expect(lists[0].searchParams.has('status')).toBe(false);
});
