/** BEN-44 — My Requests against spec 009's acceptance. Runs through the same
 *  CDP client as the other gates.
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173. Every run
 *  starts from a fresh document, so the seeded store is back to its seed. */
import { connect } from './cdp.mjs';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';

let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) console.log(`  ✓ ${m}`);
  else {
    failures++;
    console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
  }
};

const cdp = await connect();
await cdp.setViewport(1440, 1024);

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

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

const page = await cdp.evaluate(async () => {
  // The app's own vocabulary and seed, read through the dev server, so the
  // gate cannot drift from them.
  const { REQUEST_STATUSES, REQUEST_TONE } = await import('/src/shared/ui/status.ts');
  const { seededEmployeeRequestSource } = await import('/src/features/requests/detail/seeded-employee-request-source.ts');
  const others = await seededEmployeeRequestSource.list({ id: 'sam.torres', role: 'employee' });
  const mine = await seededEmployeeRequestSource.list({ id: 'maya.santos', role: 'employee' });
  const rows = [...document.querySelectorAll('main li')]
    .filter((li) => li.querySelector('button[aria-label^="View details"]'))
    .map((li) => {
      const cells = li.querySelectorAll(':scope > span');
      const pill = cells[3]?.querySelector('span');
      return {
        id: cells[0]?.textContent.trim(),
        date: cells[1]?.textContent.trim(),
        items: cells[2]?.textContent.trim(),
        pill: pill?.textContent.trim(),
        pillClass: pill?.className ?? '',
      };
    });
  return {
    title: document.querySelector('main h1')?.textContent.trim(),
    subtitle: document.querySelector('main h1')?.nextElementSibling?.textContent.trim(),
    headings: [...document.querySelectorAll('main span.type-eyebrow')].map((s) => s.textContent.trim()),
    rows,
    statuses: REQUEST_STATUSES,
    tones: REQUEST_TONE,
    mine: mine.map((r) => ({ id: r.id, submittedAt: r.submittedAt })),
    otherIds: others.map((r) => r.id),
  };
});

console.log('\nThe page (spec 009 Story 1)');
check(page.title === 'My Requests', 'title reads My Requests', page.title);
check(
  page.subtitle === 'Track every request from submission through pickup and completion',
  'subtitle is the frame’s',
  page.subtitle,
);
check(
  page.headings.join('|').toUpperCase() === 'REQUEST ID|DATE|ITEMS|STATUS|ACTION',
  'columns are REQUEST ID · DATE · ITEMS · STATUS · ACTION',
  page.headings.join(' · '),
);

console.log('\nAC1 / FR-001 — only the signed-in Employee’s requests');
check(page.otherIds.length > 0, 'the seed carries another Employee’s request to prove it against', JSON.stringify(page.otherIds));
check(
  page.rows.length === page.mine.length && page.rows.every((r) => page.mine.some((m) => m.id === r.id)),
  `exactly Maya’s ${page.mine.length} requests are listed`,
  `listed ${page.rows.map((r) => r.id).join(', ')}`,
);
check(!page.rows.some((r) => page.otherIds.includes(r.id)), 'no other Employee’s request appears');

console.log('\nAC2 / FR-002 — newest first');
const expected = [...page.mine].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)).map((r) => r.id);
check(
  page.rows.map((r) => r.id).join() === expected.join(),
  'rows are ordered by submission time, newest first',
  `got ${page.rows.map((r) => r.id).join(', ')}`,
);
check(page.rows[0]?.date === 'Sep 11, 2026', 'the first row is the newest (Sep 11, 2026)', page.rows[0]?.date);

console.log('\nAC3 / FR-003 — ITEMS summary');
const r1847 = page.rows.find((r) => r.id === 'REQ-2026-1847');
check(r1847?.items === 'Laptop, Keyboard + 1 more', 'three items read "Laptop, Keyboard + 1 more"', r1847?.items);
const r1842 = page.rows.find((r) => r.id === 'REQ-2026-1842');
check(r1842?.items === 'Monitor, Dock', 'two items read "Monitor, Dock"', r1842?.items);

console.log('\nAC4 / FR-004 — every status in its own tone');
for (const status of page.statuses) {
  const row = page.rows.find((r) => r.pill === status);
  check(!!row, `a ${status} row exists`);
  if (row) {
    const tone = page.tones[status];
    check(row.pillClass.includes(`bg-status-${tone}-bg`), `${status} pill uses the ${tone} tone`, row.pillClass);
  }
}
check(page.rows.every((r) => page.statuses.includes(r.pill)), 'no pill reads a value outside the seven');

console.log('\nAC5 / FR-005 — View details opens the panel without navigating');
await cdp.evaluate(() => document.querySelector('button[aria-label="View details of REQ-2026-1805"]').click());
await cdp.waitFor(() => !!document.querySelector('[role="dialog"]'), 5000, 'the panel');
const opened = await cdp.evaluate(() => ({
  path: location.pathname,
  heading: document.querySelector('[role="dialog"] h2')?.textContent.trim(),
}));
check(opened.path === '/requests', 'the address stays /requests', opened.path);
check(opened.heading === 'REQ-2026-1805', 'the panel is for that request', opened.heading);

console.log(`\n${failures} failure(s)`);
cdp.close();
process.exit(failures ? 1 : 0);
