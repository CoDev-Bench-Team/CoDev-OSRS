# Implementation Plan: Design System Foundation

**Date**: 2026-09-12
**Spec**: `specs/002-design-system-foundation/spec.md`
**Status**: Draft

## Summary

Port the OSRS design system into this SPA as a Tailwind CSS 4 `@theme` token layer, self-hosted webfonts, committed brand assets, and 25 typed React components, then expose all of it through an in-app gallery. The approach inverts Tailwind's defaults: every built-in namespace is cleared to `initial` so that the only colours, type sizes, radii, shadows and spacing steps the app can express are the 156 the designer recorded — turning FR-003 and SC-001 from a review convention into a framework constraint.

## Technical Context

**Stack**: React 19.2, TypeScript ~6.0, Vite 8.3, Tailwind CSS 4.3 (all installed; no version changes)
**Primary Dependencies**: None added. Fonts are committed `.woff2` files, not packages.
**Storage**: None. This feature performs no I/O.
**Target Layer(s)**: Frontend only.
**Performance Goals**: No font-swap layout shift; the token layer adds no runtime cost (all `@theme` values compile to CSS custom properties).
**Constraints**: Constitution VIII (no new frameworks without an ADR) — satisfied, zero new dependencies. Constitution VII (typed contracts) — satisfied, but requires enabling TypeScript `strict`, which is currently **off** (see Blocking Preconditions). FR-016 forbids routing in this feature, which shapes how the gallery is built (see §Gallery).

## Blocking Preconditions

Both are now **SATISFIED** (2026-09-12).

| # | Precondition | Status |
|---|--------------|--------|
| P1 | **TypeScript `strict` is enabled** | **Done.** `"strict": true` added to `tsconfig.app.json`. `tsc -b --force` and `oxlint` both pass — the Vite starter was trivial enough to need no fixes, and is being deleted anyway. `CLAUDE.md`'s "SPA TypeScript is strict" and FR-007 are now actually enforced. |
| P2 | **Design-system source is vendored** | **Done.** 106 files copied verbatim to `design-system/` (1.7 MB), excluding `.DS_Store` and `.thumbnail`; file list verified identical to the source. `design-system/VENDORED.md` records provenance and the read-only rule; `design-system/SHA256SUMS` is the integrity and FR-019 drift baseline (`shasum -a 256 -c SHA256SUMS`). The foundation no longer depends on a path in someone's Downloads folder. |

## Data Model

No persisted entities. The spec's entities become compile-time constructs:

| Spec entity | Realisation |
|-------------|-------------|
| Token | A CSS custom property inside `@theme`, plus a row in `docs/design-system/token-map.md` recording its source file and original name (FR-019) |
| Component | A `.tsx` module under `src/shared/ui/`, props typed with closed unions |
| Status | Two exported string-literal unions in `src/shared/ui/status.ts` — `RequestStatus` (6 members) and `StockStatus` (3 members) — plus a presentation-label map (D5) |
| Brand asset | A committed binary under `src/assets/`, imported so Vite fingerprints it |
| Documented addition | A row in `docs/design-system/additions.md` (FR-018) |

### Status typing (FR-008, D5)

```
RequestStatus = 'Pending Approval' | 'Approved' | 'Rejected'
              | 'For Release' | 'Released' | 'Completed'
StockStatus   = 'In Stock' | 'Low Stock' | 'Out of Stock'
Availability  = 'available' | 'unavailable'
```

`Ready for Pickup` and `For Delivery` are not statuses; they are optional presentational labels for `Released`, selected by a `handover` prop (`'pickup' | 'delivery'`), so an illegal state remains unrepresentable (D5, amended 2026-09-14).

## API Contracts

**None.** FR-016 forbids HTTP in this feature, and `ARCHITECT.md` §8 reserves the REST contract to the backend team. No `src/shared/api.ts` work happens here.

## Token Porting Strategy

The core technical decision, implementing D1.

### Clearing the defaults

Tailwind 4 namespaces are cleared before OSRS values are defined:

```
@theme {
  --color-*: initial;  --text-*: initial;   --font-*: initial;
  --radius-*: initial; --shadow-*: initial; --spacing: initial;
  --spacing-*: initial;
}
```

This is what makes SC-001 structurally true: `bg-blue-500` or `p-3` stop existing, so a developer cannot reach a non-OSRS value even by accident.

**Verified against this repo's Tailwind 4.3.** Compiling the reset above with sample OSRS tokens confirms: `bg-brand-primary`, `text-ink-body`, `text-13`, `text-11-5`, `p-22`, `gap-7`, `rounded-10`, `shadow-card` and the custom `ring-default` / `type-ui` utilities all generate; `bg-blue-500`, `text-red-700`, `text-sm`, `p-4`, `rounded-lg`, `shadow-md` are all absent. `border-transparent`, `fill-current` and `text-inherit` survive the reset because they are CSS keywords rather than palette entries.

**Consequence:** `bg-white` and `text-black` *are* palette entries and are cleared. The source's `--osrs-white` and `--osrs-black` MUST therefore be ported as `--color-white` and `--color-black`, restoring both utilities at the designer's own values.

### Mapping by kind

The design system ships machine-readable metadata — `_adherence.oxlintrc.json` → `x-omelette.tokenKinds` classifies all 156 tokens. That file is the porting worksheet and the FR-019 drift baseline.

| Source kind | Count | Tailwind namespace | Utilities produced |
|-------------|-------|--------------------|--------------------|
| color | 69 | `--color-*` | `bg-`, `text-`, `border-`, `ring-`, `fill-` |
| font — families (4) | 4 | `--font-*` | `font-sans`, `font-display`, … |
| font — sizes (15) | 15 | `--text-*` | `text-11`, `text-11-5`, `text-13`, … |
| font — weights (5) | 5 | `--font-weight-*` | `font-regular` … `font-extrabold` |
| font — leading (3) | 3 | `--leading-*` | `leading-tight`, `leading-display`, `leading-body` |
| font — composite roles (13) | 13 | custom `@utility` | `type-page-title`, `type-ui`, … |
| font — semantic colours (7) | 7 | `--color-ink-*` | **renamed — see below** |
| spacing | 27 | `--spacing-*` | `p-`, `m-`, `gap-`, `w-`, `h-` |
| radius | 9 | `--radius-*` | `rounded-10`, `rounded-pill`, … |
| shadow | 1 | `--shadow-*` | `shadow-card` |
| other (motion) | 3 | `--ease-*` + plain vars | `ease-osrs`, duration via vars |

### The one forced rename

Seven tokens — `--text-primary`, `--text-heading`, `--text-strong`, `--text-body`, `--text-secondary`, `--text-muted`, `--text-link` — are **text colours**, but the source metadata kinds them `font` and their names occupy Tailwind's `--text-*` font-size namespace, where `--text-11` … `--text-32` also live. Porting both verbatim breaks both: `text-body` would be ambiguous between a colour and a size.

They are renamed into the colour namespace as `--color-ink-primary`, `--color-ink-heading`, `--color-ink-strong`, `--color-ink-body`, `--color-ink-secondary`, `--color-ink-muted`, `--color-ink-link`, producing `text-ink-body` and friends. **Values are unchanged.** Each rename is recorded in `token-map.md` with its source name and listed in `additions.md` as a naming deviation (FR-018). FR-001 promises each source *value* under a named token, not the source's own naming, so the rename is compliant — but it is logged so the designer can adopt the names if they publish Figma Variables.

### Composite type roles

The 13 `--type-*` tokens are CSS `font:` shorthands, which no Tailwind namespace models. They are preserved as custom utilities so the source's named roles survive as single classes:

```
@utility type-page-title { font: var(--type-page-title); }
```

### Rings

`--ring-default`, `--ring-brand`, `--ring-ink` are **inset box-shadows**, not Tailwind rings. They become custom utilities (`ring-default`, …) rather than `--color-ring-*`, preserving the source's "shadow on containers, ring on inputs, border on data rows" rule.

## Fonts

**Done** (2026-09-12). Six `.woff2` files, 252 KB total, committed under `src/assets/fonts/` and declared in `src/styles/fonts.css`. No package dependency, no runtime third-party request (FR-004, SC-002).

