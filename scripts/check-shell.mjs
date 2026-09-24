/** Spec 003 Phase 8 — the application shell's own verification (T044–T051).
 *
 *  SC-004 asks for a Playwright test that reaches any destination by address.
 *  Playwright arrives with spec 001's T020, so until then these assertions run
 *  through the same CDP client the design-system gates use — no new QA
 *  dependency (constitution VIII), and the assertions are already written when
 *  T020 lands (see specs/003-app-shell-routing/plan.md, "Routing e2e
 *  assertions").
 *
 *  Needs `npm run dev` and headless Chrome; both are started for you by
 *  cdp.mjs. Set OSRS_DEV_ORIGIN when the dev server took a port other than
 *  5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';

let failures = 0;
const fail = (m) => {
  failures++;
  console.log(`  ✗ ${m}`);
};
const pass = (m) => console.log(`  ✓ ${m}`);
const check = (ok, m, detail = '') => (ok ? pass(m) : fail(`${m}${detail ? ` — ${detail}` : ''}`));

// Navigation sets as the 2026-09-22 design draws them (constitution 3.0.0 II,
// ADR-0005): two roles, and Profile lives in the account cluster, not the bar.
const ACCOUNTS = {
  employee: { account: 'maya.santos', name: 'Maya Santos', landing: '/catalog', nav: ['Catalog', 'My Requests'] },
  admin: { account: 'ethan.cruz', name: 'Ethan Cruz', landing: '/queue', nav: ['Requests Queue', 'Assets', 'Inventory', 'History'] },
};

const PERMITTED = {
  employee: ['/catalog', '/requests', '/requests/REQ-2026-1847', '/profile'],
  admin: ['/queue', '/assets', '/inventory', '/history', '/catalog', '/requests/REQ-2026-1847', '/profile'],
};

const FORBIDDEN = {
  employee: ['/queue', '/assets', '/inventory', '/history'],
  admin: ['/requests'],
};

const cdp = await connect();
await cdp.setViewport(1440, 1024);

/** The page's own view of itself: which address, which screen, what the top bar
 *  is offering. Every assertion below reads this rather than scraping ad hoc. */
const shellState = () => ({
  path: location.pathname,
  // The collapsed panel is in the DOM at every width, so count what is VISIBLE
  // or every navigation item would appear twice.
  nav: [...document.querySelectorAll('header nav a')]
    .filter((a) => a.getBoundingClientRect().width > 0)
    .map((a) => a.textContent.trim()),
  current: [...document.querySelectorAll('header nav a[aria-current="page"]')]
    .filter((a) => a.getBoundingClientRect().width > 0)
    .map((a) => a.textContent.trim()),
  eyebrow: document.querySelector('main span[class*="type-eyebrow"]')?.textContent.trim() ?? null,
  title: document.querySelector('main h1')?.textContent.trim() ?? null,
  body: document.querySelector('main h1')?.parentElement?.textContent.trim() ?? null,
  hasBar: !!document.querySelector('header'),
  account: document.querySelector('header')?.textContent.includes('Sign Out') ?? false,
  identity: [...document.querySelectorAll('header span')].map((s) => s.textContent.trim()),
  requestList: document.querySelector('header')?.textContent.includes('Request List') ?? false,
});

/** `cdp.goto` can return while the OLD document is still up: it waits for
 *  readyState and a mounted root, both of which the page being navigated away
 *  from already satisfies. Marking the current document and waiting for one
 *  without the mark removes that race. */
const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

