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
| **`TopBar` redesign** | ~~Converted to flow layout with a centred nav.~~ **Superseded 2026-09-15**: the bar is now a port of the `Top Navigation` component (88:22807), matching the frame to within a pixel at 1440. See §3d. |
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

## 3d. The 2026-09-15 frames — newer than the vendored export

Four frames were built against the **live Figma file** rather than
`design-system/`: `01 - Login` second variant (28:2673), `03 - Inventory`
(113:27060), `04 - Add Item` (113:27374) and `04 - Update Item` (113:28004).

The vendored export was taken on 2026-09-12 and does not contain them. That is
drift in the sense of §1 of [DESIGN.md](../../DESIGN.md) — the export and the
file no longer agree — and the response is the documented one: re-vendor, diff
`SHA256SUMS`, reconcile the token map. Until that happens, the values below come
from the file and have no entry in `token-map.md`.

### Values the frames state and the token export does not carry

| Value | Where | Note |
|-------|-------|------|
| **22px display size** | The item drawer's heading | Between the 19px section title and the 28px metric. Rendered as `text-[22px]`; wants a token. |
| **39px control height** | Every field in the drawer | The system's control heights are 46 and 42. |
| **6px radius, warm 1px border on inputs** | Every field in the drawer | The system's inputs are ringed, not bordered (`DESIGN.md` §6). The frames draw a real border in `--color-osrs-border-warm`, so that is what shipped. |
| **48px table header** | The inventory table | The library's `TableHead` is 41px and has no alignment control, so this header is inlined in the feature — as the source's own inventory screen does. |
| **400px drawer, 371px content column** | Both item frames | Fixed panel geometry, no token. |
| **36px / 4px-radius pagination controls, 14px on 20px text** | The inventory pager | An imported control, like `ButtonTemplate` — see below. |

### Decisions made while porting them

| Decision | Detail |
|----------|--------|
| **Two greys substituted in the pager** | The imported pagination component carries its own near-black text grey and pale border grey, which the OSRS palette does not have. Raw hex is a build failure and two new tokens for one imported control would be worse, so they render as `ink-strong` and `line-default`. The one place on these screens where a drawn colour is not reproduced exactly. |
| **heroicons chevrons ported** | The pager's three chevrons are heroicons-mini, not MDI. Transcribed from the exported paths rather than substituted, and repainted with `currentColor`. |
| **bytesize close glyph ported** | The drawer's dismiss control. The export ships no close icon. |
| **Field labels sit on a normal line box** | 11px bold, but not the eyebrow role's 100% line height: the drawn label occupies 13px, and those 2px are what keep a column of fields on the frame's 58px rhythm. |
| **Asymmetric gutters, as drawn** | The frame insets the bar's row 32px left and 75px right, and the content column 32px left and 64px right — so neither is centred. Both are reproduced exactly at ≥1440 and go symmetric (32/32) below it, where the frame says nothing. Measured against the frame: bar 87px, title at (32,121), table at (32,337) and 1344px wide. |
| **The pager is pinned near the bottom edge** | The frame places it at y=894 of its 1024 canvas rather than under the table, so it is pushed to the bottom of the viewport here and lands at the drawn position at the design size. |
| **Subtitle keeps its full stop** | `content-conventions.md` says subtitles take no period; this frame's subtitle ends with one. The designer's copy won. Worth reconciling. |
| **"+ Add custom field" adds a numbered spec row** | The frame draws the control but not what it produces. |
| **Update prefills from the row** | The two frames are otherwise identical, and the Update frame shows the same empty placeholders as Add. Prefilling the item's name, category and stock is what "update this item" means. |

### The Admin bar — adopted verbatim, 2026-09-15

The frames carry an **Admin** account cluster and the navigation
`[Requests Queue, History, Inventory]`, plus a bell with a count of 3. The
project owner asked for that bar exactly, so it is what the Supply Admin sees:

| Drawn | Shipped | Note |
|-------|---------|------|
| `[Requests Queue, History, Inventory]` | the same three | Catalog and Profile remain *reachable* for this role — the authorization matrix grants both — but they are not in the bar. Navigation and authorization are separate questions. |
| Account cluster reads **Admin** | the same | A caption, not a role. `Role` is still the closed union of `employee`, `approver` and `supply_admin`, the guards still authorize against `supply_admin`, and no approval action is reachable from this bar — which is what constitution II and [ADR-0003](../adr/0003-three-role-model.md) forbid collapsing. One line in `session-source.ts` restores "Supply Admin". |
| Bell with a count of 3 | the same | Presentational sample data, like the screen's 238 and 1,250. Notifications are sent by the API and spec 003 FR-024 keeps them out of the shell, so there is nothing to open yet. |
| No sign-out anywhere | inside the account cluster | FR-016 requires one; putting it behind the cluster keeps the bar's drawn silhouette. |

Constitution I asks that a chat instruction contradicting a spec be recorded as
an amendment rather than applied silently: this supersedes spec 003's D1 for the
Supply Admin's navigation set only. The Employee's and Approver's sets still come
from the authorization matrix, and still have no drawn source.

## 3e. The shell's own states (spec 003)

None of these is drawn anywhere in the file: a **loading** state while the
session resolves, a **not-found** screen, a **forbidden** screen, a
**placeholder** for a destination whose feature has not shipped, a **sign-out**
control in the account cluster, and a third **avatar colour** for the Approver
(the file designs two identities). Each is built from existing tokens and
components and introduces no new visual value.

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
4. Restore the Google mark's four colours in §4.2. **Confirmed 2026-09-15**: the
   live Figma file's `Google Icon` exports with all four brand colours, so the
   monochrome render is an artefact of the 2026-09-12 export, not the design.
   The port still reproduces the export, per FR-011a — fix it at source and
   re-vendor rather than patching it here.
5. Confirm the search placeholder colour in §4.1b, or specify one in Figma.
6. Ratify the stepper's pseudo-element hit area (§3, §4.1c) as the way small
   controls meet the 44px minimum below the design width.
7. Adopt the token names in [token-map.md](token-map.md) as Figma Variables — the
   source defines only two, so the whole palette and type scale are currently
   raw values in frames.
8. Design the gaps that block later work: the Supply Admin's prepare/release
   screen, the five notification emails, and loading / empty / error states.
9. Ratify or replace everything in §3d and §3e — the four 2026-09-15 frames are
   newer than the vendored export, so none of their values is in the token map.
10. Decide the content column: the frames' 1344px table against the top bar's
   own alignment (§3d).
