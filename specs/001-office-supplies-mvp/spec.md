# Feature Specification: Office Supplies Request System MVP

**Feature Branch**: `001-office-supplies-mvp`  
**Created**: 2026-09-11  
**Status**: Draft  
**Sources**: Linear initiative brief, process-flow diagram, 2026-09-22 design re-export ([drift](../../docs/design-system/drift-2026-09-22.md)), re-checked against the 2026-09-26 export ([drift](../../docs/design-system/drift-2026-09-26.md))

## Overview

Replace Codev's chat/email office-supplies process with a centralized system where employees request assets from a catalog, an Admin approves or rejects and then hands the items over by delivery or pickup, and the system keeps stock and email notifications aligned with each status change.

Amended 2026-09-22 to the design re-export: two roles instead of three, per-office `Total / Available / Reserved` stock instead of a single on-hand number, and `For Delivery` / `Ready for Pickup` / Admin-completed instead of `For Release` / `Released` / employee-confirmed. See the Clarifications section and [ADR-0005](../../docs/adr/0005-two-role-model.md)–[0007](../../docs/adr/0007-fulfilment-status-vocabulary.md).

Amended 2026-09-26: Inventory is a **register of units**, and the per-office quantities are counts of unit statuses, with the same numbers as before. See Session 2026-09-26 and [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md).

Amended again 2026-09-26: the Employee signs an **Accountability Form** on receipt, which moves the request to **`Received`** and assigns the reserved units to them; the Admin then completes. See Session 2026-09-26 (`Received`) and [ADR-0009](../../docs/adr/0009-received-and-accountability-form.md).

## User Scenarios & Testing

### User Story 1 - Encode assets and add units (Priority: P1)

An Admin records assets (name, category, model, description, image, category-dependent specs, low-stock threshold) on the **Assets** screen, then adds **units** of each on the **Inventory** screen, one at a time or several at once. Each unit is held at an office. ~~then sets how many of each are held at each office on the **Inventory** screen~~ (withdrawn 2026-09-26). Employees open the catalog and see availability **before** they request anything. If an asset is not encoded, or holds no stock at the selected office, it cannot be requested from there.

**Why this priority**: Stock must exist before the pipeline can run (stock rule 1).
**Independent Test**: Log in as Admin, add an asset, add units at an office; log in as Employee and see that availability for the matching office.
**Acceptance Scenarios**:

1. **Given** no assets exist, **When** an Admin saves an asset with name, category and the fields its category requires, **Then** it appears on Assets with zero units.
2. ~~**Given** an encoded asset, **When** an Admin opens **Update stock** and sets Cebu to 10, **Then** Inventory shows Total 10, Available 10, Reserved 0 and an `In Stock` pill.~~ **Given** an encoded asset, **When** an Admin adds 10 units at Cebu with **Add Multiple Units**, **Then** Inventory lists 10 `Available` units at Cebu and the asset counts Total 10, Available 10, Reserved 0 there.
2a. **Given** a unit that is `Assigned` or `Reserved`, **When** an Admin tries to remove it, **Then** the system refuses.
3. **Given** encoded stock, **When** an Employee opens the catalog with the Cebu office selected, **Then** they see availability per asset and cannot edit it.
4. **Given** an asset with 0 available at the selected office, **When** an Employee builds a request, **Then** they cannot submit a positive quantity for it.
5. **Given** an asset whose Available at an office is at or below its (per-asset) low-stock threshold, **When** either screen is opened, **Then** it counts under the `Low stock` chip and shows a `Low Stock` pill.

### User Story 2 - Submit a supply request (Priority: P1)

An Employee filters the catalog by category and office, picks a model, sets a quantity, adds one or more assets to the **Request List** drawer, optionally writes a **Note to Approver**, and submits. The request enters **Pending Approval**. For each line, the requested quantity moves from `Available` to `Reserved` at that office. The Employee sees a confirmation carrying the new request id, receives a **Request received** email, and finds the request in My Requests.

**Why this priority**: This is the entry to the automated pipeline.
**Independent Test**: With stock set, submit a request and assert status, the reserve movement, and the recorded notification.
**Acceptance Scenarios**:

1. **Given** asset A has Available 10 / Reserved 0 at Cebu, **When** an Employee at Cebu submits quantity 3, **Then** the request is `Pending Approval`, the asset shows Total 10 / Available 7 / Reserved 3, and a `Request received` email is recorded for the Employee.
2. **Given** asset A has Available 2 at Cebu, **When** an Employee submits quantity 3, **Then** the submit is refused, no request is created, and the quantities are unchanged.
3. **Given** a valid drawer, **When** the note is omitted, **Then** the request still submits (the note is optional).
4. **Given** a multi-line request where one line exceeds Available, **When** it is submitted, **Then** the whole submit rolls back — no line is reserved.

### User Story 3 - Approve or reject a request (Priority: P1)

An Admin opens the **Requests Queue**, filters or searches, and reviews a request: requester (name, email, office), lines with quantity and current inventory, the note, and the status timeline. They approve, or they reject with a mandatory reason. Approval leaves the quantity reserved and notifies the Employee. Rejection releases the reservation, sets **Rejected**, and notifies the Employee. The Employee may then submit a **new** request; they do not reopen the rejected one.

**Why this priority**: Without review, fulfillment cannot start; reject is the compensating path for stock.
**Independent Test**: Approve one pending request; reject another with a reason and confirm the reservation is released.
**Acceptance Scenarios**:

1. **Given** a `Pending Approval` request, **When** an Admin approves, **Then** status is `Approved`, quantities are unchanged from the post-submit values, and a `Request approved` email is recorded for the Employee.
2. **Given** a `Pending Approval` request for qty 3 that moved Available 10 → 7, **When** an Admin rejects with reason "Not needed", **Then** status is `Rejected`, the asset is back to Available 10 / Reserved 0, the reason is stored and shown to the Employee, and a `Request declined` email is recorded.
3. **Given** a pending request, **When** an Admin tries to reject with an empty reason, **Then** the system refuses and status stays `Pending Approval`.
4. **Given** the queue, **When** an Admin filters by `Pending Approval`, **Then** only pending requests are listed and the chip count matches.

### User Story 4 - Hand over by delivery or pickup (Priority: P1)

An Admin opens an approved request and uses **Update Status** to set **For Delivery** or **Ready for Pickup**. Choosing `Ready for Pickup` records a pickup location. The Employee is notified with a **Status changed** email carrying the previous and new status, and the location when there is one. Quantities do not change.

**Why this priority**: Required for the MVP demo fulfillment path.
**Independent Test**: Move an approved request to `Ready for Pickup` with a location; assert the email and unchanged quantities.
**Acceptance Scenarios**:

1. **Given** an `Approved` request, **When** an Admin sets `For Delivery`, **Then** status is `For Delivery` and quantities are unchanged.
2. **Given** an `Approved` request, **When** an Admin sets `Ready for Pickup` with location "GS Counter", **Then** status is `Ready for Pickup`, the location is stored, and the `Status changed` email carries it in its Pickup row.
3. **Given** a `Pending Approval` request, **When** an Admin attempts Update Status, **Then** the system refuses.
4. **Given** a `For Delivery` request, **When** an Admin sets `Ready for Pickup`, **Then** the change is allowed — they are peers, not a sequence.

### User Story 5 - Confirm receipt and complete (Priority: P1)

*(Rewritten 2026-09-26, constitution 5.0.0.)* The owning Employee opens a handed-over request and signs the **Accountability Form**: they agree to its conditions, type their full name, and may add notes. The System moves the request to **Received**, and this is when the stock actually leaves: the reserved units become `Assigned` to the Employee, so `Total` and `Reserved` both fall by the requested quantity. The Employee receives a **Status changed** email. An Admin then marks the request **Complete**; no quantity changes.

**Why this priority**: Closes the documented pipeline; `Received` is the only request transition that takes units out of the store.
**Independent Test**: Sign the form on a `Ready for Pickup` request and assert the quantities; complete it as the Admin; confirm neither actor can take the other's step.
**Acceptance Scenarios**:

1. **Given** a `Ready for Pickup` request for qty 3 on an asset at Total 10 / Available 7 / Reserved 3, **When** the owning Employee signs the Accountability Form, **Then** status is `Received`, the asset shows Total 7 / Available 7 / Reserved 0, and a `Status changed` email is recorded.
2. **Given** a `Received` request, **When** an Admin completes it, **Then** status is `Completed` and quantities are unchanged.
3. **Given** a `For Delivery` request, **When** an Admin attempts to complete it, **Then** the system refuses — it must be `Received` first.
4. **Given** a `For Delivery` request, **When** anyone other than the owning Employee attempts to submit its Accountability Form, **Then** the system refuses.
5. **Given** the form, **When** the agreement is unticked or the full name is empty, **Then** submission is refused and status is unchanged.
6. **Given** a `Completed` request, **When** anyone attempts any transition, **Then** the system refuses.

