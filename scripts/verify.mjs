/** Every gate in one place — spec 002's design-system checks, the BEN-157
 *  session, spec 017's API screen sources, and the build.
 *
 *  The browser checks that drove the seeded data were retired with it (spec
 *  017, Session 2026-10-03 second). An end-to-end run against the live API is
 *  spec 001 T026 (Playwright).
 *
 *  Order matters: `check-build` scans `dist/`, so it runs after `build`. The
 *  fidelity and pixel gates need `npm run dev` (headless Chrome is started for
 *  you); set OSRS_DEV_ORIGIN when the dev server is not on 5173. */
import { spawnSync } from 'node:child_process';
const steps = [
  ['typecheck', 'npx', ['tsc', '-b', '--force']],
  ['lint', 'npm', ['run', 'lint']],
  ['utilities + adherence', 'node', ['scripts/check-utilities.mjs']],
  ['fidelity (FR-005a)', 'node', ['scripts/compare-fidelity.mjs']],
  ['pixels (FR-005a)', 'node', ['scripts/compare-pixels.mjs']],
  ['api session (BEN-157)', 'node', ['scripts/check-api-session.mjs']],
  ['api screens (spec 017)', 'node', ['scripts/check-api-screens.mjs']],
  ['build', 'npm', ['run', 'build']],
  ['build: no seeded data + SPA fallback (spec 017 SC-001)', 'node', ['scripts/check-build.mjs']],
];
let failed = 0;
for (const [name, cmd, args] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log((r.stdout + r.stderr).split('\n').filter(Boolean).slice(-12).map((l) => '      ' + l).join('\n'));
}
console.log(failed ? `\n${failed} gate(s) failed` : '\nall gates pass');
process.exit(failed ? 1 : 0);
