import { expect, test } from '@playwright/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import { addDavaoUnits, encodeAsset, openMine, openReview, setHandover, signAccountability, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Receipt Mouse';
const UNITS = 10;
const QTY = 3;

test('a request Maya does not own reads the same as one that does not exist', async ({ page }) => {
  await signIn(page, 'Maya Santos');
  await page.goto('/requests/REQ-2026-1850');
  await expect(page.getByText('That request is not available. It may not exist, or it may not be yours to view.')).toBeVisible();
  await page.goto('/requests/REQ-2026-9999');
  await expect(page.getByText('That request is not available. It may not exist, or it may not be yours to view.')).toBeVisible();
});

test('Maya marks her own handover received, and a second signature is refused', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, UNITS);

  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, QTY);
  await openMine(page, id);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Mark as Received' })).toHaveCount(0);

  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await setHandover(page, 'Ready for Pickup', 'Davao Office');

  await switchAccount(page, 'Maya Santos');
  await openMine(page, id);
  await page.getByRole('dialog').getByRole('button', { name: 'Mark as Received' }).click();
  await page.getByRole('button', { name: 'Confirm Received' }).click();
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, id);
  await signAccountability(page, 'Maya Santos');
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Sign accountability form' })).toHaveCount(0);

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });
});
