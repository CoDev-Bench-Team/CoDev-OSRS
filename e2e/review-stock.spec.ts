import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';
import { openReview } from './fixtures/supply';

// A pending request's own units are Reserved, not Available. CURRENT
// INVENTORY counts them back in, so a request holding the last unit reads
// "1 in stock", not "0 in stock" (spec 008 FR-004, amended 2026-10-03).
test('CURRENT INVENTORY counts the units the request itself holds', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');

  // Davao: 6 laptops, 1 reserved by this request, 5 Available → 6.
  await openReview(page, 'REQ-2026-1847');
  await expect(page.getByRole('dialog').getByText('6 in stock')).toBeVisible();
  await page.keyboard.press('Escape');

  // Cebu: 2 laptops, 1 reserved by this request, 1 Available → 2.
  await openReview(page, 'REQ-2026-1850');
  await expect(page.getByRole('dialog').getByText('2 in stock')).toBeVisible();
});
