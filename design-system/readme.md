# OSRS Design System

The design system for the **Office Supplies Request System (OSRS)** — an internal platform built by **Codev** to replace a manual, chat-and-email office-supplies request process with a centralised, automated pipeline.

The product is a single web app at 1440×1024 with three roles on two surfaces:

- **Employee (requestor)** — Catalog, Request List, My Requests, Profile
- **Approver (team lead / dept head)** — Requests Queue, Review Request, Reject confirmation
- **Supply Admin (IT / general services)** — Requests Queue, Inventory management

A fourth actor, **System**, is invisible: it deducts inventory on submission, restores it on rejection, and emails a notification at each of the five pipeline transitions (Submitted → Approved / Rejected → Ready for Pickup / Released → Completed).

## Sources

| Source | Detail |
| --- | --- |
| Figma file | `Office Supplies Request System (OSRS).fig`, mounted as a read-only virtual filesystem. Pages: **Mockups** (18 frames — the current design) and **Archive** (21 frames — superseded explorations, not used here). |
| Written brief | The OSRS MVP proposal supplied in chat: problem, opportunity, four-stage pipeline, role model, 4-week plan, React + TypeScript / Node + Express / PostgreSQL / Playwright stack. |
| Codebase | None provided. Every value here was read out of the .fig, never inferred from an implementation. |

No public Figma URL or GitHub repo was given. If you have them, add them here so the next person can re-sync.

---

## CONTENT FUNDAMENTALS

**Voice: plain, operational, second-person-implied.** The product tells you what a screen is for and then gets out of the way. It never sells, never apologises, never jokes.

**Casing is a three-tier system and it is strict:**

- Page titles are **sentence case**, even multi-word ones: "Inventory management", "Supply Catalog", "Requests Queue", "My Requests", "Profile".
- Buttons, status pills and nav items are **Title Case**: "Add to Request List", "Review", "Confirm Rejection", "Update stock" (note: "Update stock" is sentence case — it is a link, not a button), "Pending Approval", "Ready for Pickup".
- Table column headings and card eyebrows are **ALL CAPS**: "REQUEST ID", "REQUESTER", "ITEMS", "SUBMITTED", "ACTION", "TOTAL STOCK", "RESERVED / PENDING", "DEVICES".

**Subtitles are one sentence, no period.** They state what the user can do on the page:

> "Review, approve, and fulfill supply requests"
> "Monitor stock levels, manage reservations, and keep office essentials ready for every team"
> "Browse available equipment and office essentials. Inventory updates in real time."
> "Your details and currently assigned supplies"

(The catalog subtitle is the one two-sentence exception, and it is set at 32px display size — it functions as the page title.)

**Buttons are imperative verb phrases naming the object:** "Add to Request List", "Submit Request", "Approve Request", "Confirm Rejection", "+ Add Catalog Item". Never "Submit", never "OK", never "Yes / No". Destructive confirmations restate the act ("Confirm Rejection"), they don't say "Are you sure?".

**Placeholders show a real example, lower-case, with a trailing ellipsis when open-ended:** "e.g item on hold, insufficient justification...", "Search supplies by name or category", "Search inventory by item name or code".

**IDs and codes are load-bearing content.** Requests are `REQ-2026-1847`. Inventory items are `MON-2238`, `ACC-0921`, `IT-DEV-1042`, `CBL-1106` — a three-letter category prefix and a four-digit number. Assigned assets are `CDV-MS-00087` (company, owner initials, sequence). Always render an ID in Inter 700 so it reads as an identifier, not prose.

**Dates are "Sep 8, 2026"** — three-letter month, no leading zero, comma. Timestamps append " at 9:42 AM". A requester line joins the two with a bullet: "Maya Santos • Submitted Sep 11, 2026 at 9:42 AM".

**Counts are stated plainly and never rounded:** "Showing 6 of 108 inventory items", "2 Low stock alerts". Summary-card labels are sentence case and unpunctuated: "Pending approval", "Available units", "Low stock alerts".

