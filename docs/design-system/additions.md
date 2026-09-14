# Additions — for designer review

Everything here is **not** in `Office Supplies Request System (OSRS).fig`. Each
exists because the system could not be used without it. Nothing invents a new
visual language, but every item needs ratification (spec 002 FR-018, SC-007).

Grouped by how much judgement each required.

---

## 1. Forced by the toolchain — no visual decision

| Addition | Detail |
|----------|--------|
| **24 token renames** | Values identical; names changed only where the source name could not survive the port. Full list in [token-map.md](token-map.md). The sharpest case: seven text *colours* (`--text-body`, `--text-primary`…) collided with the font-size namespace where `--text-11`–`--text-32` live. They became `--color-ink-*`. |
| **`--spacing-0: 0px`** | Zero is not a design value, but `inset-0` and `min-w-0` derive from the spacing scale, which the port clears. |
| **`StatusPills` → `StatusPill`** | Renders one pill. Singular. |

## 2. Required for a usable product — the source designs none of these

| Addition | What was decided | Basis |
|----------|------------------|-------|
| **Hover** | Ink or fill lightens one step, 120ms, eased. No scale, no bounce, no shadow growth. | The one hover variance the file records: `ButtonWithIcon` lightens ink from `rgb(73,76,80)` to `rgb(111,121,133)`. |
| **Focus-visible** | 2px brand-red outline at 2px offset, never suppressed. | Nothing in the source. Without it the product is unusable by keyboard. |
| **Disabled** | 40% opacity, pointer events off. | The source's one precedent: `ButtonTemplate`'s "saved" state sits at 40% opacity. |
| **Motion tokens** | `--motion-fast` 120ms, `--motion-base` 180ms, `--ease-osrs`. | Shipped in the design system's own token files as a flagged addition. |
| **Text overflow** | Identifiers and status never clamp. Names clamp to 1 line, card titles to 2, rejection reason and purpose to 3. Designed geometry always wins. | No source designs a long string. Rejection reason stays readable because constitution IV makes it mandatory. |

## 3. Invented layout — the largest judgement calls

| Addition | What was decided |
|----------|------------------|
| **Responsive breakpoints** | Exact source geometry at ≥1440. Fluid 768–1439. Single column below 768. The source has only the 1440 frame, so every breakpoint here is invented. |
| **44px minimum touch target** | Below the design width. `--spacing-touch-target`. Applied as a minimum box size on links, buttons and fields. The one control the source draws smaller than 44px — the stepper's 22px `-` / `+` — is exempt from the box rule and meets the minimum with an invisible, centred 44px pseudo-element instead (`hit-area` in `utilities.css`), so the stepper keeps its 73×26 geometry at every width. |
| **`TopBar` redesign** | The source positions it absolutely — logo (32,22), nav x=618, account right:64. Converted to flow layout with a centred nav that wraps below `md`. Preserved exactly: 87px height, white surface, hairline ring, 32px gutter, brand red on the current item, 31px divider. |
| **`PageHeader` redesign** | Source places it at (32,121) absolutely. Now a flow block with the same 32/1.3 title, 8px gap and 14/1.5 subtitle. |
| **8 promotions** | `TopBar`, `Avatar`, `PageHeader`, `SummaryCard`, `Button`, `TableCard`, `TableHead`, `SectionTitle` were drawn as frames inside the UI kit, not published as components. They are first-class components here. **Worth publishing in Figma** so future exports stay in sync. |

## 3b. Controls made real

The export draws several controls as static shapes. Reproducing them literally
would ship a catalog nobody can use, so these are implemented as real controls
with the same visual box.

| Control | Was | Now |
|---------|-----|-----|
| **Model select** (`SupplyCard`) | A `div` with a `⌄` character. Not focusable, not operable, no options. | A custom `Select` implementing the ARIA listbox pattern, with an overlay panel styled from the design system rather than drawn by the OS. New props: `models`, `onModelChange`. |
| **Dropdown affordance** | The `⌄` character (U+2304). Its ink is 15px tall inside a 12px line box, so it overflowed its own box and its size and vertical position depended on line-box rounding. | MDI `chevron-down` at 20px, optically centred, 16px from the right edge, rotating 180° when open. The readme prescribes MDI for an icon the file does not define, so this stays in register. |

### Why the select is custom rather than native

