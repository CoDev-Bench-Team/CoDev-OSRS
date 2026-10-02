import { expect, type Page } from '@playwright/test';
import { dismissDialog } from './session';

export type StockCheckpoint = { available: number; reserved: number; units: number };

/** Count Inventory rows for the asset this test created, at Davao.
 *  Total is Available + Reserved. Assigned and Inactive are out of Total.
 *  A negative count, or a row that is not one of the four statuses, fails. */
export async function expectDavaoStock(page: Page, assetName: string, expected: StockCheckpoint) {
  await dismissDialog(page);
  await page.getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible();
  await page.getByRole('searchbox', { name: /Search by item name/ }).fill(assetName);

  await expect
    .poll(async () => tally(await page.locator('[data-unit]').filter({ hasText: assetName }).allTextContents()))
    .toEqual({
      available: expected.available,
      reserved: expected.reserved,
      total: expected.available + expected.reserved,
      units: expected.units,
    });
}

function tally(texts: string[]) {
  let available = 0;
  let reserved = 0;
  let assigned = 0;
  let inactive = 0;
  for (const text of texts) {
    const davao = text.includes('Davao');
    if (!davao) throw new Error(`expected every row of this asset at Davao, saw: ${text}`);
    if (text.includes('Inactive')) inactive += 1;
    else if (text.includes('Reserved')) reserved += 1;
    else if (text.includes('Assigned')) assigned += 1;
    else if (text.includes('Available')) available += 1;
    else throw new Error(`row has no unit status: ${text}`);
    if (available < 0 || reserved < 0 || assigned < 0 || inactive < 0) {
      throw new Error('stock count is negative');
    }
  }
  const total = available + reserved;
  if (total < 0) throw new Error('total is negative');
  return { available, reserved, total, units: available + reserved + assigned + inactive };
}
