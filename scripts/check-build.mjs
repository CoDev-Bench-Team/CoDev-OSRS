/** Spec 017 SC-001 (as amended 2026-10-03) — the production build ships no
 *  seeded or mock data, and the host serves the SPA on every route.
 *
 *  Run after `npm run build` (verify.mjs orders it so). It fails when:
 *
 *  - `dist/` is missing or has no JavaScript (a pass would prove nothing);
 *  - any built file carries a marker of the retired seeded data: a demo
 *    account id, the demo storage keys, or a dev-stub query parameter;
 *  - `_redirects` did not reach `dist/`, so deep links 404 on Netlify. */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TEXT_ASSETS = new Set(['.css', '.html', '.js']);
const MARKERS = ['maya.santos', 'ethan.cruz', 'osrs.demo.', 'DEV_STUB_SENTINEL', 'Demo sign-in', 'seededSessionSource'];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

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
if (!files.some((file) => file.endsWith('.js'))) fail('No JavaScript found in dist/ — run `npm run build` first');

const hits = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const marker of MARKERS) if (text.includes(marker)) hits.push(`${relative(DIST, file)}: ${marker}`);
}
if (hits.length) fail(`The build carries seeded or mock data:\n${hits.map((h) => `  - ${h}`).join('\n')}`);

const redirects = await readFile(join(DIST, '_redirects'), 'utf8').catch(() => '');
if (!/^\/\*\s+\/index\.html\s+200\s*$/m.test(redirects)) {
  fail('dist/_redirects is missing the SPA fallback `/*  /index.html  200` — deep links would 404 on Netlify');
}

console.log(`Build is sound: ${files.length} files, no seeded or mock data, SPA fallback present`);
