# Feature Specification: Application Shell, Routing & Role Navigation

> **Amended for constitution 3.0.0 (2026-09-24, BEN-114).** This spec shipped
> against three roles; `approver` and `supply_admin` are retired in favour of a
> single **Admin** ([ADR-0005](../../docs/adr/0005-two-role-model.md)). Stories 1,
> 2 and 4, FR-006, FR-007, FR-009, the Destination Set, SC-001, D1, D6 and the
> Known Gaps now describe two roles, as the 2026-09-22 design draws them. The
> earlier clarification sessions are left as the record of what was decided
> then. See Session 2026-09-24 below, Phase 0 of
> [specs/001-office-supplies-mvp/tasks.md](../001-office-supplies-mvp/tasks.md)
> and [drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md).

**Feature Branch**: `003-app-shell-routing`
**Created**: 2026-09-12
**Status**: Draft
**Sources**: `specs/001-office-supplies-mvp/spec.md`, `ARCHITECT.md` §7 (AuthZ matrix), `~/Downloads/OSRS Design System/ui_kits/osrs-web/`

## Overview

Build the frame every OSRS screen lives inside: sign-in, a durable session, addressable destinations, and navigation scoped to the signed-in user's role. This feature delivers the shell and the empty rooms — it does not furnish them. Each destination renders a placeholder until its own feature lands.

**Relationship to other specs**: consumes the components from spec 002 (top bar, avatar, page header, buttons). Implements spec 001's T004–T007 and makes its remaining UI tasks addressable. Adds no product behavior — no inventory math, no request transitions, no notifications.

## User Stories

### Story 1 — Sign in and land on your own work (Priority: P1)

A Codev staff member opens the application, signs in, and arrives directly at the screen their job starts from — an Employee at the catalog, an Admin at the Requests Queue. They never see another role's landing screen.

**Why this priority**: Nothing else in the product is reachable until a session exists and a role is known.

**Acceptance Criteria**:

1. **Given** a signed-out visitor, **When** they open any address in the application, **Then** they are sent to sign-in and no product screen is rendered.
2. **Given** valid credentials for an Employee, **When** they sign in, **Then** they land on the catalog.
3. **Given** valid credentials for an Admin, **When** they sign in, **Then** they land on the Requests Queue.
4. ~~Supply Admin lands on the fulfillment queue.~~ *Withdrawn 2026-09-24 — one Admin, one queue.*
5. **Given** the sign-in screen, **When** it renders, **Then** it is the login card as drawn — the product lockup, the welcome line, the Google sign-in control, and the copyright line, over the full-bleed photograph.
6. **Given** sign-in is attempted and refused, **When** the refusal returns, **Then** a clear failure message appears, no session is created, and the visitor stays on sign-in.
7. **Given** a signed-out visitor who requested a specific destination, **When** they sign in successfully and their role permits that destination, **Then** they arrive at it rather than at their default landing screen.

---

### Story 2 — Navigation shows only what your role may do (Priority: P1)

Each of the two roles sees the navigation set the design draws for it. An Employee never sees the Requests Queue, Assets, Inventory or History. An Admin never sees an Employee's own My Requests.

**Why this priority**: Role separation is the product's founding constraint (constitution II); navigation is where a user first perceives it.

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** the shell renders, **Then** navigation offers the catalog and their own requests — and nothing else; Profile is reached from the account cluster (FR-006a).
2. **Given** a signed-in Admin, **When** the shell renders, **Then** navigation offers the Requests Queue, Assets, Inventory and History — and nothing else.
3. ~~Supply Admin navigation set.~~ *Withdrawn 2026-09-24 — merged into criterion 2.*
4. **Given** any signed-in user, **When** they are on a destination, **Then** exactly one navigation item is marked current, in the brand accent.
5. **Given** any signed-in user, **When** they view the catalog, **Then** they can see stock but only an Employee is offered the action that starts a request.

---

### Story 3 — Every screen has a durable address (Priority: P1)