**All four families ship as variable faces** — not just the two OSRS ones, as first assumed. Google serves one variable file per family and points every requested weight at it; the per-weight downloads for Roboto and Noto Sans came back byte-identical, confirmed by checksum. So a family needs one file regardless of how many weights the design system uses, and the weight ladder is exact rather than approximated.

| Family | File(s) | Weight range declared | Used by |
|--------|---------|-----------------------|---------|
| Inter | `Inter-var-latin.woff2`, `Inter-var-latin-ext.woff2` | 400–800 | All OSRS UI |
| Space Grotesk | `SpaceGrotesk-var-latin.woff2`, `SpaceGrotesk-var-latin-ext.woff2` | 400–700 | Display type |
| Roboto | `Roboto-var.woff2` (latin) | 400–500 | `SignInButton` only |
| Noto Sans | `NotoSans-var.woff2` (latin) | 500–700 | `ButtonTemplate`, `ButtonWithIcon` only |

Inter and Space Grotesk carry every string in the product, so they keep the upstream latin / latin-ext split with its `unicode-range` declarations — latin-ext then downloads only when a page actually contains a character that needs it. Roboto and Noto Sans take latin only: they appear in two imported components that no OSRS screen renders.

Weight ranges are declared conservatively at what the design system actually uses, so the browser never synthesises an instance outside it. `font-display: swap`. The two Inter and Space Grotesk latin files are preloaded — that covers every OSRS weight on first paint; the other four are not.

## Assets

Copied from the design-system source and committed (FR-013). Total ≈ 1.1 MB.

```
src/assets/brand/    logo-codev-red.png, logo-codev-white.png, logo-supply-requests.png
src/assets/items/    item-laptop.jpg, item-monitor.jpg
src/assets/login/    login-background.png
src/assets/fonts/    12 × .woff2
```

The four loose SVGs in the source (`clipboard-text`, `clipboard-text-outline`, `search`, `google`) are **not** committed as files — they already exist as React components in the source and are ported as TSX (FR-014, `currentColor`).

Additionally, the design-system source itself is vendored to `design-system/` at the repo root, satisfying P2 and giving `token-map.md` (FR-019) and the FR-005a comparison a stable in-repo baseline.

**It is reference material, but it is not inert.** The R2 mitigation renders the source's original `.jsx` components beside the ported `.tsx` to diff computed styles, so Vite must be able to resolve them in development. The resolution:

- `design-system/` is **never edited** — it is a verbatim copy, and any change to it means the designer re-exported, which is exactly what FR-019's drift check looks for. `SHA256SUMS` makes that check mechanical.
- Vite's `resolve.alias` maps `@ds/*` to `design-system/*` so the gallery's compare mode can import the source components in development.
- The compare mode is behind `import.meta.env.DEV`, so nothing under `design-system/` reaches a production bundle. Verified by checking that no `design-system/` module appears in `npm run build` output.
- The source's components are plain `.jsx` with no build step of their own, and `allowArbitraryExtensions` / `allowJs` are not required because they are imported only by the dev-only compare harness, which is excluded from `tsconfig.app.json`'s `include`.

So: read-only, and built only in development.

## Component / Module Breakdown

25 components. The 17 published families port from the source's `.jsx`; the 8 shell pieces are promoted from `ui_kits/osrs-web/Chrome.jsx` (D3). All convert from inline style objects to Tailwind utilities (D1).

| Path | Components | Source |
|------|-----------|--------|
| `src/shared/ui/actions/` | `ButtonTemplate`, `ButtonWithIcon`, `SignInButton`, **`Button`** | published ×3 + promoted |
| `src/shared/ui/brand/` | `CoDevRedMasterLogo`, `CoDevWhiteMasterLogo`, `CoDevSupplyRequestsLogo` | published |
| `src/shared/ui/forms/` | `Search` | published |
| `src/shared/ui/data-display/` | `StatusPill`, `SupplyCard`, **`SummaryCard`**, **`TableCard`**, **`TableHead`** | published ×2 + promoted ×3 |

