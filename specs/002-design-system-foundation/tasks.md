# Tasks: Design System Foundation

**Spec**: `specs/002-design-system-foundation/spec.md`
**Plan**: `specs/002-design-system-foundation/plan.md`
**Structure**: By pipeline (plan 002's 10-step sequence), every task tagged to its user story

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

`[P]` marks tasks that touch different files with no sibling dependency and can run in parallel.

**Story key** — US1 tokens · US2 typography · US3 components · US4 status vocabulary · US5 interaction states · US6 responsive · US7 brand assets

---

## Phase 1: Blocking Preconditions — COMPLETE

- [x] T001 Enable TypeScript `strict` — `tsconfig.app.json`
- [x] T002 Vendor the design-system source with provenance and checksum baseline — `design-system/`, `design-system/VENDORED.md`, `design-system/SHA256SUMS`

## Phase 2: Assets & Fonts (US2, US7)

- [x] T003 [P] [US7] Copy the three brand lockups — `src/assets/brand/{logo-codev-red,logo-codev-white,logo-supply-requests}.png`
- [x] T004 [P] [US7] Copy catalog product photography — `src/assets/items/{item-laptop,item-monitor}.jpg`
- [x] T005 [P] [US7] Copy the login photograph — `src/assets/login/login-background.png`
- [x] T006 [US2] Vendor the Inter variable face (400–800), latin + latin-ext — `src/assets/fonts/Inter-var-{latin,latin-ext}.woff2`
- [x] T007 [US2] Vendor the Space Grotesk variable face (400–700), latin + latin-ext — `src/assets/fonts/SpaceGrotesk-var-{latin,latin-ext}.woff2`
- [x] T008 [US2] Vendor Roboto as a single variable face, latin — `src/assets/fonts/Roboto-var.woff2`
- [x] T009 [US2] Vendor Noto Sans as a single variable face, latin — `src/assets/fonts/NotoSans-var.woff2`
- [x] T010 [US2] Declare all six faces with weight ranges, `font-display: swap`, and upstream `unicode-range` on the split families — `src/styles/fonts.css`
- [x] T011 [US2] Preload the Inter and Space Grotesk latin faces — `index.html`
- [x] T012 [US2] Verify SC-002 in a browser — 49 requests, all same-origin; all four faces resolve — `scripts/check-a11y-responsive.mjs`

## Phase 3: Vertical Slice (US1, US3) — de-risks the Phase 4 bottleneck

Prove the whole chain on one component before any bulk work. If a link is wrong, it is wrong here, cheaply.

- [x] T013 [US1] Entry stylesheet: `@import 'tailwindcss'` plus the namespace resets (`--color-*`, `--text-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--spacing`, `--spacing-*` to `initial`) — `src/styles/index.css`
- [x] T014 [US1] Only the tokens `Button` needs — brand primary, on-primary, ink body, `--text-13`, `--radius-10`, `--spacing-18` — `src/styles/theme.css`
- [x] T015 [US1] One composite type role and one ring as custom utilities — `src/styles/utilities.css`
- [x] T016 [US3] `Button` with `primary | accent | ghost` variants — `src/shared/ui/actions/Button.tsx`
- [x] T017 [US3] Gallery shell with anchor navigation and a Button section — `src/shared/ui/gallery/Gallery.tsx`, `src/shared/ui/gallery/sections/ButtonSection.tsx`
- [x] T018 [US3] Dev-only compare harness rendering the vendored source beside the port, driven over CDP — `src/shared/ui/gallery/compare/CompareHarness.tsx`, `scripts/compare-fidelity.mjs`, `scripts/cdp.mjs`
- [x] T019 [US3] Alias `@ds/*` to `design-system/*`, gated so nothing vendored reaches a production bundle — `vite.config.ts`
- [x] T020 **Checkpoint** — chain validated end to end before Phase 4 begins

## Phase 4: Token Layer (US1) — serialisation point

- [x] T021 [US1] Port the 69 colour tokens, mapping `--osrs-white`/`--osrs-black` to `--color-white`/`--color-black` so both utilities survive the reset — `src/styles/theme.css`
- [x] T022 [US1] Rename the 7 semantic text colours into the colour namespace as `--color-ink-*`, resolving the collision with the `--text-*` size namespace — `src/styles/theme.css`
- [x] T023 [P] [US1] Port the 4 font families and 15 exact sizes, keeping `11.5px` and `13px` unrounded — `src/styles/theme.css`
- [x] T024 [P] [US1] Port the 5 weights and 3 line-heights — `src/styles/theme.css`
- [x] T025 [P] [US1] Port the 27 spacing steps at their irregular source values (7, 9, 18, 22…) — `src/styles/theme.css`
- [x] T026 [P] [US1] Port the 9 radii and the single card shadow — `src/styles/theme.css`
- [x] T027 [P] [US1] Port the 3 motion tokens — `src/styles/theme.css`
- [x] T028 [US1] Define the 13 composite type roles as custom utilities (`type-page-title`, `type-ui`…) — `src/styles/utilities.css`
- [x] T029 [US1] Define the 3 inset-shadow rings as custom utilities — `src/styles/utilities.css`
- [x] T030 [US1] Token map: every token to its source file, original name, and any rename — `docs/design-system/token-map.md`
- [x] T031 [US1] Port the vendored adherence rules (raw hex, raw `px`, non-DS font-family), scoped to component and feature code, excluding `src/styles/` — `.oxlintrc.json`
- [x] T032 [US1] Verify SC-001: confirm all 156 tokens generate utilities and no Tailwind default (`bg-blue-500`, `p-4`, `text-sm`) resolves — `src/styles/theme.css`

## Phase 5: Primitives (US3, US4)

- [x] T033 [US4] `RequestStatus` (6 states), `StockStatus` (3), `Availability` (2), and the `Released → "Ready for Pickup"` label map — `src/shared/ui/status.ts`
- [x] T034 [P] [US3] Clipboard icons (24×24), painting with `currentColor` — `src/shared/ui/icons/{MdiLightClipboardText,MdiClipboardTextOutline}.tsx`
- [x] T035 [P] [US3] The four 30×30 library glyphs — `src/shared/ui/icons/{ArrowCircleDownFill,ArrowCounterClockwise,CaretRight,CheckCircleFill}.tsx`
- [x] T036 [P] [US3] Google mark, sizes 32/40/48 — `src/shared/ui/icons/GoogleIcon.tsx`
- [x] T037 [P] [US3] The three brand lockups — `src/shared/ui/brand/{CoDevRedMasterLogo,CoDevWhiteMasterLogo,CoDevSupplyRequestsLogo}.tsx`
- [x] T038 [US4] `StatusPill` carrying both geometries: 999px/12px request-stock pill and 8px/11.5px availability chip — `src/shared/ui/data-display/StatusPill.tsx`
- [x] T039 [P] [US3] `Search`, 46px, ringed — `src/shared/ui/forms/Search.tsx`
- [x] T040 [P] [US3] `Backdrop`, the 50% scrim — `src/shared/ui/overlay/Backdrop.tsx`

## Phase 6: Composites (US3)

- [x] T041 [US3] `SupplyCard`, 436px, with media block, model select and quantity stepper — `src/shared/ui/data-display/SupplyCard.tsx`
- [x] T042 [P] [US3] `SignInButton`, Darkmode × Mobile variants — `src/shared/ui/actions/SignInButton.tsx`
- [x] T043 [P] [US3] `ButtonTemplate`, `default | saved` — `src/shared/ui/actions/ButtonTemplate.tsx`
- [x] T044 [P] [US3] `ButtonWithIcon`, `default | hover` — `src/shared/ui/actions/ButtonWithIcon.tsx`
- [x] T045 [P] [US3] `SummaryCard` — `src/shared/ui/data-display/SummaryCard.tsx`
- [x] T046 [P] [US3] `TableCard` and `TableHead` — `src/shared/ui/data-display/{TableCard,TableHead}.tsx`
- [x] T047 [US3] Barrel export for the whole library — `src/shared/ui/index.ts`

## Phase 7: Shell Pieces (US3)

Two ports and two redesigns — the source positions these by absolute coordinate, which does not survive conversion to flow layout.

- [x] T048 [P] [US3] `Avatar` (port), 34px and 56px, flat colour with initials — `src/shared/ui/layout/Avatar.tsx`
- [x] T049 [P] [US3] `SectionTitle` (port) — `src/shared/ui/layout/SectionTitle.tsx`
- [x] T050 [US3] `TopBar` (**redesign** — absolute coordinates to flow) — `src/shared/ui/layout/TopBar.tsx`
- [x] T051 [US3] `PageHeader` (**redesign** — absolute coordinates to flow) — `src/shared/ui/layout/PageHeader.tsx`
- [x] T052 [US3] Record both redesigns and their layout decisions for designer ratification — `docs/design-system/additions.md`

## Phase 8: Gallery (US3)

- [x] T053 [P] [US3] Foundation sections: colour, type scale, spacing, radii, elevation — `src/shared/ui/gallery/sections/Foundations*.tsx`
- [x] T054 [P] [US4] Status section showing both pill geometries against the source's vocabulary card — `src/shared/ui/gallery/sections/StatusSection.tsx`
- [x] T055 [P] [US3] One section per component family with every variant — `src/shared/ui/gallery/sections/*.tsx`
- [x] T056 [US3] Render the gallery as the app's only content; no router, anchors only — `src/App.tsx`
- [x] T057 [US3] Delete the Vite starter — `src/App.css`, `src/index.css`, `src/assets/{hero.png,react.svg,vite.svg}`
- [x] T058 [US3] Point the entry at the new stylesheet — `src/main.tsx`

## Phase 9: States, Responsive & Overflow (US5, US6)

- [x] T059 [US5] Hover, focus-visible and disabled across every interactive component, at 120–180ms eased, no scale or bounce — `src/shared/ui/**/*.tsx`
- [x] T060 [US5] Focus indicator never suppressed; no `outline: none` anywhere — `src/styles/index.css`
- [x] T061 [US6] Breakpoint behaviour: exact geometry ≥1440, fluid 768–1439, single column below 768 — `src/shared/ui/**/*.tsx`
- [x] T062 [US6] Minimum 44×44px interactive targets below the design width — `src/shared/ui/**/*.tsx`
- [x] T063 [US3] Text-overflow rules per role: identifiers never clamp; names 1 line; card titles 2; reason and purpose 3 — `src/shared/ui/**/*.tsx`
- [x] T064 [US3] Gallery renders every affected component with realistic and deliberately overlong data, asserting identical geometry — `src/shared/ui/gallery/sections/OverflowSection.tsx`

## Phase 10: Verification & Documentation

- [x] T065 Computed-style comparison — 12 pairs, 168 properties, 0 differences — `scripts/compare-fidelity.mjs`
- [x] T066 Keyboard walk — 38 elements reached by Tab, every one shows a focus indicator — `scripts/check-a11y-responsive.mjs`
- [x] T067 Responsive check at 360, 768, 1024, 1440 — no overflow, all targets ≥44px below the design width — `scripts/check-a11y-responsive.mjs`
- [x] T068 Record the two measured AA contrast failures as designer items, unrecoloured — `docs/design-system/additions.md`
- [x] T069 Complete the additions list: motion tokens, the 7 token renames, 4 interaction states, breakpoints, 8 promotions, 2 redesigns, overflow rules, third avatar colour — `docs/design-system/additions.md`
- [x] T070 Content conventions: casing tiers, ID formats, date format, no emoji — `docs/design-system/content-conventions.md`
- [x] T071 Confirm `npm run build` and `npm run lint` pass, and that nothing under `design-system/` appears in the production bundle — `package.json`

---

## Dependencies

- Phase 2 is independent of Phases 3–4 and can run alongside them
- **Phase 3 gates Phase 4** — the slice validates the chain before the bulk token port
- **Phase 4 gates Phases 5–8** — no component can be built before its tokens exist
- Phases 5, 6 and 7 are parallelisable across developers once Phase 4 lands
- Phase 8 needs Phases 5–7; Phase 9 needs Phase 8; Phase 10 needs Phase 9

## MVP slice

Phases 1–8 produce a complete, browsable component library. Phases 9–10 make it accessible, responsive and ratifiable — required for the spec's success criteria, but the library is usable by spec 003 after Phase 8.

## Parallel opportunities

23 tasks marked `[P]`. The largest wins: T003–T009 (assets and fonts, 7 tasks), T034–T037 and T039–T040 (primitives, 6), T042–T046 (composites, 5).

## Not included

No Playwright or visual-regression tasks. The plan verifies fidelity by computed-style diffing, which needs no new dependency; automated visual regression arrives with spec 001's T020.
