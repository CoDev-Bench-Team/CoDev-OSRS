# Feature Specification: Office Supplies Request System MVP

**Feature Branch**: `001-office-supplies-mvp`  
**Created**: 2026-09-11  
**Status**: Draft  
**Sources**: Linear initiative brief, process-flow diagram

## Overview

Replace Codev’s chat/email office-supplies process with a centralized system where employees request encoded stock, approvers accept or reject, supply admins prepare and release items, and the system keeps inventory and email notifications aligned with each status change.

## User Scenarios & Testing

### User Story 1 - Encode and view inventory (Priority: P1)

A Supply Admin records office-supply items and on-hand counts. Employees open the catalog and see current stock **before** they request anything. If an item is not encoded, it cannot be requested.

**Why this priority**: Inventory must exist before the pipeline can run (inventory rule 1).  
**Independent Test**: Log in as Supply Admin, add items with quantities; log in as Employee and see those quantities.  
**Acceptance Scenarios**:

1. **Given** no items exist, **When** a Supply Admin encodes item name and quantity ≥ 0, **Then** the item appears in the catalog with that quantity.
2. **Given** encoded items, **When** an Employee opens inventory, **Then** they see current on-hand quantity per item without being able to edit stock.
3. **Given** an item with quantity 0, **When** an Employee builds a request, **Then** they cannot submit a positive quantity for that item.

### User Story 2 - Submit a supply request (Priority: P1)

An Employee selects one or more encoded items, enters quantities, optionally states a purpose, and submits. The request enters **Pending Approval**. On-hand stock decreases by the requested amounts. The Employee receives a “Request Submitted” email and can see the new request in their history.

**Why this priority**: This is the entry to the automated pipeline.  
**Independent Test**: With stock encoded, submit a request and assert status, decremented stock, and submitted notification.  
**Acceptance Scenarios**:

1. **Given** item A has 10 on hand, **When** an Employee submits quantity 3, **Then** the request is `Pending Approval`, on-hand is 7, and a submitted email is recorded for the Employee.
2. **Given** item A has 2 on hand, **When** an Employee submits quantity 3, **Then** the submit is rejected, no request is created, and stock stays 2.
3. **Given** a valid form, **When** purpose is omitted, **Then** the request still submits (purpose is optional).

### User Story 3 - Approve or reject a request (Priority: P1)

An Approver reviews pending requests (items, quantities, remaining stock, purpose). They approve, or they reject with a mandatory reason. Approval leaves inventory deducted and notifies Employee and Supply Admin. Rejection restores inventory, sets status **Rejected**, and notifies the Employee. The Employee may then submit a **new** request; they do not reopen the rejected one.

**Why this priority**: Without review, fulfillment cannot start; reject is the compensating path for stock.  
**Independent Test**: Approve one pending request; reject another with a reason and confirm stock restored.  
**Acceptance Scenarios**:

1. **Given** a `Pending Approval` request, **When** an Approver approves, **Then** status is `Approved`, stock is unchanged from the post-submit value, and approved emails go to Employee and Supply Admin.
2. **Given** a `Pending Approval` request for qty 3 that deducted stock from 10 to 7, **When** an Approver rejects with reason “Not needed”, **Then** status is `Rejected`, on-hand is 10, the reason is stored and shown to the Employee, and a rejected email is sent to the Employee.
3. **Given** a pending request, **When** an Approver tries to reject with an empty reason, **Then** the system refuses and status stays `Pending Approval`.

### User Story 4 - Prepare and release items (Priority: P1)

A Supply Admin sees approved requests, prepares them (pick/pack), marks **For Release**, then hands items over and marks **Released** with a pickup/handover location. The Employee is notified that items are ready / released. Inventory does not change.

**Why this priority**: Required for the MVP demo fulfillment path.  
**Independent Test**: Move an approved request to For Release then Released; assert emails and unchanged stock.  
**Acceptance Scenarios**:

