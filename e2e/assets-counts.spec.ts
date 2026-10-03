import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('Assets reads its rows and every stock chip count with one asset list call', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  const calls: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/assets') calls.push(url.search);
  });

  await page.getByRole('link', { name: 'Assets' }).click();
  const chips = page.getByRole('group', { name: /Filter by/ });
  await expect(page.getByRole('button', { name: 'Business Laptop' })).toBeVisible();
  await expect(chips.getByRole('button', { name: 'All items (1)' })).toBeVisible();
  await expect(chips.getByRole('button', { name: 'In stock (1)' })).toBeVisible();
  await expect(chips.getByRole('button', { name: 'Low stock (0)' })).toBeVisible();
  await expect(chips.getByRole('button', { name: 'Out of stock (0)' })).toBeVisible();
  expect(calls).toHaveLength(1);

  // A chip asks for its page once; every chip keeps its number.
  await chips.getByRole('button', { name: 'Low stock (0)' }).click();
  await expect(page.getByRole('button', { name: 'Business Laptop' })).toHaveCount(0);
  await expect(chips.getByRole('button', { name: 'In stock (1)' })).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[1]).toContain('stockLevel=low_stock');
});
