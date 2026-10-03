import { expect, test } from './fixtures/test';
import { signIn, switchAccount } from './fixtures/session';
import { expectDavaoStock } from './fixtures/stock';
import { addDavaoUnits, encodeAsset, openMine, openReview, reopenReview, submitRequest } from './fixtures/supply';

const ASSET = 'E2E Reject Mouse';
const UNITS = 10;
const QTY = 3;
const REASON = 'Duplicate of last week';

test('an empty rejection changes nothing, and a reason releases the reservation', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, UNITS);

  await switchAccount(page, 'Maya Santos');
  const rejectedId = await submitRequest(page, ASSET, QTY);

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });
  await openReview(page, rejectedId);
  await page.getByRole('dialog').getByRole('button', { name: 'Reject Request' }).click();
  await page.getByRole('button', { name: 'Confirm Rejection' }).click();
  await expect(page.getByText('Enter a reason for rejecting this request.')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Pending Approval', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });

  await openReview(page, rejectedId);
  await page.getByRole('dialog').getByRole('button', { name: 'Reject Request' }).click();
  await page.getByRole('textbox', { name: /Reason for rejection/ }).fill(REASON);
  await page.getByRole('button', { name: 'Confirm Rejection' }).click();
  await reopenReview(page, rejectedId);
  await expect(page.getByRole('dialog').getByText('Rejected', { exact: true }).first()).toBeVisible();
  await expectDavaoStock(page, ASSET, { available: UNITS, reserved: 0, units: UNITS });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, rejectedId);
  await expect(page.getByRole('dialog').getByText(REASON)).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Rejected', { exact: true }).first()).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  const nextId = await submitRequest(page, ASSET, QTY);
  await openMine(page, rejectedId);
  await expect(page.getByRole('dialog').getByText('Rejected', { exact: true }).first()).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await openMine(page, nextId);
  await expect(page.getByRole('dialog').getByText('Pending Approval', { exact: true }).first()).toBeVisible();

  await switchAccount(page, 'Ethan Cruz');
  await expectDavaoStock(page, ASSET, { available: UNITS - QTY, reserved: QTY, units: UNITS });
});
