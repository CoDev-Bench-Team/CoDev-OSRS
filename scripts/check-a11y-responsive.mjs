/** FR-011/SC-006 (keyboard + focus), FR-012/SC-005 (responsive, touch targets),
 *  FR-016a (overflow geometry) and FR-004/SC-002 (no third-party requests).
 *  Needs `npm run dev` and headless Chrome on :9222. */
import { connect } from './cdp.mjs';

const cdp = await connect();
let failures = 0;
const fail = (m) => { failures++; console.log(`  ✗ ${m}`); };
const pass = (m) => console.log(`  ✓ ${m}`);

// ---- No third-party requests (FR-004, SC-002) ----
await cdp.send('Network.enable');
await cdp.setViewport(1440, 1024);
await cdp.goto('http://localhost:5173/');
const requests = cdp.events
  .filter((e) => e.method === 'Network.requestWillBeSent')
  .map((e) => e.params.request.url)
  .filter((u) => u.startsWith('http') && !u.includes('localhost'));
console.log('\nFonts and assets served from our own origin (FR-004, SC-002)');
requests.length ? fail(`third-party requests: ${[...new Set(requests)].join(', ')}`)
                : pass(`no third-party requests (${cdp.events.filter(e=>e.method==='Network.requestWillBeSent').length} same-origin)`);