/** `cdp.waitFor` takes a bare predicate, so bind the expected path into one. */
const waitForPath = (path, label) =>
  cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(path)}`), 8000, label ?? path);

const signOutEverywhere = async () => {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
};

/** Sign in through the drawn control, the way a tester does: pick the seeded
 *  account, press the Google button, wait for the landing screen. */
async function signIn(role) {
  const { account, landing } = ACCOUNTS[role];
  await signOutEverywhere();
  await go(`/login`);
  await cdp.evaluate((id) => {
    const radio = document.querySelector(`input[value="${id}"]`);
    radio.click();
  }, account);
  await cdp.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  });
  await waitForPath(landing, `the ${role} landing`);
  return landing;
}

// ---- T044: landing destination and the exact navigation set ----
console.log('\nSign-in lands on the role’s own screen with only its navigation (FR-006, FR-007, SC-001)');
for (const [role, expected] of Object.entries(ACCOUNTS)) {
  await signIn(role);
  const s = await cdp.evaluate(shellState);
  check(s.path === expected.landing, `${role}: lands on ${expected.landing}`, `got ${s.path}`);
  check(
    JSON.stringify(s.nav) === JSON.stringify(expected.nav),
    `${role}: navigation is exactly ${expected.nav.join(', ')}`,
    `got ${s.nav.join(', ')}`,
  );
  check(s.current.length === 1, `${role}: exactly one item marked current`, `got ${s.current.length}`);
  check(
    s.identity.some((t) => t === expected.name),
    `${role}: the account cluster names ${expected.name}`,
  );
  check(
    s.requestList === (role === 'employee'),
    `${role}: request-list marker ${role === 'employee' ? 'present' : 'absent'} (FR-015)`,
  );
  check(!s.nav.includes('Profile'), `${role}: Profile is not a navigation item`);
  await cdp.evaluate(() => {
    [...document.querySelectorAll('header button')]
      .find((b) => b.textContent.includes('Santos') || b.textContent.includes('Cruz'))
      .click();
  });
  await waitForPath('/profile', `${role} reaching profile from the account cluster`);
  pass(`${role}: the account cluster is the way to Profile`);
}

// ---- T021: `/` is not a destination, it resolves to one ----
console.log('\n`/` resolves to the role’s landing destination, and `/login` is not a place to stand (FR-007)');
for (const [role, expected] of Object.entries(ACCOUNTS)) {
  await signIn(role);
  await go(`/`);
  const root = await cdp.evaluate(shellState);
  check(root.path === expected.landing, `${role}: / resolves to ${expected.landing}`, `got ${root.path}`);
  await go(`/login`);
  const login = await cdp.evaluate(shellState);
  check(login.path === expected.landing, `${role}: /login while signed in returns to ${expected.landing}`, `got ${login.path}`);
}
await signOutEverywhere();
await go(`/`);
await waitForPath('/login', 'a signed-out visitor at /');
pass('signed out, / sends the visitor to sign-in');

// ---- T045: every permitted address opens directly, reloads, and comes back ----
console.log('\nEvery permitted address is reachable directly, survives reload, and supports back (FR-008, SC-002)');
for (const [role, paths] of Object.entries(PERMITTED)) {
  await signIn(role);
  let ok = true;
  for (const path of paths) {
    await go(`${path}`);
    const direct = await cdp.evaluate(shellState);
    if (direct.path !== path || !direct.hasBar) {
      ok = false;
      fail(`${role}: ${path} did not render directly (path ${direct.path}, bar ${direct.hasBar})`);
      continue;
    }
    await cdp.evaluate(() => {
      window.__beforeReload = true;
    });
    await cdp.send('Page.reload');
    await cdp.waitFor(
      // Without the marker this races: the OLD document is still complete and
      // still has a header when the first poll runs.
      () => !window.__beforeReload && (!!document.querySelector('header') || location.pathname === '/login'),
      8000,
      `${path} to render after reload`,
    );
    const reloaded = await cdp.evaluate(shellState);
    if (reloaded.path !== path || !reloaded.account) {
      ok = false;
      fail(`${role}: ${path} lost the session on reload (path ${reloaded.path}, bar ${reloaded.hasBar}, account ${reloaded.account})`);
    }
  }
  if (ok) pass(`${role}: all ${paths.length} permitted addresses render directly and survive reload`);

  // Browser back returns to the previous destination rather than leaving the
  // application. Navigate the way a user does — click a navigation item — so
  // the history entry is the router's own.
  const landing = ACCOUNTS[role].landing;
  await go(landing);
  await cdp.evaluate(() => {
    [...document.querySelectorAll('header nav a')].filter((a) => a.getBoundingClientRect().width > 0).pop().click();
  });
  // Wait for the click to actually land somewhere else, or "back returns to the
  // landing screen" would pass without anything having moved.
  await cdp.waitFor(
    new Function(`return location.pathname !== ${JSON.stringify(landing)}`),
    5000,
    `${role} to reach a second destination`,
  );
  const secondary = await cdp.evaluate(() => location.pathname);
  await cdp.evaluate(() => history.back());
  await cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(landing)}`), 5000, `back to ${landing}`);
  const back = await cdp.evaluate(shellState);
  check(back.path === landing, `${role}: back from ${secondary} returns to ${landing}`, `got ${back.path}`);
}

