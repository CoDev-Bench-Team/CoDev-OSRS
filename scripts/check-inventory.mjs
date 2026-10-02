/** BEN-150 — Inventory against spec 015's acceptance. Runs through the same CDP
 *  client as the other gates.
 *
 *  Covers: the Assets baseline the register must reproduce (R1); the Employee
 *  kept out; the table's columns, chips, search, category, pagination and
 *  newest-first order; the Add Inventory menu by keyboard and pointer; the
 *  stub modes and overflow; Add Single Unit, Review/Edit and Remove Unit,
 *  every status move against `__osrs.inventory.counts`; masked secrets and
 *  their absence from the table, the URL and the console; concurrent
 *  reservation and removal; Add Multiple Units, its bounds, all-or-nothing
 *  saves and the counts on Assets.
 *
 *  Reach (R2): everything here runs against the SEEDED register behind the
 *  `InventorySource` boundary. It proves the screens and the client rules, not
 *  the backend: the 400, 404 and 409 bodies are the seeded source's, shaped as
 *  the contract words them, and the gaps are contracts/README.md conflict 11.
 *
 *  Needs `npm run dev`; headless Chrome is started by cdp.mjs. Set
 *  OSRS_DEV_ORIGIN when the dev server took a port other than 5173. Every
 *  `go()` loads a fresh document, so the seeded stores are back to their seed.
 *
 *  A step that times out is a failed check, not a crash; anything that still
 *  throws is counted as one more failure, and the summary always prints. */
import { readdirSync, readFileSync } from 'node:fs';
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
await cdp.send('Runtime.enable');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Polls `predicate(arg)` in the page; resolves false on timeout instead of
 *  throwing, so the caller records it and the run goes on. */
