import { expect, test, type Page } from '@playwright/test';

const TEMPLATE = /Request received|Request approved|Request declined|Status changed/;

/** Where the product shows a notification record, it has to match `template`
 *  and every string in `includes`. Where it shows nothing, the run records the
 *  gap and does not invent an inbox. */
export async function recordNotification(
  page: Page,
  expected: { template: string; includes?: readonly string[]; detail: string },
) {
  const hits = page.getByText(TEMPLATE);
  if ((await hits.count()) === 0) {
    test.info().annotations.push({
      type: 'notification-gap',
      description: `No notification record is exposed. Expected “${expected.template}”. ${expected.detail}`,
    });
    return;
  }
  const text = (await hits.allTextContents()).join('\n');
  expect(text, expected.detail).toContain(expected.template);
  for (const part of expected.includes ?? []) expect(text, expected.detail).toContain(part);
}
