import { test } from './fixtures/test';
import { recordNotification } from './fixtures/gaps';
import { signIn, switchAccount } from './fixtures/session';
import {
  addDavaoUnits,
  encodeAsset,
  signAccountabilityForm,
  openMine,
  openReview,
  reopenReview,
  setHandover,
  settle,
  submitRequest,
} from './fixtures/supply';

const ASSET = 'E2E Notice Mouse';

test('each transition records the template the product exposes, including Maya’s cancel', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await encodeAsset(page, ASSET);
  await addDavaoUnits(page, ASSET, 10);

  await switchAccount(page, 'Maya Santos');
  const id = await submitRequest(page, ASSET, 3);
  await recordNotification(page, {
    template: 'Request received',
    detail: 'Submit to Pending Approval, for the Employee and the Admin queue.',
  });

  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, id);
  await page.getByRole('button', { name: 'Approve Request' }).click();
  await settle(page);
  await recordNotification(page, {
    template: 'Request approved',
    detail: 'Pending Approval to Approved.',
    includes: ['Pending Approval', 'Approved'],
  });

  await reopenReview(page, id);
  await setHandover(page, 'For Delivery');
  await recordNotification(page, {
    template: 'Status changed',
    detail: 'Approved to For Delivery.',
    includes: ['Approved', 'For Delivery'],
  });

  await reopenReview(page, id);
  await setHandover(page, 'Ready for Pickup', 'Davao Office');
  await recordNotification(page, {
    template: 'Status changed',
    detail: 'For Delivery to Ready for Pickup, carrying the pickup location.',
    includes: ['For Delivery', 'Ready for Pickup', 'Davao Office'],
  });

  await reopenReview(page, id);
  await setHandover(page, 'Received');
  await recordNotification(page, {
    template: 'Status changed',
    detail: 'Ready for Pickup to Received.',
    includes: ['Ready for Pickup', 'Received'],
  });

  await switchAccount(page, 'Maya Santos');
  await openMine(page, id);
  await signAccountabilityForm(page, 'Maya Santos');
  await recordNotification(page, {
    template: 'Status changed',
    detail: 'Received to Completed, when Maya signs the Accountability Form.',
    includes: ['Received', 'Completed'],
  });

  await switchAccount(page, 'Maya Santos');
  const declined = await submitRequest(page, ASSET, 3);
  await switchAccount(page, 'Ethan Cruz');
  await openReview(page, declined);
  await page.getByRole('dialog').getByRole('button', { name: 'Reject Request' }).click();
  await page.getByRole('textbox', { name: /Reason for rejection/ }).fill('Not required');
  await page.getByRole('button', { name: 'Confirm Rejection' }).click();
  await settle(page);
  await recordNotification(page, {
    template: 'Request declined',
    detail: 'Pending Approval to Rejected.',
    includes: ['Pending Approval', 'Rejected'],
  });

  await switchAccount(page, 'Maya Santos');
  const cancelled = await submitRequest(page, ASSET, 3);
  await openMine(page, cancelled);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Request' }).click();
  await page.getByRole('textbox', { name: /Reason for cancellation/ }).fill('Ordered by mistake');
  await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
  await recordNotification(page, {
    template: 'Status changed',
    detail: 'Employee cancel from Pending Approval to Cancelled, recorded for the Employee and the Admin queue.',
    includes: ['Pending Approval', 'Cancelled'],
  });
});
