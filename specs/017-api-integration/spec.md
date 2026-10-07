# Feature Specification: API Integration — Screen Sources (Phase 2)

**Created**: 2026-10-03
**Status**: Draft
**Feature Branch**: `emmanuelr/ben-154-int-api-integration`
**Sources**: [BEN-154](https://linear.app/bench-synergy-project/issue/BEN-154/int-api-integration) Phase 2: [BEN-155](https://linear.app/bench-synergy-project/issue/BEN-155), [BEN-156](https://linear.app/bench-synergy-project/issue/BEN-156), [BEN-158](https://linear.app/bench-synergy-project/issue/BEN-158), [BEN-159](https://linear.app/bench-synergy-project/issue/BEN-159), [BEN-160](https://linear.app/bench-synergy-project/issue/BEN-160), [BEN-161](https://linear.app/bench-synergy-project/issue/BEN-161), [BEN-162](https://linear.app/bench-synergy-project/issue/BEN-162). Builds on [BEN-157](../http-client-session-and-seeded-source-sw/spec.md) (Done). Live Swagger read 2026-10-03. Constitution 9.0.0 IV, VII, VIII, IX

## Overview

> **Amended 2026-10-03 (Session 2026-10-03, second):** the seeded and mock data is **removed entirely**. The application always uses the published API. Where this document still describes a seeded mode, that text is superseded by FR-001 and FR-001a as amended.

When the application is configured with the published API base address, each screen reads and writes through the API instead of its seeded source: the Employee catalog and request submit, My Requests, Profile, the Admin Requests Queue, History, Assets and Inventory. When the address is not configured, every screen keeps its seeded source and behaves as it does today. This slice changes data sources only. It redraws no screen, and it adds no behavior the specs for those screens (005, 006, 007, 008, 009, 011, 012, 013, 014, 015) do not already define, with one exception. Where the published contract and the constitution disagree, the screen withholds the affected action in API mode, and the gap is recorded.

The parent epic's Phase 1 (BEN-157) already supplies the API session, the one shared client, the problem-details error reading, the paged-list reading, and the status and category maps. This slice reuses them and adds each remaining operation once.

## User Stories

### Story 1 — Browse the catalog and submit a request against the API (Priority: P1) — BEN-156

An Employee opens the catalog, picks an office, filters by category, sees live availability, opens View Specs, builds the Request List, and submits. Availability, the specs and the created request come from the API. The Request List itself stays in the page; there is nothing to save it to.

**Why this priority**: Submit is the entry to the pipeline. No later screen has API data until a request is created through it.

**Acceptance Criteria**:

1. **Given** API mode, **When** the Employee opens the catalog or changes the office selector, **Then** availability is read for the selected office. Changing the office reloads that office's availability.
2. **Given** the category chip "All", **When** the catalog reads assets, **Then** no category filter is sent. **Given** the WiFi chip, **Then** the API category `Wifi` is sent.
3. **Given** an asset's Available quantity, **When** the availability pill renders, **Then** it is `Out of Stock` at 0, `Low Stock` from 1 through the asset's low-stock threshold, and `In Stock` above it.
4. **Given** the catalog was filtered by office, **When** View Specs opens, **Then** the specs come from the single-asset read, and the quantity shown stays the office-scoped one from the list. The single read's quantity is summed across all offices and is not shown in its place.
5. **Given** a valid Request List, **When** the Employee submits, **Then** the request carries the lines (asset and quantity) and the optional Note to Approver (at most 500 characters), and no office. The API reserves at the requester's own office. Requesting stays limited to the Employee's own office, as spec 005 already requires.
6. **Given** the submit succeeds, **When** the confirmation renders, **Then** it shows the request's display id, status, submitted time, lines and note as the API returned them, and only then is the Request List cleared.
7. **Given** the submit is refused for stock, **When** the refusal returns, **Then** the drawer stays open with its lines, the API's own message is shown, and availability is re-read.
8. **Given** the submit is refused with a field validation error, **When** the refusal returns, **Then** each error is shown under its field, as the BEN-98 error shape maps it.

### Story 2 — Track, cancel and mark received on My Requests (Priority: P1) — BEN-155

An Employee sees their own requests, opens one, cancels it while it is `Pending Approval`, and marks it `Received` once it is `For Delivery` or `Ready for Pickup`.

**Why this priority**: This is the Employee half of the pipeline. Mark received is the step where units leave the store.

**Acceptance Criteria**:

1. **Given** API mode, **When** the Employee opens My Requests, **Then** the list shows only their own requests, read through the API, newest first. The screen draws no paging, search or filter (spec 009), so none is added. *(Amended 2026-10-03, plan A2.)*
2. **Given** a row, **When** the detail opens, **Then** it is read by the request's numeric id. The display id is shown and never used to look a request up.
3. **Given** a status from the API, **When** it renders, **Then** it uses the shared status map: `completed` reads **Complete** where the published map says so, and `cancelled` reads **Cancelled**.
4. **Given** a request's timeline, **When** it renders, **Then** it shows only the events the API recorded. A step with no recorded time is not drawn as done.
5. **Given** a `Pending Approval` request, **When** the Employee confirms Cancel with a reason, **Then** the cancel operation is sent with that reason and the detail shows the cancelled request. The delete operation is never used to cancel.
6. **Given** a `For Delivery` or `Ready for Pickup` request, **When** the Employee confirms Mark as Received, **Then** the receive operation is sent once and the detail shows `Received`.
7. **Given** any write on this screen returns `409`, **When** it returns, **Then** the conflict is shown and the detail is re-read.
8. **Given** another Employee's request id, **When** it is opened, **Then** the API's not-found is shown as the screen's existing unavailable state.

### Story 3 — Review and fulfil on the Admin Requests Queue (Priority: P1) — BEN-159

An Admin sees the queue with live counts, filters, searches and sorts it, opens a request, approves or rejects it, sets For Delivery or Ready for Pickup, marks it Received, or cancels it.

**Why this priority**: Without the Admin half, no API-created request moves past `Pending Approval`.

**Acceptance Criteria**:

1. **Given** API mode, **When** the queue opens, **Then** rows, paging, the status chips, search and sort (Newest First, Oldest First, Employee A–Z) come from the API. ~~The one search box searches the display id when the text starts with `REQ-`, and the requester's name or email otherwise. Item search is not available in API mode, because the API cannot match the three fields at once (contracts C13).~~ *(Amended 2026-10-03, plan A3.)* The one search box searches the display id, the requester's name or email, and the requested items' names and models together. *(Amended 2026-10-07: contracts C13 closed; the API publishes `search`.)*
1a. **Given** the *All requests* chip, **When** rows are read, **Then** only live requests (`Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup`, `Received`) are listed, with full pages, although the API's unfiltered list also returns resolved ones (contracts C14). *(Added 2026-10-03, plan A4.)*
2. **Given** the summary cards, **When** they render, **Then** *Pending approval* and *In Processing* come from the request counts. *(Amended 2026-10-03: the Low stock alerts card is removed, spec 004 FR-004; [drift-2026-10-03](../../docs/design-system/drift-2026-10-03.md).)*
3. **Given** a `Pending Approval` request, **When** the Admin approves it, or rejects it with a reason, **Then** the change is sent as an Admin status change and the panel shows the result.
4. **Given** an `Approved`, `For Delivery` or `Ready for Pickup` request, **When** the Admin sets For Delivery, or Ready for Pickup with a pickup location, **Then** the change is sent as an Admin status change. The location is sent only with Ready for Pickup.
5. **Given** a `For Delivery` or `Ready for Pickup` request, **When** the Admin confirms Received, **Then** the same receive operation Story 2 uses is sent, not a status change.
6. **Given** an `Approved` or `Ready for Pickup` request, **When** the Admin confirms Cancel with a reason, **Then** the cancel operation is sent. Cancel is not offered on `For Delivery` (constitution 8.0.0), even though the published contract accepts it.
7. **Given** the Admin's optional Other Notes, **When** a decision is sent, **Then** the note is not sent, because the contract has nowhere to put it.
8. **Given** any write returns `409`, **When** it returns, **Then** the conflict is shown and the panel is re-read. **Given** a `403`, **Then** it is shown as an error and is not retried.
9. **Given** a submitted request, **When** the Admin reviews it, **Then** its lines and quantities cannot be changed.

### Story 4 — Sign and Complete are withheld while the contract completes on sign (Priority: P1) — BEN-155, BEN-159

> **Superseded 2026-10-04** (Session 2026-10-04 below; constitution 10.0.0, [ADR-0013](../../docs/adr/0013-signing-completes-the-request.md)). The Employee signs through the published sign operation, and the request becomes `Completed`. The Admin's Complete stays absent, because there is none. The criteria below are kept as history.

The live contract's sign operation moves the request to `completed`, and no operation lets an Admin set `completed`. Constitution IV requires the opposite: signing changes no status, and only an Admin completes, once the form is signed. Until the backend changes the contract, API mode withholds both actions, and requests stop at `Received`. Seeded mode keeps the full flow.

**Why this priority**: Sending sign as published would skip the Admin's Complete step, which BEN-154 forbids and the constitution does not allow.

**Acceptance Criteria**:

1. **Given** API mode and the Employee's own `Received` request, **When** the detail renders, **Then** the Accountability Form's sign action is not offered, and a short note says signing is not yet available. No sign write is ever sent.
2. **Given** API mode and a `Received` request on the Admin panel, **When** the panel renders, **Then** Complete is not offered.
3. **Given** seeded mode, **When** the same requests render, **Then** sign and Complete behave as specs 012 and 008 define.
4. **Given** this slice, **When** it is finished, **Then** the contract record names the gap: sign completes the request, no Admin complete exists, sign emails the requester rather than Admins, and the request read carries no published signed flag or signed time.

### Story 5 — Read History from the API (Priority: P2) — BEN-160

An Admin sees resolved requests (`Completed`, `Rejected`, `Cancelled`) across all requestors, searches, filters, pages and sorts them by resolution date, and opens a read-only panel.

**Why this priority**: History is an audit view. It does not block the pipeline.

**Acceptance Criteria**:

1. **Given** API mode, **When** History opens, **Then** rows, paging, the chips, search and sort (newest or oldest resolved) come from the history read.
2. **Given** a row, **When** the panel opens, **Then** it reads the request by numeric id and draws the timeline from the recorded events.
3. **Given** a rejection or cancellation reason in the payload, **When** the panel renders, **Then** it is shown. **Given** none, **Then** no reason is invented and the gap is recorded.
4. **Given** the panel, **When** it renders, **Then** it stays read-only. No delete control is added.

### Story 6 — Profile identity and assigned equipment from the API (Priority: P2) — BEN-158

A signed-in person sees their name, email and office from the current user, and the units assigned to them from the inventory read.

**Why this priority**: Profile is a read-only nav destination.

**Acceptance Criteria**:

1. **Given** API mode, **When** Profile opens, **Then** identity comes from the current-user read BEN-157 already maps, and the avatar is initials on a flat colour, never a photograph.
2. **Given** units assigned to the person, **When** Currently Assigned renders, **Then** it lists the units the API returns for that person. **Given** none, **Then** the existing empty state renders.
3. **Given** a unit read that carries a BitLocker identifier or recovery PIN, **When** Profile renders or logs, **Then** neither value is rendered or logged.
4. **Given** Profile, **When** it renders, **Then** no edit control is added and no user update is sent.

### Story 7 — Manage Assets through the API (Priority: P2) — BEN-161

An Admin lists, views, adds, updates and deletes assets.

**Why this priority**: Assets already work on the seeded source. This story swaps the source.

**Acceptance Criteria**:

1. **Given** API mode, **When** Assets opens, **Then** rows, paging, search, the category filter and the stock chips come from the asset list, through the same operations Story 1 adds.
2. **Given** the count columns, **When** they render, **Then** AVAILABLE UNITS shows the API's `quantity`, PENDING/RESERVED UNITS its `reservedQuantity` and ASSIGNED UNITS its `assignedQuantity`. *(Amended 2026-10-03: the asset reads now publish the counts.)*
3. **Given** the Add Asset form, **When** it is saved, **Then** name, category, model, description, image, the category's spec fields and the low-stock threshold are sent. `Wifi` is sent for the WiFi form. No inventory unit is created.
4. **Given** the Update Asset form, **When** it is saved, **Then** only changed fields are sent, and a cleared image or spec is sent as cleared. No quantity is sent.
5. ~~**Given** a delete refused with `409` because units reference the asset, **When** it returns, **Then** the API's message is shown and the asset stays.~~ *(Withdrawn 2026-10-03, plan A1: Assets draws no delete control, spec 014. None is added.)*
6. **Given** an asset image from the API, **When** it renders, **Then** it renders as an image and is never inserted as HTML.
7. **Given** a category whose form draws no Model (UPS, Mice, Other Device), **When** the API refuses the save because the model is missing, **Then** the refusal is shown under the form. The SPA does not add a Model field (conflict 9).

### Story 8 — Manage the Inventory unit register through the API (Priority: P2) — BEN-162

An Admin lists, reviews, adds (single or bulk), edits, assigns, unassigns and removes units.

**Why this priority**: Inventory already works on the seeded source. This story swaps the source.

**Acceptance Criteria**:

1. **Given** API mode, **When** Inventory opens, **Then** rows, paging, search, the category filter and the status chips (All items, Assigned, Available, Reserved) come from the unit list. Each chip's count is the total of that status's list.
2. **Given** a unit's status, **When** it renders, **Then** it is one of `Available`, `Reserved`, `Assigned`, `Inactive`.
3. **Given** Add Single Unit, **When** it is saved with an assignee, **Then** the unit starts `Assigned`; without one it starts `Available`. **Given** Add Multiple Units, **Then** 1 to 100 units with unique serials are sent in one operation.
4. **Given** a unit edit that clears the assignee, **When** it is saved, **Then** the assignment is cleared and the unit returns to `Available`. An untouched assignee field is not sent.
5. **Given** Remove Unit, **When** the Admin confirms in the existing confirmation, **Then** the unit is removed and the removal reason is sent with it. *(Amended 2026-10-03: the API now requires the reason and stores it with the soft-deleted unit, closing contracts G2.)* **Given** the API refuses removing a `Reserved` or `Assigned` unit, **Then** its message is shown.
6. **Given** the assignee picker, **When** it opens, **Then** it is filled from the user list. That list stays in memory for the action and is not written to browser storage. No user is created, updated or deleted.
7. **Given** BitLocker identifier and recovery PIN, **When** they are read, **Then** they render only on the Admin's unit panel and are never logged.
8. **Given** a field the screen collects that the contract does not accept (~~Purchase Request number,~~ an attachment file~~, the removal reason~~), **When** a write is sent in API mode, **Then** that field is not sent. *(Amended 2026-10-07: the Purchase Request number is sent on create, bulk create and update, and a cleared one is sent as `null` (contracts G5, closed 2026-10-06: `purchaseRequest` is published on create, bulk create, update (`null` clears it) and both reads, and `search` matches it; `specs/001-office-supplies-mvp/contracts/README.md`). The removal reason is sent since 2026-10-03, AC5.)*

### Edge Cases

- No API base address is configured: every screen keeps its seeded source, and every flow, sign and Complete included, behaves as before this slice.
- The API base address is configured and one screen's read fails: that screen shows its existing error state. It does not fall back to seeded data.
- A `401` or `403` on submit, receive or sign: BEN-157's rule applies. The person returns to sign-in and the write is not replayed. (Sign is never sent in API mode under Story 4.)
- Submit refused for stock after another Employee took the last unit: the drawer stays open, the API message shows, availability is re-read.
- The office selector is changed while a Request List holds lines from another office: requesting stays limited to the Employee's own office, as spec 005 defines.
- A request opened by display id from a deep link: the screen resolves it to the numeric id from the list, or shows unavailable. It never sends the display id to the single-request read.
- Two Admins act on the same request: the second write gets `409`, sees the conflict, and the panel re-reads.
- An Admin cancel on a `For Delivery` request: not offered, although the API would accept it (conflict 8).
- A `Received` request in API mode: it stays `Received`. Neither sign nor Complete is offered (Story 4).
- The history payload lacks a reason: no reason is drawn, and the gap is recorded.
- An asset save on UPS, Mice or Other Device is refused for a missing model: the refusal is shown (conflict 9).
- A unit read returns secrets to an Employee (conflict 11 G3): Profile never renders or logs them.
- Inventory filtered by office: the unit list publishes no office filter. If the screen filters by office, no office query is invented, and the gap is recorded.
- A unit added as `Inactive` (spec 015 D3): the contract's create takes no status. Recorded as a default in Clarifications.
- A response field this spec reads is absent from the live response: the field is not invented. The screen renders what it has, and the gap is recorded.

## Functional Requirements

### Shared

- **FR-001**: ~~When no API base address is configured, every screen MUST keep its seeded source and its current behavior.~~ *(Withdrawn 2026-10-03.)* The application MUST read and write only the published API. It MUST NOT ship seeded sources, demo accounts or dev-only mock stubs.
- **FR-001a**: When no API base address is configured, sign-in MUST say the API is not configured, and no screen MUST render data. *(Added 2026-10-03.)*
- **FR-002**: When the API base address is configured, catalog, request submit, My Requests, Profile, the Requests Queue, History, Assets and Inventory MUST read and write through the API. A screen whose API read fails MUST show its error state and MUST NOT fall back to seeded data.
- **FR-003**: Every call MUST go through the one shared client BEN-157 added. Each operation MUST be added once: the asset list and single read by Story 1 (reused by Story 7), the receive write by Story 2 (reused by Story 3), and the unit list and single read by Story 6 (reused by Story 8).
- **FR-004**: Statuses and categories MUST use the shared maps BEN-157 made final. `Wifi` MUST be the category sent for WiFi.
- **FR-005**: A request MUST be read and written by its numeric id. The display id MUST NOT be sent to the single-request operations.
- **FR-006**: A `409` on any request write MUST show the conflict and re-read the request.
- **FR-007**: A field-level validation error MUST be shown under the matching field (BEN-98).
- **FR-008**: The system MUST NOT send a field, route or query parameter the live contract does not publish, and MUST NOT invent a field absent from a live response. Every such gap found MUST be recorded in `specs/001-office-supplies-mvp/contracts/README.md`.
- **FR-009**: The system MUST NOT send email. Notifications are the API's responsibility.
- **FR-010**: Response shapes this slice reads MUST be checked against the live API document or a live response before they are treated as final. Where the published schema is undocumented, the gap MUST be recorded.

### Catalog and submit (BEN-156)

- **FR-011**: The catalog MUST read availability for the office the selector shows, and MUST re-read it when the office changes.
- **FR-012**: The "All" chip MUST send no category filter.
- **FR-013**: The stock pill MUST be Out at 0, Low from 1 through the asset's threshold, and In Stock above it.
- **FR-014**: View Specs MUST read the single asset for its specs and MUST keep the office-scoped quantity from the list when the list was office-filtered.
- **FR-015**: The Request List MUST stay in client state. Submit MUST send the lines and the optional note (at most 500 characters), and MUST NOT send an office.
- **FR-016**: The Request List MUST be cleared only after a successful submit. The confirmation MUST read back the display id, status, submitted time, lines, note and timeline, and the numeric id MUST be kept.
- **FR-017**: A stock refusal MUST keep the drawer open, show the API's message, and re-read availability.

### My Requests (BEN-155)

- **FR-018**: My Requests MUST list only the signed-in Employee's requests, read through the API, newest first. *(Amended 2026-10-03, plan A2: the screen draws no paging, search or filter.)*
- **FR-019**: The timeline MUST show only recorded events.
- **FR-020**: Employee cancel MUST use the cancel operation with a reason, from `Pending Approval` only. The delete operation MUST NOT be used to cancel.
- **FR-021**: Mark as Received MUST use the receive operation, from `For Delivery` or `Ready for Pickup`, by the owning Employee. The write MUST be sent once.

### Sign and Complete (BEN-155, BEN-159)

- **FR-022** *(withdrawn 2026-10-04, see FR-051)*: In API mode, the Accountability Form's sign action MUST NOT be offered and MUST NOT be sent, while the published sign operation moves a request to `completed` (contracts conflict 12). A note MUST say signing is not yet available.
- **FR-023**: The Admin's Complete MUST NOT be offered: signing completes the request (constitution 10.0.0 IV).
- **FR-051** *(added 2026-10-04)*: The owning Employee's unsigned `Received` request MUST offer the Accountability Form. Its name field MUST be prefilled with the signed-in Employee's full name and MUST NOT be editable. Signing MUST send the sign operation with `agreed` and that name, once, and the panel MUST then read the request back as `Completed` with the signed time. An account with no full name MUST NOT be able to sign, and the form MUST say so.
- **FR-024**: In seeded mode, sign and Complete MUST behave as specs 012 and 008 define.
- **FR-025** *(withdrawn 2026-10-04)*: The SPA's state machine MUST NOT be changed to skip the Admin's Complete step.
- **FR-026** *(withdrawn 2026-10-04)*: When the contract publishes a sign that changes no status, a signed flag with its time on the request read, an Admin complete limited to a signed `Received` request, and the email to Admins on sign, the withholding in FR-022 and FR-023 MUST be lifted by a spec amendment, not silently.

### Requests Queue (BEN-159)

- **FR-027**: The queue MUST read rows, chip filters, search, sort (newest, oldest, employee A–Z) and paging from the API. ~~Search MUST map to one published parameter: the display id for text starting with `REQ-`, the requester otherwise (C13).~~ *All requests* MUST list live statuses only, in full pages (C14). History's search follows the same rule. *(Amended 2026-10-03, plan A3, A4.)* *(Amended 2026-10-07: search MUST be sent as the published `search` parameter alone, to the list and to the counts, and to History's read. `displayId`, `requester` and `itemName` MUST NOT be sent for it (contracts C13, closed 2026-10-07).)*
- **FR-028**: *Pending approval* and *In Processing* MUST come from the request counts. The summary cards draw no loading placeholder; they appear once the counts are known. *(Amended 2026-10-03: the Low stock alerts card and its not-published dash are removed, spec 004 FR-004; [drift-2026-10-03](../../docs/design-system/drift-2026-10-03.md).)*
- **FR-029**: Approve, reject (with reason), For Delivery, and Ready for Pickup (with location) MUST be sent as the Admin status change. The location MUST be sent only with Ready for Pickup.
- **FR-030**: The Admin's Received MUST reuse the receive operation from FR-021.
- **FR-031**: Admin cancel MUST use the cancel operation with a reason, from `Approved` or `Ready for Pickup` only. It MUST NOT be offered on `For Delivery` (constitution 8.0.0, conflict 8).
- **FR-032**: The Admin's Other Notes MUST NOT be sent (conflict 6).
- **FR-033**: Employee actions MUST NOT be sent through the Admin status change.
- **FR-034**: Request lines and quantities MUST NOT be editable after submit.

