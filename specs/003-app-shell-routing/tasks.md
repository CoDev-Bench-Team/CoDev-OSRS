# Tasks: Application Shell, Routing & Role Navigation

**Spec**: `specs/003-app-shell-routing/spec.md`
**Plan**: `specs/003-app-shell-routing/plan.md`
**Structure**: By pipeline (plan 003's 8-step sequence), every task tagged to its user story

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

**Story key** — US1 sign-in and landing · US2 role navigation · US3 durable addresses · US4 guards · US5 persistent chrome · US6 sign-out · US7 loading and failure · US8 responsive

> **Blocked on spec 002.** FR-021 requires this shell to be built from spec 002's components and tokens. `TopBar`, `Avatar`, `PageHeader`, `SectionTitle`, `Button`, `SignInButton` and the brand logos must exist first. Do not start Phase 2 until spec 002 reaches Phase 8. Building against improvised styling means rewriting against the real components later.

---

## Phase 1: Preconditions

- [x] T001 Amend spec 001's auth clarification so D4 is a recorded amendment, not a silent override — `specs/001-office-supplies-mvp/spec.md`
- [x] T002 Record the routing decision — `docs/adr/0004-client-routing.md`, `ARCHITECT.md`
- [ ] T003 Add the routing dependency — `package.json`
- [ ] T004 **Gate** — confirm spec 002 Phase 8 is complete and the component barrel exports everything this feature needs — `src/shared/ui/index.ts`

## Phase 2: Session Boundary (US1)

- [ ] T005 [US1] `SessionSource` interface — `current`, `signIn`, `signOut`, `subscribe` — expressed in SPA terms only, no HTTP vocabulary — `src/features/auth/session-source.ts`
- [ ] T006 [US1] `Role`, `User`, `Session` types with `Role` as a closed union — `src/features/auth/types.ts`
- [ ] T007 [US1] Seeded implementation with one demo user per role — `src/features/auth/seeded-source.ts`
- [ ] T008 [US1] Session reference persistence: opaque token plus timestamp, never user or role, revalidated on every load so a stale reference is discarded rather than trusted — `src/features/auth/seeded-source.ts`
- [ ] T009 [US1] `SessionProvider`, `useSession()`, and the `unknown → signed-out | signed-in` status machine — `src/features/auth/SessionProvider.tsx`
- [ ] T010 [US6] Multi-tab propagation: back `subscribe` with a `storage` listener so sign-out in one tab reaches the others — `src/features/auth/SessionProvider.tsx`
- [ ] T011 [US1] Document the seeded demo users as non-production placeholders — `specs/001-office-supplies-mvp/quickstart.md`

## Phase 3: Feedback Components (US7)

None of these is designed in the source; all five go to the additions list.

- [ ] T012 [P] [US7] `LoadingState` for undetermined session status — `src/shared/ui/feedback/LoadingState.tsx`
- [ ] T013 [P] [US7] `NotFoundScreen` for an unmatched address — `src/shared/ui/feedback/NotFoundScreen.tsx`
- [ ] T014 [P] [US4] `ForbiddenScreen` with an explanation and a route back to the role's landing destination — `src/shared/ui/feedback/ForbiddenScreen.tsx`
- [ ] T015 [P] [US7] `Placeholder` naming its destination and stating the feature has not shipped, never mistakable for an error or empty result — `src/shared/ui/feedback/Placeholder.tsx`
- [ ] T016 [P] [US7] `ErrorBoundary` that preserves chrome and offers a route back — `src/shared/ui/feedback/ErrorBoundary.tsx`
- [ ] T017 [US7] Record all five as designer additions — `docs/design-system/additions.md`

## Phase 4: Routes & Guards (US3, US4)

- [ ] T018 [US3] Route map for the nine destinations, one source of truth — `src/app/routes.tsx`
- [ ] T019 [US4] `RequireAccess` resolving in order: `unknown` renders loading and never redirects; `signed-out` redirects to `/login` preserving the requested path; role not permitted renders the refusal; otherwise render — `src/features/auth/RequireAccess.tsx`
- [ ] T020 [US4] Guard reads live context rather than a route-definition snapshot, so a mid-session role change re-evaluates — `src/features/auth/RequireAccess.tsx`
- [ ] T021 [US3] `/` resolves to the role's landing destination, or `/login` when signed out — `src/app/routes.tsx`
- [ ] T022 [US1] Return a visitor to their originally requested destination after sign-in when their role permits it — `src/features/auth/RequireAccess.tsx`
- [ ] T023 [US4] `/requests/:id` — missing and forbidden collapse into one identical response so identifiers cannot be enumerated, while an unmatched path still yields a distinguishable not-found — `src/app/routes.tsx`
- [ ] T024 [US3] Placeholder elements for all eight product destinations — `src/app/placeholders.tsx`
- [ ] T025 [US4] Guard redirects use `replace`, never `push`, so back cannot land on a bouncing route — `src/features/auth/RequireAccess.tsx`

## Phase 5: Layout & Navigation (US2, US5, US6)

- [ ] T026 [US2] `navigationFor(role)` as a pure function derived from the AuthZ matrix — Employee: catalog, my requests, profile; Approver: pending queue, catalog, profile; Supply Admin: fulfillment, inventory, catalog, profile — `src/features/auth/navigation.ts`
- [ ] T027 [US5] `AppLayout` composing spec 002's `TopBar` with the role's navigation and an `<Outlet/>` — `src/app/AppLayout.tsx`
- [ ] T028 [US2] Exactly one navigation item marked current, in the brand accent — `src/app/AppLayout.tsx`
- [ ] T029 [US5] Account cluster: avatar, name, role — `src/app/AppLayout.tsx`
- [ ] T030 [US6] Sign-out control in the account cluster; clears the session and navigates to `/login` with history replaced — `src/app/AppLayout.tsx`
- [ ] T031 [US5] Request-list marker and count badge, employees only, fed by a context defaulting to 0 so the badge is live without inventing a request list — `src/app/request-list-count.ts`, `src/app/AppLayout.tsx`
- [ ] T032 [US5] Catalog offers the request-starting action to Employees only — `src/app/placeholders.tsx`
- [ ] T033 [US6] Record the sign-out control as a designer addition — `docs/design-system/additions.md`

## Phase 6: Sign-in (US1)

- [ ] T034 [US1] `LoginScreen` reproducing the 421×500 card on the full-bleed photograph, with spec 002's `SignInButton` calling `signIn()` — `src/features/auth/LoginScreen.tsx`
- [ ] T035 [US1] Refused sign-in leaves the visitor on `/login` with a plain message, no session, and the control back at rest — no invented error vocabulary — `src/features/auth/LoginScreen.tsx`
- [ ] T036 [US5] No chrome on the sign-in screen — `src/app/routes.tsx`
- [ ] T037 [US3] Compose router and provider; replace the gallery as the app's root — `src/app/App.tsx`, `src/main.tsx`

## Phase 7: Responsive & Keyboard (US8)

- [ ] T038 [US8] Exact source geometry at the design width — 87px bar, 32px gutter, 1344px content — `src/app/AppLayout.tsx`
- [ ] T039 [US8] Navigation collapses to a reachable disclosure below the full-nav width; no horizontal overflow at any width — `src/shared/ui/layout/TopBar.tsx`
- [ ] T040 [US8] Identity and sign-out stay reachable at every width — `src/app/AppLayout.tsx`
- [ ] T041 [US8] All shell targets at least 44×44px below the design width — `src/app/AppLayout.tsx`
- [ ] T042 [US8] Every shell control keyboard-reachable with a visible focus indicator — `src/app/AppLayout.tsx`
- [ ] T043 [US8] Record the collapsed navigation as a designer addition — `docs/design-system/additions.md`

## Phase 8: Verification

- [ ] T044 Sign in as each seeded role; assert landing destination and the exact navigation set. `navigation.ts` is pure, so assert it directly too — `src/features/auth/navigation.ts`
- [ ] T045 For each role, open every permitted address directly, reload, and press back — `src/app/routes.tsx`
- [ ] T046 For each role, open every forbidden address directly; assert the refusal and a working route back — `src/app/routes.tsx`
- [ ] T047 Assert an unmatched path yields not-found, while a missing and a forbidden request id yield identical screens — `src/app/routes.tsx`
- [ ] T048 Request a deep destination while signed out, sign in, assert arrival there rather than the landing screen — `src/features/auth/RequireAccess.tsx`
- [ ] T049 Sign out then press back: no signed-in screen. Two tabs: sign out in one, the other stops — `src/features/auth/SessionProvider.tsx`
- [ ] T050 Throttle session resolution; assert the loading state renders and `/login` never flashes for a signed-in user — `src/features/auth/SessionProvider.tsx`
- [ ] T051 Shell at 360, 768, 1024 and 1440px — no horizontal overflow, navigation and sign-out reachable — `src/app/AppLayout.tsx`
- [ ] T052 Confirm no arbitrary-value utilities appear in the diff, so SC-008 holds — `src/**/*.tsx`
- [ ] T053 Review for FR-024: no inventory arithmetic, no status transition, no notification anywhere — `src/`
- [ ] T054 Write the routing e2e assertions for spec 001's T020 to pick up when Playwright lands — `specs/003-app-shell-routing/plan.md`

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
