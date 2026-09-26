# Fidelity checklist

How spec 002's verification criteria were checked. **All gates pass.**

Run everything with `npm run verify`. The browser gates need `npm run dev` and a
headless Chrome on port 9222:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/osrs-cdp &
npm run dev
npm run verify
```

Chrome is driven over the DevTools Protocol through Node's built-in WebSocket
(`scripts/cdp.mjs`), so none of this adds a dependency — constitution VIII holds.

## Gates

| Gate | Requirement | Result |
|------|-------------|--------|
| Token reconciliation | FR-001 | 156 / 156 against the source's own `tokenKinds`, no orphans either way |
| Namespace reset holds | FR-003, SC-001 | Tailwind defaults produce no rule: `bg-blue-500`, `text-sm`, `rounded-lg`, `shadow-md`, `font-thin`, `bg-gray-100` all absent |
| Every utility resolves | FR-003 | 181 utilities across 24 files |
| No constructed class names | FR-003 | none — Tailwind extracts statically, so `text-${size}` yields nothing |
| No raw hex | FR-003 | 0. 18 arbitrary values remain, all fixed geometry the source states but never tokenises |
| Type safety | FR-007, SC-004 | `tsc -b` with `strict`; `RequestStatus` admits only the six legal states |
| **Computed-style fidelity** | **FR-005a, SC-003** | **12 pairs, 168 properties, 0 differences** against the vendored source |
| **Pixel fidelity** | **FR-005a, SC-003** | **12 pairs rendered and diffed, 0 failures.** Catches what computed styles cannot: a background image that failed to load, wrong icon path data, glyphs a pixel off |
| Composite type roles | FR-001, FR-002 | all 13 render at their declared family, size and weight |
| Self-hosted fonts | FR-004, SC-002 | 49 requests, all same-origin; all four faces resolve |
| Keyboard + focus | FR-011, SC-006 | 38 elements reached by Tab, every one shows an indicator |
| Responsive | FR-012, SC-005 | no horizontal overflow at 360/768/1024/1440; all targets ≥44px below the design width |
| Overflow geometry | FR-016a | card width identical at 436px, height bounded by the clamps |
| Contrast | FR-011a | 13 of 15 pairings pass AA; 2 fail and are recorded in [additions.md](additions.md), unchanged |
| Source drift | FR-019 | `shasum -a 256 -c SHA256SUMS` clean |
| No vendored source in production | plan §Assets | `design-system/` absent from the built bundle |

## Bugs these gates caught

Worth recording, because each was invisible to review and to the build.

| Bug | Why it was invisible |
|-----|----------------------|
| **Every display heading rendered in Inter, not Space Grotesk.** The 13 composite type roles still referenced `var(--weight-medium)` after that token was renamed `--font-weight-medium`. A dangling `var()` makes the whole `font:` shorthand invalid, so the declaration is dropped and the element inherits. | The utility compiled fine — only its *value* was broken. No compile check can see this; it needed a rendering browser. The fidelity comparison missed it too, because the source components use inline styles rather than the type utilities. |
| `min-w-44` styled nothing — no 44px spacing token existed. | With Tailwind's namespaces cleared, an unknown utility emits no CSS and no error. |
| `inset-0` and `min-w-0` disappeared when `--spacing` was cleared. | Same silent failure. Zero is not a design value, so `--spacing-0` was added. |
| `text-32` was never generated — the gallery built the class name by interpolation. | Tailwind extracts statically. The size ladder would have rendered every sample identically. |
| `ButtonTemplate`'s saved state kept its white background. | Two `bg-*` classes on one element: CSS source order wins, not attribute order. |
| The availability chip was never compared. | The harness skipped captions by matching `className.indexOf('text-11')` — and `text-11-5` contains that substring. FR-009's component silently fell out of the comparison. |
| The compare harness shipped in the production bundle. | `import.meta.env.DEV` guarded the *use* of a `lazy()` component declared unconditionally, so Rollup still emitted the chunk. The guard has to wrap the `lazy()` call itself. |
| `#compare` did nothing on an already-open page. | Changing the hash fires `hashchange` without reloading; nothing listened, so React never re-rendered. |
| The fidelity script reported PASS while comparing nothing. | It found 0 pairs and exited 0. It now fails unless it finds all 12. |

## How the pixel gate decides

A percentage on its own cannot tell antialiasing from a defect, so the gate
classifies the differences instead of thresholding them. For every differing
pixel it checks whether its neighbours also differ:

- **Scattered** (few clustered neighbours) — edge antialiasing. Tolerated.
- **Clustered into a solid region** — something actually renders differently.
  Reported with the region's size and position, and the images are written to
  `/tmp/osrs-pixels/` for inspection.

Three pairs carry a **named, justified exception** in `compare-pixels.mjs`, so
each is auditable rather than hidden behind a looser global threshold:

| Pair | Diff | Why it is allowed |
|------|------|-------------------|
| Search | 9.8% | Placeholder colour. The source leaves it unstyled, so it renders Chrome's UA default `oklab(0 0 0 / .5)`; the port uses `--text-secondary`. A deliberate deviation, recorded in [additions.md](additions.md) §4.1b. |
| SupplyCard | 2.0% | Image resampling. The source paints the photo as a CSS background, the port as an `<img>` — same file, same box, different scaler. |
| ButtonWithIcon | 2.5% | Icon rasterisation. Path geometry matches to **0.02px**, measured; the two rasterise on different grids because the SVG viewports differ. |

An unexplained difference still fails.

## Bugs the pixel gate caught that computed styles missed

| Bug | Why computed styles missed it |
|-----|-------------------------------|
| **The availability pill sat at the far right of the SupplyCard instead of beside the name.** Introduced while fixing the overflow clamps: `flex-1` on the title pushed the pill to the edge. | Every compared property matched — the pill's own styles were correct. Only its position in the row was wrong, and that is not a property of the pill. |
| The "Add to Request List" button was 21px wider than the source's 304px. | Width was `flex-1`, so it was *computed* correctly for its own rules. |
| The search icon was a hand-drawn circle-and-handle, not the source's 13.5×13.5 path. | An icon's path data is not a CSS property. |
| The search input clipped its placeholder early — `type="search"` makes Chrome reserve room for a cancel decoration. | Font, size, weight and box all matched. |
| The source components rendered broken-image icons, so two comparisons were meaningless. | The source builds asset paths relative to a bundle file that does not exist under the dev server; `vite.config.ts` now serves them in dev. |

## Still done by eye

Optical judgement — whether spacing *feels* right, whether a component reads
correctly in a real composition — is not automated. Open the gallery beside
`design-system/ui_kits/osrs-web/index.html` and the `guidelines/*.card.html`
specimens at 1440px for that pass.

## Reading the source before porting it

Two rules decide what in the `.fig` counts as the design. Both are set out in
[drift-2026-09-26 §How this was read](drift-2026-09-26.md#how-this-was-read):

- the bound style wins over the cached value
- in a frame that draws a side panel over a page, only the panel is
  authoritative, and the page behind it is backdrop