### History (BEN-160)

- **FR-035**: History MUST read resolved requests (`Completed`, `Rejected`, `Cancelled`) from the history read, with the queue's search and paging filters, sorted newest or oldest by resolution date.
- **FR-036**: The panel MUST read the request by numeric id, draw its recorded timeline, show any rejection or cancellation reason the payload carries, and stay read-only. No delete control MUST be added.

### Profile (BEN-158)

- **FR-037**: Profile identity MUST come from the current-user mapping BEN-157 established.
- **FR-038**: Currently Assigned MUST list the units the unit list returns for the signed-in person, and MUST render the existing empty state when there are none.
- **FR-039**: Profile MUST NOT render or log a BitLocker identifier or recovery PIN, and MUST NOT send a user update.

### Assets (BEN-161)

- **FR-040**: Assets MUST reuse the asset list and single read from FR-003.
- **FR-041**: AVAILABLE UNITS, PENDING/RESERVED UNITS and ASSIGNED UNITS MUST show the asset's published `quantity`, `reservedQuantity` and `assignedQuantity`. `totalQuantity` (Available + Reserved) is read onto the model; no column draws it. No count is computed client-side. *(Amended 2026-10-03: the dash is withdrawn now that `/assets` publishes the counts; conflict 1's count read is closed.)*
- **FR-042**: Create MUST send name, category, model, description, image, the category's spec fields and the low-stock threshold. Update MUST send only changed fields, send a cleared image or spec as cleared, and never send a quantity.
- **FR-043**: ~~A `409` on delete MUST show the API's message and leave the asset.~~ *(Withdrawn 2026-10-03, plan A1: no delete control exists, and none is added.)*
- **FR-044**: Asset images MUST be rendered as images and MUST NOT be inserted as HTML.

