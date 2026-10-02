# Feature Specification: MVP pipeline and routing regression

**Created**: 2026-10-02
**Status**: Draft
**Source**: BEN-50 — Playwright coverage for the MVP pipeline and for routing

## Overview

QA must be able to re-run the office-supplies demo through the signed-in screens before the MVP is shown: the happy path, the reject path, the cancel paths, and refusals when someone opens a destination their role may not use.

The checks follow the current request process. An Admin, or the owning Employee, marks a handed-over request `Received`, which is when the reserved units leave the store. The owning Employee then signs the Accountability Form. An Admin sets `Completed` only after that signature. `For Delivery` and `Ready for Pickup` are peers. Completion does not change stock.

This feature proves behavior the product already specifies. It does not add a request status, a role, or a stock rule.

## User Stories

### Story 1 — Happy path through pickup to completion (Priority: P1)

An Admin encodes a requestable asset and adds 10 available units at Davao. An Employee whose office is Davao submits a quantity of 3. An Admin approves it, sets `Ready for Pickup` with a pickup location, and marks it `Received`. The Employee signs the Accountability Form. The Admin then completes the request.

**Why this priority**: This is the demo path. If it cannot be repeated through the screens, the MVP is not demonstrable.

**Acceptance Criteria**:

1. **Given** no matching stock, **When** an Admin encodes an asset and adds 10 available units at Davao, **Then** that office shows Total 10 / Available 10 / Reserved 0.
2. **Given** that stock, **When** the Davao Employee submits quantity 3, **Then** the new request is `Pending Approval` and the office shows Total 10 / Available 7 / Reserved 3.
3. **Given** that pending request, **When** an Admin approves it, **Then** the status is `Approved` and the three counts are unchanged.
4. **Given** that approved request, **When** an Admin sets `Ready for Pickup` with a pickup location, **Then** the status is `Ready for Pickup`, the location is visible on the request, and the three counts are unchanged.
5. **Given** that pickup request for quantity 3, **When** an Admin marks it `Received`, **Then** the status is `Received` and the office shows Total 7 / Available 7 / Reserved 0.
6. **Given** that `Received` request, **When** the owning Employee signs the Accountability Form, **Then** the acknowledgement is recorded, the status stays `Received`, and the three counts are unchanged.
7. **Given** that signed request, **When** an Admin completes it, **Then** the status is `Completed` and the three counts stay Total 7 / Available 7 / Reserved 0.
8. **Given** any checkpoint in this path, **When** the counts are read, **Then** Total equals Available plus Reserved and none of the three is negative.

### Story 2 — Reject path releases the reservation (Priority: P1)

An Employee submits quantity 3 against 10 available units. An Admin rejects the request with a reason. The reservation returns to available stock, the Employee can see the reason, and the Employee can submit a new request for the same asset. The rejected request stays rejected.

**Why this priority**: Rejection is the compensating path that puts reserved units back. A demo that only shows approval hides a stock bug.

**Acceptance Criteria**:

1. **Given** a `Pending Approval` request for quantity 3 that moved Available 10 to 7, **When** an Admin rejects it with a non-empty reason, **Then** the status is `Rejected`, the office shows Available 10 / Reserved 0, and Total is unchanged.
2. **Given** that rejected request, **When** the owning Employee opens it, **Then** the rejection reason is visible.
3. **Given** a pending request, **When** an Admin tries to reject it with an empty reason, **Then** the request stays `Pending Approval` and the counts are unchanged.
4. **Given** a rejected request, **When** the Employee still needs the items, **Then** they submit a new request, and the rejected request is not reopened.

### Story 3 — Cancel paths require a reason and release the reservation (Priority: P1)

The owning Employee can stop their own request while it is `Pending Approval`. An Admin can stop an `Approved` request, or a `Ready for Pickup` request, that cannot be fulfilled. Each cancellation requires a reason. Each one releases the reservation. An empty reason does nothing.

**Why this priority**: Cancellation is a different act from rejection, and both legal cancelers must be shown. An empty reason must not release stock.

**Acceptance Criteria**:

1. **Given** the Employee's own `Pending Approval` request for quantity 3, **When** they confirm cancellation with a non-empty reason, **Then** the status is `Cancelled`, the reservation is released, and Total is unchanged.
2. **Given** an `Approved` request whose units are still reserved, **When** an Admin confirms cancellation with a non-empty reason, **Then** the status is `Cancelled` and the reservation is released.
3. **Given** a `Ready for Pickup` request whose units are still reserved, **When** an Admin confirms cancellation with a non-empty reason, **Then** the status is `Cancelled` and the reservation is released.
4. **Given** either cancel dialog, **When** the reason is empty, **Then** confirmation is refused and the status and counts are unchanged.
5. **Given** an `Approved` request, **When** the owning Employee tries to cancel it, **Then** the system refuses and the reservation stays.
6. **Given** a `Cancelled` request, **When** the Employee still needs the items, **Then** they submit a new request, and the cancelled request is not reopened.