**No emoji anywhere.** Not in copy, not in status, not as iconography. The only non-alphanumeric glyphs in the whole file are the "⌄" chevron in the model select and the "-" / "+" in the quantity stepper.

**Sample names are Filipino and the office is Davao** — Maya Santos, Ethan Cruz, Samantha Reyes, Daniel Santos, Isabella Mendoza; "mayas@codev.com • Davao Office". Keep that register when you write new sample data.

---

## VISUAL FOUNDATIONS

**One accent, and it is red.** `--osrs-red-600` (`rgb(198,40,40)`) is the product's entire chromatic identity: the Codev wordmark, the active nav item, every primary button, the item-count badge, the current-page chip, every inline link-action ("Update stock", "View details →"), and the big number on every summary card. A second red, `--osrs-red-500` (`rgb(204,47,74)`), appears on a handful of buttons ("+ Add Catalog Item", the catalog card's add button) — it is a real, deliberate variance in the source, not a mistake; both are tokenised. Nothing else in the UI is coloured except status.

**The page is warm off-white, the cards are pure white.** `--osrs-canvas` is `rgb(250,250,249)` — a stone-tinted white, not a grey. Cards, the top bar and the search field are `#fff`. Table headers are a cool `rgb(240,242,245)`. That warm-page / cool-header pairing is the signature; do not flatten it to one grey.

**Type is a two-family split with no overlap.** *Space Grotesk* (Medium 500) does page titles at 32px, section titles at 19px and summary metrics at 28px — always at line-height 1.3. *Inter* does everything else: body at 400/14/1.5, UI rows at 13px, metadata and pills at 12px, captions and eyebrows at 11px, card titles at 700/17px, subheads at 700/15px. Note the odd sizes the file actually uses — **11.5px** for availability chips and the catalog eyebrow, **13px** as the dominant UI size, not 14. Do not round these. Nearly all UI text is set at `line-height: 100%`; only body copy (1.5) and display type (1.3) breathe.

**Spacing is irregular and should stay that way.** The file uses 4, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 28 and 32 px — not a 4/8 grid. Page gutter is 32px. Content width is 1344px. Cards pad 22px with a 7px internal gap; table rows pad 18×20px (requests) or 0×20px (inventory); catalog card content pads 18px with a 12px gap. Copy the number you see.

**Corner radii, by role:** 4px steppers and inline code chips · 6px text fields and the pagination chip · 8px availability chips · 10px everything structural (cards, buttons, search, tables) · 24px the login card · 999px status pills, category chips and the count badge · 200px avatars.

**There is exactly one shadow and exactly one ring.** `--shadow-card`: `0px 5px 18px 0px rgba(23,32,51,0.0706)` — a very soft, barely-there lift on cards, tables and the login card. `--ring-default`: a 1px inset `rgb(227,230,236)` hairline on the top bar, search field, model select and ghost buttons. There is no second elevation level, no inner shadow system, no glow. Table rows use a real 1px border, not the ring.

**Borders vs. shadows:** structural containers get the shadow; interactive inputs get the ring; data rows get borders. Never both a shadow and a ring on the same element — except the primary button, which carries a same-colour ring so it keeps its silhouette on white.

**No gradients. No blur. No transparency except four tints.** The only alpha values in the entire file are the card shadow (7%), the modal scrim (50% black), and the four 10% status tints (`rgba(46,126,71,.1)`, `rgba(200,30,30,.1)`, `rgba(45,95,163,.1)`). Backdrop-filter is never used.

**Backgrounds are flat.** One photographic full-bleed exists: the login screen's `assets/login-background.png`, a large cool-toned interior shot the white card floats over. Everywhere else is flat colour. Catalog cards carry 180px product photography — neutral, well-lit, cool-white studio imagery on plain backgrounds. No illustration, no pattern, no texture, no noise anywhere in the file.