### Inventory (BEN-162)

- **FR-045**: Inventory MUST reuse the unit list and single read from FR-003, with search, category, status and paging applied by the API. Chip counts MUST come from the total of each status's list. No office query MUST be sent. *(Amended 2026-10-06: the unit list now carries a `counts` block (contracts conflict 16). Chip counts MUST come from it, and a search, category, chip or page change MUST send one list call. The per-status lists are withdrawn.)*
- **FR-046**: Add Single Unit, Add Multiple Units (1–100, unique serials), edit, assign, unassign and remove MUST use the published unit operations. An unassign MUST send a cleared assignee. An untouched assignee MUST NOT be sent.
- **FR-047**: Remove MUST happen only after the existing confirmation, and an API refusal MUST be shown.
- **FR-048**: The assignee picker MUST be filled from the user list. The list MUST stay in memory for that action and MUST NOT be written to browser storage. No user create, update or delete MUST be sent.
- **FR-049**: ~~The Purchase Request number and an attachment file MUST NOT be sent while the contract does not accept them (conflict 11 G5, G7).~~ An attachment file MUST NOT be sent while the contract does not accept it (conflict 11 G7). The removal reason MUST be sent: the API requires it since 2026-10-03 (G2 closed). *(Amended 2026-10-07: the Purchase Request number MUST be read from the unit and sent on create, bulk create and update; a cleared one MUST be sent as `null` on update (contracts G5, closed 2026-10-06: `purchaseRequest` is published on create, bulk create, update (`null` clears it) and both reads, and `search` matches it; `specs/001-office-supplies-mvp/contracts/README.md`).)*
- **FR-050**: BitLocker identifier and recovery PIN MUST render only on the Admin's unit panel and MUST NOT be logged.
- **FR-052** *(added 2026-10-04)*: Add Single Unit, Add Multiple Units, Add Asset and Update Asset MUST keep what was typed in `localStorage` for at most five minutes after the last change, so closing the panel by a click outside or Escape does not lose it. A draft older than five minutes MUST be removed before the panel first renders. Reopening without a change MUST NOT renew it. Cancel and a successful save MUST remove it, and signing out MUST remove every draft. BitLocker identifiers and recovery keys/PINs MUST NOT be stored (FR-050, constitution VIII). An Update Asset draft MUST be dropped when the asset changed since the draft was made.
- ~~**FR-053**~~ *(added 2026-10-04, temporary; **removed 2026-10-06** before merge to `dev`, as required)*: ~~In development builds only, the sign-in screen MAY offer a role select that replaces the role the shell routes and renders by after a real Google sign-in. It MUST NOT exist in production builds, MUST NOT change what the API authorizes, and MUST be removed before this branch merges to `dev`.~~
- **FR-054** *(added 2026-10-06)*: The Requests Queue MUST offer a **Refresh** button beside Sort that re-reads the page on screen (same chip, search, sort and page) at once. While it runs the button MUST read **Refreshing…** and be disabled, and the table MUST keep its rows, marked as updating. A failed refresh MUST keep the rows and MUST say so in an error toast. Refresh is not offered until the first page has loaded.
- **FR-055** *(added 2026-10-06)*: A table MUST be drawn as soon as its own list read answers. Its counts (the queue's summary cards, every chip count, Inventory's chip totals) MUST be read beside the list, in parallel with it, and MUST NOT hold the rows back; until they arrive the chips show that they are loading and the cards are not drawn. Reads that do not need another read's answer MUST be sent in parallel; a list read across pages reads the first page, then the rest in parallel, a few pages at a time. The Requests Queue's *All requests* MUST be one `GET /requests` with no status (plan D5, amended; contracts C14). *(The role kept for early reads is superseded by FR-058.)*
- **FR-056** *(added 2026-10-06)*: The Requests Queue and History MUST keep their search and sort in the address (`?search=…&sort=oldest|employee`), and Assets and Inventory their search (`?search=…`). A default (empty search, Newest First) is left out. Opening such an address MUST open the table on that search and sort. A change MUST replace the history entry rather than add one. The chip and the page are not kept.
- **FR-058** *(added 2026-10-06)*: The signed-in user (id, role, name, email, initials, office) MUST be kept in `localStorage` after sign-in and after every current-user read that answers with a session. A load with a kept user MUST render signed in from it at once and MUST NOT wait for `GET /auth/me`; every screen reads its data straight away. `GET /auth/me` MUST then be read in the background once no other request is in flight, and its answer MUST replace the kept user (role, name or office changed since) without reloading a screen when nothing changed. The kept user MUST be removed on sign-out, on any `401`, and when the background read answers with no session; an API that cannot be reached MUST NOT remove it. No token, cookie or Google credential MUST be kept. This supersedes, for a load with a kept user, spec 003's rule that the stored session is revalidated before a screen renders; the API still authorizes every read.

