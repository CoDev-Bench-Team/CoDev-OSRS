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
// While a request is pending the panel holds two text boxes: the optional
// Other Notes and, once rejecting, the required reason.
const REASON = 'dialog[open] textarea[required]';
const REJECT_REQUIRED = 'Enter a reason for rejecting this request.';
const CANCEL_REQUIRED = 'Enter a reason for cancelling this request.';
const NOTES = 'dialog[open] textarea:not([required])';
const notesValue = () => document.querySelector('dialog[open] textarea:not([required])')?.value ?? null;

const page = () => ({
  path: location.pathname + location.search,
  ids: [...document.querySelectorAll('button[aria-label^="Review request "]')].map((b) =>
    b.getAttribute('aria-label').slice('Review request '.length),
  ),
  cards: document.querySelector('section[aria-label="Requests workload summary"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
  chips: document.querySelector('[role="group"][aria-label="Filter by status"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
  // Each chip as label → count, read from its "Label (n)" text.
  chipCounts: Object.fromEntries(
    [...document.querySelectorAll('[role="group"][aria-label="Filter by status"] button')].map((b) => {
      const [, label, n] = b.textContent.match(/^(.*)\((\d[\d,]*)\)$/) ?? [];
      return [label?.trim(), Number(n?.replace(/,/g, ''))];
    }),
  ),
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
    // Each node's date line: the last line of its label column.
    when: [...d.querySelectorAll('ol li')].map((li) => li.lastElementChild?.lastElementChild?.textContent.trim()),
    headingFocused: document.activeElement === d.querySelector('h2'),
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
const tab = async (shift = false) => {
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0 });
  }
};
const focused = () => cdp.evaluate(() => document.activeElement?.textContent.trim() ?? null);
const typeInto = async (selector, text) => {
  await cdp.evaluate((s) => document.querySelector(s).focus(), selector);
  await cdp.send('Input.insertText', { text });
};
// The Update Status confirmation (FR-008b), a modal stacked above the panel.
const CONFIRM = 'dialog[open][role="alertdialog"]';
// Focused first, as a real press focuses it, so the confirmation has an opener
// to return focus to.
const submitStatus = () =>
  cdp.evaluate(() => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status' && x.type === 'submit');
    b.focus();
    b.click();
  });
const confirmation = () =>
  cdp.evaluate((s) => {
    const d = document.querySelector(s);
    return d ? { title: d.querySelector('h2')?.textContent.trim(), text: d.textContent, focused: document.activeElement?.textContent.trim() } : null;
  }, CONFIRM);
const asked = () => cdp.waitFor(() => !!document.querySelector('dialog[open][role="alertdialog"]'), 3000, 'the confirmation');
const answer = (label) =>
  cdp.evaluate(
    (s, l) => [...document.querySelector(s).querySelectorAll('button')].find((b) => b.textContent.trim() === l).click(),
    CONFIRM,
    label,
  );
