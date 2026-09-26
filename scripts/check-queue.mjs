/** Spec 004 — the Requests Queue's own verification.
 *
 *  Asserts FR-004–FR-008 and FR-019–FR-023 against the seeded queue source:
 *  live statuses only, summary cards, chip counts over the search matches,
 *  the searched fields, the three sort orders, pagination and its page-1 rule,
 *  both empty states, and that keyboard focus survives reaching the last page.
 *  Runs through the same CDP client as the other gates; Playwright (spec 001
 *  T026) can lift these assertions as they stand.
 *
 *  Needs `npm run dev`. Headless Chrome is started for you. Set
 *  OSRS_DEV_ORIGIN when the server is not on port 5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const ADMIN = { account: 'ethan.cruz', landing: '/queue' };

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) return console.log(`  ✓ ${m}`);
  failures++;
  console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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

/** What the queue shows, read the same way after every interaction. */
const queueState = () => {
  const pages = document.querySelector('nav[aria-label="Requests queue pages"]');
  const chips = Object.fromEntries(
    [...document.querySelectorAll('[role="group"][aria-label="Filter by status"] button')].map((b) => {
      const [, label, n] = b.textContent.match(/^(.*)\((\d[\d,]*)\)$/) ?? [];
      return [label?.trim(), Number(n?.replace(/,/g, ''))];
    }),
  );
  const table = document.querySelector('[role="region"][aria-label="Requests table"]');
  return {
    cards: document.querySelector('section[aria-label="Requests workload summary"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
    chips,
    pressed: document.querySelector('[role="group"][aria-label="Filter by status"] button[aria-pressed="true"]')?.textContent ?? null,
    ids: [...document.querySelectorAll('a[aria-label^="Review request "]')].map((a) => a.getAttribute('aria-label').slice('Review request '.length)),
    names: [...(table?.querySelectorAll('a[aria-label^="Review request "]') ?? [])].map(
      (a) => a.closest('div').children[1]?.firstElementChild?.textContent ?? '',
    ),
    range: pages?.querySelector('p')?.textContent.trim() ?? null,
    current: pages?.querySelector('[aria-current="page"]')?.textContent.trim() ?? null,
    text: table?.innerText ?? '',
  };
};
const state = () => cdp.evaluate(queueState);

/** React tracks an input's value itself, so a plain assignment is invisible to
 *  it; the native setter plus a bubbling event is what a keystroke produces. */
const setSearch = (value) =>
  cdp.evaluate((v) => {
    const input = document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);

const setPageSize = (size) =>
  cdp.evaluate((n) => {
    const select = document.querySelector('nav[aria-label="Requests queue pages"] select');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, String(n));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, size);

const clickChip = (label) =>
  cdp.evaluate((l) => {
    [...document.querySelectorAll('[role="group"][aria-label="Filter by status"] button')]
      .find((b) => b.textContent.startsWith(`${l}(`) || b.textContent.startsWith(`${l} (`))
      .click();
  }, label);

const clickPage = (name) =>
  cdp.evaluate((n) => {
    [...document.querySelectorAll('nav[aria-label="Requests queue pages"] button')].find((b) => b.textContent.trim() === n).click();
  }, name);

/** The custom `Select`: open the combobox, then pick the option. */
async function pickSort(option) {
  await cdp.evaluate(() => document.querySelector('[role="combobox"][aria-label="Sort requests"], [aria-label="Sort requests"] [role="combobox"]').click());
  await cdp.waitFor(() => document.querySelectorAll('[role="option"]').length > 0, 4000, 'the sort options');
  await cdp.evaluate((o) => [...document.querySelectorAll('[role="option"]')].find((li) => li.textContent.trim() === o).click(), option);
}

/** A real key press through the input pipeline, not a synthetic click, so the
 *  focus behaviour under test is the browser's own. */
async function press(key, code, keyCode, text) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, text });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

const settle = () => new Promise((r) => setTimeout(r, 150));