A user can bookmark a screen, reload it, share a link to a specific request, and use browser back and forward as they expect. Reloading never loses their place or drops them at a landing screen.

**Why this priority**: Required for a demo that survives a refresh, and for the Playwright regression suite constitution VI mandates — a test must reach a screen directly rather than clicking through the whole pipeline.

**Acceptance Criteria**:

1. **Given** a signed-in user on any destination, **When** they reload the page, **Then** the same destination renders, still signed in.
2. **Given** a link to a specific request, **When** an authorized user opens it, **Then** that request's detail destination renders directly.
3. **Given** a user who has navigated across several destinations, **When** they press browser back, **Then** they return to the previous destination rather than leaving the application.
4. **Given** any destination in the application, **When** an automated test targets it by address, **Then** it renders without the test replaying the steps that would normally lead there.
5. **Given** an address that matches no destination, **When** it is opened, **Then** a not-found screen renders inside the shell with a route back to the user's landing screen.

---

### Story 4 — A role cannot reach another role's screens (Priority: P1)

An Employee who types the inventory address, or an Admin who opens an Employee's My Requests address, is refused. Guessing a URL is not a way around the authorization matrix.

**Why this priority**: Spec 001's SC-005 requires that a user in one role cannot complete another role's action through the UI; hiding a nav item is not enough.

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** they open the inventory-management address directly, **Then** access is refused and they are not shown inventory controls.
2. **Given** a signed-in Admin, **When** they open the My Requests address directly, **Then** access is refused.
3. **Given** a signed-in Employee, **When** they open any request detail address — their own, another employee's, or one that does not exist — **Then** the response is identical in all three cases. *(Amended 2026-09-23: the Employee's detail is a side panel on My Requests, so the address refuses every id alike.)*
4. **Given** a signed-in Admin, **When** they open any request detail by address, **Then** it renders regardless of the request's current status; the actions offered on it remain gated by status and role.
5. **Given** any refusal, **When** it occurs, **Then** the user sees an explanation and a route back to a screen they may use — not a blank page or a silent redirect loop.
6. **Given** the shell's guards, **When** any protected destination is reached, **Then** authorization is checked against the signed-in role every time, not only on first entry.

---

### Story 5 — Persistent chrome is always present and always correct (Priority: P1)

Every signed-in screen carries the same top bar: the product lockup, the role's navigation, and the account cluster showing who is signed in and in what role. An Employee's bar also carries the request-list marker with its live item count.

**Why this priority**: The bar is the only element on every screen; if it is wrong, every screen is wrong.

**Acceptance Criteria**:

1. **Given** any signed-in destination, **When** it renders, **Then** the top bar is present with the lockup, role navigation, and the account cluster naming the signed-in user and their role.
2. **Given** a signed-in Employee, **When** the shell renders, **Then** the request-list marker and its count badge appear; for other roles they do not.
3. **Given** an Employee whose request list changes, **When** items are added or removed, **Then** the count badge reflects the new total without a reload.
4. **Given** any signed-in user, **When** the shell renders, **Then** their avatar shows their initials on a flat colour, never a photograph.
5. **Given** the sign-in screen, **When** it renders, **Then** no top bar is present.

---

### Story 6 — Sign out, and lose access cleanly (Priority: P2)

A user signs out from the account cluster. The session ends, they return to sign-in, and pressing back does not restore a signed-in screen. If a session expires while they work, they are told and returned to sign-in rather than shown a broken screen.

**Why this priority**: Required to demonstrate role switching during the MVP demo, and to avoid a stale session silently failing every action. Less blocking than getting in.

**Acceptance Criteria**:

1. **Given** a signed-in user, **When** they sign out, **Then** the session ends and the sign-in screen renders.
2. **Given** a user who has just signed out, **When** they press browser back, **Then** no signed-in screen is restored.
3. **Given** a session that has become invalid, **When** the user next acts, **Then** they are informed and returned to sign-in.
4. **Given** a user who signs out and signs in as a different role, **When** the shell renders, **Then** navigation, landing screen and account cluster all reflect the new role with no trace of the previous one.

