import { expect, test } from './fixtures/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import { addDavaoUnits, encodeAsset, openMine, openReview, reopenReview, setHandover, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Cancel Mouse';
const UNITS = 10;
const QTY = 3;

test('Maya and Ethan each cancel with a reason, and an empty reason changes nothing', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, UNITS);

  await switchAccount(page, 'Maya Santos');
  const pendingId = await submitRequest(page, ASSET, QTY);
  await openMine(page, pendingId);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' }).click();
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await expect(page.getByText('Enter a reason for cancelling this request.')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Pending Approval', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, pendingId);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' }).click();
  await page.getByRole('textbox', { name: /Reason for cancellation/ }).fill('I no longer need it');
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await expect(page.getByRole('dialog').getByText('Cancelled', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  const approvedId = await submitRequest(page, ASSET, QTY);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, approvedId);
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await reopenReview(page, approvedId);
  await expect(page.getByRole('dialog').getByText('Approved', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Maya Santos');
  await openMine(page, approvedId);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' })).toHaveCount(0);

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });
  await openReview(page, approvedId);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' }).click();
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await expect(page.getByText('Enter a reason for cancelling this request.')).toBeVisible();
  await page.getByRole('textbox', { name: /Reason for cancellation/ }).fill('Cannot be fulfilled');
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await reopenReview(page, approvedId);
  await expect(page.getByRole('dialog').getByText('Cancelled', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  const pickupId = await submitRequest(page, ASSET, QTY);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, pickupId);
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await reopenReview(page, pickupId);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');
  await reopenReview(page, pickupId);
  await expect(page.getByRole('dialog').getByText('Ready for Pickup', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, pickupId);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' }).click();
  await page.getByRole('textbox', { name: /Reason for cancellation/ }).fill('Pickup cannot be made');
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await reopenReview(page, pickupId);
  await expect(page.getByRole('dialog').getByText('Cancelled', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS, reserved: 0, units: UNITS });
});
