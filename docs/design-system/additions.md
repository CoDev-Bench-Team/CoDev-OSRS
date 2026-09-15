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
| **Disabled** | 40% opacity, pointer events off, out of the tab order. Set explicitly; option count has no bearing on it. | The source's one precedent: `ButtonTemplate`'s "saved" state sits at 40% opacity. Two variations were tried for the single-option case and both removed — a lighter "soft" state read as enabled-and-broken, and disabling on option count alone was unhelpful: a select with one option opens and shows it, the way a native select does. |
| **Focus-visible** | 2px brand-red outline at 2px offset, never suppressed. | Nothing in the source. Without it the product is unusable by keyboard. |
| **Disabled** | 40% opacity, pointer events off. | The source's one precedent: `ButtonTemplate`'s "saved" state sits at 40% opacity. |
| **Motion tokens** | `--motion-fast` 120ms, `--motion-base` 180ms, `--ease-osrs`. | Shipped in the design system's own token files as a flagged addition. |
| **Text overflow** | Identifiers and status never clamp. Names clamp to 1 line, card titles to 2, rejection reason and purpose to 3. Designed geometry always wins. | No source designs a long string. Rejection reason stays readable because constitution IV makes it mandatory. |
| **Fixed quantity slot** (`SupplyCard` stepper) | The number sits in a slot fixed at three tabular digits (`min-w-[3ch] tabular-nums`), so 1 → 10 → 100 moves nothing; it grows only past 999. | Requested by the project owner, 2026-09-14: the source draws only "1" at natural width, so the stepper widened and the button shrank with every added digit. Stock bounds a request, so three digits cover the range. Recorded as a named exception in `compare-pixels.mjs`. |
| **Stepper signs centred and paired** (`SupplyCard`) | The `-` / `+` buttons are 22px squares, not the source's glyph-plus-padding boxes (22.5 and 25.4 wide). Two pixels of bottom padding lift the sign to the optical centre: Inter puts the baseline at 16.06px in a 22px box and the signs' ink centres 4.04px above it, so an unpadded centred line box paints them 1px low. The decrement is the minus sign U+2212, which matches `+` in width (9.42px) and axis; the source's hyphen is a 6.5px dash on the x-height axis. Gap between sign and number is 4px, not 8, because the three-digit slot already supplies slack. Net: stepper 82×26 at 1440 against the source's 74×26; the primary button keeps its 304px. | Requested by the project owner, 2026-09-14: the signs read as off-centre and the number as over-spaced. Every figure above was measured with canvas `measureText`, not judged by eye. Recorded as a named text exception in `compare-fidelity.mjs` and in the `SupplyCard` pixel allowance. |

## 2b. The two handover labels on `Released`

A `Released` pill can read "Ready for Pickup" or "For Delivery" instead of
`Released`. Both are presentational only — the request is `Released` either way,
and `RequestStatus` still admits nothing but the six legal states (spec 002 D5,
amended 2026-09-14). Each label carries its own colour pair rather than the
green "ready" tone, so the handover mode is readable at a glance.

| Label | Ink | Fill | Provenance |
|-------|-----|------|------------|
| Ready for Pickup | `#235EA7` — `--osrs-blue-700` | `#EDF5FF` — `--osrs-blue-50` | **Both are source primitives**, used unchanged. The source defines them but pairs them in no component. |
| For Delivery | `#EF5DA8` — new `--osrs-pink-500` | the same pink at 10% — new `--osrs-pink-tint` | **Not in the source.** The palette has no pink at all. Specified by the project owner, 2026-09-14. |

**This is the first colour outside the amber / green / red status vocabulary.**
That vocabulary is stated in the gallery as fixed: amber waits on a human, green
is moving or done, red is stopped. The handover labels step outside it on
purpose — they describe *how items reach the employee*, not where the request
sits — but the rule now has an exception and the designer should ratify both the
exception and the pink.

### Contrast

