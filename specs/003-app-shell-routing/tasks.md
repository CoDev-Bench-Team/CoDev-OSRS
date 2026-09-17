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

---

## Addendum — T055: the published contract behind the session boundary

**Added 2026-09-17**, after the backend team published its contract
(<https://codev-osrs-backend.vercel.app/#/>). Maps to **FR-002**, **FR-003**, **FR-003a**,
**FR-003b**, **FR-017**, **FR-017a**, **FR-017b**.

This is the second half of FR-003 — "satisfiable today by seeded demo users **and later by the
backend team's published contract, with no change to the shell's behavior**" — so it belongs to
this feature rather than to a new spec.

| Task | File | Done |
|------|------|------|
| T055a | `src/shared/api.ts` — the SPA's only HTTP entry point; `credentials: 'include'`, `401` as a state rather than an error | yes |
| T055b | `src/features/auth/google-identity.ts` — Google Identity Services, confined to one file | yes |
| T055c | `src/features/auth/api-source.ts` — the second `SessionSource`, plus the contract→SPA user mapper | yes |
| T055d | `src/features/auth/active-source.ts` — picks the source from `VITE_GOOGLE_CLIENT_ID` | yes |
| T055e | `vite.config.ts` — proxy `/api` in development | yes |
| T055f | `docs/adr/0005-…` — the client-id decision and the `admin` role exception | yes |
| T055g | `src/features/auth/google-button-source.ts` — the optional `GoogleButtonSource` capability, shaped like `DemoAccountSource` | yes |
| T055h | `src/features/auth/GoogleSignInOverlay.tsx` — Google's button, invisible over the drawn control | yes |

**The claim this task set has to earn**: FR-003 says the shell's behavior must not change.
`SessionProvider.tsx`, `session-context.ts`, `session-source.ts`, `types.ts`, `RequireAccess.tsx`,
`destinations.ts` and `routes.tsx` are untouched; `src/app/App.tsx` gains one prop passing the
chosen source.

`LoginScreen.tsx` **is** edited, which the first pass of this work avoided. Google Identity
Services' `prompt()` turned out to render nothing and invoke no callback against the real client
id, so Google's own button has to receive the click — the Linear requirements say so too. The
screen therefore wraps the drawn control and conditionally mounts an overlay. It stays
boundary-shaped: the screen asks `hasGoogleButton(source)`, exactly as it already asks
`hasDemoAccounts(source)`, and contains no Google-specific code and no environment check. Swap the
source and the right control appears by itself.

**Known limitation, carried deliberately**: the contract's `role` enum is `admin | employee`, so
the **Approver role is unreachable through real sign-in** and Story 1 AC3 cannot be demonstrated
against the live API. It remains demonstrable through the seeded source. Recorded as an exception
in ADR-0005; exit condition is a third role value from the backend.

**Verified by hand against the live API** on 2026-09-17, with the real client id:

1. **A real Google sign-in completed.** `POST /auth/google` returned the user; the shell rendered
   the authenticated top bar — name, `Employee`, initials on the employee avatar colour, employee
   navigation — and landed on the catalog (FR-007).
2. **Reload restored the session** through `GET /auth/me`, same destination, no second Google
   login (FR-008). Google's script is not even fetched on an already-signed-in load.
3. **Sign-out** cleared the cookie: `POST /auth/logout` → 201, `GET /auth/me` → 401 afterwards.
   The button → `signOut()` → redirect wiring was exercised against the seeded source and returns
   to `/login` (FR-016).
4. Client id set, signed out → chooser gone, Google's button mounted over the drawn control at the
   same 242x64 rect, `GET /api/auth/me` 401 on load, `/catalog` redirects to `/login` (FR-001).
5. Keyboard (FR-023): the drawn control is `inert`, Google's button is the focusable one, and the
   overlay goes from `opacity: 0` to `1` while focus is inside it, so the focus indicator is
   visible.
6. `VITE_GOOGLE_CLIENT_ID` unset → seeded source, chooser present, Employee signs in and lands on
   the catalog, sign-out returns to `/login`. No request to Google or to the backend.
7. Sign-in refused → "Signing in…" clears and "Sign-in did not succeed. Please try again."
   appears, control back at rest so a retry is possible (FR-003b).
8. Production build with no client id → Google and the API source are tree-shaken out entirely
   (`accounts.google.com` and `/auth/google` absent from the bundle).

`npm run verify`'s four browser-driven gates do not run in this environment — they fail
identically on the pristine base commit, so they are not a regression, but they are also not
evidence. The list above is what was actually observed.

**Three defects found by using it, all fixed:**

1. *Sign-in failed on a second dev server.* Vite silently moves to the next free port when 5173 is
   taken, and only `http://localhost:5173` is in the OAuth client's Authorized JavaScript origins,
   so Google refused the origin and the screen showed its generic refusal with nothing to go on.
   The dev server is now pinned with `strictPort: true`: a busy 5173 is a startup error, not a
   silent move to a port where authentication cannot work. **This was the real cause of the
   reported "Sign-in did not succeed"; sign-in works on 5173.**
2. *The drawn pill appeared to stretch into Google's button on click.* The overlay revealed itself
   on `:focus-within`, and a mouse click focuses Google's button too, so every press exposed the
   vertically-stretched overlay. It now reveals on `:focus-visible` — the browser's own answer to
   "did this focus come from the keyboard" — and drops the stretch when it does reveal, so a
   keyboard user sees Google's button undistorted.
3. *A second press cancelled the first attempt.* Found while investigating (2), not a cause of it:
   Google's popup takes a moment, so pressing again is natural, and the second press superseded the
   first — rejecting its promise, so the screen reported a failure for an attempt that had not
   failed. Repeated presses now join the attempt in flight. One press, one attempt, one outcome.

**Note on the timeout in `google-identity.ts`**: Google Identity Services returns *nothing* — no
callback, no `error_callback` — when the client id is one its project does not recognise. Without
a backstop the promise never settles and the control sticks on "Signing in…" permanently, which
violates FR-003b. The three-minute timeout exists for that, and was verified by temporarily
shortening it.
