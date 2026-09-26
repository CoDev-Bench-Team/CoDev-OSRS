# Feature Specification: Employee Request Panel + Cancel

**Feature Branch**: `ruben/ben-45-p2spa-request-detail-employee-panel-cancel`  
**Created**: 2026-09-23  
**Status**: Draft  
**Sources**: BEN-45, BEN-65, constitution 3.0.0, `specs/001-office-supplies-mvp/spec.md`, `specs/003-app-shell-routing/spec.md` (Session 2026-09-23), [ADR-0005](../../docs/adr/0005-two-role-model.md), [ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md), Figma *Mockups* frames `04 - My Requests`, `04.1 - My Requests - View Request`, `04.2- My Requests - Cancel Request`, `04.2- My Requests - Cancelled`, component `Status Timeline`

> **Realigned 2026-09-24 to constitution 3.0.0 (BEN-114).** Written against
> three roles and `For Release` / `Released`. Rebased onto BEN-114: the Admin is
> the only other role, `For Delivery` / `For Pickup` are states (named
> `For Delivery` / `Ready for Pickup` since constitution 3.0.1), and this
> branch's own ADR-0007 is dropped in favour of `dev`'s, which records the same
> decision (the Admin completes; no confirm-receipt).

## Overview

Give an Employee a read-back of one of their own requests without leaving My Requests. *View details* on a row opens a side panel with the request's items, note and status timeline. The panel offers one action, **Cancel Request**, and only while the request is `Pending Approval`. The Employee has no confirm-receipt step: an Admin completes a request (ADR-0007).

This feature does not own the My Requests list (BEN-44), the Admin review panel (BEN-47), or any backend behaviour. The product rules it relies on were settled by the 2026-09-23 amendments to specs 001 and 003. This spec cites them rather than restating them.

## User Stories

### Story 1 — Read back a request (Priority: P1)

An Employee opens one of their requests from My Requests and sees what they asked for and where it is.

**Why this priority**: "Where is my request?" is the question the product exists to answer (spec 001 US6).

**Acceptance Criteria**:

1. **Given** an Employee on `/requests`, **When** they activate *View details* on a row, **Then** a side panel opens over the page showing the request id, its status pill, the Items Requested table, the Note to Approver when one exists, and the status timeline.
2. **Given** the panel is open, **When** the Employee activates ✕, presses Esc, or clicks the scrim, **Then** the panel closes, focus returns to that row's *View details*, and the address is still `/requests`.
3. **Given** a `Cancelled` or `Rejected` request, **When** the panel renders, **Then** it reads back the stored reason under *Reason for cancellation* or *Reason for rejection*. No other state shows a reason.
4. **Given** a request in any of the seven states, **When** the panel renders its timeline, **Then** the nodes follow the mapping in `plan.md` (D5): the forward states fill Submitted → Approved → handover → Complete in order, and `Cancelled` or `Rejected` collapses the timeline to Submitted and that ending.

### Story 2 — Cancel a pending request (Priority: P1)

An Employee stops their own request before anyone has decided on it, and says why.

**Why this priority**: This is the Employee's only action on their own request (spec 001 FR-009a).

**Acceptance Criteria**:

1. **Given** the panel for a `Pending Approval` request, **When** it renders, **Then** it shows **Cancel Request**. For every other status it shows no action.
2. **Given** the Employee activates Cancel Request, **When** the form opens, **Then** it asks for a required *Reason for cancellation* and offers **Cancel** (back out) and **Confirm Cancellation**.
3. **Given** the reason is empty or only whitespace, **When** the Employee confirms, **Then** the form shows its invalid state with a message saying why, nothing is sent, and the status does not change.
4. **Given** a non-empty reason, **When** the Employee confirms, **Then** the panel's pill and timeline show `Cancelled`, the panel reads the reason back under *Reason for cancellation*, and the row's pill on My Requests shows `Cancelled` too.
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
- A request not yet handed over. The handover node reads the drawn *For Delivery/For Pickup*, pending.
- The Employee backs out of the cancel form. The reason is cleared and the invalid state is reset.

## Functional Requirements

- **FR-001**: The panel MUST open from *View details* on a My Requests row and MUST close without changing the address.
- **FR-002**: The panel MUST close on ✕, Esc and a scrim click. It MUST hold focus while open and return focus to the control that opened it.
- **FR-003**: The panel MUST show the request id, status pill, Items Requested (description and quantity per line), Note to Approver when present, and the status timeline.
- **FR-003a**: A `Cancelled` request MUST read back its reason under *Reason for cancellation*, and a `Rejected` request under *Reason for rejection*.
- **FR-004**: The timeline MUST map the seven states onto the drawn nodes as `plan.md` D5 specifies. The handover node MUST name the state the request took, `For Delivery` or `Ready for Pickup` (constitution 3.0.1).
- **FR-005**: Cancel Request MUST appear only when the status is `Pending Approval`.
- **FR-006**: Confirm Cancellation MUST refuse a reason that is empty after trimming, without calling the source.
- **FR-007**: A successful cancel MUST update the panel and the list row to `Cancelled`.
- **FR-008**: A refused cancel MUST say that the request changed and show its current status.
- **FR-009**: The panel MUST NOT offer a confirm-receipt or completion control in any state (spec 001 FR-012a).
- **FR-010**: The Employee MUST NOT have a `/requests/:id` destination. The Admin keeps it until BEN-47 (spec 003, amended 2026-09-23).
- **FR-011**: The page MUST show distinct loading, empty and failure states.
- **FR-012**: The panel and list MUST compose shared UI from `src/shared/ui` only.
- **FR-013**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes. Until the backend contract publishes, data MAY come from a typed, seeded, in-memory source behind an interface, as spec 004 FR-018 allows for the approval queue.
- **FR-014**: Releasing the reservation and the `Status changed` email are the API's (constitution III and V). The SPA MUST NOT model inventory for them.