### User Story 6 - Track status and history (Priority: P2)

An Employee sees status and history for their own requests in **My Requests**, and opens a detail panel with the lines, the note, the status timeline and — while `Pending Approval` — **Cancel Request**. An Admin sees the **Requests Queue** for live work and **History** for resolved requests across all requestors.

**Why this priority**: Reduces "where is my request?" traffic; slightly less blocking than the mutation path.
**Independent Test**: After several transitions, lists and detail panels show the current status and timestamps.
**Acceptance Scenarios**:

1. **Given** an Employee with past requests in mixed statuses, **When** they open My Requests, **Then** each row shows request id, date, items, status and a **View details** action.
2. **Given** resolved requests exist, **When** an Admin opens History, **Then** they see `Completed`, `Cancelled` and `Rejected` requests across all requestors with the date resolved, and the detail panel shows the stored reason.
3. **Given** a request owned by another Employee, **When** an Employee opens My Requests, **Then** it is not listed.

### User Story 7 - Cancel a request (Priority: P2)

The owning Employee stops their own request while it is `Pending Approval`; an Admin stops an `Approved`, `For Delivery` or `Ready for Pickup` request that cannot be fulfilled. Either way a reason is required and the reservation is released.

**Why this priority**: The compensating path for requests that are never decided.
**Independent Test**: Cancel as Employee with a reason and assert the reservation is released; attempt it on an approved request as the Employee and be refused.
**Acceptance Scenarios**:

1. **Given** a `Pending Approval` request for qty 3, **When** the owning Employee confirms cancellation with a reason, **Then** status is `Cancelled`, the reservation is released, and a `Status changed` email is recorded.
2. **Given** the cancel dialog, **When** the reason is empty, **Then** **Confirm Cancellation** is refused and status is unchanged.
3. **Given** an `Approved` request, **When** the owning Employee attempts to cancel, **Then** the system refuses.
4. **Given** a `Completed` request, **When** an Admin attempts to cancel, **Then** the system refuses.

### User Story 8 - Profile (Priority: P3)

A signed-in user opens **Profile** and sees their name, email, home office and the equipment currently assigned to them.

**Why this priority**: Nav completeness; ~~the assigned list depends on a register the MVP does not build~~ the assigned list reads the units assigned to the user (ADR-0008), and stays conditional until the contract exposes them.
**Independent Test**: Open Profile as an Employee and see identity plus either the assigned list or its empty state.
**Acceptance Scenarios**:

1. **Given** a signed-in Employee, **When** they open Profile, **Then** they see avatar, name, `email • office`.
2. **Given** the contract exposes no assigned equipment, **When** Profile is opened, **Then** **Currently Assigned** renders its empty state rather than invented rows.

### Edge Cases

- Concurrent submits for the last remaining unit at one office: only one request is created; the other receives a clear insufficient-stock outcome and `Available` never goes negative.
- Request with multiple lines: all lines reserve or the whole submit rolls back (no partial reservation).
- Inactive or deleted-looking assets: employees cannot submit them (MVP: an Admin can mark an asset inactive).
- An asset that exists but holds no stock at the selected office: not requestable from that office, requestable from another.
- Actor uses the wrong role's action (Employee approves, Employee completes): refused.
- Duplicate Accountability Form on an already `Received` request: refused, the units are assigned once.
- Duplicate complete on an already completed request: refused, status stays `Completed`.
- Cancel attempted on a request that is already `Received`, `Completed`, `Rejected` or `Cancelled`: refused, status unchanged.
- An Employee never signs the form: the request stays `For Delivery` / `Ready for Pickup` with its stock reserved; an Admin may cancel it with a reason.
- Employee attempts to cancel a request that has already been approved: refused — after a decision, only an Admin may cancel.
- Cancellation submitted with an empty reason, by either role: refused.
- Two actors cancel the same request at once: the reservation is released once, never twice.
- `For Delivery` changed to `Ready for Pickup` (or back) before completion: allowed; a `Status changed` email is sent for each move.
- Email delivery fails after a valid transition: request status remains; failure is recorded for that notification.

