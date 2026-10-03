import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('a removed unit leaves the table without a reload, even when the next read lags', async ({ page, api }) => {
  // The live API's list can still return a unit straight after its delete.
  api.staleReadsAfterDelete = 3;
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const rows = page.locator('[data-unit]');
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  const first = rows.filter({ hasText: 'Available' }).first();
  const unitId = await first.getAttribute('data-unit');
  await first.getByRole('button', { name: /^Review/ }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Remove Unit' }).click();
  await dialog.getByRole('textbox', { name: /Reason for removal/ }).fill('Damaged beyond repair');
  await expect(dialog.getByText('This unit will be deleted and cannot be restored. Are you sure you want to continue?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm Removal' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(dialog).toBeHidden();

  await expect(page.locator(`[data-unit="${unitId}"]`)).toHaveCount(0);
  await expect(rows).toHaveCount(before - 1);
});

test('Review reads the unit and the user list once each, and no asset list', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const row = page.locator('[data-unit]').filter({ hasText: 'Available' }).first();
  await expect(row).toBeVisible();

  const calls: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/')) calls.push(`${request.method()} ${path}`);
  });
  await row.getByRole('button', { name: /^Review/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Remove Unit' })).toBeVisible();

  expect(calls.filter((c) => c.startsWith('GET /api/assets'))).toEqual([]);
  expect(calls.filter((c) => /^GET \/api\/inventory-items\/\d+$/.test(c))).toHaveLength(1);
  expect(calls.filter((c) => c === 'GET /api/users')).toHaveLength(1);
});