1. **Given** an `Approved` request, **When** a Supply Admin marks it prepared, **Then** status is `For Release` and stock is unchanged.
2. **Given** a `For Release` request, **When** a Supply Admin releases with location “GS Counter”, **Then** status is `Released`, location is stored, and the Employee receives the ready-for-pickup email.
3. **Given** a `Pending Approval` request, **When** a Supply Admin attempts prepare or release, **Then** the system refuses.

### User Story 5 - Confirm receipt and complete (Priority: P1)

The requesting Employee confirms they received the items. Status becomes **Completed**. Employee and Approver receive a completed email. Inventory does not change.

**Why this priority**: Closes the documented pipeline.  
**Independent Test**: Confirm a released request as the owning Employee; other roles cannot confirm.  
**Acceptance Scenarios**:

1. **Given** a `Released` request owned by Employee E, **When** E confirms receipt, **Then** status is `Completed`, stock is unchanged, and completed emails go to E and the Approver.
2. **Given** a `Released` request owned by E, **When** a different Employee or an Approver tries to confirm, **Then** the system refuses.

### User Story 6 - Track status and history (Priority: P2)

An Employee sees real-time status and a history of their requests (including rejected and completed). Approvers see the pending queue. Supply Admins see approved / for-release work.

**Why this priority**: Reduces “where is my request?” traffic; slightly less blocking than the mutation path.  
**Independent Test**: After several transitions, lists and detail views show the current status and timestamps.  
**Acceptance Scenarios**:

1. **Given** an Employee with past requests in mixed statuses, **When** they open history, **Then** each request shows id, items, status, and last update.
2. **Given** pending requests exist, **When** an Approver opens their queue, **Then** they see those requests and not other roles’ fulfillment-only screens as their primary work list.

### Edge Cases

- Concurrent submits for the last remaining unit: only one request is created; the other receives a clear insufficient-stock outcome.
- Request with multiple lines: all lines succeed or the whole submit rolls back (no partial deduct).
- Inactive or deleted-looking items: employees cannot submit them (MVP: Supply Admin can mark an item inactive).
- Actor uses the wrong role’s action (Employee approve, Approver release): refused.
- Duplicate confirm on an already completed request: refused, status stays `Completed`.
- Email delivery fails after a valid transition: request status remains; failure is recorded for that notification.

## Requirements

### Functional Requirements

- **FR-001**: System MUST authenticate users and expose exactly one role per user: Employee, Approver, or Supply Admin.
- **FR-002**: System MUST allow Supply Admins to encode and update inventory items (name, on-hand quantity, active flag).
- **FR-003**: System MUST display current on-hand quantity per active item to authenticated users before request submit.
- **FR-004**: System MUST allow Employees to submit a request with one or more line items, quantity ≥ 1 per line, and optional purpose.
- **FR-005**: System MUST reject submit when any line exceeds current on-hand quantity or references an inactive/missing item.
- **FR-006**: System MUST, on successful submit, create the request in `Pending Approval` and decrement on-hand quantity by each line quantity in one atomic operation.
- **FR-007**: System MUST allow Approvers to approve a `Pending Approval` request, moving it to `Approved` without changing inventory.
- **FR-008**: System MUST allow Approvers to reject a `Pending Approval` request only when a non-empty reason is provided, moving it to `Rejected` and incrementing on-hand by the request’s line quantities in one atomic operation.
- **FR-009**: System MUST NOT reopen a rejected request; the Employee MUST create a new request if they still need items.
- **FR-010**: System MUST allow Supply Admins to move `Approved` requests to `For Release` (prepare) without changing inventory.
- **FR-011**: System MUST allow Supply Admins to move `For Release` requests to `Released`, recording a pickup/handover location, without changing inventory.
- **FR-012**: System MUST allow the owning Employee to move `Released` requests to `Completed` (confirm receipt) without changing inventory.
- **FR-013**: System MUST refuse illegal status transitions and actions not allowed for the caller’s role.
- **FR-014**: System MUST send email notifications: Submitted (Employee); Approved (Employee, Supply Admin); Rejected (Employee); Ready for Pickup/Released (Employee); Completed (Employee, Approver), using the subjects and body facts in `docs/process-flow.md`.
- **FR-015**: System MUST persist notification attempts (sent or failed) tied to the request and type.
- **FR-016**: System MUST show Employees their request history and current status; Approvers a pending queue; Supply Admins a fulfillment queue (`Approved` and `For Release`).
- **FR-017**: System MUST never persist negative on-hand quantity.