---

### Story 7 — The shell holds together while it waits and when it breaks (Priority: P2)

While the session is being established the user sees a deliberate loading state, not a flash of the sign-in screen. If a screen inside the shell fails, the shell survives and offers a way out.

**Why this priority**: The design file specifies no loading or error states; without them the demo shows flicker and blank screens.

**Acceptance Criteria**:

1. **Given** an application still determining whether a session exists, **When** it renders, **Then** a loading state shows — never a momentary sign-in screen for an already-signed-in user.
2. **Given** a destination that fails to render, **When** the failure occurs, **Then** the top bar and navigation survive and the user is offered a route back.
3. **Given** any waiting state in the shell, **When** it renders, **Then** it uses the foundation's tokens and components rather than an ad-hoc spinner.

---

### Story 8 — The shell works below the designed width (Priority: P2)

The shell remains usable from a phone up to the 1440px design width, carrying forward the responsive commitment made in spec 002.

**Why this priority**: Consistency with the foundation. The demo runs at desktop width, so this extends rather than blocks it.

**Acceptance Criteria**:

1. **Given** a viewport at the design width, **When** the shell renders, **Then** it matches the source layout: an 87px bar, 32px gutters, 1344px of content.
2. **Given** a viewport too narrow for the full navigation, **When** the shell renders, **Then** navigation collapses into a reachable control and no horizontal scrolling occurs.
3. **Given** a narrow viewport, **When** the account cluster renders, **Then** identity and sign-out remain reachable.

---

### Edge Cases

