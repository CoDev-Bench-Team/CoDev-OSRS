/** Spec 012 — the Admin's History (BEN-144).
 *
 *  Asserts against the seeded Admin source:
 *  - Admin-only: no History nav item for the Employee, and `/history` refused.
 *  - Terminal statuses only; each chip's list and count; search by id, name,
 *    email and item; the three sorts by resolved time; pagination.
 *  - The read-only panel: reason label per status, none for Completed, no
 *    action controls, focus returning to Review.
 *  - A cancelled request's timeline keeps the nodes it reached (FR-009a).
 *  - The dev stubs: loading, failure, empty, no reason, no resolved date.
 *  - `/requests/<id>`: a resolved request opens here, a live one on the queue.
 *  - No page-level overflow at 360px and 1440px; keyboard reach.
 *
 *  Needs `npm run dev`. Headless Chrome is started for you. Set
 *  OSRS_DEV_ORIGIN when the server is not on port 5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const ADMIN = { account: 'ethan.cruz', landing: '/queue' };
const EMPLOYEE = { account: 'maya.santos', landing: '/catalog' };

/** The seeded resolved requests, newest resolved first. REQ-2026-1663 was
 *  submitted before REQ-2026-1669 but resolved after it, so an order by
 *  submitted time would fail here. */
const NEWEST = [
  'REQ-2026-1672', 'REQ-2026-1663', 'REQ-2026-1612', 'REQ-2026-1669', 'REQ-2026-1644', 'REQ-2026-1657', 'REQ-2026-1650',
  'REQ-2026-1638', 'REQ-2026-1631', 'REQ-2026-1625', 'REQ-2026-1690', 'REQ-2026-1684', 'REQ-2026-1677', 'REQ-2026-1619',
];
const STATUS = {
  Completed: ['REQ-2026-1690', 'REQ-2026-1669', 'REQ-2026-1663', 'REQ-2026-1638', 'REQ-2026-1619'],
  Cancelled: ['REQ-2026-1677', 'REQ-2026-1672', 'REQ-2026-1650', 'REQ-2026-1644', 'REQ-2026-1625'],
  Rejected: ['REQ-2026-1684', 'REQ-2026-1657', 'REQ-2026-1631', 'REQ-2026-1612'],
};
/** Every seeded Rejected and Cancelled request's stored reason (SC-003). */
const REASONS = {
  'REQ-2026-1684': 'Duplicate of request SR-1042',
  'REQ-2026-1657': 'One monitor per employee; request a second through your manager',
  'REQ-2026-1631': 'Current unit is within its refresh cycle',
  'REQ-2026-1612': 'Stands are issued by Facilities, not Workplace',
  'REQ-2026-1677': 'Model discontinued; employee will re-request',
  'REQ-2026-1672': 'Duplicate of request SR-1042',
  'REQ-2026-1650': 'Courier could not deliver; unit returned to stock',
  'REQ-2026-1644': 'Not collected within ten business days',
  'REQ-2026-1625': 'Borrowed a spare from the team',
};
/** Every seeded Cancelled request's timeline: the nodes it reached, then the
 *  ending (spec 012 FR-009a, plan R2). */
const CANCELLED_TIMELINES = {
  'REQ-2026-1672': [['reached', 'Submitted'], ['cancelled', 'Cancelled']],
  'REQ-2026-1625': [['reached', 'Submitted'], ['cancelled', 'Cancelled']],
  'REQ-2026-1677': [['reached', 'Submitted'], ['reached', 'Approved'], ['cancelled', 'Cancelled']],
  'REQ-2026-1650': [['reached', 'Submitted'], ['reached', 'Approved'], ['reached', 'For Delivery'], ['cancelled', 'Cancelled']],
  'REQ-2026-1644': [['reached', 'Submitted'], ['reached', 'Approved'], ['reached', 'Ready for Pickup'], ['cancelled', 'Cancelled']],
};

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) return console.log(`  ✓ ${m}`);
  failures++;
  console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (ids) => [...ids].sort();

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

