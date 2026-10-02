/** BEN-157 — the session switch stays seeded until an API base is configured,
 *  and the client does not grow the routes later issues own.
 *
 *  Needs `npm run dev` with `VITE_API_BASE_URL` unset, and headless Chrome
 *  (started by cdp.mjs). Set OSRS_DEV_ORIGIN when the dev server is not on 5173. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './cdp.mjs';
import { problemMessage } from '../src/shared/api/problem.ts';
import { notifiesSessionEnded, sessionFailure, SESSION_ENDING_WRITES } from '../src/shared/api/session-failure.ts';

const ORIGIN = process.env.OSRS_DEV_ORIGIN ?? 'http://localhost:5173';
const root = fileURLToPath(new URL('..', import.meta.url));

let failures = 0;
const fail = (m) => {
  failures++;
  console.log(`  ✗ ${m}`);
};
const pass = (m) => console.log(`  ✓ ${m}`);
const check = (ok, m, detail = '') => (ok ? pass(m) : fail(`${m}${detail ? ` — ${detail}` : ''}`));

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** The brace-matched body of `signature` in `source`. */
function methodBody(source, signature) {
  const start = source.indexOf(signature);
  const open = start < 0 ? -1 : source.indexOf('{', start);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return '';
}

const GOOGLE_CLIENT_ID = /\d-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com/;

/** `.env` is gitignored and may hold the id. Everywhere else must not. */
function googleClientIdHits(dir) {
  const hits = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
      if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) continue;
      const path = join(current, name);
      const info = statSync(path);
      if (info.isDirectory()) {
        walk(path);
        continue;
      }
      if (!info.isFile() || info.size > 1_000_000) continue;
      if (GOOGLE_CLIENT_ID.test(readFileSync(path, 'utf8'))) hits.push(path);
    }
  };
  walk(dir);
  return hits;
}

console.log('\nSeeded screens stay on their seeded sources');
const seeded = [
  ['../src/features/catalog/CatalogPage.tsx', 'seededCatalogSource'],
  ['../src/features/requests/detail/employee-request-source.ts', 'seededEmployeeRequestSource'],
  ['../src/features/requests/queue/admin-request-source.ts', 'seededAdminRequestSource'],
  ['../src/features/requests/history/history-source.ts', 'createSeededAdminRequestSource'],
  ['../src/features/assets/asset-store.ts', 'seededAssetSource'],
  ['../src/features/inventory/inventory-source.ts', 'createSeededInventorySource'],
  ['../src/features/profile/assigned-source-registry.ts', 'if (!mode) return null'],
];
for (const [file, needle] of seeded) {
  check(read(file).includes(needle), `${file.split('/').pop()} still uses ${needle}`);
}

console.log('\nThe switch and the client');
const app = read('../src/app/App.tsx');
const sessionSource = read('../src/features/auth/session-source.ts');
const apiSource = read('../src/features/auth/api-session-source.ts');
const client = read('../src/shared/api/client.ts');
const layout = read('../src/app/AppLayout.tsx');
const contract = read('../specs/001-office-supplies-mvp/contracts/README.md');

