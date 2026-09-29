/** Spec 012 (BEN-136) — the Accountability Form, against SC-001 to SC-006a
 *  (SC-004b waits on K3). Runs through the same CDP client as the other gates.
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173.
 *
 *  Every scenario starts from a fresh document, so the seeded store is back to
 *  its eight requests. Since constitution 6.0.0 the form is offered only on an
 *  unsigned `Received` request: REQ-2026-1820. Signing leaves it `Received` and
 *  records the signature (spec 012 FR-009). */
import { readFileSync } from 'node:fs';
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const RECEIVED = 'REQ-2026-1820';
const LINK = 'Sign accountability form';
const SUBMIT = 'I acknowledge and sign';
const COPY = {
  agree: 'Tick the box to confirm you agree to the conditions.',
  readFirst: 'Scroll to the end of the acknowledgement and read it before agreeing.',
  name: 'Type your full name to sign.',
};

let failures = 0;
const fail = (m) => {
  failures++;
  console.log(`  ✗ ${m}`);
};
const pass = (m) => console.log(`  ✓ ${m}`);
const check = (ok, m, detail = '') => (ok ? pass(m) : fail(`${m}${detail ? ` — ${detail}` : ''}`));

const cdp = await connect();
await cdp.setViewport(1440, 1024);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

const signIn = async (id) => {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate((who) => {
    document.querySelector(`input[value="${who}"]`).click();
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  }, id);
  await cdp.waitFor(() => location.pathname !== '/login', 8000, `${id} to land`);
};

/** A fresh My Requests, optionally with a dev stub mode. */
const freshRequests = async (mode) => {
  await go(mode ? `/requests?requests=${mode}` : '/requests');
  await cdp.waitFor(() => document.querySelectorAll('button[aria-label^="View details"]').length > 0, 8000, 'the request rows');
};

const rows = () =>
  [...document.querySelectorAll('main li')]
    .filter((li) => li.querySelector('button[aria-label^="View details"]'))
    .map((li) => ({ id: li.querySelector('span').textContent.trim(), pill: li.querySelectorAll('span')[3]?.textContent.trim() }));

const panel = () => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return null;
  const h2 = d.querySelector('h2');
  return {
    heading: h2?.textContent.trim(),
    pill: h2?.nextElementSibling?.textContent.trim() ?? null,
    width: Math.round(d.getBoundingClientRect().width),
    buttons: [...d.querySelectorAll('button')].map((b) => b.textContent.trim()),
    text: d.textContent,
    timeline: [...d.querySelectorAll('ol li[data-state]')].map((li) => [
      li.dataset.state,
      li.querySelector('span span')?.textContent.trim(),
      li.querySelectorAll('span span')[1]?.textContent.trim(),
    ]),
    alert: d.querySelector('[role="alert"]')?.textContent.trim() ?? null,
    active: document.activeElement?.textContent?.trim().slice(0, 60) ?? '',
    activeTag: document.activeElement?.tagName,
  };
};

const openRow = async (id) => {
  await cdp.evaluate((rid) => {
    const b = document.querySelector(`button[aria-label="View details of ${rid}"]`);
    b.focus();
    b.click();
  }, id);
  await cdp.waitFor(() => !!document.querySelector('[role="dialog"]'), 5000, `the panel for ${id}`);
};
const clickInPanel = (label) =>
  cdp.evaluate((l) => {
    const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => x.textContent.trim() === l);
    if (!b) throw new Error(`no "${l}" button in the panel`);
    b.click();
  }, label);
const openForm = async (id) => {
  await openRow(id);
  await clickInPanel(LINK);
  await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="region"][aria-label="Acknowledgement"]'), 5000, 'the form');
};

const form = () => {
  const d = document.querySelector('[role="dialog"]');
  const box = d.querySelector('[role="region"][aria-label="Acknowledgement"]');
  const cb = d.querySelector('input[type="checkbox"]');
  const name = d.querySelector('input[type="text"]');
  const msg = (el) => (el?.getAttribute('aria-describedby') ? document.getElementById(el.getAttribute('aria-describedby'))?.textContent.trim() : null);
  return {
    boxText: box?.innerText,
    boxScrolls: box ? box.scrollHeight > box.clientHeight : null,
    checked: cb?.checked,
    cbDisabledAria: cb?.getAttribute('aria-disabled') === 'true',
    cbNativeDisabled: cb?.disabled,
    cbMessage: msg(cb),
    cbInvalid: cb?.getAttribute('aria-invalid') === 'true',
    nameMessage: msg(name),
    nameValue: name?.value,
    submitDisabled: [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === 'I acknowledge and sign')?.disabled,
  };
};
const scrollBox = (where) =>
  cdp.evaluate((w) => {
    const box = document.querySelector('[role="dialog"] [role="region"][aria-label="Acknowledgement"]');
    box.scrollTop = w === 'end' ? box.scrollHeight : 0;
  }, where);
