/** Spec 017 (BEN-154 Phase 2) — the screens' API sources, statically.
 *
 *  Seeded mode is covered by every other check, which runs unedited against a
 *  dev server with `VITE_API_BASE_URL` unset. This one reads the source tree:
 *  one definition per published route, nothing sent that the
 *  contract does not take, and no secret or user list where it must not be.
 *  The mapper fixtures (T003) extend it once the live field record exists. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
const check = (ok, m, detail = '') => {
  if (ok) console.log(`  ✓ ${m}`);
  else {
    failures++;
    console.log(`  ✗ ${m}${detail ? ` — ${detail}` : ''}`);
  }
};

function files(dir, keep) {
  const out = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (keep(name)) out.push(path);
    }
  };
  walk(join(root, dir));
  return out;
}
const read = (path) => readFileSync(path, 'utf8');
const rel = (path) => relative(root, path);

// `session-failure.ts` classifies paths for BEN-157 (`/requests/:id/sign`
// among them); it defines no operation.
const apiFiles = files('src/shared/api', (n) => n.endsWith('.ts') && n !== 'session-failure.ts');
const srcFiles = files('src', (n) => /\.(ts|tsx)$/.test(n));
const apiSources = srcFiles.filter((p) => /\/api-[^/]+\.ts$/.test(p) && p.includes('/features/') && !p.includes('/auth/'));

console.log('\nOne definition per published route (FR-003)');
const ROUTES = [
  ["'/assets'", 'listAssets / createAsset'],
  ['`/assets/${', 'getAsset / updateAsset'],
  ["'/requests'", 'createRequest'],
  ["withQuery('/requests'", 'listRequests'],
  ['`/requests/${', 'one request'],
  ['/cancel`', 'cancelRequest'],
  ['/receive`', 'receiveRequest'],
  ["'/requests/counts'", 'requestCounts'],
  ["'/requests/history'", 'requestHistory'],
  ["'/inventory-items'", 'listUnits / createUnit'],
  ["'/inventory-items/bulk'", 'createUnits'],
  ['`/inventory-items/${', 'one unit'],
  ["'/users'", 'listUsers'],
];
for (const [needle, what] of ROUTES) {
  const owners = apiFiles.filter((p) => read(p).includes(needle));
  check(owners.length === 1, `${what} is defined in one module`, owners.map(rel).join(', ') || 'none');
}
const outside = srcFiles.filter((p) => !p.includes('/shared/api/') && /\bfetch\(/.test(read(p)) && !p.includes('/auth/google'));
check(outside.length === 0, 'no screen calls fetch itself', outside.map(rel).join(', '));

console.log('\nSigning completes; there is no Admin complete (FR-023, FR-051; ADR-0013)');
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const apiText = apiFiles.map((p) => code(read(p))).join('\n');
check((apiText.match(/\/sign`/g) ?? []).length === 1, 'the shared client defines one sign operation');
const patchTargets = read(join(root, 'src/shared/api/requests.ts')).match(/UpdateRequestStatusBody =([\s\S]*?);\n/)?.[1] ?? '';
check(patchTargets.length > 0 && !patchTargets.includes('completed') && !patchTargets.includes('received'), 'PATCH targets exclude completed and received');
for (const p of apiSources) {
  const text = read(p);
  if (/canComplete/.test(text)) check(/canComplete: false/.test(text), `${rel(p)} offers no Admin complete`);
}

console.log('\nNothing sent that the contract does not take (plan D12)');
const requestsApi = read(join(root, 'src/shared/api/requests.ts'));
check(!/\bnotes\b|otherNotes/.test(requestsApi.replace(/\/\*[\s\S]*?\*\//g, '')), 'no notes field on any request body');
check(!/location|office/i.test(requestsApi.match(/CreateRequestBody = \{[\s\S]*?\};/)?.[0] ?? 'x'), 'submit carries no office');
const inventoryApi = read(join(root, 'src/shared/api/inventory.ts'));
check(!/location/.test(inventoryApi.match(/ListUnitsParams = \{[\s\S]*?\};/)?.[0] ?? 'location'), 'the unit list takes no office');
check(!/purchaseRequest|\bpr\b|attachmentFile/.test(inventoryApi.replace(/\/\*[\s\S]*?\*\//g, '')), 'no PR or attachment file is sent');
check(/deleteUnit\(id: string, reason: string\)[\s\S]*?body: \{ reason \}/.test(inventoryApi), 'unit removal sends the required reason (G2 closed 2026-10-03)');

console.log('\nSecrets and storage (FR-039, FR-048, FR-050)');
for (const p of apiSources) {
  const text = read(p);
  check(!/localStorage|sessionStorage|indexedDB/.test(text), `${rel(p)} writes no browser storage`);
  check(!/console\./.test(text), `${rel(p)} logs nothing`);
}
const secretReaders = srcFiles.filter(
  (p) => /bitlockerIdentifier|recoveryPin/.test(read(p)) && !p.includes('/shared/api/') && !p.includes('/inventory/'),
);
check(secretReaders.length === 0, 'BitLocker and recovery PIN are read only by Inventory', secretReaders.map(rel).join(', '));

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
