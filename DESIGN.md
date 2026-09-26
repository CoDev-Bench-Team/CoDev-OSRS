# Design — Office Supplies Request System

**Status**: Accepted for MVP
**Date**: 2026-09-15
**Source of record**: `design-system/` (vendored, read-only)
**Companion docs**: [architecture](ARCHITECT.md), [token map](docs/design-system/token-map.md), [additions](docs/design-system/additions.md), [content conventions](docs/design-system/content-conventions.md), [fidelity checklist](docs/design-system/fidelity-checklist.md), [spec 002](specs/002-design-system-foundation/spec.md)

This file is the cross-cutting visual HOW, the peer of `ARCHITECT.md`. That file
says what the system does; this one says what it looks like and what a screen
author may and may not decide. Feature WHAT still lives in specs.

`design-system/readme.md` is the **designer's** document, describing the Figma
export. This is the **repository's** document, describing what shipped, what was
added, and what is enforced. Where the two disagree, the export is the source of
truth for *values* and this file is the source of truth for *rules*.

## 1. The source

The design system is a verbatim export of `Office Supplies Request System
(OSRS).fig` (Mockups page, 18 frames), vendored into `design-system/` on
2026-09-12.

| Rule | Detail |
|------|--------|
| **Never edit `design-system/`** | It is not source we own. A change there means the designer re-exported. |
| **Verify before trusting it** | `cd design-system && shasum -a 256 -c SHA256SUMS` — 106 files. A mismatch is drift, not a bug to fix in place (FR-019). |
| **Never ship it** | Reachable only through the `@ds` alias, used only by the dev-only fidelity harness. A gate asserts `design-system/` is absent from the build. |
| **Re-export procedure** | Re-vendor → diff `SHA256SUMS` → reconcile `docs/design-system/token-map.md` → re-run `npm run verify`. |
| **The export is already behind the file** | Four frames used since — `01 - Login` second variant (28:2673), `03 - Inventory` (113:27060), `04 - Add Item` (113:27374), `04 - Update Item` (113:28004) — postdate the 2026-09-12 export and were built from the live file. Their values have no entry in the token map. Listed in [additions.md §3g](docs/design-system/additions.md). A re-export is owed. The two item frames have since been archived in the file (drift-2026-09-22 §1). |

What the export contains: 7 token files (156 tokens), 17 component families in 6
groups, 15 guideline specimen cards, a 7-file click-through UI kit of the whole
product, brand assets and photography, plus `_ds_manifest.json` (machine-readable
inventory) and `_ds_bundle.js` (compiled components).

`design-system/readme.md` §Sources names a "Node + Express / PostgreSQL" stack
from the original brief. **Disregard it.** [ADR-0001](docs/adr/0001-spa-rest-api.md)
refuses to assume a backend stack, and the design export has no standing on that
question.

## 2. What shipped, and where

| Layer | Path | Contents |
|-------|------|----------|
| Tokens | `src/styles/theme.css` | Tailwind 4 `@theme` — every token, Tailwind's own defaults cleared |
| Fonts | `src/styles/fonts.css` | Four self-hosted variable faces, no runtime third-party request |
| Utilities | `src/styles/utilities.css` | 13 composite type roles, 3 rings, `hit-area`, `transition-osrs` |
| Base | `src/styles/index.css` | Page ground, focus, disabled, the sub-1440 touch minimum |
| Components | `src/shared/ui/` | 27 components from spec 002, plus 11 added since, behind one barrel (`index.ts`) |
| Vocabulary | `src/shared/ui/status.ts` | The request and stock status types |
| Gallery | `src/shared/ui/gallery/` | Every component in isolation, 12 sections |

**Import components from `src/shared/ui` only**, never from a component's own
path. That is what the design system's own adherence rules require.

## 3. The token contract

Tokens are the only source of visual values. This is a **build guarantee, not a
review convention**: `theme.css` resets every Tailwind namespace to `initial`
before declaring OSRS tokens, so `bg-blue-500`, `text-sm`, `rounded-lg`,
`shadow-md` and `p-3` do not compile to anything. A value the designer did not
record cannot be used by accident.