### Story 4 — Direct-address refusals follow the role (Priority: P1)

A signed-in person who types a destination their role may not use is refused. Guessing an address is not a way around the navigation. A refusal explains itself and offers a way back to a screen that role may use. It is distinguishable from an address that matches nothing.

**Why this priority**: The pipeline checks assume each person can only take their own steps. Routing refusals are how that is proven without depending on a hidden control.

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** they open Requests Queue, Assets, Inventory, or History directly, **Then** each destination is refused, no forbidden controls are shown, and a way back to a permitted screen is offered.
2. **Given** a signed-in Admin, **When** they open My Requests directly, **Then** access is refused, with an explanation and a way back.
3. **Given** a signed-in Admin, **When** they open Catalog directly, **Then** the catalog is shown and the action that starts a request is not offered.
4. **Given** a signed-in Employee, **When** they open Catalog or My Requests directly, **Then** those destinations are shown.
5. **Given** either role, **When** they open Profile from the account cluster, **Then** their own profile is shown.
6. **Given** a signed-in user, **When** they open an address that matches no destination, **Then** they see a not-found screen inside the shell, distinguishable from a refusal, with a way back to their landing screen.
7. **Given** a signed-out visitor, **When** they open a protected destination, **Then** the sign-in screen renders and that destination's contents do not.
8. **Given** a signed-out visitor who asked for a protected destination, **When** they sign in and their role permits it, **Then** they arrive at that destination.
9. **Given** a signed-out visitor who asked for a protected destination, **When** they sign in and their role does not permit it, **Then** the destination is refused, with an explanation and a way back to a screen their role may use.
10. **Given** an Employee, **When** they look for approve, reject, update-status, or complete, **Then** those actions are not available to them.
11. **Given** an Admin, **When** they try to sign an Employee's Accountability Form, **Then** the system refuses.

### Story 5 — Delivery is a peer, and it cannot be cancelled (Priority: P2)

An Admin can hand an approved request over as `For Delivery` instead of `Ready for Pickup`. Quantities do not change. A `For Delivery` request cannot be cancelled. The Admin may move it to `Ready for Pickup` first, and may then cancel that pickup request.

**Why this priority**: The pickup happy path does not prove the peer status or the rule that items already out for delivery are not released back to available stock.

**Acceptance Criteria**:

1. **Given** an `Approved` request, **When** an Admin sets `For Delivery`, **Then** the status is `For Delivery` and the three counts are unchanged.
2. **Given** a `For Delivery` request, **When** an Admin tries to cancel it, **Then** the system refuses and the reservation stays.
3. **Given** a `For Delivery` request, **When** an Admin sets `Ready for Pickup` with a location, **Then** the change is allowed and the counts stay unchanged.
4. **Given** a `Pending Approval` request, **When** an Admin tries to set `For Delivery` or `Ready for Pickup`, **Then** the system refuses.

### Story 6 — The owning Employee can mark their own handover received (Priority: P2)

After handover, the owning Employee can mark their own request `Received`. The stock movement matches an Admin marking it received. Another Employee cannot mark it, and the request cannot be marked received before it has been handed over.

**Why this priority**: The happy path already covers the Admin. This story proves the Employee is also allowed, and only on their own handed-over request.

**Acceptance Criteria**:

1. **Given** the Employee's own `For Delivery` or `Ready for Pickup` request for quantity 3 at Total 10 / Available 7 / Reserved 3, **When** they mark it received and confirm, **Then** the status is `Received` and the office shows Total 7 / Available 7 / Reserved 0.
2. **Given** another Employee's handed-over request, **When** an Employee tries to mark it received, **Then** the system refuses.
3. **Given** an `Approved` request, **When** an Admin tries to mark it `Received`, **Then** the system refuses.
4. **Given** a `Received` request that has not been signed, **When** an Admin tries to complete it, **Then** the system refuses and the status stays `Received`.
5. **Given** a signed `Received` request, **When** someone other than the owning Employee tries to sign it again, **Then** the system refuses and the original acknowledgement remains.

### Story 7 — Each transition leaves the notification the product records (Priority: P2)

