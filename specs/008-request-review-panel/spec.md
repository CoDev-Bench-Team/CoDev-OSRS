# Feature Specification: Request Review Panel + Admin Transitions

**Feature Branch**: `emmanuelr/ben-47-p2spa-request-review-panel-admin-transitions`  
**Created**: 2026-09-26  
**Status**: Draft  
**Sources**: BEN-47, BEN-76 (G0), BEN-77/78/79, constitution 3.0.1, `specs/001-office-supplies-mvp/spec.md` (US3–US5, FR-008–FR-014), `specs/004-approver-pending-queue/spec.md` (FR-010 seam), `specs/007-employee-request-panel/spec.md` (timeline, reason read-back), [ADR-0005](../../docs/adr/0005-two-role-model.md), [ADR-0006](../../docs/adr/0006-assets-and-inventory.md), [ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md), [drift-2026-09-22 §2–§3](../../docs/design-system/drift-2026-09-22.md), [drift-2026-09-24 §2, §5, §6](../../docs/design-system/drift-2026-09-24.md), Figma *Mockups* frames `02.2 - Requests Queue - Review`, `02.2.1 - … - Review - Approve`, `02.2.1 - … - Review - Update Status` (×2), `02.2.2- … - Review - Reject`, `02.2.2.1 - … - Review - Reject`, component `Status Timeline`

> **Gated on a constitution amendment.** The project owner decided on
> 2026-09-26 to adopt the `Received` status from
> [drift-2026-09-24 §2](../../docs/design-system/drift-2026-09-24.md) (see
> Clarifications). That redefines constitution IV and supersedes ADR-0007, so it
> is **constitution 4.0.0**. That amendment is its own change. It is **not**
> made by this spec. Stories 1–3 (read, approve, reject, hand over) do not
> depend on it. Story 4 (Complete) does, and it MUST NOT ship until the
> amendment lands.

## Overview

Give an Admin one side panel over the Requests Queue where they read a request and move it through every Admin transition: approve, reject, set `For Delivery` / `Ready for Pickup`, and complete. The panel is one surface whose body stays the same across states. Only its actions change, and they are derived from the request's status.

