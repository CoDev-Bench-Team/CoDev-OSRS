# Feature Specification: HTTP Client, Session, and Seeded-Source Switch

**Created**: 2026-10-02
**Status**: Draft
**Feature Branch**: `emmanuelr/ben-157-intp1-http-client-session-and-seeded-source-switch`
**Sources**: [BEN-157](https://linear.app/bench-synergy-project/issue/BEN-157/intp1-http-client-session-and-seeded-source-switch), parent [BEN-154](https://linear.app/bench-synergy-project/issue/BEN-154/int-api-integration), spec 003 session boundary, constitution VII and IX

## Overview

When the application is configured with the published API base address, sign-in, restoring the person after a refresh, sign-out, and the route guard use that API. When the address is not configured, the seeded session stays, and every screen keeps the seeded source it has today. This slice is the session foundation the later integration slices depend on. It does not move catalog, My Requests, profile, the admin queue, history, assets, or inventory onto the API.

The parent epic calls that configuration the API base address. This spec does not introduce a second switch.

## User Stories

### Story 1 — The configured address selects the session (Priority: P1)

A person using a build with no published API base address signs in through the seeded demo session, and every screen still reads its seeded source. A person using a build that has the address signs in against the API. Their screens still read seeded data until each screen's own integration slice lands.

**Why this priority**: Every later integration slice is blocked until the session can use the API while the rest of the product stays on seeded data.

**Acceptance Criteria**:

1. **Given** no published API base address is configured, **When** a person signs in, refreshes, signs out, or opens a guarded screen, **Then** the seeded session behaves as it does today, and catalog, My Requests, profile, the admin queue, history, assets, and inventory still use their seeded sources.
2. **Given** a published API base address is configured, **When** a person signs in, refreshes, signs out, or opens a guarded screen, **Then** those behaviors use the API.
3. **Given** a published API base address is configured, **When** a person opens catalog, My Requests, profile, the admin queue, history, assets, or inventory, **Then** those screens still use their seeded sources.
4. **Given** a published API base address is configured and the API cannot be reached, **When** the person tries to establish or restore a session, **Then** the application does not substitute the seeded session.

### Story 2 — Sign in, return, and sign out on the API session (Priority: P1)

A person signs in with the existing Google control. The application sends that credential to the published sign-in operation and keeps the session with the browser cookie. A refresh asks the API who the current user is. Sign-out ends the session on the API. The application stores no access token, and it does not write the Google credential to browser storage.

**Why this priority**: Later screens can call the API as the signed-in person only if the session survives a refresh without a stored token.

**Acceptance Criteria**:

1. **Given** the API base address is configured and the person is signed out, **When** they complete Google sign-in, **Then** the application sends `{ credential }` to `POST /auth/google` and a session exists.
2. **Given** a session established that way, **When** the person refreshes, **Then** the application calls `GET /auth/me` and restores the same person, without reading an access token from browser storage.
3. **Given** a signed-in person, **When** they sign out, **Then** the application calls `POST /auth/logout`, the session ends, and the sign-in screen is shown. Browser back does not restore a signed-in screen.
4. **Given** sign-in, refresh, or any later call, **When** the application contacts the API, **Then** the browser sends the session cookie. The application does not store an access token.
5. **Given** the Google credential, **When** sign-in runs, **Then** that credential is held only in memory for the sign-in and is not written to browser storage.
6. **Given** sign-in is refused, **When** the refusal returns, **Then** no session is created, a clear message is shown, and the person stays on sign-in.

### Story 3 — Screens follow the current user (Priority: P1)

Which screens a person sees comes from `GET /auth/me`. An Employee sees the Employee navigation and lands on the catalog. An Admin sees the Admin navigation and lands on the Requests Queue. A role held in the page does not authorize an action. When an admin action is refused, the person sees that error.

**Why this priority**: The shell already chooses screens from the signed-in role. Once the session is live, that role has to be the one the API reports.

**Acceptance Criteria**:

1. **Given** a current-user response for an Employee, **When** the shell renders, **Then** the person sees the Employee screens and lands on the catalog, as spec 003 defines.
2. **Given** a current-user response for an Admin, **When** the shell renders, **Then** the person sees the Admin screens and lands on the Requests Queue, as spec 003 defines.
3. **Given** an admin action the API refuses with `403`, **When** the refusal returns, **Then** the person sees the error. The role held in the page is not treated as permission to perform the action.
4. **Given** the current-user response includes a name and an email, **When** the session is established, **Then** the session carries both, initials are derived from the name, and the avatar is initials on a flat colour, never a photograph.
5. **Given** the current-user response includes an office, **When** the session is established, **Then** the session carries that office.
6. **Given** the live current-user response is missing a name or an email, **When** the session is established, **Then** the application does not add the missing field, and the gap is recorded in `specs/001-office-supplies-mvp/contracts/README.md`.

### Story 4 — A dead or forbidden session is not replayed (Priority: P1)

An unauthenticated current-user read shows sign-in. An unverified, out-of-domain, or deleted account does not enter the application. If receive, sign, or submit comes back unauthenticated or forbidden, the person returns to sign-in and that write is not sent again.

**Why this priority**: Replaying receive, sign, or submit after a refusal can hand over stock or sign a form a second time. A deleted or out-of-domain account must not keep a session.

**Acceptance Criteria**:

1. **Given** the API base address is configured, **When** `GET /auth/me` returns `401`, **Then** the sign-in screen is shown and no product screen is rendered.
2. **Given** sign-in or the current-user read returns `403` because the account is unverified, outside the allowed domain, or deleted, **When** that refusal returns, **Then** no session is created and the person sees a clear refusal on sign-in.
3. **Given** a person submits receive, sign, or a request, **When** that write returns `401` or `403`, **Then** they return to sign-in, the application does not automatically retry, and the write is not sent again.
4. **Given** any other admin action returns `403`, **When** the refusal returns, **Then** it is shown as an error and is not automatically retried.

### Story 5 — One client, and mappings only after a live comparison (Priority: P2)

Later screens call the API through one shared client. Each published operation is added once. This slice does not add the asset reads, the inventory reads, or the receive write. Errors and paged lists have one reading. Asset images are shown as images. Request-status and category mappings become final only after the integration guide is compared with a live API document.

**Why this priority**: The later slices run in parallel. A second client, or status names copied from the guide while the live document was unread, would fork the contract.

**Acceptance Criteria**:

1. **Given** any API call this slice or a later slice makes, **When** it is sent, **Then** it goes through one shared client, and a published operation exists there only once.
2. **Given** this slice is complete, **When** its client is inspected, **Then** it does not yet contain `GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, or `POST /requests/:id/receive`. The first later slice that needs each of those adds it; the slice that also needs it reuses that call.
3. **Given** an error with content type `application/problem+json`, **When** the client reads it, **Then** it exposes `title`, `status`, `detail`, and any `errors[]` entries of `{ detail, pointer }`.
4. **Given** a paged list, **When** the client reads it, **Then** it exposes `{ data, total, page, limit, totalPages }`.
5. **Given** an asset image returned by the API, **When** it is shown, **Then** it is shown as an image and is not inserted as HTML.
6. **Given** the integration guide's request statuses (`pending_approval`, `approved`, `ready_for_pickup`, `for_delivery`, `received`, `rejected`, `completed`, `cancelled`) and the published categories, including the spelling `Wifi`, **When** this slice finishes, **Then** those mappings are final only if they were compared with a live API document. When the live document cannot be read, the mappings stay unfrozen and the gap is recorded. They are not adopted from the guide alone.
7. **Given** a contract gap found while wiring the client, **When** it is found, **Then** it is recorded in `specs/001-office-supplies-mvp/contracts/README.md`. The application does not add a field, route, or error code the live contract does not expose.
8. **Given** local development against the API, **When** a person needs the session cookie to be sent, **Then** how that is done is documented. Production stays on the same site as the API, as the integration guide requires.
9. **Given** a user list held for an assignee choice, **When** it is held, **Then** it stays in memory for that action and is not written to browser storage. This slice does not build the assignee picker.

### Edge Cases

- No API base address is configured: the seeded session and every current seeded screen source stay in use.
- The API base address is configured and the API cannot be reached: the seeded session is not substituted.
- The API base address is configured, and the person opens a screen this slice does not switch: that screen still uses its seeded source.
- `GET /auth/me` is still in progress: the shell shows its existing loading state, not a flash of sign-in for a person who has a session.
- `GET /auth/me` returns `401`: sign-in, and no product screen.
- The account is unverified, outside the allowed domain, or deleted (`403`): a clear refusal on sign-in, and no session.
- Receive, sign, or submit returns `401` or `403`: the person returns to sign-in, the write is not retried, and it is not sent again.
- Another admin action returns `403`: the error is shown, it is not retried, and the role held in the page does not count as permission.
- The live API document cannot be read: status and category mappings stay unfrozen, and the gap is recorded in the contract record.
- The current-user response has a name and an email: the session carries both. Initials come from the name. The avatar is not a photograph.
- The current-user response lacks a name or an email: the missing field is not added, and the gap is recorded in the contract record.
- The current-user response includes an office: the session carries it. When it does not, an office is not invented.
- The current-user role is neither Employee nor Admin: a third role is not invented, the gap is recorded, and no extra screens are granted.
- The Google credential, and any assignee user list, exist only in memory for that action. The API session does not reuse the seeded session's browser-storage persistence.
- A previous seeded session was left in browser storage, and the API base address is now configured: that stored seeded session is not the API session.
- Sign-out in one tab: other open tabs stop acting as signed in, as spec 003 already requires.

## Functional Requirements

- **FR-001**: When no published API base address is configured, the system MUST keep the seeded session and every current seeded screen source.
- **FR-002**: When a published API base address is configured, sign-in, restoring the user on refresh, sign-out, and the route guard MUST use the API.
- **FR-003**: When a published API base address is configured, catalog, My Requests, profile, the admin queue, history, assets, and inventory MUST keep their seeded sources.
- **FR-004**: When the API base address is configured and the API cannot be reached, the system MUST NOT substitute the seeded session.
- **FR-005**: Sign-in MUST send `{ credential }` to `POST /auth/google`. The credential MUST be held only in memory for that action and MUST NOT be written to browser storage.
- **FR-006**: Startup MUST restore the person with `GET /auth/me`. Sign-out MUST call `POST /auth/logout`.
- **FR-007**: API calls MUST send the session cookie. The system MUST NOT store an access token.
- **FR-008**: A refused sign-in MUST leave the person on sign-in with a clear message and no session.
- **FR-009**: Which screens a person sees MUST come from `GET /auth/me`. The role held in the page MUST NOT authorize an action.
- **FR-010**: The current-user role MUST map onto the two roles spec 003 already uses, Employee and Admin, including their landing screens and navigation. A third role MUST NOT be invented. An unrecognised role value MUST be recorded in the contract record, and MUST NOT grant screens.
- **FR-011**: When the live current-user response includes a name and an email, the session MUST carry both. Initials MUST be derived from the name. The avatar MUST be initials on a flat colour, never a photograph.
- **FR-012**: When the live current-user response includes an office, the session MUST carry it. When name, email, or office is absent, the system MUST NOT add the missing field, and MUST record the gap in `specs/001-office-supplies-mvp/contracts/README.md`.
- **FR-013**: `401` from `GET /auth/me` MUST show the sign-in screen.
- **FR-014**: `403` for an unverified, out-of-domain, or deleted account MUST show a clear refusal on sign-in and MUST NOT create a session.
- **FR-015**: `401` or `403` on receive, sign, or submit MUST return the person to sign-in. The system MUST NOT automatically retry a `401` or a `403`. Receive, sign, and submit MUST NOT be sent again.
- **FR-016**: `403` on any other admin action MUST be shown as an error and MUST NOT be automatically retried.
- **FR-017**: HTTP access MUST go through one shared client. Each published operation MUST be implemented once. A later slice that needs an operation already added MUST reuse it.
- **FR-018**: This slice MUST NOT add `GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, or `POST /requests/:id/receive`. Response shapes for those reads stay unfinished until the live comparison in FR-021 is done.
- **FR-019**: The client MUST read `application/problem+json` errors as `title`, `status`, `detail`, and optional `errors[]` of `{ detail, pointer }`.
- **FR-020**: The client MUST read a paged list as `{ data, total, page, limit, totalPages }`.
- **FR-021**: Shared mappings for the request statuses named in Story 5, and for the published categories including `Wifi`, MUST be treated as final only after the integration guide is compared with a live API document. When that document cannot be read, the mappings MUST stay unfrozen and the gap MUST be recorded. They MUST NOT be frozen from the guide alone.
- **FR-022**: Asset images from the API MUST be shown as images and MUST NOT be inserted as HTML.
- **FR-023**: A user list held for an assignee choice MUST stay in memory for that action and MUST NOT be written to browser storage.
- **FR-024**: Local development MUST document how the session cookie is sent. Production MUST stay on the same site as the API, as the integration guide requires.
- **FR-025**: Every contract gap found while wiring the client MUST be recorded in `specs/001-office-supplies-mvp/contracts/README.md`. The system MUST NOT invent a field, route, or error code the published contract does not expose.
- **FR-026**: While the current-user read is in progress, the shell MUST keep its existing loading behavior: a person who has a session MUST NOT see a flash of sign-in.
- **FR-027**: The API session MUST NOT treat a seeded session left in browser storage as the signed-in person.

## Out of Scope

- Switching catalog, My Requests, profile, the admin queue, history, assets, or inventory onto the API. Those are [BEN-156](https://linear.app/bench-synergy-project/issue/BEN-156), [BEN-155](https://linear.app/bench-synergy-project/issue/BEN-155), [BEN-158](https://linear.app/bench-synergy-project/issue/BEN-158), [BEN-159](https://linear.app/bench-synergy-project/issue/BEN-159), [BEN-160](https://linear.app/bench-synergy-project/issue/BEN-160), [BEN-161](https://linear.app/bench-synergy-project/issue/BEN-161), and [BEN-162](https://linear.app/bench-synergy-project/issue/BEN-162).
- Adding `GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, or `POST /requests/:id/receive` in this slice. The first later slice that needs each operation adds it once; the other reuses it.
- Redrawing the shell or any screen. Spec 003's navigation, landing screens, loading state, and sign-out behavior stay.
- User create, update, and delete.
- The notification bell, profile editing, and any email sent from the application.
- Building the inventory assignee picker. This slice only requires that a user list for that action, when a later slice holds one, is not written to browser storage.
- Inventing routes, fields, or error codes, and freezing status or category mappings from the integration guide without a live API comparison.

## Success Criteria

- **SC-001**: With no API base address configured, a tester signs in as the seeded Employee and as the seeded Admin and reaches the same screens, with the same seeded data, as before this slice.
- **SC-002**: With the API base address configured, sign-in, refresh, and sign-out each use the API. After refresh the same person is restored. Browser storage holds no access token and no Google credential.
- **SC-003**: With the API base address configured, catalog, My Requests, profile, the admin queue, history, assets, and inventory still show their seeded data.
- **SC-004**: `401` from `GET /auth/me` shows sign-in. An unverified, out-of-domain, or deleted account does not enter the application.
- **SC-005**: An unauthenticated or forbidden receive, sign, or submit returns the person to sign-in, and that write is observed once.
- **SC-006**: The screens a person can open match the role from `GET /auth/me`, using spec 003's Employee and Admin sets. A `403` on an admin action is visible as an error.
- **SC-007**: The contract record either states that the status and category mappings match a live API document compared during this slice, or states that the live document could not be compared and the mappings are not final.
- **SC-008**: Every contract gap found in this slice, including a current-user response missing a name or an email, is written in `specs/001-office-supplies-mvp/contracts/README.md`, and the application does not contain the missing field.