Measured the same way as §4.1, at the pill's own 12px bold, on the surfaces the
pill actually sits on. 12px bold is not "large text" under WCAG 2.1, so the
threshold is 4.5.

| Pairing | Ratio | Needs | Note |
|---------|-------|-------|------|
| `#235EA7` on `#EDF5FF` | **5.91** | 4.5 | Passes. |
| `#EF5DA8` on its own 10% tint over white | **2.77** | 4.5 | **Fails.** On plain white it is 3.09 — still short. |

Reported, not changed, per FR-011a. The ratio is a property of the specified
pink itself: no fill makes it pass at 12px, so clearing 4.5 needs a darker ink
(around `#B02A6E` at this fill). Flagged for the designer alongside the two
source failures in §4.1.

## 3. Invented layout — the largest judgement calls

| Addition | What was decided |
|----------|------------------|
| **Responsive breakpoints** | Exact source geometry at ≥1440. Fluid 768–1439. Single column below 768. The source has only the 1440 frame, so every breakpoint here is invented. |
| **44px minimum touch target** | Below the design width. `--spacing-touch-target`. Applied as a minimum box size on links, buttons and fields. The one control the source draws smaller than 44px — the stepper's 22px `-` / `+` — is exempt from the box rule and meets the minimum with an invisible, centred 44px pseudo-element instead (`hit-area` in `utilities.css`), so the stepper keeps its 1440 geometry at every width. |
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

## 3c. A stacking order

The source is a static file. It draws one scrim and nothing that overlaps
anything else, so it defines no layering. Without one, a portalled dropdown and
a modal scrim land in the same layer and whichever happens to declare a
`z-index` wins — which is how the dropdown came to float above the tint.

| Token | Value | Layer |
|-------|-------|-------|
| `--z-index-sticky` | 10 | Chrome that stays put while content scrolls |
| `--z-index-backdrop` | 40 | The modal scrim |
| `--z-index-dialog` | 50 | Dialog content, above its own scrim |
| `--z-index-popover` | 60 | Dropdown panels |
| `--z-index-toast` | 70 | Transient notices |

**A popover sits above a dialog on purpose**, because a select inside a dialog
has to be usable. That ordering cannot also keep a popover left open *elsewhere*
off a new scrim — the two cases are indistinguishable by z-index alone. So a
scrim explicitly dismisses any open popover when it mounts
(`overlay/popover-layer.ts`). Both halves are covered by a regression check.

## 3d. The application shell (spec 003)

Everything in this section is new design. The source draws **screens**, not an
application: it has no loading, empty, error, not-found or forbidden state
anywhere, no sign-out control, no narrow-width navigation, and it merges
Approver and Supply Admin into a single "Admin" identity that constitution II
forbids. The shell could not be built without inventing all of it. Nothing here
introduces a colour, type size, radius or shadow that is not already a token
(spec 003 FR-021, SC-008).

### The five feedback surfaces

All five share ONE invented layout — a card on the page surface carrying an
eyebrow chip, a title, one sentence of explanation and a route back — rather
than five separate inventions. The card is the system's own structural
container (radius 10, card surface, card shadow); the type is the existing page
title and body roles; the chip reuses the status vocabulary's tints.

| Surface | Eyebrow | Tone | Why it exists |
|---------|---------|------|---------------|
| `LoadingState` | — | — | FR-018. Three brand dots on the page surface, fading with the platform's pulse and suppressed under `prefers-reduced-motion`. The label, not the dots, is what a screen reader announces. Not an ad-hoc spinner: the source has no spinner to copy. |
| `NotFoundScreen` | NOT FOUND | neutral | FR-012. Echoes the address back, because a mistyped link must stay diagnosable. |
| `RecordUnavailableScreen` | UNAVAILABLE | neutral | FR-012a. The **shared** response for "this request does not exist" and "this request is not yours". Identical words in both cases, and the identifier is deliberately never echoed, so request ids cannot be enumerated by reading the difference. |
| `ForbiddenScreen` | NO ACCESS | stopped (red tint) | FR-011. Names the role you hold, because the fix is to sign in as the other one — there is no switcher (D5). |
| `Placeholder` | NOT BUILT YET | info (blue tint) | FR-020. Must not be mistakable for not-found, an error, or an empty result, so it says which screen this is and that the screen's own feature has not shipped. |
| `ErrorBoundary` fallback | ERROR | stopped | FR-019. Renders inside the shell, so the bar and navigation survive a screen that throws. |

