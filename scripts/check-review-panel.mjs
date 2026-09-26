/** BEN-47 — the Admin's review panel over the Requests Queue (spec 008),
 *  against its acceptance criteria. It runs through the same CDP client as the
 *  other gates (constitution VIII: no new QA dependency until Playwright lands).
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173.
 *
 *  Every navigation is a fresh document, so the seeded store is back to its
 *  fifteen requests each time. The `?review=` modes are the dev-only stub in
 *  `src/features/requests/queue/dev/review-stub.ts`. */
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
  if (path.startsWith('/queue')) {
    await cdp.waitFor(() => !!document.querySelector('button[aria-label^="Review request "]'), 8000, 'the queue rows');
  }
};

// ---- helpers that read the page ----
const page = () => ({
  path: location.pathname + location.search,
  ids: [...document.querySelectorAll('button[aria-label^="Review request "]')].map((b) =>
    b.getAttribute('aria-label').slice('Review request '.length),
  ),
  cards: document.querySelector('section[aria-label="Requests workload summary"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
  chips: document.querySelector('[role="group"][aria-label="Filter by status"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
});

const panel = () => {
  const d = document.querySelector('dialog[open]');
  if (!d) return null;
  return {
    heading: d.querySelector('h2')?.textContent.trim(),
    pill: d.querySelector('h2')?.nextElementSibling?.textContent.trim(),
    // The action area's buttons: everything but ✕ and the Selects.
    buttons: [...d.querySelectorAll('button')]
      .filter((b) => b.getAttribute('aria-label') !== 'Close' && b.getAttribute('role') !== 'combobox')
      .map((b) => b.textContent.trim()),
    text: d.textContent,
    stock: [...d.querySelectorAll('ul li')].map((li) => li.lastElementChild?.textContent.trim()),
    timeline: [...d.querySelectorAll('ol li')].map((li) => li.querySelector('span span')?.textContent.trim()),
    invalid: [...d.querySelectorAll('textarea')].some((t) => t.getAttribute('aria-invalid') === 'true'),
    alert: d.querySelector('[role="alert"]')?.textContent.trim() ?? null,
    selects: Object.fromEntries(
      [...d.querySelectorAll('button[role="combobox"]')].map((b) => [b.getAttribute('aria-label'), b.textContent.trim()]),
    ),
    focusInside: d.contains(document.activeElement),
  };
};

const open = async (id) => {
  // Focus first, the way a keyboard user reaches the button, so the panel has
  // something to return focus to.
  await cdp.evaluate((rid) => {
    const b = document.querySelector(`button[aria-label="Review request ${rid}"]`);
    b.focus();
    b.click();
  }, id);
  await cdp.waitFor(() => !!document.querySelector('dialog[open] h2'), 5000, `the panel for ${id}`);
};
const click = (label) =>
  cdp.evaluate((l) => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === l);
    if (!b) throw new Error(`no "${l}" button in the panel`);
    b.click();
  }, label);
// A real press and release on the scrim, left of the 400px sheet. The panel
// closes only when both land there, so a synthetic click() is not enough.
const mouse = async (type, x, y) => cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
const clickScrim = async () => {
  await mouse('mousePressed', 100, 500);
  await mouse('mouseReleased', 100, 500);
};
const settle = () => cdp.evaluate(() => new Promise((r) => setTimeout(r, 150)));
// Gone from the DOM, not merely closed: a natively closed <dialog> unmounts a
// moment later, when its `close` event is handled.
const closed = () => cdp.waitFor(() => !document.querySelector('dialog'), 5000, 'the panel to close');
const esc = async () => {
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  }
};
const typeInto = async (selector, text) => {
  await cdp.evaluate((s) => document.querySelector(s).focus(), selector);
  await cdp.send('Input.insertText', { text });
};
const choose = async (selectLabel, option) => {
  await cdp.evaluate((l) => document.querySelector(`dialog[open] button[role="combobox"][aria-label="${l}"]`).click(), selectLabel);
  await cdp.waitFor(() => !!document.querySelector('[role="listbox"]'), 3000, `the ${selectLabel} list`);
  // The option must be really on screen and on top, not merely in the DOM: a
  // real click lands where the eye sees it.
  const hit = await cdp.evaluate((o) => {
    const li = [...document.querySelectorAll('[role="listbox"] [role="option"]')].find((x) => x.textContent.trim() === o);
    if (!li) return { error: `no option "${o}"` };
    const r = li.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, onTop: li.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) };
  }, option);
  if (hit.error) throw new Error(hit.error);
  if (!hit.onTop) fail(`the "${option}" option in ${selectLabel} is hidden or covered`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
  }
  await settle();
};