Where the product exposes a notification record, every transition the suite performs leaves the matching template: Request received on submit, Request approved on approve, Request declined on reject, and Status changed for handover, receipt, cancellation, and completion. Status changed carries the previous status and the new status, and the pickup location when the new status is `Ready for Pickup`. When the owning Employee cancels, that Status changed record is for the Employee and for the Admin queue. If the product exposes no record for that transition, the run reports the gap. The suite does not invent a mailbox, and it does not fail solely because no inbox screen exists.

**Why this priority**: A status change with no notification is a defect. It is less blocking than the visible pipeline because mail is recorded by the product rather than acted on in these screens.

**Acceptance Criteria**:

1. **Given** a successful submit, approval, or rejection, **When** the product exposes the notification record, **Then** that record uses Request received, Request approved, or Request declined, names the request, and is for the Employee.
2. **Given** a move to `For Delivery`, `Ready for Pickup`, `Received`, `Completed`, or `Cancelled`, **When** the product exposes the notification record, **Then** that record is Status changed and carries the previous status and the new status.
3. **Given** a move to `Ready for Pickup` with a location, **When** the product exposes the notification record, **Then** it carries that pickup location.
4. **Given** the Employee signs the Accountability Form, **When** the acknowledgement is stored, **Then** no status-change notification is required, because signing is not a status change.
5. **Given** a transition whose notification record the product does not expose, **When** the suite finishes that transition, **Then** the run reports the gap and does not invent a mailbox or an inbox screen.
6. **Given** the owning Employee cancels a `Pending Approval` request, **When** the product exposes the notification record, **Then** Status changed is recorded for the Employee and for the Admin queue, with the previous status and `Cancelled`.

### Edge Cases

- What happens when Complete is attempted before the Accountability Form is signed? The request stays `Received` and stock is unchanged.
- What happens when an Employee tries to cancel an `Approved`, `For Delivery`, `Received`, or `Completed` request? The system refuses and the reservation is unchanged.
- What happens when an Admin tries to cancel a `For Delivery`, `Received`, `Completed`, `Rejected`, or already `Cancelled` request? The system refuses.
- What happens when reject or cancel is confirmed with an empty reason? The status and the three counts stay as they were.
- What happens when the same request is completed twice, or the form is signed twice? The second attempt is refused.
- What happens when `Received` is set before handover? The system refuses and no units are assigned.
- How does the suite handle a failed notification after a valid transition? The request status remains the new status. Where the product exposes the notification record, the failure is visible on that record. Where it exposes nothing, the run reports the gap.
- What happens when two checks read stock after the same step? Total equals Available plus Reserved, and no count is negative.
- What happens when a signed-in person opens another person's request by guessing an identifier they may not see? The response does not reveal whether that request exists.
- What happens when the Employee never signs? The request stays `Received`, the units stay assigned, and the Admin cannot complete it.

## Functional Requirements