> ⚠ **Numeric utility names are pixels, not Tailwind's scale.**
> `--spacing-4` is 4px, so `p-4` pads **4px** and `p-16` pads **16px** — the
> number *is* the pixel value. `leading-6` is 6px, not 1.5rem; use the named
> roles (`leading-body`, `leading-tight`) for line height. This trips up
> everyone once.

Full traceability — all 156 source tokens, their source file, their value, and
the 24 renames — is in [token-map.md](docs/design-system/token-map.md). Do not
duplicate that table here.

### Renames worth knowing

Values are identical; only names changed, and only where the source name could
not survive the port.

| Source | In the SPA | Why |
|--------|-----------|-----|
| `--text-body`, `--text-primary`, `--text-muted`, … (7 colours) | `--color-ink-*` | They occupied Tailwind's font-size namespace, where `--text-11`–`--text-32` live. Both would have broken. |
| `--weight-*` | `--font-weight-*` | Tailwind's font-weight namespace. |
| `--layout-*`, `--control-height-*`, `--row-height-*` | `--spacing-*` | So they produce width/height utilities. |
| `--border-default` / `-strong` | `--color-line-*` | `--color-border-*` would yield `border-border-default`. |

**A dangling `var()` is silent and total.** It invalidates the whole `font:`
shorthand, the declaration is dropped, and the element inherits — which is how
every display heading once rendered in Inter while the utility still compiled
cleanly. Renaming a token means updating every composite role that consumes it.

## 4. Type

Two families, no overlap.

| Role | Utility | Spec |
|------|---------|------|
| Page title | `type-page-title` | Space Grotesk 500 / 32px / 1.3 |
| Section title | `type-section-title` | Space Grotesk 500 / 19px / 1.3 |
| Summary metric | `type-metric` | Space Grotesk 500 / 28px / 1.3 |
| Display hero | `type-display-hero` | Space Grotesk 700 / 128px / 1.3 |
| Card title | `type-card-title` | Inter 700 / 17px / 100% |
| Subhead | `type-subhead` | Inter 700 / 15px / 100% |
| Body | `type-body` | Inter 400 / 14px / **1.5** |
| UI row | `type-ui` · `type-ui-bold` | Inter 400 or 700 / 13px / 100% |
| Metadata | `type-meta` | Inter 400 / 12px / 100% |
| Pill | `type-pill` | Inter 700 / 12px / 100% |
| Caption | `type-caption` | Inter 400 / 11px / 100% |
| Eyebrow | `type-eyebrow` | Inter 700 / 11px / 100% |

Rules: Space Grotesk is **display only**; Inter is everything else. Body copy is
the only text at 1.5 — all other UI text is at 100%. **13px is the dominant UI
size, not 14.** The odd sizes (`11.5px`, `13px`) are transcribed, not rounded;
never normalise them. Each role is one class, so the size, weight, line height
and family stay one decision.

Fonts are self-hosted variable faces (FR-004): Inter and Space Grotesk split
latin / latin-ext; Roboto and Noto Sans latin-only, since only the two imported
library components use them and no OSRS screen renders those.

## 5. Colour

**One accent, and it is red.** `--color-brand-primary` (`rgb(198,40,40)`) is the
product's entire chromatic identity: wordmark, active nav, primary buttons, count
badge, inline link-actions, summary metrics. `--color-brand-primary-alt`
(`rgb(204,47,74)`) appears on a few buttons — a real variance in the source, both
tokenised. **Nothing else in the UI is coloured except status.**

Surfaces: the page is warm off-white (`--color-surface-page`, `rgb(250,250,249)`
— stone-tinted, not grey); cards, the bar and search are pure white; table
headers are cool `rgb(240,242,245)`. **That warm-page / cool-header pairing is
the signature — do not flatten it to one grey.**

### Status vocabulary — fixed