const clickCheckbox = () => cdp.evaluate(() => document.querySelector('[role="dialog"] input[type="checkbox"]').click());
const spaceOnCheckbox = async () => {
  await cdp.evaluate(() => document.querySelector('[role="dialog"] input[type="checkbox"]').focus());
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: type === 'keyDown' ? ' ' : undefined });
  }
};
const typeName = async (text) => {
  await cdp.evaluate(() => document.querySelector('[role="dialog"] input[type="text"]').focus());
  await cdp.send('Input.insertText', { text });
};
const submit = () => clickInPanel(SUBMIT);
const readyToSign = async () => {
  await scrollBox('end');
  await cdp.waitFor(() => document.querySelector('[role="dialog"] input[type="checkbox"]')?.getAttribute('aria-disabled') !== 'true', 3000, 'the gate to open');
  await clickCheckbox();
  await typeName('Maya Santos');
};

// ------------------------------------------------------------------ SC-001
await signIn('maya.santos');
await freshRequests();
const initial = await cdp.evaluate(rows);
console.log('\nSC-001 — Sign accountability form is offered only on the owner’s unsigned Received request');
for (const row of initial) {
  await openRow(row.id);
  const p = await cdp.evaluate(panel);
  const offered = p.buttons.includes(LINK);
  const expected = row.pill === 'Received';
  check(offered === expected, `${row.id} (${row.pill}): the link is ${expected ? 'offered' : 'absent'}`);
  check(!/complete request/i.test(p.buttons.join('|')), `${row.id}: no Complete Request control (FR-001a)`);
  const handedOver = row.pill === 'For Delivery' || row.pill === 'Ready for Pickup';
  check(p.buttons.includes('Mark as Received') === handedOver, `${row.id}: Mark as Received is ${handedOver ? 'offered' : 'absent'} (FR-016)`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.waitFor(() => !document.querySelector('[role="dialog"]'), 5000, 'the panel to close');
}

check(initial.some((r) => r.id === RECEIVED && r.pill === 'Received'), 'the seed carries an unsigned Received row (REQ-2026-1820)');

// ---------------------------------------------------- form layout + SC-006
console.log('\nStory 1 AC2 / SC-006 — the form, and its conditions word for word');
await freshRequests();
await openForm(RECEIVED);
let p = await cdp.evaluate(panel);
let f = await cdp.evaluate(form);
check(p.heading === 'Accountability Form' && p.pill === null, 'the header reads Accountability Form, with no pill');
check(p.width === 564, 'the sheet is 564px wide', `${p.width}px`);
check(/Equipment Assigned/i.test(p.text) && /Acknowledgement/i.test(p.text), 'EQUIPMENT ASSIGNED and ACKNOWLEDGEMENT headings');
check(/Wireless Mouse - Logitech M185/.test(p.text) && /Headset - Jabra Evolve2 40/.test(p.text), 'the request’s lines are listed');
check(!/CODEV-/.test(p.text), 'no per-unit tags');
check(!/Other Notes/i.test(p.text), 'no Other Notes');
check(f.checked === false && f.nameValue === '', 'the checkbox starts unticked and the name empty');
check(p.buttons.includes('Cancel') && p.buttons.includes(SUBMIT), 'Cancel and I acknowledge and sign');
check(f.boxScrolls, 'the acknowledgement box scrolls');

const norm = (t) =>
  t
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_`]/g, '')
    .split(/\s+/)
    .filter(Boolean);
const spec = readFileSync(new URL('../specs/012-accountability-form/spec.md', import.meta.url), 'utf8');
const fr4 = spec.slice(spec.indexOf('- **FR-004**:'), spec.indexOf('- **FR-005**:'));
const expected = norm(fr4.split('\n').filter((l) => l.trim().startsWith('>')).join('\n'));
const rendered = norm(f.boxText ?? '');
const at = expected.findIndex((w, i) => w !== rendered[i]);
check(
  at === -1 && rendered.length === expected.length,
  `the box matches FR-004 word for word (${expected.length} words)`,
  at === -1
    ? `length ${rendered.length} vs ${expected.length}`
    : `first difference at word ${at}: spec “${expected.slice(at, at + 6).join(' ')}” / page “${rendered.slice(at, at + 6).join(' ')}”`,
);
check((await cdp.evaluate(() => document.querySelectorAll('[role="dialog"] [role="region"] ol li').length)) === 11, 'eleven numbered conditions');

// -------------------------------------------------------------- SC-006a
console.log('\nStory 2a / SC-006a — the agreement unlocks only at the end of the acknowledgement');
check(f.cbDisabledAria && !f.cbNativeDisabled, 'the checkbox is announced as disabled but stays focusable (aria-disabled, not disabled)');
// A real pointer click, not a scripted one: the global `[aria-disabled]` rule
// sets `pointer-events: none` on the input, so the click lands on its label.
// The sheet slides in; measure only once it has stopped moving.
await cdp.waitFor(() => document.getAnimations().every((a) => a.playState !== 'running'), 3000, 'the sheet to settle');
const boxCentre = await cdp.evaluate(() => {
  const box = document.querySelector('[role="dialog"] input[type="checkbox"]').parentElement;
  box.scrollIntoView({ block: 'center' });
  const r = box.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
for (const type of ['mousePressed', 'mouseReleased']) {
  await cdp.send('Input.dispatchMouseEvent', { type, x: boxCentre.x, y: boxCentre.y, button: 'left', clickCount: 1 });
}
f = await cdp.evaluate(form);
check(f.checked === false && f.cbMessage === COPY.readFirst, 'a real mouse click on the box leaves it unticked, with the message', `${f.checked} / ${f.cbMessage}`);
await clickCheckbox();
f = await cdp.evaluate(form);
check(f.checked === false, 'a scripted click leaves it unticked too');
check(f.cbMessage === COPY.readFirst, 'and says to read to the end first', f.cbMessage);
await cdp.evaluate(() => document.activeElement.blur());
await spaceOnCheckbox();
f = await cdp.evaluate(form);
check(f.checked === false && f.cbMessage === COPY.readFirst, 'Space leaves it unticked too, with the same message');
await scrollBox('end');
await cdp.waitFor(() => document.querySelector('[role="dialog"] input[type="checkbox"]')?.getAttribute('aria-disabled') !== 'true', 3000, 'the gate to open');
f = await cdp.evaluate(form);
check(!f.cbDisabledAria && f.cbMessage === null, 'scrolling to the end opens it and clears the message');
await scrollBox('top');
await sleep(150);
f = await cdp.evaluate(form);
check(!f.cbDisabledAria, 'scrolling back up keeps it open');
await clickCheckbox();
f = await cdp.evaluate(form);
check(f.checked === true, 'and it ticks');

// Reopening starts the gate over.
await clickInPanel('Cancel');
await cdp.waitFor(() => !document.querySelector('[role="dialog"] [role="region"]'), 3000, 'the read view');
p = await cdp.evaluate(panel);
check(p.active === LINK, 'Cancel returns focus to Sign accountability form (D9a)', p.active);
await clickInPanel(LINK);
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="region"]'), 3000, 'the form again');
f = await cdp.evaluate(form);
check(f.cbDisabledAria && f.checked === false, 'reopening the form locks it again');
p = await cdp.evaluate(panel);
check(p.activeTag === 'H2' && p.active === 'Accountability Form', 'opening the form focuses its heading (D9a)', p.active);

// Text that comes to fit opens it at once. The box is sized in px, so the
// check grows the box rather than shrinking the text — the resize path either way.
await cdp.evaluate(() => {
  const box = document.querySelector('[role="dialog"] [role="region"]');
  box.style.height = `${box.scrollHeight + 40}px`;
});
await cdp.waitFor(() => document.querySelector('[role="dialog"] input[type="checkbox"]')?.getAttribute('aria-disabled') !== 'true', 3000, 'a box that fits to open the gate');
pass('a box whose text fits opens the gate without scrolling');

// ---------------------------------------------------------------- SC-002
console.log('\nStory 2 / SC-002 — nothing is sent without the agreement and a name');
await freshRequests();
await openForm(RECEIVED);
await submit();
f = await cdp.evaluate(form);
check(f.cbMessage === COPY.readFirst && f.nameMessage === COPY.name, 'before reading: the read-first message, and the name message, at once');
await scrollBox('end');
await cdp.waitFor(() => document.querySelector('[role="dialog"] input[type="checkbox"]')?.getAttribute('aria-disabled') !== 'true', 3000, 'the gate to open');
await submit();
f = await cdp.evaluate(form);
check(f.cbMessage === COPY.agree && f.cbInvalid, 'after reading, unticked: the agreement message');
check((await cdp.evaluate(() => document.activeElement?.type)) === 'checkbox', 'focus goes to the first invalid control');
await typeName('   ');
await submit();
f = await cdp.evaluate(form);
check(f.nameMessage === COPY.name, 'a whitespace name counts as blank');
await clickCheckbox();
f = await cdp.evaluate(form);
check(f.cbMessage === null, 'ticking clears the agreement message');
await submit();
p = await cdp.evaluate(panel);
check(p.heading === 'Accountability Form', 'ticked with a blank name: still the form — nothing sent');
await cdp.evaluate(() => {
  const i = document.querySelector('[role="dialog"] input[type="text"]');
  i.select();
});
await typeName('Maya Santos');
f = await cdp.evaluate(form);
check(f.nameMessage === null, 'typing a name clears its message');
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await cdp.waitFor(() => !document.querySelector('[role="dialog"]'), 5000, 'the panel to close');
await openRow(RECEIVED);
p = await cdp.evaluate(panel);
check(p.buttons.includes(LINK) && !/Accountability form signed/.test(p.text), 'closing the panel sent nothing: still unsigned, the link still offered');

// ---------------------------------------------------------------- SC-003
console.log('\nStory 1 / SC-003 — a valid signature is recorded; the request stays Received');
{
  const id = RECEIVED;
  await freshRequests();
  await openForm(id);
  await readyToSign();
  await submit();
  await cdp.waitFor(() => document.querySelector('[role="dialog"] h2')?.textContent.trim() !== 'Accountability Form', 5000, 'the read view');
  p = await cdp.evaluate(panel);
  check(p.pill === 'Received', `${id}: the panel pill still reads Received`, p.pill);
  const node = p.timeline.find((n) => n[1] === 'Received');
  check(node && node[0] !== 'pending' && node[2] && node[2] !== 'Pending', `${id}: the timeline’s Received node is reached, with a time`, JSON.stringify(node));
  check(!p.buttons.includes(LINK) && !p.buttons.includes('Cancel Request'), `${id}: no sign link and no Cancel Request`);
  check(/Accountability form signed · \w{3} \d{1,2}, \d{4}/.test(p.text), `${id}: it says the form was signed, with a time (FR-009)`);
  check(p.activeTag === 'H2' && p.active === id, `${id}: focus returns to the panel heading (D9a)`, p.active);
  check((await cdp.evaluate(rows)).find((r) => r.id === id)?.pill === 'Received', `${id}: the row pill still reads Received`);
}

// ---------------------------------------------------------------- SC-004a
console.log('\nStory 3 / SC-004a — the system’s refusals');
await freshRequests('sign-changes');
await openForm(RECEIVED);
await readyToSign();
await submit();
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="alert"]'), 5000, 'the refusal');
p = await cdp.evaluate(panel);
check(
  p.heading === RECEIVED && p.pill === 'Received' && /Accountability form signed/.test(p.text) && !p.buttons.includes(LINK),
  'signed elsewhere meanwhile: back to the read view, showing it signed',
  `${p.heading} / ${p.pill}`,
);
check(/already signed/.test(p.alert ?? ''), 'with the system’s own message', p.alert);
check((await cdp.evaluate(() => document.activeElement?.getAttribute('role'))) === 'alert', 'focus goes to the refusal (D9a)');

await freshRequests('sign-invalid');
await openForm(RECEIVED);
await readyToSign();
await submit();
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="alert"]'), 5000, 'the refusal');
p = await cdp.evaluate(panel);
f = await cdp.evaluate(form);
check(p.heading === 'Accountability Form', 'invalid: the form stays open');
check(
  /could not be recorded/.test(p.alert ?? '') && /shared device/.test(p.alert ?? ''),
  'a whole-document message and an unknown pointer both show at the top',
  p.alert,
);
check(f.nameValue === 'Maya Santos' && f.checked, 'what was typed is kept');

await freshRequests('sign-fails');
await openForm(RECEIVED);
await readyToSign();
await submit();
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="alert"]'), 5000, 'the refusal');
p = await cdp.evaluate(panel);
f = await cdp.evaluate(form);
check(p.heading === 'Accountability Form' && /not sent/.test(p.alert ?? ''), 'no answer: the form stays and says it was not sent', p.alert);
check(f.nameValue === 'Maya Santos' && f.checked && f.submitDisabled === false, 'values kept, and it can be retried');

// ---------------------------------------------------------------- SC-005
console.log('\nStory 1 AC5 / SC-005 — one open form sends at most one signature');
await freshRequests('sign-slow');
await openForm(RECEIVED);
await readyToSign();
await submit();
f = await cdp.evaluate(form);
check(f.submitDisabled === true, 'the button is disabled while it sends');
// Bypass the disabled button: a second submit of the form itself.
await cdp.evaluate(() => document.querySelector('[role="dialog"] form').requestSubmit());
check(
  await cdp.evaluate(() => {
    const x = document.querySelector('[role="dialog"] button[aria-label="Close"]');
    return x.disabled;
  }),
  'the panel cannot be dismissed mid-send',
);
await cdp.waitFor(() => document.querySelector('[role="dialog"] h2')?.textContent.trim() !== 'Accountability Form', 8000, 'the read view');
await sleep(2500); // long enough for a second, slow signature to have landed
p = await cdp.evaluate(panel);
check(p.pill === 'Received' && p.alert === null, 'one signature: Received, and no refusal from a second one', `${p.pill} / ${p.alert}`);

// ---------------------------------------------------------------- SC-008
console.log('\nStory 0 / SC-008 — the Employee marks a handed-over request received, then signs');
const HANDED_OVER = 'REQ-2026-1842';
const CONFIRM_COPY = "Confirm you have received every item listed above. This can't be undone.";
await freshRequests();
await openRow(HANDED_OVER);
await clickInPanel('Mark as Received');
p = await cdp.evaluate(panel);
check(p.text.includes(CONFIRM_COPY) && p.buttons.includes('Cancel') && p.buttons.includes('Confirm Received'), 'Mark as Received asks for confirmation first');
check(p.pill === 'Ready for Pickup', 'nothing has been sent yet');
await clickInPanel('Cancel');
await sleep(150);
p = await cdp.evaluate(panel);
check(p.pill === 'Ready for Pickup' && p.buttons.includes('Mark as Received'), 'Cancel backs out with nothing sent');
check(p.active === 'Mark as Received', 'and focus returns to Mark as Received', p.active);

await clickInPanel('Mark as Received');
// Two presses in the same task, before a re-render can disable the button.
await cdp.evaluate(() => {
  const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => x.textContent.trim() === 'Confirm Received');
  b.click();
  b.click();
});
await cdp.waitFor(() => document.querySelector('[role="dialog"] h2')?.nextElementSibling?.textContent.trim() === 'Received', 5000, 'Received');
await sleep(300);
p = await cdp.evaluate(panel);
check(p.pill === 'Received' && p.alert === null, 'confirming marks it Received, once (a second send would have been refused)', `${p.pill} / ${p.alert}`);
const recNode = p.timeline.find((n) => n[1] === 'Received');
check(recNode && recNode[0] !== 'pending' && recNode[2] !== 'Pending', 'the timeline’s Received node is reached, with a time', JSON.stringify(recNode));
check(!p.buttons.includes('Mark as Received') && p.buttons.includes(LINK), 'Mark as Received is gone and Sign accountability form is offered');
check(p.active === LINK, 'focus moves to Sign accountability form', p.active);
check((await cdp.evaluate(rows)).find((r) => r.id === HANDED_OVER)?.pill === 'Received', 'the row pill reads Received');
await clickInPanel(LINK);
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="region"]'), 5000, 'the form');
await readyToSign();
await submit();
await cdp.waitFor(() => document.querySelector('[role="dialog"] h2')?.textContent.trim() !== 'Accountability Form', 5000, 'the read view');
p = await cdp.evaluate(panel);
check(p.pill === 'Received' && /Accountability form signed/.test(p.text), 'end to end: marked received by the Employee, then signed');

await freshRequests('receive-changes');
await openRow(HANDED_OVER);
await clickInPanel('Mark as Received');
await clickInPanel('Confirm Received');
await cdp.waitFor(() => !!document.querySelector('[role="dialog"] [role="alert"]'), 5000, 'the refusal');
p = await cdp.evaluate(panel);
check(p.pill === 'Cancelled' && /can no longer be marked received/.test(p.alert ?? ''), 'changed meanwhile: the system’s message, and the current status', `${p.pill} / ${p.alert}`);
check((await cdp.evaluate(() => document.activeElement?.getAttribute('role'))) === 'alert', 'focus goes to the refusal');

// ---------------------------------------------------------------- FR-013
console.log('\nStory 4 / FR-013 — an Admin is never offered the form');
await signIn('ethan.cruz');
await go('/queue');
await sleep(500);
check(!(await cdp.evaluate(() => /accountability|acknowledge and sign/i.test(document.body.textContent))), 'the Requests Queue has no form or sign control');

cdp.close();
console.log(failures ? `\n${failures} accountability-form check(s) failed` : '\nall accountability-form checks pass');
process.exit(failures ? 1 : 0);
