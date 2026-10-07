import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('Review puts the request id in the address, and the address reopens it', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue$/);
  await page.getByRole('button', { name: 'Review request REQ-2026-1850' }).click();
  await expect(page.getByRole('dialog', { name: 'Review request REQ-2026-1850' })).toBeVisible();
  await expect(page).toHaveURL(/\/queue\/REQ-2026-1850$/);

  // Closing returns the address, and focus goes back to the Review that opened it.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole('button', { name: 'Review request REQ-2026-1850' })).toBeFocused();

  // The address alone opens it, a reload included.
  await page.goto('/queue/REQ-2026-1850');
  await expect(page.getByRole('dialog', { name: 'Review request REQ-2026-1850' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Review request REQ-2026-1850' })).toBeVisible();
});

test("View details puts the Employee's request id in the address, and the address reopens it", async ({ page }) => {
  await signIn(page, 'Maya Santos');
  await page.getByRole('link', { name: 'My Requests' }).click();
  await page.getByRole('button', { name: 'View details of REQ-2026-1847' }).click();
  const heading = page.getByRole('dialog').getByRole('heading', { name: 'REQ-2026-1847', exact: true }).first();
  await expect(heading).toBeVisible();
  await expect(page).toHaveURL(/\/requests\/REQ-2026-1847$/);

  await page.reload();
  await expect(heading).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/requests$/);

  // Opened from View details this time: closing hands focus back to it
  // (spec 007 scenario 2), though the panel opened through the address.
  const viewDetails = page.getByRole('button', { name: 'View details of REQ-2026-1847' });
  await viewDetails.click();
  await expect(heading).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(viewDetails).toBeFocused();

  // An id that is not one of hers opens nothing, says so, and settles on the list.
  await page.goto('/requests/REQ-2026-9999');
  await expect(page.getByText('That request is not available. It may not exist, or it may not be yours to view.')).toBeVisible();
  await expect(page).toHaveURL(/\/requests$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("a refusal toast's Review request keeps open the panel already showing that request", async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  const id = 'REQ-2026-1850';
  const review = page.getByRole('button', { name: `Review request ${id}` });
  const panel = page.getByRole('dialog', { name: `Review request ${id}` });

  // The approval is held, then refused.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/api\/requests\/[^/?]+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    await held;
    await route.fulfill({
      status: 409,
      contentType: 'application/problem+json',
      body: JSON.stringify({ title: 'Conflict', status: 409 }),
    });
  });

  await review.click();
  await panel.getByRole('button', { name: 'Approve Request' }).click();
  await expect(panel.getByRole('button', { name: 'Approving…' })).toBeVisible();

  // Closed mid-action, then reopened while the action is still running.
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await review.click();
  await expect(panel).toBeVisible();

  // The refusal lands in a toast; its way back leaves the panel open.
  release();
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/queue/${id}$`));
});
