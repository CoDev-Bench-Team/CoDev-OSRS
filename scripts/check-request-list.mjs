/** Spec 011 — the Request List drawer and submit (BEN-43).
 *
 *  Asserts the list (merge-and-cap, stepper bounds, Remove, the count at every
 *  step, persistence across routes, reset on sign-out), the marker as the only
 *  way in, submit with and without a note, the confirmation read back from the
 *  created request, the reserve (Available falls by the quantity), the
 *  all-or-nothing refusal, the contract's documented 400 placed field by field
 *  through the dev fixture (D19), the unreachable state, a reopen after the
 *  stock moved, that leaving the Catalog by Back does not leave the drawer set
 *  to reopen, the focus trap, that a held submit (`?slow-submit`) cannot be
 *  closed or sent twice, that Back mid-submit loses neither the confirmation
 *  nor a refusal, that an item added after Back mid-submit survives the
 *  submit's success, that signing out mid-submit carries nothing into the next
 *  session, that focus falls back to the invalid line or the note when a
 *  refusal has no drawer-level message, and that the Admin never sees any of
 *  it.
 *
 *  Seeded stock lives in memory, so Available is always asserted as a DELTA
 *  from a reading taken in the same page load, never as an absolute (plan
 *  Known Risks 5).
 *
 *  Needs `npm run dev`. Headless Chrome is started for you. Set
 *  OSRS_DEV_ORIGIN when the server is not on port 5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const EMPLOYEE = { account: 'maya.santos', landing: '/catalog' }; // home office: Davao
const ADMIN = { account: 'ethan.cruz', landing: '/queue' };
const MOUSE = { id: 'mice-logitech-m185', name: 'Logitech Mouse' };
const HUB = { id: 'hub-acer-usb3', name: 'Acer USB 3.0 Hub' }; // Davao: 1
const KEYBOARD = { id: 'other-logitech-keyboard', name: 'Logitech Keyboard' };

/** The contract's own documented 400 for `POST /requests`, verbatim, plus one
 *  line-scoped pointer so FR-013a's per-line placement is exercised too. */
const CONTRACT_400 = {
  type: 'validation-error',
  title: 'Validation Failed',
  status: 400,
  errors: [
    { detail: 'purpose is invalid', pointer: '#/purpose' },
    { detail: 'purpose is invalid', pointer: '#/purpose' },
    { detail: 'purpose is invalid', pointer: '#/purpose' },
    { detail: 'each value in nested property items must be either object or array', pointer: '#/items' },
    { detail: 'items is invalid', pointer: '#/items' },
    { detail: 'items is invalid', pointer: '#/items' },
    { detail: 'quantity must not be greater than 99', pointer: '#/items/0/quantity' },
  ],
};

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

