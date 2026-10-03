import { expect, type Locator, type Page } from '@playwright/test';

const CATEGORIES = ['Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices'] as const;
const OFFICES = ['Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao'] as const;
const PICKUP = ['Cebu Office', 'Bacolod Office', 'Makati Office', 'Ortigas Office', 'Davao Office', 'Other…'] as const;

/** The overlay listbox repositions while it opens, so a click on an option
 *  detaches. ArrowDown opens it. The pointer is moved away first: the list
 *  highlights whichever option it opens under, and Enter would commit that. */
async function choose(page: Page, combobox: Locator, option: string, options: readonly string[]) {
  if (!options.includes(option)) throw new Error(`no option ${option}`);
  await page.mouse.move(0, 0);
  await combobox.focus();
  await combobox.press('ArrowDown');
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Home');
  const row = page.getByRole('option', { name: option, exact: true });
  // Step until the option is active rather than counting presses: a press
  // that lands while the list is still opening (an API response re-renders
  // the panel) is otherwise lost and the count ends one short.
  for (let i = 0; i <= options.length && (await row.getAttribute('data-active')) !== 'true'; i++) {
    await page.keyboard.press('ArrowDown');
  }
  await expect(row).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Enter');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  await expect(combobox).toContainText(option);
}

/** Encode a Headset asset. The API requires a model on every category
 *  (contracts conflict 9), and Headset is a form that draws one. */
export async function encodeAsset(page: Page, name: string) {
  await page.getByRole('link', { name: 'Assets' }).click();
  await expect(page.getByRole('heading', { name: 'Assets', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '+ Add Asset' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /Item Name/ }).fill(name);
  await choose(page, dialog.getByRole('combobox', { name: 'Category' }), 'Headset', CATEGORIES);
  await dialog.getByRole('textbox', { name: /^Model/ }).fill(`${name} Model`);
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  await expect(dialog).toBeHidden();
}

/** Add `count` Available units of `name` at Davao, each with a serial (Headset
 *  requires one). The office control opens on Cebu. */
export async function addDavaoUnits(page: Page, name: string, count: number) {
  await page.getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '+ Add Inventory' }).click();
  await page.getByRole('menuitem', { name: 'Add Multiple Units' }).click();
  const dialog = page.getByRole('dialog');
  const search = dialog.getByPlaceholder('Search catalog item name or code');
  await expect(search).toBeEnabled();
  await search.fill(name);
  await page.getByRole('option', { name: new RegExp(name) }).click();
  // The office first: it sits above the unit rows, and scrolling back up to it
  // after filling them closes its list as it opens.
  await choose(page, dialog.getByRole('combobox', { name: 'Office' }), 'Davao', OFFICES);
  for (let i = 1; i < count; i++) await dialog.getByRole('button', { name: 'Add a unit' }).click();
  for (let i = 0; i < count; i++) {
    await dialog.getByRole('group', { name: `Unit ${i + 1}` }).getByRole('textbox').first().fill(`${name}-${i + 1}`);
  }
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  await expect(dialog).toBeHidden();
}

/** Maya adds `qty` and submits. Returns the new request id. */
export async function submitRequest(page: Page, name: string, qty: number): Promise<string> {
  await page.getByRole('link', { name: 'Catalog' }).click();
  await page.getByPlaceholder('Search supplies by name or category').fill(name);
  const card = page.locator('div').filter({ has: page.getByRole('button', { name: `View specs for ${name}` }) }).last();
  await expect(card.getByRole('button', { name: 'Add to Request List' })).toBeVisible();
  for (let i = 1; i < qty; i++) await card.getByRole('button', { name: 'Increase quantity' }).click();
  await card.getByRole('button', { name: 'Add to Request List' }).click();
  const marker = page.locator('[data-request-list-marker]');
  await expect(marker).toContainText('1');
  await marker.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Submit Request' }).click();
  const heading = dialog.getByRole('heading', { name: /REQ-2026-/ });
  await expect(heading).toBeVisible();
  const id = (await heading.textContent())?.trim() ?? '';
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
  return id;
}

export async function openReview(page: Page, id: string) {
  await page.getByRole('link', { name: 'Requests Queue' }).click();
  await page.getByRole('searchbox', { name: 'Search requests' }).fill(id);
  await page.getByRole('button', { name: `Review request ${id}` }).click();
  await expect(page.getByRole('dialog', { name: `Review request ${id}` })).toBeVisible();
}

/** An Admin's review action runs with the panel open, which names it while
 *  it runs and then shows how it ended (spec 008 FR-013, amended 2026-10-03).
 *  Waits for it to land, fails on a refusal, then closes the panel so the
 *  next step starts from the queue. Any toast still loading must land too. */
export async function settle(page: Page) {
  await expect(page.locator('dialog[aria-busy="true"]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('li[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: /could not be/ })).toHaveCount(0);
  const panel = page.getByRole('dialog', { name: /^Review request / });
  if (await panel.count()) {
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  }
}

/** Once the action has landed, opens the request again at its own address,
 *  `/queue/:id` (spec 008 FR-001b): the review panel for a live request,
 *  History's read-only panel for a resolved one. */
export async function reopenReview(page: Page, id: string) {
  await settle(page);
  await page.goto(`/queue/${id}`);
  await expect(page.getByRole('dialog').getByRole('heading', { name: id, exact: true }).first()).toBeVisible();
}

export async function openMine(page: Page, id: string) {
  await page.getByRole('link', { name: 'My Requests' }).click();
  await page.getByRole('button', { name: `View details of ${id}` }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: id, exact: true }).first()).toBeVisible();
}

/** Update Status, then the confirmation. `pickup` is the location label, such as "Davao Office".
 *  Ready for Pickup is the second option both from Approved and from For Delivery.
 *  For Delivery (from Approved) and Received (from either handover) are the first. */
export async function setHandover(page: Page, status: string, pickup?: string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Update Status' }).click();
  const options = status === 'Ready for Pickup' ? ['For Delivery', 'Ready for Pickup'] : [status];
  await choose(page, dialog.getByRole('combobox', { name: 'Status' }), status, options);
  if (pickup) await choose(page, dialog.getByRole('combobox', { name: 'Pickup location' }), pickup, PICKUP);
  await dialog.getByRole('form', { name: 'Update status' }).getByRole('button', { name: 'Update Status' }).click();
  const ask = page.getByRole('alertdialog', { name: 'Update status?' });
  await ask.getByRole('button', { name: 'Confirm' }).click();
  await expect(ask).toBeHidden();
  await settle(page);
}

/** Sign is withheld while the published `/sign` completes the request
 *  (spec 017 Story 4, contracts conflict 12): the owner of a `Received`
 *  request sees why, and no sign control. */
export async function expectSignWithheld(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Signing is not available yet.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Sign accountability form' })).toHaveCount(0);
}
