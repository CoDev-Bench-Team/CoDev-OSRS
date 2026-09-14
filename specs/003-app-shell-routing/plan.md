# Implementation Plan: Application Shell, Routing & Role Navigation

**Date**: 2026-09-12
**Spec**: `specs/003-app-shell-routing/spec.md`
**Status**: Draft

## Summary

Replace the Vite starter with a routed application shell: React Router v7 supplies durable addresses, a session boundary supplies identity and role, and a single guard component enforces the authorization matrix on every entry. Every destination ships as a named placeholder, so this feature delivers the frame and the empty rooms — nothing product-shaped moves inside them.

## Technical Context

**Stack**: React 19.2, TypeScript ~6.0 (`strict` on), Vite 8.3, Tailwind CSS 4.3
**Primary Dependencies**: `react-router` ^7 — the only addition, recorded in [ADR-0004](../../docs/adr/0004-client-routing.md)
**Storage**: Session state in memory. One browser-storage key holds a session *reference*, not a session — see §Session Persistence. No application data is persisted.
**Target Layer(s)**: Frontend only.
**Performance Goals**: Navigation is client-side and instantaneous; no perceptible delay between destinations.
**Constraints**: FR-004 and `ARCHITECT.md` §8 — no invented REST routes, payloads, fields or error codes. FR-024 — no inventory arithmetic, no status transitions, no notifications. Constitution II — one role per user, no switcher (D5).

## Blocking Preconditions

| # | Precondition | Status |
|---|--------------|--------|
| P1 | **Spec 001's auth clarification is amended** | **Done** (2026-09-12). `specs/001-office-supplies-mvp/spec.md` now carries a Session 2026-09-12 amendment superseding "email + password" with the designed Google control delegating to a session boundary. Without it, D4 was an undocumented override of a resolved clarification. |
| P2 | **Spec 002 has shipped** | **Not yet.** FR-021 requires the shell to be built from spec 002's components and tokens. `TopBar`, `Avatar`, `PageHeader`, `SectionTitle`, `Button` and the brand logos must exist before this feature can render anything. This is a hard sequencing dependency, not a soft one. |

## Data Model

No persisted entities. The spec's entities become runtime constructs:

| Spec entity | Realisation |
|-------------|-------------|
| Session | `Session = { user: User; role: Role }` with `status: 'unknown' \| 'signed-out' \| 'signed-in'`, held in one React context |
| Destination | A route entry: path, element, and the roles permitted to reach it |
| Navigation set | Derived from `role` by a pure function, not hand-maintained per screen |
| Guard | One `<RequireAccess>` component wrapping every protected route element |
| Placeholder | `<Placeholder name="…" />` — names the destination and states the feature has not shipped (FR-020) |

```
Role = 'employee' | 'approver' | 'supply_admin'
User = { id: string; name: string; email: string; initials: string; role: Role }
```

`Role` is a closed union. There is no combined or elevated role and no way to change role without a full sign-out (FR-005, D5).

## Session Boundary

The central design decision, implementing D3. The shell must never learn how authentication works.

