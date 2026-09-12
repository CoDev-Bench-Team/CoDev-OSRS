/** Every spec 002 gate in one place. Needs `npm run dev` and headless Chrome:
 *    chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/p */
import { spawnSync } from 'node:child_process';
const steps = [
  ['typecheck', 'npx', ['tsc', '-b', '--force']],
  ['lint', 'npm', ['run', 'lint']],
  ['utilities + adherence', 'node', ['scripts/check-utilities.mjs']],
  ['fidelity (FR-005a)', 'node', ['scripts/compare-fidelity.mjs']],
  ['a11y + responsive', 'node', ['scripts/check-a11y-responsive.mjs']],
  ['build', 'npm', ['run', 'build']],
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