A native `<select>` gives keyboard operation, type-ahead and screen-reader
semantics for free, but its dropdown is drawn by the operating system and cannot
be styled. The requirement was an overlay matching the design system, so all of
that had to be reimplemented rather than inherited:

- combobox trigger with `aria-expanded`, `aria-controls`, `aria-activedescendant`
- Enter, Space and Arrow keys open; arrows move; Home and End jump; Escape closes
- type-ahead jumps to the first option matching what you type
- focus returns to the trigger on close, so Tab order is never lost
- the panel is **portalled to `<body>`** and positioned `fixed`

That last point is not a detail. `SupplyCard` clips its content with
`overflow-hidden` to round the image corners, which cut the panel off inside the
card — only two of four options were reachable. No `z-index` escapes a clipping
ancestor; the panel has to leave the subtree entirely. It flips above the trigger
when there is no room below, and closes on outside scroll.

Each of these is behaviour the platform was providing before. Anything not
listed here is behaviour that was lost.

## 4. Defects found in the source — flagged, not fixed

Per FR-011a, a source value that fails a threshold is reported rather than
silently changed.

### 4.1 Two contrast pairings fail WCAG 2.1 AA

Measured across 15 key pairings; 13 pass.

| Pairing | Ratio | Needs | Note |
|---------|-------|-------|------|
| Muted / caption — `--osrs-gray-400` on white, 11px | **3.24** | 4.5 | Clear fail. |
| Eyebrow and ALL-CAPS table heading — `--osrs-gray-500` on `--osrs-surface-table-header`, 11px bold | **4.44** | 4.5 | Marginal. One step darker clears it. |

Both are unchanged in the code.

### 4.1b Search placeholder colour

The source's `Search` leaves the placeholder unstyled, so it renders Chrome's
user-agent default — `oklab(0 0 0 / 0.5)`, a translucent black that changes with
the browser. That is a browser default, not a design decision.

The port uses the design system's own `--text-secondary`. **This is a deviation
from the source's rendering**, kept because a tokenised grey is deliberate where
a UA default is not, and because the semantic alias exists for exactly this.
Worth confirming with the designer, or specifying a placeholder colour in Figma.

### 4.1c The quantity stepper looked wrong — resolved, not a source defect

**Reported by the project owner against the UI kit, 2026-09-14.** The stepper
rendered noticeably larger than the kit's. The first diagnosis blamed the
extraction; that was wrong. The port matches `SupplyCard.jsx` exactly at 1440
(73×26, `--osrs-canvas`, radius 4, padding 2, gap 8), and the kit is the same
component from the same bundle, so the two could not differ there.

The difference appeared at any viewport **below 1440**: the §3 touch-target
rule set `min-inline-size` / `min-block-size: 44px` on every button, which grew
the 22px `-` / `+` to 44×44 and the stepper to 113×48. The kit has no such
rule, and the fidelity gates run only at 1440, so neither showed it.

Fixed by exempting the stepper buttons from the box rule and giving them the
44px hit area as a pseudo-element (§3). The responsive gate now measures the
hit area, not the box, so the requirement still holds. The lesson stands in a
narrower form: the gates prove fidelity at 1440 only; an addition that applies
below it can still change designed geometry, and only viewing the port at a
real window size catches that.

### 4.2 The Google mark renders monochrome

`GoogleIcon` carries four paths — the real mark is four-colour — but the source
fills all four with `--osrs-google-red`. The design system's own readme says the
Google asset must never be restyled, so the export contradicts its own rule.
Ported faithfully; **should be corrected at source**.

---

## Open questions for the designer

1. Ratify or replace the responsive breakpoints in §3 — they are ours, not yours.
2. Publish the eight promoted components as real Figma components.
3. Fix the two contrast pairings in §4.1, or accept them explicitly.
4. Restore the Google mark's four colours in §4.2.
5. Confirm the search placeholder colour in §4.1b, or specify one in Figma.
6. Ratify the stepper's pseudo-element hit area (§3, §4.1c) as the way small
   controls meet the 44px minimum below the design width.
7. Adopt the token names in [token-map.md](token-map.md) as Figma Variables — the
   source defines only two, so the whole palette and type scale are currently
   raw values in frames.
8. Design the gaps that block later work: the Supply Admin's prepare/release
   screen, the five notification emails, and loading / empty / error states.