**Status is the only other colour, and it is a fixed vocabulary.** Amber (`rgb(161,92,0)` on `rgb(255,245,222)`) = waiting on a human: Pending Approval, Low Stock. Green (`rgb(22,121,74)` on `rgb(234,248,240)`) = moving or done: Approved, For Release, Ready for Pickup, For Delivery, Released, Completed, In Stock. Red-tint (`rgb(198,40,40)` on `rgb(255,241,240)`) = stopped: Rejected, Out of Stock. Availability chips on catalog cards use a squarer 8px shape with 10% tints: green `rgb(46,126,71)` Available, red `rgb(200,30,30)` Unavailable. Blue (`rgb(45,95,163)` on a 10% tint) is informational only — asset codes on the Profile screen.

**Layout is a fixed 1440 frame with a fixed 87px top bar.** The bar is white, hairline-ringed, and holds the logo at left (32,22), centred nav at x=618–636, and account actions right-aligned — request-list link, count badge, a 31px vertical divider, avatar, name and role. Page title sits at y=121. Content starts at y≈212–240. Nothing is sticky; nothing scrolls independently except the Request List drawer.

**Avatars are 34px circles of flat colour with white initials** — orange `rgb(244,129,13)` for the employee, deep green `rgb(21,101,53)` for the admin. They grow to 56px with 700-weight 20px initials on the Profile screen. No photos, ever.

**Motion, hover and press states are not specified in the source.** The only interaction variance the file records is on the two imported library buttons (`ButtonWithIcon` has an explicit hover variant that lightens ink from `rgb(73,76,80)` to `rgb(111,121,133)`; `ButtonTemplate` has a "saved" state at 40% opacity). For anything OSRS-native, the system's own convention — inferred from that one data point and applied consistently in the UI kit — is: **hover lightens ink or fill slightly, press does nothing dramatic, transitions are short (120–180ms) and eased, nothing bounces or scales.** Tokens `--motion-fast`, `--motion-base`, `--motion-ease` are provided for this; they are an addition, flagged below.

**Imagery colour vibe:** cool, clean, neutral-to-slightly-blue product photography on white or pale backgrounds; the login photograph is a cool office interior. No warmth, no grain, no filters, no duotone.

---

## ICONOGRAPHY

The file uses **two icon sources, both as vector paths, no icon font and no PNG icons.**

1. **Material Design Icons (MDI)**, pulled in by name: `mdi-light:clipboard-text` (24×24, the Request List marker in the top bar — used 12 times, the most-instanced component in the file) and its heavier sibling `mdi:clipboard-text-outline`. Also present as loose vectors in the frames: `mdi-light:arrow-left` (back link), `bytesize:close` (drawer close), and a small arrow-right on "View details".
2. **Phosphor-style filled/stroked glyphs** on 30×30 frames, from an imported library: `arrow-circle-down-fill`, `arrow-counter-clockwise`, `caret-right`, `check-circle-fill`. These come in alongside `button template` / `button with icon` and use that library's ink `rgb(73,76,80)`, not OSRS red.
3. **Google's "G" mark**, three sizes, inside `SignInButton`. Third-party brand asset — never restyle it.

All of these are materialised as React components in `components/icons/` and paint with `currentColor`, so colour them via the parent or the `color` prop. The raw SVGs are also in `assets/icons/` (`clipboard-text.svg`, `clipboard-text-outline.svg`, `search.svg`, `google.svg`) for non-React use.

**Emoji: never used.** **Unicode as iconography: twice** — "⌄" for the model-select chevron and "-" / "+" in the quantity stepper. Both are set in Inter at the surrounding text size, not as glyphs. Reproduce them literally rather than substituting a chevron icon.

When you need an icon the file doesn't define, reach for **MDI at 24×24, light weight** first — that is the established register. Do not hand-draw one.

---

## Brand assets

`assets/logo-codev-red.png` (142×39) is the master **codev** wordmark: lowercase, geometric, the "d" and "e" filled brand red against a lighter red "co" and "v". `assets/logo-codev-white.png` is the same mark knocked out for dark grounds. `assets/logo-supply-requests.png` is the flattened product lockup used in the top bar; the live lockup is the `CoDevSupplyRequestsLogo` component (mark + "SUPPLY REQUESTS" in Inter 600/14).

All three are real bitmaps copied out of the .fig. Nothing here was drawn or reconstructed.

