# Feature Specification: Design System Foundation

**Feature Branch**: `002-design-system-foundation`
**Created**: 2026-09-12
**Status**: Draft
**Sources**: `~/Downloads/OSRS Design System/` (generated from `Office Supplies Request System (OSRS).fig`, Mockups page, 18 frames)

## Overview

Establish the visual foundation of the OSRS SPA — design tokens, self-hosted fonts, brand assets, and a typed component library — so that every screen in spec 001 is assembled from pre-built, design-faithful pieces instead of being styled from scratch. This feature ships **no product pages and no API calls**; it ends when a developer can build any OSRS screen without inventing a single colour, size, radius, or control.

**Relationship to spec 001**: this is an enabling feature. It unblocks 001's UI tasks T004–T018, which currently have no visual vocabulary to build against. It adds no product behavior and changes no functional requirement in 001.

## User Stories

### Story 1 — Design tokens are the only source of visual values (Priority: P1)

A developer building any OSRS screen reaches for a named token — never a literal hex code, pixel size, or shadow. Every value the designer recorded in the Figma file is available by name in the app's styling layer, and values the designer did **not** record are absent, so they cannot be used by accident.

**Why this priority**: Everything else in this feature and every page in spec 001 depends on tokens existing first.

**Acceptance Criteria**:

1. **Given** the design-system source defines a value (a colour, type size, weight, spacing step, radius, shadow, ring, or motion duration), **When** a developer builds a screen, **Then** that value is reachable by a semantic name without retyping the literal.
2. **Given** the source records irregular values — `11.5px` and `13px` type, `7px`/`9px`/`18px`/`22px` spacing — **When** tokens are authored, **Then** those exact values survive; none are rounded to a 4/8 grid.
3. **Given** a developer writes a literal colour or font size in screen code, **When** the project's lint or review runs, **Then** that use is flagged as a deviation from the token set.
4. **Given** the source pairs a warm page canvas `rgb(250,250,249)` with cool table headers `rgb(240,242,245)`, **When** tokens are applied, **Then** both survive as distinct named surfaces and are not collapsed into one grey.

---

### Story 2 — Brand typography renders correctly and offline (Priority: P1)

Any user on the Codev LAN — including with no internet route — sees the product in its two brand faces: Space Grotesk for display type and Inter for everything else, at the exact weights the designer used.

**Why this priority**: Type is half the brand identity, and a fallback swap changes every measurement on every screen.

**Acceptance Criteria**:

1. **Given** the app is loaded with no access to any third-party host, **When** any screen renders, **Then** every face the design system references — Space Grotesk, Inter, and the Roboto and Noto Sans used by the imported library components — displays at its designed weight, served from the application's own origin.
2. **Given** the two-family split defined by the source, **When** a page title (32px), section title (19px) or summary metric (28px) renders, **Then** it is Space Grotesk Medium at line-height 1.3.
3. **Given** the same split, **When** body copy, UI rows, metadata, pills, captions or eyebrows render, **Then** they are Inter, and body copy is the only text at line-height 1.5 — all other UI text is at 100%.
4. **Given** fonts are still loading, **When** first paint occurs, **Then** text is visible in a fallback and the swap causes no layout collapse.

---

### Story 3 — Every designed component exists as a reusable, typed piece (Priority: P1)

A developer assembling a screen imports a component that already looks right, rather than reconstructing it from a mockup. All 17 component families published by the design system, plus the 8 application-shell pieces the designer drew as frames, are available.

**Why this priority**: This is the deliverable that actually unblocks page work.

**Acceptance Criteria**:

1. **Given** the design system's inventory of 17 published component families, **When** the library is complete, **Then** all 17 are present and each visually matches its source specimen.
2. **Given** the 8 shell pieces that exist only inside the throwaway UI kit — top bar, avatar, page header, summary card, button, table card, table head, section title — **When** the library is complete, **Then** each is a first-class component of the app, and the promotion is recorded as feedback for the designer to publish in Figma.
3. **Given** any component in the library, **When** a developer uses it incorrectly (a misspelled status, a missing required label), **Then** the error surfaces before the app runs, not as a broken screen.
4. **Given** a component the designer specified with fixed geometry (the 436px supply card, the 46px search field, the 42px button, the 87px bar), **When** it renders at the designed viewport, **Then** those measurements hold.
5. **Given** the library, **When** a developer browses it, **Then** every component can be viewed in isolation with its variants, without running a product page.

