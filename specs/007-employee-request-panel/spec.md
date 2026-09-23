# Feature Specification: Employee Request Panel + Cancel

**Feature Branch**: `ruben/ben-45-p2spa-request-detail-employee-panel-cancel`  
**Created**: 2026-09-23  
**Status**: Draft  
**Sources**: BEN-45, BEN-65, `specs/001-office-supplies-mvp/spec.md` (Session 2026-09-23), `specs/003-app-shell-routing/spec.md` (Session 2026-09-23), ADR-0007, Figma *Mockups* frames `04 - My Requests`, `04.1 - My Requests - View Request`, `04.2- My Requests - Cancel Request`, `04.2- My Requests - Cancelled`, component `Status Timeline`

## Overview

Give an Employee a read-back of one of their own requests without leaving My Requests. *View details* on a row opens a side panel with the request's items, note and status timeline. The panel offers one action, **Cancel Request**, and only while the request is `Pending Approval`. The Employee has no confirm-receipt step: a Supply Admin completes a request (ADR-0007).

This feature does not own the My Requests list (BEN-44), the Approver or Supply Admin review panel (BEN-47), or any backend behaviour. The product rules it relies on were settled by the 2026-09-23 amendments to specs 001 and 003. This spec cites them rather than restating them.

## User Stories

### Story 1 — Read back a request (Priority: P1)

An Employee opens one of their requests from My Requests and sees what they asked for and where it is.

**Why this priority**: "Where is my request?" is the question the product exists to answer (spec 001 US6).

**Acceptance Criteria**:

1. **Given** an Employee on `/requests`, **When** they activate *View details* on a row, **Then** a side panel opens over the page showing the request id, its status pill, the Items Requested table, the Note to Approver when one exists, and the status timeline.
2. **Given** the panel is open, **When** the Employee activates ✕, presses Esc, or clicks the scrim, **Then** the panel closes, focus returns to that row's *View details*, and the address is still `/requests`.
3. **Given** a request in any of the seven states, **When** the panel renders its timeline, **Then** the nodes follow the mapping in `plan.md` (D5): the forward states fill Submitted → Approved → handover → Complete in order, and `Cancelled` or `Rejected` collapses the timeline to Submitted and that ending.

### Story 2 — Cancel a pending request (Priority: P1)

An Employee stops their own request before anyone has decided on it, and says why.

**Why this priority**: This is the Employee's only action on their own request (spec 001 FR-009a).

**Acceptance Criteria**:

1. **Given** the panel for a `Pending Approval` request, **When** it renders, **Then** it shows **Cancel Request**. For every other status it shows no action.
2. **Given** the Employee activates Cancel Request, **When** the form opens, **Then** it asks for a required *Reason for cancellation* and offers **Cancel** (back out) and **Confirm Cancellation**.
3. **Given** the reason is empty or only whitespace, **When** the Employee confirms, **Then** the form shows its invalid state with a message saying why, nothing is sent, and the status does not change.
4. **Given** a non-empty reason, **When** the Employee confirms, **Then** the panel's pill and timeline show `Cancelled`, and the row's pill on My Requests does too.
5. **Given** the request changed while the panel was open (for example, it was approved), **When** the Employee confirms, **Then** the cancel is refused, the panel says so, and it shows the request's current status.

### Story 3 — No confirm receipt (Priority: P1)

An Employee is never offered a control to mark a request received or complete.

**Why this priority**: Spec 001 FR-012a forbids it, and adding it back requires amending that spec first.

**Acceptance Criteria**:

1. **Given** a request in any of the seven states, **When** its panel renders, **Then** no control mentions receipt, received, or completion.

## Edge Cases

- An Employee opens `/requests/:id` directly. They get the role refusal for every id, owned or not, so request ids cannot be enumerated (spec 003 FR-012a, amended 2026-09-23).
- The request list cannot be loaded. The page shows a failure notice with *Try Again*, distinct from an empty list.
- An Employee has no requests. The page says so rather than showing an empty table.
- A request has no note. The Note to Approver block is not drawn.
- A released request has no known handover route. The handover node reads the drawn *For Delivery/For Pickup*.
- The Employee backs out of the cancel form. The reason is cleared and the invalid state is reset.

## Functional Requirements