```
Requirements realised here: FR-001 (no destination without a session), FR-002 (one boundary for identity and role), FR-003 (seeded now, contract later), FR-003a and FR-003b (sign-in surface and failure).

```
interface SessionSource {
  current(): Promise<Session | null>   // resolve an existing session
  signIn(): Promise<Session>           // the designed control calls this
  signOut(): Promise<void>
  subscribe(fn: () => void): () => void  // multi-tab + role-change notification
}
```

`signIn()` rejects rather than returning `null` when authentication is refused, so failure is never mistaken for a signed-out success.

- `src/features/auth/session-source.ts` — the interface above, expressed purely in SPA terms.
- `src/features/auth/seeded-source.ts` — today's implementation. Three seeded demo users, one per role, documented in `quickstart.md` per constitution IX.
- `src/features/auth/SessionProvider.tsx` — context, `useSession()`, and the `status` machine.

**Why the interface matters for FR-004**: it is defined in the SPA's own vocabulary — `Session`, `User`, `Role` — not in HTTP terms. There is no invented endpoint, no invented payload shape, no invented error code. When the backend publishes its contract, a second implementation of `SessionSource` is written against it and the shell is untouched.

**Sign-in mechanism (FR-003a)**: `LoginScreen` renders spec 002's `SignInButton` as designed and calls `signIn()`. The SPA implements no authentication (spec 001 amendment, D4).

**Refused sign-in (FR-003b)**: a rejected `signIn()` leaves the visitor on `/login` with a plain message, creates no session, and leaves `status` at `signed-out`. The message states that sign-in did not succeed without reporting why — the SPA does not know why, and guessing would invent an error vocabulary the backend contract has not published (FR-004). The control returns to its resting state so a retry is possible.

**Seeded users** — one per role, so SC-001 and SC-003 are exercisable:

| Role | Name | Avatar |
|------|------|--------|
| `employee` | Maya Santos | orange |
| `approver` | Samantha Reyes | (to be assigned — the source designs only two avatars) |
| `supply_admin` | Ethan Cruz | deep green |

The design file provides avatar colours for two identities only. A third is an addition, logged in `docs/design-system/additions.md`.

## Session Persistence

Two spec requirements pull in opposite directions, and the resolution matters.

- FR-008 and Story 3 AC1 require a reload to keep the user signed in and on the same destination.
- The Edge Cases require that "a user signs in on a device where a previous session was left behind → the stale session is **not** silently reused."

Persisting the session object itself would satisfy the first and violate the second: the app would trust whatever it found in storage, indefinitely, without revalidation.

The resolution is that storage holds only a **reference** — an opaque token plus a timestamp — never the user, role, or any authorization fact. On every load:

1. `status` starts `unknown`.
2. `current()` is asked to resolve the reference into a `Session`.
3. It returns a session only if the reference is still valid; otherwise it returns `null` and the reference is cleared.

So a reload restores the session (FR-008) because the reference revalidates, while a stale reference is discarded rather than trusted. Today the seeded implementation validates against an expiry it sets itself; when the backend contract publishes, the same call becomes a real session lookup and **no shell code changes**. Role is never read from storage, so a role change is picked up on the next resolution rather than being cached (FR-017b).

## Route Map

Implements the spec's Destination Set table. Paths are the concrete form of destinations the spec names in product language.

| Path | Destination | Employee | Approver | Supply Admin |
|------|-------------|----------|----------|--------------|
| `/login` | Sign-in | signed-out only | signed-out only | signed-out only |
| `/catalog` | Catalog | ✓ **landing** | ✓ | ✓ |
| `/requests` | My requests | ✓ | — | — |
| `/requests/:id` | Request detail | own only | any | any |
| `/approvals` | Pending queue | — | ✓ **landing** | — |
| `/fulfillment` | Fulfillment queue | — | — | ✓ **landing** |
| `/inventory` | Inventory management | — | — | ✓ |
| `/profile` | Profile | ✓ | ✓ | ✓ |
| `*` | Not found | ✓ | ✓ | ✓ |

`/` redirects to the signed-in role's landing destination, or to `/login` when signed out.

## Guards

One component, applied to every protected route element, so authorization cannot be forgotten per screen (FR-010).

```
<RequireAccess allow={['supply_admin']}> <InventoryPlaceholder/> </RequireAccess>
```

**What this guard is and is not.** It is a *user-experience* boundary: it keeps a role out of screens that are not theirs and gives them somewhere sensible to land. It is **not** a security boundary. Everything here runs in the browser and can be bypassed by anyone willing to edit client state. Spec 001's SC-005 — that a user in one role cannot complete another role's action "through the UI or API" — is satisfied only when the API enforces the same matrix independently, which `ARCHITECT.md` §7 makes an API responsibility. Nothing in this feature may be read as relieving the backend of that. The guard's job is that an Approver never *sees* the inventory screen; the API's job is that they cannot *change* inventory.

Resolution order:

1. `status === 'unknown'` → render the loading state; never redirect yet (FR-018 — this is what prevents a signed-in user seeing a flash of `/login`).
2. `status === 'signed-out'` → redirect to `/login`, recording the requested path so FR-013 can return the user to it after sign-in.
3. Role not in `allow` → render the refusal screen with a route back to the role's landing destination (FR-011).
4. Otherwise render.

Because the guard reads live context rather than a value captured at route-definition time, a role change mid-session re-evaluates on the next render (FR-017b).

### Avoiding redirect loops and flicker

A status machine, storage-event wake-ups and guards reading live context are a well-known recipe for redirect loops and sign-in flicker. Three rules keep it deterministic:

- **`unknown` never redirects.** Only `signed-out` does. A guard that cannot yet know renders the loading state and waits, which is what makes FR-018 true.
- **One redirect authority.** Guards redirect; the provider never navigates. A storage event only updates `status`; the guard that re-renders decides where to go. Two independent navigators is how loops start.
- **Redirects replace, never push.** A guard redirect uses `replace`, so browser back cannot land the user on a route that will immediately bounce them again (also FR-016).

### Record addresses (FR-012a)

`/requests/:id` is the one address that identifies a record, and it must not reveal whether that record exists. Missing and forbidden collapse into one identical response — same screen, same words, same status handling — so request identifiers cannot be enumerated. An unmatched *path* still produces a distinguishable not-found (FR-012), because a typo must stay diagnosable.

**Honest limitation**: this feature has no request data. The guard shape, the shared response, and the ownership check are implemented and unit-testable against seeded fixtures, but the real ownership decision needs the backend contract. The fixtures exist to prove the collapse behaves identically for both cases, not to model real requests.

## Component / Module Breakdown

```
src/app/
  App.tsx                   router, provider composition (replaces the Vite starter)
  routes.tsx                the route map above, one source of truth
  AppLayout.tsx             persistent chrome + <Outlet/>