---

### Story 4 — Status has one fixed, correct vocabulary (Priority: P1)

Request and stock state is communicated through one pill component with a closed set of statuses and a fixed colour meaning: amber = waiting on a human, green = moving or done, red = stopped, blue = informational only.

**Why this priority**: Status colour is the only colour in the product besides brand red; an ad-hoc pill anywhere breaks the entire signal.

**Acceptance Criteria**:

1. **Given** the status vocabulary, **When** a pill renders `Pending Approval` or `Low Stock`, **Then** it is amber; `Approved`, `For Release`, `Released`, `Completed` or `In Stock` render green; `Rejected` or `Out of Stock` render red.
2. **Given** the request state machine in `docs/process-flow.md`, **When** a developer renders a request status, **Then** only the six canonical statuses are selectable; a status outside that set cannot be passed by mistake.
3. **Given** a `Released` request, **When** its pill renders on a screen that addresses the employee's pickup, **Then** it may read "Ready for Pickup" as a presentational label while the underlying status stays `Released` — matching the notification `docs/process-flow.md` names "Items Ready for Pickup / Released".
4. **Given** a catalog availability chip, **When** it renders, **Then** it uses the squarer 8px shape at 11.5px — visually distinct from the 999px request pill at 12px.
5. **Given** any component in the library, **When** it needs to convey state, **Then** it uses this pill; no screen defines its own status styling.

---

### Story 5 — Interaction states exist where the design file has none (Priority: P2)

Buttons, links, inputs and rows respond to hover, focus and disabled states consistently, following the restrained convention the design system states: ink or fill lightens slightly, nothing bounces or scales, transitions are 120–180ms and eased.

**Why this priority**: The source designed no interaction states, but a product without focus rings is unusable by keyboard and fails accessibility review. Less blocking than the static foundation.

**Acceptance Criteria**:

1. **Given** any interactive component, **When** a user hovers it, **Then** it responds within 180ms with a subtle ink or fill shift — no scale, no bounce, no shadow growth.
2. **Given** a keyboard user, **When** they tab through a screen, **Then** every interactive element shows a visible focus indicator drawn from the token set.
3. **Given** a disabled control, **When** it renders, **Then** it is visibly inert and cannot be activated by mouse or keyboard.
4. **Given** these states are additions not present in the source, **When** they are defined, **Then** each is recorded as a documented addition for the designer to ratify.

---

### Story 6 — The shell adapts below the designed width (Priority: P2)

The application shell and every component remain usable from a phone up to the 1440px design width, even though the designer produced only the 1440 desktop frame.

**Why this priority**: Requested explicitly. Ranked P2 because it extends — rather than blocks — the desktop foundation that spec 001's demo path runs on.

**Acceptance Criteria**:

1. **Given** a viewport at the 1440px design width, **When** any screen renders, **Then** it matches the source layout: 87px bar, 32px gutter, 1344px content.
2. **Given** a viewport narrower than the design width, **When** any screen renders, **Then** content reflows and the page never scrolls horizontally.
3. **Given** a 360px-wide viewport, **When** the shell renders, **Then** navigation and account actions remain reachable and every interactive target is at least 44×44px.
4. **Given** responsive behavior is invented rather than sourced, **When** it is defined, **Then** the breakpoints and their layout decisions are documented for designer review.

---

### Story 7 — Brand assets ship with the app (Priority: P2)

Logos, the login photograph, catalog product photography and icon vectors live in the repository and load from the app's own origin.

**Acceptance Criteria**:

1. **Given** the three brand lockups, **When** a screen renders one, **Then** it loads from this application, not from a designer's machine or an external host.
2. **Given** the icon set, **When** an icon renders inside a coloured parent, **Then** it inherits that colour rather than carrying a hard-coded fill.
3. **Given** a developer needs an icon the design system does not define, **When** they add one, **Then** the documented register (Material Design Icons, 24×24, light weight) is stated so they do not hand-draw one.

