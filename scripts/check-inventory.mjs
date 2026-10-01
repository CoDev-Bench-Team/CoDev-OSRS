/** BEN-150 — Inventory against spec 015's acceptance. Runs through the same CDP
 *  client as the other gates.
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173. Every run
 *  starts from a fresh document, so the seeded stores are back to their seed.
 *
 *  A step that times out is a failed check, not a crash; anything that still
 *  throws is counted as one more failure, and the summary always prints. */
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

const signIn = async (user) => {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  await cdp.evaluate((user) => {
    document.querySelector(`input[value="${user}"]`).click();
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  }, user);
  await cdp.waitFor(() => location.pathname !== '/login', 8000, `${user}'s landing`);
};

/** The Assets screen before spec 015, read from the browser on 2026-10-01:
 *  per asset, Available and Reserved at Cebu · Bacolod · Makati · Ortigas ·
 *  Davao, then Assigned. Inventory's register must reproduce every figure
 *  (plan P3, R1). */
const BASELINE = {
  'asset-1': [[6, 3, 4, 2, 3], [6, 2, 4, 2, 0], 3],
  'asset-2': [[2, 2, 1, 1, 2], [6, 2, 5, 2, 1], 11],
  'asset-3': [[7, 4, 6, 3, 4], [5, 2, 4, 3, 2], 21],
  'asset-4': [[1, 1, 1, 1, 0], [9, 3, 6, 3, 3], 17],
  'asset-5': [[1, 1, 1, 1, 1], [5, 2, 4, 2, 2], 8],
  'asset-6': [[0, 0, 0, 0, 0], [20, 10, 15, 8, 7], 44],
  'asset-7': [[5, 2, 3, 0, 3], [1, 0, 1, 0, 0], 9],
  'asset-8': [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], 6],
  'asset-9': [[4, 2, 2, 1, 1], [0, 0, 0, 0, 0], 4],
  'asset-10': [[2, 1, 2, 1, 1], [1, 0, 0, 0, 0], 2],
  'asset-11': [[8, 4, 5, 4, 4], [2, 0, 1, 0, 0], 12],
  'asset-12': [[2, 0, 1, 1, 0], [3, 0, 2, 1, 0], 5],
  'asset-13': [[0, 0, 1, 0, 0], [2, 0, 1, 0, 0], 3],
  'asset-14': [[6, 2, 4, 2, 2], [0, 0, 0, 0, 0], 7],
  'asset-15': [[13, 4, 9, 5, 5], [2, 1, 1, 0, 0], 30],
  'asset-16': [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], 5],
};
const BASELINE_CHIPS = { 'All items': 16, 'In stock': 9, 'Low stock': 4, 'Out of stock': 3 };
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

try {
  await signIn('ethan.cruz');

  console.log('Assets unchanged — the register reproduces the baseline (plan P3, R1)');
  await go('/assets');
  await cdp.waitFor(() => document.querySelectorAll('[aria-label="Assets table"] button').length > 0, 8000, 'the asset rows');

  const seeded = await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    const { OFFICES } = await import('/src/features/auth/types.ts');
    const all = await seededAssetSource.list();
    return Object.fromEntries(
      all.map((a) => [a.id, [OFFICES.map((o) => a.stock[o].available), OFFICES.map((o) => a.stock[o].reserved), a.assigned, a.name]]),
    );
  });
  const mismatched = Object.entries(BASELINE).filter(
    ([id, want]) => JSON.stringify(seeded[id]?.slice(0, 3)) !== JSON.stringify(want),
  );
  check(
    mismatched.length === 0,
    'every asset keeps its per-office Available and Reserved and its Assigned',
    mismatched.map(([id]) => `${id}: ${JSON.stringify(seeded[id]?.slice(0, 3))}`).join('; '),
  );

  const chipCounts = await cdp.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[aria-label="Filter by stock status"] button')].map((b) => {
        const m = b.textContent.trim().match(/^(.*?)\s*\(?(\d+)\)?$/);
        return [m[1], Number(m[2])];
      }),
    ),
  );
  check(JSON.stringify(chipCounts) === JSON.stringify(BASELINE_CHIPS), 'the four stock chips keep their counts', JSON.stringify(chipCounts));

  await cdp.evaluate(() => {
    const select = document.querySelector('nav[aria-label="Pagination"] select');
    const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    set.call(select, '50');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await cdp.waitFor(() => document.querySelectorAll('[aria-label="Assets table"] button').length === 16, 5000, 'all 16 rows at 50 per page');
  const shown = await cdp.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[aria-label="Assets table"] button')].map((b) => {
        const cells = [...b.closest('div.relative').children].map((c) => c.textContent.trim());
        return [cells[0], cells.slice(3).map(Number)];
      }),
    ),
  );
  const wrongRows = Object.entries(BASELINE).filter(([id, [available, reserved, assigned]]) => {
    const name = seeded[id]?.[3];
    return JSON.stringify(shown[name]) !== JSON.stringify([sum(available), sum(reserved), assigned]);
  });
  check(
    wrongRows.length === 0,
    'AVAILABLE UNITS, PENDING/RESERVED UNITS and ASSIGNED UNITS read the baseline on every row',
    wrongRows.map(([id]) => `${seeded[id]?.[3]}: ${JSON.stringify(shown[seeded[id]?.[3]])}`).join('; '),
  );
} catch (error) {
  check(false, 'the gate ran to the end', error instanceof Error ? error.message : String(error));
}

console.log(`\n${failures} failure(s)`);
await cdp.close();
process.exit(failures ? 1 : 0);