- A user's role changes while they are signed in and viewing a screen their new role may not use → navigation and access re-evaluate rather than stranding them on a forbidden screen.
- Two tabs open, the user signs out in one → the other does not continue to act as signed in.
- A deep link to a request that does not exist, versus one that exists but belongs to someone else → both produce the same response (for an Employee, the role refusal the address gives every id since 2026-09-23), so request identifiers cannot be enumerated (FR-012a), while a mistyped address still produces a diagnosable not-found (FR-012).
- The address for a destination whose feature has not shipped yet → renders a placeholder inside the shell, not a not-found screen.
- A user signs in on a device where a previous session was left behind → the stale session is not silently reused.
- Navigation labels grow long (a localized or renamed queue) → the bar reflows rather than overlapping the account cluster.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST require an authenticated session before rendering any destination other than sign-in.
- **FR-002**: The shell MUST obtain the signed-in user's identity and single role through one defined session boundary, so the backing implementation can change without altering the shell.
- **FR-003**: The session boundary MUST be satisfiable today by seeded demo users and later by the backend team's published contract, with no change to the shell's behavior.
- **FR-003a**: The sign-in screen MUST present the Google sign-in control as drawn in the design file and MUST delegate to the session boundary. The SPA MUST NOT implement an authentication mechanism of its own; whether the backend authenticates against Google or against seeded users is a backend decision, settled when the contract publishes.
- **FR-003b**: A refused sign-in MUST leave the visitor on the sign-in screen with a clear message and no session.
- **FR-004**: The SPA MUST NOT invent routes, payloads, fields or error codes that the backend contract does not expose.
- **FR-005**: Every user MUST hold exactly one role; the shell MUST NOT support a combined or elevated role, and MUST NOT offer any control that changes the acting role without a full sign-out and sign-in.
- **FR-006**: Navigation offered to a user MUST be derived from their role — Employee: Catalog, My Requests; Admin: Requests Queue, Assets, Inventory, History — which are the bars the 2026-09-22 design draws. *(Amended 2026-09-15: profile left the navigation, history joined it. Amended 2026-09-24: two roles (ADR-0005); the Admin bar does not offer Catalog, though the Admin may still open it by address per `ARCHITECT.md` §7. See Session 2026-09-24.)*
- **FR-006a**: Profile MUST be reachable from the account cluster rather than from navigation.
- **FR-007**: Each role MUST have a defined landing destination reached on sign-in: Employee the catalog, Admin the Requests Queue. *(Amended 2026-09-24.)*
- **FR-008**: Every destination MUST have a stable, shareable address that survives reload and supports browser back and forward.
- **FR-009**: Request detail MUST be addressable by request identifier for an Admin, who MUST reach any request regardless of status, with the actions offered on it still gated by status and role. An Employee's request detail is a side panel on My Requests with no address of its own. *(Amended 2026-09-23, BEN-45.)*
- **FR-010**: Every protected destination MUST authorize against the signed-in role on every entry, independently of whether its navigation item is visible.
- **FR-011**: A refused destination MUST produce an explanation and a route to a permitted screen — never a blank screen, a silent redirect loop, or a partially rendered forbidden screen.
- **FR-012**: An address matching no destination MUST produce a not-found screen inside the shell, distinguishable from a refusal, so that a mistyped address is diagnosable.
- **FR-012a**: Addresses that identify a specific record MUST NOT reveal whether that record exists. A request the user may not see and a request that does not exist MUST produce the same response.
- **FR-013**: A signed-out visitor who requests a specific destination MUST be returned to it after successful sign-in, provided their role permits it.
- **FR-014**: The shell MUST render persistent chrome on every signed-in destination: product lockup, role navigation with exactly one current item, an account cluster naming the signed-in user and role, and a notification marker.
- **FR-014a**: The notification marker MUST show a count when there is one. Until a notification feature ships it MUST NOT present itself as a control, because there is nothing for it to open.
- **FR-015**: The request-list marker and its live count MUST appear only for Employees.
- **FR-016**: The shell MUST provide sign-out; after it, no signed-in screen may be restored by browser history.
- **FR-017**: An invalidated session MUST return the user to sign-in with an explanation rather than leaving a broken screen.
- **FR-017a**: When a session ends in one browser tab, other open tabs MUST stop acting as signed in rather than continuing to present a signed-in shell.
- **FR-017b**: If the signed-in user's role changes during a session, navigation and access MUST re-evaluate against the new role, and a user left on a destination their new role may not use MUST be moved to one it permits.
- **FR-018**: The shell MUST show a deliberate loading state while session status is undetermined, never a flash of the sign-in screen for a user who is signed in.
- **FR-019**: A failure inside a destination MUST NOT destroy the shell; navigation and a route back MUST survive.
- **FR-020**: Destinations whose features have not yet shipped MUST render a placeholder inside the shell that names the destination and states that the feature has not shipped, keeping the shell's chrome and navigation intact. A placeholder MUST NOT be mistakable for a not-found screen, an error, or an empty result.
- **FR-021**: The shell MUST be built from spec 002's components and tokens, introducing no new colour, type size, radius or shadow.
- **FR-022**: The shell MUST render without horizontal overflow at every width from 360px to 1440px, matching the source layout exactly at 1440, with navigation and sign-out reachable at every width.
- **FR-023**: Every shell control MUST be reachable and operable by keyboard with a visible focus indicator.
- **FR-024**: The shell MUST NOT implement inventory arithmetic, request status transitions, or notification sending.

### Destination Set

The complete set of addressable destinations and the roles permitted to reach each. SC-002 and SC-003 are checked against this table.

*Amended 2026-09-24 to the two-role route table in `ARCHITECT.md` §7.*

