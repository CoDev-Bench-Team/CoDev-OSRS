import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';
import { encodeAsset } from './fixtures/supply';

/** A click outside a side panel keeps what was typed for five minutes; Cancel
 *  and an expired draft start empty (shared/form-draft-cache.ts). */
test('Add Asset keeps a draft after a click outside, and Cancel or five minutes clears it', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Assets' }).click();
  const dialog = page.getByRole('dialog');
  const name = dialog.getByRole('textbox', { name: /Item Name/ });

  await page.getByRole('button', { name: '+ Add Asset' }).click();
  await name.fill('Draft Headset');
  await page.mouse.click(5, 300); // outside the panel
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: '+ Add Asset' }).click();
  await expect(name).toHaveValue('Draft Headset');

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: '+ Add Asset' }).click();
  await expect(name).toHaveValue('');

  // A draft past five minutes is gone before the panel first renders.
  await name.fill('Stale Headset');
  await page.mouse.click(5, 300);
  await expect(dialog).toBeHidden();
  await page.evaluate(() => {
    const k = 'osrs.draft.asset.new';
    const stored = JSON.parse(localStorage.getItem(k) ?? '{}') as { value?: unknown };
    localStorage.setItem(k, JSON.stringify({ savedAt: Date.now() - 5 * 60 * 1000 - 1, value: stored.value }));
  });
  await page.getByRole('button', { name: '+ Add Asset' }).click();
  await expect(name).toHaveValue('');
});

test('Add Multiple Units keeps rows and serials after a click outside, but never a secret', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, 'E2E Draft Mouse');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const open = async () => {
    await page.getByRole('button', { name: '+ Add Inventory' }).click();
    await page.getByRole('menuitem', { name: 'Add Multiple Units' }).click();
  };
  const dialog = page.getByRole('dialog');

  await open();
  const search = dialog.getByPlaceholder('Search catalog item name or code');
  await expect(search).toBeEnabled();
  await search.fill('E2E Draft Mouse');
  await page.getByRole('option', { name: /E2E Draft Mouse/ }).click();
  await dialog.getByRole('button', { name: 'Add a unit' }).click();
  await dialog.getByRole('group', { name: 'Unit 1' }).getByRole('textbox').first().fill('SN-1');
  await dialog.getByRole('group', { name: 'Unit 2' }).getByRole('textbox').first().fill('SN-2');
  await page.mouse.click(5, 300);
  await expect(dialog).toBeHidden();

  const stored = await page.evaluate(() => localStorage.getItem('osrs.draft.unit.bulk') ?? '');
  expect(stored).toContain('SN-2');
  expect(stored).not.toMatch(/bitlocker|recovery/i);

  // The asset list is held back: the restored item shows from the draft's
  // snapshot, not after the list loads.
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/api\/assets(\?|$)/, async (route) => {
    await held;
    await route.fallback();
  });
  await open();
  await expect(dialog.getByRole('button', { name: 'Clear catalog item E2E Draft Mouse' })).toBeVisible({ timeout: 1000 });
  await expect(dialog.getByRole('group', { name: 'Unit 2' }).getByRole('textbox').first()).toHaveValue('SN-2');
  release();
  await expect(dialog.getByPlaceholder('Search catalog item name or code')).toBeEnabled();
  await expect(dialog.getByRole('button', { name: 'Clear catalog item E2E Draft Mouse' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await open();
  await expect(dialog.getByRole('group', { name: 'Unit 2' })).toHaveCount(0);
});