`StatusPill` carries two distinct geometries in one component (FR-009), selected by whether a request/stock status or an availability value is passed:

| Form | Radius | Size | Padding | Used for |
|------|--------|------|---------|----------|
| Request / stock pill | 999px | 12px bold, line-height 100% | 6×10px | `RequestStatus`, `StockStatus` |
| Availability chip | 8px | 11.5px bold, line-height 1.3 | 10px | Catalog `Availability`, on 10% tints |

| `src/shared/ui/overlay/` | `Backdrop` | published |
| `src/shared/ui/icons/` | `MdiLightClipboardText`, `MdiClipboardTextOutline`, `ArrowCircleDownFill`, `ArrowCounterClockwise`, `CaretRight`, `CheckCircleFill`, `GoogleIcon` | published ×7 |
| `src/shared/ui/layout/` | **`TopBar`**†, **`Avatar`**, **`PageHeader`**†, **`SectionTitle`** | promoted ×4 |
| `src/shared/ui/` | `status.ts`, `index.ts` (barrel) | new |

Bold = promoted from UI-kit helper (FR-006); each promotion is logged in `additions.md` for the designer to publish in Figma.

**† These are redesigns, not ports.** The UI kit positions its shell by absolute coordinates — `TopBar` places the logo at `left:32, top:22`, nav at `left:618`, the account cluster at `right:64`; `PageHeader` sits at `left:32, top:121`. Converting that to document flow, and then making it responsive under D2, is new layout design rather than a translation of existing design. `TopBar` and `PageHeader` are therefore budgeted as new work and their layout decisions are logged in `additions.md` for designer ratification. `Avatar` and `SectionTitle` are genuine ports — both are self-contained and carry no absolute positioning.

The same caution applies to any component the gallery composes: the source's screens are absolutely positioned throughout, so no layout geometry should be assumed to survive conversion untouched.

`StatusPills` is renamed `StatusPill` (singular — it renders one pill); recorded in `token-map.md`.

### Text overflow (FR-016a)

The designer sized no dynamic string, so overflow is defined per text role rather than globally. **Designed geometry always wins**: the 436px `SupplyCard`, the 78px request row, the 68px inventory row and the 87px bar never grow to fit content.

| Text role | Rule | Rationale |
|-----------|------|-----------|
| Identifiers (`REQ-2026-1847`, `MON-2238`, `CDV-MS-00087`), status labels, counts, dates | Never truncate; never wrap | Short, fixed-format and load-bearing — a clipped ID is worse than a reflowed row |
| Single-line names — item, requester, model, nav item, account name | Clamp to 1 line with an ellipsis; full text in a `title` attribute | Keeps rows and the bar at their designed heights |
| Card titles (`SupplyCard` name, assigned-asset name) | Clamp to 2 lines with an ellipsis | The card's 18px content block tolerates two lines without changing card height |
| Multi-line prose — rejection reason, purpose | Clamp to 3 lines with an ellipsis, expandable in a detail context | Constitution IV makes the reason mandatory, so it must stay readable rather than being cut to one line |

Every clamped element exposes its full text accessibly, so truncation never removes information from a screen reader. These rules are additions (no source designs them) and are listed in `additions.md`.

### Interaction states (FR-010, FR-011)

Not designed in the source, so defined once and applied uniformly, following the one hover variance the file records:

- hover — ink or fill lightens one step; `--motion-fast` (120ms), `--motion-ease`
- focus-visible — 2px brand-red outline at 2px offset; never removed, never `outline: none`
- disabled — 40% opacity, pointer events off, `aria-disabled`
- no scale, no bounce, no shadow growth

All four are listed in `additions.md`.

### Responsive (FR-012, D2)

Breakpoints are invented and logged in `additions.md`. Fluid-by-default: fixed pixel geometry is kept only above the design width's content box.

- ≥1440: exact source geometry — 87px bar, 32px gutter, 1344px content
- 768–1439: content fluid to `100% - 64px`; `SupplyCard` drops from 436px fixed to fluid
- <768: single column; `TopBar` nav collapses to a disclosure; tables scroll inside their own `overflow-x` container while the page does not
- All interactive targets ≥44×44px below the design width