const until = async (predicate, arg, timeout = 5000) => {
  const started = Date.now();
  while (!(await cdp.evaluate(predicate, arg))) {
    if (Date.now() - started > timeout) return false;
    await wait(100);
  }
  return true;
};

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

  // ---- Helpers over the live page ------------------------------------------

  const SEARCH = 'input[aria-label="Search by item name, model, purchase request or serial number"]';
  const REGION = '[aria-label="Inventory table"]';

  const register = () =>
    cdp.evaluate(async () => {
      const { unitRegister } = await import('/src/features/inventory/seeded-unit-register.ts');
      return { units: unitRegister.list(), removals: unitRegister.removals() };
    });
  const assetNames = await cdp.evaluate(async () => {
    const { seededAssetSource } = await import('/src/features/assets/seeded-asset-source.ts');
    return Object.fromEntries((await seededAssetSource.list()).map((a) => [a.id, { name: a.name, model: a.model ?? '', category: a.category }]));
  });
  const counts = (assetId, office) => cdp.evaluate((a, o) => window.__osrs.inventory.counts(a, o), assetId, office);
  const delta = (before, after) => Object.fromEntries(Object.keys(before).map((k) => [k, after[k] - before[k]]));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const key = async (k, code, vk) => {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
  };
  const clickAt = async ({ x, y }) => {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };

  const rowsReady = () => until((r) => document.querySelectorAll(`${r} [data-unit]`).length > 0, REGION, 8000);
  const rowIds = () => cdp.evaluate(() => [...document.querySelectorAll('[data-unit]')].map((r) => r.dataset.unit));
  const rowCells = () =>
    cdp.evaluate(() => [...document.querySelectorAll('[data-unit]')].map((r) => [...r.children].map((c) => c.textContent.trim())));
  const chips = () =>
    cdp.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('[aria-label="Filter by unit status"] button')].map((b) => {
          const m = b.textContent.trim().match(/^(.*?)\s*\(?(\d+)\)?$/);
          return [m[1], Number(m[2])];
        }),
      ),
    );
  const pressChip = (label) =>
    cdp.evaluate(
      (label) => [...document.querySelectorAll('[aria-label="Filter by unit status"] button')].find((b) => b.textContent.trim().startsWith(label)).click(),
      label,
    );
  const setValue = (selector, value) =>
    cdp.evaluate(
      ({ selector, value }) => {
        const input = document.querySelector(selector);
        const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
        set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      { selector, value },
    );
  const search = async (text) => {
    await setValue(SEARCH, text);
    await wait(150);
  };
  const pageSize = async (n) => {
    await cdp.evaluate((n) => {
      const select = document.querySelector('nav[aria-label="Pagination"] select');
      const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      set.call(select, String(n));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }, n);
    await wait(150);
  };
  const currentPage = () => cdp.evaluate(() => document.querySelector('nav[aria-label="Pagination"] [aria-current="page"]')?.textContent.trim());
  const pageButton = (label) =>
    cdp.evaluate(
      (label) => [...document.querySelectorAll('nav[aria-label="Pagination"] button')].find((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label)?.click(),
      label,
    );
  /** Picks an option of a shared `Select`, in the page or the open panel. */
  const chooseSelect = async (label, option, scope = 'dialog[open]') => {
    await cdp.evaluate(
      ({ label, scope }) => document.querySelector(`${scope} button[role="combobox"][aria-label="${label}"]`).click(),
      { label, scope },
    );
    await until((label) => !!document.querySelector(`ul[role="listbox"][aria-label="${label}"]`), label);
    return cdp.evaluate(
      ({ label, option }) => {
        const li = [...document.querySelectorAll(`ul[role="listbox"][aria-label="${label}"] [role="option"]`)].find((o) => o.textContent.trim() === option);
        li?.click();
        return !!li;
      },
      { label, option },
    );
  };
  const selectOptions = async (label) => {
    await cdp.evaluate((label) => document.querySelector(`dialog[open] button[role="combobox"][aria-label="${label}"]`).click(), label);
    await until((label) => !!document.querySelector(`ul[role="listbox"][aria-label="${label}"]`), label);
    const options = await cdp.evaluate(
      (label) => [...document.querySelectorAll(`ul[role="listbox"][aria-label="${label}"] [role="option"]`)].map((o) => o.textContent.trim()),
      label,
    );
    await cdp.evaluate((label) => document.querySelector(`dialog[open] button[role="combobox"][aria-label="${label}"]`).click(), label);
    return options;
  };
  const selectValue = (label) =>
    cdp.evaluate((label) => {
      const b = document.querySelector(`dialog[open] button[role="combobox"][aria-label="${label}"]`);
      return b ? { text: b.textContent.trim(), disabled: b.disabled } : null;
    }, label);

  /** The control a visible field label names, the nth when rows repeat it. */
  const control = (label, nth = 0) =>
    cdp.evaluate(
      ({ label, nth }) => {
        const l = [...document.querySelectorAll('dialog[open] label')].filter((l) => l.textContent.replace('*', '').trim() === label)[nth];
        const el = l && document.getElementById(l.htmlFor);
        if (!el) return null;
        const described = el.getAttribute('aria-describedby');
        return {
          value: el.tagName === 'BUTTON' ? el.textContent.trim() : el.value,
          disabled: el.disabled,
          type: el.type,
          masked: getComputedStyle(el).webkitTextSecurity,
          message: described ? (document.getElementById(described)?.textContent.trim() ?? '') : '',
        };
      },
      { label, nth },
    );
  const fill = (label, value, nth = 0) =>
    cdp.evaluate(
      ({ label, value, nth }) => {
        const l = [...document.querySelectorAll('dialog[open] label')].filter((l) => l.textContent.replace('*', '').trim() === label)[nth];
        const input = document.getElementById(l.htmlFor);
        const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
        set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
      { label, value, nth },
    );
  /** Types into a combobox field and takes the result that contains `text`. */
  const pick = async (label, query, text) => {
    await fill(label, query);
    const shown = await until((text) => [...document.querySelectorAll('dialog[open] [role="option"]')].some((o) => o.textContent.includes(text)), text);
    if (!shown) return false;
    await cdp.evaluate((text) => {
      const o = [...document.querySelectorAll('dialog[open] [role="option"]')].find((o) => o.textContent.includes(text));
      o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }, text);
    await wait(100);
    return true;
  };
  const options = () => cdp.evaluate(() => [...document.querySelectorAll('dialog[open] [role="option"]')].map((o) => o.textContent.trim()));
  const pressInPanel = (label) =>
    cdp.evaluate((label) => {
      const b = [...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label);
      if (!b) return false;
      b.click();
      return true;
    }, label);
  /** As a keyboard user would: focus the button, then activate it. */
  const pressFocused = (label) =>
    cdp.evaluate((label) => {
      const b = [...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label);
      if (!b) return false;
      b.focus();
      b.click();
      return true;
    }, label);
  const hasButton = (label) =>
    cdp.evaluate((label) => [...document.querySelectorAll('dialog[open] button')].some((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label), label);
  const panelText = () => cdp.evaluate(() => document.querySelector('dialog[open]')?.textContent ?? '');
  const panelOpen = () => until(() => !!document.querySelector('dialog[open]'));
  const panelClosed = () => until(() => !document.querySelector('dialog[open]'), undefined, 6000);
  const panelTitle = () => cdp.evaluate(() => document.querySelector('dialog[open] h2')?.textContent.trim());
  const focused = () =>
    cdp.evaluate(() => {
      const a = document.activeElement;
      return { tag: a?.tagName, label: a?.getAttribute('aria-label') ?? '', text: a?.textContent.trim().slice(0, 40) ?? '' };
    });
  const urls = [];
  const noteUrl = async () => urls.push(await cdp.evaluate(() => location.href));

  const openMenu = (item) =>
    cdp.evaluate((item) => {
      document.querySelector('button[aria-haspopup="menu"]').click();
      return new Promise((r) =>
        setTimeout(() => {
          [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === item).click();
          r(true);
        }, 50),
      );
    }, item);

  /** Opens Review/Edit for `unit`, searching by its serial where it has one
   *  and paging through the register otherwise. */
  const openUnit = async (unit) => {
    await search(unit.serialNumber ?? '');
    await pageSize(100);
    for (let p = 0; p < 8; p++) {
      const hit = await cdp.evaluate((id) => {
        const b = document.querySelector(`[data-unit="${id}"] button`);
        // A pointer click focuses the button, which the panel returns to.
        b?.focus();
        b?.click();
        return !!b;
      }, unit.id);
      if (hit) {
        const ready = await until(() => !!document.querySelector('dialog[open] form'), undefined, 6000);
        await noteUrl();
        return ready;
      }
      await pageButton('Next');
      await wait(150);
    }
    return false;
  };
  const save = async () => {
    await pressInPanel('Save Changes');
    return panelClosed();
  };

  const signInFresh = async (user) => {
    await signIn(user);
  };

  // ---- T027: the Employee ---------------------------------------------------

  console.log('\nThe Employee has no Inventory (US6, FR-014)');
  await signInFresh('maya.santos');
  const employeeNav = await cdp.evaluate(() => [...document.querySelectorAll('header nav a')].map((a) => a.textContent.trim()));
  check(employeeNav.length > 0 && !employeeNav.includes('Inventory'), 'no Inventory item in the Employee navigation', JSON.stringify(employeeNav));
  await go('/inventory');
  check(
    await until(() => document.querySelector('main')?.textContent.includes('No access') && !document.querySelector('[aria-label="Inventory table"]')),
    '/inventory is refused for the Employee, with no register in the page',
  );

  // ---- T027: the table ------------------------------------------------------

  console.log('\nThe register table (US1, FR-001 to FR-005)');
  await signInFresh('ethan.cruz');
  await go('/inventory');
  check(await rowsReady(), 'the rows load');
  const seed = (await register()).units;
  const secrets = seed.flatMap((u) => [u.bitlockerIdentifier, u.recoveryPin]).filter(Boolean);
  check(secrets.length > 0, 'the seed carries BitLocker secrets to look for');

  const header = await cdp.evaluate(() =>
    [...document.querySelectorAll('[aria-label="Inventory table"] .bg-surface-table-header span')].map((s) => s.textContent.trim()),
  );
  check(
    same(header, ['MODEL', 'CATEGORY', 'PURCHASE REQUEST', 'SERIAL NUMBER', 'OFFICE', 'ASSIGNED', 'STATUS', 'ACTION']),
    'the eight drawn columns, in order',
    JSON.stringify(header),
  );

  const newest = [...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((u) => u.id);
  check((await rowIds()).length === 50, '50 rows per page by default');
  check(same(await rowIds(), newest.slice(0, 50)), 'newest added first');

  const byStatus = (s) => seed.filter((u) => u.status === s).length;
  const wantChips = { 'All items': seed.length, Assigned: byStatus('Assigned'), Available: byStatus('Available'), Reserved: byStatus('Reserved') };
  check(same(await chips(), wantChips), 'chips All items · Assigned · Available · Reserved with their counts', JSON.stringify(await chips()));
  check(
    byStatus('Inactive') > 0 && wantChips['All items'] === wantChips.Assigned + wantChips.Available + wantChips.Reserved + byStatus('Inactive'),
    'Inactive units count under All items only',
  );
  await pressChip('Reserved');
  await wait(150);
  check((await rowCells()).every((c) => c[6] === 'Reserved'), 'the Reserved chip shows Reserved units only');
  check(await cdp.evaluate(() => [...document.querySelectorAll('[aria-label="Filter by unit status"] button')].find((b) => b.textContent.startsWith('Reserved')).getAttribute('aria-pressed') === 'true'), 'the pressed chip says so');
  await pressChip('All items');
  await wait(150);

  const pageSizes = await cdp.evaluate(() => [...document.querySelectorAll('nav[aria-label="Pagination"] select option')].map((o) => Number(o.value)));
  check(same(pageSizes, [10, 25, 50, 100]), 'page sizes 10 · 25 · 50 · 100', JSON.stringify(pageSizes));

  const cells = await rowCells();
  check(cells.some((c) => c[2] === '—') && cells.some((c) => c[3] === '—'), 'a missing purchase request or serial shows the no-value dash');
  check(cells.some((c) => c[5] === 'Unassigned') && cells.some((c) => /Maya Santos|Ethan Cruz/.test(c[5])), 'ASSIGNED reads a name, or Unassigned');
  check(
    await cdp.evaluate(() => [...document.querySelectorAll('[data-unit] button')].every((b) => /^Review \S/.test(b.getAttribute('aria-label') ?? ''))),
    'each Review names its unit',
  );

  // Every Laptop at once, where the secrets would be if anything leaked them.
  await chooseSelect('Filter by category', 'Laptop', 'main');
  await pageSize(100);
  check((await rowCells()).every((c) => c[1] === 'Laptop'), 'the category filter shows that category only');
  const tableHtml = await cdp.evaluate(() => document.querySelector('main').innerHTML);
  check(!secrets.some((s) => tableHtml.includes(s)), 'no BitLocker identifier or recovery key in the table DOM');
  await chooseSelect('Filter by category', 'All categories', 'main');

  const searchMatches = async (q, label) => {
    await search(q);
    const want = seed.filter((u) =>
      [assetNames[u.assetId].name, assetNames[u.assetId].model, u.pr, u.serialNumber].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase()),
    );
    const got = await rowIds();
    check(got.length === Math.min(want.length, 100) && got.every((id) => want.some((u) => u.id === id)), `search by ${label}`, `${got.length} of ${want.length}`);
  };
  const laptop = seed.find((u) => u.assetId === 'asset-1' && u.status === 'Available' && u.serialNumber && u.pr);
  await searchMatches(assetNames['asset-1'].name, 'item name');
  await searchMatches(assetNames['asset-1'].model || assetNames['asset-1'].name, 'model');
  await searchMatches(laptop.pr, 'purchase request');
  await searchMatches(laptop.serialNumber, 'serial number');
  await search('');

  await pageSize(10);
  await pageButton('Page 2');
  await wait(100);
  check((await currentPage()) === '2', 'paging moves to page 2');
  await search('a');
  check((await currentPage()) === '1', 'a new search goes back to page 1');
  await search('');
  await pageButton('Page 2');
  await chooseSelect('Filter by category', 'Monitor', 'main');
  check((await currentPage()) === '1', 'a new category goes back to page 1');
  await chooseSelect('Filter by category', 'All categories', 'main');

  // ---- T027: the menu -------------------------------------------------------

  console.log('\nThe Add Inventory menu (FR-006)');
  await cdp.evaluate(() => document.querySelector('button[aria-haspopup="menu"]').focus());
  await key('ArrowDown', 'ArrowDown', 40);
  await wait(100);
  check((await focused()).text === 'Add Single Unit', 'ArrowDown opens the menu on its first item');
  await key('ArrowDown', 'ArrowDown', 40);
  check((await focused()).text === 'Add Multiple Units', 'ArrowDown moves to the next item');
  await key('Escape', 'Escape', 27);
  await wait(100);
  check(
    await cdp.evaluate(() => !document.querySelector('[role="menu"]') && document.activeElement?.getAttribute('aria-haspopup') === 'menu'),
    'Esc closes it and returns focus to + Add Inventory',
  );
  await cdp.evaluate(() => document.querySelector('button[aria-haspopup="menu"]').click());
  check(await until(() => document.querySelector('button[aria-haspopup="menu"]').getAttribute('aria-expanded') === 'true'), 'a click opens it, aria-expanded set');
  const heading = await cdp.evaluate(() => {
    const r = document.querySelector('main h1').getBoundingClientRect();
    return { x: r.left + 10, y: r.top + r.height / 2 };
  });
  await clickAt(heading);
  check(await until(() => !document.querySelector('[role="menu"]')), 'an outside click closes it');

  // ---- T027: stub modes and overflow ----------------------------------------

  console.log('\nLoad states and overflow (FR-001, plan P16)');
  await go('/inventory?inventory=failing');
  check(
    await until(() => document.querySelector('main').textContent.includes('Inventory could not be loaded') && [...document.querySelectorAll('main button')].some((b) => b.textContent.trim() === 'Try again'), undefined, 6000),
    'a failed load says so, with Try again',
  );
  await go('/inventory?inventory=recovers');
  await until(() => document.querySelector('main').textContent.includes('Inventory could not be loaded'), undefined, 6000);
  await cdp.evaluate(() => {
    window.__recoverInventory();
    [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Try again').click();
  });
  check(await rowsReady(), 'Try again loads the rows once the source recovers');
  await go('/inventory?inventory=slow');
  check(
    await until(() => document.querySelector('main').textContent.includes('Loading inventory') && !document.querySelector('[data-unit]')),
    'a slow load shows Loading inventory',
  );
  await cdp.evaluate(() => window.__releaseInventory?.());
  check(await rowsReady(), 'the rows arrive when it lands');
  await go('/inventory?inventory=empty');
  check(await until(() => document.querySelector('main').textContent.includes('No units in the register yet'), undefined, 6000), 'an empty register says so');

  await go('/inventory');
  await rowsReady();
  for (const width of [360, 1440]) {
    await cdp.setViewport(width, 900);
    await wait(250);
    const overflow = await cdp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `no page-level overflow at ${width}px`, `${overflow}px`);
  }
  await cdp.setViewport(1440, 1024);

  // ---- T035: Add Single Unit ------------------------------------------------

  console.log('\nAdd Single Unit (US2, FR-007, FR-008, FR-011 to FR-013)');
  const monitorName = assetNames['asset-2'].name;
  const laptopName = assetNames['asset-1'].name;
  await openMenu('Add Single Unit');
  await panelOpen();
  check((await panelTitle()) === 'Add Single Unit', 'the menu opens Add Single Unit');
  check((await control('Office')).value === 'Cebu', 'Office defaults to Cebu');
  check(same(await selectOptions('Status'), ['Available', 'Assigned', 'Inactive']), 'Status offers exactly Available, Assigned and Inactive');
  check(!(await cdp.evaluate(() => [...document.querySelectorAll('dialog[open] label')].some((l) => /\bPR\b/.test(l.textContent)))), 'no field label abbreviates Purchase Request');

  await pressInPanel('Save Changes');
  await wait(150);
  check((await control('Catalog Item')).message === 'Choose a catalog item', 'an empty save asks for a catalog item');
  check((await control('Status')).message === 'Choose a status', 'and for a status');
  check((await control('Serial Number')).message === 'Enter the serial number', 'and for a serial number');

  const userAt = await cdp.evaluate(() => {
    const input = document.getElementById([...document.querySelectorAll('dialog[open] label')].find((l) => l.textContent.trim() === 'User').htmlFor);
    input.scrollIntoView({ block: 'center' });
    const r = input.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await clickAt(userAt);
  check(await until(() => document.querySelectorAll('dialog[open] [role="option"]').length === 8), 'clicking User lists every user before anything is typed');
  await fill('User', 'Maya');
  await until(() => document.querySelectorAll('dialog[open] [role="option"]').length === 1);
  check((await options()).length === 1, 'typing filters the list');
  check((await options()).some((o) => o.startsWith('Maya Santos')), 'the User field finds an Employee by name');
  await fill('User', 'ethanc@');
  await until(() => [...document.querySelectorAll('dialog[open] [role="option"]')].some((o) => o.textContent.includes('Ethan Cruz')));
  check((await options()).some((o) => o.startsWith('Ethan Cruz')), 'and an Admin by email');
  await pick('User', 'ethanc@', 'Ethan Cruz');
  check((await selectValue('Status')).text === 'Assigned', 'picking a User sets Assigned');
  await chooseSelect('Status', 'Available');
  await wait(100);
  check((await control('User')).value === '', 'choosing Available clears the User');

  check(await pick('Catalog Item', laptopName, laptopName), 'the catalog item is found by name');
  check(await cdp.evaluate(() => document.querySelectorAll('dialog[open] [data-secret]').length === 2), 'a Laptop shows the BitLocker pair');
  await fill('BitLocker Identifier', 'CHECK-BL-1');
  await fill('Recovery Key/PIN', 'CHECK-RK-1');
  await pressFocused(`Clear catalog item ${laptopName}`);
  check(await until(() => document.activeElement?.type === 'search'), 'clearing the catalog item moves focus to its search');
  await pick('Catalog Item', monitorName, monitorName);
  check(await cdp.evaluate(() => !document.querySelector('dialog[open] [data-secret]')), 'a Monitor has no BitLocker fields');
  await pressInPanel(`Clear catalog item ${monitorName}`);
  await pick('Catalog Item', laptopName, laptopName);
  check(
    (await control('BitLocker Identifier')).value === '' && (await control('Recovery Key/PIN')).value === '',
    'switching away from a Laptop drops the BitLocker values',
  );
  await pressInPanel(`Clear catalog item ${laptopName}`);
  await pick('Catalog Item', monitorName, monitorName);

  const priceAt = await cdp.evaluate(() => {
    const input = document.getElementById([...document.querySelectorAll('dialog[open] label')].find((l) => l.textContent.trim() === 'Price').htmlFor);
    input.scrollIntoView({ block: 'center' });
    const r = input.getBoundingClientRect();
    return { x: r.left + r.width - 20, y: r.top + r.height / 2 };
  });
  const priceNow = () => cdp.evaluate(() => ({ value: document.activeElement.value, caret: document.activeElement.selectionStart }));
  const typeKeys = async (text) => {
    for (const ch of text) await cdp.send('Input.insertText', { text: ch });
  };
  await clickAt(priceAt);
  await typeKeys('58000');
  check((await priceNow()).value === '58,000', 'Price groups thousands as it is typed');
  await cdp.evaluate(() => document.activeElement.setSelectionRange(1, 1));
  await typeKeys('1');
  const mid = await priceNow();
  check(mid.value === '518,000' && mid.caret === 2, 'typing mid-number keeps the caret after the typed digit', JSON.stringify(mid));
  await cdp.evaluate(() => document.activeElement.setSelectionRange(7, 7));
  await typeKeys('x');
  check((await priceNow()).value === '518,000', 'letters are dropped');
  await typeKeys('.505');
  check((await priceNow()).value === '518,000.50', 'at most two decimals are kept');
  await cdp.evaluate(() => document.activeElement.blur());
  await fill('Price', '1250');
  await clickAt(priceAt);
  await cdp.evaluate(() => document.activeElement.blur());
  check((await control('Price')).value === '1,250.00', 'leaving the field pads it to two decimals');
  await fill('Price', '1250.');
  await clickAt(priceAt);
  await cdp.evaluate(() => document.activeElement.blur());
  check((await control('Price')).value === '1,250.00', 'a trailing point is read as a whole price and padded');
  await fill('Price', '1250.5');
  await fill('Serial Number', 'DEMO-CHECK-0001');

  await cdp.evaluate(() =>
    window.__osrs.inventory.refuseNext({
      type: 'validation-error',
      title: 'Your request is not valid.',
      status: 400,
      errors: [{ pointer: '#/serialNumber', detail: 'The server refused this serial' }],
    }),
  );
  await pressInPanel('Save Changes');
  await until(() => document.querySelector('dialog[open]').textContent.includes('The server refused this serial'));
  check((await control('Serial Number')).message === 'The server refused this serial', 'a 400 problem lands under the pointed field');
  check((await control('Serial Number')).value === 'DEMO-CHECK-0001', 'the panel keeps every value on refusal');

  await fill('Serial Number', laptop.serialNumber);
  await pressInPanel('Save Changes');
  check(
    await until((s) => document.querySelector('dialog[open] [role="alert"]')?.textContent.includes(`Serial numbers already in use: ${s}.`), laptop.serialNumber),
    'a serial already in the register shows the 409 message',
  );

  const monitorCebu = await counts('asset-2', 'Cebu');
  await fill('Serial Number', 'DEMO-CHECK-0001');
  check(await save(), 'a valid unit saves and the panel closes');
  check((await register()).units.find((u) => u.serialNumber === 'DEMO-CHECK-0001')?.price === 1250.5, 'the price is saved as the number 1250.5');
  check(same(delta(monitorCebu, await counts('asset-2', 'Cebu')), { available: 1, reserved: 0, total: 1, assigned: 0, inactive: 0 }), 'Available and Total at Cebu rise by 1');
  await until(() => document.querySelector('[data-unit]')?.children[3].textContent.trim() === 'DEMO-CHECK-0001');
  check((await rowCells())[0]?.[3] === 'DEMO-CHECK-0001', 'the new unit leads the list');
  check((await focused()).label === '' && (await cdp.evaluate(() => document.activeElement?.getAttribute('aria-haspopup'))) === 'menu', 'focus returns to + Add Inventory');

  // ---- T035: Review/Edit ----------------------------------------------------

  console.log('\nReview/Edit (US3, FR-007, FR-012, FR-016)');
  await go('/inventory');
  await rowsReady();
  const office = laptop.location;
  const otherOffice = ['Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao'].find((o) => o !== office);
  const base = await counts('asset-1', office);
  const moved = async (want, label) => check(same(delta(base, await counts('asset-1', office)), want), label, JSON.stringify(delta(base, await counts('asset-1', office))));
  const zero = { available: 0, reserved: 0, total: 0, assigned: 0, inactive: 0 };

  check(await openUnit(laptop), 'Review opens the unit');
  check((await panelTitle()) === laptopName, 'the header is the item name');
  check((await panelText()).includes('Available'), 'with the unit pill');
  check(await cdp.evaluate(() => !document.querySelector('dialog[open] input[placeholder="Search catalog item name or code"]')), 'the catalog item is not editable');
  check((await control('Serial Number')).value === laptop.serialNumber && (await control('Purchase Request')).value === laptop.pr, 'the fields are prefilled');
  check(same(await selectOptions('Status'), ['Available', 'Assigned', 'Inactive']), 'Status offers Available · Assigned · Inactive');
  const bl = await control('BitLocker Identifier');
  check(bl.masked === 'disc' && bl.type === 'text', 'the BitLocker identifier is masked on a text input');
  check(await cdp.evaluate(() => !document.querySelector('input[type="password"]')), 'no password input anywhere');
  await pressInPanel('Show BitLocker Identifier');
  const blShown = await control('BitLocker Identifier');
  check(blShown.masked === 'none' && blShown.value === laptop.bitlockerIdentifier, 'Show reveals the stored value');
  check(await cdp.evaluate(() => document.querySelector('dialog[open] [aria-label="Hide BitLocker Identifier"]')?.getAttribute('aria-pressed') === 'true'), 'the toggle is pressed');

  await chooseSelect('Status', 'Inactive');
  check(await save(), 'inactivating saves');
  await moved({ ...zero, available: -1, total: -1, inactive: 1 }, 'Available → Inactive: Available and Total −1');
  check((await focused()).label.startsWith('Review'), "focus returns to the row's Review");

  await openUnit(laptop);
  await chooseSelect('Status', 'Available');
  await save();
  await moved(zero, 'Inactive → Available restores them');

  await openUnit(laptop);
  await pick('User', 'Maya', 'Maya Santos');
  check((await selectValue('Status')).text === 'Assigned', 'picking a User sets Assigned');
  await save();
  await moved({ ...zero, available: -1, total: -1, assigned: 1 }, 'assigning: Available and Total −1, Assigned +1');

  await openUnit(laptop);
  await chooseSelect('Status', 'Inactive');
  check((await control('User')).value === '', 'leaving Assigned clears the User');
  await save();
  await moved({ ...zero, available: -1, total: -1, inactive: 1 }, 'Assigned → Inactive moves nothing in Total');

  await openUnit(laptop);
  await pick('User', 'Paolo', 'Paolo Garcia');
  await save();
  await moved({ ...zero, available: -1, total: -1, assigned: 1 }, 'Inactive → Assigned moves nothing in Total');

  await openUnit(laptop);
  await chooseSelect('Status', 'Available');
  await save();
  await moved(zero, 'unassigning: Available and Total +1');

  const otherBase = await counts('asset-1', otherOffice);
  await openUnit(laptop);
  await chooseSelect('Office', otherOffice);
  await save();
  await moved({ ...zero, available: -1, total: -1 }, `an office move leaves ${office}`);
  check(same(delta(otherBase, await counts('asset-1', otherOffice)), { ...zero, available: 1, total: 1 }), `and arrives at ${otherOffice}`);

  const reserved = seed.find((u) => u.status === 'Reserved' && u.serialNumber);
  await openUnit(reserved);
  check((await selectValue('Status'))?.disabled && (await selectValue('Status')).text === 'Reserved', 'a Reserved unit shows Status read-only');
  check((await control('User')).disabled && (await selectValue('Office')).disabled, 'and User and Office read-only');
  check((await panelText()).includes('This unit can’t be removed because it is reserved for a request.'), 'with the reserved refusal instead of Remove Unit');
  check(!(await hasButton('Remove Unit')), 'and no Remove Unit');
  await fill('Supplier', 'Check Supplier Co');
  check(await save(), 'its other details still save');
  const reservedAfter = (await register()).units.find((u) => u.id === reserved.id);
  check(reservedAfter.supplier === 'Check Supplier Co' && reservedAfter.status === 'Reserved', 'the supplier changed and it is still Reserved');

  const assigned = seed.find((u) => u.status === 'Assigned' && u.serialNumber);
  await openUnit(assigned);
  check((await panelText()).includes('This unit can’t be removed because it is assigned to a user.'), 'an Assigned unit shows the drawn refusal');
  check(!(await hasButton('Remove Unit')), 'and no Remove Unit');
  check(await cdp.evaluate(() => !document.querySelector('dialog[open] [data-secret]')) || assigned.assetId === 'asset-1', 'secrets only on a Laptop');
  await pressInPanel('Cancel');
  await panelClosed();

  const serialLess = seed.find((u) => u.assetId === 'asset-2' && !u.serialNumber);
  check(await openUnit(serialLess), 'the seeded serial-less Monitor opens');
  check(await cdp.evaluate(() => !document.querySelector('dialog[open] [data-secret]')), 'a Monitor shows no secrets');
  await pressInPanel('Save Changes');
  await wait(150);
  check((await control('Serial Number')).message === 'Enter the serial number', 'it cannot be saved without a serial');
  await fill('Serial Number', 'DEMO-CHECK-MON-1');
  check(await save(), 'and saves once filled');

  // ---- T035: Remove Unit ----------------------------------------------------

  console.log('\nRemove Unit (US4, FR-009)');
  const inactive = seed.find((u) => u.status === 'Inactive');
  await openUnit(inactive);
  check(await pressInPanel('Remove Unit'), 'an Inactive unit offers Remove Unit');
  check((await control('Reason for removal')) !== null && (await hasButton('Confirm Removal')), 'removing mode asks for a reason, with Confirm Removal');
  await pressInPanel('Confirm Removal');
  await wait(150);
  check((await control('Reason for removal')).message === 'Enter a reason for removal', 'an empty reason is refused under the field');
  await pressInPanel('Cancel');
  check((await control('Reason for removal')) === null && (await hasButton('Save Changes')), 'Cancel returns to edit');
  await pressInPanel('Remove Unit');
  await fill('Reason for removal', 'Damaged beyond repair');
  await pressInPanel('Confirm Removal');
  check(await panelClosed(), 'Confirm removes it and closes the panel');
  const afterRemoval = await register();
  check(!afterRemoval.units.some((u) => u.id === inactive.id), 'the unit is gone from the register');
  check(afterRemoval.removals.some((r) => r.id === inactive.id && r.reason === 'Damaged beyond repair'), 'with its reason recorded');
  await wait(200);
  check((await focused()).label === 'Inventory table', 'focus goes to the table');

  // ---- T035: concurrent changes ---------------------------------------------

  console.log('\nConcurrent changes (spec edge cases, plan P16)');
  const [behindA, behindB] = seed.filter((u) => u.status === 'Available' && u.serialNumber && u.assetId !== 'asset-1' && u.assetId !== 'asset-2');
  await openUnit(behindA);
  await cdp.evaluate((id) => window.__osrs.inventory.reserveBehind(id), behindA.id);
  await fill('Supplier', 'Edited while reserved');
  await pressInPanel('Save Changes');
  check(
    await until(() => document.querySelector('dialog[open] [role="alert"]')?.textContent.includes('This unit was reserved by a request. Reload to see its current status.')),
    'a unit reserved behind the panel shows the message',
  );
  check((await control('Supplier')).value === 'Edited while reserved', 'and the edits are kept');
  await pressInPanel('Cancel');
  await panelClosed();

  await openUnit(behindB);
  await cdp.evaluate((id) => window.__osrs.inventory.removeBehind(id), behindB.id);
  await pressInPanel('Save Changes');
  check(await until(() => document.querySelector('dialog[open]')?.textContent.includes('This unit is no longer in the register')), 'a unit removed behind the panel says so');
  check((await panelText()).includes(`Inventory item with ID '${behindB.id}' could not be found.`), "with the source's message");
  await pressInPanel('Close');
  check(await panelClosed(), 'Close closes the panel');
  check(await until((id) => !document.querySelector(`[data-unit="${id}"]`), behindB.id), 'and the list no longer has it');

  // ---- T039: Add Multiple Units ---------------------------------------------

  console.log('\nAdd Multiple Units (US5, FR-010, FR-011, FR-011a)');
  await go('/inventory');
  await rowsReady();
  const rows = () => cdp.evaluate(() => document.querySelectorAll('dialog[open] [role="group"][aria-label^="Unit "]').length);
  const counter = () => cdp.evaluate(() => Number(document.querySelector('dialog[open] output')?.textContent));
  const saveDisabled = () => cdp.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === 'Save Changes').disabled);
  const rowError = (n) =>
    cdp.evaluate((n) => {
      const g = document.querySelector(`dialog[open] [role="group"][aria-label="Unit ${n}"] input`);
      const id = g?.getAttribute('aria-describedby');
      return id ? document.getElementById(id)?.textContent.trim() : '';
    }, n);

  await openMenu('Add Multiple Units');
  await panelOpen();
  check((await panelTitle()) === 'Add Multiple Units', 'the menu opens Add Multiple Units');
  check((await cdp.evaluate(() => document.querySelector('dialog[open]').getBoundingClientRect().width)) === 650, 'at 650px');
  check((await rows()) === 1 && (await counter()) === 1, 'it opens with one row');
  await pressInPanel('Add a unit');
  await pressInPanel('Add a unit');
  check((await rows()) === 3 && (await counter()) === 3, '+ adds a row');
  await pressInPanel('Remove the last unit');
  check((await rows()) === 2 && (await counter()) === 2, '− drops the last row');
  await pressFocused('Remove unit 1');
  check((await rows()) === 1 && (await counter()) === 1, "a row's ✕ drops that row");
  check(await until(() => document.activeElement?.getAttribute('aria-label') === 'Remove unit 1'), "focus moves to the next row's ✕");
  await pressInPanel('Add a unit');
  await pressFocused('Remove unit 2');
  check(await until(() => document.activeElement?.getAttribute('aria-label') === 'Remove unit 1'), "removing the last row moves focus to the row above's ✕");
  await pressFocused('Remove unit 1');
  check(await until(() => document.activeElement?.textContent.trim() === '+ Add another unit'), 'removing the only row moves focus to + Add another unit');
  await pressInPanel('Add a unit');
  await pressFocused('Remove the last unit');
  check((await rows()) === 0 && (await saveDisabled()), 'Save is disabled at 0');
  check(await until(() => document.activeElement?.getAttribute('aria-label') === 'Add a unit'), '− disabling itself at 0 moves focus to +');
  await cdp.evaluate(() => {
    const plus = document.querySelector('dialog[open] button[aria-label="Add a unit"]');
    for (let i = 0; i < 105; i++) plus.click();
  });
  await wait(200);
  check((await rows()) === 100, 'rows stop at 100');
  check(
    await cdp.evaluate(() => {
      const buttons = [...document.querySelectorAll('dialog[open] button')];
      return buttons.find((b) => b.getAttribute('aria-label') === 'Add a unit').disabled && buttons.find((b) => b.textContent.trim() === '+ Add another unit').disabled;
    }),
    '+ and + Add another unit are disabled at 100',
  );
  await pressInPanel('Remove the last unit');
  await pressFocused('Add a unit');
  check(await until(() => document.activeElement?.getAttribute('aria-label') === 'Remove the last unit'), '+ disabling itself at 100 moves focus to −');
  await pressInPanel('Cancel');
  await panelClosed();

  const before = (await register()).units.length;
  await openMenu('Add Multiple Units');
  await panelOpen();
  await pick('Catalog Item', laptopName, laptopName);
  await pressInPanel('+ Add another unit');
  await fill('Serial Number', 'DEMO-BULK-L1', 0);
  await fill('Serial Number', 'DEMO-BULK-L2', 1);
  await fill('BitLocker Identifier', 'CHECK-BULK-BL', 0);
  await pressInPanel(`Clear catalog item ${laptopName}`);
  await pick('Catalog Item', monitorName, monitorName);
  await pressInPanel(`Clear catalog item ${monitorName}`);
  await pick('Catalog Item', laptopName, laptopName);
  check(
    (await control('Serial Number', 0)).value === 'DEMO-BULK-L1' && (await control('BitLocker Identifier', 0)).value === '',
    'a category switch keeps serials and drops BitLocker values',
  );
  await pressInPanel(`Clear catalog item ${laptopName}`);
  await pick('Catalog Item', monitorName, monitorName);

  await pressInPanel('+ Add another unit');
  await fill('Serial Number', 'DEMO-BULK-1', 0);
  await fill('Serial Number', 'DEMO-BULK-1', 1);
  await fill('Serial Number', 'DEMO-BULK-3', 2);
  await pressInPanel('Save Changes');
  await wait(200);
  check(
    (await rowError(1)) === 'This serial number is repeated in the batch' && (await rowError(2)) === 'This serial number is repeated in the batch',
    'a duplicate serial is flagged under both rows',
  );
  check((await register()).units.length === before, 'and nothing is created');

  await fill('Serial Number', laptop.serialNumber, 1);
  await pressInPanel('Save Changes');
  check(
    await until((s) => document.querySelector('dialog[open]').textContent.includes(`Serial numbers already in use: ${s}.`), laptop.serialNumber),
    'a 409 after a row message shows the conflict',
  );
  check((await rowError(1)) === '', 'and a valid resubmit clears the earlier row message');

  await fill('Serial Number', '', 1);
  await pressInPanel('Save Changes');
  await wait(200);
  check((await rowError(2)) === 'Enter the serial number', 'one invalid row is flagged under that row');
  check((await register()).units.length === before, 'and nothing is created');
  await pressInPanel(`Clear catalog item ${monitorName}`);
  await pick('Catalog Item', monitorName, monitorName);
  check((await rowError(2)) === '', 'changing the catalog item clears the row messages');

  await fill('Serial Number', laptop.serialNumber, 1);
  await pressInPanel('Save Changes');
  check(
    await until((s) => document.querySelector('dialog[open]').textContent.includes(`Serial numbers already in use: ${s}.`), laptop.serialNumber),
    'a serial already in the register shows the 409 message',
  );
  check((await register()).units.length === before, 'and nothing is created');

  await fill('Serial Number', 'DEMO-BULK-2', 1);
  await cdp.evaluate(() =>
    window.__osrs.inventory.refuseNext({
      type: 'validation-error',
      title: 'Your request is not valid.',
      status: 400,
      errors: [{ pointer: '#/units/2/serialNumber', detail: 'The server refused row three' }],
    }),
  );
  await pressInPanel('Save Changes');
  await until(() => document.querySelector('dialog[open]').textContent.includes('The server refused row three'));
  check((await rowError(3)) === 'The server refused row three', 'a 400 pointing at #/units/2/serialNumber lands under row 3');

  const cebu = await counts('asset-2', 'Cebu');
  await fill('Serial Number', 'DEMO-BULK-3B', 2);
  check(await save(), 'three valid units save and the panel closes');
  check(same(delta(cebu, await counts('asset-2', 'Cebu')), { ...zero, available: 3, total: 3 }), 'Available and Total at Cebu rise by 3');
  check((await register()).units.length === before + 3, 'all three are in the register');
  check((await cdp.evaluate(() => document.activeElement?.getAttribute('aria-haspopup'))) === 'menu', 'focus returns to + Add Inventory');

  await cdp.evaluate(() => [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Assets').click());
  await until(() => location.pathname === '/assets' && document.querySelectorAll('[aria-label="Assets table"] button').length > 0, undefined, 8000);
  const monitorRow = await cdp.evaluate(
    (name) => {
      const b = [...document.querySelectorAll('[aria-label="Assets table"] button')].find((b) => b.textContent.trim() === name);
      return b ? [...b.closest('div.relative').children].map((c) => c.textContent.trim()) : null;
    },
    monitorName,
  );
  check(Number(monitorRow?.[3]) === sum(BASELINE['asset-2'][0]) + 3, "and on Assets' AVAILABLE UNITS", JSON.stringify(monitorRow));

  // ---- T035: nothing secret leaked -----------------------------------------

  console.log('\nSecrets stay in the panel (FR-012, constitution VIII)');
  check(!urls.some((u) => secrets.some((s) => u.includes(s))) && urls.every((u) => new URL(u).search === ''), 'no URL carries a secret or panel state');
  const logged = cdp.events
    .filter((e) => e.method === 'Runtime.consoleAPICalled' || e.method === 'Runtime.exceptionThrown')
    .map((e) => JSON.stringify(e.params));
  check(!logged.some((l) => secrets.some((s) => l.includes(s)) || l.includes('CHECK-BL-1') || l.includes('CHECK-RK-1')), 'no secret reached the console', `${logged.length} console entries`);
  const consoleCalls = readdirSync('src/features/inventory', { recursive: true })
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => /\bconsole\./.test(readFileSync(`src/features/inventory/${f}`, 'utf8')));
  check(consoleCalls.length === 0, 'no console call anywhere in src/features/inventory/', consoleCalls.join(', '));
} catch (error) {
  check(false, 'the gate ran to the end', error instanceof Error ? error.message : String(error));
}

console.log(`\n${failures} failure(s)`);
await cdp.close();
process.exit(failures ? 1 : 0);
