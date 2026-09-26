/** Every gate in one place — spec 002's design-system checks, spec 003's
 *  application-shell checks, spec 004's Requests Queue checks, spec 005's
 *  Catalog checks, spec 006's Profile checks, spec 007's request panel
 *  (BEN-45) and spec 008's Request List (BEN-43). Order matters:
 *  `check-profile-build` scans `dist/`, so it runs after `build`. Needs
 *  `npm run dev`; headless Chrome is started for you. Set OSRS_DEV_ORIGIN when the dev server took a port other than
 *  5173 (a worktree usually does). */
import { spawnSync } from 'node:child_process';
const steps = [
  ['typecheck', 'npx', ['tsc', '-b', '--force']],
  ['lint', 'npm', ['run', 'lint']],
  ['utilities + adherence', 'node', ['scripts/check-utilities.mjs']],
  ['fidelity (FR-005a)', 'node', ['scripts/compare-fidelity.mjs']],
  ['pixels (FR-005a)', 'node', ['scripts/compare-pixels.mjs']],
  ['a11y + responsive', 'node', ['scripts/check-a11y-responsive.mjs']],
  ['shell routing + guards', 'node', ['scripts/check-shell.mjs']],
  ['requests queue (spec 004)', 'node', ['scripts/check-queue.mjs']],
  ['catalog (spec 005)', 'node', ['scripts/check-catalog.mjs']],
  ['profile (spec 006)', 'node', ['scripts/check-profile.mjs']],
  ['request panel (BEN-45)', 'node', ['scripts/check-request-detail.mjs']],
  ['request list + submit (spec 008)', 'node', ['scripts/check-request-list.mjs']],
  ['build', 'npm', ['run', 'build']],
  ['profile build: lazy stub + SPA fallback (FR-010)', 'node', ['scripts/check-profile-build.mjs']],
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