| Destination | Employee | Admin | Notes |
|-------------|----------|-------|-------|
| Sign-in | signed-out only | signed-out only | No shell chrome |
| Catalog | yes | yes (by address; not in the Admin bar) | Only an Employee is offered the action that starts a request |
| My requests | yes | no | The signed-in Employee's own history. Their request detail is a side panel here, not an address (amended 2026-09-23) |
| ~~Request detail~~ | — | — | **Retired 2026-09-26** (spec 008): the Admin reviews in a panel over `/queue`; `/requests/:id` is not-found for everyone |
| Requests Queue | no | yes | Admin landing destination — review, approve, and fulfill (replaces the pending-requests and fulfillment queues) |
| Assets | no | yes | Added 2026-09-24 |
| Inventory | no | yes | |
| History | no | yes | Resolved requests across all requestors — completed, rejected, cancelled (added 2026-09-15) |
| Profile | yes | yes | The signed-in user's own; reached from the account cluster, not from navigation |
| Not found | any signed-in | any signed-in | Reached by an unmatched address |

Landing destinations: Employee → catalog; Admin → Requests Queue.

Every destination except sign-in and not-found ships in this feature as a placeholder (FR-020); their contents belong to later features.

### Key Entities

- **Session**: The signed-in user's identity, single role, and lifecycle (established, active, ended, invalidated).
- **Destination**: An addressable screen, with the roles permitted to reach it.
- **Navigation set**: The ordered destinations offered to a given role, one of which is current.
- **Guard**: The rule deciding whether the signed-in role may reach a destination.
- **Placeholder**: A stand-in for a destination whose own feature has not shipped.

## Out of Scope

- The contents of every destination — catalog, request list, my requests, profile, queues, review, inventory. This feature delivers addresses and placeholders only.
- All request and inventory behavior: submitting, approving, rejecting, preparing, releasing, confirming, stock arithmetic.
- Notification sending and any notification display.
- The real authentication mechanism and the backend contract behind the session boundary.
- SSO, MFA, password reset, and remember-me.
- Multi-role users, role elevation, and delegation.
- The UI kit's "Viewing as" role switcher. Role changes go through sign-out and sign-in (D5).
- Server-side rendering and offline support.

## Success Criteria

- **SC-001**: A tester can sign in as each of the two seeded roles (Employee, Admin) and land on that role's correct screen, seeing only that role's navigation.
- **SC-002**: For each role, every destination its navigation offers can be opened directly by address, reloaded, and returned to with browser back.
- **SC-003**: For each role, every destination outside its authorization is refused when opened directly by address, with an explanation and a working route back.
- **SC-004**: A Playwright test reaches any destination by address in a single navigation, without replaying the pipeline that would normally lead there.
- **SC-005**: Signing out and signing in as a different role leaves no trace of the previous role in navigation, landing screen, or account cluster, and no control anywhere in the shell changes role without that round trip.
- **SC-006**: The shell renders without horizontal overflow at every width from 360px to 1440px, with navigation and sign-out reachable throughout.
- **SC-007**: Every shell control is reachable and operable by keyboard with a visible focus indicator.
- **SC-008**: The shell introduces no visual value that is not already a token from spec 002.

## Decisions

Made by the project owner before drafting; `plan.md` implements them.

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | Navigation is derived per role from a constant table — two navigation sets, the Employee's and the Admin's, exactly as the 2026-09-22 design draws them. | *Amended 2026-09-24.* Originally three invented sets under constitution 2.0.0 II and ADR-0003; constitution 3.0.0 II and ADR-0005 adopt the design's merged Admin, so nothing here is invented any more. |
| D2 | Destinations are real addresses served by a routing library, accepted as a new dependency under an ADR. | Deep links, refresh-safety, browser history, and direct Playwright targeting. Costs one ADR under `docs/adr/`. |
| D3 | The shell reaches session state through a defined boundary, satisfied now by seeded demo users and later by the published backend contract. | Unblocks all page work without inventing a REST contract, per ARCHITECT.md §8 and constitution VII. |
| D4 | Sign-in presents the Google control as drawn and delegates to the session boundary; the SPA implements no authentication itself. | Contradicts spec 001's clarification, which fixed email + password — **requires an amendment** (see below). `docs/product.md`'s SSO non-goal is unaffected, because this repo ships no SSO. |
| D5 | No role switcher. Changing role requires sign-out and sign-in. | Keeps constitution II absolute and exercises the real auth path in the demo. Diverges from the UI kit, which pins a "Viewing as" switcher bottom-left. |
| D6 | Employees reach only their own request details; an Admin reaches any request regardless of status. | Matches ARCHITECT.md's note that any Admin may review any request and fulfil any approved one, and keeps request history reachable after a decision. Acting remains gated by status and role. |

