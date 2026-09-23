/** Spec 006 — Profile's own verification.
 *
 *  Asserts the identity block for all three seeded roles and every state of
 *  `Currently Assigned` through the opt-in `?assigned=` demo stub:
 *  hidden (no source), empty, list, loading and failure. Runs through the same
 *  CDP client as the other gates; Playwright (BEN-50) can lift these
 *  assertions as they stand.
 *
 *  Needs `npm run dev`, or `npm run build && npx vite preview` to check the
 *  production build (the stub is opt-in there too). Headless Chrome is started
 *  for you. Set OSRS_DEV_ORIGIN when the server is not on port 5173. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) return console.log(`  ✓ ${m}`);
  failures++;
  console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
};

// The seeded session's facts, as spec 006 expects them rendered (FR-004).
const ACCOUNTS = [
  { account: 'maya.santos', landing: '/catalog', name: 'Maya Santos', line: 'mayas@codev.com • Davao Office' },
  { account: 'samantha.reyes', landing: '/approvals', name: 'Samantha Reyes', line: 'samanthar@codev.com • Makati Office' },
  { account: 'ethan.cruz', landing: '/fulfillment', name: 'Ethan Cruz', line: 'ethanc@codev.com • Cebu Office' },
];

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

/** What Profile shows, read the same way for every state. */
const profileState = () => {
  const main = document.querySelector('main');
  const section = main?.querySelector('section[aria-labelledby="currently-assigned-heading"]');
  return {
    title: main?.querySelector('h1')?.textContent.trim() ?? null,
    text: main?.innerText ?? '',
    current: document.querySelectorAll('header nav a[aria-current="page"]').length,
    section: !!section,
    cards: section?.querySelectorAll('li').length ?? 0,
    chips: section ? [...section.querySelectorAll('li span[class*="status-info"]')].length : 0,
    dates: section ? [...section.querySelectorAll('li')].filter((li) => li.textContent.includes('Assigned ')).length : 0,
    noDate: section
      ? [...section.querySelectorAll('li')].filter((li) => li.textContent.includes('Assignment date not available')).length
      : 0,
    status: section?.querySelector('[role="status"]')?.textContent.trim() ?? null,
    alert: section?.querySelector('[role="alert"]')?.textContent.trim() ?? null,
    empty: section?.textContent.includes('Nothing is assigned to you') ?? false,
    inputs: main?.querySelectorAll('input, textarea, select, [contenteditable]').length ?? -1,
  };
};

/** A wait that times out is a counted failure, not a crash: the remaining
 *  checks still run and the summary line still prints. */
const waitOr = async (predicate, label) => {
  try {
    await cdp.waitFor(predicate, 8000, label);
    return true;
  } catch {
    check(false, `timed out waiting for ${label}`);
    return false;
  }
};
const waitForProfile = () =>
  waitOr(
    () => document.querySelector('main h1')?.textContent.trim() === 'Profile',
    'the Profile page',
  );
const waitForSection = (what) =>
  waitOr(
    () => !!document.querySelector('section[aria-labelledby="currently-assigned-heading"] :is(li, [role="alert"], p)'),
    `the assigned section (${what})`,
  );

// Whatever happens below, the tab is closed and the summary printed.
try {
  console.log('\nIdentity comes from the session, for every role (FR-004, FR-005, FR-012, SC-001)');
  for (const a of ACCOUNTS) {
    await signIn(a);
    await go('/profile');
    await waitForProfile();
    const s = await cdp.evaluate(profileState);
    check(s.title === 'Profile', `${a.account}: the Profile page renders`, `got ${s.title}`);
    check(s.text.includes(a.name) && s.text.includes(a.line), `${a.account}: shows ${a.name} / ${a.line}`);
    check(s.current === 0, `${a.account}: no navigation item is current (Story 1 AC5)`);
    check(s.inputs === 0, `${a.account}: the page is read-only (FR-013)`);
  }

  console.log('\nCurrently Assigned has exactly its designed states (FR-007, FR-008, FR-009, FR-011)');
  await signIn(ACCOUNTS[0]);

  await go('/profile');
  await waitForProfile();
  // Absence cannot be awaited. The title renders on mount, but the section's
  // source is resolved later in an effect, so give that time to settle before
  // asserting there is no section — otherwise this passes vacuously.
  await new Promise((r) => setTimeout(r, 400));
  let s = await cdp.evaluate(profileState);
  check(!s.section && !s.text.includes('Currently Assigned'), 'no source: the section is not rendered at all (FR-007c)');

  await go('/profile?assigned=empty');
  await waitForSection('empty');
  s = await cdp.evaluate(profileState);
  check(s.section && s.empty && s.cards === 0, 'empty source: heading and the empty state (FR-007b)');

  await go('/profile?assigned=items');
  await waitForSection('items');
  s = await cdp.evaluate(profileState);
  check(s.section && s.cards === 3 && !s.empty, 'items: three cards (FR-007a)', `got ${s.cards}`);
  check(s.chips === 2, 'items: a row without a tag omits the chip (FR-009)', `chips ${s.chips}`);
  check(
    s.dates === 2 && s.noDate === 1,
    'items: a row without a date says so in words, never a made-up date (FR-009 as amended)',
    `dates ${s.dates}, stated-missing ${s.noDate}`,
  );

  await go('/profile?assigned=loading');
  // The loading line only appears once the stub's chunk has loaded; it then
  // stays up for two seconds, so waiting for it cannot miss it.
  await waitOr(
    () => !!document.querySelector('section[aria-labelledby="currently-assigned-heading"] [role="status"]'),
    'the loading line',
  );
  s = await cdp.evaluate(profileState);
  check(s.status === 'Loading assigned equipment' && s.cards === 0, 'loading: the loading line shows first (FR-011)', `got ${s.status}`);
  check(
    await waitOr(
      () => document.querySelectorAll('section[aria-labelledby="currently-assigned-heading"] li').length === 3,
      'the loaded list',
    ),
    'loading: the list replaces it once the source answers',
  );

  await go('/profile?assigned=failing');
  await waitForSection('failing');
  s = await cdp.evaluate(profileState);
  check(
    s.alert === 'Couldn’t load your assigned equipment' && !s.empty && s.text.includes('Maya Santos'),
    'failing: an error, never the empty state, with identity still shown (FR-008, FR-011)',
  );

} catch (error) {
  check(false, `the run stopped: ${error.message}`);
} finally {
  cdp.close();
}

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
