/** Spec 005 — the Catalog's own verification.
 *
 *  Asserts the request gate (FR-008–FR-010, FR-014, including the fail-closed
 *  branch for an Employee with no recognised home office), the per-office
 *  re-read, the fixed category chips and search (FR-005–FR-007), the View
 *  Specs rows by category (FR-015), the `Inventory Status` labels (FR-003) and
 *  the failure and empty states (FR-011), against the seeded catalog source.
 *  Runs through the same CDP client as the other gates; Playwright (spec 001
 *  T026) can lift these assertions as they stand.
 *
 *  Needs `npm run dev` — the fail-closed branch is reached by importing the
 *  gate module from the dev server, since neither seeded account lacks an
 *  office. Headless Chrome is started for you. Set OSRS_DEV_ORIGIN when the
 *  server is not on port 5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const EMPLOYEE = { account: 'maya.santos', landing: '/catalog' }; // home office: Davao
const ADMIN = { account: 'ethan.cruz', landing: '/queue' };

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) return console.log(`  ✓ ${m}`);
  failures++;
  console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const settle = () => new Promise((r) => setTimeout(r, 350));

const cdp = await connect();
await cdp.setViewport(1440, 1024);

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

async function signIn({ account, landing }) {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate((id) => document.querySelector(`input[value="${id}"]`).click(), account);
  await cdp.evaluate(() =>
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click(),
  );
  await cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(landing)}`), 8000, landing);
}

const gridReady = () => cdp.waitFor(() => !!document.querySelector('button[aria-label^="View specs for "]'), 8000, 'the grid');

/** Every card, read the same way after every interaction. A card is found by
 *  its `View specs` link, whose accessible name carries the item. */
const cards = () =>
  cdp.evaluate(() =>
    [...document.querySelectorAll('button[aria-label^="View specs for "]')].map((link) => {
      const card = link.closest('.shadow-card');
      const buttons = [...card.querySelectorAll('button')];
      const action = buttons.find((b) => !b.getAttribute('aria-label'));
      const pill = [...card.querySelectorAll('span')].find((s) =>
        ['Available', 'Low in Stock', 'Out of Stock'].includes(s.textContent),
      );
      return {
        name: link.getAttribute('aria-label').slice('View specs for '.length),
        pill: pill?.textContent ?? null,
        action: action ? { label: action.textContent, enabled: !action.disabled } : null,
        stepper: !!card.querySelector('[aria-label="Increase quantity"]'),
        increaseEnabled: !card.querySelector('[aria-label="Increase quantity"]')?.disabled,
      };
    }),
  );
const card = async (name) => (await cards()).find((c) => c.name === name);

const pickOffice = async (label) => {
  await cdp.evaluate(() => document.querySelector('button[role="combobox"][aria-label="Office"]').click());
  await settle();
  await cdp.evaluate(
    (l) => [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent === l).click(),
    label,
  );
  await gridReady();
  await settle();
};

const clickChip = async (label) => {
  await cdp.evaluate(
    (l) =>
      [...document.querySelectorAll('[role="group"][aria-label="Filter by category"] button')]
        .find((b) => b.textContent === l)
        .click(),
    label,
  );
  await settle();
};

/** React tracks an input's value itself, so a plain assignment is invisible to
 *  it; the native setter plus a bubbling event is what a keystroke produces. */
