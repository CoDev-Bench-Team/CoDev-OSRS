import { expect, test } from './fixtures/test';
import { PEOPLE } from './fixtures/fake-api';
import { dismissDialog, signIn } from './fixtures/session';

test('a signed-out visitor sees sign-in; a restored session reaches what its role may use', async ({ page, api }) => {
  await page.goto('/inventory');
  await expect(page.getByText('Great to have you with us!')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inventory' })).toHaveCount(0);
  // No demo chooser: the only way in is the API's session.
  await expect(page.getByRole('radio')).toHaveCount(0);

  // The API now has a session (as after Google sign-in); a load restores it.
  api.current = PEOPLE['Ethan Cruz'];
  await page.goto('/inventory');
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  api.current = PEOPLE['Maya Santos'];
  await page.goto('/inventory');
  await expect(page.getByText('This screen belongs to another role')).toBeVisible();
  await page.getByRole('button', { name: 'Go to Catalog' }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test('an Employee is refused the Admin destinations, and an unknown address is not that refusal', async ({ page }) => {
  await signIn(page, 'Maya Santos');
  for (const path of ['/queue', '/assets', '/inventory', '/history']) {
    await page.goto(path);
    await expect(page.getByText('This screen belongs to another role')).toBeVisible();
    await expect(page.getByText(/You are signed in as Employee/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to Catalog' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Go to Catalog' }).click();
  await expect(page).toHaveURL(/\/catalog$/);

  await page.goto('/requests');
  await page.getByRole('button', { name: 'View details of REQ-2026-1847' }).click();
  const panel = page.getByRole('dialog');
  await expect(panel.getByRole('button', { name: 'Cancel Request' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Approve Request' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Reject Request' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await dismissDialog(page);

  await page.getByRole('button', { name: /Maya Santos/ }).click();
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();

  await page.goto('/not-a-real-screen');
  await expect(page.getByText('There is no screen at this address')).toBeVisible();
  await expect(page.getByText('This screen belongs to another role')).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to Your Home Screen' }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test('an Admin is refused My Requests, can open the catalog without requesting, and can open Profile', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.goto('/requests');
  await expect(page.getByText('This screen belongs to another role')).toBeVisible();
  await expect(page.getByText(/You are signed in as Admin/)).toBeVisible();
  await page.getByRole('button', { name: 'Go to Requests Queue' }).click();
  await expect(page).toHaveURL(/\/queue$/);

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Supply Catalog', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Request List' })).toHaveCount(0);

  await page.goto('/queue');
  await page.getByRole('searchbox', { name: 'Search requests' }).fill('REQ-2026-1847');
  await page.getByRole('button', { name: 'Review request REQ-2026-1847' }).click();
  const panel = page.getByRole('dialog');
  await expect(panel.getByRole('button', { name: 'Approve Request' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Reject Request' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Sign accountability form' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await dismissDialog(page);

  await page.getByRole('button', { name: /Ethan Cruz/ }).click();
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();

  await page.goto('/not-a-real-screen');
  await expect(page.getByText('There is no screen at this address')).toBeVisible();
  await expect(page.getByText('This screen belongs to another role')).toHaveCount(0);
});

test('`/` lands an Admin on the Requests Queue tab', async ({ page, api }) => {
  api.current = PEOPLE['Ethan Cruz'];
  await page.goto('/');
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole('link', { name: 'Requests Queue' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Requests Queue', level: 1 })).toBeVisible();
});

test('an Admin who signs in from `/` lands on the Requests Queue tab', async ({ page, api }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  // The API now has a session, as after Google sign-in; sign-in still holds `/` as where the visitor was going.
  api.current = PEOPLE['Ethan Cruz'];
  await page.reload();
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole('link', { name: 'Requests Queue' })).toHaveAttribute('aria-current', 'page');
});
