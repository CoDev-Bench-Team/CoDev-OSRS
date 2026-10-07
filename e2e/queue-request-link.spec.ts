import { expect, test } from './fixtures/test';
import { signIn, switchAccount } from './fixtures/session';
import { addDavaoUnits, encodeAsset, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Link Headset';

test("an email's View request opens the Admin's review panel at /queue/:id", async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 4);
  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 1);
  await switchAccount(page, 'Ethan Cruz');

  // The email links to /requests/:id; an Admin is sent on to /queue/:id.
  await page.goto(`/requests/${id}`);
  await expect(page).toHaveURL(new RegExp(`/queue/${id}$`));
  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();
  await expect(panel.getByText(id).first()).toBeVisible();

  // The address opens it directly, a reload included.
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Closing the panel leaves the address for the queue's own.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/queue$/);

  // A request that does not exist opens nothing and says so on the queue.
  await page.goto('/queue/REQ-2026-9999');
  await expect(page.getByText('That request is not available. It may not exist.')).toBeVisible();
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('an Employee is refused /queue/:id', async ({ page }) => {
  await signIn(page, 'Maya Santos');
  await page.goto('/queue/REQ-2026-1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('This screen belongs to another role')).toBeVisible();
});