---

### Edge Cases

- A developer needs a colour, size or component the design file does not define → the system makes the gap obvious and routes it to the designer instead of silently absorbing an invented value.
- A status arrives from the API that is outside the known vocabulary → the pill renders a neutral, legible fallback rather than an unstyled or mis-coloured chip.
- A catalog item has no product photograph → the card keeps its 180px media block with a neutral placeholder; the layout does not shift.
- A very long item name, requester name or rejection reason → text truncates or wraps predictably; the row height and card geometry hold.
- Fonts fail to load entirely → the fallback stack preserves reading order and hierarchy; no screen becomes unreadable.
- The design file is re-exported by the designer with changed values → the foundation can be diffed against the new export to find drift.

## Requirements

### Functional Requirements

- **FR-001**: Every colour, type size, weight, line-height, spacing step, radius, shadow, ring and motion value recorded in the design-system source MUST be available in the SPA as a named token, at its exact source value.
- **FR-002**: The token set MUST preserve the source's semantic aliases (brand, text, surface, border, status) so screens reference intent rather than raw palette entries.
- **FR-003**: The SPA MUST NOT introduce a colour, type size, radius or shadow that the design-system source does not define, unless recorded as a documented addition.
- **FR-004**: All four families the design system references MUST be served from the application's own origin at the weights the source uses — Inter 400/500/600/700/800, Space Grotesk 400/500/700, Roboto 400/500, Noto Sans 500/700 — with no runtime dependency on a third-party font host.
- **FR-005**: All 17 published design-system component families MUST be implemented as typed SPA components matching their source specimens.
- **FR-005a**: Fidelity MUST be verified by side-by-side comparison against the design system's own specimen cards (`guidelines/*.card.html`) and its UI kit (`ui_kits/osrs-web/`) at the 1440px design width; a component is not complete until that comparison passes.
- **FR-006**: The 8 application-shell pieces (top bar, avatar, page header, summary card, button, table card, table head, section title) MUST be implemented as first-class SPA components, and their promotion from UI-kit helper to published component MUST be recorded as designer feedback.
- **FR-007**: Component props MUST be strictly typed, with closed value sets for variants and statuses; the SPA's TypeScript strictness applies with no `any`.
- **FR-008**: A single status component MUST own the entire request and stock status vocabulary. Request status MUST be constrained to the six states in `docs/process-flow.md`; a presentational label MAY differ from the state name (`Released` shown as "Ready for Pickup"), but MUST NOT introduce a state the machine cannot produce. Stock status is a separate, independent set.
- **FR-009**: Catalog availability chips MUST render in the source's distinct 8px / 11.5px form, separate from the 999px / 12px request pill.
- **FR-010**: Every interactive component MUST define hover, focus-visible and disabled states following the source's stated restraint (subtle ink or fill shift, 120–180ms eased, no scale or bounce).
- **FR-011**: Every interactive element MUST expose a visible keyboard focus indicator and be reachable by keyboard.
- **FR-011a**: Text and background pairings MUST meet WCAG 2.1 AA contrast. Where a pairing recorded in the design-system source fails that threshold, it MUST be flagged to the designer under FR-018 and MUST NOT be silently recoloured.
- **FR-012**: The shell and all components MUST render without horizontal overflow at every width from 360px up to the 1440px design width, matching the source layout exactly at 1440. At viewports below the design width, every interactive target MUST be at least 44×44px.
- **FR-013**: Brand logos, the login photograph, catalog photography and icon vectors MUST be committed to this repository and served from the app's origin.
- **FR-014**: Icons MUST inherit colour from their parent rather than carrying fixed fills.
- **FR-015**: The component library MUST be browsable in isolation — every component and variant viewable without running a product page or reaching an API — using the SPA's existing toolchain, adding no new framework or dependency.
- **FR-016**: The foundation MUST NOT contain product screens, routing, session handling, or any HTTP call.
- **FR-016a**: Components that render user- or API-supplied text (item names, requester names, rejection reasons, purposes) MUST truncate or wrap predictably without altering the component's designed height or geometry.
- **FR-017**: Content conventions from the design system (sentence-case page titles, Title Case buttons and pills, ALL CAPS column headings and eyebrows, `REQ-2026-1847` / `MON-2238` ID formats rendered in Inter 700, `Sep 8, 2026` dates, no emoji) MUST be documented alongside the components so page authors follow them.
- **FR-018**: Every value or state added beyond the design-system source MUST be recorded in a single list for designer ratification.
- **FR-019**: Each token MUST record the design-system source it was read from, so that a re-exported design file can be diffed against the foundation to surface drift.

