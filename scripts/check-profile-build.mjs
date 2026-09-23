/** Spec 006 FR-010 — development-only Profile fixtures must not ship.
 *
 *  Run after `npm run build` (verify.mjs orders it so). The stub module exports
 *  `DEV_STUB_SENTINEL` and uses it; this gate reads that value from the stub's
 *  source rather than keeping its own copy, so renaming the stub's rows or
 *  messages cannot quietly blind it. If Vite ever stops removing the guarded
 *  dynamic import, the sentinel or the stub chunk's name appears in a
 *  generated text asset and this gate fails. */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const STUB = fileURLToPath(new URL('../src/features/profile/dev/assigned-stub.ts', import.meta.url));
const TEXT_ASSETS = new Set(['.css', '.html', '.js', '.map']);

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const sentinel = /export const DEV_STUB_SENTINEL = '([^']+)'/.exec(await readFile(STUB, 'utf8'))?.[1];
if (!sentinel) fail(`Could not read DEV_STUB_SENTINEL from ${relative(process.cwd(), STUB)}`);
// The sentinel catches the stub's code; the chunk name catches its file.
const markers = [sentinel, 'assigned-stub'];

async function generatedTextFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await generatedTextFiles(path)));
    else if (TEXT_ASSETS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

let files;
try {
  files = await generatedTextFiles(DIST);
} catch {
  fail('No dist/ directory — run `npm run build` first');
}
// A pass over a bundle with no JavaScript would prove nothing.
if (!files.some((file) => file.endsWith('.js'))) fail('No JavaScript found in dist/ — run `npm run build` first');

const leaks = [];
for (const file of files) {
  const contents = await readFile(file, 'utf8');
  const found = markers.filter((marker) => contents.includes(marker));
  if (found.length) leaks.push(`${relative(DIST, file)} (${found.join(', ')})`);
}

if (leaks.length) fail(`Profile development stub leaked into the production build:\n${leaks.map((f) => `  - ${f}`).join('\n')}`);

console.log(`Profile production bundle is clean: ${files.length} text assets scanned for ${markers.join(', ')}`);