## Out of Scope

- Redrawing any screen, or adding behavior the screen specs do not define.
- User create, update and delete. The notification bell. Profile editing. Any email sent from the SPA.
- An Admin delete control on History or the queue.
- Changing the request state machine to match the published sign. Story 4 withholds the action instead.
- Client-side counting of per-asset Reserved and Assigned units, or of low-stock alerts.
- Inventing the office filter on the unit list, ~~a Purchase Request field,~~ an upload operation, an Admin notes field, or a signed flag. *(Amended 2026-10-07: the Purchase Request field is published, contracts G5 closed 2026-10-06; sending it invents nothing.)*
- Any change to the session, the shared client's error and paging reading, or the status and category maps BEN-157 delivered, beyond adding the operations listed in FR-003 and the ones each story names.

## Success Criteria

- **SC-001**: ~~With no API base address configured, a tester runs the full seeded demo path exactly as before this slice.~~ *(Withdrawn 2026-10-03.)* A search of `src/` finds no seeded source, demo account, demo register or dev stub, and the production bundle contains no seeded data.
- **SC-002**: With the API base address configured, a tester submits a request as an Employee, approves it and sets Ready for Pickup as an Admin, and marks it Received as either, entirely through the UI. Each step is visible on the other role's screen after a refresh.
- **SC-003**: With the API base address configured, no sign write and no Complete action can be produced from the UI. A `Received` request shows the "not yet available" note to its owner.
- **SC-004**: With the API base address configured, a tester cancels as the Employee while `Pending Approval` and as the Admin while `Approved`. Both require a reason. Cancel is never offered on `For Delivery`.
- **SC-005**: Each of the eight screens shows API data in API mode, and no screen shows a seeded value. *(Amended 2026-10-03: the Low stock alerts card is removed, and the Reserved and Assigned asset columns show the published counts.)*
- **SC-006**: In a network trace of API mode, every call goes through the shared client, each operation appears in exactly one client function, and no request carries an office on submit, an Admin note~~, a Purchase Request number~~ or a display id in a single-request path. A unit removal carries its reason. *(Amended 2026-10-07: unit create, bulk create and update carry the Purchase Request number, contracts G5 closed 2026-10-06.)*
- **SC-007**: Browser storage holds no user list, no token and no Google credential after any Inventory or Profile action. No BitLocker identifier or recovery PIN appears in the console or on Profile.
- **SC-008**: `specs/001-office-supplies-mvp/contracts/README.md` records conflict 12 (sign completes, no Admin complete, sign emails the requester, no signed flag), the undocumented request read, the missing per-asset Reserved and Assigned counts (closed 2026-10-03), the missing low-stock count (withdrawn 2026-10-03 with the card), and every other gap found during this slice.