const optionsOf = async (selectLabel) => {
  await cdp.evaluate((l) => document.querySelector(`dialog[open] button[role="combobox"][aria-label="${l}"]`).click(), selectLabel);
  await cdp.waitFor(() => !!document.querySelector('[role="listbox"]'), 3000, `the ${selectLabel} list`);
  const options = await cdp.evaluate(() => [...document.querySelectorAll('[role="listbox"] [role="option"]')].map((x) => x.textContent.trim()));
  await cdp.evaluate(() => document.querySelector('[role="listbox"]').focus());
  await esc();
  await settle();
  return options;
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
  Approved: ['Cancel Request', 'Update Status'],
  // Its items are out with the delivery: no cancel (constitution 8.0.0 IV).
  'For Delivery': ['Update Status'],
  'Ready for Pickup': ['Cancel Request', 'Update Status'],
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
  check(
    p.timeline.join(' → ') === 'Submitted → Approved → For Delivery/For Pickup → Received → Complete',
    'the five drawn timeline nodes (constitution 5.0.0)',
    p.timeline.join(' → '),
  );
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

  // The seed always has a figure; the stub takes it away (dev only).
  await go('/queue?review=no-stock-figure');
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
  p = await cdp.evaluate(panel);
  check(
    await cdp.evaluate((sel) => {
      const t = document.querySelector(sel);
      return !!t && !t.required && t.labels?.[0]?.textContent.trim() === 'Other Notes (optional)';
    }, NOTES),
    'a pending request offers an optional Other Notes field over the decision (FR-007a)',
  );
  await typeInto(NOTES, 'Reuse the returned dock');
  await click('Reject Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea[required]'), 3000, 'the reason field');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Reason for rejection') && p.buttons.join('/') === 'Cancel/Confirm Rejection', 'the reason block offers Cancel / Confirm Rejection');
  await click('Confirm Rejection');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Pending Approval', 'an empty reason is refused and the status stays');
  await typeInto(REASON, '   ');
  await click('Confirm Rejection');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Pending Approval', 'a whitespace-only reason is refused too');
  await click('Cancel');
  await settle();
  p = await cdp.evaluate(panel);
  check(JSON.stringify(p.buttons) === JSON.stringify(EXPECTED['Pending Approval']), 'Cancel backs out to the pending actions');
  check(p.focusInside, 'and focus stays inside the panel');
  check(await cdp.evaluate(notesValue) === 'Reuse the returned dock', 'backing out keeps the typed Other Notes');
  await click('Reject Request');
  await typeInto(REASON, 'Duplicate of request SR-1042');
  await click('Confirm Rejection');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Rejected', 5000, 'Rejected');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Reason for rejection') && p.text.includes('Duplicate of request SR-1042'), 'the reason reads back');
  check(JSON.stringify(p.buttons) === '["Close"]', 'Close is the only action', p.buttons.join(' / '));
  check(await cdp.evaluate(notesValue) === null, 'Other Notes goes with the decision');
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
  check(JSON.stringify(p.buttons) === JSON.stringify(EXPECTED.Approved), 'the panel now offers Cancel Request and Update Status', p.buttons.join(' / '));
  check(await cdp.evaluate(notesValue) === null, 'an empty Other Notes does not stop approval, and the field goes with the decision');
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
  let options = await optionsOf('Status');
  check(JSON.stringify(options) === '["For Delivery","Ready for Pickup"]', 'from Approved the select offers the two peers, and no Received', options);
  await choose('Status', 'Ready for Pickup');
  p = await cdp.evaluate(panel);
  check(p.selects['Pickup location'] === 'Davao Office', 'Ready for Pickup asks for a location, preselecting the request’s office', p.selects['Pickup location']);
  await choose('Pickup location', 'Other…');
  await submitStatus();
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Approved', '`Other…` with no text is refused and the status stays');
  check((await confirmation()) === null, 'an invalid form asks for no confirmation');
  await typeInto('dialog[open] textarea', '6th floor IT desk');
  await submitStatus();
  await asked();
  let c = await confirmation();
  check(
    c.title === 'Update status?' && c.text.includes('from Approved to Ready for Pickup, collected at 6th floor IT desk'),
    'Update Status asks first, naming the change',
    c.text,
  );
  check(c.focused === 'Cancel', 'the confirmation opens on Cancel', c.focused);
  const stops = [];
  await tab();
  stops.push(await focused());
  await tab();
  stops.push(await focused());
  await tab(true);
  stops.push(await focused());
  check(
    JSON.stringify(stops) === '["Confirm","Cancel","Confirm"]',
    'Tab and Shift+Tab cycle between Cancel and Confirm, inside the confirmation',
    JSON.stringify(stops),
  );
  await answer('Cancel');
  await settle();
  p = await cdp.evaluate(panel);
  check((await confirmation()) === null && p.pill === 'Approved' && 'Status' in p.selects, 'Cancel sends nothing and keeps the form');
  check((await focused()) === 'Update Status', 'Cancel returns focus to Update Status', await focused());
  await submitStatus();
  await asked();
  await esc();
  await settle();
  p = await cdp.evaluate(panel);
  check((await confirmation()) === null && p?.pill === 'Approved' && 'Status' in p.selects, 'Esc closes the confirmation, not the panel');
  check((await focused()) === 'Update Status', 'Esc returns focus to Update Status', await focused());
  await submitStatus();
  await asked();
  const card = await cdp.evaluate(() => {
    const r = document.querySelector('dialog[open][role="alertdialog"] h2').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await mouse('mousePressed', card.x, card.y);
  await mouse('mouseMoved', 400, 500);
  await mouse('mouseReleased', 100, 500);
  await settle();
  check((await confirmation()) !== null, 'a drag from the confirmation onto its scrim does not cancel it');
  await clickScrim();
  await settle();
  p = await cdp.evaluate(panel);
  check((await confirmation()) === null && p?.pill === 'Approved' && 'Status' in p.selects, 'a scrim click cancels the confirmation and keeps the panel');
  await submitStatus();
  await asked();
  await answer('Confirm');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Ready for Pickup', 5000, 'Ready for Pickup');
  p = await cdp.evaluate(panel);
  check(p.text.includes('Pickup location') && p.text.includes('6th floor IT desk'), 'the pickup location reads back');
  check(p.timeline[2] === 'Ready for Pickup', 'the handover node names the state taken', p.timeline[2]);
  check(
    JSON.stringify(p.buttons) === JSON.stringify(EXPECTED['Ready for Pickup']) && !p.buttons.includes('Complete'),
    'Ready for Pickup offers Cancel Request and Update Status, and no Complete',
    p.buttons.join(' / '),
  );

  await click('Update Status');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.selects.Status === 'Received', 'from a handover state the select starts on Received', p.selects.Status);
  await choose('Status', 'For Delivery');
  await submitStatus();
  await asked();
  await answer('Confirm');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'For Delivery', 5000, 'For Delivery');
  p = await cdp.evaluate(panel);
  check(!p.text.includes('6th floor IT desk'), 'swapping to For Delivery clears the pickup location');
  const fullWidth = await cdp.evaluate(() => {
    const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Update Status');
    const row = b?.parentElement.getBoundingClientRect();
    return !!b && Math.abs(b.getBoundingClientRect().width - row.width) < 1;
  });
  check(
    JSON.stringify(p.buttons) === JSON.stringify(EXPECTED['For Delivery']) && fullWidth,
    'For Delivery offers Update Status alone, across the row, and no Cancel Request (constitution 8.0.0)',
    p.buttons.join(' / '),
  );
  pass('the peers swap');

  // The form never offers the current status, so only a race sends it: someone
  // else got there first. The source says so rather than succeeding (FR-014).
  const same = await cdp.evaluate(async () => {
    const { createSeededAdminRequestSource } = await import('/src/features/requests/queue/seeded-admin-request-source.ts');
    const source = createSeededAdminRequestSource();
    return [
      await source.updateStatus('REQ-2026-1748', 'For Delivery'),
      await source.updateStatus('REQ-2026-1715', 'Ready for Pickup', { kind: 'office', office: 'Makati' }),
    ];
  });
  check(
    same.every((r) => !r.ok && r.refusal === 'status-changed'),
    'a handover to the status the request already has is refused status-changed',
    JSON.stringify(same),
  );

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
  console.log('\nEvery request’s office is in the pickup list (the contract’s offices)');
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

  // ---- the current status is not offered; both selects are required ----
  console.log('\nThe Status select never offers the current status');
  await go('/queue');
  await open('REQ-2026-1715');
  await click('Update Status');
  await settle();
  options = await optionsOf('Status');
  check(JSON.stringify(options) === '["Received","For Delivery"]', 'Ready for Pickup offers Received and For Delivery only', options);
  await esc();
  await closed();

  await open('REQ-2026-1748');
  await click('Update Status');
  await settle();
  options = await optionsOf('Status');
  check(JSON.stringify(options) === '["Received","Ready for Pickup"]', 'For Delivery offers Received and Ready for Pickup only', options);
  await choose('Status', 'Ready for Pickup');
  check(
    await cdp.evaluate(() =>
      [...document.querySelectorAll('dialog[open] button[role="combobox"]')].every((b) => b.getAttribute('aria-required') === 'true'),
    ),
    'both selects announce that they are required',
  );
  await esc();
  await closed();

  // ---- FR-008a: the Admin marks a handed-over request Received ----
  console.log('\nFR-008a — a handover state can be marked Received');
  await open('REQ-2026-1703');
  await click('Update Status');
  await settle();
  options = await optionsOf('Status');
  check(JSON.stringify(options) === '["Received","For Delivery"]', 'from a handover state the select offers Received first, then the other peer', options);
  p = await cdp.evaluate(panel);
  check(p.selects.Status === 'Received', 'Received is preselected', p.selects.Status);
  check(!('Pickup location' in p.selects), 'Received asks for no location');
  await submitStatus();
  await asked();
  c = await confirmation();
  check(
    c.text.includes('from Ready for Pickup to Received') && c.text.includes('cannot be undone'),
    'the confirmation warns that Received cannot be undone',
    c.text,
  );
  await answer('Confirm');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === 'Received', 5000, 'Received');
  p = await cdp.evaluate(panel);
  check(p.timeline[2] === 'Ready for Pickup' && p.timeline[3] === 'Received', 'the timeline keeps the handover taken and reaches Received', p.timeline);
  check(JSON.stringify(p.buttons) === '[]', 'Received offers no action until Complete is built', p.buttons);
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
  check(JSON.stringify(p.buttons) === JSON.stringify(EXPECTED.Approved), 'and the current status’s actions', p.buttons.join(' / '));
  await esc();
  await closed();

  await go('/queue?review=failing');
  await open('REQ-2026-1847');
  await typeInto(NOTES, 'Bag and charger');
  await click('Reject Request');
  await typeInto(REASON, 'Budget freeze');
  await click('Confirm Rejection');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the failure');
  p = await cdp.evaluate(panel);
  check(p.pill === 'Pending Approval', 'a failed reject leaves the status unchanged');
  check(await cdp.evaluate((sel) => document.querySelector(sel)?.value === 'Budget freeze', REASON), 'and keeps the typed reason for a retry');
  check(await cdp.evaluate(notesValue) === 'Bag and charger', 'and the typed Other Notes too');
  await esc();
  await closed();

  await open('REQ-2026-1748');
  await click('Update Status');
  await settle();
  await choose('Status', 'Ready for Pickup');
  await choose('Pickup location', 'Other…');
  await typeInto('dialog[open] textarea', 'Gate 2 lobby');
  await submitStatus();
  await asked();
  await answer('Confirm');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the failure');
  p = await cdp.evaluate(panel);
  check((await confirmation()) === null, 'a failed update closes the confirmation, so the notice is in view');
  check(p.pill === 'For Delivery' && p.alert?.includes('could not be updated'), 'and leaves the status unchanged', `${p.pill}: ${p.alert}`);
  check(
    p.selects.Status === 'Ready for Pickup' &&
      (await cdp.evaluate(() => document.querySelector('dialog[open] textarea')?.value)) === 'Gate 2 lobby',
    'and keeps the chosen status and location for a retry',
  );
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

  // ---- US5: Admin cancel (BEN-135) ----
  console.log('\nStory 5 — an Admin cancels a request that cannot be fulfilled');
  const cancelIn = async (id, reason) => {
    await open(id);
    await click('Cancel Request');
    await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea[required]'), 3000, 'the cancellation reason');
    if (reason !== undefined) await typeInto(REASON, reason);
  };
  // `waitFor` serialises its predicate and passes no arguments, so the wanted
  // pill is written into the predicate's source.
  const toPill = (want) =>
    cdp.waitFor(
      new Function(`return document.querySelector('dialog[open] h2')?.nextElementSibling?.textContent.trim() === ${JSON.stringify(want)};`),
      5000,
      want,
    );
  // Seeded timestamps as the panel prints them, through the app's own formatter.
  const formatted = (isos) =>
    cdp.evaluate(async (xs) => {
      const { formatDateTime } = await import('/src/features/requests/format.ts');
      return xs.map(formatDateTime);
    }, isos);

  await go('/queue');
  const beforeCancel = await cdp.evaluate(page);
  await cancelIn('REQ-2026-1805');
  const field = await cdp.evaluate((sel) => {
    const t = document.querySelector(sel);
    return { label: t.labels?.[0]?.textContent.trim(), placeholder: t.placeholder, required: t.required };
  }, REASON);
  check(
    field.required && field.label === 'Reason for cancellation *' && field.placeholder === 'e.g item discontinued, no stock at this office...',
    'Cancel Request asks for a required Reason for cancellation, with the Admin’s placeholder',
    JSON.stringify(field),
  );
  p = await cdp.evaluate(panel);
  check(p.buttons.join('/') === 'Cancel/Confirm Cancellation', 'the block offers Cancel / Confirm Cancellation, and Update Status is gone', p.buttons.join(' / '));
  await click('Confirm Cancellation');
  await settle();
  p = await cdp.evaluate(panel);
  check(
    p.invalid && p.pill === 'Approved' && p.text.includes(CANCEL_REQUIRED) && !p.text.includes(REJECT_REQUIRED),
    'an empty reason is refused with the cancel form’s own message, and the status stays',
  );
  await typeInto(REASON, '   ');
  await click('Confirm Cancellation');
  await settle();
  p = await cdp.evaluate(panel);
  check(p.invalid && p.pill === 'Approved' && p.text.includes(CANCEL_REQUIRED), 'a whitespace-only reason is refused too');
  await click('Cancel');
  await settle();
  p = await cdp.evaluate(panel);
  check(JSON.stringify(p.buttons) === JSON.stringify(EXPECTED.Approved), 'Cancel backs out to the actions', p.buttons.join(' / '));
  check(p.focusInside, 'and focus stays inside the panel');
  await click('Cancel Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea[required]'), 3000, 'the cancellation reason');
  check(await cdp.evaluate((sel) => document.querySelector(sel).value === '', REASON), 'backing out discarded the typed reason');
  await typeInto(REASON, 'Model discontinued by the supplier');
  await click('Confirm Cancellation');
  await settle();
  check((await confirmation()) === null, 'no confirmation dialog follows the reason (FR-023)');
  await toPill('Cancelled');
  p = await cdp.evaluate(panel);
  check(p.timeline.join(' → ') === 'Submitted → Approved → Cancelled', 'the timeline keeps Approved before Cancelled (FR-022)', p.timeline.join(' → '));
  const seededDates1805 = await formatted(['2026-08-29T13:20:00Z', '2026-08-30T02:05:00Z']);
  check(
    p.when[0] === seededDates1805[0] && p.when[1] === seededDates1805[1] && !!p.when[2] && p.when[2] !== '—',
    'each node keeps its date: the seeded Submitted and Approved, and the cancel’s own',
    p.when.join(' / '),
  );
  check(p.headingFocused, 'focus lands on the panel heading once the form closes');
  check(p.text.includes('Reason for cancellation') && p.text.includes('Model discontinued by the supplier'), 'the reason reads back under Reason for cancellation');
  check(JSON.stringify(p.buttons) === '["Close"]', 'Close is the only action', p.buttons.join(' / '));
  const afterCancel = await cdp.evaluate(page);
  check(!afterCancel.ids.includes('REQ-2026-1805'), 'the request has left the queue behind the panel');
  check(
    beforeCancel.cards.includes('8 In Processing') && afterCancel.cards.includes('7 In Processing'),
    'In Processing drops by one',
    afterCancel.cards,
  );
  check(
    afterCancel.chipCounts.Approved === beforeCancel.chipCounts.Approved - 1 &&
      afterCancel.chipCounts['All requests'] === beforeCancel.chipCounts['All requests'] - 1,
    'the Approved and All requests chips each drop by one (FR-013)',
    `${JSON.stringify(beforeCancel.chipCounts)} → ${JSON.stringify(afterCancel.chipCounts)}`,
  );
  await click('Close');
  await closed();

  // In-app navigation keeps the seeded store, so History shows the cancel.
  await cdp.evaluate(() =>
    [...document.querySelectorAll('header nav a')].find((a) => a.getBoundingClientRect().width > 0 && a.textContent.trim() === 'History').click(),
  );
  await cdp.waitFor(() => location.pathname === '/history' && !!document.querySelector('button[aria-label^="Review request "]'), 8000, 'the History rows');
  check(
    await cdp.evaluate(() => !!document.querySelector('button[aria-label="Review request REQ-2026-1805"]')),
    'the just-cancelled request is listed in History',
  );
  await go('/queue');

  await cancelIn('REQ-2026-1715', 'Phone model recalled');
  await click('Confirm Cancellation');
  await toPill('Cancelled');
  p = await cdp.evaluate(panel);
  check(
    p.timeline.join(' → ') === 'Submitted → Approved → Ready for Pickup → Cancelled',
    'a cancelled pickup keeps its handover node',
    p.timeline.join(' → '),
  );
  const seededDates1715 = await formatted(['2026-08-07T04:00:00Z', '2026-08-08T01:00:00Z']);
  check(
    p.when[1] === seededDates1715[0] && p.when[2] === seededDates1715[1],
    'with the seeded Approved and handover dates',
    p.when.join(' / '),
  );
  check(!p.text.includes('Pickup location') && !p.text.includes('6th floor IT desk'), 'and no longer reads back a pickup location');
  await esc();
  await closed();

  await open('REQ-2026-1698');
  await click('Update Status');
  await settle();
  p = await cdp.evaluate(panel);
  check(!p.buttons.includes('Cancel Request'), 'while Update Status is open, Cancel Request is not offered', p.buttons.join(' / '));
  await esc();
  await closed();

  // A terminal request's deep link opens History's read-only panel (spec 013 FR-016).
  await go('/requests/REQ-2026-1677');
  await cdp.waitFor(() => document.querySelector('dialog[open] h2')?.textContent.trim() === 'REQ-2026-1677', 8000, 'the deep-linked cancelled request');
  p = await cdp.evaluate(panel);
  check(p.timeline.join(' → ') === 'Submitted → Approved → Cancelled', 'the seeded Admin cancel reads Submitted → Approved → Cancelled', p.timeline.join(' → '));
  const seededDates1677 = await formatted(['2026-07-28T06:00:00Z', '2026-07-29T02:00:00Z']);
  check(
    p.when[1] === seededDates1677[0] && p.when[2] === seededDates1677[1],
    'dated by approvedAt and cancellation.at',
    p.when.join(' / '),
  );
  check(
    (await cdp.evaluate(() => location.pathname)) === '/history' && p.buttons.length === 0,
    'a cancelled request opens read-only in History, with no Cancel Request',
    p.buttons.join(' / '),
  );
  await esc();
  await closed();

  await go('/queue?review=changes');
  await cancelIn('REQ-2026-1703', 'No stock at Cebu');
  await click('Confirm Cancellation');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the refusal');
  p = await cdp.evaluate(panel);
  check(
    p.alert?.includes('updated while you were viewing it') && p.pill === 'Received',
    'a cancel overtaken by the Employee’s receipt is refused and shows Received',
    `${p.pill}: ${p.alert}`,
  );
  check(!p.buttons.includes('Cancel Request'), 'and Cancel Request is gone', p.buttons.join(' / '));
  check(p.headingFocused, 'and focus lands on the panel heading');
  await esc();
  await closed();

  await cancelIn('REQ-2026-1805', 'No stock at Makati');
  await click('Confirm Cancellation');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the refusal');
  p = await cdp.evaluate(panel);
  check(
    p.alert?.includes('updated while you were viewing it') &&
      p.pill === 'For Delivery' &&
      JSON.stringify(p.buttons) === JSON.stringify(EXPECTED['For Delivery']),
    'a cancel overtaken by another Admin’s handover shows For Delivery, with Cancel Request gone',
    `${p.pill}: ${p.buttons.join(' / ')}`,
  );
  await esc();
  await closed();

  await go('/queue?review=failing');
  await cancelIn('REQ-2026-1805', 'Supplier backorder');
  await click('Confirm Cancellation');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the failure');
  p = await cdp.evaluate(panel);
  check(p.pill === 'Approved' && p.alert?.includes('could not be updated'), 'a failed cancel leaves the status unchanged', `${p.pill}: ${p.alert}`);
  check(await cdp.evaluate((sel) => document.querySelector(sel)?.value === 'Supplier backorder', REASON), 'and keeps the typed reason for a retry');
  await esc();
  await closed();

  await go('/queue?review=reload-fails');
  await cancelIn('REQ-2026-1805', 'Supplier backorder');
  await click('Confirm Cancellation');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] [role="alert"]'), 5000, 'the reload notice');
  p = await cdp.evaluate(panel);
  check(!!p && p.alert?.includes('could not be loaded'), 'a cancel whose reload fails keeps the panel open and says so');
  await esc();
  await closed();

  // The source itself refuses the reason, as the API's `400 #/reason` will:
  // the field goes back to invalid with its own message (FR-021).
  await go('/queue?review=reason-refused');
  await cancelIn('REQ-2026-1805', 'Supplier backorder');
  await click('Confirm Cancellation');
  await settle();
  p = await cdp.evaluate(panel);
  check(
    p.invalid && p.pill === 'Approved' && p.text.includes(CANCEL_REQUIRED) && !p.alert,
    'a reason the source refuses puts the cancel field back to invalid, with its own message',
    `${p.pill}: invalid=${p.invalid}, alert=${p.alert}`,
  );
  await esc();
  await closed();
  await open('REQ-2026-1847');
  await click('Reject Request');
  await cdp.waitFor(() => !!document.querySelector('dialog[open] textarea[required]'), 3000, 'the rejection reason');
  await typeInto(REASON, 'Duplicate');
  await click('Confirm Rejection');
  await settle();
  p = await cdp.evaluate(panel);
  check(
    p.invalid && p.pill === 'Pending Approval' && p.text.includes(REJECT_REQUIRED),
    'and the reject field the same way, with the reject message',
    `${p.pill}: invalid=${p.invalid}`,
  );
  await esc();
  await closed();

  // The dev stubs above replace `cancel`, so the seed's own guard is probed
  // directly: the API will refuse these, and the seed must not let them through.
  const guard = await cdp.evaluate(async () => {
    const { createSeededAdminRequestSource } = await import('/src/features/requests/queue/seeded-admin-request-source.ts');
    const source = createSeededAdminRequestSource();
    const setup = await source.updateStatus('REQ-2026-1703', 'Received');
    const refused = {};
    for (const id of ['REQ-2026-1847', 'REQ-2026-1748', 'REQ-2026-1703', 'REQ-2026-1690', 'REQ-2026-1684', 'REQ-2026-1677']) {
      refused[id] = await source.cancel(id, 'Not allowed');
    }
    const blank = await source.cancel('REQ-2026-1805', '   ');
    const missing = await source.cancel('REQ-2026-0000', 'No such request');
    const legal = await source.cancel('REQ-2026-1715', '  Recalled  ');
    // A failed delivery: back to Ready for Pickup, then cancellable.
    const swapped = await source.updateStatus('REQ-2026-1748', 'Ready for Pickup', { kind: 'office', office: 'Makati' });
    const afterSwap = await source.cancel('REQ-2026-1748', 'Courier could not deliver');
    const after = (await source.load()).requests.find((r) => r.id === 'REQ-2026-1715');
    return { setup, refused, blank, missing, legal, after, swapped, afterSwap };
  });
  check(guard.setup.ok, 'probe setup: REQ-2026-1703 reached Received', JSON.stringify(guard.setup));
  check(
    Object.values(guard.refused).every((r) => !r.ok && r.refusal === 'status-changed'),
    'the seed refuses a cancel from Pending, For Delivery, Received, Completed, Rejected or Cancelled',
    JSON.stringify(guard.refused),
  );
  check(!guard.blank.ok && guard.blank.refusal === 'reason-required', 'and a blank reason', JSON.stringify(guard.blank));
  check(!guard.missing.ok && guard.missing.refusal === 'unavailable', 'and an unknown request', JSON.stringify(guard.missing));
  check(
    guard.legal.ok &&
      guard.after.status === 'Cancelled' &&
      guard.after.cancellation?.reason === 'Recalled' &&
      !!guard.after.cancellation?.at &&
      guard.after.approvedAt === '2026-08-07T04:00:00Z' &&
      guard.after.handedOverAt === '2026-08-08T01:00:00Z',
    'a legal cancel stores the trimmed reason and keeps the earlier timestamps',
    JSON.stringify(guard.after),
  );
  check(
    guard.swapped.ok && guard.afterSwap.ok,
    'a failed delivery moved back to Ready for Pickup can then be cancelled',
    JSON.stringify([guard.swapped, guard.afterSwap]),
  );

  // R10: the two-button row at the narrowest supported width.
  await cdp.setViewport(360, 800);
  await go('/queue');
  await open('REQ-2026-1805');
  const row = await cdp.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const bs = [...d.querySelectorAll('button')].filter((b) => ['Cancel Request', 'Update Status'].includes(b.textContent.trim()));
    const dr = d.getBoundingClientRect();
    const rs = bs.map((b) => b.getBoundingClientRect());
    return {
      count: bs.length,
      oneLine: rs.length === 2 && Math.abs(rs[0].top - rs[1].top) < 1,
      inside: rs.every((r) => r.left >= dr.left && r.right <= dr.right),
      unclipped: bs.every((b) => b.scrollWidth <= b.clientWidth),
      pageFits: document.documentElement.scrollWidth <= window.innerWidth,
    };
  });
  check(
    row.count === 2 && row.oneLine && row.inside && row.unclipped && row.pageFits,
    'at 360px Cancel Request and Update Status share one line, inside the panel, with no overflow',
    JSON.stringify(row),
  );
  await esc();
  await closed();
  await cdp.setViewport(1440, 1024);

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
  await cdp.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll review-panel checks passed');
process.exit(failures ? 1 : 0);
