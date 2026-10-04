import { expect, test } from './fixtures/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import {
  addDavaoUnits,
  encodeAsset,
  signAccountabilityForm,
  openMine,
  openReview,
  reopenReview,
  setHandover,
  submitRequest,
} from './fixtures/supply';

const ASSET = 'E2E Pipeline Mouse';
const UNITS = 10;
const QTY = 3;

test('pickup path reserves, assigns on receipt, and completes when Maya signs', async ({ page }) => {
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
  await reopenReview(page, id);
  await expect(page.getByRole('dialog').getByText('Approved', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');
  await reopenReview(page, id);
  await expect(page.getByRole('dialog').getByText('Ready for Pickup', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, id);
  await setHandover(page, 'Received');
  await reopenReview(page, id);
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, id);
  await expect(page.getByRole('dialog').getByText('Received', { exact: true }).first()).toBeVisible();
  await signAccountabilityForm(page, 'Maya Santos');

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: 0, units: UNITS });
});
