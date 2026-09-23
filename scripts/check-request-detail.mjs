/** BEN-45 — the Employee's request panel and cancel, against its five
 *  acceptance criteria. Runs through the same CDP client as the other gates
 *  (constitution VIII: no new QA dependency until Playwright lands with T020).
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173.
 *
 *  Every run starts from a fresh document, so the seeded source's in-memory
 *  store is back to its six drawn requests. */
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
      pill: li.querySelectorAll('span')[3]?.textContent.trim(),
    }));

const panel = () => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return null;
  const buttons = [...d.querySelectorAll('button')].map((b) => b.textContent.trim());
  return {
    heading: d.querySelector('h2')?.textContent.trim(),
    pill: d.querySelector('h2')?.nextElementSibling?.textContent.trim(),
    buttons,
    text: d.textContent,
    timeline: [...d.querySelectorAll('ol li')].map((li) => [li.dataset.state, li.querySelector('span span')?.textContent.trim()]),
    invalid: d.querySelector('input')?.getAttribute('aria-invalid') === 'true',
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
  await cdp.waitFor(() => !!document.querySelector('[role="dialog"]'), 5000, `the panel for ${id}`);
};
const clickInPanel = (label) =>
  cdp.evaluate((l) => {
    [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === l).click();
  }, label);
const closed = () => cdp.waitFor(() => !document.querySelector('[role="dialog"]'), 5000, 'the panel to close');
const typeReason = async (text) => {
  await cdp.evaluate(() => document.querySelector('[role="dialog"] input').focus());
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
check(initial.length === 6, 'six requests, one per drawn status', `got ${initial.length}`);
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
await cdp.evaluate(() => document.querySelector('[role="dialog"] button[aria-label="Close"]').click());
await closed();
pass('✕ closes it');

await openRow('REQ-2026-1847');
await cdp.evaluate(() => document.querySelector('[role="dialog"]').previousElementSibling.click());
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
  await cdp.evaluate(() => document.querySelector('[role="dialog"] button[aria-label="Close"]').click());
  await closed();
}

// ---- AC3: an empty reason is refused ----
console.log('\nAC3 — Confirm Cancellation is refused with an empty reason');
await openRow('REQ-2026-1847');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] input'), 5000, 'the cancel form');
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

// ---- AC4: success cancels, and the row follows ----
console.log('\nAC4 — a reason cancels the request, and the row’s pill follows');
await clickInPanel('Cancel Request');
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] input'), 5000, 'the cancel form');
await typeReason('duplicate request');
await clickInPanel('Confirm Cancellation');
await cdp.waitFor(
  () => document.querySelector('[role="dialog"] h2')?.nextElementSibling?.textContent.trim() === 'Cancelled',
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
const after = await cdp.evaluate(rows);
check(after.find((r) => r.id === 'REQ-2026-1847')?.pill === 'Cancelled', 'the row’s pill reads Cancelled');
check((await cdp.evaluate(() => location.pathname)) === '/requests', 'and nothing navigated');

cdp.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall request-panel checks pass');
process.exit(failures ? 1 : 0);