- **FR-001**: The suite MUST run as two signed-in people only: one Employee and one Admin. It MUST NOT introduce a third role.
- **FR-002**: The suite MUST perform every pipeline action through the signed-in screens a person would use. Opening an address directly is reserved for the routing refusals and for reaching a destination that role is allowed to open.
- **FR-003**: The suite MUST use per-office stock. The documented quantities are 10 available units at Davao, the Employee's home office, and a request quantity of 3.
- **FR-004**: On submit, the suite MUST observe Available decrease by the quantity and Reserved increase by the same quantity, with Total unchanged, in the same outcome as the status becoming `Pending Approval`.
- **FR-005**: On reject and on every legal cancel, the suite MUST observe the reservation released in the same outcome as the terminal status, with Total unchanged.
- **FR-006**: On `Received`, the suite MUST observe Total and Reserved decrease by the requested quantity, because the reserved units are assigned to the requester. Available stays as it was after submit.
- **FR-007**: The suite MUST observe no stock change on approve, on `For Delivery`, on `Ready for Pickup`, on signing the Accountability Form, or on `Completed`.
- **FR-008**: The suite MUST observe `Total = Available + Reserved` after every checkpoint, and MUST fail if any of the three is negative.
- **FR-009**: The suite MUST require a non-empty reason for reject and for both cancelers, and MUST observe that an empty reason leaves status and stock unchanged.
- **FR-010**: The suite MUST observe that `Completed` is possible only from a `Received` request whose Accountability Form is signed, and only by an Admin.
- **FR-011**: The suite MUST observe that only the owning Employee can sign, that signing does not change status or stock, and that a request is signed once.
- **FR-012**: The suite MUST observe that an Admin or the owning Employee can set `Received` from `For Delivery` or `Ready for Pickup`, and that no other actor can.
- **FR-013**: The suite MUST observe that a `For Delivery` request cannot be cancelled, and that an Admin may move it to `Ready for Pickup` and then cancel that pickup request with a reason.
- **FR-014**: The suite MUST refuse, by direct address, every destination outside the signed-in role: Employee — Requests Queue, Assets, Inventory, History; Admin — My Requests. Catalog MAY open for an Admin and MUST NOT offer the action that starts a request.
- **FR-015**: A refusal MUST show an explanation and a way back to a permitted screen. An unknown address MUST show a not-found screen that a tester can tell apart from a refusal.
- **FR-015a**: A signed-out visitor who opens a protected destination MUST see the sign-in screen. After a successful sign-in, the suite MUST observe that a permitted role arrives at the destination they asked for, and that a role which may not use it is refused with an explanation and a way back.
- **FR-016**: Where the product exposes a notification record, the suite MUST observe the matching template for each defined transition it performs: Request received, Request approved, Request declined, and Status changed. Status changed MUST include the previous status and the new status, plus the pickup location when the new status is `Ready for Pickup`. When the owning Employee cancels, Status changed MUST be recorded for the Employee and for the Admin queue. Where the product exposes no record, the run MUST report the gap and MUST NOT invent a mailbox or an inbox screen.
- **FR-017**: The suite MUST NOT require a notification for signing the Accountability Form.
- **FR-018**: The suite MUST be re-runnable on demand before the MVP demo. A failed run MUST be visible to the people reviewing the change.
- **FR-019**: The suite MUST NOT change product rules. A check that cannot be completed because the product does not expose the outcome MUST be reported as a gap, not satisfied by inventing a screen, a status, or a stock figure.

## Out of Scope

- Concurrent submits for the last remaining unit.
- The Welcome template and the Action required template.
- Vendor purchasing, budgets, SSO, native mobile, and multi-level approval.
- Proving mail delivery to an external inbox. The suite checks a notification record only where the product exposes one.
- BitLocker identifiers and recovery secrets.
- Changing request statuses, stock rules, or who may act. Those stay as already specified for the MVP.
- A third human role.

## Success Criteria

- **SC-001**: A tester can complete encode asset → add 10 Davao units → submit 3 → approve → Ready for Pickup with a location → Admin marks Received → Employee signs → Admin completes, through the screens in one sitting, ending `Completed` with Total 7 / Available 7 / Reserved 0.
- **SC-002**: A tester can reject that submit, see Available return to 10 and the reason on the Employee's request, and submit a new request for the same asset.
- **SC-003**: A tester can cancel as the Employee from `Pending Approval` and as the Admin from `Approved` and from `Ready for Pickup`. Each release restores the reservation only when a reason is present.
- **SC-004**: For each role, every destination outside its authorization is refused when opened directly, with an explanation and a working way back. An unknown address is visibly not the same outcome. A signed-out visitor who opens a protected destination sees sign-in, arrives there after sign-in when the role permits it, and is refused when the role does not.
- **SC-005**: A tester cannot complete a request before the Accountability Form is signed, and cannot cancel a `For Delivery` request.
- **SC-006**: After every checkpoint in SC-001, SC-002, and SC-003, Total equals Available plus Reserved and no count is negative.
- **SC-007**: Where the product exposes a notification record, each transition in the suite matches its template, and Status changed shows the previous status and the new status. An Employee cancellation also records Status changed for the Admin queue. Where the product exposes nothing, the run reports that gap and does not invent a mailbox.
- **SC-008**: QA can re-run the suite on demand, and a failure is visible before the change is accepted for the demo.

## Clarifications

### Session 2026-10-02

- Q: Where should the suite look for the four transactional templates? → A: Assert a recorded notification only where the product exposes one. If nothing is exposed, report the gap. Do not invent a mailbox.
- Q: What does a signed-out visitor see when they open a protected destination, and where do they land after sign-in? → A: They see the sign-in screen. After sign-in, a permitted role arrives at the destination they asked for. A role that may not use it is refused, with an explanation and a way back.
- Q: Who receives Status changed when the Employee cancels? → A: The Employee and the Admin queue, where the product exposes the record.
- Q: The suite named Cebu, and the seeded Employee's home office is Davao. Where do the 10 units sit? → A: Davao, Maya Santos's home office. The quantities stay 10 available and a request of 3. Her office is not changed.
