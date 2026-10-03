import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('a table keeps its rows and shows it is updating while the next page loads', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const rows = page.locator('[data-unit]');
  await expect(rows.first()).toBeVisible();

  api.listDelayMs = 1200;
  await page.getByRole('group', { name: /Filter by/ }).getByRole('button', { name: /^Available/ }).click();

  // The rows already on screen stay, dimmed, with the card marked busy.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(1);
  await expect(rows.first()).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Updating results' })).toHaveCount(1);

  // Then the next page lands and the busy state clears.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 5000 });
  await expect(rows.filter({ hasText: 'Reserved' })).toHaveCount(0);
});