### Key Entities

- **User**: Authenticated person with name, email, and a single role.
- **Inventory item**: Named supply with on-hand quantity and active flag; must exist before it can be requested.
- **Request**: Header with requestor, status, optional purpose, optional rejection reason, optional release location, and timestamps per transition.
- **Request line**: Item + quantity captured at submit (quantity does not change after submit).
- **Notification log**: Type, recipients, request id, payload facts, send outcome.

## Assumptions

- Internal Codev use only; demo uses seeded users (one per role).
- Any Approver may act on any pending request; any Supply Admin may fulfill any approved request.
- Pickup location is entered at release (Supply Admin), matching the “[Location]” placeholder in the ready-for-pickup email.
- “Real-time status” means the UI shows API state after refresh or after a successful mutation, not a live websocket (unless later specified).
- A notification is emitted and recorded on each defined transition. Delivery transport is an API concern (inbox, SMTP, or logged stub).

## Out of Scope

- Vendor purchasing, budgets, cost allocation
- SSO, MFA, password reset productization beyond a working login
- Native mobile clients
- Multi-level approval, delegation, or out-of-office routing
- Creating requests from email or chat
- Automatic cancel of stale pending requests
- Separate reserved-vs-on-hand stock columns

## Success Criteria

### Measurable Outcomes

- **SC-001**: A tester can complete the documented happy path (encode → request → approve → prepare → release → confirm) in one sitting using only the UI, ending in `Completed` with stock reduced by the requested quantity and not restored.
- **SC-002**: A tester can complete the reject path and observe stock restored to the pre-submit quantity, plus a visible rejection reason, then submit a new request for the same items.
- **SC-003**: For each of the five notification types, a test run produces a recorded notification to the specified recipients with request id and item facts.
- **SC-004**: Concurrent attempts to request more than remaining stock result in at most one successful deduct; on-hand is never negative.
- **SC-005**: A user in one role cannot complete another role’s pipeline action through the UI or API.
- **SC-006**: QA can re-run SC-001 and SC-002 via Playwright as a regression check before the MVP demo.

## Clarifications

### Session 2026-09-11

Resolved from the Linear brief and process diagram with MVP defaults (no blocking product questions remaining):

- Q: Combined Admin vs split roles? → A: Approver and Supply Admin are distinct (diagram + Linear note).
- Q: When does inventory move? → A: Decrement on submit; increment on reject; unchanged thereafter.
- Q: Resubmit after reject? → A: New request, not reopen.
- Q: Who can approve? → A: Any user with Approver role (small internal team).
- Q: Auth for MVP? → A: ~~Username/password (email + password) with seeded demo users; SSO later.~~ **Superseded 2026-09-12 — see Session 2026-09-12 below.**

### Session 2026-09-12 — Amendment

Raised by `specs/003-app-shell-routing/spec.md` (D4). Constitution I requires an instruction that contradicts a resolved clarification to be recorded as an amendment rather than applied silently.

- Q: The design file's login screen offers Google sign-in only, with no credential fields. Does the MVP build email + password as previously clarified, or the screen as designed? → A: **The screen as designed.** Sign-in presents the Google control; the SPA delegates to a session boundary and implements no authentication mechanism of its own.

**Scope of the amendment.** This changes what the *SPA* renders and nothing else:

- The SPA implements no authentication mechanism. It renders the designed control and calls the session boundary for identity and role.
- Whether the backend authenticates against Google, against seeded demo users, or against something else is a **backend decision**, settled when the REST contract publishes. Seeded demo users remain permitted behind that boundary under constitution IX.
- `docs/product.md`'s "SSO / SAML / MFA" non-goal **still stands**, because this repository ships no SSO. If the backend later authenticates against Google for real, that non-goal must be revisited then, with an ADR.
- FR-001 is unchanged: the system still authenticates users and exposes exactly one role per user.

No constitution version bump is required — no principle changes.