## Requirements

### Functional Requirements

- **FR-001**: System MUST authenticate users and expose exactly one role per user: **Employee** or **Admin**.
- **FR-002**: System MUST allow Admins to create and update **assets** — name, category, model, description, image, active flag, and the specification fields the category defines.
- **FR-002a**: System MUST vary the asset form's fields by category, as the design defines: Laptop adds RAM, Storage, Processor, Graphics, Operating System; Phone adds RAM, Storage; Laptop / Phone / Headset require Model; Wifi and Type C Hub offer Model as optional; UPS, Mice and Other Device offer neither.
- **FR-003**: ~~System MUST hold stock per **(asset, office)** across the five offices, as **Total**, **Available** and **Reserved**, plus a **low-stock threshold**, and MUST allow Admins to set them from the Update stock panel.~~ *(Withdrawn 2026-09-26.)* System MUST hold stock as **units**: each unit belongs to one asset and one of the five offices, and carries a tag, serial number, status (`Available` · `Reserved` · `Assigned` · `Inactive`, as the contract defines), optional assignee, purchase details and device details. Admins MUST be able to add one unit or several at once, review and edit a unit, and remove one. Per (asset, office), **Available** and **Reserved** are counts of units in those statuses and **Total** = Available + Reserved. The **low-stock threshold** is held per asset.
- **FR-003a**: System MUST maintain `Total = Available + Reserved` and MUST NEVER persist a negative value for any of the three.
- **FR-003b**: System MUST refuse to remove a unit that is `Assigned` or `Reserved`. It MUST let only request transitions move a unit into or out of `Reserved`. A manual unit edit MAY set `Available` ↔ `Inactive` or record an existing assignment (`Assigned` + user). It MUST treat a unit's BitLocker identifier and recovery key/PIN as Admin-only secrets, never shown to an Employee and never logged.
- **FR-004**: System MUST display availability per active asset for the selected office to authenticated users before request submit.
- **FR-005**: System MUST allow Employees to submit a request with one or more lines, quantity ≥ 1 per line, a selected model where the asset offers one, and an optional **note to approver**.
- **FR-006**: System MUST refuse submit when any line exceeds `Available` at the requesting office or references an inactive or missing asset, and MUST roll the whole submit back.
- **FR-007**: System MUST, on successful submit, create the request in `Pending Approval` and move each line quantity from `Available` to `Reserved` (that many units change status) in one atomic operation.
- **FR-008**: System MUST allow Admins to approve a `Pending Approval` request, moving it to `Approved` without changing any quantity.
- **FR-009**: System MUST allow Admins to reject a `Pending Approval` request only when a non-empty reason is provided, moving it to `Rejected` and returning each line quantity from `Reserved` to `Available` in one atomic operation.
- **FR-010**: System MUST NOT reopen a rejected or cancelled request; the Employee MUST create a new request if they still need the items.
- **FR-010a**: System MUST allow the owning Employee to cancel their own request while it is `Pending Approval`, **only when a non-empty reason is provided**, with the same atomic status change and reservation release.
- **FR-010b**: System MUST allow an Admin to cancel an `Approved`, `For Delivery` or `Ready for Pickup` request that cannot be fulfilled, only when a non-empty reason is provided, with the same atomic status change and reservation release.
- **FR-010c**: System MUST refuse cancellation of a `Received`, `Completed`, `Rejected` or already-`Cancelled` request.
- **FR-011**: System MUST allow Admins to move an `Approved`, `For Delivery` or `Ready for Pickup` request to `For Delivery` or `Ready for Pickup` without changing any quantity. The two are peers, not a sequence.
- **FR-011a**: System MUST record a pickup location when the target status is `Ready for Pickup`, and MUST carry it in the resulting notification.
- **FR-012**: System MUST allow Admins to move a `Received` request to `Completed`, without changing any quantity. *(Rewritten 2026-09-26.)*
- **FR-012a**: System MUST move a `For Delivery` or `Ready for Pickup` request to `Received` when, and only when, its owning Employee submits the Accountability Form, decreasing `Total` and `Reserved` by each line quantity (the reserved units become `Assigned` to the requester) in the same atomic operation. No actor may set `Received` directly. *(Rewritten 2026-09-26; was "no confirm-receipt action".)*
- **FR-012b**: System MUST show the owning Employee an **Accountability Form** on their own `For Delivery` or `Ready for Pickup` request, as `04.1` draws it: the request's items and quantities (not unit tags), the acknowledgement conditions, a required **I have read and agree to the above** checkbox, a required **Type full name to sign** field, optional **Other Notes**, and **Cancel** / **I acknowledge and sign**.
- **FR-013**: System MUST refuse illegal status transitions and actions not allowed for the caller's role.
- **FR-014**: System MUST send an email on every defined transition using the design's templates: **Request received** on submit (Employee); **Request approved** on approve (Employee); **Request declined** on reject (Employee); **Status changed** on every other transition — `For Delivery`, `Ready for Pickup`, `Received`, `Completed`, `Cancelled` — carrying previous status, new status, and the pickup location when there is one.
- **FR-014a**: System MAY send the **Welcome** template on account creation. It is not a transition.
- **FR-014b**: System MUST NOT implement the **Action required** template until a request-for-information flow is specified; the design provides the template and no flow.
- **FR-015**: System MUST persist notification attempts (sent or failed) tied to the request and template.
- **FR-016**: System MUST show Employees **My Requests** (their own requests, any status) and Admins the **Requests Queue** (all requestors, live statuses, `Received` included) with filter chips `All requests · Pending Approval · Approved · For Delivery · Ready for Pickup`, search by request id / employee name / email / item, and sort by Newest First / Oldest First / Employee (A-Z).
- **FR-016a**: System MUST show Admins a **History** of resolved requests across all requestors — `Completed`, `Rejected` and `Cancelled` — with request id, requestor, items, status, the date it was resolved, and a read-only detail panel carrying the stored rejection or cancellation reason.
- **FR-017**: System MUST show a signed-in user their **Profile**: name, email, home office, and the equipment currently assigned to them (units assigned to the user) where the contract exposes it, with an empty state otherwise.
- **FR-018**: System MUST paginate the Assets, Inventory, Requests Queue and History tables, showing the result range, page controls and a results-per-page control.