## Key Entities

- **Employee request**: The Employee's own view of one request. Id, submitted time, lines, optional note, status, the handover state it took (kept once `Completed`), a timestamp per reached transition, and the reason and time when rejected or cancelled. It is a read model, not an API shape.
- **Request line**: A short name for the list summary, a description for the panel, and a quantity.
- **Cancel result**: Either the updated request, or a refusal: `status-changed`, `reason-required` or `unavailable`.
- **Timeline node**: A label, a state (reached, pending, cancelled, rejected) and a time.

## Out of Scope

- The real My Requests list, filters and pagination (BEN-44). This feature ships a minimal stand-in so the panel has somewhere to open from; BEN-44 replaces it.
- Approve, reject, prepare, release, complete and Admin cancel (BEN-47).
- Real API integration, stock restore, and the Request Cancelled email.

## Success Criteria

- **SC-001**: An Employee can open any of their requests from My Requests and close it again without the address changing.
- **SC-002**: Cancel Request is offered on exactly the `Pending Approval` rows of the seeded data set.
- **SC-003**: An empty or whitespace-only reason never changes a request's status.
- **SC-004**: A valid cancel shows `Cancelled` in the panel pill, the timeline and the row pill, and reads the reason back.
- **SC-005**: No state offers a confirm-receipt control.
- **SC-006**: An Employee on `/requests/:id` gets the same refusal for an owned, unowned and missing id.
- **SC-007**: `npm run verify` proves SC-001 to SC-006 through `scripts/check-request-detail.mjs` and `scripts/check-shell.mjs`.

## Clarifications

### Session 2026-09-25 — Amendment (from spec 008, BEN-43)

Raised by spec 008, which reuses this panel's read-back for the Request List's
confirmation. Recorded here because it changes what this panel draws.
Constitution I requires the change to cite its diff:
[drift-2026-09-24 §10](../../docs/design-system/drift-2026-09-24.md) and
[additions.md §3f](../../docs/design-system/additions.md).

- Q: The read-back (Items Requested, Note to Approver, the stopped reason, Status) is now one shared piece, `RequestReadBack`, rendered by this panel and by spec 008's confirmation. Does this panel's DOM change? → A: **Not by the extraction** — that commit (`df66022`) was byte-identical. **Yes by the re-read that followed**: `04.1` and `03.1` were re-read against the file on 2026-09-25, with character overrides, and both panels now draw the result — the QTY column 50px (was 48px); *Items Requested* and *Status* headings Inter Bold 14 / 1.5 in `Ink-400`, 18px above what they head; the note and reason cards Inter Bold 15 over Inter Regular 12 in `Ink-900`, 12px apart; sections 18px apart.
- Q: The shared `StatusTimeline` changed with it. What does this panel now show? → A: Labels Inter Bold 12.5 / 1.45, dates `Label 2` in `Ink-400`; pending dots `Border-Strong`; 1px `Border` connectors running dot to dot; and a 10% halo on the step the request is **at** — the last node that is not pending, in that node's own colour, so a Cancelled or Rejected request haloes its slate or red ending rather than Submitted.
- Q: The refusal note at the top of this panel is now the shared `RefusalAlert`, also used by spec 008's drawer. Does it look or behave differently? → A: **No** — same red pair, same `role="alert"`; its message now sits in a `<p>` inside the alert rather than being the alert itself.

No requirement above changes; FR-003's content and SC-001 to SC-006 hold, and
`scripts/check-request-detail.mjs` still passes.

### Session 2026-09-23

Raised by the review of BEN-45 against the repo. Each was decided in favour of the Linear ticket, and the product specs were amended to match.

- Q: Is the Employee's cancel reason optional (spec 001, 2026-09-15) or required (the drawn asterisk)? → A: **Required**, whoever cancels. Spec 001 FR-009a and constitution 3.0.0 IV both say so.
- Q: Does the Employee confirm receipt (spec 001 FR-012)? → A: **No.** Spec 001 FR-012 gives `Completed` to the Admin and FR-012a forbids a confirm-receipt control. ADR-0007.
- Q: Does the Employee keep `/requests/:id`? → A: **No.** Their detail is a panel on `/requests`. The Admin keeps the address until BEN-47, so BEN-46's Review links still work.
- Q: BEN-44 (My Requests) has not shipped. Where does *View details* live? → A: In a minimal stand-in table under `src/features/requests/history/`, the folder the epic guide gives BEN-44, which replaces it.
- Q: Should the open panel be part of the address? → A: **No.** It is component state. The ticket says the panel "closes without navigating", and the Employee has no record address.
- Q: The `04.2 - Cancelled` frame does not show the cancel reason, but BEN-67 and BEN-70 ask for it to be read back. Which wins? → A: **Linear.** The panel reads back the cancel or rejection reason (FR-003a), in the Note to Approver card style. Flagged to the designer.
- Q: The frame gives REQ-2026-1842 to two rows. → A: The seed gives the For Delivery row REQ-2026-1838. Flagged to the designer.

## Validation

- Completeness: PASS
- Clarity: PASS
- Consistency: PASS. Agrees with specs 001 and 003 as amended on 2026-09-23.
- Measurability: PASS
- Coverage: PASS
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
