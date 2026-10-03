import { expect, hold, test } from './fixtures/test';

test('the sign-in control is disabled, not a skeleton, until the session is known', async ({ page }) => {
  // Hold the session check so the not-ready state stays on screen.
  const release = await hold(page, '**/auth/me');

  await page.goto('/login');
  const button = page.getByRole('button', { name: 'Sign in with Google' });
  await expect(button).toBeDisabled();
  await expect(page.getByText('Great to have you with us!')).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);

  release();
  await expect(button).toBeEnabled();
});
