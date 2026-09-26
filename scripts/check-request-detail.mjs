/** BEN-45 — the Employee's request panel and cancel, against its five
 *  acceptance criteria. Runs through the same CDP client as the other gates
 *  (constitution VIII: no new QA dependency until Playwright lands with T020).
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173.
 *
 *  Every run starts from a fresh document, so the seeded source's in-memory
 *  store is back to its seven seeded requests. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';

let failures = 0;
const fail = (m) => {
  failures++;
  console.log(`  ✗ ${m}`);
};
const pass = (m) => console.log(`  ✓ ${m}`);
const check = (ok, m, detail = '') => (ok ? pass(m) : fail(`${m}${detail ? ` — ${detail}` : ''}`));

const cdp = await connect();
await cdp.setViewport(1440, 1024);

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

// ---- helpers that read the page ----
const rows = () =>
  [...document.querySelectorAll('main li')]
    .filter((li) => li.querySelector('button[aria-label^="View details"]'))
    .map((li) => ({
      id: li.querySelector('span').textContent.trim(),
      items: li.querySelectorAll('span')[2]?.textContent.trim(),
      pill: li.querySelectorAll('span')[3]?.textContent.trim(),
    }));

const panel = () => {
  const d = document.querySelector('dialog[open]');
  if (!d) return null;
  const buttons = [...d.querySelectorAll('button')].map((b) => b.textContent.trim());
  return {
    heading: d.querySelector('h2')?.textContent.trim(),
    pill: d.querySelector('h2')?.nextElementSibling?.textContent.trim(),
    buttons,
    text: d.textContent,
    timeline: [...d.querySelectorAll('ol li')].map((li) => [li.dataset.state, li.querySelector('span span')?.textContent.trim()]),
    invalid: d.querySelector('textarea')?.getAttribute('aria-invalid') === 'true',
    focusInside: d.contains(document.activeElement),
  };
};

const openRow = async (id) => {
  // Focus first, the way a keyboard user reaches the link: a scripted click()
  // alone moves no focus, so there would be nothing for the panel to return to.
  await cdp.evaluate((rid) => {
    const b = document.querySelector(`button[aria-label="View details of ${rid}"]`);
    b.focus();
    b.click();
  }, id);
  await cdp.waitFor(() => !!document.querySelector('dialog[open]'), 5000, `the panel for ${id}`);
};
const clickInPanel = (label) =>
  cdp.evaluate((l) => {
    [...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === l).click();
  }, label);
// Gone from the DOM, not merely closed: a natively closed <dialog> unmounts a
// moment later, when its `close` event is handled.
// A real press and release on the scrim, left of the 400px sheet. The panel
// closes only when both land there, so a synthetic click() is not enough.
const mouse = async (type, x, y) => cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
const clickScrim = async () => {
  await mouse('mousePressed', 100, 500);
  await mouse('mouseReleased', 100, 500);
};
const closed = () => cdp.waitFor(() => !document.querySelector('dialog'), 5000, 'the panel to close');
// Review of #38: closing the cancel form unmounts the focused control, and
// focus must neither sit on <body> nor Tab out to the page behind the scrim.
const focusInDialog = () => cdp.evaluate(() => !!document.querySelector('dialog[open]')?.contains(document.activeElement));
const pressTab = async () => {
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  }
};
const typeReason = async (text) => {
  await cdp.evaluate(() => document.querySelector('dialog[open] textarea').focus());
  await cdp.send('Input.insertText', { text });
};

// ---- sign in as the seeded Employee, open My Requests ----
await go('/login');
await cdp.evaluate(() => localStorage.clear());
await go('/login');
await cdp.evaluate(() => {
  document.querySelector('input[value="maya.santos"]').click();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
});
await cdp.waitFor(() => location.pathname === '/catalog', 8000, 'the employee landing');
await go('/requests');
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');

const initial = await cdp.evaluate(rows);
console.log('\nMy Requests lists the seeded requests with a View details on each (stand-in for BEN-44)');
check(initial.length === 7, 'seven requests, one per status', `got ${initial.length}`);
check(
  new Set(initial.map((r) => r.pill)).size === 7,
  'every one of the seven statuses has a row, Cancelled included',
  initial.map((r) => r.pill).join(', '),
);
check(new Set(initial.map((r) => r.id)).size === initial.length, 'every request id is unique');

// ---- AC1: opens from View details, closes without navigating ----
console.log('\nAC1 — the panel opens from View details and closes without navigating');
await openRow('REQ-2026-1847');
let p = await cdp.evaluate(panel);
check(p?.heading === 'REQ-2026-1847', 'View details opens that request', `heading ${p?.heading}`);
check(p?.focusInside, 'focus moves into the panel');
check((await cdp.evaluate(() => location.pathname)) === '/requests', 'opening does not change the address');

await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await closed();
pass('Esc closes it');
check(
  await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'View details of REQ-2026-1847'),
  'focus returns to the View details that opened it',
);

await openRow('REQ-2026-1847');
await cdp.evaluate(() => document.querySelector('dialog[open] button[aria-label="Close"]').click());
await closed();
pass('✕ closes it');

await openRow('REQ-2026-1847');
await clickScrim();
await closed();
pass('a click on the scrim closes it');
check((await cdp.evaluate(() => location.pathname)) === '/requests', 'and the address never changed');

// ---- AC2 + AC5: one action, only while pending; no confirm receipt anywhere ----
console.log('\nAC2 / AC5 — Cancel Request only while Pending Approval; no confirm-receipt control in any state');
for (const row of initial) {
  await openRow(row.id);
  p = await cdp.evaluate(panel);
  const offersCancel = p.buttons.includes('Cancel Request');
  check(
    offersCancel === (row.pill === 'Pending Approval'),
    `${row.id} (${row.pill}): Cancel Request ${row.pill === 'Pending Approval' ? 'offered' : 'absent'}`,
  );
  check(
    !/confirm receipt|mark (as )?received|received it|confirm received/i.test(p.text),
    `${row.id}: no confirm-receipt control or copy`,
  );
  check(p.timeline.length > 0 && p.timeline[0][1] === 'Submitted', `${row.id}: the status timeline starts at Submitted`);
  // BEN-67: a stopped request reads back its reason; no other state shows one.
  check(
    /Reason for rejection/.test(p.text) === (row.pill === 'Rejected') &&
      /Reason for cancellation/.test(p.text) === (row.pill === 'Cancelled'),
    `${row.id}: ${row.pill === 'Rejected' ? 'reads back its rejection reason' : row.pill === 'Cancelled' ? 'reads back its cancellation reason' : 'shows no stop reason'}`,
  );
  if (row.pill === 'Cancelled') {
    // `04.2 - Cancelled`: the timeline collapses to Submitted → Cancelled.
    check(
      JSON.stringify(p.timeline) === JSON.stringify([['reached', 'Submitted'], ['cancelled', 'Cancelled']]),
      `${row.id}: the timeline collapses to Submitted → Cancelled`,
      JSON.stringify(p.timeline),
    );
  }
  await cdp.evaluate(() => document.querySelector('dialog[open] button[aria-label="Close"]').click());
  await closed();
}

// ---- AC3: an empty reason is refused ----
console.log('\nAC3 — Confirm Cancellation is refused with an empty reason');
await openRow('REQ-2026-1847');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 5000, 'the cancel form');
await clickInPanel('Confirm Cancellation');
p = await cdp.evaluate(panel);
check(p.invalid, 'an empty reason is marked invalid');
check(p.pill === 'Pending Approval', 'and the status does not change', `pill ${p.pill}`);

await typeReason('    ');
await clickInPanel('Confirm Cancellation');
p = await cdp.evaluate(panel);
check(p.invalid && p.pill === 'Pending Approval', 'a reason of only spaces is refused the same way', `pill ${p.pill}`);

await clickInPanel('Cancel');
p = await cdp.evaluate(panel);
check(p.buttons.includes('Cancel Request') && !p.buttons.includes('Confirm Cancellation'), 'Cancel backs out of the form');
check(await focusInDialog(), 'backing out leaves focus inside the panel, not on the page (FR-002)');
await pressTab();
check(await focusInDialog(), 'and the next Tab stays inside the panel');

// ---- AC4: success cancels, and the row follows ----
console.log('\nAC4 — a reason cancels the request, and the row’s pill follows');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 5000, 'the cancel form');
await typeReason('duplicate request');
await clickInPanel('Confirm Cancellation');
await cdp.waitFor(
  () => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Cancelled',
  5000,
  'the panel to show Cancelled',
);
p = await cdp.evaluate(panel);
pass('the panel pill reads Cancelled');
check(
  JSON.stringify(p.timeline.map(([s, l]) => [s, l])) === JSON.stringify([['reached', 'Submitted'], ['cancelled', 'Cancelled']]),
  'the timeline collapses to Submitted → Cancelled, as 04.2 draws it',
  JSON.stringify(p.timeline),
);
check(!p.buttons.includes('Cancel Request'), 'Cancel Request is gone once cancelled');
check(await focusInDialog(), 'focus stays inside the panel after a successful cancel (FR-002)');
await pressTab();
check(await focusInDialog(), 'and the next Tab stays inside the panel');
check(
  p.text.includes('Reason for cancellation') && p.text.includes('duplicate request'),
  'the stored reason is read back under Reason for cancellation (BEN-70)',
);
const after = await cdp.evaluate(rows);
check(after.find((r) => r.id === 'REQ-2026-1847')?.pill === 'Cancelled', 'the row’s pill reads Cancelled');
check((await cdp.evaluate(() => location.pathname)) === '/requests', 'and nothing navigated');

// ---- Story 2 AC5 / FR-008: the request changed while the panel was open ----
// The seed never changes a request on its own, so the dev-only stub
// (`?requests=changes`) approves it the moment the Employee confirms. A fresh
// document also resets the in-memory seed, so REQ-2026-1847 is pending again.
console.log('\nStory 2 AC5 / FR-008 — a cancel refused because the request changed says so and shows its current status');
await go('/requests?requests=changes');
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');
await openRow('REQ-2026-1847');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 5000, 'the cancel form');
await typeReason('duplicate request');
await clickInPanel('Confirm Cancellation');
await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the refusal note');
p = await cdp.evaluate(panel);
check(p.text.includes('can no longer be cancelled'), 'the panel says the request changed and can no longer be cancelled');
check(p.pill === 'Approved', 'and shows its current status', `pill ${p.pill}`);
check(!p.buttons.includes('Cancel Request') && !p.buttons.includes('Confirm Cancellation'), 'and offers no cancel any more');
check((await cdp.evaluate(rows)).find((r) => r.id === 'REQ-2026-1847')?.pill === 'Approved', 'the row follows');
check(await focusInDialog(), 'focus stays inside the panel');

// ---- review of #38: the reload after a successful cancel fails ----
console.log('\nA cancel that went through survives a failed reload');
await go('/requests?requests=refresh-fails');
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');
await openRow('REQ-2026-1847');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 5000, 'the cancel form');
await typeReason('  duplicate request  ');
await clickInPanel('Confirm Cancellation');
await cdp.waitFor(
  () => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Cancelled',
  5000,
  'the panel to show Cancelled',
);
p = await cdp.evaluate(panel);
pass('the panel stays open and reads Cancelled');
check(p.text.includes('duplicate request') && !p.text.includes('  duplicate'), 'the reason is read back, trimmed');
check((await cdp.evaluate(rows)).find((r) => r.id === 'REQ-2026-1847')?.pill === 'Cancelled', 'the row reads Cancelled');
check(
  !(await cdp.evaluate(() => document.body.textContent.includes('could not be loaded'))),
  'the list is not swapped for the failure notice',
);
check(await focusInDialog(), 'focus stays inside the panel');

// ---- second review: refused, and the reload fails too ----
console.log('\nA refused cancel whose reload fails does not claim to show a current status');
await go('/requests?requests=changes-reload-fails');
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');
await openRow('REQ-2026-1847');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 5000, 'the cancel form');
await typeReason('duplicate request');
await clickInPanel('Confirm Cancellation');
await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the refusal note');
p = await cdp.evaluate(panel);
check(p.text.includes('could not be cancelled') && !p.text.includes('shown above'), 'the note says it could not be cancelled, and nothing about a current status');
check(p.pill === 'Pending Approval', 'the panel stays open on the status it last knew', `pill ${p.pill}`);
check(await focusInDialog(), 'focus stays inside the panel');

// ---- FR-011: distinct loading, empty and failure states ----
console.log('\nFR-011 — My Requests has distinct loading, empty and failure states');
const listState = () => ({
  rows: document.querySelectorAll('button[aria-label^="View details"]').length,
  loading: document.body.textContent.includes('Loading your requests'),
  empty: document.body.textContent.includes('You have not submitted any requests yet'),
  failed: document.body.textContent.includes('Your requests could not be loaded'),
  tryAgain: [...document.querySelectorAll('main button')].some((b) => b.textContent.trim() === 'Try Again'),
});

await go('/requests?requests=loading');
let l = await cdp.evaluate(listState);
check(l.loading && !l.rows && !l.empty && !l.failed, 'while loading it says so, and shows no table, empty state or failure', JSON.stringify(l));
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the rows after loading');
l = await cdp.evaluate(listState);
check(!l.loading && l.rows === 7, 'then the rows replace it', JSON.stringify(l));

await go('/requests?requests=empty');
await cdp.waitFor(() => document.body.textContent.includes('You have not submitted any requests yet'), 5000, 'the empty state');
l = await cdp.evaluate(listState);
check(l.empty && !l.rows && !l.failed && !l.loading, 'no requests reads as empty, not as a failure', JSON.stringify(l));

await go('/requests?requests=failing');
await cdp.waitFor(() => document.body.textContent.includes('Your requests could not be loaded'), 5000, 'the failure notice');
l = await cdp.evaluate(listState);
check(l.failed && l.tryAgain && !l.rows && !l.empty, 'a failed load shows the notice with Try Again, not an empty list', JSON.stringify(l));
await cdp.evaluate(() => [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Try Again').click());
await new Promise((r) => setTimeout(r, 300));
l = await cdp.evaluate(listState);
check(l.failed && l.tryAgain && !l.empty, 'Try Again retries, and a second failure still reads as a failure', JSON.stringify(l));

// ---- the shared item summary guards blank and missing names ----
console.log('\nThe Items cell drops blank names and shows a dash for none (shared summarizeItems)');
await go('/requests?requests=blank-items');
await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');
const blanks = await cdp.evaluate(rows);
const itemsOf = (id) => blanks.find((r) => r.id === id)?.items;
check(itemsOf('REQ-2026-1805') === '—', 'a request with no item names shows the em dash, not an empty cell', `got "${itemsOf('REQ-2026-1805')}"`);
check(itemsOf('REQ-2026-1842') === 'Monitor, Dock', 'a blank name is dropped before the summary and its count', `got "${itemsOf('REQ-2026-1842')}"`);

cdp.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall request-panel checks pass');
process.exit(failures ? 1 : 0);
