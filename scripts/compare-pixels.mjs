/** Pixel-level fidelity (FR-005a, SC-003).
 *
 *  scripts/compare-fidelity.mjs compares computed styles, which catches a wrong
 *  weight or a half-pixel size but is blind to anything not expressed as a CSS
 *  property: a background image that failed to load, an icon whose path data is
 *  wrong, glyphs sitting a pixel off. This renders both sides and diffs the
 *  actual pixels.
 *
 *  Chrome decodes the PNGs (via canvas in the page), so there is no image
 *  dependency — constitution VIII holds. */
import { connect } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const THRESHOLD = 1.5; // % of differing pixels tolerated — antialiasing only
const CHANNEL_TOLERANCE = 12; // per-channel, for subpixel rendering

/** Named, justified exceptions. Each one is a difference we understand and have
 *  decided to keep, so it is recorded here rather than hidden behind a looser
 *  global threshold. An unexplained difference still fails. */
const ALLOWED = {
  Search: {
    max: 12,
    why: 'placeholder colour: the source leaves it unstyled, so it renders Chrome\'s UA default oklab(0 0 0 / .5). The port uses the design system\'s own --text-secondary. Logged in additions.md.',
  },
  SupplyCard: {
    max: 3,
    why: 'image resampling: the source paints the photo as a CSS background, the port as an <img>. Same file, same box, different scaler. Plus the fixed three-digit quantity slot: the stepper is 94px wide instead of the source\'s 74 drawn around a lone "1", so the primary button is 294px instead of 304. Logged in additions.md.',
  },
  ButtonWithIcon: {
    max: 3,
    why: 'icon rasterisation: path geometry matches to 0.02px (measured), but the source rasterises inside a 17.88x16.48 SVG viewport and the port inside 22x22, so thin strokes land on a different grid.',
  },
};

const cdp = await connect();
await cdp.setViewport(1440, 2400);
// The harness is lazy-loaded, so wait for the pairs themselves rather than
// for a first mount that happens before they exist.
await cdp.goto('http://localhost:5173/#compare', {
  ready: () => document.querySelectorAll('[data-cmp]').length >= 12,
});
await cdp.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))),
  );
});

const boxes = await cdp.evaluate(() => {
  const out = [];
  for (const g of document.querySelectorAll('[data-cmp]')) {
    const root = (s) => [...g.querySelector(`[data-side="${s}"]`).children].find((c) => !c.hasAttribute('data-label'));
    const a = root('source');
    const b = root('port');
    if (!a || !b) continue;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    out.push({
      name: g.dataset.cmp,
      source: { x: ra.x, y: ra.y + scrollY, w: ra.width, h: ra.height },
      port: { x: rb.x, y: rb.y + scrollY, w: rb.width, h: rb.height },
    });
  }
  return out;
});

const shoot = async (b) => {
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: b.x, y: b.y, width: Math.ceil(b.w), height: Math.ceil(b.h), scale: 1 },
  });
  return data;
};

let failures = 0;
const saved = [];
mkdirSync('/tmp/osrs-pixels', { recursive: true });

for (const box of boxes) {
  if (Math.round(box.source.w) !== Math.round(box.port.w) || Math.round(box.source.h) !== Math.round(box.port.h)) {
    console.log(`  ✗ ${box.name}: size differs — source ${Math.round(box.source.w)}x${Math.round(box.source.h)}, port ${Math.round(box.port.w)}x${Math.round(box.port.h)}`);
    failures++;
    continue;
  }
  const [a, b] = [await shoot(box.source), await shoot(box.port)];
  const res = await cdp.evaluate(
    async (pngA, pngB, tol) => {
      const load = (d) =>
        new Promise((r) => {
          const i = new Image();
          i.onload = () => r(i);
          i.src = 'data:image/png;base64,' + d;
        });
      const [ia, ib] = await Promise.all([load(pngA), load(pngB)]);
      const w = Math.min(ia.width, ib.width);
      const h = Math.min(ia.height, ib.height);
      const px = (img) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.getContext('2d').getImageData(0, 0, w, h).data;
      };
      const [da, db] = [px(ia), px(ib)];
      let diff = 0;
      let maxDelta = 0;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(
          Math.abs(da[i] - db[i]),
          Math.abs(da[i + 1] - db[i + 1]),
          Math.abs(da[i + 2] - db[i + 2]),
          Math.abs(da[i + 3] - db[i + 3]),
        );
        if (d > tol) {
          const p = i / 4;
          mask[p] = 1;
          diff++;
          if (d > maxDelta) maxDelta = d;
          const x = p % w, y = (p / w) | 0;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      // A differing pixel with differing neighbours is part of a solid region;
      // an isolated one is an antialiased edge.
      let clustered = 0;
      for (let p = 0; p < mask.length; p++) {
        if (!mask[p]) continue;
        const x = p % w, y = (p / w) | 0;
        let n = 0;
        if (x > 0 && mask[p - 1]) n++;
        if (x < w - 1 && mask[p + 1]) n++;
        if (y > 0 && mask[p - w]) n++;
        if (y < h - 1 && mask[p + w]) n++;
        if (n >= 3) clustered++;
      }
      return {
        diff, total: w * h, pct: (diff / (w * h)) * 100, maxDelta,
        clusteredPct: diff ? (clustered / diff) * 100 : 0,
        region: x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
      };
    },
    a,
    b,
    CHANNEL_TOLERANCE,
  );
  // Antialiasing shows up as isolated edge pixels. A real defect fills an area,
  // so most of its differing pixels have differing neighbours.
  const antialiasing = res.clusteredPct < 25;
  const allow = ALLOWED[box.name];
  const ok =
    res.pct <= THRESHOLD ||
    (antialiasing && res.pct <= 4) ||
    (allow !== undefined && res.pct <= allow.max);
  if (!ok) {
    failures++;
    const slug = box.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    writeFileSync(`/tmp/osrs-pixels/${slug}-source.png`, Buffer.from(a, 'base64'));
    writeFileSync(`/tmp/osrs-pixels/${slug}-port.png`, Buffer.from(b, 'base64'));
    saved.push(slug);
  }
  const why = res.diff === 0 ? '' : antialiasing
    ? `  (edge antialiasing — ${res.clusteredPct.toFixed(0)}% clustered)`
    : `  (solid region ${res.region.w}x${res.region.h} at ${res.region.x},${res.region.y} — ${res.clusteredPct.toFixed(0)}% clustered)`;
  console.log(`  ${ok ? '✓' : '✗'} ${box.name.padEnd(26)} ${res.pct.toFixed(2)}% of ${res.total} px${why}`);
  if (ok && allow && res.pct > THRESHOLD) console.log(`      known: ${allow.why}`);
}

console.log(`\n${boxes.length} pairs compared at ${THRESHOLD}% threshold · ${failures} failure(s)`);
if (saved.length) console.log(`images written to /tmp/osrs-pixels/ for: ${saved.join(', ')}`);
cdp.close();
process.exit(failures ? 1 : 0);