## Clarifications

### Session 2026-10-03

Read against the live Swagger (`/swagger-ui-init.js`) on 2026-10-03.

- Q: The live sign operation moves the request to `completed` and emails the requester, and no operation lets an Admin set `completed`. What do Sign and Complete do in API mode? → A: **Withhold both.** The Employee sees the `Received` request without the sign action and with a short "not yet available" note. The Admin is not offered Complete. Requests stop at `Received` in API mode. Seeded mode keeps the full flow. Recorded as contracts conflict 12. (Story 4, FR-022 to FR-026.)
- Q: Assets draws AVAILABLE, PENDING/RESERVED and ASSIGNED UNITS, and the asset list returns only Available. What do Reserved and Assigned show in API mode? → A: **An explicit not-published dash.** No client-side counting. Conflict 1 stays open. (FR-041.) *Superseded 2026-10-03: `/assets` now publishes `reservedQuantity`, `assignedQuantity` and `totalQuantity`, and the columns show them.*
- Q: The queue's Low stock alerts card is not on the request counts. What does it show in API mode? → A: **An explicit not-published dash.** The seeded count is dropped and the gap is recorded. (FR-028.) *Superseded 2026-10-03: the card is removed ([drift-2026-10-03](../../docs/design-system/drift-2026-10-03.md)).*