// ---- T046: every forbidden address is refused, with a working route back ----
console.log('\nEvery forbidden address is refused with an explanation and a route back (FR-010, FR-011, SC-003)');
for (const [role, paths] of Object.entries(FORBIDDEN)) {
  await signIn(role);
  for (const path of paths) {
    await go(`${path}`);
    const s = await cdp.evaluate(shellState);
    const refused = s.eyebrow === 'No access' && s.hasBar;
    if (!refused) {
      fail(`${role}: ${path} was not refused (eyebrow ${s.eyebrow}, bar ${s.hasBar})`);
      continue;
    }
    await cdp.evaluate(() => {
      [...document.querySelectorAll('main button')].find((b) => b.textContent.startsWith('Go to')).click();
    });
    await waitForPath(ACCOUNTS[role].landing, `${role}'s route back from ${path}`);
  }
  pass(`${role}: all ${paths.length} forbidden addresses refused, each with a working route back`);
}

// ---- T047: not-found is distinguishable; record addresses never leak ----
console.log('\nNot-found stays diagnosable while record addresses reveal nothing (FR-012, FR-012a)');
await signIn('employee');
await go(`/definitely-not-a-screen`);
const missingPath = await cdp.evaluate(shellState);
check(missingPath.eyebrow === 'Not found', 'an unmatched path renders not-found', `eyebrow ${missingPath.eyebrow}`);
check(missingPath.hasBar, 'not-found renders inside the shell, chrome intact');

// The three-role addresses retired with constitution 3.0.0 (ADR-0005). A stale
// bookmark must fail visibly, even for the Admin who inherited both jobs.
await signIn('admin');
for (const retired of ['/approvals', '/fulfillment']) {
  await go(retired);
  const state = await cdp.evaluate(shellState);
  check(state.eyebrow === 'Not found', `retired ${retired} renders not-found for the Admin`, `eyebrow ${state.eyebrow}`);
}
await signIn('employee');

await go(`/requests/REQ-2026-9999`);
const missingRecord = await cdp.evaluate(shellState);
await go(`/requests/REQ-2026-1500`); // conceptually another employee's
const forbiddenRecord = await cdp.evaluate(shellState);
check(
  missingRecord.eyebrow === 'Unavailable' && forbiddenRecord.eyebrow === 'Unavailable',
  'a request that does not exist and one that is not yours both render the record response',
);
check(
  missingRecord.body === forbiddenRecord.body && missingRecord.title === forbiddenRecord.title,
  'and the two responses are word-for-word identical, so identifiers cannot be enumerated',
);
check(
  !missingRecord.body?.includes('9999') && !forbiddenRecord.body?.includes('1500'),
  'neither response echoes the identifier back',
);
check(missingRecord.eyebrow !== missingPath.eyebrow, 'a mistyped address is still distinguishable from a refused record');

// ---- T048: a deep link survives sign-in ----
console.log('\nA visitor who asked for a destination arrives there after signing in (FR-013)');
await signOutEverywhere();
await go(`/profile`);
await waitForPath('/login', 'the redirect to sign-in');
const beforeSignIn = await cdp.evaluate(shellState);
check(!beforeSignIn.hasBar, 'the sign-in screen carries no top bar (Story 5 AC5)');
await cdp.evaluate(() => {
  document.querySelector('input[value="maya.santos"]').click();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
});
await waitForPath('/profile', 'the originally requested destination');
pass('a signed-out request for /profile lands on /profile after sign-in, not on the landing screen');

// A destination the role may NOT use falls back to its landing screen.
await signOutEverywhere();
await go(`/inventory`);
await waitForPath('/login', 'the redirect to sign-in');
await cdp.evaluate(() => {
  document.querySelector('input[value="maya.santos"]').click();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
});
await waitForPath('/catalog', "the employee's landing screen");
pass('a deep link the role may not use falls back to the landing screen rather than a refusal');

