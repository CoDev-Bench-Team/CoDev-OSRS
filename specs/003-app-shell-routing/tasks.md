# Tasks: Application Shell, Routing & Role Navigation

**Spec**: `specs/003-app-shell-routing/spec.md`
**Plan**: `specs/003-app-shell-routing/plan.md`
**Structure**: By pipeline (plan 003's 8-step sequence), every task tagged to its user story

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

**Story key** — US1 sign-in and landing · US2 role navigation · US3 durable addresses · US4 guards · US5 persistent chrome · US6 sign-out · US7 loading and failure · US8 responsive

> **Spec 002 shipped** (PR #10, 2026-09-15), so the T004 gate is met: the barrel exports `TopBar`, `Avatar`, `PageHeader`, `SectionTitle`, `Button`, `SignInButton` and the brand logos, and the token layer compiles. The shell is built from them; the five feedback surfaces in Phase 3 are the only new UI, and all of it is recorded in `docs/design-system/additions.md` §3d.

---

## Phase 1: Preconditions

- [x] T001 Amend spec 001's auth clarification so D4 is a recorded amendment, not a silent override — `specs/001-office-supplies-mvp/spec.md`
- [x] T002 Record the routing decision — `docs/adr/0004-client-routing.md`, `ARCHITECT.md`
- [x] T003 Add the routing dependency — `package.json`
- [x] T004 **Gate** — confirm spec 002 Phase 8 is complete and the component barrel exports everything this feature needs — `src/shared/ui/index.ts`

## Phase 2: Session Boundary (US1)

- [x] T005 [US1] `SessionSource` interface — `current`, `signIn`, `signOut`, `subscribe` — expressed in SPA terms only, no HTTP vocabulary — `src/features/auth/session-source.ts`
- [x] T006 [US1] `Role`, `User`, `Session` types with `Role` as a closed union — `src/features/auth/types.ts`
- [x] T007 [US1] Seeded implementation with one demo user per role — `src/features/auth/seeded-source.ts`
- [x] T008 [US1] Session reference persistence: opaque token plus timestamp, never user or role, revalidated on every load so a stale reference is discarded rather than trusted — `src/features/auth/seeded-source.ts`
- [x] T009 [US1] `SessionProvider`, `useSession()`, and the `unknown → signed-out | signed-in` status machine — `src/features/auth/SessionProvider.tsx`
- [x] T010 [US6] Multi-tab propagation: back `subscribe` with a `storage` listener so sign-out in one tab reaches the others — `src/features/auth/SessionProvider.tsx`
- [x] T011 [US1] Document the seeded demo users as non-production placeholders — `specs/001-office-supplies-mvp/quickstart.md`

## Phase 3: Feedback Components (US7)

None of these is designed in the source; all five go to the additions list.

- [x] T012 [P] [US7] `LoadingState` for undetermined session status — `src/shared/ui/feedback/LoadingState.tsx`
- [x] T013 [P] [US7] `NotFoundScreen` for an unmatched address — `src/shared/ui/feedback/NotFoundScreen.tsx`
- [x] T014 [P] [US4] `ForbiddenScreen` with an explanation and a route back to the role's landing destination — `src/shared/ui/feedback/ForbiddenScreen.tsx`
- [x] T015 [P] [US7] `Placeholder` naming its destination and stating the feature has not shipped, never mistakable for an error or empty result — `src/shared/ui/feedback/Placeholder.tsx`
- [x] T016 [P] [US7] `ErrorBoundary` that preserves chrome and offers a route back — `src/shared/ui/feedback/ErrorBoundary.tsx`
- [x] T017 [US7] Record all five as designer additions — `docs/design-system/additions.md`

## Phase 4: Routes & Guards (US3, US4)

- [x] T018 [US3] Route map for the nine destinations, one source of truth — `src/app/routes.tsx`
- [x] T019 [US4] `RequireAccess` resolving in order: `unknown` renders loading and never redirects; `signed-out` redirects to `/login` preserving the requested path; role not permitted renders the refusal; otherwise render — `src/features/auth/RequireAccess.tsx`
- [x] T020 [US4] Guard reads live context rather than a route-definition snapshot, so a mid-session role change re-evaluates — `src/features/auth/RequireAccess.tsx`
- [x] T021 [US3] `/` resolves to the role's landing destination, or `/login` when signed out — `src/app/routes.tsx`
- [x] T022 [US1] Return a visitor to their originally requested destination after sign-in when their role permits it — `src/features/auth/RequireAccess.tsx`
- [x] T023 [US4] `/requests/:id` — missing and forbidden collapse into one identical response so identifiers cannot be enumerated, while an unmatched path still yields a distinguishable not-found — `src/app/routes.tsx`
- [x] T024 [US3] Placeholder elements for all eight product destinations — `src/app/placeholders.tsx`
- [x] T025 [US4] Guard redirects use `replace`, never `push`, so back cannot land on a bouncing route — `src/features/auth/RequireAccess.tsx`

## Phase 5: Layout & Navigation (US2, US5, US6)

- [x] T026 [US2] `navigationFor(role)` as a pure function derived from the AuthZ matrix — **amended 2026-09-15** to Employee: catalog, my requests; Approver: pending queue, history, catalog; Supply Admin: fulfillment, inventory, history, catalog. Profile left the bar for the account cluster; History joined it — `src/features/auth/navigation.ts`
- [x] T027 [US5] `AppLayout` composing spec 002's `TopBar` with the role's navigation and an `<Outlet/>` — `src/app/AppLayout.tsx`
- [x] T028 [US2] Exactly one navigation item marked current, in the brand accent — `src/app/AppLayout.tsx`
- [x] T029 [US5] Account cluster: avatar, name, role — and, since 2026-09-15, the route to Profile — `src/app/AppLayout.tsx`
- [x] T029a [US5] Notification marker with its count, both roles, opening nothing until a notification feature exists (FR-014a) — `src/shared/ui/layout/TopBar.tsx`, `src/app/request-list-count.ts`
- [x] T030 [US6] Sign-out control in the account cluster; clears the session and navigates to `/login` with history replaced — `src/app/AppLayout.tsx`
- [x] T031 [US5] Request-list marker and count badge, employees only, fed by a context defaulting to 0 so the badge is live without inventing a request list — `src/app/request-list-count.ts`, `src/app/AppLayout.tsx`
- [x] T032 [US5] Catalog offers the request-starting action to Employees only — `src/app/placeholders.tsx`
- [x] T033 [US6] Record the sign-out control as a designer addition — `docs/design-system/additions.md`

## Phase 6: Sign-in (US1)

- [x] T034 [US1] `LoginScreen` reproducing the 421×500 card on the full-bleed photograph, with spec 002's `SignInButton` calling `signIn()` — `src/features/auth/LoginScreen.tsx`
- [x] T035 [US1] Refused sign-in leaves the visitor on `/login` with a plain message, no session, and the control back at rest — no invented error vocabulary — `src/features/auth/LoginScreen.tsx`
- [x] T036 [US5] No chrome on the sign-in screen — `src/app/routes.tsx`
- [x] T037 [US3] Compose router and provider; replace the gallery as the app's root — `src/app/App.tsx`, `src/main.tsx`

## Phase 7: Responsive & Keyboard (US8)

- [x] T038 [US8] Exact source geometry at the design width — 87px bar, 32px gutter, 1344px content — `src/app/AppLayout.tsx`
  - Bar height and gutter are exact and asserted. **Content runs 1376, not 1344**: the source reaches 1344 from an asymmetric pair of gutters (32 left, 64 right), which a symmetric flow layout cannot reproduce. The gutter was kept and the deviation logged in `docs/design-system/additions.md` §3d for the designer.
- [x] T039 [US8] Navigation collapses to a reachable disclosure below the full-nav width; no horizontal overflow at any width — `src/shared/ui/layout/TopBar.tsx`
- [x] T040 [US8] Identity and sign-out stay reachable at every width — `src/app/AppLayout.tsx`
- [x] T041 [US8] All shell targets at least 44×44px below the design width — `src/app/AppLayout.tsx`
- [x] T042 [US8] Every shell control keyboard-reachable with a visible focus indicator — `src/app/AppLayout.tsx`
- [x] T043 [US8] Record the collapsed navigation as a designer addition — `docs/design-system/additions.md`

## Phase 8: Verification

- [x] T044 Sign in as each seeded role; assert landing destination and the exact navigation set. `navigation.ts` is pure, so assert it directly too — `src/features/auth/navigation.ts`
- [x] T045 For each role, open every permitted address directly, reload, and press back — `src/app/routes.tsx`
- [x] T046 For each role, open every forbidden address directly; assert the refusal and a working route back — `src/app/routes.tsx`
- [x] T047 Assert an unmatched path yields not-found, while a missing and a forbidden request id yield identical screens — `src/app/routes.tsx`
- [x] T048 Request a deep destination while signed out, sign in, assert arrival there rather than the landing screen — `src/features/auth/RequireAccess.tsx`
- [x] T049 Sign out then press back: no signed-in screen. Two tabs: sign out in one, the other stops — `src/features/auth/SessionProvider.tsx`
- [x] T050 Throttle session resolution; assert the loading state renders and `/login` never flashes for a signed-in user — `src/features/auth/SessionProvider.tsx`
- [x] T051 Shell at 360, 768, 1024 and 1440px — no horizontal overflow, navigation and sign-out reachable — `src/app/AppLayout.tsx`
- [x] T052 Confirm no arbitrary-value utilities appear in the diff, so SC-008 holds — `src/**/*.tsx`
- [x] T053 Review for FR-024: no inventory arithmetic, no status transition, no notification anywhere — `src/`
- [x] T054 Write the routing e2e assertions for spec 001's T020 to pick up when Playwright lands — `specs/003-app-shell-routing/plan.md`

---

## Dependencies

- **Phase 1 gates everything**, and T004 gates on spec 002 reaching Phase 8
- Phases 2 and 3 are parallelisable
- Phase 4 needs both Phase 2 and Phase 3
- Phase 5 needs Phase 4; Phase 6 needs Phase 5; Phase 7 needs Phase 6; Phase 8 needs Phase 7

## MVP slice

Phases 1–6 produce a signed-in, routed, role-scoped shell — enough for spec 001's UI tasks to begin. Phases 7–8 satisfy the responsive and verification criteria.

## Parallel opportunities

5 tasks marked `[P]`, all in Phase 3. This feature is mostly sequential: the session boundary gates the guard, which gates the layout, which gates sign-in.

## Not included

No Playwright tasks. SC-004 is verified by hand until spec 001's T020 lands; T054 writes the assertions for that suite rather than pulling QA tooling into a shell feature.

## How Phase 8 was verified

Better than by hand: the 16 assertions T054 writes for T020 are **implemented
today** in `scripts/check-shell.mjs`, driving a real browser through the same
CDP client spec 002's fidelity gates use — no new QA dependency (constitution
VIII). `npm run verify` runs them as the "shell routing + guards" gate, and all
of them pass. The table mapping each assertion to its requirement is in
`plan.md` § *Routing e2e assertions*.

Two verifications remain manual by necessity and are recorded rather than
claimed: FR-012a is proven against seeded ownership fixtures rather than real
request identifiers (there is no request API yet), and T052's "no arbitrary-value
utilities" is a diff review — `scripts/check-utilities.mjs` reports the three
this feature adds (`w-[421px]`, `min-h-[500px]`, `max-w-[629px]`), all of them
fixed geometry the source states and never tokenises.
