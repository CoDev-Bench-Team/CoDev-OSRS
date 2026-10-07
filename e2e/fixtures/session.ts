import { expect, type Page } from '@playwright/test';
import { PEOPLE, type Person } from './fake-api';
import { apiFor } from './test';

export type DemoPerson = Person;

/** Sign `who` in. There is no seeded chooser and no Google in the suite: the
 *  fake API's session is set, and the app restores it from `GET /auth/me`, as
 *  it does after a real Google sign-in. */
export async function signIn(page: Page, who: DemoPerson) {
  apiFor(page).current = PEOPLE[who];
  await page.goto('/login');
  await expect(page).not.toHaveURL(/\/login/);
}

/** The review sheet is modal, so the top bar cannot be clicked while it is open. */
export async function dismissDialog(page: Page) {
  const dialog = page.getByRole('dialog');
  if ((await dialog.count()) === 0) return;
  // The sheet icon and a footer labelled Close share the accessible name.
  await dialog.locator('button[aria-label="Close"]').click();
  await expect(dialog).toBeHidden();
}

/** Sign out through the app, then sign in as someone else. */
export async function switchAccount(page: Page, who: DemoPerson) {
  await dismissDialog(page);
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, who);
}