// Whatever happens below, the tab is closed and the summary printed.
try {
  await signIn(ADMIN);
  await cdp.waitFor(() => !!document.querySelector('a[aria-label^="Review request "]'), 8000, 'the queue rows');
  let s = await state();

  console.log('\nLive statuses only, and the summary cards (FR-004–FR-008)');
  check(s.ids.length === 12, 'twelve live requests are listed', `got ${s.ids.length}`);
  check(
    !['REQ-2026-1690', 'REQ-2026-1684', 'REQ-2026-1677'].some((id) => s.ids.includes(id)),
    'Completed, Rejected and Cancelled requests are left to History',
  );
  check(
    s.cards.includes('4 Pending approval') && s.cards.includes('8 In Processing') && s.cards.includes('2 Low stock alerts'),
    'cards: 4 pending, 8 in processing, 2 low stock',
    s.cards,
  );

  console.log('\nChips, and counts that follow the search (FR-019, FR-020)');
  check(
    same(s.chips, { 'All requests': 12, 'Pending Approval': 4, Approved: 3, 'For Delivery': 2, 'Ready for Pickup': 3 }),
    'chip counts over every live request',
    JSON.stringify(s.chips),
  );
  check(s.pressed?.startsWith('All requests'), 'All requests is pressed by default', `got ${s.pressed}`);
  await clickChip('Ready for Pickup');
  await settle();
  s = await state();
  check(s.ids.length === 3 && s.pressed?.startsWith('Ready for Pickup'), 'a chip lists exactly its count', `rows ${s.ids.length}`);
  await clickChip('All requests');

  await setSearch('  KEYBOARD ');
  await settle();
  s = await state();
  check(
    same(s.chips, { 'All requests': 3, 'Pending Approval': 2, Approved: 0, 'For Delivery': 0, 'Ready for Pickup': 1 }),
    'search is trimmed and case-insensitive, and every chip recounts over the matches',
    JSON.stringify(s.chips),
  );
  for (const [term, id, field] of [
    ['req-2026-1715', 'REQ-2026-1715', 'request id'],
    ['bea reyes', 'REQ-2026-1726', 'employee name'],
    ['andreav@', 'REQ-2026-1842', 'email'],
    ['ups', 'REQ-2026-1790', 'item'],
  ]) {
    await setSearch(term);
    await settle();
    s = await state();
    check(same(s.ids, [id]), `search matches the ${field}`, `"${term}" → ${s.ids.join(', ')}`);
  }
  await setSearch('Finance');
  await settle();
  s = await state();
  check(
    s.ids.length === 0 && s.text.includes('No requests match the current search and status filter.') && s.range === '0-0 of 0',
    'department is not searched, and no match says so rather than "queue is empty"',
    `rows ${s.ids.length}, range ${s.range}`,
  );
  await setSearch('');
  await settle();

  console.log('\nSort (FR-021)');
  s = await state();
  check(s.ids[0] === 'REQ-2026-1847' && s.ids.at(-1) === 'REQ-2026-1698', 'Newest First is the default', `${s.ids[0]} … ${s.ids.at(-1)}`);
  await pickSort('Oldest First');
  await settle();
  s = await state();
  check(s.ids[0] === 'REQ-2026-1698' && s.ids.at(-1) === 'REQ-2026-1847', 'Oldest First reverses it', `${s.ids[0]} … ${s.ids.at(-1)}`);
  await pickSort('Employee (A-Z)');
  await settle();
  s = await state();
  const sorted = [...s.names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  check(s.names.length === 12 && same(s.names, sorted), 'Employee (A-Z) orders by name', s.names.slice(0, 3).join(', '));
  await pickSort('Newest First');
  await settle();

  console.log('\nPagination, and the page-1 rule (FR-022, FR-023)');
  s = await state();
  check(s.range === '1-12 of 12' && s.current === '1', 'default page size 50 shows everything', `got ${s.range}`);
  await setPageSize(10);
  await settle();
  s = await state();
  check(s.range === '1-10 of 12' && s.ids.length === 10, 'page size 10 → 1-10 of 12', `got ${s.range}`);
  await clickPage('2');
  await settle();
  s = await state();
  check(s.range === '11-12 of 12' && s.current === '2' && s.ids.length === 2, 'page 2 → 11-12 of 12', `got ${s.range}`);
  await clickChip('All requests');
  await settle();
  s = await state();
  check(s.current === '2' && s.range === '11-12 of 12', 'pressing the chip that is already selected stays on the page', `on page ${s.current}, ${s.range}`);
  await clickChip('Pending Approval');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the chip returns to page 1', `on page ${s.current}`);
  // Pending Approval fits on one page, so the projection's clamp shows page 1
  // whether or not the query was reset — the check above cannot fail on its
  // own. Going back to All tells them apart: an unreset query still holds
  // page 2 and would show it again.
  await clickChip('All requests');
  await settle();
  s = await state();
  check(s.current === '1' && s.range === '1-10 of 12', 'the reset is in the query, not only the clamp: back on All it is still page 1', `on page ${s.current}, ${s.range}`);
  await clickPage('2');
  await pickSort('Oldest First');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the sort returns to page 1', `on page ${s.current}`);
  await pickSort('Newest First');
  await clickPage('2');
  await setSearch('REQ');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the search returns to page 1', `on page ${s.current}`);
  await setSearch('');
  await settle();

  console.log('\nKeyboard focus survives the ends of the range (FR-014)');
  await cdp.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Requests queue pages"] button')].find((b) => b.textContent.trim() === 'Next').focus(),
  );
  await press('Enter', 'Enter', 13, '\r');
  await settle();
  const atEnd = await cdp.evaluate(() => ({
    active:
      document.activeElement?.tagName === 'BUTTON' ? document.activeElement.textContent.trim() : (document.activeElement?.tagName ?? null),
    disabled: document.activeElement?.getAttribute('aria-disabled') ?? null,
    range: document.querySelector('nav[aria-label="Requests queue pages"] p')?.textContent.trim(),
  }));
  check(atEnd.range === '11-12 of 12', 'Enter on Next moves to the last page', `got ${atEnd.range}`);
  check(atEnd.active === 'Next' && atEnd.disabled === 'true', 'focus stays on Next, now aria-disabled, rather than falling to <body>', JSON.stringify(atEnd));
  await press('Enter', 'Enter', 13, '\r');
  await settle();
  s = await state();
  check(s.range === '11-12 of 12', 'Enter on a disabled Next does nothing', `got ${s.range}`);
} catch (error) {
  check(false, `the run stopped: ${error.message}`);
} finally {
  cdp.close();
}

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