/** Picks the seeded account and presses sign-in, without reloading the page. */
const signInInPlace = async ({ account, landing }) => {
  await cdp.waitFor(() => location.pathname === '/login', 8000, 'the sign-in screen');
  await cdp.waitFor(new Function(`return !!document.querySelector('input[value="${account}"]')`), 8000, 'the account chooser');
  await cdp.evaluate((id) => document.querySelector(`input[value="${id}"]`).click(), account);
  await cdp.evaluate(() =>
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click(),
  );
  await cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(landing)}`), 8000, landing);
};

async function signIn(who) {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await signInInPlace(who);
}

const gridReady = () => cdp.waitFor(() => !!document.querySelector('button[aria-label^="View specs for "]'), 8000, 'the grid');
const badge = () => cdp.evaluate(() => document.querySelector('[data-request-list-marker]')?.innerText.match(/(\d+)/)?.[1] ?? null);
const available = (id) =>
  cdp.evaluate((assetId) => window.__osrs.seededStock.available(assetId, 'Davao'), id);

/** The Available a card was last read with: 0 when its action reads `Out of
 *  stock` (spec 005 FR-009), else its stepper's ceiling, where `+` stops
 *  (FR-010). The card's own quantity is walked back to 1 afterwards, so the
 *  next add from it adds one. */
const cardCeiling = (name) =>
  cdp.evaluate(async (n) => {
    // A task between clicks: React commits each step before the next reads it.
    const frame = () => new Promise((r) => setTimeout(r, 0));
    const card = document.querySelector(`button[aria-label="View specs for ${n}"]`).closest('.shadow-card');
    const plus = card.querySelector('[aria-label="Increase quantity"]');
    const minus = card.querySelector('[aria-label="Decrease quantity"]');
    if ([...card.querySelectorAll('button')].some((b) => b.textContent === 'Out of stock' && b.disabled)) return 0;
    for (let i = 0; i < 500 && !plus.disabled; i++) {
      plus.click();
      await frame();
    }
    const ceiling = Number(card.querySelector('[aria-live="polite"]').textContent);
    for (let i = 0; i < 500 && !minus.disabled; i++) {
      minus.click();
      await frame();
    }
    return ceiling;
  }, name);

const addFromCard = async (name) => {
  await cdp.evaluate((n) => {
    const card = document.querySelector(`button[aria-label="View specs for ${n}"]`).closest('.shadow-card');
    [...card.querySelectorAll('button')].find((b) => b.textContent === 'Add to Request List').click();
  }, name);
  await settle();
};

const openMarker = async () => {
  await cdp.evaluate(() => document.querySelector('[data-request-list-marker]').click());
  await cdp.waitFor(() => !!document.querySelector('dialog[open]'), 8000, 'the drawer');
  await settle();
};

const closeWithEscape = async () => {
  // A real key press. The drawer is a native <dialog>, and the browser raises
  // its `cancel` only for a trusted Esc, never for a synthetic KeyboardEvent.
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  }
  await new Promise((r) => setTimeout(r, 600));
};

/** The drawer, read the same way after every interaction. */
const drawer = () =>
  cdp.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    if (!d) return null;
    const rows = [...d.querySelectorAll('ul[aria-label="Items in your request list"] > li')].map((li) => {
      const spans = li.querySelectorAll('span.truncate');
      const inc = li.querySelector('button[aria-label^="Increase"]');
      const dec = li.querySelector('button[aria-label^="Decrease"]');
      return {
        category: spans[0]?.textContent,
        name: spans[1]?.textContent,
        qty: Number(li.querySelector('[aria-live]').textContent),
        incEnabled: !inc.disabled,
        decEnabled: !dec.disabled,
        messages: [...li.querySelectorAll(':scope > ul > li')].map((m) => m.textContent),
      };
    });
    const note = d.querySelector('textarea');
    const submit = [...d.querySelectorAll('button')].find((b) => /Submit/.test(b.textContent));
    return {
      label: d.getAttribute('aria-label'),
      heading: d.querySelector('h2')?.textContent,
      rows,
      empty: d.innerText.includes('Your request list is empty'),
      note: note?.value ?? null,
      noteInvalid: note?.getAttribute('aria-invalid') === 'true',
      noteMessages: note ? [...(note.parentElement.querySelectorAll('ul > li') ?? [])].map((m) => m.textContent) : [],
      submit: submit ? { label: submit.textContent, enabled: !submit.disabled } : null,
      alert: [...(d.querySelector('[role="alert"]')?.querySelectorAll('p') ?? [])].map((p) => p.textContent),
      text: d.innerText,
    };
  });

const rowAction = async (name, label) => {
  await cdp.evaluate(
    ([n, l]) => document.querySelector(`dialog[open] button[aria-label="${l} ${n}"]`).click(),
    [name, label],
  );
  await settle();
};

const setNote = async (value) => {
  await cdp.evaluate((v) => {
    const t = document.querySelector('dialog[open] textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, v);
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await settle();
};

/** A real key press through the browser, so Tab moves focus as it would for a
 *  person — a synthetic KeyboardEvent never moves focus by itself. */
const press = async (key, { shift = false } = {}) => {
  const codes = { Tab: 9, Escape: 27 };
  const base = { key, code: key, windowsVirtualKeyCode: codes[key], modifiers: shift ? 8 : 0 };
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
};
const focusInDrawer = () =>
  cdp.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    return !!d && d.contains(document.activeElement);
  });
const clickNav = async (label, path) => {
  await cdp.evaluate((l) => [...document.querySelectorAll('header a, header button')].find((b) => b.textContent === l).click(), label);
  await cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(path)}`), 8000, path);
  await settle();
};

