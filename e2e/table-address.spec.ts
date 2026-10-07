import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

/** FR-056: search and sort live in the address. */

test('the queue keeps its search and sort in the address across a reload', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue/);
  const search = page.getByRole('searchbox', { name: 'Search requests' });
  const sort = page.getByRole('combobox', { name: 'Sort requests' });

  // Typed quickly: no letter is lost to the address catching up.
  await search.pressSequentially('Maya Santos', { delay: 10 });
  await expect(search).toHaveValue('Maya Santos');
  await sort.click();
  await page.getByRole('option', { name: 'Oldest First' }).click();
  await expect(page).toHaveURL(/[?&]search=Maya\+Santos(&|$)/);
  await expect(page).toHaveURL(/[?&]sort=oldest(&|$)/);

  // Each change replaced the entry: Back leaves the queue, not the search.
  const entries = await page.evaluate(() => history.length);
  await search.fill('Maya');
  await expect(page).toHaveURL(/[?&]search=Maya(&|$)/);
  expect(await page.evaluate(() => history.length)).toBe(entries);

  await page.reload();
  await expect(search).toHaveValue('Maya');
  await expect(sort).toHaveText(/Oldest First/);

  // Back to the defaults: nothing is left in the address.
  await search.fill('');
  await sort.click();
  await page.getByRole('option', { name: 'Newest First' }).click();
  await expect(page).toHaveURL(/\/queue$/);
});

test('opening an address with a search and sort opens the table on them', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  const asked = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/requests/history' && url.searchParams.get('search') === 'Maya' && url.searchParams.get('sort') === 'employee_name_asc';
  });
  await page.goto('/history?search=Maya&sort=employee');
  await asked;
  await expect(page.getByRole('searchbox', { name: 'Search history' })).toHaveValue('Maya');
  await expect(page.getByRole('combobox', { name: 'Sort history' })).toHaveText(/Employee \(A-Z\)/);
});

test('History keeps its search and sort in the address across a reload', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'History' }).click();
  const search = page.getByRole('searchbox', { name: 'Search history' });
  const sort = page.getByRole('combobox', { name: 'Sort history' });
  await search.fill('Maya');
  await sort.click();
  await page.getByRole('option', { name: 'Oldest First' }).click();
  await expect(page).toHaveURL(/[?&]search=Maya(&|$)/);
  await expect(page).toHaveURL(/[?&]sort=oldest(&|$)/);

  await page.reload();
  await expect(search).toHaveValue('Maya');
  await expect(sort).toHaveText(/Oldest First/);
});

test('Assets keeps its search in the address', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Assets' }).click();
  const search = page.getByRole('searchbox', { name: 'Search by item name or model' });
  await search.fill('Latitude');
  await expect(page).toHaveURL(/\/assets\?search=Latitude$/);
  await page.reload();
  await expect(search).toHaveValue('Latitude');
  await expect(page.getByText('Dell Latitude 5440').first()).toBeVisible();
});

test('the nav link to the page it is on clears the search', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  const search = page.getByRole('searchbox', { name: 'Search requests' });
  await search.fill('Maya');
  await expect(page).toHaveURL(/search=Maya/);
  await page.getByRole('link', { name: 'Requests Queue' }).click();
  await expect(page).toHaveURL(/\/queue$/);
  await expect(search).toHaveValue('');
});

test('Inventory keeps its search in the address', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const search = page.getByRole('searchbox', { name: /^Search by item name/ });
  await search.fill('Latitude');
  await expect(page).toHaveURL(/\/inventory\?search=Latitude$/);
  await page.reload();
  await expect(search).toHaveValue('Latitude');
});

test('an Inventory search by serial number reaches the table', async ({ page, api }) => {
  const unit = api.units.find((u) => u.serialNumber)!;
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('searchbox', { name: /^Search by item name/ }).fill(unit.serialNumber!);
  const rows = page.locator('[data-unit]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(unit.serialNumber!);
});