## Gallery (FR-015, D6)

**FR-016 forbids routing in this feature, and D6 asks for a "gallery route".** These are reconciled by making the gallery the application's only rendered content for now: `src/App.tsx` renders `<Gallery />` directly. Sections are reached by in-page anchors, not by a router. No router is added, no route table exists, and nothing here pre-empts spec 003, which owns routing and will replace `App.tsx`'s body.

```
src/shared/ui/gallery/Gallery.tsx        section shell, anchor nav
src/shared/ui/gallery/sections/*.tsx     one per component family + tokens, type, spacing, status
```

The gallery imports the real components (never copies), so it cannot drift from what ships.

## Project Structure

```
design-system/                      # vendored read-only source (P2)
docs/design-system/
  additions.md                      # FR-018 designer-review list
  token-map.md                      # FR-019 source → token traceability
  content-conventions.md            # FR-017
src/
  assets/{brand,items,login,fonts}/
  styles/
    index.css                       # @import tailwindcss + the below
    fonts.css                       # 12 @font-face
    theme.css                       # @theme — namespace resets + 156 tokens
    utilities.css                   # @utility type-*, ring-*
  shared/ui/                        # 25 components (see above)
  App.tsx                           # renders <Gallery/>
  main.tsx                          # imports styles/index.css
```

Deleted: `src/App.css`, `src/index.css`, `src/assets/{hero.png,react.svg,vite.svg}`, and the starter body of `src/App.tsx`.

## Dependencies

**No new runtime or dev dependencies.** Deliberately: Storybook was rejected in D6, `@fontsource/*` was rejected in favour of committed `.woff2`, and no icon library is needed because the source ships vectors. Constitution VIII is satisfied without an ADR.

## Verification

| Requirement | How it is checked |
|-------------|-------------------|
| FR-002 | The source's semantic aliases survive the port as first-class utilities: brand, surface, border and status keep their names under `--color-*`; the seven text colours keep their meaning under `--color-ink-*`. Screens reference intent (`bg-surface-card`) rather than palette entries (`bg-osrs-white`). |
| FR-003 / SC-001 | Structural — cleared Tailwind namespaces make non-source values unexpressible. Backed by oxlint rules ported from the source's `_adherence.oxlintrc.json` (raw hex, raw `px`, non-DS font-family), scoped to `src/shared/ui/` and future feature code, excluding `src/styles/`. |
| FR-005a / SC-003 | **Computed-style comparison, not screenshot comparison.** The vendored source's original `.jsx` components render alongside the ported `.tsx` in a gallery compare mode; a small harness reads `getComputedStyle` from both and reports any difference in `font-family`, `font-size`, `font-weight`, `line-height`, `color`, `background-color`, `padding`, `border-radius` and `box-shadow`. This catches the half-step weight and 11.5px errors a visual check misses. Results land in `docs/design-system/fidelity-checklist.md`. Needs no new dependency — both component sets already render in the app. Visual side-by-side at 1440px remains as a second pass for anything computed styles cannot express (background images, icon paths). |
| FR-004 / SC-002 | Load the app with the network blocked to third-party hosts; confirm no request leaves the origin and that no fallback face renders. |
| FR-007 / SC-004 | `npm run build` (`tsc -b`) fails on an invalid status, variant, or missing required prop. |
| FR-011a / SC-006 | One-off contrast script over every foreground/background pairing; results recorded in `additions.md`. **Already run — see below.** |
| FR-012 / SC-005 | Gallery checked at 360, 768, 1024, 1440px for horizontal overflow and target size. |
| FR-016a | Gallery renders every affected component twice — realistic data and deliberately overlong data — and the designed height or width must be identical in both. |
| FR-009 | Both `StatusPill` geometries appear side by side in the gallery's status section and are compared against the source's `status-vocabulary.card.html`. |
| FR-011 / SC-006 | Keyboard walk of the gallery: every interactive element reachable with a visible focus indicator. |
| FR-018 / SC-007 | One document, `docs/design-system/additions.md`, carries every addition — motion tokens, the seven renames, four interaction states, breakpoints, eight promotions, two redesigns, overflow rules, and the two AA contrast failures. Reviewed as a single list, not scattered across files. |
| SC-008 | Exit criterion rather than a check: spec 001's UI tasks can begin when the gallery renders all 25 components and `additions.md` is complete, because every visual question is then either answered by a token or listed for the designer. |