const historyState = () => {
  const pages = document.querySelector('nav[aria-label="History pages"]');
  const chips = Object.fromEntries(
    [...document.querySelectorAll('[role="group"][aria-label="Filter by status"] button')].map((b) => {
      const [, label, n] = b.textContent.match(/^(.*)\((\d[\d,]*)\)$/) ?? [];
      return [label?.trim(), Number(n?.replace(/,/g, ''))];
    }),
  );
  const table = document.querySelector('[role="region"][aria-label="History table"]');
  const rows = [...(table?.querySelectorAll('button[aria-label^="Review request "]') ?? [])].map((b) => b.closest('div'));
  return {
    path: location.pathname,
    heading: document.querySelector('main h1')?.textContent.trim() ?? null,
    subtitle: document.querySelector('main h1')?.nextElementSibling?.textContent.trim() ?? null,
    chips,
    pressed: document.querySelector('[role="group"][aria-label="Filter by status"] button[aria-pressed="true"]')?.textContent ?? null,
    ids: rows.map((r) => r.children[0].textContent.trim()),
    names: rows.map((r) => r.children[1].firstElementChild?.textContent.trim() ?? ''),
    departments: rows.map((r) => r.children[1].children[1]?.textContent.trim() ?? ''),
    items: rows.map((r) => r.children[2].textContent.trim()),
    statuses: rows.map((r) => r.children[3].textContent.trim()),
    resolved: rows.map((r) => r.children[4].textContent.trim()),
    range: pages?.querySelector('p')?.textContent.trim() ?? null,
    current: pages?.querySelector('[aria-current="page"]')?.textContent.trim() ?? null,
    text: table?.innerText ?? '',
  };
};
const state = () => cdp.evaluate(historyState);

const panel = () => {
  const d = document.querySelector('dialog[open]');
  if (!d) return null;
  return {
    heading: d.querySelector('h2')?.textContent.trim(),
    pill: d.querySelector('h2')?.nextElementSibling?.textContent.trim(),
    buttons: [...d.querySelectorAll('button')].filter((b) => b.getAttribute('aria-label') !== 'Close').map((b) => b.textContent.trim()),
    controls: d.querySelectorAll('input, textarea, select, [role="combobox"]').length,
    text: d.textContent,
    timeline: [...d.querySelectorAll('ol li')].map((li) => [li.dataset.state, li.querySelector('span span')?.textContent.trim()]),
    /** Whether each node carries a date ("Aug 20, 2026, 1:00 PM"). */
    dated: [...d.querySelectorAll('ol li')].map((li) => /[A-Z][a-z]{2} \d{1,2}, \d{4}/.test(li.textContent)),
  };
};

const setSearch = (value) =>
  cdp.evaluate((v) => {
    const input = document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
const setPageSize = (size) =>
  cdp.evaluate((n) => {
    const select = document.querySelector('nav[aria-label="History pages"] select');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, String(n));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, size);
const clickChip = (label) =>
  cdp.evaluate((l) => {
    [...document.querySelectorAll('[role="group"][aria-label="Filter by status"] button')]
      .find((b) => b.textContent.startsWith(`${l}(`) || b.textContent.startsWith(`${l} (`))
      .click();
  }, label);
const pageButton = (name) =>
  cdp.evaluate(
    (n) => [...document.querySelectorAll('nav[aria-label="History pages"] button')].find((b) => b.textContent.trim() === n)?.getAttribute('aria-disabled'),
    name,
  );
const clickPage = (name) =>
  cdp.evaluate((n) => {
    [...document.querySelectorAll('nav[aria-label="History pages"] button')].find((b) => b.textContent.trim() === n).click();
  }, name);
async function pickSort(option) {
  await cdp.evaluate(() => document.querySelector('[role="combobox"][aria-label="Sort history"], [aria-label="Sort history"] [role="combobox"]').click());
  await cdp.waitFor(() => document.querySelectorAll('[role="option"]').length > 0, 4000, 'the sort options');
  await cdp.evaluate((o) => [...document.querySelectorAll('[role="option"]')].find((li) => li.textContent.trim() === o).click(), option);
}
const open = async (id) => {
  await cdp.evaluate((rid) => {
    const b = document.querySelector(`button[aria-label="Review request ${rid}"]`);
    b.focus();
    b.click();
  }, id);
  await cdp.waitFor(() => !!document.querySelector('dialog[open] h2'), 5000, `the panel for ${id}`);
};
const closeButton = () => cdp.evaluate(() => document.querySelector('dialog[open] button[aria-label="Close"]').click());
// A real press and release on the scrim, left of the 400px sheet: the panel
// closes only when both land there.
const clickScrim = async () => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: 100, y: 500, button: 'left', clickCount: 1 });
  }
};
const sortValue = () => cdp.evaluate(() => document.querySelector('[role="combobox"][aria-label="Sort history"], [aria-label="Sort history"] [role="combobox"]')?.textContent.trim());
const closed = () => cdp.waitFor(() => !document.querySelector('dialog'), 5000, 'the panel to close');
const key = async (k, code, keyCode, modifiers = 0) => {
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: keyCode, modifiers });
  }
};
const esc = () => key('Escape', 'Escape', 27);
const settle = () => cdp.evaluate(() => new Promise((r) => setTimeout(r, 150)));
const rowsLoaded = () => cdp.waitFor(() => !!document.querySelector('button[aria-label^="Review request "]'), 8000, 'the History rows');

