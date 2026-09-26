# Feature Specification: Request List drawer & submit

**Feature Branch**: `emmanuelr/ben-43-p2spa-request-list-drawer-submit`
**Linear**: [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43) (C0 = [BEN-56](https://linear.app/bench-synergy-project/issue/BEN-56))
**Created**: 2026-09-25
**Status**: Draft
**Sources**: `03 - Request List` (as edited 2026-09-23; [drift-2026-09-24 §10](../../docs/design-system/drift-2026-09-24.md)) and `03.1 - Request List - Request Submitted` (2026-09-22 `.fig`), spec 001 US2 / FR-005–FR-007, spec 005 (Catalog) FR-008–FR-014, spec 007 (Employee request panel), `docs/process-flow.md` §1, [ADR-0006](../../docs/adr/0006-assets-and-inventory.md), published Requests contract (`specs/001-office-supplies-mvp/contracts/README.md`), [BEN-98](https://linear.app/bench-synergy-project/issue/BEN-98) validation format

## Overview

The Request List is where an Employee reviews what they picked from the Catalog,
adjusts it, adds an optional note, and submits it. Submitting creates one request
in `Pending Approval`. It is the first transition in the pipeline, the one that
**reserves** stock.

Spec 005 ends at "the Employee added an item at a quantity". This feature
covers everything from there to a created request: the drawer, its line
editing, submission, the confirmation, and how refusals are shown.

## User Scenarios & Testing

### User Story 1 — Review and edit the request list (Priority: P1)

An Employee who has added items from the Catalog opens the Request List drawer
over the Catalog. Each line shows the item's category above its name, with a quantity
stepper and **Remove**. They can raise or lower a quantity, remove a line, and
close the drawer without losing anything. Nothing they do here touches stock.

**Why this priority**: No request can be submitted without a list to submit, and
the Catalog's add action (spec 005 US3) needs somewhere to land.

**Independent Test**: As an Employee, add two items from the Catalog, open the
drawer, change a quantity, remove a line, close and reopen. Confirm the list and
the top-bar count agree throughout, and that Catalog availability has not moved.

**Acceptance Scenarios**:

1. **Given** an Employee on the Catalog, **When** they add an item, **Then** the item appears as a line in the Request List and the top-bar count shows the number of lines.
1a. **Given** an Employee on the Catalog, **When** they add an item, **Then** the drawer does **not** open by itself. The badge updates in place, and the Employee opens the drawer from the top-bar Request List marker.
2. **Given** an item already in the list, **When** the Employee adds it again (from its card or its View Specs panel), **Then** its existing line's quantity increases by the added amount, capped at that item's Available at the Employee's office. No second line is created.
3. **Given** a line, **When** the Employee uses its stepper, **Then** the quantity changes by one. It cannot be lowered below 1 or raised above the item's Available at the Employee's office.
4. **Given** a line, **When** the Employee activates **Remove**, **Then** the line disappears and the top-bar count drops by one.
5. **Given** any edits in the drawer, **When** Catalog availability is read, **Then** it is unchanged. Adding, editing and removing lines reserve nothing (spec 005 FR-013).
6. **Given** an empty list, **When** the drawer is open, **Then** it shows an empty state and **Submit Request** is disabled.
7. **Given** an open drawer, **When** the Employee activates ✕, presses Esc or clicks the scrim, **Then** the drawer closes, focus returns to the control that opened it, and the list is kept.

### User Story 2 — Submit the request (Priority: P1)

The Employee writes an optional **Note to Approver** and activates **Submit
Request**. The system creates one request in `Pending Approval` and, for every
line, moves the quantity from Available to Reserved at the Employee's office in
the same step. The drawer turns into a confirmation of what was created.

**Why this priority**: This is the entry to the automated pipeline (spec 001 US2).
Nothing downstream (queue, My Requests, detail panel) has real data without it.

**Independent Test**: With stock set, submit a two-line request with and without
a note. Assert the confirmation shows the returned id, the list and count reset,
and Catalog availability for each line has fallen by its quantity.

**Acceptance Scenarios**:

1. **Given** a list with valid lines, **When** the Employee submits, **Then** a request is created in `Pending Approval` and the drawer shows the confirmation state (Story 3).
2. **Given** an empty note, **When** the Employee submits, **Then** the request is still created (the note is optional).
3. **Given** a successful submit, **When** the confirmation shows, **Then** the Request List is empty, the top-bar count is 0, and Catalog availability is read again.
4. **Given** asset A at Available 10 / Reserved 0 at the Employee's office, **When** they submit A × 3, **Then** A reads Available 7 afterwards. Total is not decremented at submit (ADR-0006).
5. **Given** a submit in flight, **When** the Employee activates **Submit Request** again, **Then** no second request is sent.

### User Story 3 — See what was submitted (Priority: P1)

After a successful submit, the drawer shows the request as the system recorded
it: the returned request id with its status pill, a **Request submitted**
confirmation, the **Items Requested** table, the **Note to Approver** when one
was given, and the **Status** timeline starting at Submitted.

**Why this priority**: The id is what the Employee quotes when they follow up.
A toast that disappears would hide it (BEN-57 plan constraint 5).

**Independent Test**: Submit, then check every value in the confirmation against
the created request, not against what was typed.

**Acceptance Scenarios**:

1. **Given** a successful submit, **When** the confirmation renders, **Then** its header shows the request id **exactly as the system returned it** and a `Pending Approval` pill.
2. **Given** the confirmation, **When** it renders, **Then** it reads *"Request submitted"* and *"Your request has been sent to your approver. We'll email you whenever its status changes."*
3. **Given** the confirmation, **When** it renders, **Then** **Items Requested** lists one row per line with its item and quantity.
4. **Given** a note was submitted, **When** the confirmation renders, **Then** it reads the note back under **Note to Approver**. With no note, that block is absent.
5. **Given** the confirmation, **When** it renders, **Then** the **Status** timeline shows Submitted with its time, and the later steps (Approved, the handover step, Complete) as pending, labelled as spec 007's timeline labels them.
6. **Given** the confirmation, **When** the Employee closes it, **Then** they are on the Catalog with an empty Request List.

### User Story 4 — Understand a refused submit (Priority: P1)

When the system refuses a submit, the Employee sees why, next to what caused
it, and nothing is reserved.

**Why this priority**: A refused submit that looks like a success, or that
reserves part of the list, breaks constitution III.

**Independent Test**: Force an insufficient-stock refusal on one line of a
multi-line list and a validation refusal on the note. Assert each message shows
where it belongs, the list is intact, and no availability moved.

**Acceptance Scenarios**:

1. **Given** a multi-line list where one line exceeds Available at submit time, **When** the Employee submits, **Then** the submit is refused with the system's own message, no request is created, and **no** line is reserved.
2. **Given** a validation refusal naming a specific field (the note, or a given line's quantity), **When** it is shown, **Then** its message appears beneath that field.
3. **Given** a validation refusal that names no field the drawer shows, **When** it is shown, **Then** its message appears at the top of the drawer rather than being dropped.
4. **Given** any refusal, **When** it is shown, **Then** the lines and note are kept exactly as they were, so the Employee can fix them and resubmit.
5. **Given** the system cannot be reached, **When** the Employee submits, **Then** the drawer says the request was not sent and keeps the list.

### Edge Cases

- Catalog availability is re-read and an item's Available at the Employee's office has fallen below its line's quantity: the line keeps its quantity, and the system decides at submit time (Story 4 AC1). The drawer does not silently lower it.
- An item in the list becomes inactive, or goes to Available 0, before submit: the system refuses the submit, and the drawer shows its message.
- The Employee browses another office (spec 005 FR-014): the list is unaffected. Every line was added at the Employee's own office, and that is the only office a request is made from.
- A non-Employee reaches the Catalog: there is no add action (spec 005 FR-008), so the drawer never has lines, and neither the drawer nor Submit Request is offered to them.
- The Employee adds an item whose line is already at that item's Available: the line stays at Available (FR-002), and the add changes nothing.
- The confirmation is closed: it is not shown again from the drawer. The request is reached from My Requests from then on.
- The Employee leaves the Catalog for My Requests or Profile and comes back: the list and the count are as they left them (FR-004a).
- The Employee reloads the page: the list is gone and the count reads 0. Nothing was reserved, so nothing is lost on the system side.
- The session expires between editing and submitting: the existing session handling governs. This feature adds no re-login path.
- A very long note: the drawer accepts what the system accepts and shows the system's own refusal if it is too long. It sets no limit of its own.
- The returned id uses a format other than `REQ-2026-1847`: it is shown as returned (drift §5 flags `REQ-10482` vs `REQ-2026-1847`).

## Requirements

### Functional Requirements

- **FR-001**: System MUST hold an Employee's Request List as one line per asset, each with a quantity, and MUST NOT reserve or change stock while the list is edited.
- **FR-002**: System MUST merge an add for an asset already in the list into that asset's line, summing quantities and capping at Available at the Employee's office.
- **FR-003**: System MUST NOT let the stepper lower a line below 1 or raise it above the item's Available at the Employee's office, as last read. If a later read shows Available below a line's quantity, the line keeps its quantity, and the Employee may lower it. The system decides at submit (Story 4 AC1).
- **FR-004**: System MUST let the Employee remove any line.
- **FR-004a**: System MUST keep the Request List for the whole signed-in session, across moves between routes, and MUST clear it on sign-out. It does not survive a page reload.
- **FR-005**: System MUST keep the top-bar count equal to the number of lines in the Request List at all times.
- **FR-006**: System MUST present the Request List as a right-hand drawer over the Catalog, with the `Request List` header, one row per line (the item's category as an eyebrow, its name beneath, a `− qty +` stepper, **Remove**), a **Note to Approver (optional)** free-text field, and **Submit Request**.
- **FR-006a**: System MUST open the drawer only from the top-bar Request List marker. Adding an item MUST NOT open it.
- **FR-006b**: System MUST re-read Available at the Employee's office for the listed items each time the drawer opens. That read is the bound FR-003 uses.
- **FR-006c**: System MUST give the drawer the same behaviour as the product's other side panels: announced as a dialog, focus kept inside while open, the page behind it not scrollable.
- **FR-007**: System MUST show an empty state and disable **Submit Request** when the list has no lines.
- **FR-008**: System MUST submit the whole list as a single request with one line per asset and the note, if any. It MUST NOT split a list into several requests.
- **FR-009**: System MUST treat submit as all-or-nothing. On refusal, no request exists and no line is reserved (spec 001 FR-006, FR-007).
- **FR-010**: System MUST prevent a second submit while one is in flight.
- **FR-010a**: System MUST show that a submit is in progress, and MUST NOT allow the lines or note to be edited until it resolves.
- **FR-011**: System MUST, on success, clear the Request List of what was submitted, reset the top-bar count accordingly (to 0 unless an item was added while the submit was in flight), re-read Catalog availability, and show the confirmation state. An item added after the submit started was never sent and MUST NOT be removed by its success.
- **FR-012**: System MUST show, in the confirmation state, the request id and status as returned, the `Request submitted` title and the drawn confirmation copy, the **Items Requested** table (`ITEM` / `QTY`), the **Note to Approver** when present, and the **Status** timeline.
- **FR-013**: System MUST show a validation refusal's message beneath the field it names, and MUST show messages that name no visible field at the top of the drawer.
- **FR-013a**: System MUST place a validation message whose pointer falls inside a line (any field of the Nth submitted line) beneath that line's row, and one pointing at the note beneath the note field.
- **FR-014**: System MUST show the system's own message for a refused submit (including insufficient stock), and MUST NOT translate it into an error code or message of the SPA's own (constitution VII).
- **FR-015**: System MUST keep the lines and note intact after any refusal or failure to reach the system.
- **FR-016**: System MUST offer the Request List and submit only to Employees (constitution II, spec 005 FR-008).
- **FR-017**: System MUST NOT display or send any request field the published Requests contract does not expose.

### Key Entities

- **Request List** (client-held, pre-submit): The Employee's draft. Lines plus an optional note. It never reaches the system until submit.
- **Request List line**: An asset (its category, name and model, as the Catalog showed them) and a quantity, bounded by Available at the Employee's office.
- **Request** (system-held, post-submit): What the system created. Its id, status (`Pending Approval`), submitted time, lines and note, as returned. The confirmation reads these, not the draft.

## Contract facts

Read from the live Swagger on 2026-09-25. Recorded so the plan does not guess.

- The submit accepts the lines as **asset + quantity** pairs and the note as **`purpose`**. The drawn label "Note to Approver" is the design's name for `purpose`.
- The submit carries **no office**. The requesting office is the Employee's own (spec 001 assumption), decided by the system.
- Only the **400 validation** response is documented (RFC 9457, `errors[].pointer`). The example pointers are `#/purpose` and `#/items`.
- **The success response has no documented schema**, so the id, status, timestamp and line fields the confirmation needs are not yet published.
- **No insufficient-stock refusal is documented.** Its status and body are unknown.
- The request list read documents display ids in the form `REQ-2026-14`.

**Until the success and insufficient-stock shapes are published**, submit is
demonstrated against a stand-in source that enforces the same rules: all-or-nothing
reserve at the Employee's office, refusal when a line exceeds Available, and a
returned id, status, time and lines. It sits behind the same seam as the Catalog
(spec 005) and the Employee request panel (spec 007). The live source replaces
it when the backend documents both shapes. The gap is recorded in
`specs/001-office-supplies-mvp/contracts/README.md`. The 400 validation mapping
(FR-013) is built against the published format from the start.

## Assumptions

- The requesting office is the Employee's home office. Other offices are browse-only (spec 005 FR-014).
- "Note to Approver" is kept as drawn, although the Approver role is retired (drift-2026-09-22 §8, flagged to the designer).
- The Status timeline, Items Requested table and status pill are the same components spec 007's detail panel uses. This feature reuses them rather than drawing new ones.
- Reserve semantics (Available → Reserved at submit, Total unchanged) are the system's job. The SPA only re-reads availability afterwards. Contract conflict 1 is still open on how the aggregate is published.

## Out of Scope

- The Catalog's cards, filters, office selector and add action (spec 005).
- My Requests, the request detail panel and cancel (specs 007 and BEN-44).
- Editing a request after submit. A submitted request's lines never change (spec 001 key entities).
- Requesting another office's stock.
- Any route, payload field or error code the contract does not publish.
- A per-item model select in the drawer. The Catalog card is the option (spec 005 D5).

## Success Criteria

- **SC-001**: A tester, as an Employee, can add items, edit and remove lines, submit with and without a note, and see the confirmation with the returned id, all in one sitting from the Catalog.
- **SC-002**: After a successful submit, each line's asset reads Available lower by exactly its quantity at the Employee's office. After a refused submit, no asset's Available has changed.
- **SC-003**: Every validation refusal the contract can return for this submit is shown beneath the right field, or at the top of the drawer when it names none. None is dropped.
- **SC-004**: At no point do the top-bar count and the number of lines in the drawer disagree.
- **SC-005**: Every value in the confirmation matches the created request as the system reports it.
- **SC-006**: A non-Employee cannot reach the drawer or submit through the UI.

## Clarifications

### Session 2026-09-25

- Q: How long does the Request List last? The shell's count lives for the session, but the interim draft died with `/catalog`, so the two could disagree. → A: **The whole signed-in session.** The list survives route changes and is cleared on sign-out. It is not persisted across a reload (FR-004a).
- Q: Does adding an item open the drawer? BEN-43 says "opens/updates"; the View Specs panel stays open after an add, so auto-opening would stack two panels. → A: **No. The drawer opens only from the top-bar marker.** An add updates the list and the badge in place (FR-006a). This reads BEN-43 acceptance 1's "opens/updates" as "updates".
- Q: The contract documents no success body and no insufficient-stock refusal for submit. Build live, block, or stand in? → A: **Stand in behind a seam**, as specs 005 and 007 do. A seeded source enforces the same all-or-nothing reserve rules until the backend publishes both shapes, and the gap is logged in `contracts/README.md`. FR-013's validation mapping follows the published RFC 9457 format from the start.

### Session 2026-09-25 — Amendment (design)

- Q: The file's `03 - Request List` line was redrawn on 2026-09-23, after the render this spec was first built to, and the 09-24 drift missed it: the category as a grey eyebrow over the item name, no model. Follow it? → A: **Yes** (project owner, design review 2026-09-25). FR-006 amended; recorded in [drift-2026-09-24 §10](../../docs/design-system/drift-2026-09-24.md). The submitted read-back (`03.1`, unchanged) keeps "<name> - <model>".
