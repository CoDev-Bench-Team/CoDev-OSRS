import { expect, test } from './fixtures/test';
import { PEOPLE } from './fixtures/fake-api';
import { signIn } from './fixtures/session';

test('Refresh re-reads the queue on screen and keeps its rows while it runs', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByText('REQ-2026-1850')).toBeVisible();

  api.listDelayMs = 800;
  const laptop = api.assets[0]!;
  const added = api.submit(PEOPLE['Samantha Reyes'], { items: [{ assetId: laptop.id, quantity: 1 }] });

  await page.getByRole('button', { name: 'Refresh' }).click();
  // Running: the button says so and the rows already on screen stay.
  await expect(page.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  await expect(page.getByText('REQ-2026-1850')).toBeVisible();

  await expect(page.getByText(added.displayId)).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeEnabled();
});

test('a failed Refresh keeps the rows and says so', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await expect(page.getByText('REQ-2026-1850')).toBeVisible();

  await page.route(/\/api\/requests(\/counts)?(\?|$)/, (route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ title: 'Server error', status: 500 }) }),
  );
  await page.getByRole('button', { name: 'Refresh' }).click();

  await expect(page.getByText("The queue couldn't be refreshed")).toBeVisible();
  await expect(page.getByText('REQ-2026-1850')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeEnabled();
});
