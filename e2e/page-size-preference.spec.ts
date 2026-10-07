import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('Result per page starts at 10 and each table remembers the size chosen', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  // Wait for Inventory's own table: the Queue's pager is still on screen for
  // a moment after the link is pressed.
  await expect(page.locator('[data-unit]').first()).toBeVisible();
  const size = page.getByLabel('Result per page');
  await expect(size).toHaveValue('10');

  await size.selectOption('25');
  await expect(size).toHaveValue('25');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('osrs.pageSize.inventory'))).toBe('25');
  await page.reload();
  await expect(page.locator('[data-unit]').first()).toBeVisible();
  await expect(page.getByLabel('Result per page')).toHaveValue('25');

  // Another table keeps its own preference. (The Queue: History has no rows
  // here, and an empty table draws no page-size select.)
  await page.getByRole('link', { name: 'Requests Queue' }).click();
  await expect(page.getByRole('heading', { name: 'Requests Queue', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Result per page')).toHaveValue('10');
});