This feature replaces spec 004's interim hand-off (Review navigates to `/requests/:id`) with the drawn panel. It does not own the queue list (BEN-46), the Employee's panel or accountability form (BEN-45 and the amendment's follow-up), or any backend behaviour. Stock movement and email are the API's (constitution III, V). The SPA shows the result.

## User Stories

### Story 1 — Read a request in the review panel (Priority: P1)

An Admin activates **Review** on a queue row and sees the whole request without leaving the queue.

**Why this priority**: Every decision in this feature starts from this read-back. Without it, nothing else is reachable.

**Acceptance Criteria**:

1. **Given** an Admin on `/queue`, **When** they activate **Review** on a row, **Then** a side panel opens over the queue, and the address stays `/queue`.
2. **Given** the panel is open, **When** it renders, **Then** it shows the request id with its status pill, **REQUESTED BY:** (avatar, name, `email • office`), a line table `ITEM · QTY · CURRENT INVENTORY`, the **Note to Approver** when one exists, and the **STATUS** timeline.
3. **Given** a line, **When** the table renders, **Then** CURRENT INVENTORY reads as `<n> in stock`, where `<n>` is the asset's Available quantity at the request's office as the data source reports it.
4. **Given** the panel is open, **When** the Admin activates ✕, presses Esc, or clicks the scrim, **Then** the panel closes, focus returns to that row's **Review**, and the queue's chip, search, sort and page are unchanged.
5. **Given** a request in any live state, **When** the timeline renders, **Then** it follows the mapping `plan.md` defines: the forward nodes fill in order, and the handover node names the state the request took (`For Delivery` or `Ready for Pickup`) once it is reached.

### Story 2 — Approve or reject a pending request (Priority: P1)

An Admin decides on a `Pending Approval` request. They approve it, or they reject it with a required reason.

**Why this priority**: This is the review half of the pipeline (spec 001 US3). Fulfilment cannot start without it.

**Acceptance Criteria**:

1. **Given** a `Pending Approval` request, **When** the panel renders, **Then** it offers **Reject Request** and **Approve Request** under the note *"The employee will receive an email with your decision."*, and no other action.
2. **Given** the Admin activates **Approve Request**, **When** the source accepts it, **Then** the pill and timeline show `Approved` and the panel offers **Update Status**.
3. **Given** the Admin activates **Reject Request**, **When** the reason block opens in the panel, **Then** it asks for a required **Reason for rejection \*** (placeholder `e.g item on hold, insufficient justification...`) with **Cancel** and **Confirm Rejection**.
4. **Given** the reason is empty or only whitespace, **When** the Admin confirms, **Then** the block shows its invalid state with a message, nothing is sent, and the status stays `Pending Approval`.
5. **Given** a non-empty reason, **When** the source accepts it, **Then** the panel shows `Rejected`, reads the reason back under **Reason for rejection**, offers only **Close**, and the request leaves the queue.
6. **Given** the Admin activates **Cancel** in the reason block, **When** it closes, **Then** the typed reason is discarded and the pending actions return.

### Story 3 — Hand over by delivery or pickup (Priority: P1)

An Admin sets an approved request to `For Delivery` or `Ready for Pickup`, and can swap between the two before the Employee acknowledges receipt.

**Why this priority**: This is the fulfilment half (spec 001 US4), needed for the demo path.

**Acceptance Criteria**:

1. **Given** an `Approved` request, **When** the panel renders, **Then** it offers **Update Status** and no other action.
2. **Given** the Admin activates **Update Status**, **When** the form opens, **Then** it shows a required **Status \*** select offering `For Delivery` and `Ready for Pickup`, with **Cancel** and **Update Status**.
3. **Given** `Ready for Pickup` is selected, **When** the form renders, **Then** a required **Pickup location \*** select appears. It lists the offices the data source exposes, preselects the request's office, and ends with a last option, **Other…**, which reveals a required free-text field.
4. **Given** `Ready for Pickup` with no location, or **Other…** with an empty or whitespace-only text, **When** the Admin confirms, **Then** the form shows its invalid state and nothing is sent.
5. **Given** a valid choice, **When** the source accepts it, **Then** the pill and timeline show the new status, the handover node names it, and a `Ready for Pickup` request reads back its pickup location.
6. **Given** a `For Delivery` or `Ready for Pickup` request, **When** the panel renders, **Then** it offers **Update Status** only. The Status select offers the other handover state as well as the current one, because they are peers.
7. **Given** a handover state, **When** the panel renders, **Then** it does **not** offer **Complete**. Complete waits for `Received` (Story 4).

### Story 4 — Complete a received request (Priority: P1, gated)

After the Employee has acknowledged receipt (`Received`), an Admin completes the request, and that is when the stock leaves the store.

**Why this priority**: This closes the pipeline, and it is the only transition that reduces Total (ADR-0006). **Gated** on constitution 4.0.0 (see the banner).

**Acceptance Criteria**:

1. **Given** a `Received` request, **When** the panel renders, **Then** it offers **Complete** and no other action.
2. **Given** the Admin activates **Complete**, **When** the confirm step opens, **Then** it asks the Admin to confirm, with **Cancel** and **Complete**. Nothing is sent until they confirm.
3. **Given** the Admin confirms, **When** the source accepts it, **Then** the panel shows `Completed`, the timeline's last node is reached, the request leaves the queue, and every stock figure the SPA shows afterwards is the source's post-completion value (Total and Reserved lower by each line quantity; Available unchanged).
4. **Given** any status other than `Received`, **When** the panel renders, **Then** **Complete** is not rendered.

### Edge Cases

- **Stale status.** The request changed while the panel was open (another Admin acted, or the Employee cancelled). Any action is refused. The panel says the request changed and shows its current status and actions.
- **Source failure.** A transition fails for a reason other than a stale status. The panel keeps the request's previous status, shows a failure message, and keeps the form's input so the Admin can retry.
- **Double submit.** While a transition is in flight, its confirm control is inert, so one click is one request.
- **No note.** The Note to Approver block is not drawn.
- **Terminal request reached by id.** An Admin opens a `Rejected`, `Cancelled` or `Completed` request (for example, just after deciding it). The panel is read-only: rejection or cancellation reason read back where there is one, and **Close**.
- **Employee.** An Employee cannot reach `/queue` (spec 003 guard), so no action in this feature is reachable as an Employee.
- **Unavailable stock figure.** The source gives no Available figure for a line's (asset, office). CURRENT INVENTORY shows an explicit unavailable marker, not `0 in stock`.
- **Office enum.** The pickup-location list uses the office names the contract exposes. `Pasig` vs `Ortigas` stays unresolved (contracts conflict 2), and the SPA invents no third spelling.

## Functional Requirements

- **FR-001**: **Review** on a queue row MUST open the panel over `/queue` and MUST NOT change the address. It replaces spec 004 FR-010's navigation to `/requests/:id`.
- **FR-002**: The panel MUST close on ✕, Esc and a scrim click, MUST hold focus while open, and MUST return focus to the invoking **Review**. Closing MUST preserve the queue's query state.
- **FR-003**: The panel body MUST show the request id and status pill, REQUESTED BY (avatar, name, `email • office`), the `ITEM · QTY · CURRENT INVENTORY` table, the Note to Approver when present, and the STATUS timeline. The body is the same in every state.
- **FR-004**: CURRENT INVENTORY MUST show the Available quantity at the request's office as the data source reports it. The SPA MUST NOT compute it.
- **FR-005**: The offered actions MUST be derived from the request's status alone, as follows. An action not listed for a status MUST NOT be rendered; a disabled control does not satisfy this.

  | Status | Offered |
  |--------|---------|
  | `Pending Approval` | Reject Request · Approve Request |
  | `Approved` | Update Status |
  | `For Delivery` / `Ready for Pickup` | Update Status |
  | `Received` | Complete (gated, FR-012) |
  | `Rejected` / `Cancelled` / `Completed` | Close |

- **FR-006**: Approve MUST move `Pending Approval` → `Approved`.
- **FR-007**: Reject MUST require a reason that is non-empty after trimming. An empty reason MUST NOT reach the source. A successful reject MUST read the reason back under **Reason for rejection**.
- **FR-008**: Update Status MUST offer exactly `For Delivery` and `Ready for Pickup`, from `Approved`, `For Delivery` or `Ready for Pickup`.
- **FR-009**: `Ready for Pickup` MUST require a pickup location: one of the offices the source exposes (the request's office preselected), or **Other…** with non-empty free text.
- **FR-010**: The panel MUST NOT offer Complete from `For Delivery` or `Ready for Pickup`.
- **FR-011**: Complete MUST ask for confirmation before it sends anything.
- **FR-012**: Complete, `Received`, and the five-node timeline MUST NOT ship until constitution 4.0.0 adopts `Received`. Until then, `RequestStatus` stays the seven states of 3.0.1.
- **FR-013**: After any successful transition, the panel, the queue rows, the chip counts and the summary cards MUST show the source's current state. A request that reaches a terminal status MUST leave the queue.
- **FR-014**: A refusal caused by a changed status MUST say so and show the current status and its actions. Any other failure MUST leave the status unchanged and keep the form's input.
- **FR-015**: A transition in flight MUST NOT be sendable again.
- **FR-016**: The SPA MUST NOT change stock or send email. Reserve release (reject), consumption (complete) and every notification (approve → `Request approved`, reject → `Request declined`, every other transition → `Status changed` with previous and new status and the pickup location) are the API's (constitution III, V).
- **FR-017**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes. Until the contract publishes, data MAY come from a typed seeded source behind an interface, as spec 004 FR-018 allows.
- **FR-018**: The panel and its forms MUST compose shared UI from `src/shared/ui`, and MUST reuse the timeline spec 007 established.
- **FR-019**: Every control MUST be keyboard-operable with visible focus. The panel MUST stay usable from 360px to 1440px without page-level horizontal overflow.

## Key Entities

- **Review request**: The Admin's read model of one request. It holds the id, status, requestor (name, email, office), lines, optional note, handover state taken, pickup location, a timestamp per reached transition, and the rejection or cancellation reason where there is one. It is not an API shape.
- **Review line**: The item description, the quantity, and the Available figure at the request's office (or unavailable).
- **Panel action**: One of approve, reject, update status, complete, close. The status determines which are offered.
- **Transition result**: Either the updated request, or a refusal (`status-changed`, `reason-required`, `location-required`, `unavailable`).
- **Pickup location**: An office from the source's list, or free text.

## Out of Scope

- **Admin cancel** (`Approved` / `For Delivery` / `Ready for Pickup` → `Cancelled`). Spec 001 FR-010b stands, but no control is drawn. Deferred to a follow-up ticket by the project owner, 2026-09-26.
- The Employee's accountability form and the transition to `Received`. They are the amendment's and the Employee panel's.
- The constitution 4.0.0 amendment itself. The follow-up covers ADR-0007's successor, spec 001 FR-012/FR-012a, `docs/process-flow.md`, `ARCHITECT.md` §5–§6, `status.ts`, and spec 004's chips.
- The queue list, filters, search, sort and pagination (BEN-46).
- History and its read-only panel (BEN-49 / spec 001 FR-016a).
- Stock arithmetic, email sending, and REST contract definition.
- An Admin-on-submit email and the per-unit register (drift-2026-09-24 §3, §4).

## Success Criteria

- **SC-001**: For each status in the seeded data set, the panel renders exactly the actions in FR-005's table, and no others.
- **SC-002**: An Admin can take a seeded request from `Pending Approval` to `Ready for Pickup` with a location, entirely in the panel, without the address changing.
- **SC-003**: An empty or whitespace-only rejection reason, or a missing pickup location, never changes a request's status.
- **SC-004**: After each successful transition, the panel, the row, the chip counts and the summary cards agree with the source.
- **SC-005**: No handover state offers Complete. Once the amendment lands, only `Received` does, and only after confirmation.
- **SC-006**: An Employee cannot reach any control in this feature through navigation or a direct address.
- **SC-007**: Review of the feature finds no invented route, payload, field, error code, stock calculation or office name.

## Clarifications

### Session 2026-09-26

Raised while specifying BEN-47 (G0, BEN-76) against the 2026-09-22 frames, and decided by the project owner.

- Q: `Ready for Pickup` must record a location (spec 001 FR-011a), but the Update Status frame draws only `Status *`. How is it collected? → A: **A select of the office locations, with a last option that reveals a free-text field.** This is an undrawn addition, recorded in `docs/design-system/additions.md` and flagged to the designer.
- Q: Admin cancel has no drawn control. Where does it go? → A: **Out of scope for BEN-47.** It is deferred to a follow-up ticket. Spec 001 FR-010b is unchanged.
- Q: The handed-over frame draws only **Complete**, yet `For Delivery` and `Ready for Pickup` are peers. → A: **The Employee's `Received` (accountability form, drift-2026-09-24 §2) comes before Complete.** The Admin sees **Complete** only once the status is `Received`.
- Q: Adopting `Received` redefines constitution IV (4.0.0) and supersedes ADR-0007. Where does that land? → A: **Recorded here, amended separately.** A follow-up change carries the constitution, ADR, spec 001, process-flow and `status.ts` amendment. This spec's Complete story is gated on it.
- Q: With `Received`, which transition consumes stock? → A: **`Completed`, unchanged.** `Received` changes no quantity (ADR-0006 stock rule 7 stands).
- Q: What does the Admin's panel offer during `For Delivery` / `Ready for Pickup`? → A: **Update Status only**, so the two peers can be swapped. Complete appears at `Received`.
- Q: Should Complete, which is irreversible and consumes stock, confirm first? → A: **Yes, a confirm step.** The frame draws none. This is an undrawn addition, flagged to the designer.

Inferred from existing specs, not asked:

- The reject reason is an **inline block in the panel**, not a modal. That is how `02.2.2` draws it (drift-2026-09-24 §5).
- The open panel is component state, not part of the address, as in spec 007. Spec 003 kept the Admin's `/requests/:id` "until BEN-47". This feature retires that hand-off, and spec 003 is amended in the same change.
- The pickup-location select preselects the request's office, which is the most likely pickup point. This is our default, not drawn.

## Validation

- Completeness: PASS. All four P1 stories have acceptance criteria. Story 4 is explicitly gated.
- Clarity: PASS
- Consistency: PASS with the recorded gate. FR-012 keeps this spec consistent with constitution 3.0.1 until 4.0.0 lands.
- Measurability: PASS
- Coverage: PASS. Admin cancel is excluded deliberately (Out of Scope).
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
