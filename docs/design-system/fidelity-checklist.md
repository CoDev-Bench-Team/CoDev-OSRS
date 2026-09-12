# Fidelity checklist

How spec 002's verification criteria were checked, and what is still open.

**Status: partially verified.** Everything mechanical is automated and passing.
Everything that needs a rendering browser is **not yet done** — see Open.

## Automated and passing

| Check | Requirement | How | Result |
|-------|-------------|-----|--------|
| Token reconciliation | FR-001 | All 156 tokens in `design-system/tokens/*.css` matched against the source's own `tokenKinds` map | 156 / 156, no orphans either way |
| Namespace reset holds | FR-003, SC-001 | Compile the theme and assert Tailwind defaults produce no rule | `bg-blue-500`, `text-sm`, `rounded-lg`, `shadow-md`, `font-thin`, `bg-gray-100`, `ease-in-out` all absent |
| Every utility resolves | FR-003 | `node scripts/check-utilities.mjs` — compiles each class used in `src/` and fails if it produces no CSS | 181 utilities across 24 files, all resolve |
| No constructed class names | FR-003 | Same script — Tailwind extracts statically, so `text-${size}` silently yields nothing | none found |
| Production build contains them | SC-001 | Grep the built stylesheet for the type ladder, spacing steps and custom utilities | all present |
| Type safety | FR-007, SC-004 | `tsc -b` with `strict` | passes; `RequestStatus` admits only the six legal states |
| Contrast | FR-011a | WCAG 2.1 AA computed over 15 key pairings | 13 pass, 2 fail — recorded in [additions.md](additions.md) §4.1, unchanged in code |
| Fonts self-hosted | FR-004 | 6 `.woff2` committed; `fonts.css` references only relative paths | no third-party URL in the built CSS |

### The bug this caught

`min-w-44` was written before `--spacing-touch-target` existed. With Tailwind's
namespaces cleared an unknown utility emits **no CSS and no error**, so the
button would have silently lost its minimum width. `check-utilities.mjs` exists
because that failure is invisible in review. It also caught `inset-0` and
`min-w-0` disappearing when `--spacing` was cleared, and `text-32` never being
generated because the gallery built the class name by interpolation.

## Open — needs a rendering browser

| Check | Requirement | Why it is not done |
|-------|-------------|--------------------|
| **Computed-style comparison of all 25 components** | FR-005a, SC-003 | The R2 mitigation renders the vendored source `.jsx` beside the ported `.tsx` and diffs `getComputedStyle`. The harness is not built; no browser automation was available in this session. **This is the primary fidelity gate and it has not run.** |
| **Visual side-by-side at 1440px** | FR-005a | Same reason. |
| **Keyboard walk** | FR-011, SC-006 | Focus styles are implemented and the utilities compile, but no one has tabbed through the gallery. |
| **Responsive check at 360 / 768 / 1024 / 1440** | FR-012, SC-005 | Breakpoints are implemented; overflow and 44px targets are unverified at real viewports. |
| **Overflow geometry** | FR-016a | The gallery renders realistic and overlong data side by side, but that designed geometry is identical in both has not been measured. |

## How to close the open items

```bash
npm run dev          # gallery at the root URL
npm run build        # then check dist/assets/*.css
node scripts/check-utilities.mjs
cd design-system && shasum -a 256 -c SHA256SUMS   # drift baseline
```

Open the gallery beside `design-system/ui_kits/osrs-web/index.html` and
`design-system/guidelines/*.card.html` at 1440px. Work down the component list
in [token-map.md](token-map.md); anything that differs is either a port bug or a
source value worth flagging.
