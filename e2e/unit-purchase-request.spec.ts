import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';
import { choose, OFFICES } from './fixtures/supply';

// The Purchase Request number is published on create, bulk create, update
// (`null` clears it) and both reads (contracts G5, closed 2026-10-06).

test('Add Single Unit sends the Purchase Request number, and the row shows it', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('button', { name: '+ Add Inventory' }).click();
  await page.getByRole('menuitem', { name: 'Add Single Unit' }).click();
  const dialog = page.getByRole('dialog');
  const search = dialog.getByPlaceholder('Search catalog item name or code');
  await expect(search).toBeEnabled();
  await search.fill('Business Laptop');
  await page.getByRole('option', { name: /Business Laptop/ }).click();
  await expect(dialog.getByRole('button', { name: /^Clear catalog item/ })).toBeVisible();
  // Stray spaces are trimmed before it is sent.
  await dialog.getByRole('textbox', { name: 'Purchase Request' }).fill('  2026-0142 ');
  await dialog.getByRole('textbox', { name: /^Serial Number/ }).fill('PR-SINGLE-1');
  // Status sits at the foot of the panel, and a scroll closes an open list:
  // bring it into view before opening it. The
  // office opens on Cebu.
  const status = dialog.getByRole('combobox', { name: 'Status' });
  await status.scrollIntoViewIfNeeded();
  await choose(page, status, 'Available', ['Available', 'Assigned']);

  const sent = page.waitForRequest((r) => r.method() === 'POST' && /\/api\/inventory-items$/.test(r.url()));
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  expect((await sent).postDataJSON()).toMatchObject({ purchaseRequest: '2026-0142' });
  await expect(dialog).toBeHidden();
  expect(api.units.find((u) => u.serialNumber === 'PR-SINGLE-1')?.purchaseRequest).toBe('2026-0142');
  await expect(page.locator('[data-unit]').filter({ hasText: 'PR-SINGLE-1' }).getByText('2026-0142')).toBeVisible();
});

test('Add Multiple Units sends one Purchase Request number for the batch', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('button', { name: '+ Add Inventory' }).click();
  await page.getByRole('menuitem', { name: 'Add Multiple Units' }).click();
  const dialog = page.getByRole('dialog');
  const search = dialog.getByPlaceholder('Search catalog item name or code');
  await expect(search).toBeEnabled();
  await search.fill('Business Laptop');
  await page.getByRole('option', { name: /Business Laptop/ }).click();
  await choose(page, dialog.getByRole('combobox', { name: 'Office' }), 'Davao', OFFICES);
  await dialog.getByRole('textbox', { name: 'Purchase Request' }).fill('2026-0200');
  await dialog.getByRole('button', { name: 'Add a unit' }).click();
  for (let i = 0; i < 2; i++) {
    await dialog.getByRole('group', { name: `Unit ${i + 1}` }).getByRole('textbox').first().fill(`PR-BULK-${i + 1}`);
  }

  const sent = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/inventory-items/bulk'));
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  expect((await sent).postDataJSON()).toMatchObject({ purchaseRequest: '2026-0200' });
  await expect(dialog).toBeHidden();
  expect(api.units.filter((u) => u.purchaseRequest === '2026-0200').map((u) => u.serialNumber)).toEqual(['PR-BULK-1', 'PR-BULK-2']);
});

test('Review shows the read Purchase Request number, and clearing it sends null', async ({ page, api }) => {
  const unit = api.units.find((u) => u.status === 'Available')!;
  unit.purchaseRequest = '2026-0099';

  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const row = page.locator('[data-unit]').filter({ hasText: unit.serialNumber! });
  await expect(row.getByText('2026-0099')).toBeVisible();
  await row.getByRole('button', { name: /^Review/ }).click();
  const panel = page.getByRole('dialog');
  const field = panel.getByRole('textbox', { name: 'Purchase Request' });
  await expect(field).toHaveValue('2026-0099');
  await field.fill('');

  const sent = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/api/inventory-items/'));
  await panel.getByRole('button', { name: 'Save Changes' }).click();
  expect((await sent).postDataJSON()).toMatchObject({ purchaseRequest: null });
  await expect(panel).toHaveCount(0);
  expect(unit.purchaseRequest).toBeNull();
});