## Required Amendments

Constitution I requires that an instruction contradicting an existing spec be recorded as an amendment, not applied silently. D4 contradicts a resolved clarification in spec 001. **This feature is not implementable until the amendment below is made.**

| Document | Current text | Required change |
|----------|--------------|-----------------|
| `specs/001-office-supplies-mvp/spec.md` → Clarifications, Session 2026-09-11 | "Q: Auth for MVP? → A: Username/password (email + password) with seeded demo users; SSO later." | Supersede: sign-in presents the Google control as designed; the SPA delegates to the session boundary and implements no authentication mechanism. Seeded demo users remain permitted behind that boundary. |

No constitution version bump is required — no principle changes. `docs/product.md`'s "SSO / SAML / MFA" non-goal stands, because this repository ships no SSO; if the backend later authenticates against Google for real, that non-goal must be revisited then, with an ADR.

## Known Gaps — flag to the designer

| Gap | Impact |
|-----|--------|
| ~~The UI kit merges Approver and Supply Admin into one "Admin".~~ | **Closed 2026-09-24** — constitution 3.0.0 II adopts the merge (ADR-0005); both navigation sets are drawn. |
| **No affordance is drawn for reaching Profile** now that it has left the navigation. | The account cluster was made the route in. Ours, not the designer's. |
| **The notification bell opens nothing** — no panel, list or destination is drawn. | It ships as a marker with a count (FR-014a). What it should open is undesigned. |
| ~~No designed fulfillment queue.~~ | **Closed 2026-09-24** — fulfilment folded into the Requests Queue (drift-2026-09-22 §2). |
| **No designed Profile screen for the Admin** — only the Employee's. | Profile is reachable by both roles from the account cluster; the Admin reuses the Employee layout (spec 006 D2). |
| **No loading, error, not-found, or forbidden screens** designed anywhere. | Stories 4 and 7 require all four; each is invented and needs ratification. |
| **No sign-out control** is drawn in the account cluster. | Story 6 requires one; its placement is invented. |
| The UI kit pins a **"Viewing as" role switcher** bottom-left. | Dropped under D5. The demo changes role by signing out and back in. |
| **No collapsed or narrow-width navigation** is drawn. | Story 8's behavior is invented, carrying forward spec 002's D2. |

## Checklist Overrides

None dismissed. One consistency defect (CHK007, not-found versus record-existence leakage) and three gaps (CHK001, CHK002, CHK003) were found and all four resolved into requirements above.

## Clarifications

### Session 2026-09-26 — Amendment

Raised by spec 008 (BEN-47), which replaces the Admin's request-detail address with the review panel over `/queue`.

- Q: Session 2026-09-23 kept `/requests/:id` for the Admin "until BEN-47 replaces it". Now that the panel exists, what happens to the address? → A: **It is retired.** The `Request detail` destination is removed from the destination set. `/requests/:id` matches no destination, so it gets the shell's not-found for every role and every id. FR-012a still holds, because an owned, a foreign and a missing id produce the identical response. Review opens the panel over `/queue` and never navigates (spec 008 FR-001, plan D10).

### Session 2026-09-24 — Amendment

Raised by constitution 3.0.0 and the 2026-09-22 `.fig` re-export
([drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md) §2), carried
by [ADR-0005](../../docs/adr/0005-two-role-model.md) and implemented as Phase 0
of spec 001 (BEN-114). Recorded here because the shipped shell's code and
gates cite this spec's FR-006, FR-007, FR-009, D1, D6 and SC-001.