src/features/auth/
  session-source.ts         the SessionSource interface
  seeded-source.ts          seeded demo implementation
  SessionProvider.tsx       context, useSession(), status machine
  RequireAccess.tsx         the guard
  LoginScreen.tsx           the designed card; calls signIn()
  navigation.ts             role → navigation set (pure, unit-testable)
src/shared/ui/feedback/     (extends spec 002's library)
  LoadingState.tsx          FR-018
  NotFoundScreen.tsx        FR-012
  ForbiddenScreen.tsx       FR-011
  Placeholder.tsx           FR-020
  ErrorBoundary.tsx         FR-019
```

Everything visual composes spec 002's components (FR-021). The five feedback components are the only new UI, and none of them is designed in the source — all five go to `additions.md`.

### Persistent chrome (FR-014, FR-015)

`AppLayout` renders spec 002's `TopBar` with the navigation set for the current role, plus the account cluster and a sign-out control. The request-list marker and its count render **only for employees**.

**The count has no source yet.** The request list is spec 001's T010, which has not shipped. `AppLayout` takes the count from a small context with a default of 0, so the badge is wired and live-updating (Story 5 AC3) without this feature inventing a request list.

### Sign-out and multi-tab (FR-016, FR-017a)

Sign-out clears the session and navigates to `/login` with history replaced, so browser back cannot restore a signed-in screen. `SessionSource.subscribe` is backed by a `storage` event listener, so a sign-out in one tab wakes every other tab, which then re-resolves and lands on `/login`.

### Responsive (FR-022)

Carries spec 002's breakpoints. Above the design width, the source's exact bar geometry. Below it, navigation collapses into a disclosure control; the account cluster keeps identity and sign-out reachable at every width; all targets ≥44×44px.

## API Contracts

**None.** FR-004 and `ARCHITECT.md` §8 reserve the REST contract to the backend team. This feature adds no `src/shared/api.ts` work and issues no HTTP request.

## Dependencies

| Package | Why | Record |
|---------|-----|--------|
| `react-router` ^7 | Durable addresses, guards, history, e2e targets | [ADR-0004](../../docs/adr/0004-client-routing.md) |

One addition. `ARCHITECT.md` §2 and §13 updated.

## Verification

| Requirement | How it is checked |
|-------------|-------------------|
| FR-006, FR-007 / SC-001 | Sign in as each seeded role; assert landing destination and the exact navigation set. `navigation.ts` is pure, so this is also a unit test. |
| FR-008, FR-009 / SC-002 | For each role, open every permitted address directly, reload, and press back. |
| FR-010, FR-011 / SC-003 | For each role, open every forbidden address directly; assert the refusal screen and a working route back. |
| FR-012, FR-012a | An unmatched path yields not-found; a missing and a forbidden request id yield byte-identical screens. |
| FR-013 | Request a deep destination while signed out, sign in, assert arrival at that destination rather than the landing one. |
| FR-016, FR-017a / SC-005 | Sign out, press back, assert no signed-in screen. Two tabs: sign out in one, assert the other stops. |
| FR-018 | Throttle session resolution; assert the loading state renders and `/login` never flashes for a signed-in user. |
| FR-022 / SC-006 | Shell at 360, 768, 1024, 1440px — no horizontal overflow, nav and sign-out reachable. |
| FR-023 / SC-007 | Keyboard walk of the shell; every control reachable with a visible focus indicator. |
| SC-004 | A Playwright test opens each destination by URL in one navigation. **Playwright arrives with spec 001's T020**, so until then this is verified manually and the assertion is written for that suite. |
| FR-021 / SC-008 | The five feedback components are the only new UI in this feature and the main risk to SC-008. Each is reviewed against spec 002's token set; with Tailwind's default namespaces cleared (plan 002), a non-token value cannot compile, so this is largely structural. Confirm no arbitrary-value utilities (`text-[#…]`, `p-[13px]`) appear in the diff. |
| FR-024 | Review: no inventory arithmetic, no status transition, no notification anywhere in the diff. |

## Implementation Sequence

1. **Dependency + ADR** — add `react-router`; ADR-0004 is already written
2. **Session boundary** — `session-source.ts`, `seeded-source.ts`, `SessionProvider`, the status machine
3. **Feedback components** — loading, not-found, forbidden, placeholder, error boundary
4. **Route map + guard** — `routes.tsx`, `RequireAccess`, redirects, `/` resolution
5. **Layout** — `AppLayout`, `navigation.ts`, account cluster, sign-out, request-list badge context
6. **Login** — `LoginScreen` against the designed card; replace the Vite starter in `App.tsx`
7. **Responsive + keyboard** — nav collapse, 44px targets, focus walk
8. **Verification + docs** — the table above; `additions.md` entries for the five feedback screens, the sign-out control, the collapsed nav, and the third avatar colour

Steps 2 and 3 are parallelisable. Step 4 depends on both.

## Known Risks

Accepted rather than mitigated.

| Risk | Why accepted | What to watch |
|------|--------------|---------------|
| **Hard dependency on spec 002.** P2 means this feature cannot start until the component library exists, and the two specs are queued in a 4-week MVP. | Building the shell against placeholder styling would mean rewriting it against real components later — more total work, not less. | If 002 slips, the honest move is to re-sequence, not to start 003 with improvised styling. |
| **SC-004 cannot be automated yet.** Playwright arrives with spec 001's T020, so "a test reaches any destination by address" is verified by hand until then. | Adding Playwright here would pull QA tooling into a shell feature and pre-empt a task spec 001 already owns. | If T020 slips past 003's completion, the routing e2e assertions are the first ones to write when it lands. |
| **The guard is client-side only.** A determined user can reach any screen by editing client state; only the API can actually prevent cross-role action. | Unavoidable in an SPA, and `ARCHITECT.md` §7 already assigns enforcement to the API. Stating it plainly is the mitigation — the danger is a reviewer mistaking the guard for security. | When the backend contract publishes, confirm every guarded destination has a matching server-side check. Spec 001's SC-005 is not satisfied by this feature alone. |
| **Request-detail ownership is only shape-deep.** With no API, the ownership check runs against seeded fixtures, so FR-012a is proven behaviourally but not against real data. | The alternative is inventing a request contract, which FR-004 and `ARCHITECT.md` §8 forbid outright. | When the contract publishes, re-verify FR-012a against real identifiers before trusting it. |

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Implements spec 003; its one contradiction of spec 001 is amended, not silently overridden (P1) |
| II. Three Distinct Human Roles | PASS | Closed `Role` union, three navigation sets from the AuthZ matrix, no switcher (D1, D5) |
| III. Inventory Integrity | N/A | No inventory logic (FR-024) |
| IV. Explicit Request State Machine | N/A | No transitions (FR-024) |
| V. Notification Completeness | N/A | No notifications (FR-024) |
| VI. Independently Testable Increments | PASS | Every story demonstrable against placeholders; e2e assertions written for T020 |
| VII. Typed Contracts | PASS | `strict` on; closed unions; the session boundary invents no REST shapes |
| VIII. MVP Restraint | PASS | One dependency, recorded in ADR-0004 as the principle requires |
| IX. Secrets and Internal Data | PASS | Seeded demo users only, documented in `quickstart.md`; no secrets |

No justified violations.