### Key Entities

- **Token**: A named visual value — colour, type role, spacing step, radius, shadow, ring, or motion duration — traceable to the design-system source.
- **Component**: A reusable, typed UI piece with a closed set of variants and states.
- **Status**: A member of the fixed request or stock vocabulary, each bound to one colour meaning.
- **Brand asset**: A logo, photograph, or icon vector copied from the design file, never redrawn.
- **Documented addition**: A value, state, or breakpoint not present in the source, recorded for designer review.

## Out of Scope

- Any product page from spec 001 (Login, Catalog, Request List, My Requests, Profile, Requests Queue, Review Request, Inventory) — this feature only supplies the pieces they are built from.
- Routing, session handling, role-based navigation, API calls, and data fetching.
- Dark mode. The source records a dark-mode value for exactly one variable (the modal scrim, which is unchanged) and designs no dark screens.
- Notification email templates — no designs exist for the five pipeline emails.
- Screens for the Supply Admin's Prepare / Release step — the source designs approval only.
- A published or versioned design-system package. Components live in this repository.
- Re-drawing, extending, or reinterpreting the designer's visual language. Gaps go back to the designer.
- Animation beyond the state transitions in FR-010.

## Success Criteria

- **SC-001**: A developer can build any screen from spec 001 without introducing a colour, type size, radius, shadow, or spacing value that is not already a named token.
- **SC-002**: With all third-party hosts unreachable, the application renders in its designed faces at their designed weights, with no fallback substitution.
- **SC-003**: All 25 components (17 published families + 8 promoted shell pieces) are viewable in isolation with their variants, and each passes a side-by-side comparison against its design-system specimen at the 1440px design width.
- **SC-004**: Passing an invalid status, variant, or missing required label to any component fails before the application runs, and no request status outside the six-state machine can be expressed.
- **SC-005**: Every screen in the library renders without horizontal overflow at every width from 360px to 1440px, and no interactive target below the design width is smaller than 44×44px.
- **SC-006**: Every interactive element in the library is reachable and operable by keyboard with a visible focus indicator, and every text/background pairing either meets WCAG 2.1 AA or appears on the designer-review list.
- **SC-007**: A single document lists every value, state, and breakpoint added beyond the design-system source, ready for designer review.
- **SC-008**: Spec 001's UI tasks can begin with zero unresolved visual questions.

## Decisions

Made by the project owner before drafting; `plan.md` implements them.

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | Tokens become first-class utilities in the SPA's existing styling layer (Tailwind CSS 4 `@theme`); components are authored as TSX using those utilities, not as inline style objects. | Honors the locked stack in `CLAUDE.md`. Requires one careful porting pass from the source's CSS custom properties, with fidelity verified value by value. |
| D2 | The shell and components are fully responsive from phone width to the 1440px design width. | Exceeds the source, which has only the 1440 frame. Breakpoint layouts are invented and MUST be documented for designer review (FR-018). |
| D3 | All 17 published component families are ported, and the 8 UI-kit shell helpers are promoted to first-class components. | Complete coverage; page work starts unblocked. Promotion is fed back to the designer for publishing in Figma. |
| D4 | All four referenced families are self-hosted; Google Fonts is not used at runtime. | No external dependency, works on an isolated LAN. Roboto and Noto Sans are carried for the two imported library components so all 17 families stay pixel-exact. |
| D5 | Request status is typed to the six legal states; `Ready for Pickup` and `For Delivery` are presentational labels for `Released` (amended 2026-09-14 — see Clarifications). | Reconciles the design file's 11-status pill with constitution IV. The mockup wording survives; illegal states become unrepresentable. |
| D6 | The component library is browsable through an in-app gallery route built with the existing toolchain. | Satisfies FR-015 with no new dependency and no ADR under constitution VIII. The gallery renders the real components, so it cannot drift. |

