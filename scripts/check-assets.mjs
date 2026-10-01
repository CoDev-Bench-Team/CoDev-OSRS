/** BEN-48 — Assets against spec 014's acceptance. Runs through the same CDP
 *  client as the other gates.
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173. Every run
 *  starts from a fresh document, so the seeded store is back to its seed.
 *
 *  A step that times out is a failed check, not a crash; anything that still
 *  throws is counted as one more failure, and the summary always prints. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) console.log(`  ✓ ${m}`);
  else {
    failures++;
    console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
  }
};

const cdp = await connect();
await cdp.setViewport(1440, 1024);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Polls `predicate(arg)` in the page; resolves false on timeout instead of
 *  throwing, so the caller records it and the run goes on. */
const until = async (predicate, arg, timeout = 5000) => {
  const started = Date.now();
  while (!(await cdp.evaluate(predicate, arg))) {
    if (Date.now() - started > timeout) return false;
    await wait(100);
  }
  return true;
};
const panelOpen = () => until(() => !!document.querySelector('dialog[open]'));
const panelClosed = () => until(() => !document.querySelector('dialog[open]'));
const panelTitled = (title) => until((t) => document.querySelector('dialog[open] h2')?.textContent.trim() === t, title);

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

const key = async (k, code, vk, text) => {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};

const clickAt = async ({ x, y }) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};

/** Chip label → count, e.g. `{ 'All items': 16, 'In stock': 9, … }`. */
const chips = () =>
  cdp.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[aria-label="Filter by stock status"] button')].map((b) => {
        const m = b.textContent.trim().match(/^(.*?)\s*\(?(\d+)\)?$/);
        return [m[1], Number(m[2])];
      }),
    ),
  );

