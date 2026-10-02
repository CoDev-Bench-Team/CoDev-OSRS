import { expect, test } from '@playwright/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import { addDavaoUnits, encodeAsset, openReview, setHandover, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Delivery Mouse';
const UNITS = 10;
const QTY = 3;

test('For Delivery leaves stock unchanged, cannot be cancelled, and can move to pickup', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, UNITS);

  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, QTY);

  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Update Status' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Approve Request' }).click();
  await setHandover(page, 'For Delivery');
  await expect(page.getByRole('dialog').getByText('For Delivery', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' })).toHaveCount(0);
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');
  await expect(page.getByRole('dialog').getByText('Ready for Pickup', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });
});