- Q: Constitution 3.0.0 retires Approver and Supply Admin for one Admin. What navigation and landing does the shell carry? → A: **The drawn bars.** Employee: Catalog · My Requests, landing on the catalog. Admin: Requests Queue · Assets · Inventory · History, landing on `/queue`. `/approvals` and `/fulfillment` are removed; `/assets` is added as a placeholder.
- Q: The drawn Admin bar has no Catalog, which Session 2026-09-15 overrode. Keep the override? → A: **No.** The override rested on D1, which is withdrawn. The Admin may still open the catalog by address (`ARCHITECT.md` §7), but the bar does not offer it.

### Session 2026-09-23 — Amendment

Raised by Linear BEN-45 (re-scoped 2026-09-22) and decided by the project owner.

- Q: The design draws the Employee's request detail as a side panel over My Requests, with no address of its own. Keep `/requests/:id` for the Employee? → A: **No.** The Employee's detail is a panel on `/requests` that opens from *View details* and closes without navigating. `/requests/:id` is removed from the Employee's destination set; the Admin keeps it until BEN-47 replaces it with the review panel. An Employee now gets the same role refusal for every id, so FR-012a holds trivially (FR-009, Story 4 AC3).

### Session 2026-09-15 — Amendment

Raised by the 2026-09-15 `.fig` re-export
(`docs/design-system/drift-2026-09-15.md`) and decided by the project owner.
Constitution I requires it recorded here rather than applied silently.

- Q: The re-exported bar drops Profile from navigation and the Profile screen marks no item current. Where does Profile live? → A: **The account cluster.** Profile leaves the navigation set (FR-006, FR-006a). The affordance is ours — the file draws none.
- Q: The re-exported Admin bar carries a History item and the file draws the screen. Who gets it? → A: **Approver and Supply Admin.** History is resolved requests across all requestors; an Employee's own history is My Requests. Added to the destination set.
- Q: Both re-exported bars carry a notification bell, with a count on the Admin one. Build it? → A: **Yes, as a marker.** No panel, list or destination is drawn anywhere in the file, so it shows a count and opens nothing (FR-014a). Making it a control would invent a destination.
- Q: The drawn Admin bar has no Catalog. Drop it for the admin roles? → A: **No.** `ARCHITECT.md` §7 gives every role the catalog, and D1 already overrides that bar because it merges two roles the constitution keeps apart.

### Session 2026-09-12

- Q: The mockups merge Approver and Supply Admin into one "Admin" surface, which constitution II forbids. How should navigation split? → A: Three distinct navigation sets derived from the ARCHITECT.md §7 authorization matrix (D1).
- Q: The UI kit drives screens from state with no URLs, but constitution VI needs Playwright targets and VIII needs an ADR for new dependencies. How should navigation work? → A: Real addresses via a routing library, accepted under an ADR (D2).
- Q: The backend contract is unpublished, but the shell needs a user and role to route. How should session work? → A: A defined session boundary, satisfied by seeded demo users now and the published contract later (D3).
- Q: The Figma login offers Google sign-in only; spec 001 fixed email + password. Which does this feature build? → A: Google sign-in, as drawn (D4) — recorded as a required amendment to spec 001.
- Q: Does that mean real Google OAuth? → A: No. The shell renders the drawn control and delegates to the session boundary; the authentication mechanism is a backend decision. `docs/product.md`'s SSO non-goal is unaffected (D4).
- Q: Is the UI kit's "Viewing as" role switcher in scope? → A: No. Role changes go through sign-out and sign-in (D5).
- Q: Can an Approver or Supply Admin open a request detail outside their current queue? → A: Yes, any request regardless of status; Employees see only their own. Actions stay gated by status and role (D6).
- Q: FR-012 required not-found and forbidden to be distinguishable, but the request deep-link edge case required no existence leak. Which wins? → A: Split by address type — unmatched addresses show not-found; record addresses collapse missing and forbidden into one identical response (FR-012, FR-012a).