### Key Entities

- **User**: Authenticated person with name, email, home office, and a single role (`employee` | `admin`).
- **Asset**: Requestable model — name, category, model, description, image, active flag, low-stock threshold, category-dependent specification pairs. Must exist before it can be requested.
- **Unit**: One physical item of an asset at one office: tag, serial number, status, optional assignee and assigned-on date, purchase details, device details (secret fields Admin-only), notes.
- **Stock**: ~~Held per (asset, office): `total`, `available`, `reserved`, `lowStockThreshold`.~~ Derived per (asset, office) from units: `available`, `reserved`, `total` = available + reserved; `lowStockThreshold` is on the Asset. Derived stock status: `In Stock` | `Low Stock` | `Out of Stock`.
- **Request**: Header with requestor, requesting office, status, optional note to approver, optional rejection reason, optional cancellation reason and who cancelled, optional pickup location, the Accountability Form acknowledgement (signed name, notes, signed time), and timestamps per transition.
- **Request line**: Asset + selected model + quantity captured at submit (quantity does not change after submit).
- **Notification log**: Template, recipients, request id, payload facts, send outcome.

## Assumptions

- Internal Codev use only; demo uses seeded users (one Employee, one Admin).
- Any Admin may review any request and fulfil any approved one.
- The requesting office is the Employee's own office, shown as the catalog's office selector; the MVP does not support requesting stock held at another office.
- Pickup location is entered when the Admin chooses `Ready for Pickup`, matching the "Pickup" row in the `Status changed` email.
- "Real-time status" means the UI shows API state after refresh or after a successful mutation, not a live websocket (unless later specified).
- A notification is emitted and recorded on each defined transition. Delivery transport is an API concern (inbox, SMTP, or logged stub).
- The office set is the five the design defines: Cebu, Bacolod, Makati, **Ortigas**, Davao. ~~`Ortigas` vs the contract's `Pasig` is unresolved~~ The contract adopted `Ortigas` on 2026-09-25.

## Out of Scope