Recorded as defaults, not asked:

- BEN-159 lists an Admin cancel on `for_delivery`. Constitution 8.0.0 forbids it, and the constitution wins. Cancel is offered on `Approved` and `Ready for Pickup` only (FR-031).
- A unit added as `Inactive` (spec 015 D3): the create takes no status (conflict 11 G10). In API mode the Inactive option on create is not offered. An Admin sets `Inactive` with an edit after the unit exists. This avoids two non-atomic writes.
- Inventory chip counts come from each status list's `total`, a published query. This is not an invented field.
- The model on UPS, Mice and Other Device (conflict 9): the SPA follows the design and shows the API's refusal. It does not add a Model field.

### Session 2026-10-03 (second) — remove seeded data

Asked by the frontend owner while T0 was blocked, because no Employee account could sign in.

- Q: Should this PR keep the seeded mode that BEN-154 describes ("each screen keeps its seeded source until `VITE_API_BASE_URL` is set")? → A: **No. Remove seeded and mock data entirely.** The application always uses the API. This departs from BEN-154's wording and is recorded here as a spec amendment (constitution I).
- Q: What happens to the browser checks that drive the seeded data? → A: **Retire them.** Keep the static checks. Add mapper checks over small recorded fixtures under `scripts/` (test data, never shipped). An end-to-end run against the live API waits for spec 001 T026.
- Q: T0 without an Employee account? → A: **Record from an Admin session.** Employee-only behaviour (own rows only, `404` on another's request) is documented in the Swagger and is confirmed when an Employee account is available.

Consequences: FR-001, FR-024 and SC-001 are withdrawn. FR-001a and the new SC-001 are added. Story 4's "seeded mode keeps the full flow" no longer holds: Sign and Complete are unavailable anywhere until contracts conflict 12 is answered. The BEN-157 seeded session and its demo accounts go too (spec `http-client-session-and-seeded-source-sw` FR-001 is superseded).

### Session 2026-10-04 — sign completes

Decided by the project owner.

- Q: Keep withholding Sign until the backend splits `/sign` from completion? → A: **No. Change the constitution to match the API** (10.0.0, ADR-0013). Signing completes the request; there is no Admin complete.
- Q: How does the Employee sign? → A: **The full-name field is prefilled with the Employee's own name and is not editable**, so they read, tick and press **I acknowledge and sign**.

Consequences: Story 4 is superseded; FR-022, FR-025 and FR-026 are withdrawn; FR-023 is restated; FR-051 is added. Contracts conflict 12 is closed. The signed time is the `completed` timeline entry: `/sign` sets `receivedSignature` and `completed` in one write and publishes no separate signed time.

### Session 2026-10-04 (second) — form drafts and a dev role override

Asked by the frontend owner.

- Q: An accidental click outside Add Single Unit, Add Multiple Units, Add Asset or Update Asset loses everything typed. Keep it? → A: **Yes, in `localStorage`, for at most five minutes from the last change, with no timer.** An expired draft is removed before the panel renders. Cancel and a successful save clear it. (FR-052)
- Q: The only company account available for development is an Admin. How does the owner see the Employee screens? → A: **A development-build-only role select on sign-in**, temporary, reverted before merge to `dev`. Google sign-in stays real; the API still authorizes by its own role. (FR-053)

### Session 2026-10-06 — queue refresh

Asked by the frontend owner.

- Q: Another Admin's decision or a new submission goes unseen until the queue is reloaded. Keep it current? → A: **A Refresh button on the Requests Queue** that re-reads the page on screen now. It shows that it is working, and a failure is reported. (FR-054)

### Session 2026-10-06 (second) — table load time and addressable search

Asked by the frontend owner.

- Q: A table takes about five seconds to show: `/auth/me`, then `/requests/counts`, then the list, one after another. What should come first? → A: **The rows.** Counts are read beside them and never hold them back, every independent read goes in parallel, and the admin tables may start their read beside `/auth/me` from the last role signed in here. *All requests* is one `GET /requests`. (FR-055)
- Q: A search or sort is lost on reload and cannot be shared. Keep it? → A: **In the address**, search and sort on the Requests Queue and History, search on Assets and Inventory. (FR-056)
- Q: Every load still waits about 1.8 s for `GET /auth/me` before Catalog, My Requests, Profile and the top bar can draw. Keep that? → A: **No. Keep the signed-in user after sign-in and render from it; read `/auth/me` in the background after everything else to refresh it, and remove it on sign-out.** A `401` and a background read with no session remove it too. (FR-058)
