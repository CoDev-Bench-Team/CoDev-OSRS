import { expect, test } from './fixtures/test';
import { signIn, switchAccount } from './fixtures/session';
import { addDavaoUnits, encodeAsset, openReview, setHandover, settle, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Toast Mouse';

test('a review action runs in the open panel and shows how it ended there, with no toast', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 4);
  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 1);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);

  // Slow the API so the in-flight state can be seen.
  api.listDelayMs = 800;
  const panel = page.getByRole('dialog', { name: `Review request ${id}` });
  await panel.getByRole('button', { name: 'Approve Request' }).click();

  // The panel stays, names the work and is busy; no toast.
  await expect(panel.getByRole('button', { name: 'Approving…' })).toBeDisabled();
  await expect(page.locator('dialog[aria-busy="true"]')).toHaveCount(1);
  await expect(page.locator('li').filter({ hasText: `Approving ${id}` })).toHaveCount(0);

  // It ends in the panel: the outcome, and the request's new status.
  await expect(panel.getByRole('status').filter({ hasText: `${id} approved` })).toBeVisible({ timeout: 5000 });
  await expect(panel.getByText('The employee will receive an email with your decision.').first()).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Update Status' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: `${id} approved` })).toHaveCount(0);
});

test('closing the panel while an action runs hands it to a toast', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 4);
  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 1);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);

  api.listDelayMs = 1200;
  const panel = page.getByRole('dialog', { name: `Review request ${id}` });
  await panel.getByRole('button', { name: 'Approve Request' }).click();
  await expect(panel.getByRole('button', { name: 'Approving…' })).toBeVisible();

  // The Admin leaves; the work carries on and a toast takes over.
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: `Approving ${id}` })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: `${id} approved` })).toBeVisible({ timeout: 5000 });
});

test('an empty reason is still caught in the panel, before anything is sent', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 4);
  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 1);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);

  await page.getByRole('dialog').getByRole('button', { name: 'Reject Request' }).click();
  await page.getByRole('button', { name: 'Confirm Rejection' }).click();
  await expect(page.getByText('Enter a reason for rejecting this request.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: `Rejecting ${id}` })).toHaveCount(0);
});

test('reopening a request with Review after a status change shows its new status and timeline', async ({ page, api }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 4);
  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 1);
  await switchAccount(page, 'Ethan Cruz');

  // Every step reopens the panel with Review, never with a page load, against
  // an API as slow as the live one.
  api.listDelayMs = 1500;
  await openReview(page, id);
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await settle(page);
  await page.getByRole('button', { name: `Review request ${id}` }).click();
  // Long enough in the panel for its own full read to land, as when someone
  // reads it before acting: that read is what used to linger on reopen.
  await page.waitForTimeout(2000);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');

  await page.getByRole('button', { name: `Review request ${id}` }).click();
  const panel = page.getByRole('dialog', { name: `Review request ${id}` });
  // At once, from the refreshed row, before the panel's own read (1.5s) can
  // land: never the copy read before the change.
  await expect(panel.locator('li[data-state="reached"]').filter({ hasText: 'Ready for Pickup' })).toHaveCount(1, {
    timeout: 1000,
  });
  // And still so once that read lands.
  await page.waitForTimeout(2000);
  await expect(panel.locator('li[data-state="reached"]').filter({ hasText: 'Ready for Pickup' })).toHaveCount(1);
  await expect(panel.getByRole('button', { name: 'Approve Request' })).toHaveCount(0);
});
