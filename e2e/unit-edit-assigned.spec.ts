import { expect, test } from './fixtures/test';
import { signIn } from './fixtures/session';
import { PEOPLE } from './fixtures/fake-api';

// Editing an Assigned unit's other details must not demand the assignee
// again, nor send it: sending it would reset the assigned date.
test('an Assigned unit is edited without re-picking or re-sending its assignee', async ({ page, api }) => {
  const unit = api.units.find((u) => u.status === 'Available')!;
  unit.status = 'Assigned';
  unit.assignedToId = PEOPLE['Maya Santos'].id;
  unit.assignedAt = '2026-01-14T00:00:00.000Z';

  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const row = page.locator('[data-unit]').filter({ hasText: unit.serialNumber! });
  await row.getByRole('button', { name: /^Review/ }).click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('textbox', { name: 'Price' }).fill('45000');

  const sent = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/api/inventory-items/'));
  await panel.getByRole('button', { name: 'Save Changes' }).click();
  const body = (await sent).postDataJSON() as Record<string, unknown>;
  expect(body).not.toHaveProperty('assignedToId');
  await expect(panel).toHaveCount(0);
  expect(unit.assignedAt).toBe('2026-01-14T00:00:00.000Z');
  expect(unit.assignedToId).toBe(PEOPLE['Maya Santos'].id);
});

// The unit read carries `assignedTo` but no `assignedToId` (contracts G6,
// 2026-10-06): the row names the assignee, and Review shows them chosen.
test('an Assigned unit shows its assignee in the row and in Review', async ({ page, api }) => {
  const unit = api.units.find((u) => u.status === 'Available')!;
  unit.status = 'Assigned';
  unit.assignedToId = PEOPLE['Maya Santos'].id;

  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Inventory' }).click();
  const row = page.locator('[data-unit]').filter({ hasText: unit.serialNumber! });
  // The API's "Maya " and "Santos" join with one space.
  await expect(row.getByText('Maya Santos', { exact: true })).toBeVisible();

  await row.getByRole('button', { name: /^Review/ }).click();
  await expect(page.getByRole('dialog').getByLabel('User', { exact: true })).toHaveValue('Maya Santos');
});
