# Tasks: Profile

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Linear**: [BEN-49](https://linear.app/bench-synergy-project/issue/BEN-49) — build [BEN-88](https://linear.app/bench-synergy-project/issue/BEN-88), checks + PR [BEN-89](https://linear.app/bench-synergy-project/issue/BEN-89)
**Structure**: By user story (P1 first), after the foundational pieces

Format: `- [ ] [TaskID] [P?] [Story?] [Linear] Description — path`

This feature adds no HTTP. There is no route, payload or error code anywhere in these tasks (constitution VII). The only files touched outside `src/features/profile/*` are the ones the plan names: `auth/types.ts`, `auth/seeded-source.ts`, `app/routes.tsx`, `app/placeholders.tsx` and `docs/design-system/additions.md`.

## Phase 1: Foundational (blocking)

- [x] T001 [BEN-88] Add `Office` (`'Cebu' | 'Bacolod' | 'Makati' | 'Pasig' | 'Davao'`, transcribed from the contract's `location`) and an optional `User.office`; existing fields and callers unchanged — `src/features/auth/types.ts`
- [x] T002 [BEN-88] Give the seeded users an office: Maya `Davao` (design), Samantha `Makati` and Ethan `Cebu` (placeholders, commented as such per constitution IX) — `src/features/auth/seeded-source.ts`
- [x] T003 [P] [BEN-88] `identityLine(email, office?)` (email alone when no office, never a dangling `•`) and `formatAssignedDate(isoDate)` (`Mon D, YYYY` via `Intl.DateTimeFormat` in `timeZone: 'UTC'`; malformed → `null`) — `src/features/profile/format.ts`
- [x] T004 [P] [BEN-88] `AssignedItem` (`id`, `name`, optional `tag`, optional `assignedOn`) and `AssignedEquipmentSource` with `assignedToMe()`: no user parameter, rejects on failure, never `[]`-for-failure — `src/features/profile/assigned-source.ts`

## Phase 2: Story 1 — See my own details (P1)

**Goal**: The identity block renders from the session for every role. This phase ships alone against today's backend.

- [x] T005 [US1] [BEN-88] Identity block: 56px `Avatar` with session initials and `avatarColor` and **no photo passed** (FR-003, R1), full name, and `identityLine`; long name/email wrap rather than overflow — `src/features/profile/IdentityBlock.tsx`
- [x] T006 [US1] [BEN-88] Page composition: `PageHeader` `Profile` / `Your details and currently assigned supplies`, then `IdentityBlock`. Reads `useSession()` only, never branches on `role` (FR-012, R1), and renders no inputs or edit controls (FR-013) — `src/features/profile/ProfilePage.tsx`
- [x] T007 [US1] [BEN-88] Swap `ProfilePlaceholder` for `ProfilePage` (1 import + 1 element) — `src/app/routes.tsx`
- [x] T008 [US1] [BEN-88] Remove the now-dead `ProfilePlaceholder` export — `src/app/placeholders.tsx`

## Phase 3: Story 2 — See equipment currently assigned to me (P2)

**Goal**: `Currently Assigned` has exactly three data states (FR-007) plus loading and failure (FR-011). State (c), hidden, is the live one today.

- [x] T009 [US2] [BEN-88] Registry resolving the active source as `AssignedEquipmentSource | null`: always `null` in production; under a **literal** `if (import.meta.env.DEV)` guard, a dynamic `import()` of the stub, selected by `?assigned=` (R4) — `src/features/profile/assigned-source-registry.ts`
- [x] T010 [P] [US2] [BEN-88] DEV-only stub with visibly synthetic rows (`Stub item A`, `STUB-0001`, …): `items` has three rows, one with no tag and one with no date; `empty` resolves `[]`; `loading` resolves after a visible delay; `failing` rejects (FR-010 as amended) — `src/features/profile/dev/assigned-stub.ts`
- [x] T011 [US2] [BEN-88] Load-state hook returning `unavailable | loading | failed | loaded(items)`. Resolution and load share one `try`, so a source that fails to resolve is `failed`, not `unavailable`; the cause is logged to the console. A response that arrives after the effect is torn down is discarded. The caller keys it on user id + query, so a new user or stub mode starts fresh (FR-006, FR-008) — `src/features/profile/useAssignedEquipment.ts`
- [x] T012 [P] [US2] [BEN-88] Item card: bold name, tag chip only when a tag is present (`bg-status-info-bg text-status-info-fg`, radius 4), `Assigned <date>` when the date formats, otherwise `Assignment date not available` (amended 2026-09-23); card radius 10, `shadow-card`, card surface (FR-009) — `src/features/profile/AssignedItemCard.tsx`
- [x] T013 [US2] [BEN-88] Section: `unavailable` renders nothing, not even the heading or gap. Every other state shows `Currently Assigned` as an `h2` (24px display medium, per the frame), followed by an inline `role="status"` line `Loading assigned equipment`, the inline error `Couldn't load your assigned equipment` (no retry control), the empty state `Nothing is assigned to you` / `Equipment issued to you will appear here`, or a two-column grid that collapses to one column at narrow widths (FR-007, FR-011) — `src/features/profile/AssignedSection.tsx`
- [x] T014 [US2] [BEN-88] Mount `AssignedSection` below the identity block, with the frame's spacing only when the section renders — `src/features/profile/ProfilePage.tsx`

## Phase 4: Polish

- [x] T015 [BEN-88] Log the inventions for the designer: the empty, loading and error presentation and copy, the Approver/Supply Admin reuse of the Employee layout (D2), and the placeholder offices for the seeded Approver and Supply Admin — `docs/design-system/additions.md`
- [x] T016 [BEN-88] Structural fidelity pass against `05 - Profile` with `?assigned=items`: name and section-title scale, identity-line colour, two-column grid, card padding, chip treatment, date colour. The frame wins over the UI-kit JSX; no new tokens (R5) — `src/features/profile/*.tsx`

## Phase 5: Verification + PR

- [x] T017 [BEN-89] Typecheck, lint and build clean — `npx tsc -b --force`, `npm run lint`, `npm run build`
- [x] T018 [BEN-89] Full gates with the dev server running; `check-shell` still asserts the account cluster reaches `/profile` for all three roles (FR-001) — `npm run verify`
- [x] T019 [BEN-89] Walk all three seeded roles: name, email and office match the session, the layout is identical, and no navigation item is current (SC-001, SC-005, FR-012, Story 1 AC5) — `/profile`
- [x] T020 [BEN-89] Reach all five section states: `/profile` (hidden), `?assigned=items`, `empty`, `loading`, `failing`. Partial rows invent no values (a missing date is stated in words), the identity block renders in every state, and the error is never shown as the empty state (SC-003, SC-004, FR-007, FR-009, FR-011) — `/profile?assigned=…`
- [x] T021 [BEN-89] Edge cases: a dev session with no office shows email alone with no `•`; a long name wraps; at narrow width the grid is one column and the `a11y` gate passes; signing out as Maya and in as Ethan with `?assigned=items` shows no stale identity or rows — `/profile`
- [x] T022 [BEN-89] Read-only: no `input`, `textarea`, `select` or edit control on `/profile` in any state (FR-013) — `/profile`
- [x] T023 [BEN-89] Leak checks: searching `src/features/profile/` excluding `dev/` for seeded names, emails, offices, tags and dates returns zero hits (SC-002); the production bundle contains no development stub, now enforced by the `check-profile-build` gate (see T026) (FR-010) — `src/features/profile/`, `dist/`
- [ ] T024 [BEN-89] PR against `dev` (the integration branch; branch fast-forwarded onto `origin/dev` 2026-09-23). The description must: explain that the hidden section is the intended live state (R3); list the `?assigned=` stub states for QA; name the `location` → `office` mapping in the contract-backed `SessionSource` as an open dependency (R2); and include the auth-branch rebase note (R1) — GitHub PR
- [x] T025 [BEN-89] Flag the `location` → `office` mapping (R2): created **[BEN-112](https://linear.app/bench-synergy-project/issue/BEN-112)** as a sub-issue of BEN-49 with the rebase note for the auth branch, and amended the BEN-49, BEN-88 and BEN-89 checklists to FR-007's three states and PR base `dev` (2026-09-23). The auth branch's owner has not been pinged directly; BEN-112 is unassigned — Linear BEN-49, BEN-88, BEN-89, BEN-112
- [x] T026 [BEN-89] Automated checks for Profile, added after review, both in `npm run verify`. `check-profile`: identity for all three roles, read-only, no current nav item, and every `Currently Assigned` state (hidden — proven able to fail — empty, list with a tagless row and an undated row, loading, failing); timeouts count as failures. `check-profile-build` (after `build`): the stub's `DEV_STUB_SENTINEL` and chunk name are absent from `dist/`, and a `dist/` with no JavaScript fails — `scripts/check-profile.mjs`, `scripts/check-profile-build.mjs`, `scripts/verify.mjs`, `src/features/profile/dev/assigned-stub.ts`

## Dependencies

- T001 → T002, T003, T005
- T004 → T009, T010, T011, T012
- T003 → T005, T012
- T005 → T006 → T007 → T008
- T009 + T010 → T011 → T013 → T014
- T012 → T013
- T006 → T014
- T014 → T016
- T008, T014, T015, T016 → T017 → T018 … T023, T026 → T025 → T024

## MVP slice

T001–T008 ship a working Profile against today's backend: identity from the session, the section hidden. Phase 3 adds the conditional list without touching Story 1's files except `ProfilePage.tsx` (T014).

## Parallel opportunities

- T003 and T004 once T001 is done
- T010 and T012 alongside T009 and T011
- Phase 3 can begin once T004 is done, alongside T005–T008

## Out of scope

The `location` → `office` mapping in the contract-backed session source (R2, not on this branch); any assigned-equipment endpoint; extending `compare-pixels` to `/profile` (R5); Playwright coverage (Parent J / BEN-50).

## How Phases 1–5 were verified

Run on 2026-09-23 against the dev server (`:5249`), signed in as each seeded role.

| Check | Result |
|---|---|
| `npm run verify`: all eight gates | PASS (typecheck, lint, adherence, fidelity, pixels, a11y, shell routing, build) |
| SC-001 / SC-005 / FR-012 | Maya `mayas@codev.com • Davao Office`, Samantha `… • Makati Office`, Ethan `… • Cebu Office`; same layout for all three; no navigation item current |
| FR-007 (c), the live state | `/profile` renders no `Currently Assigned` heading or gap; an unknown `?assigned=bogus` also falls back to (c) |
| FR-007 (a) / (b), FR-011 | `items` lists three cards; `empty` shows the empty card; `loading` shows `Loading assigned equipment`; `failing` shows the error, never the empty state; identity renders in every state |
| FR-009 partial rows | Row with no tag has no chip; row with no date reads `Assignment date not available` |
| Edge cases | With Maya's office removed: email alone, no `•`. A 55-character name wraps inside the identity block. At 375px the grid is one column and the page does not overflow |
| FR-013 | Zero `input` / `textarea` / `select` / `contenteditable` in `main` in every state |
| SC-002 | No seeded name, email, office or asset tag in `src/features/profile/` outside `dev/` |
| FR-010 | `dist/` contains no `STUB-`, `Stub item` or `assigned-stub` |
| `formatAssignedDate` | `2026-01-14` → `Jan 14, 2026`; `2026-02-31` and `14/01/2026` → `null`; `2024-02-29` → `Feb 29, 2024` |

**Deviations from the plan:**

- The loading state is an inline `role="status"` line, not the shared `LoadingState`. `LoadingState` is a full-screen (`min-h-screen`) surface and would push the identity block aside for one section. Logged in `additions.md` §3e.
- `Currently Assigned` is an `h2` at 24px display medium, not `SectionTitle` (19px). The frame draws it at the name's scale. Logged in `additions.md` §3e.

**Review fixes, re-verified 2026-09-23** (all eight `verify` gates pass again; `dist/` still clean):

| Check | Result |
|---|---|
| T021 in-tab role switch, driven end to end in one tab | Maya with `?assigned=items` → Sign Out → Ethan → `?assigned=loading`: the first frame shows Ethan's identity and `Loading assigned equipment`, never Maya's rows; then Ethan's list |
| Stub mode switch in one mount (`items` → `loading`) | The first frame shows `Loading assigned equipment`, not the previous rows (keyed on user id + query) |
| Source fails to **resolve** (temporary `throw` in the registry, reverted) | Section shows the error, not the hidden state (FR-008) |
| Failure is observable | `console.error('[profile] assigned equipment could not be loaded', Error: Stubbed failure)` |

**Found outside this feature, not fixed:** at 375px with a very long user name, the shell's account cluster in the top bar overflows horizontally. Profile's own content wraps correctly. The account cluster belongs to spec 003.

**T024 is outward-facing** (open the PR against `dev`) and waits for explicit go-ahead. T025 was done on 2026-09-23 at the owner's instruction.