### Contrast results (FR-011a), already measured

13 of 15 key pairings meet WCAG 2.1 AA. Two fail and, per FR-011a, are **flagged to the designer and not recoloured**:

| Pairing | Ratio | Needs | Note |
|---------|-------|-------|------|
| Muted / caption — `--osrs-gray-400` on white, 11px | 3.24 | 4.5 | Clear fail |
| Eyebrow + ALL-CAPS table heading — `--osrs-gray-500` on `--osrs-surface-table-header`, 11px bold | 4.44 | 4.5 | Marginal; a one-step darkening would clear it |

## Implementation Sequence

1. **P1 + P2** — enable `strict`, vendor the design-system source
2. **Assets + fonts** — copy binaries, download the 12 faces, write `@font-face`, verify offline (SC-002)
3. **Vertical slice** — prove the whole chain on one component before bulk work: the handful of tokens `Button` needs, the namespace resets, one `@utility` type role, `Button.tsx`, one gallery section, and the computed-style comparison against the source. If any link in that chain is wrong, it is wrong here, while it is cheap.
4. **Tokens** — the remaining tokens to 156 total, all `@utility` roles and rings, `token-map.md` (SC-001)
5. **Primitives** — `status.ts`, icons, logos, `StatusPill`, `Search`, `Backdrop`
6. **Composites** — `SupplyCard`, `SignInButton`, `ButtonTemplate`, `ButtonWithIcon`, table and summary pieces
7. **Shell pieces** — `Avatar`, `SectionTitle` (ports); `TopBar`, `PageHeader` (redesigns, R1)
8. **Gallery** — sections per family; replace the Vite starter
9. **States + responsive + overflow** — hover/focus/disabled, breakpoints, 44px targets, the FR-016a clamp rules
10. **Verification + docs** — computed-style pass, keyboard walk, `additions.md`, `content-conventions.md`

Steps 5–7 are parallelisable across developers once step 4 lands. Step 4 is the hard serialisation point, which is why step 3 exists: the slice validates the chain before anyone is blocked on it.

## Known Risks

Raised in the red-team pass and **accepted** rather than mitigated.

| Risk | Why it is accepted | What to watch |
|------|--------------------|---------------|
| **R5 — Gallery-only validation.** Every component is verified in isolation; none is exercised inside a real composed screen until spec 003 builds the shell. Composition problems (a fixed 436px card inside a fluid grid, a `TopBar` assuming full-viewport width) would surface only then. | Spec 002 explicitly excludes product screens (FR-016), and building a composed screen here would duplicate work spec 003 owns. The gap is one feature wide, not an open-ended one. | If spec 003's first screen needs changes to components rather than just layout around them, treat that as evidence the isolation boundary was drawn too tightly, and add a composed smoke page to the gallery retroactively. |

## Analysis Overrides

None dismissed. The CRITICAL finding (FR-016a uncovered) and all three MEDIUM/LOW findings were resolved into the plan.

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Implements spec 002 only; every section maps to an FR |
| II. Three Distinct Human Roles | N/A | No role logic in this feature |
| III. Inventory Integrity | N/A | No inventory logic |
| IV. Explicit Request State Machine | PASS | `RequestStatus` is the six legal states; illegal states unrepresentable (D5) |
| V. Notification Completeness | N/A | No notifications |
| VI. Independently Testable Increments | PASS | The gallery demonstrates the whole feature with no sibling story |
| VII. Typed Contracts | PASS | Conditional on P1 (`strict`). No `any`. No invented REST shapes — no HTTP at all |
| VIII. MVP Restraint | PASS | Zero new dependencies; no ADR required |
| IX. Secrets and Internal Data | PASS | No secrets, no credentials, no network |

No justified violations.