- **FR-001**: The panel MUST open from *View details* on a My Requests row and MUST close without changing the address.
- **FR-002**: The panel MUST close on ✕, Esc and a scrim click. It MUST hold focus while open and return focus to the control that opened it.
- **FR-003**: The panel MUST show the request id, status pill (with handover route when known), Items Requested (description and quantity per line), Note to Approver when present, and the status timeline.
- **FR-004**: The timeline MUST map the seven states onto the drawn nodes as `plan.md` D5 specifies. `For Release` MUST leave the handover node pending.
- **FR-005**: Cancel Request MUST appear only when the status is `Pending Approval`.
- **FR-006**: Confirm Cancellation MUST refuse a reason that is empty after trimming, without calling the source.
- **FR-007**: A successful cancel MUST update the panel and the list row to `Cancelled`.
- **FR-008**: A refused cancel MUST say that the request changed and show its current status.
- **FR-009**: The panel MUST NOT offer a confirm-receipt or completion control in any state (spec 001 FR-012a).
- **FR-010**: The Employee MUST NOT have a `/requests/:id` destination. Approver and Supply Admin keep it until BEN-47 (spec 003, amended 2026-09-23).
- **FR-011**: The page MUST show distinct loading, empty and failure states.
- **FR-012**: The panel and list MUST compose shared UI from `src/shared/ui` only.
- **FR-013**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes. Until the backend contract publishes, data MAY come from a typed, seeded, in-memory source behind an interface, as spec 004 FR-018 allows for the approval queue.
- **FR-014**: Stock restore and the Request Cancelled email are the API's (constitution III and V). The SPA MUST NOT model inventory for them.

## Key Entities

- **Employee request**: The Employee's own view of one request. Id, submitted time, lines, optional note, status, optional handover route, a timestamp per reached transition, and the cancellation reason and time when cancelled. It is a read model, not an API shape.
- **Request line**: A short name for the list summary, a description for the panel, and a quantity.
- **Cancel result**: Either the updated request, or a refusal: `status-changed`, `reason-required` or `unavailable`.
- **Timeline node**: A label, a state (reached, pending, cancelled, rejected) and a time.

## Out of Scope

- The real My Requests list, filters and pagination (BEN-44). This feature ships a minimal stand-in so the panel has somewhere to open from; BEN-44 replaces it.
- Approve, reject, prepare, release, complete and Admin cancel (BEN-47).
- Showing the cancellation reason on a cancelled request. The `04.2 - Cancelled` frame does not draw it; flagged to the designer.
- Real API integration, stock restore, and the Request Cancelled email.

## Success Criteria

- **SC-001**: An Employee can open any of their requests from My Requests and close it again without the address changing.
- **SC-002**: Cancel Request is offered on exactly the `Pending Approval` rows of the seeded data set.
- **SC-003**: An empty or whitespace-only reason never changes a request's status.
- **SC-004**: A valid cancel shows `Cancelled` in the panel pill, the timeline and the row pill.
- **SC-005**: No state offers a confirm-receipt control.
- **SC-006**: An Employee on `/requests/:id` gets the same refusal for an owned, unowned and missing id.
- **SC-007**: `npm run verify` proves SC-001 to SC-006 through `scripts/check-request-detail.mjs` and `scripts/check-shell.mjs`.

## Clarifications

### Session 2026-09-23

Raised by the review of BEN-45 against the repo. Each was decided in favour of the Linear ticket, and the product specs were amended to match.

- Q: Is the Employee's cancel reason optional (spec 001, 2026-09-15) or required (the drawn asterisk)? → A: **Required**, whoever cancels. Spec 001 FR-009a is amended. Constitution IV is amended within 3.0.0 on PR #33.
- Q: Does the Employee confirm receipt (spec 001 FR-012)? → A: **No.** FR-012 is withdrawn, FR-012a forbids the control, FR-012b has the Supply Admin complete a released request. ADR-0007.
- Q: Does the Employee keep `/requests/:id`? → A: **No.** Their detail is a panel on `/requests`. Approver and Supply Admin keep the address until BEN-47, so BEN-46's Review links still work.
- Q: BEN-44 (My Requests) has not shipped. Where does *View details* live? → A: In a minimal stand-in table under `src/features/requests/history/`, the folder the epic guide gives BEN-44, which replaces it.
- Q: Should the open panel be part of the address? → A: **No.** It is component state. The ticket says the panel "closes without navigating", and the Employee has no record address.
- Q: The frame gives REQ-2026-1842 to two rows. → A: The seed gives the For Delivery row REQ-2026-1838. Flagged to the designer.

## Validation

- Completeness: PASS
- Clarity: PASS
- Consistency: PASS. Agrees with specs 001 and 003 as amended on 2026-09-23.
- Measurability: PASS
- Coverage: PASS
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
