/** FR-005a / SC-003: diff computed styles between the designer's components and
 *  the ported ones. Needs `npm run dev` running and headless Chrome on :9222.
 *
 *  Screenshots cannot catch a 500-weight that should be 700, or 11.5px rendered
 *  as 12px. Computed styles can. */
import { connect } from './cdp.mjs';

const BOX = ['backgroundColor', 'borderRadius', 'boxShadow', 'padding', 'height', 'width'];

/** Text present in the source that the port deliberately does not reproduce.
 *  Named per component with a reason, so a genuine missing element still fails. */
const ALLOWED_MISSING_TEXT = {
  SupplyCard: {
    '⌄': "the source draws the dropdown affordance as the text character U+2304, whose ink (15px) overflows its 12px line box, making its size and vertical position depend on line-box rounding. Replaced with MDI chevron-down at 20px, optically centred — the register the design system's readme prescribes for an icon the file does not define. Logged in additions.md.",
  },
};
const TEXT = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'textTransform'];

const cdp = await connect();
await cdp.setViewport(1440, 1024);
// The harness is lazy-loaded, so wait for the pairs themselves rather than
// for a first mount that happens before they exist.
await cdp.goto('http://localhost:5173/#compare', {
  ready: () => document.querySelectorAll('[data-cmp]').length >= 12,
});

const pairs = await cdp.evaluate((box, text) => {
  // Tailwind composes box-shadow from placeholder custom properties, which
  // emit visually inert zero-alpha layers. Drop them so a real shadow
  // difference is not buried in noise.
  const norm = (v) =>
    String(v)
      .replace(/\s+/g, ' ')
      .trim()
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter((s) => !/rgba\(0, 0, 0, 0\)\s+0px 0px 0px 0px/.test(s))
      .join(', ');
  const read = (el, props) => Object.fromEntries(props.map((p) => [p, norm(getComputedStyle(el)[p])]));
  const textNodes = (root) => {
    const out = [];
    for (const el of root.querySelectorAll('*')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim());
      if (own.length) out.push({ text: own.join(' ').slice(0, 40), style: read(el, text) });
    }
    return out;
  };
  const out = [];
  for (const group of document.querySelectorAll('[data-cmp]')) {
    const side = (s) => group.querySelector(`[data-side="${s}"]`);
    // The side's caption carries data-label. Matching on a class name is not
    // safe here: "text-11-5" contains "text-11", so the availability chip was
    // mistaken for a caption and silently excluded from the comparison.
    const rootOf = (s) => [...side(s).children].find((c) => !c.hasAttribute('data-label'));
    const a = rootOf('source');
    const b = rootOf('port');
    if (!a || !b) continue;
    out.push({
      name: group.dataset.cmp,
      sourceBox: read(a, box),
      portBox: read(b, box),
      sourceText: textNodes(a),
      portText: textNodes(b),
    });
  }
  return out;
}, BOX, TEXT);

const EXPECTED_PAIRS = 12;
if (pairs.length < EXPECTED_PAIRS) {
  console.error(
    `\nFAIL: found ${pairs.length} comparable pairs, expected ${EXPECTED_PAIRS}.\n` +
      'A comparison that silently tests nothing is worse than no comparison.\n' +
      'Check that the dev server is running and that /#compare mounts the harness.',
  );
  cdp.close();
  process.exit(1);
}

let diffs = 0;
let checked = 0;
const report = [];
for (const p of pairs) {
  const lines = [];
  for (const k of BOX) {
    checked++;
    if (p.sourceBox[k] !== p.portBox[k]) {
      diffs++;
      lines.push(`    ${k.padEnd(16)} source: ${p.sourceBox[k]}\n    ${''.padEnd(16)} port:   ${p.portBox[k]}`);
    }
  }
  for (const s of p.sourceText) {
    const match = p.portText.find((t) => t.text === s.text);
    if (!match) {
      const allowed = ALLOWED_MISSING_TEXT[p.name]?.[s.text];
      if (allowed) {
        lines.push(`    note: "${s.text}" intentionally absent — ${allowed}`);
        continue;
      }
      lines.push(`    text "${s.text}" — no matching element in the port`);
      diffs++;
      continue;
    }
    for (const k of TEXT) {
      checked++;
      if (s.style[k] !== match.style[k]) {
        diffs++;
        lines.push(`    "${s.text}" ${k}\n      source: ${s.style[k]}\n      port:   ${match.style[k]}`);
      }
    }
  }
  report.push({ name: p.name, lines });
}

for (const r of report) {
  const onlyNotes = r.lines.length > 0 && r.lines.every((l) => l.trim().startsWith('note:'));
  console.log(`\n${r.lines.length === 0 || onlyNotes ? '✓' : '✗'} ${r.name}`);
  for (const l of r.lines) console.log(l);
}
console.log(`\n${pairs.length} pairs · ${checked} properties compared · ${diffs} differences`);
cdp.close();
process.exit(diffs ? 1 : 0);
