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
| **44px minimum touch target** | Below the design width. `--spacing-touch-target`. |
| **`TopBar` redesign** | The source positions it absolutely — logo (32,22), nav x=618, account right:64. Converted to flow layout with a centred nav that wraps below `md`. Preserved exactly: 87px height, white surface, hairline ring, 32px gutter, brand red on the current item, 31px divider. |
| **`PageHeader` redesign** | Source places it at (32,121) absolutely. Now a flow block with the same 32/1.3 title, 8px gap and 14/1.5 subtitle. |
| **8 promotions** | `TopBar`, `Avatar`, `PageHeader`, `SummaryCard`, `Button`, `TableCard`, `TableHead`, `SectionTitle` were drawn as frames inside the UI kit, not published as components. They are first-class components here. **Worth publishing in Figma** so future exports stay in sync. |

## 3b. Controls made real

The export draws several controls as static shapes. Reproducing them literally
would ship a catalog nobody can use, so these are implemented as real controls
with the same visual box.

| Control | Was | Now |
|---------|-----|-----|
| **Model select** (`SupplyCard`) | A `div` with a `⌄` character. Not focusable, not operable, no options. | A native `<select>` with `appearance-none`, so the source's own `⌄` still shows. Gains keyboard control, type-ahead, screen-reader semantics and the platform picker on mobile. Renders within 0.01% of the original in the pixel diff. New props: `models`, `onModelChange`. |
| **Chevron alignment** | The `⌄` glyph's ink is 15px tall inside a 12px line box, so it overflowed its own box and its position was unpredictable. | Placed in a 16×16 box with the ink centred, 16px from the right edge. Optical centre now within 0.5px. |

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

### 4.1c The quantity stepper's size and spacing are wrong

**Reported by the project owner against the Figma frame, 2026-09-14.** The port
reproduces `SupplyCard.jsx` exactly — 73×26, `--osrs-canvas`, radius 4, padding
2, gap 8 — confirmed by computed-style diff. So the error is in the **extraction
that produced this design system**, not in the port. Correct values are still
needed from the Figma inspect panel.

**This matters beyond the stepper.** Every fidelity gate in this repository
compares the port against the extraction. Where the extraction is wrong, the
gates confirm a faithful copy of a wrong value and report success. They prove
the port is correct *with respect to the design system*, never with respect to
Figma. Only a human comparing against the real frames can catch this class of
error — and one instance is now confirmed, so others are likely.

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
6. **Supply the stepper's real dimensions** (§4.1c) — and re-check the rest of
   the extraction, since it is now known to be unfaithful in at least one place.
7. Adopt the token names in [token-map.md](token-map.md) as Figma Variables — the
   source defines only two, so the whole palette and type scale are currently
   raw values in frames.
8. Design the gaps that block later work: the Supply Admin's prepare/release
   screen, the five notification emails, and loading / empty / error states.
