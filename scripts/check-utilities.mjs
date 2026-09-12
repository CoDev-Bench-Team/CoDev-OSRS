/** Fails if any Tailwind class used in src/ does not compile.
 *
 *  With Tailwind's default namespaces cleared (src/styles/theme.css), an
 *  unknown utility produces no CSS and no error — the element silently loses
 *  the style. This turns that into a build failure. */
import { compile } from 'tailwindcss';
import fs from 'node:fs/promises';
import path from 'node:path';

const read = (p) => fs.readFile(p, 'utf8');

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = await walk('src');

// Tailwind extracts class names statically, so a constructed name like
// `text-${size}` compiles to nothing and the element silently loses the style.
// The utility check below cannot see these, so catch them separately.
const UTILITY_PREFIX =
  /\b(?:text|bg|p|px|py|pt|pb|pl|pr|m|mx|my|w|h|gap|rounded|shadow|ring|border|font|leading|type|flex|grid)-\$\{/;
const dynamic = [];
for (const f of files) {
  const src = await read(f);
  for (const m of src.matchAll(/class(?:Name)?=\{`([^`]*)`\}/g)) {
    if (UTILITY_PREFIX.test(m[1])) dynamic.push([m[1].trim().slice(0, 60), f]);
  }
}
if (dynamic.length) {
  console.error(`\n${dynamic.length} CONSTRUCTED CLASS NAME(S) — Tailwind will not generate these:\n`);
  for (const [c, f] of dynamic) console.error(`  ${c.padEnd(60)} ${f}`);
  process.exit(1);
}

const used = new Map();
for (const f of files) {
  const src = await read(f);
  for (const m of src.matchAll(/class(?:Name)?=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    for (const raw of (m[1] ?? m[2]).split(/\s+/)) {
      const c = raw.replace(/\$\{[^}]*\}/g, '').trim();
      if (!c || c.includes('${') || c.includes('?')) continue;
      if (!used.has(c)) used.set(c, f);
    }
  }
}

const compiler = await compile(await read('src/styles/index.css'), {
  base: 'src/styles',
  loadStylesheet: async (id, base) => {
    if (id === 'tailwindcss') {
      const p = 'node_modules/tailwindcss/index.css';
      return { path: p, base: 'node_modules/tailwindcss', content: await read(p) };
    }
    const p = path.resolve(base, id);
    return { path: p, base: path.dirname(p), content: await read(p) };
  },
});

// Compare each candidate's output against the empty build. Pattern-matching
// the emitted CSS is unreliable: Tailwind escapes `:` and `/` in selectors, so
// a working variant like `focus-within:ring-brand` looks absent to a naive
// regex. If a name adds no rule, it compiles to nothing.
const names = [...used.keys()];
const baseline = compiler.build([]).length;
const bad = [];
for (const n of names) {
  if (compiler.build([n]).length <= baseline) bad.push([n, used.get(n)]);
}

// Token adherence (spec 002 FR-003). The design system ships these as oxlint
// `no-restricted-syntax` rules, which this oxlint version does not implement,
// so they run here instead.
//
// Raw hex is a hard failure: with the token layer in place there is never a
// reason for one. Arbitrary values are reported but not failed — a handful are
// legitimate fixed geometry the source states but never tokenises (the 436px
// card, the 180px media block). They are listed so the count cannot creep.
const hex = [];
const arbitrary = new Map();
for (const f of files) {
  if (f.includes('/styles/')) continue;
  const src = await read(f);
  for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) hex.push([m[0], f]);
  for (const m of src.matchAll(/\b[a-z-]+-\[[^\]]+\]/g)) {
    if (!arbitrary.has(m[0])) arbitrary.set(m[0], f);
  }
}

console.log(`checked ${names.length} distinct utilities across ${files.length} files`);
if (arbitrary.size) {
  console.log(`\n${arbitrary.size} arbitrary value(s) — fixed geometry from the source, not tokens:`);
  for (const [v, f] of arbitrary) console.log(`  ${v.padEnd(24)} ${f.replace('src/shared/ui/', '')}`);
}
if (hex.length) {
  console.error(`\n${hex.length} RAW HEX COLOUR(S) — use a token utility instead:\n`);
  for (const [v, f] of hex) console.error(`  ${v.padEnd(12)} ${f}`);
  process.exit(1);
}
if (bad.length) {
  console.error(`\n${bad.length} DO NOT COMPILE — these would silently do nothing:\n`);
  for (const [n, f] of bad) console.error(`  ${n.padEnd(34)} ${f}`);
  process.exit(1);
}
console.log('all utilities resolve');