const EXPECTED = {
  'Pending Approval': ['Reject Request', 'Approve Request'],
  Approved: ['Update Status'],
  'For Delivery': ['Update Status'],
  'Ready for Pickup': ['Update Status'],
};

try {
  // ---- sign in as the seeded Admin ----
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate(() => {
    document.querySelector('input[value="ethan.cruz"]').click();
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  });
  await cdp.waitFor(() => location.pathname === '/queue', 8000, 'the admin landing');
  await go('/queue');

  // ---- FR-005 / SC-001: exactly the offered actions, per status ----
  console.log('\nFR-005 — every live status offers exactly its actions, and none offers Complete');
  const ids = (await cdp.evaluate(page)).ids;
  check(ids.length === 12, 'twelve live requests are listed', `got ${ids.length}`);
  for (const id of ids) {
    await open(id);
    const p = await cdp.evaluate(panel);
    const want = EXPECTED[p.pill];
    check(
      !!want && JSON.stringify(p.buttons) === JSON.stringify(want),
      `${id} (${p.pill}) offers ${want?.join(' / ')}`,
      `got ${p.buttons.join(' / ')}`,
    );
    if (p.buttons.includes('Complete')) fail(`${id} offers Complete before Received exists (FR-010)`);
    await esc();
    await closed();
  }

  // ---- US1: read-back, open and close ----
  console.log('\nStory 1 — the panel reads the request back and closes without navigating');
  await cdp.evaluate(() => {
    const s = document.querySelector('input[aria-label="Search requests"]');
    s.focus();
  });
  await cdp.send('Input.insertText', { text: 'REQ-2026' });
  await settle();
  await open('REQ-2026-1847');
  let p = await cdp.evaluate(panel);
  check(p.heading === 'REQ-2026-1847' && p.pill === 'Pending Approval', 'the header carries the id and its pill');
  check(p.text.includes('Maya Santos') && p.text.includes('mayas@codev.com • Davao Office'), 'REQUESTED BY reads name and `email • office`');
  check(
    p.text.includes('Business Laptop - Dell Latitude') && JSON.stringify(p.stock) === JSON.stringify(['12 in stock', '24 in stock', '12 in stock']),
    'the lines read back with CURRENT INVENTORY from the source',
    p.stock.join(', '),
  );
  check(p.text.includes('Note to Approver') && p.text.includes('temporary project setup'), 'the note reads back');
  check(p.timeline.join(' → ') === 'Submitted → Approved → For Delivery/For Pickup → Complete', 'the four drawn timeline nodes', p.timeline.join(' → '));
  check(p.focusInside, 'focus moves into the panel');
  check((await cdp.evaluate(page)).path === '/queue', 'opening does not change the address');
  await esc();
  await closed();
  check(
    await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Review request REQ-2026-1847'),
    'Esc closes it and focus returns to that row’s Review',
  );
  check(
    await cdp.evaluate(() => document.querySelector('input[aria-label="Search requests"]').value === 'REQ-2026'),
    'the queue’s search survives the panel (FR-002)',
  );
  await open('REQ-2026-1847');
  await cdp.evaluate(() => document.querySelector('dialog[open] button[aria-label="Close"]').click());
  await closed();
  pass('✕ closes it');
  await open('REQ-2026-1847');
  // Review round 1: a drag that starts inside the sheet (selecting typed
  // text) and ends on the scrim must not close the panel. Wait for the sheet
  // to finish sliding in, or the press can land on the scrim it is crossing.
  await cdp.evaluate(() => new Promise((r) => setTimeout(r, 400)));
  await mouse('mousePressed', 1240, 60);
  await mouse('mouseMoved', 600, 500);
  await mouse('mouseReleased', 100, 500);
  await settle();
  check(await cdp.evaluate(() => !!document.querySelector('dialog[open]')), 'a drag from the sheet onto the scrim does not close it');
  await mouse('mousePressed', 100, 500);
  await mouse('mouseMoved', 600, 500);
  await mouse('mouseReleased', 1240, 60);
  await settle();
  check(await cdp.evaluate(() => !!document.querySelector('dialog[open]')), 'nor does a drag from the scrim into the sheet');
  await clickScrim();
  await closed();
  pass('a scrim click closes it');

  await go('/queue');
  await open('REQ-2026-1838');
  p = await cdp.evaluate(panel);
  check(
    p.stock[0]?.startsWith('—') && p.stock[0].includes('Stock figure unavailable'),
    'a line with no stock figure shows a marker, with words for screen readers, not `0 in stock`',
    p.stock[0],
  );
  await esc();
  await closed();

  // ---- US2: reject ----
  console.log('\nStory 2 — reject needs a reason, then reads it back with Close only');
  await go('/queue');
  const before = await cdp.evaluate(page);
  await open('REQ-2026-1842');
  await click('Reject Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea'), 3000, 'the reason field');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Reason for rejection') && p.buttons.join('/') === 'Cancel/Confirm Rejection', 'the reason block offers Cancel / Confirm Rejection');
  await click('Confirm Rejection');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Pending Approval', 'an empty reason is refused and the status stays');
  await typeInto('dialog[open] textarea', '   ');
  await click('Confirm Rejection');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Pending Approval', 'a whitespace-only reason is refused too');
  await click('Cancel');
  await settle();
  p = await cdp.evaluate(panel);
  check(JSON.stringify(p.buttons) === JSON.stringify(EXPECTED['Pending Approval']), 'Cancel backs out to the pending actions');
  check(p.focusInside, 'and focus stays inside the panel');
  await click('Reject Request');
  await typeInto('dialog[open] textarea', 'Duplicate of request SR-1042');
  await click('Confirm Rejection');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Rejected', 5000, 'Rejected');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Reason for rejection') && p.text.includes('Duplicate of request SR-1042'), 'the reason reads back');
  check(JSON.stringify(p.buttons) === '["Close"]', 'Close is the only action', p.buttons.join(' / '));
  check(p.timeline.join(' → ') === 'Submitted → Rejected', 'the timeline collapses to Submitted → Rejected', p.timeline.join(' → '));
  let after = await cdp.evaluate(page);
  check(!after.ids.includes('REQ-2026-1842'), 'the request has left the queue behind the panel');
  check(before.cards.includes('4 Pending approval') && after.cards.includes('3 Pending approval'), 'Pending approval drops by one', after.cards);
  await click('Close');
  await closed();
  check(
    await cdp.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Filter by status'),
    'Close leaves; the row is gone, so focus lands on the chips',
  );

  // ---- US2: approve ----
  console.log('\nStory 2 — approve moves the request on and offers Update Status');
  await go('/queue');
  await open('REQ-2026-1847');
  await click('Approve Request');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Approved', 5000, 'Approved');
  p = await cdp.evaluate(panel);
  check(JSON.stringify(p.buttons) === '["Update Status"]', 'the panel now offers Update Status');
  check(p.timeline[1] === 'Approved', 'the timeline reaches Approved');
  after = await cdp.evaluate(page);
  check(after.cards.includes('3 Pending approval') && after.cards.includes('9 In Processing'), 'the summary cards follow the source', after.cards);

  // ---- US3: update status ----
  console.log('\nStory 3 — hand over by delivery or pickup');
  await click('Update Status');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.selects.Status === 'For Delivery', 'from Approved the Status select starts on For Delivery, as drawn', p.selects.Status);
  check(!('Pickup location' in p.selects), 'no location is asked for delivery');
  await choose('Status', 'Ready for Pickup');
  p = await cdp.evaluate(panel);
  check(p.selects['Pickup location'] === 'Davao Office', 'Ready for Pickup asks for a location, preselecting the request’s office', p.selects['Pickup location']);
  await choose('Pickup location', 'Other…');
  await cdp.evaluate(() => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit');
    b.click();
  });
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Approved', '`Other…` with no text is refused and the status stays');
  await typeInto('dialog[open] textarea', '6th floor IT desk');
  await cdp.evaluate(() => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit');
    b.click();
  });
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Ready for Pickup', 5000, 'Ready for Pickup');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Pickup location') && p.text.includes('6th floor IT desk'), 'the pickup location reads back');
  check(p.timeline[2] === 'Ready for Pickup', 'the handover node names the state taken', p.timeline[2]);
  check(JSON.stringify(p.buttons) === '["Update Status"]' && !p.buttons.includes('Complete'), 'a handover state offers Update Status, and no Complete');

  await click('Update Status');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.selects.Status === 'For Delivery', 'from a handover state the select starts on its peer', p.selects.Status);
  await cdp.evaluate(() => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit');
    b.click();
  });
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'For Delivery', 5000, 'For Delivery');
  p = await cdp.evaluate(panel);
  check(!p.text.includes('6th floor IT desk'), 'swapping to For Delivery clears the pickup location');
  pass('the peers swap');

  // Esc on an open Select closes the list, not the panel.
  await click('Update Status');
  await settle();
  await cdp.evaluate(() => document.querySelector('dialog[open] button[role="combobox"][aria-label="Status"]').click());
  await cdp.waitFor(() => !!document.querySelector('[role="listbox"]'), 3000, 'the Status list');
  await cdp.evaluate(() => document.querySelector('[role="listbox"]').focus());
  await esc();
  await settle();
  check(
    await cdp.evaluate(() => !document.querySelector('[role="listbox"]') && !!document.querySelector('dialog[open]')),
    'Esc on an open select closes the list and keeps the panel',
  );
  await esc();
  await closed();

  // ---- the preselected office is always offered (accepted risk R4) ----
  console.log('\nEvery request’s office is in the pickup list (Pasig / Ortigas, contracts conflict 2)');
  await go('/queue');
  for (const id of ['REQ-2026-1805', 'REQ-2026-1748']) {
    await open(id);
    await click('Update Status');
    await settle();
    const statusNow = (await cdp.evaluate(panel)).selects.Status;
    if (statusNow !== 'Ready for Pickup') await choose('Status', 'Ready for Pickup');
    p = await cdp.evaluate(panel);
    check(/ Office$/.test(p.selects['Pickup location'] ?? ''), `${id} preselects an office from the list`, p.selects['Pickup location']);
    await esc();
    await closed();
  }

  // ---- review round 1: stored location, no-op updates, required selects ----
  console.log('\nA pickup keeps its stored location; an update that changes nothing is refused');
  await go('/queue');
  await open('REQ-2026-1715');
  await click('Update Status');
  await settle();
  await choose('Status', 'Ready for Pickup');
  p = await cdp.evaluate(panel);
  check(
    p.selects['Pickup location'] === 'Other…' &&
      (await cdp.evaluate(() => document.querySelector('dialog[open] textarea')?.value)) === '6th floor IT desk',
    'a Ready for Pickup request starts on the location it already has',
    p.selects['Pickup location'],
  );
  check(
    await cdp.evaluate(() =>
      [...document.querySelectorAll('dialog[open] button[role="combobox"]')].every((b) => b.getAttribute('aria-required') === 'true'),
    ),
    'both selects announce that they are required',
  );
  await cdp.evaluate(() => {
    [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit').click();
  });
  await settle();
  p = await cdp.evaluate(panel);
  check(p.pill === 'Ready for Pickup' && /already Ready for Pickup at that location/.test(p.text), 'submitting the same status and location is refused, and nothing is sent');
  await esc();
  await closed();

  await open('REQ-2026-1748');
  await click('Update Status');
  await settle();
  await choose('Status', 'For Delivery');
  await cdp.evaluate(() => {
    [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit').click();
  });
  await settle();
  p = await cdp.evaluate(panel);
  check(/already For Delivery\./.test(p.text), 'For Delivery to For Delivery is refused too');
  await esc();
  await closed();

  // ---- FR-014: refusals and failures ----
  console.log('\nFR-014 — a stale status is refused and shown; a failure keeps the input');
  await go('/queue?review=changes');
  await open('REQ-2026-1847');
  await click('Approve Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the refusal');
  p = await cdp.evaluate(panel);
  check(p.alert?.includes('updated while you were viewing it') && p.pill === 'Approved', 'the refusal says so and shows the current status', `${p.pill}: ${p.alert}`);
  check(JSON.stringify(p.buttons) === '["Update Status"]', 'and the current status’s actions');
  await esc();
  await closed();

  await go('/queue?review=failing');
  await open('REQ-2026-1847');
  await click('Reject Request');
  await typeInto('dialog[open] textarea', 'Budget freeze');
  await click('Confirm Rejection');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the failure');
  p = await cdp.evaluate(panel);
  check(p.pill === 'Pending Approval', 'a failed reject leaves the status unchanged');
  check(await cdp.evaluate(() => document.querySelector('dialog[open] textarea')?.value === 'Budget freeze'), 'and keeps the typed reason for a retry');
  await esc();
  await closed();

  await go('/queue?review=reload-fails');
  await open('REQ-2026-1847');
  await click('Approve Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the reload notice');
  p = await cdp.evaluate(panel);
  check(!!p && p.alert?.includes('could not be loaded'), 'a failed reload keeps the panel open and says so');
  // The stale panel still offers Approve. Trying again is refused (as
  // `unavailable`, since the reload fails too), and both messages show: the
  // saved-but-stale warning first, because it explains the refusal.
  await click('Approve Request');
  await settle();
  const alerts = await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] [role="alert"]')].map((a) => a.textContent.trim()));
  check(
    alerts.length === 2 && alerts[0].includes('could not be loaded') && alerts[1].includes('could not be updated'),
    'a later refusal joins the stale warning instead of replacing it',
    JSON.stringify(alerts),
  );
  await esc();
  await closed();
  await open('REQ-2026-1847');
  p = await cdp.evaluate(panel);
  check(p.alert?.includes('could not be loaded'), 'closing retried the reload; it failed again, so reopening still warns');
  await esc();
  await closed();
  await open('REQ-2026-1842');
  p = await cdp.evaluate(panel);
  check(!p.alert, 'the warning belongs to its request, not to the next one opened', p.alert);
  await esc();
  await closed();

  // ---- SC-006: no Employee path ----
  console.log('\nSC-006 — an Employee cannot reach the queue or any review action');
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate(() => {
    document.querySelector('input[value="maya.santos"]').click();
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  });
  await cdp.waitFor(() => location.pathname === '/catalog', 8000, 'the employee landing');
  await cdp.goto(`${ORIGIN}/queue`);
  await settle();
  await settle();
  check(
    await cdp.evaluate(() => !document.querySelector('button[aria-label^="Review request "]') && !document.querySelector('dialog[open]')),
    'an Employee on /queue sees no Review and no panel',
  );
} finally {
  await cdp.close?.();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll review-panel checks passed');
process.exit(failures ? 1 : 0);