const pressSubmit = async () => {
  await cdp.evaluate(() =>
    [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click(),
  );
  await new Promise((r) => setTimeout(r, 600));
};

try {
  console.log('Story 1 — the list');
  await signIn(EMPLOYEE);
  await gridReady();
  check((await badge()) === '0', 'the count starts at 0', await badge());
  const mouseBefore = await available(MOUSE.id);
  await addFromCard(MOUSE.name);
  check((await badge()) === '1', 'adding an item adds a line (FR-005)', await badge());
  check((await cdp.evaluate(() => !!document.querySelector('dialog[open]'))) === false, 'adding does not open the drawer (FR-006a)');
  await addFromCard(MOUSE.name);
  check((await badge()) === '1', 'adding the same item again merges into its line (FR-002)', await badge());
  await addFromCard(HUB.name);
  check((await badge()) === '2', 'a second item is a second line', await badge());
  check((await available(MOUSE.id)) === mouseBefore, 'adding reserves nothing (FR-001)', `${mouseBefore} → ${await available(MOUSE.id)}`);

  await cdp.evaluate(() => document.querySelector('[data-request-list-marker]').focus());
  await openMarker();
  let d = await drawer();
  check(d?.label === 'Request List' && d?.heading === 'Request List', 'the marker opens the Request List drawer (FR-006)', d?.label);
  check(
    same(d?.rows.map((r) => [r.category, r.name, r.qty]), [
      ['Mice', MOUSE.name, 2],
      ['Type C Hub', HUB.name, 1],
    ]),
    'each row shows the category over the name, and the merged quantity (03 - Request List, 09-23)',
    JSON.stringify(d?.rows),
  );
  check(d?.rows[1].incEnabled === false, '+ stops at Available — 1 of 1 at Davao (FR-003)');
  check(d?.rows[1].decEnabled === false, '− stops at 1');
  await rowAction(MOUSE.name, 'Increase');
  check((await drawer()).rows[0].qty === 3, '+ raises a quantity by one');
  await rowAction(MOUSE.name, 'Decrease');
  check((await drawer()).rows[0].qty === 2, '− lowers it by one');
  await rowAction(HUB.name, 'Remove');
  d = await drawer();
  check(d.rows.length === 1 && (await badge()) === '1', 'Remove drops the line and the count (FR-004, FR-005)', `${d.rows.length} rows, badge ${await badge()}`);
  await closeWithEscape();
  check((await drawer()) === null, 'Esc closes the drawer');
  check(
    await cdp.evaluate(() => document.activeElement?.hasAttribute('data-request-list-marker')),
    'focus returns to the marker (Story 1 AC7)',
  );
  await openMarker();
  check((await drawer()).rows[0]?.qty === 2, 'closing keeps the list');
  await closeWithEscape();

  await cdp.evaluate(() => [...document.querySelectorAll('header a, header button')].find((b) => b.textContent === 'My Requests').click());
  await cdp.waitFor(() => location.pathname === '/requests', 8000, 'My Requests');
  check((await badge()) === '1', 'the list survives leaving the Catalog (FR-004a)', await badge());
  await openMarker();
  check(await cdp.evaluate(() => location.pathname === '/catalog'), 'the marker from elsewhere goes to the Catalog and opens the drawer (D3)');
  check((await drawer()).rows[0]?.qty === 2, 'with the list intact');
  await closeWithEscape();
  await new Promise((r) => setTimeout(r, 200));
  check(
    await cdp.evaluate(() => document.activeElement?.hasAttribute('data-request-list-marker')),
    'focus returns to the marker after a route change (D3)',
  );

  console.log('Story 2 + 3 — submit and read back');
  await openMarker();
  check((await drawer()).submit?.enabled === true, 'Submit Request is enabled with lines');
  await pressSubmit();
  d = await drawer();
  check(/^REQ-2026-\d+$/.test(d?.heading ?? ''), 'the confirmation shows the returned request id (FR-012)', d?.heading);
  check(d?.text.includes('Pending Approval'), 'with its Pending Approval pill');
  check(d?.text.includes('Request submitted'), 'titled Request submitted');
  check(
    d?.text.includes('Your request has been sent to your approver. We’ll email you whenever its status changes.'),
    'with the drawn confirmation copy',
  );
  check(d?.text.includes('Logitech Mouse - Logitech M185') && /Logitech M185\s*2/.test(d?.text), 'Items Requested lists the line and its quantity');
  check(!d?.text.includes('Note to Approver'), 'no note block when no note was sent (Story 3 AC4)');
  check(/Submitted\s*\n?\s*\w{3} \d+, \d{4}/.test(d?.text) && d?.text.includes('Pending'), 'the timeline starts at Submitted, the rest pending');
  check((await badge()) === '0', 'the count resets to 0 (FR-011)', await badge());
  check((await available(MOUSE.id)) === mouseBefore - 2, 'Available fell by exactly the quantity (SC-002)', `${mouseBefore} → ${await available(MOUSE.id)}`);
  const cardAfter = await cdp.evaluate(() => !!document.querySelector('button[aria-label="View specs for Logitech Mouse"]'));
  check(cardAfter, 'the Catalog re-read and still renders');
  await closeWithEscape();
  await openMarker();
  d = await drawer();
  check(d?.empty && d?.submit?.enabled === false, 'the next open shows the empty state with Submit disabled (FR-007, Story 3 AC6)');
  await closeWithEscape();

  await addFromCard(MOUSE.name);
  await addFromCard(KEYBOARD.name);
  await openMarker();
  await setNote('  temporary project setup  ');
  await pressSubmit();
  d = await drawer();
  check(d?.text.includes('Note to Approver') && d?.text.includes('temporary project setup'), 'the note is read back, trimmed (Story 3 AC4)');
  check(/Logitech Keyboard - Logitech K380\s*1/.test(d?.text ?? ''), 'every line is read back');
  await closeWithEscape();

  console.log('Story 4 — refusals');
  await addFromCard(HUB.name);
  await addFromCard(MOUSE.name);
  await openMarker();
  await setNote('for the new desk');
  // The hub's last unit goes elsewhere while the list is open.
  await cdp.evaluate((id) => window.__osrs.seededStock.reserve([{ assetId: id, quantity: 1 }], 'Davao'), HUB.id);
  const mouseBeforeRefusal = await available(MOUSE.id);
  await pressSubmit();
  d = await drawer();
  check(d?.alert.some((m) => m.startsWith('Not enough stock')), 'an over-stock submit is refused with the system’s message (FR-014)', JSON.stringify(d?.alert));
  check((await available(MOUSE.id)) === mouseBeforeRefusal, 'no line was reserved — not even the one in stock (FR-009)');
  check(d?.rows.length === 2 && d?.note === 'for the new desk', 'the lines and the note are kept (FR-015)');
  check(d?.heading === 'Request List', 'no request was created; the drawer is still editing');
  check(
    await cdp.evaluate(() => document.activeElement?.getAttribute('role') === 'alert'),
    'focus moves to the refusal, inside the drawer',
  );

  await cdp.evaluate((body) => {
    window.__osrs.submitFixture = body;
  }, CONTRACT_400);
  await pressSubmit();
  d = await drawer();
  check(same(d?.noteMessages, ['purpose is invalid']), '#/purpose lands under the note, once (FR-013a, D14)', JSON.stringify(d?.noteMessages));
  check(d?.noteInvalid, 'and marks the note invalid');
  check(same(d?.rows[0].messages, ['quantity must not be greater than 99']), '#/items/0/… lands under row 0', JSON.stringify(d?.rows[0].messages));
  check(
    same(d?.alert, ['each value in nested property items must be either object or array', 'items is invalid']),
    'bare #/items goes to the top of the drawer, deduplicated — nothing dropped (FR-013)',
    JSON.stringify(d?.alert),
  );
  await setNote('for the new desk!');
  check((await drawer()).noteInvalid === false, 'editing the note clears its message');

  // RFC 6901 decoding (D13): the fragment is percent-decoded first, so `%2F`
  // is a separator and `%70` is `p`; `~1` is a literal `/` inside one token;
  // a plain-string pointer is read too; an empty `detail` is no message.
  await cdp.evaluate((body) => {
    window.__osrs.submitFixture = body;
  }, {
    type: 'validation-error',
    title: 'Validation Failed',
    status: 400,
    errors: [
      { detail: 'percent-encoded separator', pointer: '#/items/0%2Fquantity' },
      { detail: 'escaped slash', pointer: '#/items~10' },
      { detail: 'percent-encoded name', pointer: '#/%70urpose' },
      { detail: 'plain pointer', pointer: '/items/1/quantity' },
      { detail: '', pointer: '#/purpose' },
      { detail: '   ', pointer: '#/items/0' },
    ],
  });
  await pressSubmit();
  d = await drawer();
  check(same(d?.rows[0].messages, ['percent-encoded separator']), '#/items/0%2F… is percent-decoded into a row-0 pointer', JSON.stringify(d?.rows[0].messages));
  check(same(d?.alert, ['escaped slash']), '~1 stays inside one token, so #/items~10 names no row and goes to the top', JSON.stringify(d?.alert));
  check(same(d?.noteMessages, ['percent-encoded name']), '#/%70urpose names the note; the empty detail adds nothing', JSON.stringify(d?.noteMessages));
  check(same(d?.rows[1].messages, ['plain pointer']), 'a plain-string /items/1/… pointer lands under row 1', JSON.stringify(d?.rows[1].messages));

  // A validation body with no usable message falls back to its title (SC-003).
  await cdp.evaluate((body) => {
    window.__osrs.submitFixture = body;
  }, { type: 'validation-error', title: 'Validation Failed', status: 400, errors: [{ detail: '', pointer: '#/purpose' }] });
  await pressSubmit();
  d = await drawer();
  check(same(d?.alert, ['Validation Failed']) && d?.noteInvalid === false, 'an all-empty validation body shows its title, never an empty message', JSON.stringify(d?.alert));

  await go('/catalog?fail-submit');
  await gridReady();
  check((await badge()) === '0', 'a reload starts a new list (FR-004a)', await badge());
  await addFromCard(MOUSE.name);
  await openMarker();
  await pressSubmit();
  d = await drawer();
  check(d?.alert.some((m) => m.startsWith('Your request was not sent')), 'an unreachable system says the request was not sent', JSON.stringify(d?.alert));
  check(d?.rows.length === 1, 'and keeps the list');
  await closeWithEscape();

  console.log('Reopen, leaving the Catalog, focus and the in-flight guard');
  // Leaving the Catalog with the drawer open, by browser Back, must not leave
  // it set to open itself on the next visit (FR-006a).
  await clickNav('My Requests', '/requests');
  await openMarker();
  check(await cdp.evaluate(() => location.pathname === '/catalog'), 'the marker from My Requests opens the drawer over the Catalog');
  await cdp.evaluate(() => history.back());
  await cdp.waitFor(() => location.pathname === '/requests', 8000, 'back to My Requests');
  await settle();
  await clickNav('Catalog', '/catalog');
  await gridReady();
  check((await drawer()) === null, 'returning to the Catalog after leaving by Back does not open the drawer (FR-006a)');

  // A fresh load: new list, new seeded stock, and a submit held for 1.5s.
  // `?slow-submit` lives in the address, so this comes after the navigation
  // above, which would drop it.
  await go('/catalog?slow-submit=1500');
  await gridReady();
  await addFromCard(MOUSE.name);
  await addFromCard(MOUSE.name);
  await addFromCard(KEYBOARD.name);
  // Someone else takes all but one mouse while the drawer is shut.
  const mouseLeft = await available(MOUSE.id);
  await cdp.evaluate(([id, n]) => window.__osrs.seededStock.reserve([{ assetId: id, quantity: n }], 'Davao'), [MOUSE.id, mouseLeft - 1]);
  await openMarker();
  d = await drawer();
  check(
    d?.rows[0]?.qty === 2 && d?.rows[0]?.incEnabled === false,
    'reopening after a reserve keeps a quantity above the fresher Available, with + disabled (FR-003, FR-006b)',
    JSON.stringify(d?.rows[0]),
  );
  await rowAction(MOUSE.name, 'Remove');

  // FR-006c: Tab and Shift+Tab never leave the drawer.
  let trapped = true;
  for (let i = 0; i < 8; i++) {
    await press('Tab');
    trapped &&= await focusInDrawer();
  }
  for (let i = 0; i < 8; i++) {
    await press('Tab', { shift: true });
    trapped &&= await focusInDrawer();
  }
  check(trapped, 'Tab and Shift+Tab stay inside the drawer (FR-006c)');
  await closeWithEscape();

  await openMarker();
  const callsBefore = await cdp.evaluate(() => window.__osrs.submitCalls ?? 0);
  await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click());
  await new Promise((r) => setTimeout(r, 150));
  d = await drawer();
  check(d?.submit?.label === 'Submitting…' && d?.submit?.enabled === false, 'Submit reads Submitting… and is disabled while in flight (FR-010a)', JSON.stringify(d?.submit));
  // A second submit by any route — the button, or the form itself.
  await cdp.evaluate(() => {
    [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click();
    document.querySelector('dialog[open] form').requestSubmit();
  });
  await press('Escape');
  // A real press and release on the scrim, left of the 400px drawer: the
  // panel closes only when both land there.
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: 100, y: 500, button: 'left', clickCount: 1 });
  }
  await cdp.evaluate(() => document.querySelector('dialog[open] button[aria-label="Close"]').click());
  await new Promise((r) => setTimeout(r, 300));
  check((await drawer())?.submit?.label === 'Submitting…', 'Esc, the scrim and ✕ do not close the drawer mid-submit (FR-010)');
  await cdp.waitFor(() => /^REQ-/.test(document.querySelector('dialog[open] h2')?.textContent ?? ''), 8000, 'the confirmation');
  check(true, 'the confirmation still arrives');
  const calls = (await cdp.evaluate(() => window.__osrs.submitCalls ?? 0)) - callsBefore;
  check(calls === 1, 'exactly one submit reached the system (FR-010)', `${calls} submits`);
  const heldId = (await drawer())?.heading;
  await closeWithEscape();

  console.log('Leaving the Catalog mid-submit');
  // Browser Back while the system is answering. The drawer closes with the
  // Catalog (FR-006a), but the confirmation must not be lost (FR-012, D7).
  // My Requests → Catalog gives Back an in-app entry to return to; the delay
  // is read from the address at submit time, so it is added in place, without
  // a navigation the router would see.
  await clickNav('My Requests', '/requests');
  await clickNav('Catalog', '/catalog');
  await gridReady();
  const mouseShownBefore = await cardCeiling(MOUSE.name);
  await addFromCard(MOUSE.name);
  await cdp.evaluate(() => history.replaceState(history.state, '', '/catalog?slow-submit=1500'));
  await openMarker();
  await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click());
  await new Promise((r) => setTimeout(r, 150));
  check((await drawer())?.submit?.label === 'Submitting…', 'the submit is in flight');
  await cdp.evaluate(() => history.back());
  await cdp.waitFor(() => location.pathname === '/requests', 8000, 'back to My Requests');
  check((await drawer()) === null, 'Back mid-submit leaves the Catalog and closes the drawer');
  // Back to a new Catalog before the submit answers: it reads the stock as it
  // was before the reserve, so it is this Catalog that must re-read (FR-011).
  await clickNav('Catalog', '/catalog');
  await gridReady();
  check((await badge()) === '1', 'the Catalog is back before the submit has answered', await badge());
  check((await drawer()) === null, 'returning to the Catalog does not open the drawer by itself (FR-006a)');
  await cdp.waitFor(() => document.querySelector('[data-request-list-marker]')?.innerText.match(/(\d+)/)?.[1] === '0', 8000, 'the submit to land');
  check(true, 'the submit still lands and clears the list (FR-011)');
  await settle();
  const mouseShownAfter = await cardCeiling(MOUSE.name);
  check(
    mouseShownAfter === mouseShownBefore - 1,
    'the Catalog mounted when the submit landed re-reads Available (FR-011)',
    `${mouseShownBefore} → ${mouseShownAfter}`,
  );
  await openMarker();
  d = await drawer();
  check(
    /^REQ-2026-\d+$/.test(d?.heading ?? '') && d?.heading !== heldId && d?.text.includes('Request submitted'),
    'the marker shows the held confirmation, with the new request id (FR-012, D7)',
    `${heldId} → ${d?.heading}`,
  );
  check(/Logitech M185\s*1/.test(d?.text ?? ''), 'reading back the request that was sent');
  await closeWithEscape();
  await openMarker();
  d = await drawer();
  check(d?.empty && d?.heading === 'Request List', 'closing it dismisses it; the next open is the empty list (Story 3 AC6)');
  await closeWithEscape();

  // The same, for a refusal (Story 4 AC5, D7). The fixture hook is read when
  // the held submit answers, after Back has already dropped the address —
  // which is why this uses it rather than `?fail-submit`.
  await clickNav('My Requests', '/requests');
  await clickNav('Catalog', '/catalog');
  await gridReady();
  await addFromCard(HUB.name);
  const hubBeforeRefusal = await available(HUB.id);
  await cdp.evaluate(() => {
    window.__osrs.submitFixture = 'refused';
    history.replaceState(history.state, '', '/catalog?slow-submit=1500');
  });
  await openMarker();
  await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click());
  await new Promise((r) => setTimeout(r, 150));
  check((await drawer())?.submit?.label === 'Submitting…', 'a second submit is in flight');
  await cdp.evaluate(() => history.back());
  await cdp.waitFor(() => location.pathname === '/requests', 8000, 'back to My Requests');
  check((await drawer()) === null, 'Back mid-submit closes the drawer');
  await cdp.waitFor(() => window.__osrs.submitFixture === undefined, 8000, 'the submit to be answered');
  await settle();
  check((await badge()) === '1', 'the refused submit keeps the list (FR-015)', await badge());
  await clickNav('Catalog', '/catalog');
  await gridReady();
  check((await drawer()) === null, 'returning to the Catalog does not open the drawer by itself (FR-006a)');
  await openMarker();
  d = await drawer();
  check(
    same(d?.alert, ['The request was refused.']) && d?.heading === 'Request List',
    'the marker opens onto the refusal that landed while the drawer was closed (Story 4 AC5, D7)',
    JSON.stringify(d?.alert),
  );
  check(same(d?.rows.map((r) => [r.name, r.qty]), [[HUB.name, 1]]), 'with the lines intact (FR-015)', JSON.stringify(d?.rows));
  check(
    await cdp.evaluate(() => document.activeElement?.getAttribute('role') === 'alert'),
    'focus moves to the held refusal on open',
  );
  check((await available(HUB.id)) === hubBeforeRefusal, 'nothing was reserved');
  await closeWithEscape();
  await openMarker();
  check(same((await drawer())?.alert, ['The request was refused.']), 'closing the drawer keeps the refusal');
  await rowAction(HUB.name, 'Remove');
  await closeWithEscape();

  // An item added after Back, while the submit is still answering, was never
  // sent: the success takes only what it sent out of the list (FR-011, D18).
  await clickNav('My Requests', '/requests');
  await clickNav('Catalog', '/catalog');
  await gridReady();
  await addFromCard(KEYBOARD.name);
  const keyboardBeforeLate = await available(KEYBOARD.id);
  await cdp.evaluate(() => history.replaceState(history.state, '', '/catalog?slow-submit=3000'));
  await openMarker();
  await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click());
  await new Promise((r) => setTimeout(r, 150));
  check((await drawer())?.submit?.label === 'Submitting…', 'a third submit is in flight');
  await cdp.evaluate(() => history.back());
  await cdp.waitFor(() => location.pathname === '/requests', 8000, 'back to My Requests');
  await clickNav('Catalog', '/catalog');
  await gridReady();
  check((await available(KEYBOARD.id)) === keyboardBeforeLate, 'the submit has not answered yet');
  await addFromCard(HUB.name);
  await cdp.waitFor(
    new Function(`return window.__osrs.seededStock.available(${JSON.stringify(KEYBOARD.id)}, 'Davao') === ${keyboardBeforeLate - 1}`),
    8000,
    'the submit to land',
  );
  await settle();
  check((await badge()) === '1', 'the line added mid-submit survives its success (FR-011)', await badge());
  await openMarker();
  d = await drawer();
  check(d?.text.includes('Request submitted'), 'the confirmation is held for the marker');
  await closeWithEscape();
  await openMarker();
  d = await drawer();
  check(same(d?.rows.map((r) => [r.name, r.qty]), [[HUB.name, 1]]), 'only the unsent line is left', JSON.stringify(d?.rows));
  await rowAction(HUB.name, 'Remove');
  await closeWithEscape();

  console.log('Signing out mid-submit');
  // A submit held in flight when the signed-in user changes (D7, review cycle
  // 3): its ticket is dropped, so the late answer is a no-op — no
  // `Submitting…`, confirmation or refusal carries into the next session, and
  // the next session can submit at once. Sign Out is in the top bar, outside
  // the drawer, whose scrim is inert mid-submit — so it is pressed
  // programmatically, as a person could not while the drawer is open.
  await clickNav('My Requests', '/requests');
  await clickNav('Catalog', '/catalog');
  await gridReady();
  check((await available(KEYBOARD.id)) >= 2, 'the keyboard has stock for this step', String(await available(KEYBOARD.id)));
  await addFromCard(KEYBOARD.name);
  await cdp.evaluate(() => history.replaceState(history.state, '', '/catalog?slow-submit=1500'));
  await openMarker();
  const signOutCalls = await cdp.evaluate(() => window.__osrs.submitCalls ?? 0);
  await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Submit/.test(b.textContent)).click());
  await new Promise((r) => setTimeout(r, 150));
  check((await drawer())?.submit?.label === 'Submitting…', 'a submit is in flight before signing out');
  await cdp.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('Sign Out')).click());
  await signInInPlace(EMPLOYEE);
  await gridReady();
  check((await badge()) === '0', 'the new session’s count is 0, not the previous list’s (FR-004a)', await badge());
  // Past the held delay, so the previous session's submit has answered.
  await cdp.waitFor(
    new Function(`return (window.__osrs.submitCalls ?? 0) > ${signOutCalls}`),
    8000,
    'the held submit to reach the system',
  );
  await new Promise((r) => setTimeout(r, 1800));
  check((await badge()) === '0', 'the late answer does not change the new session’s count', await badge());
  check((await drawer()) === null, 'the late answer does not open the drawer');
  await openMarker();
  d = await drawer();
  check(d?.heading === 'Request List' && d?.empty, 'the marker opens the empty list — no confirmation from the previous session', d?.heading);
  check(same(d?.alert, []), 'and no refusal from it', JSON.stringify(d?.alert));
  check(d?.submit?.label !== 'Submitting…', 'and not stuck in Submitting…', JSON.stringify(d?.submit));
  await closeWithEscape();
  await addFromCard(KEYBOARD.name);
  await openMarker();
  d = await drawer();
  check(d?.submit?.enabled === true && d?.submit?.label !== 'Submitting…', 'with a line added, Submit is enabled in the new session (FR-010)', JSON.stringify(d?.submit));

  console.log('Focus after a refusal with no drawer-level message');
  // D15: the alert is focused when there is one; otherwise the first invalid
  // line, otherwise the note. Each fixture below has exactly one pointer.
  await cdp.evaluate(() => {
    window.__osrs.submitFixture = {
      type: 'validation-error',
      title: 'Validation Failed',
      status: 400,
      errors: [{ detail: 'quantity must not be greater than 99', pointer: '#/items/0/quantity' }],
    };
  });
  await pressSubmit();
  d = await drawer();
  check(same(d?.alert, []) && same(d?.rows[0]?.messages, ['quantity must not be greater than 99']), 'a line-only refusal places its message under row 0, with no alert', JSON.stringify(d));
  check(
    await cdp.evaluate(() => {
      const row = document.querySelector('dialog[open] ul[aria-label="Items in your request list"] > li');
      return !!row && row.contains(document.activeElement) && document.activeElement.tagName === 'BUTTON';
    }),
    'focus lands on a control in the invalid line (D15)',
  );
  await cdp.evaluate(() => {
    window.__osrs.submitFixture = {
      type: 'validation-error',
      title: 'Validation Failed',
      status: 400,
      errors: [{ detail: 'purpose is invalid', pointer: '#/purpose' }],
    };
  });
  await pressSubmit();
  d = await drawer();
  check(same(d?.alert, []) && d?.noteInvalid && d?.rows[0]?.messages.length === 0, 'a note-only refusal marks only the note', JSON.stringify(d));
  check(
    await cdp.evaluate(() => document.activeElement === document.querySelector('dialog[open] textarea')),
    'focus lands on the note (D15)',
  );
  // A validation body with nothing to place must not fail silently (SC-003):
  // the problem's own title reaches the top of the drawer.
  await cdp.evaluate(() => {
    window.__osrs.submitFixture = { type: 'validation-error', title: 'Validation Failed', status: 400, errors: [] };
  });
  await pressSubmit();
  d = await drawer();
  check(same(d?.alert, ['Validation Failed']) && d?.heading === 'Request List', 'a validation refusal with no errors shows its title at the top — never silent (SC-003)', JSON.stringify(d?.alert));
  await rowAction(KEYBOARD.name, 'Remove');
  await closeWithEscape();

  console.log('Sign-out and the Admin');
  // A line in the list first, so the reset below is the sign-out's doing and
  // not the submit's. The hub: the mice at Davao are spent by now.
  await addFromCard(HUB.name);
  check((await badge()) === '1', 'a line before signing out', await badge());
  await cdp.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('Sign Out')).click());
  await signInInPlace(EMPLOYEE);
  await gridReady();
  check((await badge()) === '0', 'signing out clears the list (FR-004a)', await badge());

  await signIn(ADMIN);
  await go('/catalog');
  await gridReady();
  check((await cdp.evaluate(() => !!document.querySelector('[data-request-list-marker]'))) === false, 'the Admin has no marker (FR-016)');
  check((await cdp.evaluate(() => !!document.querySelector('dialog[open]'))) === false, 'and no drawer');
} catch (error) {
  check(false, `the run stopped: ${error.message}`);
} finally {
  cdp.close();
}

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
