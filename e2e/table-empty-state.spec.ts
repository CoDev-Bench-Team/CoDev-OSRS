import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('an empty filter never reports an empty register while the next page loads', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const rows = page.locator('[data-unit]');
  await expect(rows.first()).toBeVisible();
  const chips = page.getByRole('group', { name: /Filter by/ });

  // No unit is assigned: the filter is empty, and says so.
  await chips.getByRole('button', { name: /^Assigned/ }).click();
  await expect(page.getByText('No unit matches that search')).toBeVisible();
  // Nothing to page through: no page-size choice.
  await expect(page.getByLabel('Result per page')).toHaveCount(0);

  // Record any moment the table claims the register is empty.
  await page.evaluate(() => {
    const seen = { register: false };
    (window as unknown as { __seen: typeof seen }).__seen = seen;
    new MutationObserver(() => {
      if (document.body.textContent?.includes('No units in the register yet')) seen.register = true;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  api.listDelayMs = 1200;
  await chips.getByRole('button', { name: /^All items/ }).click();

  // While All loads, the empty Assigned answer is not presented as All's.
  await expect(page.getByText('No unit matches that search')).toBeHidden();
  await expect(rows.first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByLabel('Result per page')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __seen: { register: boolean } }).__seen.register)).toBe(false);
});
