import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('a search with text shows a clear button that empties it and keeps focus', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  const search = page.getByRole('searchbox', { name: 'Search requests' });
  const clear = page.getByRole('button', { name: 'Clear search' });
  await expect(search).toBeVisible();
  await expect(clear).toHaveCount(0);

  await search.fill('nobody-matches-this');
  await expect(clear).toBeVisible();
  await expect(page.getByText('No requests match the current search and status filter.')).toBeVisible();

  await clear.click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(clear).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Review request/ }).first()).toBeVisible();

  // The same control on another table.
  await page.getByRole('link', { name: 'Assets' }).click();
  const assets = page.getByRole('searchbox', { name: 'Search by item name or model' });
  await assets.fill('zzz');
  await expect(page.getByRole('button', { name: 'Business Laptop' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(assets).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Business Laptop' })).toBeVisible();
});