## Known Gaps — flag to the designer

Carried forward from the design system's own readme, plus conflicts found while drafting. None block this feature; all block or shape later page work.

| Gap | Impact |
|-----|--------|
| The design file's login screen offers **Google sign-in only**, but spec 001 clarified auth as email + password with seeded demo users. | `SignInButton` is ported, but the Login page cannot be built from the mockup as drawn. Needs a designed email/password form, or a spec-001 amendment. |
| **No designed screen for the Supply Admin's Prepare / Release step**, though the state machine requires it. | Spec 001 stories 4 and parts of 6 have no visual source. |
| **No notification-email designs**, though the pipeline defines five. | Constitution V transitions have no designed artifact. |
| **No mobile or tablet frames.** | Every responsive decision in this feature is invented (D2) and needs ratification. |
| **No hover, focus, press, disabled, empty, error or loading states** designed for any OSRS-native component. | Defined here under FR-010/FR-011 and listed under FR-018 for ratification. |
| **No named text styles and only two Figma Variables** in the source. | The token set in this feature is the first time these values are named; worth publishing back into Figma. |
| The **8 shell pieces** are drawn as frames, not published components. | Promoted here (D3); the designer should publish them so future exports stay in sync. |

## Checklist Overrides

None dismissed. All five flagged items (CHK001, CHK003, CHK004, CHK005, CHK006) were resolved into requirements above.

## Clarifications

### Session 2026-09-12

- Q: How should design tokens and components be expressed, given the source is CSS custom properties + inline styles and the repo locks Tailwind CSS 4? → A: Port tokens into Tailwind 4 `@theme` so every OSRS value is a real utility; author components as TSX using those utilities (D1).
- Q: The source is a fixed 1440×1024 canvas with no tablet or mobile frames. How should the shell behave? → A: Fully responsive including mobile, accepting that breakpoint design is invented rather than sourced (D2).
- Q: Are the 8 shell pieces that live only in the throwaway UI kit in scope? → A: Yes — port all 17 published families and promote all 8 shell pieces (D3).
- Q: How should fonts be delivered, given the .fig ships no binaries? → A: Self-host; do not load Google Fonts at runtime (D4).
- Q: D3 keeps the two imported components, which use Noto Sans and Roboto, but D4 self-hosted only Inter and Space Grotesk. How is that resolved? → A: Self-host all four families, so all 17 component families render pixel-exact (D4).
- Q: The design file's pill defines 11 statuses; the constitution defines 6 request states. How should the pill be typed? → A: Type to the 6 canonical states, keep "Ready for Pickup" as a presentational label for `Released`, drop "For Delivery" (D5).
- Q: FR-015 requires isolated browsing, but constitution VIII forbids new frameworks without an ADR. How? → A: An in-app gallery route using the existing toolchain — no Storybook, no ADR (D6).

### Session 2026-09-14 — Amendment to D5

Constitution I requires an instruction that contradicts a resolved clarification to be recorded as an amendment rather than applied silently.

- Q: D5 dropped "For Delivery". Should the pill be able to render it? → A: **Yes, as a second presentational label for `Released`**, alongside "Ready for Pickup".

**Scope of the amendment.** This changes what the *pill can read* and nothing else:

- `RequestStatus` is still the six legal states of constitution IV. "For Delivery" is not a state, is not reachable by any transition, and cannot be stored.
- The two labels are selected by a `handover` prop (`'pickup' | 'delivery'`) on a `Released` pill, replacing the earlier boolean `pickupLabel`. Omitting it renders `Released`.
- FR-008 is unchanged: a presentational label MAY differ from the state name but MUST NOT introduce a state the machine cannot produce.
- `docs/process-flow.md` is unchanged — no delivery transition or notification is defined. If delivery ever becomes a real fulfillment mode, that is a spec-001 change with its own status and email.

No constitution version bump is required — no principle changes.