| Tone | Meaning | Applies to |
|------|---------|------------|
| **Amber** | waiting on a human | `Pending Approval`, `Low Stock` |
| **Green** | moving | `Approved`, `In Stock` |
| **Pink** | handed over, by delivery | `For Delivery` |
| **Blue** | handed over, for pickup | `Ready for Pickup` |
| **Purple** | closed, done | `Completed` |
| **Red** | stopped by a decision | `Rejected`, `Out of Stock` |
| **Slate** | stopped without a decision | `Cancelled` |

`RequestStatus` admits **only the seven legal states** of constitution 3.0.1 IV
— an illegal state is unrepresentable in the type system. `src/shared/ui/status.ts`
is the source of truth; this table follows it.

`For Delivery` and `Ready for Pickup` are **states**, peers rather than a
sequence, not labels on a shared handover state. `For Release` and `Released`
are retired ([ADR-0007](docs/adr/0007-fulfilment-status-vocabulary.md)).
`Completed` took its own purple and `Cancelled` the file's `Status/Cancelled`
slate in the 2026-09-15 export; the pink and blue handover pairs were adopted
from the drawn `Request Status` component on 2026-09-24
([drift-2026-09-24 §6](docs/design-system/drift-2026-09-24.md)). Token pairs are
in [token-map.md](docs/design-system/token-map.md).

## 6. Spacing, geometry, elevation

**The spacing scale is irregular on purpose**: 1, 2, 4, 5, 6, 7, 8, 9, 10, 12,
14, 16, 18, 20, 22, 24, 28, 32. It is not a 4/8 grid. Copy the number the source
states; do not regularise it.

Fixed geometry that must hold at the design width:

| Element | Value | Token |
|---------|-------|-------|
| Page / content / gutter | 1440 / 1344 / 32px | `--spacing-layout-*` |
| Top bar | 87px | `--spacing-layout-topbar-height` |
| Search field | 46px | `--spacing-control-height-lg` |
| Button | 42px | `--spacing-control-height-md` |
| Request / inventory row | 78px / 68px | `--spacing-row-height-*` |
| Supply card | 436px | fixed in the component |

**Radii by role:** 4px steppers and code chips · 6px text fields and the
pagination chip · 8px availability chips · 10px everything structural · 24px the
login card · 999px pills and badges · 200px avatars.

**Exactly one shadow and one ring.** `--shadow-card` is the only elevation —
there is no second level, no inner shadow, no glow. The rule the source
establishes:

> Structural containers get the **shadow**. Interactive inputs get the **ring**.
> Data rows get a real **border**. Never a shadow and a ring on the same element
> — except the primary button, which carries a same-colour ring to keep its
> silhouette on white.

No gradients, no blur, no transparency beyond the card shadow (7%), the modal
scrim (50%) and the status tints (10%). Backgrounds are flat. The only
photography is the login background and the 180px catalog product shots.

## 7. Components

All behind `src/shared/ui/index.ts`. Spec 002 shipped 27: **17** ported from the
source's published families, **8** promoted from frames the designer drew inside
the UI kit but never published (`TopBar`, `Avatar`, `PageHeader`, `SummaryCard`,
`Button`, `TableCard`, `TableHead`, `SectionTitle`), and **2** added to make a
drawn shape into a real control (`Select`, `MdiChevronDown`).

Eleven more have landed since, all from §1's newer frames or from the shell's
undrawn states: `Field` and `TextInput` (the first form controls the system
has), `BytesizeClose`, `MdiLightBell`, the three heroicons chevrons the imported
pager uses, and `LoadingState`, `Placeholder`, `NotFoundScreen`,
`ForbiddenScreen`. `TopBar` stopped being a redesign and became a port of the
`Top Navigation` component. See
[additions.md §3d and §3g](docs/design-system/additions.md).

| Group | Components |
|-------|------------|
| Brand | `CoDevRedMasterLogo`, `CoDevWhiteMasterLogo`, `CoDevSupplyRequestsLogo` |
| Actions | `Button` (primary · accent · ghost), `ButtonTemplate`, `ButtonWithIcon`, `SignInButton` |
| Forms | `Search`, `Select` |
| Data display | `StatusPill`, `SupplyCard`, `SummaryCard`, `TableCard`, `TableHead` |
| Layout | `TopBar`, `Avatar`, `PageHeader`, `SectionTitle` |
| Overlay | `Backdrop` |
| Icons | 6 source glyphs + `GoogleIcon` + `MdiChevronDown`, all `currentColor` |

