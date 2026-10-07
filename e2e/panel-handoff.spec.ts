import type { Page } from '@playwright/test';
import { expect, hold, test } from './fixtures/test';
import { signIn } from './fixtures/session';
import { encodeAsset } from './fixtures/supply';

const toast = (page: Page, text: string) => page.locator('li').filter({ hasText: text });

test('closing Update Asset mid-save hands the save to a toast', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Assets' }).click();
  await page.getByRole('button', { name: 'Business Laptop' }).click();
  await page.getByRole('button', { name: 'Update Asset' }).click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('textbox', { name: /Item Name/ }).fill('Business Laptop Pro');

  const release = await hold(page, '**/api/assets/*', 'PATCH');
  await panel.getByRole('button', { name: 'Save Changes' }).click();
  await expect(panel.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await expect(toast(page, 'Saving Business Laptop Pro')).toHaveCount(0);

  // Closing Update Asset goes back to View Asset, as it always has.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Update Asset' })).toHaveCount(0);
  await expect(toast(page, 'Saving Business Laptop Pro…')).toBeVisible();

  release();
  await expect(toast(page, 'Business Laptop Pro saved')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Business Laptop Pro' })).toBeVisible();
});

test('closing Add Multiple Units mid-save hands the save to a toast', async ({ page }) => {
  const name = 'E2E Handoff Headset';
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, name);
  await page.getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('button', { name: '+ Add Inventory' }).click();
  await page.getByRole('menuitem', { name: 'Add Multiple Units' }).click();
  const panel = page.getByRole('dialog');
  const search = panel.getByPlaceholder('Search catalog item name or code');
  await expect(search).toBeEnabled();
  await search.fill(name);
  await page.getByRole('option', { name: new RegExp(name) }).click();
  await panel.getByRole('button', { name: 'Add a unit' }).click();
  for (let i = 0; i < 2; i++) await panel.getByRole('group', { name: `Unit ${i + 1}` }).getByRole('textbox').first().fill(`${name}-${i + 1}`);

  const release = await hold(page, '**/api/inventory-items/bulk', 'POST');
  await panel.getByRole('button', { name: 'Save Changes' }).click();
  // In the panel: named, locked.
  await expect(panel.getByRole('button', { name: 'Adding…' })).toBeDisabled();
  await expect(search).toBeDisabled();

  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(toast(page, `Adding 2 ${name} units…`)).toBeVisible();

  release();
  await expect(toast(page, `2 ${name} units added`)).toBeVisible();
});
