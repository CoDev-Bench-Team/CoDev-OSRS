import { expect, type Page } from '@playwright/test';

export type DemoPerson = 'Maya Santos' | 'Ethan Cruz';

/** The first sign-in of a test. One document load; later people use `switchAccount`. */
export async function signIn(page: Page, who: DemoPerson) {
  await page.goto('/login');
  await chooseAccount(page, who);
}

/** The review sheet is modal, so the top bar cannot be clicked while it is open. */
export async function dismissDialog(page: Page) {
  const dialog = page.getByRole('dialog');
  if ((await dialog.count()) === 0) return;
  // The sheet icon and a footer labelled Close share the accessible name.
  await dialog.locator('button[aria-label="Close"]').click();
  await expect(dialog).toBeHidden();
}

/** Sign out and sign in as someone else without loading the document again. */
export async function switchAccount(page: Page, who: DemoPerson) {
  await dismissDialog(page);
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await chooseAccount(page, who);
}

async function chooseAccount(page: Page, who: DemoPerson) {
  await page.getByRole('radio', { name: new RegExp(who) }).check();
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