try {
  // ---- Admin-only (Story 3) ----
  console.log('\nAdmin-only (Story 3, FR-001)');
  await signIn(EMPLOYEE);
  const employeeNav = await cdp.evaluate(() =>
    [...document.querySelectorAll('header nav a')].filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.textContent.trim()),
  );
  check(!employeeNav.includes('History'), 'the Employee has no History nav item', employeeNav.join(', '));
  await go('/history');
  await settle();
  const refusal = await cdp.evaluate(() => ({
    eyebrow: document.querySelector('main span[class*="type-eyebrow"]')?.textContent.trim() ?? null,
    table: !!document.querySelector('[aria-label="History table"]'),
  }));
  check(refusal.eyebrow === 'No access' && !refusal.table, 'the Employee is refused /history, and no part of it renders', JSON.stringify(refusal));
  await cdp.evaluate(() => [...document.querySelectorAll('main button')].find((b) => b.textContent.startsWith('Go to')).click());
  await cdp.waitFor(() => location.pathname === '/catalog', 5000, 'the route back');
  check(true, 'and the refusal offers a working route back to the Employee\'s landing screen (spec 003 FR-011)');

  await signIn(ADMIN);
  const adminNav = await cdp.evaluate(() =>
    [...document.querySelectorAll('header nav a')].filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.textContent.trim()),
  );
  check(adminNav.includes('History'), 'the Admin has a History nav item');
  await go('/history');
  await rowsLoaded();
  let s = await state();

  // ---- The page (Story 1) ----
  console.log('\nThe page (Story 1, FR-002 to FR-004)');
  check(s.heading === 'History', 'heading History', s.heading);
  check(s.subtitle === 'Full audit trail — completed, cancelled, and rejected requests', 'the drawn subheading', s.subtitle);
  const columns = ['REQUEST ID', 'REQUESTER', 'ITEMS', 'STATUS', 'RESOLVED', 'ACTION'];
  check(columns.every((c) => s.text.toUpperCase().includes(c)), 'the six drawn columns (FR-003)');
  check(same(sorted(s.ids), sorted(NEWEST)), 'lists exactly the fourteen resolved requests', `got ${s.ids.length}`);
  const rowButtons = await cdp.evaluate(() =>
    [...document.querySelectorAll('[aria-label="History table"] button[aria-label^="Review request "]')].map(
      (b) => [...b.closest('div').querySelectorAll('button, input, select, a')].length,
    ),
  );
  check(rowButtons.length === 14 && rowButtons.every((n) => n === 1), 'each row holds exactly one control, its Review (SC-004)', rowButtons.join(','));
  check(s.statuses.every((t) => ['Completed', 'Cancelled', 'Rejected'].includes(t)), 'every row is Completed, Cancelled or Rejected', [...new Set(s.statuses)].join(', '));
  check(same(s.ids, NEWEST), 'newest resolved first by default (not newest submitted)', s.ids.slice(0, 4).join(', '));
  check(s.resolved[0] === 'Sep 11, 2026', 'RESOLVED prints the date it was resolved', s.resolved[0]);
  check(s.names[0] === 'Maya Santos' && s.departments[0] === 'Product Design', 'REQUESTER is name over department', `${s.names[0]} / ${s.departments[0]}`);
  check(s.items[0] === 'Laptop, Keyboard, USB-C Headset', 'ITEMS lists the item names', s.items[0]);
  check(
    same(s.chips, { 'All requests': 14, Completed: 5, Cancelled: 5, Rejected: 4 }),
    'every chip carries its count',
    JSON.stringify(s.chips),
  );
  check(s.pressed?.startsWith('All requests'), 'All requests is pressed by default', s.pressed);
  for (const [chip, ids] of Object.entries(STATUS)) {
    await clickChip(chip);
    await settle();
    s = await state();
    check(same(sorted(s.ids), sorted(ids)) && s.pressed?.startsWith(chip), `${chip} lists only its ${ids.length}`, s.ids.join(', '));
  }
  await clickChip('All requests');
  await settle();

  // ---- Search (FR-005) ----
  console.log('\nSearch (FR-005)');
  for (const [term, id, field] of [
    ['  req-2026-1650 ', 'REQ-2026-1650', 'request id, trimmed'],
    ['NICO RAMOS', 'REQ-2026-1690', 'requester name, case-insensitive'],
    ['giac@', 'REQ-2026-1684', 'requester email'],
    ['webcam', 'REQ-2026-1625', 'item name'],
  ]) {
    await setSearch(term);
    await settle();
    s = await state();
    check(same(s.ids, [id]), `search matches the ${field}`, `"${term}" → ${s.ids.join(', ')}`);
  }
  await setSearch('laptop');
  await settle();
  s = await state();
  // 'laptop' matches 1669 (Completed), 1672 and 1677 (Cancelled), 1631 and
  // 1612 (Rejected). Every chip recounts over the matches, not the list.
  check(
    same(s.chips, { 'All requests': 5, Completed: 1, Cancelled: 2, Rejected: 2 }) && s.ids.length === 5,
    'every chip count follows the search',
    JSON.stringify(s.chips),
  );
  await setSearch('no such thing');
  await settle();
  s = await state();
  check(
    s.ids.length === 0 && s.text.includes('No resolved requests match the current search and status filter.'),
    'no match shows the empty state',
  );
  await setSearch('');
  await settle();

  // ---- Sort (FR-006) ----
  console.log('\nSort (FR-006)');
  await pickSort('Oldest First');
  await settle();
  s = await state();
  check(same(s.ids, [...NEWEST].reverse()), 'Oldest First reverses the resolved order', `${s.ids[0]} … ${s.ids.at(-1)}`);
  await pickSort('Employee (A-Z)');
  await settle();
  s = await state();
  const byName = [...s.names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  check(same(s.names, byName), 'Employee (A-Z) orders by name', s.names.slice(0, 3).join(', '));
  const paolo = s.ids.filter((id) => ['REQ-2026-1669', 'REQ-2026-1612'].includes(id));
  // 1612 follows 1669 in the seed and was submitted before it, but resolved
  // after it, so neither a stable sort nor a submitted-time tie-break passes.
  check(same(paolo, ['REQ-2026-1612', 'REQ-2026-1669']), 'a tie on name falls back to newest resolved first', paolo.join(', '));
  await pickSort('Newest First');
  await settle();

  // ---- Pagination (FR-007) ----
  console.log('\nPagination (FR-007)');
  s = await state();
  check(s.range === '1-14 of 14', 'page size 50 shows everything', s.range);
  await setPageSize(10);
  await settle();
  s = await state();
  check(s.range === '1-10 of 14' && s.ids.length === 10, 'page size 10 → 1-10 of 14', s.range);
  check((await pageButton('Back')) === 'true', 'Back is disabled on the first page');
  await clickPage('2');
  await settle();
  s = await state();
  check(s.range === '11-14 of 14' && s.current === '2', 'page 2 → 11-14 of 14', s.range);
  check((await pageButton('Next')) === 'true', 'Next is disabled on the last page');
  await clickPage('Next');
  await settle();
  s = await state();
  check(s.range === '11-14 of 14' && s.current === '2', 'and pressing it changes nothing', s.range);
  await clickChip('All requests');
  await settle();
  s = await state();
  check(s.current === '2', 'pressing the chip already selected keeps the page', `page ${s.current}`);
  await clickChip('Rejected');
  await clickChip('All requests');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the chip returns to page 1', `page ${s.current}`);
  await clickPage('2');
  await pickSort('Oldest First');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the sort returns to page 1', `page ${s.current}`);
  await clickPage('2');
  await setPageSize(25);
  await settle();
  s = await state();
  check(s.current === '1', 'changing the page size returns to page 1', `page ${s.current}`);
  await setPageSize(10);
  await clickPage('2');
  await setSearch('REQ');
  await settle();
  s = await state();
  check(s.current === '1', 'changing the search returns to page 1', `page ${s.current}`);
  await setSearch('');
  await pickSort('Newest First');
  await setPageSize(50);
  await settle();

  // ---- The panel (Story 2) ----
  console.log('\nThe read-only panel (Story 2, FR-008 to FR-011)');
  for (const [id, pill, label] of [
    ['REQ-2026-1672', 'Cancelled', 'Reason for cancellation'],
    ['REQ-2026-1657', 'Rejected', 'Reason for rejection'],
    ['REQ-2026-1669', 'Completed', null],
  ]) {
    await open(id);
    const p = await cdp.evaluate(panel);
    check(p.heading === id && p.pill === pill, `${id}: id and ${pill} pill`, `${p.heading} / ${p.pill}`);
    check(/Requested by:/i.test(p.text) && /Items Requested/i.test(p.text) && !/Current inventory/i.test(p.text), `${id}: requester and ITEM · QTY, no current inventory`);
    check(
      label ? p.text.includes(label) : !/Reason for (rejection|cancellation)/.test(p.text),
      label ? `${id}: shows ${label}` : `${id}: no reason block`,
    );
    check(p.buttons.length === 0 && p.controls === 0, `${id}: no action and no input — only ✕`, p.buttons.join(', '));
    await esc();
    await closed();
    const back = await cdp.evaluate((rid) => document.activeElement?.getAttribute('aria-label') === `Review request ${rid}`, id);
    check(back, `${id}: Esc closes, and focus returns to its Review`);
  }
  await open('REQ-2026-1672');
  let p = await cdp.evaluate(panel);
  check(p.text.includes('Duplicate of request SR-1042') && p.text.includes('temporary project setup'), 'the frame\'s sample: its reason and Note to Approver');
  check(
    p.text.includes('Maya Santos') && p.text.includes('mayas@codev.com • Davao Office'),
    'REQUESTED BY reads the name and `email • office`',
  );
  await esc();
  await closed();

  // Closing keeps a query that is NOT the default, so a reset cannot pass.
  await pickSort('Oldest First');
  await setPageSize(10);
  await clickPage('2');
  await settle();
  await open('REQ-2026-1663');
  await closeButton();
  await closed();
  s = await state();
  check(
    s.range === '11-14 of 14' && s.current === '2' && (await sortValue()) === 'Oldest First',
    'closing with ✕ keeps the sort, page size and page',
    `${s.range}, page ${s.current}, ${await sortValue()}`,
  );
  check(await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Review request REQ-2026-1663'), 'and focus returns to its Review');
  await clickChip('Cancelled');
  await setSearch('o');
  await settle();
  s = await state();
  const first = s.ids[0];
  await open(first);
  await clickScrim();
  await closed();
  s = await state();
  const searchValue = await cdp.evaluate(() => document.querySelector('input[type="search"]').value);
  check(
    s.pressed?.startsWith('Cancelled') && searchValue === 'o' && s.ids[0] === first,
    'closing on the scrim keeps the chip and search',
    `${s.pressed}, "${searchValue}"`,
  );
  await setSearch('');
  await clickChip('All requests');
  await pickSort('Newest First');
  await setPageSize(50);
  await settle();

  await open('REQ-2026-1650');
  p = await cdp.evaluate(panel);
  check(!/Note to Approver/.test(p.text), 'a request with no note draws no Note to Approver block');
  await esc();
  await closed();

  console.log('\nEvery stored reason is read back (SC-003)');
  for (const [id, reason] of Object.entries(REASONS)) {
    await open(id);
    p = await cdp.evaluate(panel);
    check(p.text.includes(reason) && !p.text.includes('No reason recorded'), `${id}: "${reason}"`);
    await esc();
    await closed();
  }

  // ---- Stopped timelines (FR-009a) ----
  console.log('\nA cancelled request\'s timeline keeps what it reached (FR-009a)');
  for (const [id, expected] of Object.entries(CANCELLED_TIMELINES)) {
    await open(id);
    p = await cdp.evaluate(panel);
    check(same(p.timeline, expected), `${id}: ${expected.map(([, l]) => l).join(' → ')}`, JSON.stringify(p.timeline));
    check(p.dated.length === expected.length && p.dated.every(Boolean), `${id}: every node is dated`, JSON.stringify(p.dated));
    await esc();
    await closed();
  }

  // ---- Deep links (FR-016) ----
  console.log('\nDeep links (FR-016)');
  // Watch the whole hop, /requests/:id → /queue → /history, for the queue's
  // table or its settled announcement: the forward must not flash either.
  const { identifier: watcher } = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__queueFlashed = false;
      new MutationObserver(() => {
        if (document.querySelector('[aria-label="Requests table"]') || /awaiting approval/.test(document.body?.innerText ?? '')) {
          window.__queueFlashed = true;
        }
      }).observe(document, { childList: true, subtree: true, characterData: true });`,
  });
  await go('/requests/REQ-2026-1644');
  await cdp.waitFor(() => location.pathname === '/history' && !!document.querySelector('dialog[open] h2'), 8000, 'History with the panel');
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: watcher });
  check(!(await cdp.evaluate(() => window.__queueFlashed)), 'the forward never renders or announces the queue on the way');
  p = await cdp.evaluate(panel);
  check(p.heading === 'REQ-2026-1644', 'a resolved request\'s link opens its History panel', p.heading);
  check(!(await cdp.evaluate(() => history.state?.usr ?? null)), 'the link\'s state is consumed');
  await esc();
  await closed();
  // Focus moves on the next animation frame; wait for it rather than guess.
  const onChips = await cdp
    .waitFor(() => document.activeElement?.getAttribute('aria-label') === 'Filter by status', 3000, 'focus on the chips')
    .then(() => true, () => false);
  check(onChips, 'closing a deep-linked panel, which no Review opened, puts focus on the chips');
  await go('/requests/REQ-2026-1842');
  await cdp.waitFor(() => location.pathname === '/queue' && !!document.querySelector('dialog[open] h2'), 8000, 'the queue with the review panel');
  p = await cdp.evaluate(panel);
  check(p.heading === 'REQ-2026-1842', 'a live request\'s link still opens the review panel on the queue', p.heading);
  // The case the link exists for: an email opened while signed out.
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/requests/REQ-2026-1644');
  await cdp.waitFor(() => location.pathname === '/login', 8000, 'the redirect to sign-in');
  await cdp.evaluate(() => document.querySelector('input[value="ethan.cruz"]').click());
  await cdp.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click());
  await cdp.waitFor(
    () => location.pathname === '/history' && document.querySelector('dialog[open] h2')?.textContent.trim() === 'REQ-2026-1644',
    8000,
    'History with the panel after sign-in',
  );
  check(true, 'a resolved request\'s link survives sign-in and opens on History (FR-016)');
  await go('/requests/REQ-0000-0000');
  await cdp.waitFor(() => location.pathname === '/queue' && /That request is not available/.test(document.body.innerText), 8000, 'the not-found notice');
  check(true, 'a missing id still gets the queue\'s notice');

  // ---- Stubs (edge cases, FR-012) ----
  console.log('\nLoading, failure, empty, no reason, no resolved date (FR-012, edge cases)');
  await go('/history?history=slow');
  await cdp.waitFor(() => !!window.__releaseHistory, 5000, 'the held load');
  const loading = await cdp.evaluate(() => ({
    label: [...document.querySelectorAll('[role="status"]')].map((n) => n.textContent.trim()).join(' | '),
    table: !!document.querySelector('[aria-label="History table"]'),
    empty: /No requests have been resolved/.test(document.body.innerText),
  }));
  check(/Loading history/.test(loading.label) && !loading.table && !loading.empty, 'the loading state shows, and no empty state flashes first', JSON.stringify(loading));
  await cdp.evaluate(() => window.__releaseHistory());
  await rowsLoaded();
  check(true, 'the rows arrive once the load settles');

  await go('/history?history=failing');
  await cdp.waitFor(() => /History could not be loaded/.test(document.body.innerText), 5000, 'the failure notice');
  const failed = await cdp.evaluate(() => ({
    retry: [...document.querySelectorAll('main button')].some((b) => b.textContent.trim() === 'Try Again'),
    table: !!document.querySelector('[aria-label="History table"]'),
  }));
  check(failed.retry && !failed.table, 'a failed load shows the notice with Try Again, not an empty table', JSON.stringify(failed));
  check(
    await cdp.evaluate(() => document.querySelector('[role="status"][aria-live="polite"]')?.textContent.trim() === 'History could not be loaded.'),
    'and the failure is announced',
  );

  await go('/history?history=recovers');
  await cdp.waitFor(() => /History could not be loaded/.test(document.body.innerText), 5000, 'the failure notice');
  await cdp.evaluate(() => {
    window.__recoverHistory();
    [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Try Again').click();
  });
  await rowsLoaded();
  await settle();
  s = await state();
  check(s.ids.length === 14, 'Try Again reloads, and the rows arrive (FR-012)', `${s.ids.length} rows`);
  check(
    await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Filter by status'),
    'and focus moves to the chips, not <body>',
  );

  await go('/history?history=empty');
  await cdp.waitFor(() => !!document.querySelector('[aria-label="History table"]'), 5000, 'the empty table');
  s = await state();
  check(s.ids.length === 0 && s.text.includes('No requests have been resolved yet.'), 'nothing resolved shows its empty state');

  await go('/history?history=no-reason');
  await rowsLoaded();
  s = await state();
  for (const [id, label] of [['REQ-2026-1684', 'Reason for rejection'], ['REQ-2026-1677', 'Reason for cancellation']]) {
    const resolved = s.resolved[s.ids.indexOf(id)];
    check(resolved && resolved !== '—', `${id}: losing its reason keeps its RESOLVED date`, resolved);
    await open(id);
    p = await cdp.evaluate(panel);
    check(p.text.includes(label) && p.text.includes('No reason recorded'), `${id}: ${label} reads "No reason recorded"`);
    check(p.dated.at(-1), `${id}: and its ending node keeps its date`, JSON.stringify(p.dated));
    await esc();
    await closed();
  }

  await go('/history?history=received');
  await rowsLoaded();
  s = await state();
  check(
    !s.ids.includes('REQ-2026-1715') && s.ids.length === 14,
    'with all eight statuses present, a Received request stays off History',
    `${s.ids.length} rows`,
  );

  await go('/history?history=no-resolved-date');
  await rowsLoaded();
  s = await state();
  check(s.ids.at(-1) === 'REQ-2026-1690' && s.resolved.at(-1) === '—', 'no resolved date: RESOLVED shows — and it sorts last under Newest First', `${s.ids.at(-1)} ${s.resolved.at(-1)}`);
  await pickSort('Oldest First');
  await settle();
  s = await state();
  check(s.ids.at(-1) === 'REQ-2026-1690', 'and last under Oldest First', s.ids.at(-1));

  // ---- Keyboard and width (FR-015) ----
  console.log('\nKeyboard and width (FR-015)');
  await go('/history');
  await rowsLoaded();
  // From the top of the document, so Tab has to find Search too.
  await cdp.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  const reached = new Set();
  for (let i = 0; i < 60; i++) {
    await key('Tab', 'Tab', 9);
    const label = await cdp.evaluate(() => {
      const a = document.activeElement;
      if (!a) return '';
      if (a.matches('input[type="search"]')) return 'search';
      if (a.matches('[role="combobox"]')) return 'sort';
      if (a.closest('[aria-label="Filter by status"]')) return 'chip';
      if (a.getAttribute('aria-label')?.startsWith('Review request')) return 'review';
      if (a.closest('nav[aria-label="History pages"]')) return 'pages';
      return '';
    });
    if (label) reached.add(label);
    if (label === 'pages') break;
  }
  check(['search', 'sort', 'chip', 'review', 'pages'].every((l) => reached.has(l)), 'Tab reaches search, sort, chips, Review and pagination', [...reached].join(', '));
  for (const width of [360, 1440]) {
    await cdp.setViewport(width, 900);
    await settle();
    const overflow = await cdp.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `no page-level horizontal overflow at ${width}px`, `${overflow}px`);
  }
  await cdp.setViewport(360, 900);
  await open('REQ-2026-1650');
  const panelOverflow = await cdp.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  check(panelOverflow <= 0, 'nor at 360px with the panel open', `${panelOverflow}px`);
} catch (error) {
  check(false, `the run stopped: ${error.message}`);
} finally {
  await cdp.close();
}

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