/** Types into a React-controlled field in the open panel. */
const type = (selector, value) =>
  cdp.evaluate(
    ({ selector, value }) => {
      const input = document.querySelector(`dialog[open] ${selector}`);
      const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
      set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    { selector, value },
  );

const pressInPanel = (label) =>
  cdp.evaluate(
    (label) =>
      [...document.querySelectorAll('dialog[open] button')]
        .find((b) => b.textContent.trim() === label || b.getAttribute('aria-label')?.startsWith(label))
        .click(),
    label,
  );

const panelText = () => cdp.evaluate(() => document.querySelector('dialog[open]')?.textContent ?? '');
const rowNames = () => cdp.evaluate(() => [...document.querySelectorAll('[aria-label="Assets table"] button')].map((b) => b.textContent.trim()));
const staleNotice = () => cdp.evaluate(() => document.querySelector('main').textContent.includes('Saved, but the list could not be refreshed'));

try {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate(() => {
    document.querySelector('input[value="ethan.cruz"]').click();
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  });
  await cdp.waitFor(() => location.pathname !== '/login', 8000, 'the admin landing');
  await go('/assets');
  await cdp.waitFor(() => document.querySelectorAll('[aria-label="Assets table"] button').length > 0, 8000, 'the asset rows');

  console.log('Story 1 AC1 — columns and chip counts derived by D11');
  const seed = await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    const { assetStockStatus } = await import('/src/features/assets/stock.ts');
    const all = await seededAssetSource.list();
    const by = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 };
    for (const a of all) by[assetStockStatus(a)] += 1;
    const header = [...document.querySelectorAll('[aria-label="Assets table"] span.type-eyebrow')].map((s) => s.textContent.trim());
    return { total: all.length, by, header };
  });
  check(
    seed.header.join(' · ') === 'ITEM NAME · CATEGORY · MODEL · AVAILABLE UNITS · PENDING/RESERVED UNITS · ASSIGNED UNITS',
    'the six drawn columns, in order',
    seed.header.join(' · '),
  );
  const counts = await chips();
  check(counts['All items'] === seed.total, 'All items counts every asset', `${counts['All items']} vs ${seed.total}`);
  check(
    counts['In stock'] === seed.by['In Stock'] && counts['Low stock'] === seed.by['Low Stock'] && counts['Out of stock'] === seed.by['Out of Stock'],
    'each stock chip counts the assets in that derived status',
    JSON.stringify({ counts, derived: seed.by }),
  );

  const unknown = await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    let saving;
    try {
      saving = seededAssetSource.update('no-such-asset', { name: 'X', category: 'Laptop', model: 'M', specs: {}, lowStockThreshold: 5 });
    } catch {
      return 'threw';
    }
    return saving.then(
      () => 'resolved',
      () => 'rejected',
    );
  });
  check(unknown === 'rejected', 'the source rejects an update to an unknown asset rather than throwing', unknown);

  console.log('\nStory 1 AC6 — a row opens View Asset; its cells stay readable');
  const row = await cdp.evaluate(() => {
    const btn = [...document.querySelectorAll('[aria-label="Assets table"] button')].find((b) => b.textContent.trim() === 'Dell Latitude 7440');
    const r = btn.closest('div.relative');
    const assigned = r.lastElementChild.getBoundingClientRect();
    return {
      ariaLabel: btn.getAttribute('aria-label'),
      cells: [...r.children].map((c) => c.textContent.trim()),
      cellsOutsideButton: [...r.children].slice(1).every((c) => !btn.contains(c)),
      point: { x: assigned.left + 8, y: assigned.top + assigned.height / 2 },
    };
  });
  check(row.ariaLabel === null, 'the row control is named by the item name, not an aria-label that hides the cells');
  check(row.cellsOutsideButton && row.cells.length === 6, 'category, model and the three counts are text outside the button', row.cells.join(' | '));
  await clickAt(row.point);
  check((await panelOpen()) && (await panelText()).includes('Latitude 7440'), 'clicking the ASSIGNED UNITS cell opens View Asset for that row');
  await pressInPanel('Close');
  check(await panelClosed(), 'Close closes View Asset');

  console.log('\nKeyboard — the row and the scrolling table');
  const region = await cdp.evaluate(() => {
    const r = document.querySelector('[aria-label="Assets table"]');
    return { role: r.getAttribute('role'), tabIndex: r.tabIndex };
  });
  check(region.role === 'region' && region.tabIndex === 0, 'the scrolling table is a focusable region, as the Requests Queue is');
  await cdp.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Out of stock')).focus());
  let focused = '';
  for (let i = 0; i < 5 && focused !== 'Dell Latitude 7440'; i++) {
    await key('Tab', 'Tab', 9);
    await wait(60);
    focused = await cdp.evaluate(() => document.activeElement.textContent.trim());
  }
  const ring = await cdp.evaluate(() => {
    const a = document.activeElement;
    const after = getComputedStyle(a, '::after');
    const row = a.closest('div.relative')?.getBoundingClientRect();
    return { style: after.outlineStyle, width: after.outlineWidth, wide: !!row && Math.abs(parseFloat(after.width) - row.width) < 2 };
  });
  check(focused === 'Dell Latitude 7440', 'Tab reaches the first row', focused);
  check(ring.style === 'solid' && ring.width === '2px' && ring.wide, 'its focus ring outlines the whole row', JSON.stringify(ring));
  await key('Enter', 'Enter', 13, '\r');
  check((await panelOpen()) && (await panelText()).includes('Latitude 7440'), 'Enter opens View Asset');
  await pressInPanel('Close');
  check(await panelClosed(), 'Close closes View Asset');

  console.log('\nStory 2 — Add Asset');
  await cdp.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Add Asset')).click());
  check(await panelTitled('Add Asset'), 'Add Asset opens');
  const category = await cdp.evaluate(() => document.querySelector('dialog[open] [role=combobox]').getAttribute('aria-required'));
  check(category === 'true', 'Category is announced as required');
  await pressInPanel('Save Changes');
  check(
    await until(() => document.querySelector('dialog[open]')?.textContent.includes('Enter the item name')),
    'AC3: an empty Item Name is refused under the field and the panel stays open',
  );
  await type('input[placeholder="e.g. Dell Latitude 7440"]', 'Gate Check Laptop');
  await type('input[placeholder="e.g. Latitude 7440"]', 'GC-1');
  const before = await chips();
  await pressInPanel('Save Changes');
  check(await panelClosed(), 'AC6: a valid asset saves and the panel closes');
  check(
    await until((before) => {
      const all = [...document.querySelectorAll('[aria-label="Filter by stock status"] button')].find((b) => b.textContent.startsWith('All items'));
      return Number(all?.textContent.match(/(\d+)\)?$/)?.[1]) === before + 1;
    }, before['All items']),
    'AC6: the asset is added',
  );
  const after = await chips();
  check(after['Out of stock'] === before['Out of stock'] + 1, 'AC6: with zero units it counts as Out of stock');
  const names = await rowNames();
  check(names[0] === 'Gate Check Laptop', 'AC6: the new asset leads page 1, where the Admin can see it', names[0]);

  console.log('\nStory 3 AC5 — a new threshold moves the derived status');
  await cdp.evaluate(() => [...document.querySelectorAll('[aria-label="Assets table"] button')].find((b) => b.textContent.trim() === 'Dell Latitude 7440').click());
  check(await panelTitled('View Asset'), 'the row opens View Asset');
  await pressInPanel('Update Asset');
  check(await panelTitled('Update Asset'), 'Update Asset opens from View Asset');
  const beforeThreshold = await chips();
  await type('input[inputmode="numeric"]', '40');
  await pressInPanel('Save Changes');
  check(await panelTitled('View Asset'), 'saving returns to View Asset');
  const afterThreshold = await chips();
  check(
    afterThreshold['In stock'] === beforeThreshold['In stock'] - 1 && afterThreshold['Low stock'] === beforeThreshold['Low stock'] + 1,
    'raising the threshold above Available moves the asset from In stock to Low stock',
    JSON.stringify({ beforeThreshold, afterThreshold }),
  );
  check((await panelText()).includes('40'), 'View Asset reads the new threshold back');

  console.log('\nA failed refresh after a save');
  await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    window.__list = seededAssetSource.list;
    seededAssetSource.list = () => Promise.reject(new Error('gate: list unavailable'));
  });
  await pressInPanel('Update Asset');
  check(await panelTitled('Update Asset'), 'Update Asset opens');
  await type('input[placeholder="e.g. Dell Latitude 7440"]', 'Dell Latitude 7440 (renamed)');
  await pressInPanel('Save Changes');
  check(await panelTitled('View Asset'), 'the save goes through and returns to View Asset');
  const stale = await cdp.evaluate(() => {
    const main = document.querySelector('main').textContent;
    return {
      view: document.querySelector('dialog[open]')?.textContent.includes('Dell Latitude 7440 (renamed)') ?? false,
      notice: main.includes('Saved, but the list could not be refreshed'),
      row: [...document.querySelectorAll('[aria-label="Assets table"] button')].some((b) => b.textContent.trim() === 'Dell Latitude 7440 (renamed)'),
      nothingChanged: main.includes('Nothing was changed'),
    };
  });
  check(stale.view, 'View Asset reads what was saved, not the list from before');
  check(stale.row, 'the saved asset is written into the table');
  check(stale.notice && !stale.nothingChanged, 'the table says the save went through and the list is not refreshed');
  await pressInPanel('Update Asset');
  check(await panelTitled('Update Asset'), 'Update Asset opens again');
  const prefill = await cdp.evaluate(() => document.querySelector('dialog[open] input[placeholder="e.g. Dell Latitude 7440"]')?.value);
  await pressInPanel('Cancel');
  check(prefill === 'Dell Latitude 7440 (renamed)', 'Update Asset prefills from the saved asset, so a second save cannot undo the first', prefill);
  await pressInPanel('Close');
  check(await panelClosed(), 'Close closes View Asset');
  await cdp.evaluate(() => {
    const search = document.querySelector('input[aria-label="Search by item name or model"]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(search, 'zzzz-no-such-asset');
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  check(
    await until(() => {
      const main = document.querySelector('main').textContent;
      return main.includes('Saved, but the list could not be refreshed') && main.includes('No asset matches that search');
    }),
    'a search with no match still says so while the list is stale',
  );
  await cdp.evaluate(() => [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Refresh').click());
  await wait(400);
  check(await staleNotice(), 'a refresh that fails again keeps the list and the notice');
  await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    seededAssetSource.list = window.__list;
    [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Refresh').click();
  });
  check(
    await until(() => !document.querySelector('main').textContent.includes('Saved, but the list could not be refreshed')),
    'a refresh that succeeds clears the notice',
  );
} catch (error) {
  check(false, 'the gate ran to the end', error instanceof Error ? error.message : String(error));
}

console.log(`\n${failures} failure(s)`);
await cdp.close();
process.exit(failures ? 1 : 0);