const setSearch = async (value) => {
  await cdp.evaluate((v) => {
    const input = document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await settle();
};

const openSpecs = async (name) => {
  await cdp.evaluate((n) => {
    const link = document.querySelector(`button[aria-label="View specs for ${n}"]`);
    link.focus();
    link.click();
  }, name);
  await settle();
};

const panel = () =>
  cdp.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return null;
    return {
      labels: [...dialog.querySelectorAll('dt')].map((d) => d.textContent),
      office: [...dialog.querySelectorAll('dt')].find((d) => d.textContent === 'Office')?.nextElementSibling?.textContent ?? null,
      action: [...dialog.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') !== 'Close')?.textContent ?? null,
    };
  });

const closeWithEscape = async () => {
  await cdp.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await new Promise((r) => setTimeout(r, 600));
};

const badge = () => cdp.evaluate(() => document.querySelector('header')?.innerText.match(/Request List\s*(\d+)/)?.[1] ?? null);

try {
  console.log('Employee, home office');
  await signIn(EMPLOYEE);
  await gridReady();
  check(
    (await cdp.evaluate(() => document.querySelector('button[role="combobox"][aria-label="Office"]').textContent)) === 'Davao Office',
    'the office selector opens on the home office (FR-014)',
  );
  let c = await card('Dell Latitude 5440');
  check(c?.pill === 'Available', 'the pill reads `Available` above the threshold (FR-003, D10)', c?.pill);
  check(same(c?.action, { label: 'Add to Request List', enabled: true }), 'the add action is offered within stock (FR-008)', JSON.stringify(c?.action));
  c = await card('Dell Monitor');
  check(c?.pill === 'Low in Stock', 'the pill reads `Low in Stock` on the threshold — 4 of 4 (FR-003)', c?.pill);
  c = await card('APC Back-UPS 650VA Uninterruptible Power Supply with Surge Protection');
  check(c?.pill === 'Out of Stock', 'the pill reads `Out of Stock` at zero', c?.pill);
  check(same(c?.action, { label: 'Out of stock', enabled: false }), 'the add action is disabled at zero (FR-009)', JSON.stringify(c?.action));
  c = await card('Acer USB 3.0 Hub');
  check(c?.increaseEnabled === false, 'the stepper cannot exceed Available — 1 of 1 (FR-010)');

  console.log('View Specs');
  await openSpecs('Dell Latitude 5440');
  let p = await panel();
  check(
    same(p?.labels, ['Item Name', 'Model', 'RAM', 'Storage', 'Processor', 'Graphics', 'Operating System', 'Description', 'Office']),
    'Laptop: every spec row, then description and office (FR-015)',
    JSON.stringify(p?.labels),
  );
  check(p?.office === 'Davao', 'the panel names the office the stock was read for', p?.office);
  const before = await badge();
  await cdp.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === 'Add to Request List').click(),
  );
  await settle();
  check((await panel()) !== null, 'adding keeps the panel open, so every close runs the panel exit');
  check(Number(await badge()) === Number(before) + 1, 'adding from the panel feeds the shell badge', `${before} → ${await badge()}`);
  await closeWithEscape();
  check((await panel()) === null, 'Esc closes the panel');
  check(
    (await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label'))) === 'View specs for Dell Latitude 5440',
    'focus returns to the link that opened it',
  );
  await openSpecs('Logitech Mouse');
  p = await panel();
  check(same(p?.labels, ['Item Name', 'Description', 'Office']), 'Mice: no Model or spec rows (FR-002a)', JSON.stringify(p?.labels));
  await closeWithEscape();
  await openSpecs('Samsung Galaxy A15');
  p = await panel();
  check(same(p?.labels, ['Item Name', 'Model', 'RAM', 'Storage', 'Office']), 'Phone: Model, RAM, Storage', JSON.stringify(p?.labels));
  await closeWithEscape();

  console.log('Filters');
  const chips = await cdp.evaluate(() =>
    [...document.querySelectorAll('[role="group"][aria-label="Filter by category"] button')].map((b) => b.textContent),
  );
  check(
    same(chips, ['All supplies', 'Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices']),
    'the chip row is the contract enum, in order (FR-006, D6)',
    JSON.stringify(chips),
  );
  await clickChip('Mice');
  check(same((await cards()).map((x) => x.name), ['Logitech Mouse']), 'a chip filters by category');
  await setSearch('keyboard');
  check((await cards()).length === 0, 'chip and search combine (FR-007)');
  await clickChip('All supplies');
  check(
    same((await cards()).map((x) => x.name), ['Logitech Keyboard']) &&
      (await cdp.evaluate(() => document.querySelector('input[type="search"]').value)) === 'keyboard',
    'clearing the chip keeps the search term (Story 2 AC5)',
  );
  await setSearch('type c');
  check(same((await cards()).map((x) => x.name), ['Acer USB 3.0 Hub']), 'search matches the category name (FR-005)');
  await setSearch('');

  console.log('Employee, another office');
  await pickOffice('Cebu Office');
  c = await card('A4Tech Hu-10 Headset');
  check(c?.pill === 'Out of Stock', 'changing the office re-reads availability — Headset 0 at Cebu (FR-014)', c?.pill);
  const actions = (await cards()).map((x) => x.action);
  check(
    actions.length > 0 && actions.every((a) => same(a, { label: 'Your office only', enabled: false })),
    'another office is read-only: every action reads `Your office only`',
    JSON.stringify(actions.slice(0, 2)),
  );

  console.log('Employee, no recognised home office');
  const gate = await cdp.evaluate(async () => {
    const { requestAction } = await import('/src/features/catalog/request-action.ts');
    const item = { available: 5 };
    return {
      none: requestAction(item, 'Cebu', 'employee', undefined),
      home: requestAction(item, 'Cebu', 'employee', 'Cebu'),
      admin: requestAction(item, 'Cebu', 'admin', 'Cebu'),
    };
  });
  check(same(gate.none, { label: 'Your office only', enabled: false }), 'the gate fails closed with no home office (D7)', JSON.stringify(gate.none));
  check(gate.home?.enabled === true, 'the same item is requestable at the home office');
  check(gate.admin === null, 'an Admin is offered no action at all');

  console.log('Admin');
  await signIn(ADMIN);
  await go('/catalog');
  await gridReady();
  const admin = await cards();
  check(admin.every((x) => x.action === null && !x.stepper), 'an Admin sees no action and no stepper (Story 3 AC2)');
  check(admin.every((x) => x.pill !== null), 'an Admin still sees every pill');

  console.log('States');
  await go('/catalog?fail-catalog');
  await cdp.waitFor(() => document.body.innerText.includes('The catalog could not be loaded'), 8000, 'the failure notice');
  check(true, 'a failed read shows the failure notice, not an empty grid (FR-011)');
  await go('/catalog?empty-catalog');
  await cdp.waitFor(() => document.body.innerText.includes('No supplies have been encoded yet'), 8000, 'the empty notice');
  check(true, 'an empty catalog says so (FR-011)');
} catch (error) {
  check(false, `the run stopped: ${error.message}`);
} finally {
  cdp.close();
}

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