Misuse must fail before the app runs: `StatusPill` takes exactly one of
`status` / `stock` / `availability`, and a misspelled status is a type error.

**Icons:** MDI at 24×24 light weight is the established register — reach for it
first when the file defines no icon. Never hand-draw one. Never restyle the
Google mark. Two Unicode glyphs are reproduced literally rather than substituted:
the `-` / `+` in the quantity stepper.

## 8. Content

Full rules in [content-conventions.md](docs/design-system/content-conventions.md).
The load-bearing ones:

- **Casing is three strict tiers.** Page titles sentence case ("Inventory
  management"). Buttons, pills and nav Title Case ("Add to Request List"). Table
  headings and eyebrows ALL CAPS ("REQUEST ID").
- **Buttons are imperative verb phrases naming the object.** Never "Submit",
  never "OK", never "Yes / No". Destructive confirmations restate the act
  ("Confirm Rejection"), they do not ask "Are you sure?".
- **Subtitles are one sentence, no period.**
- **IDs are load-bearing** and always render in `type-ui-bold`: `REQ-2026-1847`,
  `MON-2238`, `CDV-MS-00087`.
- **Dates are "Sep 8, 2026"**, timestamps append " at 9:42 AM".
- **No emoji. Anywhere.** Not in copy, not in status, not as iconography.
- **Sample data is Filipino names, Davao office.** Keep that register.

## 9. Interaction, responsive, layering — all additions

The source is a static export. It designs **no** hover, focus, press, disabled,
empty, error or loading state, and has no frame but 1440. Everything in this
section was decided here and is logged in
[additions.md](docs/design-system/additions.md) for designer ratification.

| Concern | Decision | Basis |
|---------|----------|-------|
| Hover | Ink or fill lightens one step, 120ms, eased. No scale, no bounce, no shadow growth. | The one hover variance the file records. |
| Focus-visible | 2px brand-red outline at 2px offset. **Never suppressed.** | Nothing in the source. Without it the product is unusable by keyboard. |
| Disabled | 40% opacity, pointer events off, out of the tab order. Set explicitly. | `ButtonTemplate`'s "saved" state sits at 40%. |
| Motion | `--motion-fast` 120ms, `--motion-base` 180ms, `--ease-osrs`. | Shipped in the source's own tokens as a flagged addition. |
| Text overflow | Identifiers and status never clamp. Names 1 line, card titles 2, rejection reason and purpose 3. **Designed geometry always wins.** | No source designs a long string. |
| Breakpoints | Exact source geometry at ≥1440. Fluid 768–1439. Single column below 768. | Invented — the source has only the 1440 frame. |
| Touch targets | 44px minimum **below** 1440 only. At the design width the source's own 42px buttons win. | Invented. |

**The 1440 escape hatch.** The touch-target rule once grew the stepper's 22px
`-` / `+` to 44×44 and nobody saw it, because the fidelity gates run only at
1440. Small controls now keep their drawn box and meet the minimum with an
invisible centred pseudo-element (`hit-area`). The lesson generalises: **the
gates prove fidelity at 1440 only — an addition that applies below it can still
deform designed geometry, and only viewing the port at a real window size will
catch that.**

### Stacking order

The source draws one scrim and nothing overlapping, so it defines no layering.
Without one, a portalled dropdown and a modal scrim land in the same layer and
whichever declares a `z-index` wins by accident.

| Token | Value | Layer |
|-------|-------|-------|
| `--z-index-sticky` | 10 | Chrome that stays put while content scrolls |
| `--z-index-backdrop` | 40 | The modal scrim |
| `--z-index-dialog` | 50 | Dialog content, above its own scrim |
| `--z-index-popover` | 60 | Dropdown panels |
| `--z-index-toast` | 70 | Transient notices |

**A popover sits above a dialog on purpose** — a select inside a dialog must be
usable. Because that ordering cannot also keep a *stale* popover off a new
scrim, a scrim explicitly dismisses any open popover when it mounts
(`overlay/popover-layer.ts`). Both halves have regression coverage.

## 10. Enforcement

`npm run verify` runs every gate. The browser gates need `npm run dev` and a
headless Chrome on port 9222, driven over the DevTools Protocol through Node's
built-in WebSocket — no added dependency, which is how constitution VIII holds.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/osrs-cdp &
npm run dev
npm run verify
```

| Gate | Checks |
|------|--------|
| `tsc -b` | Strict types; illegal request states unrepresentable |
| `npm run lint` | oxlint |
| `check-utilities.mjs` | Every utility resolves; no raw hex; no constructed class names; Tailwind defaults produce no rule |
| `compare-fidelity.mjs` | Computed styles, ported `.tsx` vs vendored `.jsx` |
| `compare-pixels.mjs` | Rendered pixels — catches what computed styles cannot |
| `check-a11y-responsive.mjs` | Tab reach, focus indicators, overflow and targets at 360/768/1024/1440 |
| `npm run build` | Build succeeds; `design-system/` absent from the bundle |

Results and the bugs these gates caught are recorded in
[fidelity-checklist.md](docs/design-system/fidelity-checklist.md).

**The design system is a test oracle, not just a reference.** Vendoring it turned
"does the port look right?" from a review opinion into a diffable assertion.
Named, justified exceptions live in the comparison scripts — add one there, with
its reason, rather than loosening a gate.

## 11. Known gaps

Blocking later work. None of these has a visual source; each needs design before
the screen that depends on it can be built faithfully.

| Gap | Blocks |
|-----|--------|
| **No loading, empty or error states** | Every data-backed screen |
| **No mobile or tablet frames**, and no collapsed navigation | Our breakpoints are invented |
| **No sign-out control, no not-found or forbidden screen** | The shell (additions.md §3d) |
| **No Admin profile** | Spec 001 US8 for the Admin |

Closed by the 2026-09-22 export: the handover screen (folded into the Requests
Queue's Update Status panel) and the notification emails (six frames). See
[drift-2026-09-22 §2, §5, §8](docs/design-system/drift-2026-09-22.md).

## 12. Accepted defects

Per FR-011a a source value that fails a threshold is **reported, not silently
changed**. These ship as-is:

| Defect | Detail |
|--------|--------|
| Muted caption contrast | `--color-osrs-gray-400` on white at 11px = **3.24**, needs 4.5 |
| Eyebrow / table heading contrast | `--color-osrs-gray-500` on the table header at 11px bold = **4.44**, marginal |
| "For Delivery" pink contrast | `#EF5DA8` on its own tint = **2.77**, needs 4.5 |
| Google mark renders monochrome | The export fills all four paths with one red, contradicting its own "never restyle" rule |

One deliberate deviation from the source's rendering: `Search` leaves its
placeholder unstyled, inheriting a browser default that varies by browser. The
port uses `--color-ink-secondary`, because a tokenised grey is a decision and a
UA default is not. Flagged for confirmation.

The full list of open questions for the designer — eight of them — is at the end
of [additions.md](docs/design-system/additions.md).

## 13. Rules for screen authors

1. **Reach for a token, never a literal.** If the value does not exist, that is
   the answer — the designer did not record it. Do not invent one; flag it.
2. **Import from `src/shared/ui`**, never a component's own path.
3. **Do not regularise the irregular.** 11.5px, 13px, 7px, 9px, 22px are
   transcribed values.
4. **Remember `p-4` is 4px.**
5. **Never suppress the focus indicator.**
6. **Follow the casing tiers and the button voice** — content is as much the
   brand as the colour is.
7. **An addition is a decision.** Anything the source does not define goes in
   `additions.md` with its basis, so the designer can ratify or replace it.
8. **Check at a real window size**, not only at 1440.
