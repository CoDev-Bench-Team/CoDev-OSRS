import { expect, hold, test } from './fixtures/test';
import { signIn } from './fixtures/session';

test('Update Asset disables every field and the panel scrolling while Save Changes is in flight', async ({ page }) => {
  await signIn(page, 'Ethan Cruz');
  await page.getByRole('link', { name: 'Assets' }).click();
  await page.getByRole('button', { name: 'Business Laptop' }).click();
  await page.getByRole('button', { name: 'Update Asset' }).click();
  const panel = page.getByRole('dialog');
  const name = panel.getByRole('textbox', { name: /Item Name/ });
  await expect(name).toBeEnabled();

  // Hold the save so the saving state stays on screen.
  const release = await hold(page, '**/api/assets/*', 'PATCH');

  // Control: before saving, the same wheel does scroll the body.
  const scroller = panel.locator('form').locator('..');
  await scroller.hover();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await scroller.evaluate((el) => el.scrollTo(0, 0));

  await name.fill('Business Laptop Pro');
  await panel.getByRole('button', { name: 'Save Changes' }).click();
  await expect(panel.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  const fields = await panel.locator('input, textarea, button').filter({ visible: true }).all();
  // Item Name, Model, Description, five specs, the threshold, Category and the image controls.
  expect(fields.length).toBeGreaterThan(8);
  for (const field of fields) {
    const label = (await field.getAttribute('aria-label')) ?? (await field.textContent()) ?? '';
    // The panel's own close control sits outside the form and stays usable.
    if (/close/i.test(label)) continue;
    await expect(field).toBeDisabled();
  }

  // The body does not scroll while saving.
  // The panel's scrolling body: the form's parent.
  const body = panel.locator('form').locator('..');
  await expect(body).toHaveCSS('overflow-y', 'hidden');
  const before = await body.evaluate((el) => el.scrollTop);
  await body.hover();
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  expect(await body.evaluate((el) => el.scrollTop)).toBe(before);

  release();
  await expect(page.getByRole('button', { name: 'Business Laptop Pro' })).toBeVisible();
});