---

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | Global entry point — `@import` list only. Link this one file. |
| `tokens/fonts.css` | Webfont loading (Inter, Space Grotesk, Roboto, Noto Sans) |
| `tokens/colors.css` | Base palette + semantic aliases |
| `tokens/typography.css` | Families, the exact size ladder, named type roles |
| `tokens/spacing.css` | Spacing scale, frame geometry, control heights |
| `tokens/elevation.css` | Radii, the card shadow, rings, motion |
| `tokens/fig-tokens.css` | The two Figma Variables, verbatim (incl. dark mode) |
| `tokens/fig-typography.css` | Generated text-style file — empty; the source defines no named text styles |
| `base.css` | Link colours |
| `assets/` | Logos, login photograph, catalog photography, icon SVGs |
| `guidelines/*.card.html` | 15 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `ui_kits/osrs-web/` | Click-through recreation of the whole product — see its README |
| `SKILL.md` | Agent Skills front-matter for use outside this project |

### Components

Grouped by concern under `components/`. Every family the .fig defines is built; nothing was added.

**`components/brand/`**
- `CoDevRedMasterLogo` — the codev wordmark in brand red
- `CoDevWhiteMasterLogo` — knocked-out variant for dark grounds
- `CoDevSupplyRequestsLogo` — product lockup, mark over "SUPPLY REQUESTS"

**`components/actions/`**
- `ButtonTemplate` — outlined glyph button, `state` = default | saved
- `ButtonWithIcon` — chromeless glyph + label, `Property 1` = default | hover
- `SignInButton` — Google sign-in, Darkmode × Mobile (4 variants)

**`components/forms/`**
- `Search` — the 46px catalog / inventory search field

**`components/data-display/`**
- `StatusPills` — the full request and stock status vocabulary
- `SupplyCard` — the 436px catalog tile

**`components/overlay/`**
- `Backdrop` — the 50% black modal scrim

**`components/icons/`**
- `MdiLightClipboardText`, `MdiClipboardTextOutline` — request-list marks (24×24)
- `ArrowCircleDownFill`, `ArrowCounterClockwise`, `CaretRight`, `CheckCircleFill` — 30×30 library glyphs
- `GoogleIcon` — the Google "G", Size = 32x32 | 40x40 | 48x48

That is **17 of 17** component families from the file's `Component families` inventory (4 variant sets + 13 standalone).

---

## Intentional additions

Everything below is *not* in the .fig. It exists because the system could not be used without it; nothing here invents a new visual language.

1. **Motion tokens** (`--motion-fast`, `--motion-base`, `--motion-ease`). The source is a static file with no prototyping. Values are conservative and match the one hover variance the file does record.
2. **Semantic colour aliases** (`--text-body`, `--surface-card`, `--status-pending-fg`, …). Thin names over the literal palette; every one resolves to a value read from the file.
3. **UI-kit-local helpers** (`TopBar`, `Avatar`, `PageHeader`, `SummaryCard`, `Button`, `TableCard`) live *inside* `ui_kits/osrs-web/`, deliberately **not** promoted to `components/`, because the .fig draws them as frames rather than publishing them as components. If the design file later publishes them, promote them then.

## Known gaps — flag these to the designer

- **No font binaries ship with the .fig.** Inter and Space Grotesk load from Google Fonts at the exact weights the source uses. Roboto and Noto Sans load too, for the imported Google / template-button families only. If Codev licenses specific cuts, drop the files in `assets/fonts/` and swap `tokens/fonts.css` for real `@font-face` rules.
- **No named text styles and only two Figma Variables** (`_components/backdrop/fill`, `Red - Error`). The rest of the palette and the whole type scale are raw values in the frames; `tokens/` is the first time they have been named. Worth publishing back into Figma as Variables and Text Styles.
- **No hover, focus, press, disabled, empty, error or loading states** designed for any OSRS-native component.
- **No mobile or tablet frames.** Everything is the 1440 desktop frame.
- **No notification-email designs**, though the pipeline depends on five of them.
- **No designed screen for "Prepare / Release items"** (the Supply Admin's own step) — the Requests Queue and Review Request frames cover approval only.