// ---- T035 / FR-003b: a refused sign-in ----
console.log('\nA refused sign-in creates no session and says so (FR-003b)');
await signOutEverywhere();
await go(`/login`);
await cdp.evaluate(() => {
  document.querySelector('input[value="refused"]').click();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
});
await new Promise((r) => setTimeout(r, 500));
const refusal = await cdp.evaluate(() => ({
  path: location.pathname,
  alert: document.querySelector('[role="alert"]')?.textContent.trim() ?? null,
  stored: localStorage.getItem('osrs.session'),
  control: !![...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')),
}));
check(refusal.path === '/login', 'the visitor stays on sign-in', `got ${refusal.path}`);
check(!!refusal.alert, 'a plain failure message is announced', 'no alert rendered');
check(refusal.stored === null, 'no session reference is written');
check(refusal.control, 'the control is back at rest, so a retry is possible');

// ---- T049: sign-out, history, and a second tab ----
console.log('\nSigning out ends the session everywhere and cannot be undone with back (FR-016, FR-017a)');
await signIn('employee');
await go(`/profile`);
await cdp.evaluate(() => {
  [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('Sign Out')).click();
});
await waitForPath('/login', 'sign-out to reach the sign-in screen');
await cdp.send('Page.navigateToHistoryEntry', {
  entryId: (await cdp.send('Page.getNavigationHistory')).entries.at(-2).id,
});
await new Promise((r) => setTimeout(r, 600));
const afterBack = await cdp.evaluate(shellState);
check(afterBack.path === '/login' && !afterBack.account, 'back after sign-out restores no signed-in screen', `at ${afterBack.path}`);

const second = await connect(undefined, { newTab: true });
try {
  await second.setViewport(1440, 1024);
  await signIn('employee');
  await second.goto(`${ORIGIN}/catalog`);
  await second.waitFor(() => location.pathname === '/catalog', 8000, 'the second tab to reach the catalog');
  await second.evaluate(() => {
    [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('Sign Out')).click();
  });
  await second.waitFor(() => location.pathname === '/login', 8000, 'the second tab to sign out');
  await cdp.waitFor(() => location.pathname === '/login', 8000, 'the first tab to stop acting as signed in');
  pass('signing out in one tab returns the other to sign-in');

  // ---- FR-017b: a role that changes behind the boundary ----
  await signIn('employee');
  await go(`/requests`);
  await second.goto(`${ORIGIN}/login`);
  await second.evaluate(() => {
    // Behind the session boundary: repoint the seeded source's own session
    // record at another account. The shell never reads this; it only re-resolves.
    const store = JSON.parse(localStorage.getItem('osrs.demo.sessions'));
    const token = JSON.parse(localStorage.getItem('osrs.session')).token;
    store[token].account = 'ethan.cruz';
    localStorage.setItem('osrs.demo.sessions', JSON.stringify(store));
  });
  await cdp.waitFor(() => location.pathname === '/queue', 8000, 'the first tab to follow the role change');
  const afterRoleChange = await cdp.evaluate(shellState);
  check(
    afterRoleChange.nav.join(',') === ACCOUNTS.admin.nav.join(','),
    'a role change mid-session re-evaluates navigation and moves the user to a screen the new role may use (FR-017b)',
    `nav ${afterRoleChange.nav.join(',')}`,
  );
} finally {
  await second.closeTab();
}

// ---- T050: the loading state, and no sign-in flash ----
console.log('\nThe shell waits deliberately instead of flashing the sign-in screen (FR-018)');
await signIn('employee');

// The seeded source resolves in a microtask, so the loading state would exist
// for less than a frame. `?slow-session` (development only) holds resolution
// open long enough to see what the shell actually shows while it waits.
await cdp.send('Page.navigate', { url: `${ORIGIN}/catalog?slow-session=900` });
await cdp.waitFor(() => !!document.querySelector('#root')?.firstElementChild, 8000, 'the first rendered frame');
const waiting = await cdp.evaluate(() => ({
  text: document.querySelector('#root')?.textContent ?? '',
  status: document.querySelector('[role="status"]')?.textContent?.trim() ?? null,
  bar: !!document.querySelector('header'),
}));
check(waiting.status === 'Checking your session', 'the deliberate loading state renders while status is unknown', `showed ${waiting.status ?? waiting.text.slice(0, 40)}`);
check(!waiting.text.includes('Sign in with Google'), 'and it is the loading state, not a flash of the sign-in screen');
check(!waiting.bar, 'no half-rendered chrome while the session is still unknown');
await cdp.waitFor(() => !!document.querySelector('header'), 8000, 'the shell once the session resolves');
const resolved = await cdp.evaluate(shellState);
check(resolved.path === '/catalog' && resolved.account, 'the destination then renders with the session intact');

// ---- T051 / T042: responsive and keyboard ----
console.log('\nThe shell holds from 360 to 1440, with navigation and sign-out reachable (FR-022, FR-023, SC-006, SC-007)');
await signIn('admin'); // the widest navigation set
for (const width of [360, 768, 1024, 1440]) {
  await cdp.setViewport(width, 900);
  await go(`/queue`);
  await new Promise((r) => setTimeout(r, 350));
  const navVisible = await cdp.evaluate(
    () => [...document.querySelectorAll('header nav a')].filter((a) => a.getBoundingClientRect().width > 0).length,
  );
  // Open the disclosure if this width has one, then let React flush before
  // measuring what the user can now reach.
  await cdp.evaluate(() => {
    const menu = [...document.querySelectorAll('header button')].find((b) => b.textContent.trim().startsWith('Menu'));
    if (menu && menu.getBoundingClientRect().width > 0) menu.click();
  });
  await new Promise((r) => setTimeout(r, 250));

  const r = await cdp.evaluate((w) => {
    const overflowing = [...document.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > w + 1)
      .map((el) => el.tagName + '.' + String(el.className).slice(0, 30))
      .slice(0, 4);
    const header = document.querySelector('header');
    const reachableNav = [...header.querySelectorAll('nav a')].filter((a) => a.getBoundingClientRect().width > 0).length;
    const signOut = [...header.querySelectorAll('button')].find((b) => b.textContent.includes('Sign Out'));
    const small = [...document.querySelectorAll('a[href], button:not([disabled])')]
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && (box.width < 44 || box.height < 44))
      .map(({ el, box }) => `${el.tagName}.${String(el.className).slice(0, 20)} ${Math.round(box.width)}x${Math.round(box.height)}`)
      .slice(0, 4);
    return {
      scrollW: document.documentElement.scrollWidth,
      overflowing,
      reachableNav,
      signOutVisible: !!signOut && signOut.getBoundingClientRect().width > 0,
      barHeight: Math.round(header.getBoundingClientRect().height),
      gutter: Math.round(header.querySelector('img').getBoundingClientRect().left),
      small,
    };
  }, width);

  check(navVisible === (width < 768 ? 0 : 4), `${width}px: navigation is ${width < 768 ? 'collapsed' : 'inline'}`, `${navVisible} visible before opening`);
  check(r.scrollW <= width + 1, `${width}px: no horizontal overflow`, `scrollWidth ${r.scrollW} — ${r.overflowing.join(' | ')}`);
  check(r.reachableNav === 4, `${width}px: all four navigation items reachable`, `got ${r.reachableNav}`);
  check(r.signOutVisible, `${width}px: sign-out stays reachable`);
  if (width < 1440) check(r.small.length === 0, `${width}px: every shell target is at least 44px`, r.small.join(' | '));
  if (width === 1440) {
    check(r.barHeight === 87, '1440px: the bar is 87px tall, as drawn', `got ${r.barHeight}`);
    check(r.gutter === 32, '1440px: the gutter is 32px, as drawn', `got ${r.gutter}`);
    check(navVisible === 4, '1440px: navigation is inline, not collapsed', `got ${navVisible}`);
  }
}

// Keyboard: every control in the chrome reachable, each with a visible indicator.
await cdp.setViewport(1440, 1024);
await go(`/queue`);
const focusable = await cdp.evaluate(
  () =>
    [...document.querySelectorAll('header a[href], header button, main a[href], main button:not([disabled])')].filter(
      (el) => el.getBoundingClientRect().width > 0,
    ).length,
);
const tab = async () => {
  for (const type of ['rawKeyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  }
  await new Promise((r) => setTimeout(r, 12));
};
const noIndicator = [];
let reached = 0;
for (let i = 0; i < focusable + 2; i++) {
  await tab();
  const r = await cdp.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    return {
      id: el.tagName + '.' + String(el.className).slice(0, 30),
      visible: el.matches(':focus-visible'),
      outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
    };
  });
  if (!r) continue;
  reached++;
  if (!r.visible || !r.outline) noIndicator.push(r.id);
}
check(
  reached >= focusable && noIndicator.length === 0,
  `every shell control is keyboard-reachable with a visible focus indicator (${reached} of ${focusable})`,
  noIndicator.join(' | '),
);

console.log(`\n${failures} failure(s)`);
cdp.close();
process.exit(failures ? 1 : 0);