The red tint on a refusal and the blue on a placeholder are the existing status
colours (`--color-status-rejected-*`, `--color-status-info-*`) used for a new
purpose. **This widens the status vocabulary's reach beyond request status** —
worth the designer's ratification alongside the handover labels in §2b.

### The sign-out control

Not drawn anywhere in the source. Placed in the account cluster, at the right
end of the top bar, as the system's `ghost` button. Its placement, its label
("Sign Out", Title Case per the content conventions) and its very existence are
ours.

### Three navigation sets, not the source's one

The file draws `[Catalog, My Requests, Profile]` for the Employee and
`[Requests Queue, Inventory]` for a merged "Admin". Constitution II forbids that
merge, so navigation is derived per role from the `ARCHITECT.md` §7
authorization matrix:

| Role | Navigation |
|------|-----------|
| Employee | Catalog · My Requests · Profile (as drawn) |
| Approver | Requests Queue · Catalog · Profile |
| Supply Admin | Fulfillment · Inventory · Catalog · Profile |

The Approver and Supply Admin sets are **undesigned**, and "Fulfillment" names a
queue the file never draws at all.

### Collapsed navigation below 768px

The source has no mobile frame. Below `md` the navigation collapses into a
"Menu" disclosure that opens a full-width list under the bar; the account
cluster, the request-list marker and sign-out stay in the bar at every width.
Carries forward the responsive commitment in §3.

### The bar now starts at the 32px gutter it always claimed

`TopBar` capped at the 1344px **content** width and centred, which at the 1440
design width put the logo at x=80 — contradicting the 32px gutter this document
records as preserved. It now spans the 1440 page width with a 32px gutter, so
the logo sits at x=32 exactly as drawn, and the page content below it sits on
the same grid. The source reaches its 1344 of content from an **asymmetric**
pair of gutters (32 left, 64 right, measured from the frame); a symmetric flow
layout cannot reproduce that, so the content runs 1376 wide instead. The
designer should confirm the symmetric gutter.

### A third avatar colour

The file designs two identities — Maya Santos (orange) and Ethan Cruz (green).
The seeded Approver, Samantha Reyes, needs a third and uses the source's
`--osrs-blue-600`. A palette colour, a new use.

### The sign-in card, composed in flow

The card keeps the source's own fixed dimensions (421×500), its radius 24, its
card shadow and its four elements, but stacks them in flow rather than by
absolute coordinate — the same redesign already applied to `TopBar` and
`PageHeader` in §3. The Google pill's hairline ring moved to a 1px wrapper: an
inset shadow paints beneath its children, and the control's own icon and label
panels are opaque white, so on the button itself the ring showed only in the
gaps between them.

### A seeded account chooser on the sign-in screen

Below the card, a second small card lets a tester choose which seeded demo
account signs in — the stand-in for Google's account chooser, and the only way
to reach all three roles while the backend contract is unpublished. It is **not**
a role switcher (D5): it chooses who signs *in*, and changing role still means
signing out and back in. It renders only while the active session source offers
demo accounts, so it disappears by itself the day a real one replaces it.

---

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
9. Ratify the application shell in §3d: the five feedback surfaces and their use
   of the status tints, the sign-out control, the Approver and Supply Admin
   navigation sets, the collapsed navigation, the symmetric 32px gutter, and the
   third avatar colour.
