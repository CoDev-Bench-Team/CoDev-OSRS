/** Spec 006 FR-010 (second amendment) — the Profile demo stub ships, but only
 *  as its own lazy chunk, and the host serves the SPA on every route.
 *
 *  Run after `npm run build` (verify.mjs orders it so). The stub module exports
 *  `DEV_STUB_SENTINEL` and uses it; this gate reads that value from the stub's
 *  source rather than keeping its own copy, so renaming the stub's rows or
 *  messages cannot quietly blind it. It fails when:
 *
 *  - `dist/` is missing or has no JavaScript (a pass would prove nothing);
 *  - the sentinel is found in no chunk (the stub vanished, or the gate is blind);
 *  - the sentinel is found in any file other than the stub's own
 *    `assigned-stub-*.js` chunk — i.e. the stub was folded into the entry
 *    bundle and every visit would download it;
 *  - `_redirects` did not reach `dist/`, so deep links 404 on Netlify. */
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const STUB = fileURLToPath(new URL('../src/features/profile/dev/assigned-stub.ts', import.meta.url));
const TEXT_ASSETS = new Set(['.css', '.html', '.js']);
const STUB_CHUNK = /^assigned-stub-[\w-]+\.js$/;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const sentinel = /export const DEV_STUB_SENTINEL = '([^']+)'/.exec(await readFile(STUB, 'utf8'))?.[1];
if (!sentinel) fail(`Could not read DEV_STUB_SENTINEL from ${relative(process.cwd(), STUB)}`);

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

const carriers = [];
for (const file of files) {
  if ((await readFile(file, 'utf8')).includes(sentinel)) carriers.push(file);
}
if (!carriers.length) fail(`The Profile stub is in no chunk: nothing in dist/ carries ${sentinel}`);
const misplaced = carriers.filter((file) => !STUB_CHUNK.test(basename(file)));
if (misplaced.length) {
  fail(
    `The Profile stub was bundled outside its own lazy chunk, so every visit would download it:\n${misplaced
      .map((file) => `  - ${relative(DIST, file)}`)
      .join('\n')}`,
  );
}

const redirects = await readFile(join(DIST, '_redirects'), 'utf8').catch(() => '');
if (!/^\/\*\s+\/index\.html\s+200\s*$/m.test(redirects)) {
  fail('dist/_redirects is missing the SPA fallback `/*  /index.html  200` — deep links would 404 on Netlify');
}

console.log(
  `Profile build is sound: stub only in ${carriers.map((f) => relative(DIST, f)).join(', ')}; SPA fallback present`,
);