- Vendor purchasing, budgets, cost allocation
- SSO, MFA, password reset productization beyond a working login
- Native mobile clients
- Multi-level approval, delegation, or out-of-office routing
- Creating requests from email or chat
- Automatic cancel of stale pending requests
- ~~**A per-unit asset register** — serial numbers, assignment to a person, purchase details, BitLocker escrow. The design draws it (`Add Catalog Item`, Inventory variant A, Profile's assigned list); the MVP ships the aggregate model only and must not foreclose it.~~ *Brought into scope 2026-09-26* (Session 2026-09-26, ADR-0008).
- **The `Action required` flow** — asking a requester for more information with a respond-by date.
- Requesting stock held at an office other than the requester's

## Success Criteria

### Measurable Outcomes

- **SC-001**: A tester can complete the documented happy path (encode asset → set stock → request → approve → Ready for Pickup → Employee signs the Accountability Form → complete) in one sitting using only the UI, ending in `Completed` with `Total` reduced by the requested quantity and `Reserved` back to its pre-submit value.
- **SC-002**: A tester can complete the reject path and observe the reservation released — `Available` back to the pre-submit quantity — plus a visible rejection reason, then submit a new request for the same asset.
- **SC-002a**: A tester can complete the cancel path from both sides: as the Employee while `Pending Approval`, and as the Admin on an `Approved` request; both require a reason and both release the reservation.
- **SC-003**: For each of the four transactional templates, a test run produces a recorded notification to the specified recipients with request id and item facts; `Status changed` carries a previous/new status pair.
- **SC-004**: Concurrent attempts to request more than the remaining `Available` at one office result in at most one successful reservation; no quantity is ever negative and `Total = Available + Reserved` holds throughout.
- **SC-005**: A user in one role cannot complete the other role's pipeline action through the UI or API.
- **SC-006**: QA can re-run SC-001, SC-002 and SC-002a via Playwright as a regression check before the MVP demo.

## Clarifications

### Session 2026-09-11

Resolved from the Linear brief and process diagram with MVP defaults (no blocking product questions remaining):

- Q: Combined Admin vs split roles? → A: ~~Approver and Supply Admin are distinct (diagram + Linear note).~~ **Superseded 2026-09-22 — one Admin.**
- Q: When does inventory move? → A: ~~Decrement on submit; increment on reject; unchanged thereafter.~~ **Superseded 2026-09-22 — submit reserves, reject/cancel release, complete consumes.**
- Q: Resubmit after reject? → A: New request, not reopen.
- Q: Who can approve? → A: ~~Any user with Approver role~~ **any Admin** (small internal team).
- Q: Auth for MVP? → A: ~~Username/password (email + password) with seeded demo users; SSO later.~~ **Superseded 2026-09-12 — see Session 2026-09-12 below.**

### Session 2026-09-26 — Amendment (`Received`)

Raised by the 2026-09-26 `.fig` re-export
([drift-2026-09-26 §3](../../docs/design-system/drift-2026-09-26.md)), which puts a
`Received` node on every status timeline, and answers
[drift-2026-09-24 §2](../../docs/design-system/drift-2026-09-24.md). Decided by
the project owner (BEN-43), after the unit-register amendment below.

- Q: Adopt `Received` as a status? → A: **Yes.** `For Delivery` / `Ready for Pickup` → `Received` → `Completed`.
- Q: What moves a request to `Received`? → A: **The System, when the owning Employee submits the Accountability Form.**
- Q: Who completes? → A: **The Admin**, from `Received` only.
- Q: When do the items leave the store? → A: **On `Received`**: the reserved units move to `Assigned` to the requester. `Completed` changes no unit.

Recorded as defaults, not asked: `Received` cannot be cancelled; the form signs for request lines, not units, because the contract exposes no units on a request.

Constitution **5.0.0** (MAJOR: IV redefined; III's assignment point moves from `Completed` to `Received`; II and V extended). [ADR-0009](../../docs/adr/0009-received-and-accountability-form.md) amends ADR-0007 and ADR-0008. US5, FR-010c, FR-012, FR-012a, FR-014, FR-016, the Request entity and SC-001 are reworded in place; FR-012b is new. The published contract has neither the status nor the form ([contracts/README.md](contracts/README.md) conflict 5), so the form is specced and not built.

### Session 2026-09-26 — Amendment (unit register)

Raised by the ratification of the 2026-09-22 export's open questions (BEN-116,
[spec 010](../010-design-ratification/spec.md)), checked against the 2026-09-26
`.fig` ([drift-2026-09-26](../../docs/design-system/drift-2026-09-26.md)), and
decided by the project owner.

- Q: The Mockups page now carries a single `03 - Inventory` that lists **units** (`MODEL · CATEGORY · PR · SERIAL NUMBER · OFFICE · ASSIGNED · STATUS · ACTION`), and `03.4 - Update Stocks` is on the Archive page. Keep the stock-line table and per-office steppers, or follow the file? → A: **Follow the file.** Inventory is a unit register. `+ Add Inventory` offers **Add Single Unit** and **Add Multiple Units**.
- Q: How do the stock rules map onto units? → A: **Counts of unit statuses per (asset, office).** Submit reserves *qty* units, reject and cancel release them, and complete moves them to `Assigned` to the requester. The numbers are unchanged. The API picks the units.
- Q: Where is the low-stock threshold held? → A: **On the asset**, as the contract (`lowQtyAlert`) and the Update Asset panel both have it.

**Scope of the amendment.** Constitution **4.0.0** (MAJOR: III and VIII are
redefined), carried by [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md),
which partly supersedes ADR-0006. US1, FR-003 and Key Entities are rewritten
over units, and FR-003b is added. The per-unit register leaves Out of Scope. The
**Update stocks panel is withdrawn**. The `Received` status and the
accountability form the same file draws were **not** adopted by this
amendment; the `Received` amendment above adopts them.

### Session 2026-09-24 — Amendment

Raised by the 2026-09-24 `.fig` re-export
([drift-2026-09-24 §6](../../docs/design-system/drift-2026-09-24.md)) and decided
by the project owner.

- Q: The `Request Status` component and every screen drawn since 09-22 name the pickup state **Ready for Pickup** and paint the handover pills pink (For Delivery) and blue (Ready for Pickup). The queue chip says `For Pickup`, and ADR-0007 made both pills green. Which wins? → A: **The component.** The state is `Ready for Pickup` everywhere, the chip included, and the pills take the drawn colours.

Constitution **3.0.1** (PATCH: IV renames a state and redefines none). The
requirements above are reworded in place, and the 2026-09-22 session below keeps
the name it used at the time.

### Session 2026-09-22 — Amendment

Raised by the 2026-09-22 `.fig` re-export
([drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md)) and decided by
the project owner: **the design file wins, and the governing documents move to
it.** Constitution I requires it recorded here rather than applied silently.
This is the largest amendment so far — it changes the role model, the stock
model and the end of the pipeline, and it withdraws requirements rather than
only adding them.

- Q: The file now draws one merged **Admin** doing approval *and* fulfilment — in the navigation, the queue title, the queue subtitle and a single review panel. Keep the Approver / Supply Admin split, or follow the file? → A: **Follow the file.** Two roles: Employee and Admin.
- Q: The file's status timeline, status select and queue filter chips say `For Delivery` / `For Pickup` and give the **Complete** action to the Admin. Keep `For Release` → `Released` → employee-confirmed? → A: **Follow the file.**
- Q: The file splits admin data into **Assets** (by model, with available / reserved / deployed unit counts) and **Inventory** (total / available / reserved per item, edited per office), which spec 001 explicitly excluded. Adopt it? → A: **Yes.**
- Q: The employee's own cancel dialog asterisks **"Reason for cancellation \*"**. Keep the reason optional for the requestor, as the 2026-09-15 amendment decided? → A: **No — required from whoever cancels.**
- Q: The file draws six emails whose names do not match the six in `docs/process-flow.md`. Adopt them? → A: **Yes**, as four transactional templates plus two non-transition ones.

**Scope of the amendment.**

- Constitution **3.0.0**. **MAJOR**, and four principles move, not one: **II** collapses to Employee + Admin; **III** is rewritten around per-office `Total / Available / Reserved`; **IV** replaces `For Release` / `Released` with `For Delivery` / `For Pickup`, gives `Completed` to the Admin, and makes a cancellation reason always required; **V** is redrawn around four transactional templates. Carried by [ADR-0005](../../docs/adr/0005-two-role-model.md), [ADR-0006](../../docs/adr/0006-assets-and-inventory.md) and [ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md). [ADR-0003](../../docs/adr/0003-three-role-model.md) is superseded.
- **Requirements withdrawn**, not merely edited: FR-012 (owning Employee confirms receipt) is replaced by FR-012a, which forbids a confirm-receipt action anywhere. FR-009a's "A reason is optional" is withdrawn. The invented **Request Cancelled** email copy from the 2026-09-15 amendment is withdrawn — cancellation sends `Status changed`. Spec 002's D5 reading of `Ready for Pickup` / `For Delivery` as mere labels on `Released` is superseded.
- **Out of Scope gains two entries**: the per-unit asset register the file draws (serial numbers, assignment, purchase details, BitLocker escrow) and the `Action required` request-for-information flow. Both have design and no buildable spec; constitution VIII forbids building them and requires that the MVP's shapes not foreclose the register.
- **Three items are contract conflicts, not UI choices**, and are open with the backend team: `RESERVED / PENDING` as a real quantity; `Ortigas` (file) vs `Pasig` (published `CreateAssetDto`); and `location` / `quantity` / `lowQtyAlert` leaving the asset form for the Update stock panel. Constitution VII forbids the SPA papering over any of them. Recorded in [contracts/README.md](contracts/README.md) and [drift §10](../../docs/design-system/drift-2026-09-22.md).
- **What this gives up, recorded so it is a decision and not a surprise**: nobody confirms receipt, so the system records handover on the word of the person who handed over; and one Admin can approve a request and release its stock, which is the separation of duty ADR-0003 existed to protect. Both are named in the ADRs.
- **Ten open questions remain with the designer**, including two competing `03 - Inventory` frames with no winner marked, three handover labels for two states, and a request drawer that still says "Note to **Approver**". Listed in [drift §10](../../docs/design-system/drift-2026-09-22.md).

### Session 2026-09-15 — Amendment

> **Partly superseded by Session 2026-09-22.** `Cancelled` stands. The reason-is-optional-for-the-requestor resolution and the invented `Request Cancelled` email do not.

Raised by the 2026-09-15 `.fig` re-export (`docs/design-system/drift-2026-09-15.md`)
and decided by the project owner. Constitution I requires it to be recorded here
rather than applied silently.

- Q: The design file now defines a seventh request status, `Cancelled`, with a drawn cancel flow, and recolours `Completed` from green to purple. The state machine admits neither. Build them? → A: **Yes, both.** `Cancelled` is a real state, not a label.

**Scope of the amendment.**

- Constitution **2.0.0** redefines principle IV to admit `Cancelled` from `Pending Approval`, `Approved` and `For Release`, and extends principles III and V to cover its stock restore and its email. The version bump is MAJOR because a principle was redefined, not added.
- Who may cancel, and when, is settled as: the owning Employee while `Pending Approval` (reason optional); a Supply Admin on `Approved` or `For Release` when it cannot be fulfilled (reason **required**); never once `Released`. The design file says "either by the Employee (before approval) or by the Supply Admin (after approval)" and then "a reason is required when the Approver cancels" — an Approver the first sentence does not list. The resolution above keeps the two actors the file names and attaches the reason requirement to whoever is not the requestor. **Flagged to the designer.**
- Cancelling **restores inventory**, in the same transaction as the status change. The file does not say so; constitution III leaves no alternative, since stock is deducted at submit and cancelled items never leave the store.
- The `Request Cancelled` email is **invented copy**. The file defines the status but no notification, and constitution V does not allow a defined transition without one.
- `Completed` takes the purple pair the file now carries; `Cancelled` takes the file's own `Status/Cancelled` slate. See the drift document for how the tints were derived.

### Session 2026-09-12 — Amendment

Raised by `specs/003-app-shell-routing/spec.md` (D4). Constitution I requires an instruction that contradicts a resolved clarification to be recorded as an amendment rather than applied silently.

- Q: The design file's login screen offers Google sign-in only, with no credential fields. Does the MVP build email + password as previously clarified, or the screen as designed? → A: **The screen as designed.** Sign-in presents the Google control; the SPA delegates to a session boundary and implements no authentication mechanism of its own.

**Scope of the amendment.** This changes what the *SPA* renders and nothing else:

- The SPA implements no authentication mechanism. It renders the designed control and calls the session boundary for identity and role.
- Whether the backend authenticates against Google, against seeded demo users, or against something else is a **backend decision**, settled when the REST contract publishes. Seeded demo users remain permitted behind that boundary under constitution IX.
- `docs/product.md`'s "SSO / SAML / MFA" non-goal **still stands**, because this repository ships no SSO. If the backend later authenticates against Google for real, that non-goal must be revisited then, with an ADR.
- FR-001 is unchanged: the system still authenticates users and exposes exactly one role per user.

No constitution version bump is required — no principle changes.