check(app.includes('selectSessionSource()'), 'the app root passes selectSessionSource()');
check(sessionSource.includes('apiConfigured() ? apiSessionSource : seededSessionSource'), 'a blank base keeps the seeded source');
check(client.includes("credentials: 'include'"), "the client sends credentials: 'include'");
check(client.includes('__OSRS_NETLIFY__'), 'a Netlify build calls /auth on its own host');
check(read('../vite.config.ts').includes('/auth/:splat'), 'the Netlify build proxies /auth to the configured base');
check((client.match(/fetch\(/g) ?? []).length === 1, 'the client issues each call once');
check(!/localStorage|sessionStorage/.test(client), 'the client writes no browser storage');
check(apiSource.includes("'/auth/me'") && apiSource.includes("'/auth/google'") && apiSource.includes("'/auth/logout'"), 'the API source names the three auth calls');
check(!/localStorage|sessionStorage|osrs\.demo\.sessions|osrs\.demo\.account/.test(apiSource), 'the API source does not read the seeded storage keys');
check(
  apiSource.includes("const CHANNEL = 'osrs.session'") && apiSource.includes('new BroadcastChannel(CHANNEL)'),
  'other tabs wake on a channel that is not a stored session',
);
check(!/user:|role:/.test(apiSource.slice(apiSource.indexOf('postMessage'))), 'the channel message carries no user and no role');
check(
  layout.includes('user.name?.trim() ? user.name : ROLE_LABEL[role]') && layout.includes("user.name?.trim() ? user.initials : ''"),
  'a missing name shows the role label and no invented initials',
);
const login = read('../src/features/auth/LoginScreen.tsx');
const googleIdentity = read('../src/features/auth/google-identity.ts');
check(
  apiSource.includes('import.meta.env.VITE_GOOGLE_CLIENT_ID') && !apiSource.includes('apps.googleusercontent.com'),
  'the Google client id is read from the environment and is not written into source',
);
check(login.includes('hasGoogleButton') && login.includes('GoogleSignInOverlay'), "API sign-in lays Google's button over the drawn control");
check(googleIdentity.includes('renderButton') && !googleIdentity.includes('.prompt('), 'sign-in uses Google\'s button, not One Tap');
const overlay = read('../src/features/auth/GoogleSignInOverlay.tsx');
check(!/opacity:\s*0(?:\s|;|$)/.test(overlay), 'an ancestor of the Google button is not fully transparent');
check(overlay.includes('zoom'), 'the Google frame is zoomed to the pill instead of stretched with a transform');
check(!overlay.includes('scaleY'), 'the Google button is not scaled, or a public origin stops accepting clicks after a few seconds');
check(!overlay.includes('onPress'), 'the overlay does not start sign-in before Google opens the account chooser');
check(
  login.includes('pointer-events-none absolute inset-0 z-20'),
  'the drawn pill paints over the Google frame and does not take the click',
);
check(contract.includes('VITE_GOOGLE_CLIENT_ID'), 'the contract note records the frontend client id variable');
const leakedClientIds = googleClientIdHits(root);
check(leakedClientIds.length === 0, 'the Google client id is not written into the tree', leakedClientIds.join(', '));

const writes = SESSION_ENDING_WRITES.map((entry) => `${entry.method} ${entry.path}`);
check(
  JSON.stringify(writes) === JSON.stringify(['POST /requests', 'POST /requests/:id/receive', 'POST /requests/:id/sign']),
  'session-ending writes are exactly the three published paths',
  writes.join(', '),
);
check(sessionFailure(401, 'GET', '/auth/me') === 'sign-in', 'a 401 ends the session');
check(sessionFailure(401, 'POST', '/requests') === 'sign-in', 'a 401 on submit ends the session');
check(sessionFailure(403, 'POST', '/auth/google') === 'sign-in', 'a 403 on sign-in is a refusal');
check(sessionFailure(403, 'GET', '/auth/me') === 'sign-in', 'a 403 on the current user is a refusal');
check(sessionFailure(403, 'POST', '/requests/abc/receive') === 'sign-in', 'a 403 on receive ends the session');
check(sessionFailure(403, 'POST', '/requests/abc/sign') === 'sign-in', 'a 403 on sign ends the session');
check(sessionFailure(403, 'GET', '/requests') === 'error', 'any other 403 is the problem, not a retry');
check(sessionFailure(500, 'GET', '/auth/me') === 'none', 'other statuses are not treated as a session failure');
check(notifiesSessionEnded('POST', '/requests/abc/sign') === true, 'a forbidden sign wakes the session boundary');
check(notifiesSessionEnded('POST', '/auth/logout') === false, 'logout does not wake the session boundary again');
check(notifiesSessionEnded('GET', '/auth/me') === false, 'the current-user read does not wake itself');
check(
  /onSessionEnded\(\(\) => \{[\s\S]*signOut\(\)/.test(apiSource),
  'a session-ending response signs out before the shell re-reads the current user',
);
const signOutBody = methodBody(apiSource, 'async signOut()');
const logoutAt = signOutBody.indexOf("await apiRequest('/auth/logout'");
const latchAt = signOutBody.indexOf('signedOutLocally = true');
const wakeAt = signOutBody.indexOf('wake()');
check(
  logoutAt >= 0 && latchAt > logoutAt && wakeAt > latchAt,
  'signOut latches and wakes only after logout resolves',
);
check(
  /signOut\(\)\.catch\([\s\S]*console\.warn\(/.test(apiSource),
  'a failed forced logout is logged in development',
);
const refusalFallback = 'Sign-in did not succeed. Please try again.';
check(
  problemMessage(
    {
      title: 'The Google account is unverified, outside the configured Workspace, or disabled.',
      detail: 'Forbidden',
    },
    refusalFallback,
  ) === 'The Google account is unverified, outside the configured Workspace, or disabled.',
  'a Forbidden detail shows the published title',
);
check(
  problemMessage(
    {
      title: 'The Google ID token is invalid or is missing identity information.',
      detail: 'Unauthorized',
    },
    refusalFallback,
  ) === 'The Google ID token is invalid or is missing identity information.',
  'an Unauthorized detail shows the published title',
);
check(
  problemMessage({ detail: 'This account is outside the company domain.' }, refusalFallback) ===
    'This account is outside the company domain.',
  'a specific detail is shown as written',
);
check(problemMessage({}, refusalFallback) === refusalFallback, 'a problem with neither detail nor title keeps the shell sentence');
check(
  client.includes('problemMessage(problem,'),
  'a sign-out failure uses the same sentence as sign-in',
);

console.log('\nDeferred routes stay out of the client, and maps follow the contract note');
const mapsFinal = contract.includes('Status and category maps are final');
const apiDir = join(root, 'src/shared/api');
const apiFiles = readdirSync(apiDir).filter((name) => name.endsWith('.ts'));
const forbidden = ['/inventory-items', "'/assets'", '"/assets"', '`/assets'];
for (const name of apiFiles) {
  if (name === 'session-failure.ts') continue;
  const text = readFileSync(join(apiDir, name), 'utf8');
  for (const needle of forbidden) {
    check(!text.includes(needle), `${name} does not call ${needle}`);
  }
  check(!text.includes('/requests/:id/receive'), `${name} does not add POST /requests/:id/receive`);
  check(!/localStorage|sessionStorage/.test(text), `${name} writes no browser storage`);
}
const index = read('../src/shared/api/index.ts');
check(!index.includes('/inventory-items') && !index.includes("'/assets'") && !index.includes('/receive'), 'the barrel does not export the deferred routes');
check(apiFiles.includes('maps.ts') === mapsFinal, 'maps.ts exists only when the contract note says the maps are final');
if (mapsFinal) {
  const maps = read('../src/shared/api/maps.ts');
  check(maps.includes('Wifi') && maps.includes('pending_approval') && maps.includes('cancelled'), 'the final maps include Wifi and the published statuses');
}

console.log('\nSeeded sign-in still lands on the role screens');
const cdp = await connect();
await cdp.setViewport(1440, 1024);

const go = async (path) => {
  await cdp.evaluate(() => {
    window.__stale = true;
  });
  await cdp.goto(`${ORIGIN}${path}`);
  await cdp.waitFor(() => !window.__stale, 10000, `a fresh document at ${path}`);
};

const waitForPath = (path) =>
  cdp.waitFor(new Function(`return location.pathname === ${JSON.stringify(path)}`), 8000, path);

async function signIn(account, landing) {
  await go('/login');
  await cdp.evaluate(() => localStorage.clear());
  await go('/login');
  const chooser = await cdp.evaluate(
    (id) => Boolean(document.querySelector(`input[value="${id}"]`)),
    account,
  );
  check(chooser, `the seeded chooser offers ${account}`);
  if (!chooser) return;
  await cdp.evaluate((id) => {
    document.querySelector(`input[value="${id}"]`).click();
  }, account);
  await cdp.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sign in with Google')).click();
  });
  await waitForPath(landing);
  const path = await cdp.evaluate(() => location.pathname);
  check(path === landing, `${account} lands on ${landing}`, `got ${path}`);
}

await signIn('maya.santos', '/catalog');
await signIn('ethan.cruz', '/queue');

console.log(`\n${failures} failure(s)`);
await cdp.close();
process.exit(failures ? 1 : 0);
