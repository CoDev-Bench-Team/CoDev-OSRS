import { expect, test } from '@playwright/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import { addDavaoUnits, encodeAsset, openMine, openReview, setHandover, signAccountability, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Pipeline Mouse';
const UNITS = 10;
const QTY = 3;

test('pickup path reserves, assigns on receipt, and completes only after the signature', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, UNITS);
  await expectDavaoStock(page, ASSET, { available: UNITS, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, QTY);

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await expect(page.getByRole('dialog').getByText('Pending Approval', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await expect(page.getByRole('dialog').getByText('Approved', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');
  await expect(page.getByRole('dialog').getByText('Ready for Pickup', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await setHandover(page, 'Received');
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, id);
  await signAccountability(page, 'Maya Santos');
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });
  await openReview(page, id);
  await page.getByRole('dialog').getByRole('button', { name: 'Complete' }).click();
  await expect(page.getByRole('dialog').getByText('Completed', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });

  await page.getByRole('link', { name: 'History' }).click();
  await page.getByRole('searchbox', { name: 'Search history' }).fill(id);
  await expect(page.getByRole('button', { name: `Review request ${id}` })).toBeVisible();
});