// Fonts load lazily, so wait for the document's font set to settle before
// asking whether a face resolved.
const fonts = await cdp.evaluate(async () => {
  await document.fonts.ready;
  const want = ['Inter', 'Space Grotesk'];
  return want.map((f) => ({
    family: f,
    loaded: [...document.fonts].some((ff) => ff.family.replace(/"/g, '') === f && ff.status === 'loaded'),
  }));
});
for (const f of fonts) f.loaded ? pass(`${f.family} resolves`) : fail(`${f.family} did not load`);

// ---- Composite type roles (FR-001, FR-002) ----
// A `font:` shorthand with a dangling var() is invalid, so the whole
// declaration is dropped and the element silently inherits. The utility still
// compiles, so only a rendering check catches it. This is how every display
// heading came to render in Inter.
console.log('\nComposite type roles resolve (FR-001, FR-002)');
const ROLES = {
  'type-page-title': ['Space Grotesk', '32px', '500'],
  'type-section-title': ['Space Grotesk', '19px', '500'],
  'type-metric': ['Space Grotesk', '28px', '500'],
  'type-card-title': ['Inter', '17px', '700'],
  'type-subhead': ['Inter', '15px', '700'],
  'type-body': ['Inter', '14px', '400'],
  'type-ui': ['Inter', '13px', '400'],
  'type-ui-bold': ['Inter', '13px', '700'],
  'type-meta': ['Inter', '12px', '400'],
  'type-pill': ['Inter', '12px', '700'],
  'type-caption': ['Inter', '11px', '400'],
  'type-eyebrow': ['Inter', '11px', '700'],
  'type-display-hero': ['Space Grotesk', '128px', '700'],
};
const typeResults = await cdp.evaluate((roles) => {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(host);
  const out = {};
  for (const cls of Object.keys(roles)) {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = 'Probe';
    host.appendChild(el);
    const s = getComputedStyle(el);
    out[cls] = [s.fontFamily.split(',')[0].replace(/"/g, ''), s.fontSize, s.fontWeight];
  }
  host.remove();
  return out;
}, ROLES);
let typeBad = 0;
for (const [cls, want] of Object.entries(ROLES)) {
  const got = typeResults[cls];
  if (!got || got[0] !== want[0] || got[1] !== want[1] || got[2] !== want[2]) {
    typeBad++;
    fail(`${cls}: expected ${want.join(' / ')} — got ${got ? got.join(' / ') : 'nothing'}`);
  }
}
if (!typeBad) pass(`all ${Object.keys(ROLES).length} composite roles render at their declared family, size and weight`);

// ---- Keyboard + focus (FR-011, FR-023, SC-006) ----
console.log('\nKeyboard reachability and focus indicator (FR-011, SC-006)');
// :focus-visible is heuristic — a programmatic el.focus() does not trigger it.
// Only a real keyboard Tab does, so drive actual key events.
const total = await cdp.evaluate(() => {
  document.body.focus();
  return document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])').length;
});
const tab = async () => {
  for (const type of ['rawKeyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  }
  await new Promise((r) => setTimeout(r, 12));
};
const noIndicator = [];
const seen = new Set();
for (let i = 0; i < total + 2; i++) {
  await tab();
  const r = await cdp.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const visible = el.matches(':focus-visible');
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    // A wrapper that reacts to :focus-within is a real, visible indicator —
    // the search field rings its container rather than the bare input.
    let wrapped = false;
    for (let p = el.parentElement; p && !wrapped; p = p.parentElement) {
      if (p.matches(':focus-within') && getComputedStyle(p).boxShadow !== 'none') wrapped = true;
    }
    return { id: el.tagName + '.' + String(el.className).slice(0, 36), visible, outline: outline || wrapped };
  });
  if (!r || seen.has(r.id + i)) continue;
  seen.add(r.id + i);
  if (!r.outline || !r.visible) noIndicator.push(r.id);
}
console.log(`  ${total} focusable elements, ${seen.size} reached by Tab`);
noIndicator.length ? fail(`no focus indicator on ${noIndicator.length}: ${[...new Set(noIndicator)].slice(0, 4).join(' | ')}`)
                   : pass('every element reached by Tab shows a focus indicator');

// ---- Responsive (FR-012, FR-022, SC-005) ----
console.log('\nHorizontal overflow and touch targets, 360 to 1440 (FR-012, SC-005)');
for (const w of [360, 768, 1024, 1440]) {
  await cdp.setViewport(w, 900);
  await new Promise((r) => setTimeout(r, 350));
  const r = await cdp.evaluate((width) => {
    const doc = document.documentElement;
    const overflowing = [...document.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > width + 1)
      .map((el) => el.tagName + '.' + String(el.className).slice(0, 30))
      .slice(0, 4);
    // The target is what the pointer can hit, not only the element's box. A
    // `.hit-area` control (utilities.css) keeps the source's small box and
    // grows a centred, absolutely positioned ::before to 44px; that pseudo is
    // hit-testable and its events reach the button, so it counts.
    const target = (el) => {
      const r = el.getBoundingClientRect();
      const p = getComputedStyle(el, '::before');
      if (p.content === 'none' || p.position !== 'absolute') return { width: r.width, height: r.height };
      return {
        width: Math.max(r.width, parseFloat(p.width) || 0),
        height: Math.max(r.height, parseFloat(p.height) || 0),
      };
    };
    const small = [...document.querySelectorAll('a[href], button:not([disabled])')]
      .map((el) => ({ el, r: target(el) }))
      .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
      .map(({ el, r }) => `${el.tagName}.${String(el.className).slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`)
      .slice(0, 6);
    return { scrollW: doc.scrollWidth, overflowing, small };
  }, w);
  const scrolls = r.scrollW > w + 1;
  if (scrolls) fail(`${w}px: page scrolls horizontally (scrollWidth ${r.scrollW}) — ${r.overflowing.join(' | ')}`);
  else pass(`${w}px: no horizontal overflow`);
  if (w < 1440 && r.small.length) fail(`${w}px: targets under 44px — ${r.small.join(' | ')}`);
  else if (w < 1440) pass(`${w}px: all targets at least 44px`);
}

// ---- Overflow geometry (FR-016a) ----
console.log('\nOverlong text must not change designed geometry (FR-016a)');
await cdp.setViewport(1440, 1024);
await new Promise((r) => setTimeout(r, 350));
const geo = await cdp.evaluate(() => {
  const cards = [...document.querySelectorAll('#overflow [class*="max-w-[436px]"]')];
  return cards.map((c) => ({ w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) }));
});
// The source fixes the card's WIDTH (436px) and lets height follow content, so
// the requirement is that clamps BOUND the height, not that it never moves. The
// title may legitimately take a second line; it may not take five.
const TITLE_LINE = 24; // 17px card title, clamped to at most 2 lines
if (geo.length < 2) fail(`expected at least 2 supply cards in the overflow section, found ${geo.length}`);
else if (geo[0].w !== geo[1].w) fail(`card width changes with content: ${geo[0].w} vs ${geo[1].w} — designed width is not holding`);
else if (Math.abs(geo[0].h - geo[1].h) > TITLE_LINE) fail(`card height grew ${Math.abs(geo[0].h - geo[1].h)}px with overlong content — more than the one extra title line the clamps allow`);
else pass(`width identical (${geo[0].w}px) and height bounded by the clamps (${geo[0].h} vs ${geo[1].h})`);

// ---- Select: disabled ----
// Disabled only when asked for. Option count does not affect availability —
// a single-option select opens and shows what is there, like a native one.
console.log('\nSelect is disabled only when asked, never by option count (FR-010)');
await cdp.setViewport(1440, 1000);
await cdp.goto('http://localhost:5173/');
await cdp.evaluate(() => document.querySelector('#forms').scrollIntoView({ block: 'start' }));
await new Promise((r) => setTimeout(r, 300));
const selects = await cdp.evaluate(() =>
  [...document.querySelectorAll('#forms [role=combobox]')].map((t) => ({
    options: Number(t.dataset.optionCount),
    disabled: t.disabled,
    opacity: Number(getComputedStyle(t).opacity),
  })),
);
const single = selects.find((s) => s.options === 1);
const off = selects.filter((s) => s.disabled);
if (!single) fail('the gallery no longer shows a single-option select');
else if (single.disabled) fail('a single-option select is disabled — option count must not affect availability');
else pass('a single-option select stays interactive');
if (off.length !== 1) fail(`expected exactly one explicitly disabled select, found ${off.length}`);
else if (off[0].opacity > 0.5) fail(`the disabled select is not faded (opacity ${off[0].opacity})`);
else pass(`explicitly disabled: inert, faded to ${off[0].opacity}, out of the tab order`);

// a single-option select must actually open
await cdp.evaluate(() => {
  const t = [...document.querySelectorAll('#forms [role=combobox]')].find((e) => e.dataset.optionCount === '1');
  t?.click();
});
let opened = true;
try {
  await cdp.waitFor(() => !!document.querySelector('[role=listbox]'), 2500, 'the single-option select to open');
} catch {
  opened = false;
}
opened ? pass('and it opens') : fail('a single-option select did not open');
await cdp.evaluate(() => document.body.click());

// ---- Overlay layering ----
// A popover must sit above a dialog so a select inside one is usable, which
// means ordering alone cannot keep a popover left open elsewhere off a new
// scrim. Both halves are checked.
console.log('\nOverlay layering: popover above dialog, no stale popover over the scrim');
await cdp.setViewport(1440, 1000);
await cdp.goto('http://localhost:5173/');
await cdp.evaluate(() => document.querySelector('#data').scrollIntoView({ block: 'start' }));
await new Promise((r) => setTimeout(r, 350));

await cdp.evaluate(() => document.querySelector('#data [role=combobox]').click());
let openedOutside = true;
try {
  await cdp.waitFor(() => !!document.querySelector('[role=listbox]'), 3000, 'the dropdown to open');
} catch {
  openedOutside = false;
}
await cdp.evaluate(() =>
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Show the scrim')).click(),
);
await cdp.waitFor(
  () => !!document.querySelector('div') && [...document.querySelectorAll('div')].some((d) => getComputedStyle(d).backgroundColor === 'rgba(0, 0, 0, 0.5)'),
  3000,
  'the scrim to appear',
);
const stale = await cdp.evaluate(() => !!document.querySelector('[role=listbox]'));
if (!openedOutside) fail('could not open the dropdown to test dismissal');
else if (stale) fail('a dropdown left open outside the dialog is still showing over the scrim');
else pass('opening a dialog dismisses a popover left open elsewhere');

const inside = await cdp.evaluate(() => {
  const scrim = [...document.querySelectorAll('div')].find(
    (d) => getComputedStyle(d).backgroundColor === 'rgba(0, 0, 0, 0.5)',
  );
  if (!scrim) return { error: 'no scrim' };
  const trigger = scrim.querySelector('[role=combobox]');
  if (!trigger) return { error: 'no select inside the dialog' };
  trigger.click();
  return { ok: true };
});
await new Promise((r) => setTimeout(r, 350));
if (inside.error) fail(`could not test a select inside a dialog: ${inside.error}`);
else {
  try {
    await cdp.waitFor(() => !!document.querySelector('[role=listbox]'), 3000, 'the dialog select to open');
  } catch {
    /* reported below */
  }
  const r = await cdp.evaluate(() => {
    const list = document.querySelector('[role=listbox]');
    if (!list) return { open: false };
    const b = list.getBoundingClientRect();
    const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const scrim = [...document.querySelectorAll('div')].find(
      (d) => getComputedStyle(d).backgroundColor === 'rgba(0, 0, 0, 0.5)',
    );
    return {
      open: true,
      onTop: list.contains(top),
      listZ: Number(getComputedStyle(list).zIndex),
      scrimZ: Number(getComputedStyle(scrim).zIndex),
    };
  });
  if (!r.open) fail('the select inside the dialog did not open');
  else if (!r.onTop || !(r.listZ > r.scrimZ))
    fail(`select inside a dialog is not above the scrim (popover z ${r.listZ}, scrim z ${r.scrimZ}, on top: ${r.onTop})`);
  else pass(`a select inside a dialog renders above the scrim (z ${r.listZ} over ${r.scrimZ})`);
}

console.log(`\n${failures} failure(s)`);
cdp.close();
process.exit(failures ? 1 : 0);
