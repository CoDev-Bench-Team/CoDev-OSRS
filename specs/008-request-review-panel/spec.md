# Feature Specification: Request Review Panel + Admin Transitions

**Feature Branch**: `emmanuelr/ben-47-p2spa-request-review-panel-admin-transitions`  
**Created**: 2026-09-26  
**Status**: Draft  
**Sources**: BEN-47, BEN-76 (G0), BEN-77/78/79, BEN-135 (Admin cancel), constitution 3.0.1 (8.0.0 for Story 5), `specs/001-office-supplies-mvp/spec.md` (US3–US5, FR-008–FR-014), `specs/004-approver-pending-queue/spec.md` (FR-010 seam), `specs/007-employee-request-panel/spec.md` (timeline, reason read-back), [ADR-0005](../../docs/adr/0005-two-role-model.md), [ADR-0006](../../docs/adr/0006-assets-and-inventory.md), [ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md), [drift-2026-09-22 §2–§3](../../docs/design-system/drift-2026-09-22.md), [drift-2026-09-24 §2, §5, §6](../../docs/design-system/drift-2026-09-24.md), [drift-2026-09-26 §2, §4](../../docs/design-system/drift-2026-09-26.md), [drift-2026-09-29](../../docs/design-system/drift-2026-09-29.md), Figma *Mockups* frames `02.2 - Requests Queue - Review`, `02.2.1 - … - Review - Approve`, `02.2.1 - … - Review - Update Status` (×2), `02.2.2- … - Review - Reject`, `02.2.2.1 - … - Review - Reject`, component `Status Timeline`

> **Amended 2026-09-26 after merging `dev`.** The `Received` amendment this
> spec was gated on has landed: constitution **5.0.0** and ADR-0009 (BEN-43).
> The Employee's Accountability Form sets `Received`; the reserved units are
> assigned then, so Total and Reserved fall at `Received`, not at `Completed`.
> The Admin completes only from `Received`, and Complete changes no quantity.
> Story 4 is therefore unblocked, but is **not built yet**. See Session
> 2026-09-26 (after the `dev` merge) in Clarifications.
>
> **Amended 2026-09-29 (constitution 7.0.0, [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md))**:
> the Accountability Form no longer sets `Received`. The Admin (Update Status)
> or the owning Employee (**Mark as Received**, [spec 012](../012-accountability-form/spec.md))
> sets it; signing records the acknowledgement and changes no status.

> **Amended 2026-09-30 for BEN-135.** Admin cancel leaves Out of Scope and
> becomes Story 5: an Admin cancels an `Approved`, `For Delivery` or
> `Ready for Pickup` request that cannot be fulfilled, with a required reason
> (spec 001 FR-010b, constitution 7.0.0 IV). No frame draws the control; its
> placement is an undrawn addition. See Session 2026-09-30 in Clarifications.

> **Amended 2026-10-01 (constitution 8.0.0, [ADR-0012](../../docs/adr/0012-no-admin-cancel-on-for-delivery.md)).**
> An Admin no longer cancels a `For Delivery` request: its items are out with
> the delivery. Cancel Request is offered on `Approved` and `Ready for Pickup`
> only. A failed delivery goes back to `Ready for Pickup` first. See Session
> 2026-10-01 in Clarifications.

## Overview

Give an Admin one side panel over the Requests Queue where they read a request and move it through every Admin transition: approve, reject, set `For Delivery` / `Ready for Pickup`, complete, and cancel a request that cannot be fulfilled. The panel is one surface whose body stays the same across states. Only its actions change, and they are derived from the request's status.

This feature replaces spec 004's interim hand-off (Review navigates to `/requests/:id`) with the drawn panel. It does not own the queue list (BEN-46), the Employee's panel or accountability form (BEN-45 and the amendment's follow-up), or any backend behaviour. Stock movement and email are the API's (constitution III, V). The SPA shows the result.

## User Stories

### Story 1 — Read a request in the review panel (Priority: P1)

An Admin activates **Review** on a queue row and sees the whole request without leaving the queue.

**Why this priority**: Every decision in this feature starts from this read-back. Without it, nothing else is reachable.

**Acceptance Criteria**:

1. **Given** an Admin on `/queue`, **When** they activate **Review** on a row, **Then** a side panel opens over the queue, and the address stays `/queue`.
2. **Given** the panel is open, **When** it renders, **Then** it shows the request id with its status pill, **REQUESTED BY:** (avatar, name, `email • office`), a line table `ITEM · QTY · CURRENT INVENTORY`, the **Note to Approver** when one exists, and the **STATUS** timeline.
3. **Given** a line, **When** the table renders, **Then** CURRENT INVENTORY reads as `<n> in stock`, where `<n>` is the asset's Available quantity at the request's office as the data source reports it, plus the line's own quantity while the request still holds its reservation (`Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup`). A request holding the last unit reads `1 in stock`, not `0 in stock`. *(Amended 2026-10-03, FR-004.)*
4. **Given** the panel is open, **When** the Admin activates ✕, presses Esc, or clicks the scrim, **Then** the panel closes, focus returns to that row's **Review**, and the queue's chip, search, sort and page are unchanged.
5. **Given** a request in any live state, **When** the timeline renders, **Then** it follows the mapping `plan.md` defines: the forward nodes fill in order, and the handover node names the state the request took (`For Delivery` or `Ready for Pickup`) once it is reached.

### Story 2 — Approve or reject a pending request (Priority: P1)

An Admin decides on a `Pending Approval` request. They approve it, or they reject it with a required reason.

**Why this priority**: This is the review half of the pipeline (spec 001 US3). Fulfilment cannot start without it.

**Acceptance Criteria**:

1. **Given** a `Pending Approval` request, **When** the panel renders, **Then** it offers **Reject Request** and **Approve Request** under the note *"The employee will receive an email with your decision."*, and no other action.
2. **Given** the Admin activates **Approve Request**, **When** the source accepts it, **Then** the pill and timeline show `Approved` and the panel offers **Update Status** and **Cancel Request** (Story 5).
3. **Given** the Admin activates **Reject Request**, **When** the reason block opens in the panel, **Then** it asks for a required **Reason for rejection \*** (placeholder `e.g item on hold, insufficient justification...`) with **Cancel** and **Confirm Rejection**.
4. **Given** the reason is empty or only whitespace, **When** the Admin confirms, **Then** the block shows its invalid state with a message, nothing is sent, and the status stays `Pending Approval`.
5. **Given** a non-empty reason, **When** the source accepts it, **Then** the panel shows `Rejected`, reads the reason back under **Reason for rejection**, offers only **Close**, and the request leaves the queue.
6. **Given** the Admin activates **Cancel** in the reason block, **When** it closes, **Then** the typed reason is discarded and the pending actions return.

### Story 3 — Hand over by delivery or pickup (Priority: P1)

An Admin sets an approved request to `For Delivery` or `Ready for Pickup`, and can swap between the two before the Employee acknowledges receipt.

**Why this priority**: This is the fulfilment half (spec 001 US4), needed for the demo path.

**Acceptance Criteria**:

1. **Given** an `Approved` request, **When** the panel renders, **Then** it offers **Update Status** and **Cancel Request** (Story 5), and no other action.
2. **Given** the Admin activates **Update Status**, **When** the form opens, **Then** it shows a required **Status \*** select offering `For Delivery` and `Ready for Pickup`, with **Cancel** and **Update Status**.
3. **Given** `Ready for Pickup` is selected, **When** the form renders, **Then** a required **Pickup location \*** select appears. It lists the offices the data source exposes, preselects the request's office, and ends with a last option, **Other…**, which reveals a required free-text field.
4. **Given** `Ready for Pickup` with no location, or **Other…** with an empty or whitespace-only text, **When** the Admin confirms, **Then** the form shows its invalid state and nothing is sent.
5. **Given** a valid choice, **When** the source accepts it, **Then** the pill and timeline show the new status, the handover node names it, and a `Ready for Pickup` request reads back its pickup location.
6. **Given** a `For Delivery` or `Ready for Pickup` request, **When** the panel renders, **Then** it offers **Update Status**, and on `Ready for Pickup` also **Cancel Request** (Story 5), and nothing else. The Status select offers **Received** and the other handover state, never the current one (FR-008, FR-008a).
7. **Given** a handover state, **When** the panel renders, **Then** it does **not** offer **Complete**. Complete waits for `Received` (Story 4).
8. **Given** a `For Delivery` or `Ready for Pickup` request, **When** the Admin selects **Received** and confirms, **Then** no pickup location is asked for, the pill shows `Received`, the timeline keeps the handover node it had and reaches **Received**, and the panel offers no action until Complete is built.
9. **Given** an `Approved` request, **When** the Status select opens, **Then** it does not offer **Received**.
10. **Given** a valid choice, **When** the Admin activates **Update Status**, **Then** a confirmation dialog names the change and nothing is sent until they press **Confirm**; **Cancel** or Esc sends nothing and keeps the form (FR-008b).

### Story 4 — Complete a received request (Priority: P1, gated)

After the Employee has acknowledged receipt (`Received`), an Admin completes the request, and that is when the stock leaves the store.

**Why this priority**: This closes the pipeline (constitution 5.0.0 IV). It changes no quantity: the units left the store at `Received` (constitution 5.0.0 III). **Not built yet** (see the banner).

**Acceptance Criteria**:

1. **Given** a `Received` request, **When** the panel renders, **Then** it offers **Complete** and no other action.
2. **Given** the Admin activates **Complete**, **When** the confirm step opens, **Then** it asks the Admin to confirm, with **Cancel** and **Complete**. Nothing is sent until they confirm.
3. **Given** the Admin confirms, **When** the source accepts it, **Then** the panel shows `Completed`, the timeline's last node is reached, the request leaves the queue, and no stock figure changes.
4. **Given** any status other than `Received`, **When** the panel renders, **Then** **Complete** is not rendered.

### Story 5 — Cancel a request that cannot be fulfilled (Priority: P2)

An Admin stops an approved request, or one waiting for pickup, that cannot be fulfilled, for example because the item is no longer available. They give a reason, and the employee is told why.

**Why this priority**: Spec 001 FR-010b and constitution IV require it. Without it, an unfulfillable request cannot leave the queue and its units stay reserved. It is off the MVP demo path, so it ranks below Stories 1–4. It can be demonstrated on its own once Story 1 is built.

**Acceptance Criteria**:

1. **Given** an `Approved` or `Ready for Pickup` request, **When** the panel renders, **Then** it offers **Cancel Request**, a secondary action beside **Update Status**.
2. **Given** a `Pending Approval`, `For Delivery`, `Received`, `Rejected`, `Cancelled` or `Completed` request, **When** the panel renders, **Then** **Cancel Request** is not rendered.
3. **Given** the Admin activates **Cancel Request**, **When** the reason block opens in the panel in place of the actions, **Then** it asks for a required **Reason for cancellation \*** (placeholder `e.g item discontinued, no stock at this office...`) with **Cancel** and **Confirm Cancellation**, as the Employee's `04.2` does. Confirm Cancellation sends at once; there is no further dialog (FR-023).
4. **Given** the reason is empty or only whitespace, **When** the Admin confirms, **Then** the block shows its invalid state with a message, nothing is sent, and the status is unchanged.
5. **Given** a non-empty reason, **When** the source accepts it, **Then** the pill shows `Cancelled`, the timeline keeps the nodes the request had reached and ends at **Cancelled**, the reason is read back under **Reason for cancellation**, the panel offers only **Close**, and the request leaves the queue.
6. **Given** the Admin activates **Cancel** in the reason block, **When** it closes, **Then** the typed reason is discarded and the actions return.
7. **Given** the Update Status form or the cancel reason block is open, **When** the panel renders, **Then** the other is not offered until the open one is closed.

### Edge Cases

- **Stale status.** The request changed while the panel was open (another Admin acted, or the Employee cancelled). Any action is refused. The panel says the request changed and shows its current status and actions.
- **Received while cancelling.** The Employee marks the request received (constitution 7.0.0 IV) while the Admin is typing a cancellation reason, so the request is now `Received`. The cancel is refused as a stale status, the panel shows `Received`, and **Cancel Request** is gone (FR-020).
- **Handed over for delivery while cancelling.** Another Admin moves an `Approved` request to `For Delivery` while this Admin is typing a cancellation reason. The cancel is refused as a stale status, the panel shows `For Delivery`, and **Cancel Request** is gone (FR-020).
- **Delivery falls through.** A `For Delivery` request cannot be cancelled. The Admin moves it to `Ready for Pickup` with Update Status, then cancels it (FR-020).
- **Cancelled after handover.** A `Ready for Pickup` request is cancelled. Its timeline still names **Ready for Pickup** before **Cancelled** (FR-022). The pickup location is not read back, because nothing will be collected.
- **Source failure.** A transition fails for a reason other than a stale status. The panel keeps the request's previous status, shows a failure message, and keeps the form's input so the Admin can retry.
- **Double submit.** While a transition is in flight, its confirm control is inert, so one click is one request.
- **No note.** The Note to Approver block is not drawn.
- **Terminal request reached by id.** An Admin opens a `Rejected`, `Cancelled` or `Completed` request (for example, just after deciding it). The panel is read-only: rejection or cancellation reason read back where there is one, and **Close**. *(Amended 2026-09-29, [spec 013](../013-admin-history/spec.md) FR-016: only the "just after deciding it" case stays here. A `/requests/:id` link to a resolved request opens History's panel over `/history`.)*
- **Employee.** An Employee cannot reach `/queue` (spec 003 guard), so no action in this feature is reachable as an Employee.
- **Unavailable stock figure.** The source gives no Available figure for a line's (asset, office). CURRENT INVENTORY shows an explicit unavailable marker, not `0 in stock`.
- **Office enum.** The pickup-location list uses the office names the contract exposes. The contract settled on `Ortigas` on 2026-09-25 (contracts conflict 2 closed), and the SPA's `Office` follows it; the SPA invents no third spelling.

## Functional Requirements

- **FR-001**: **Review** on a queue row MUST open the panel over `/queue` and MUST NOT change the address. It replaces spec 004 FR-010's navigation to `/requests/:id`.
- **FR-001a**: `/requests/:id` MUST open that request's panel: for an Admin, the review panel over `/queue` (*amended 2026-09-29, [spec 013](../013-admin-history/spec.md) FR-016: a `Completed`, `Rejected` or `Cancelled` request opens History's read-only panel over `/history` instead*); for an Employee, their request panel over `/requests`. A request the page may not show (missing, or for an Employee not theirs) MUST open nothing and show a notice that does not echo the id; for an Employee it MUST be identical for both cases (spec 003 FR-012a). Opening a panel clears it. The link MUST survive sign-in (spec 003 FR-013).
- **FR-001b** *(added 2026-10-03)*: `/queue/:id` MUST open that request's review panel over the Requests Queue, as **Review** does, for an Admin. `/requests/:id` MUST send an Admin there, so an email's *View request* lands on it. A resolved request MUST go on to History's read-only panel, and a missing one MUST open nothing, settle on `/queue` and show FR-001a's Admin notice. Closing the panel MUST return the address to `/queue`. FR-001 is unchanged: **Review** still opens the panel without changing the address. The queue MUST NOT reload or remount between `/queue` and `/queue/:id`.
- **FR-002**: The panel MUST close on ✕, Esc and a scrim click, MUST hold focus while open, and MUST return focus to the invoking **Review**. Closing MUST preserve the queue's query state.
- **FR-003**: The panel body MUST show the request id and status pill, REQUESTED BY (avatar, name, `email • office`), the `ITEM · QTY · CURRENT INVENTORY` table, the Note to Approver when present, and the STATUS timeline. The body is the same in every state.
- **FR-004**: CURRENT INVENTORY MUST show the units at the request's office open to this request: the Available quantity as the data source reports it, plus the line's quantity while the request holds its reservation (`Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup`). From `Received`, `Rejected` or `Cancelled` it is the Available quantity alone. The SPA MUST NOT compute Available itself. *(Amended 2026-10-03 at the project owner's request: submit moves the request's units from Available to Reserved (constitution III), so Available alone read `0 in stock` for a request holding the last unit, as if there were none for it. The addition uses only the published Available figure and the request's own quantity.)*
- **FR-005**: The offered actions MUST be derived from the request's status alone, as follows. An action not listed for a status MUST NOT be rendered; a disabled control does not satisfy this.

  | Status | Offered |
  |--------|---------|
  | `Pending Approval` | Reject Request · Approve Request |
  | `Approved` | Cancel Request · Update Status |
  | `For Delivery` | Update Status |
  | `Ready for Pickup` | Cancel Request · Update Status |
  | `Received` | Complete (FR-012; not built yet, so nothing today) |
  | `Rejected` / `Cancelled` / `Completed` | Close |

- **FR-006**: Approve MUST move `Pending Approval` → `Approved`.
- **FR-007**: Reject MUST require a reason that is non-empty after trimming. An empty reason MUST NOT reach the source. A successful reject MUST read the reason back under **Reason for rejection**.
- **FR-007a**: Where Approve and Reject are offered, the panel MUST show an optional **Other Notes (optional)** field at the bottom of the body, above the actions (frame `02.2`, [drift-2026-09-29](../../docs/design-system/drift-2026-09-29.md)). A non-blank note MUST be sent, trimmed, with whichever decision is taken; a blank one MUST NOT be sent and MUST NOT block either decision. The note MUST survive backing out of a rejection and a failed transition. It is not read back, because no frame draws it. The contract has no field for it (contracts conflict 6), so only the seeded source holds it.
- **FR-008**: Update Status MUST offer exactly `For Delivery` and `Ready for Pickup` from `Approved`, and from `For Delivery` or `Ready for Pickup`, `Received` (listed first and preselected) and the other handover state. The current status MUST NOT be offered: choosing it would change nothing, so a `Ready for Pickup` request's location cannot be changed in place.
- **FR-008b**: A valid Update Status MUST ask in a confirmation dialog (**Update status?** · Cancel / **Confirm**) naming the previous and new status, and the pickup location when there is one, before anything is sent. For `Received` it MUST say the change cannot be undone. Cancel, Esc and the scrim MUST close the dialog, keep the form and its input, and send nothing; Esc MUST NOT close the panel. The dialog opens on Cancel, and Tab stays inside it. An invalid submit MUST NOT open it. (The current status cannot be chosen, FR-008.)
- **FR-008a**: Setting `Received` MUST be accepted only from `For Delivery` or `Ready for Pickup` (constitution 6.0.0 IV, [ADR-0010](../../docs/adr/0010-admin-marks-received.md)). It MUST keep the handover state and pickup location the request had, and MUST NOT ask for a location. Unit assignment and the `Status changed` email are the API's (FR-016). The contract has no such transition yet (contracts conflict 5), so only the seeded source accepts it.
- **FR-009**: `Ready for Pickup` MUST require a pickup location: one of the offices the source exposes (the request's office preselected), or **Other…** with non-empty free text.
- **FR-010**: The panel MUST NOT offer Complete from `For Delivery` or `Ready for Pickup`.
- **FR-011**: Complete MUST ask for confirmation before it sends anything.
- **FR-012**: Complete MUST be offered only on `Received` (constitution 5.0.0 IV). Until it is built, `Received` offers no action.
- **FR-013** *(amended 2026-10-03)*: Once an action is confirmed (Approve and Complete on click; Reject and Cancel on their reason; Update Status on its confirmation dialog), the panel MUST stay open, name the action on its button while it runs ("Approving…", "Rejecting…", "Cancelling…", "Updating…", "Completing…"), and be busy: its notes and scrolling locked, every other action withheld. When it lands with the panel open, the panel MUST show how it ended and the request's current state, with no toast. If the Admin closes the panel (✕, Esc, the scrim) while it runs, the action MUST carry on and a toast MUST take over at once: the action under way, then how it ended. Either way the queue rows, chip counts and summary cards MUST show the source's current state. *(Amended again 2026-10-03 at the project owner's request — one behaviour for every side drawer, `usePanelTask`.)* A request that reaches a terminal status MUST leave the queue. A missing reason or pickup location is caught in the panel, before anything is sent, and does not close it.
- **FR-014** *(amended 2026-10-03)*: A refusal MUST say nothing was changed, or, for a changed status, that the request was updated meanwhile: in the open panel, as an alert; after the panel was closed, in an error toast that stays until dismissed and offers to reopen the request. *(Amended again 2026-10-03 at the project owner's request — one behaviour for every side drawer, `usePanelTask`.)*
- **FR-015**: A transition in flight MUST NOT be sendable again. *(2026-10-03: a request reopened while its action is in flight offers its actions disabled until it lands.)*
- **FR-016**: The SPA MUST NOT change stock or send email. Reserve release (reject, cancel), unit assignment (`Received`) and every notification (approve → `Request approved`, reject → `Request declined`, every other transition → `Status changed` with previous and new status and the pickup location; cancel → `Status changed` to `Cancelled`) are the API's (constitution III, V).
- **FR-017**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes. Until the contract publishes, data MAY come from a typed seeded source behind an interface, as spec 004 FR-018 allows.
- **FR-018**: The panel and its forms MUST compose shared UI from `src/shared/ui`, and MUST reuse the timeline spec 007 established.
- **FR-019**: Every control MUST be keyboard-operable with visible focus. The panel MUST stay usable from 360px to 1440px without page-level horizontal overflow.
- **FR-020**: Cancel MUST move `Approved` or `Ready for Pickup` → `Cancelled`, and MUST be offered on those two statuses only (constitution 8.0.0 IV, spec 001 FR-010b). A `Pending Approval` request is the Employee's to cancel or the Admin's to reject. A `For Delivery`, `Received` or `Completed` request MUST NOT be cancelled. *(Narrowed 2026-10-01: `For Delivery` removed.)*
- **FR-021**: Cancel MUST require a reason that is non-empty after trimming, and MUST send it trimmed. An empty reason MUST NOT reach the source. When the source refuses the reason itself, the reason field MUST return to its invalid state with its required message. Showing the API's own `detail` there is the integration ticket's to add (contracts README, Cancel). A successful cancel MUST read the reason back under **Reason for cancellation**.
- **FR-022**: A `Cancelled` request's timeline MUST show the nodes the request reached before it was cancelled, in order, then **Cancelled**. The handover node MUST name the state it took. This is [spec 013](../013-admin-history/spec.md) FR-009a's rule (BEN-144), which this spec follows: each reached node is dated, and a node is drawn only when the source gives its facts, so the timeline can understate how far a request got but never overstates it. An Employee's cancel always comes from `Pending Approval`, so it still reads Submitted → Cancelled, as `04.2 - Cancelled` draws it. The mapping is shared with the Employee's panel (spec 007), so an Employee opening an Admin-cancelled request sees the same shape. `Rejected` is unchanged: it is only ever reached from `Pending Approval`.
- **FR-023**: Confirm Cancellation with a valid reason MUST send the cancel at once, with no further dialog. The required reason is the deliberate second step, as it is for reject and for the Employee's cancel.

## Key Entities

- **Review request**: The Admin's read model of one request. It holds the id, status, requestor (name, email, office), lines, optional note, the Admin's optional Other Notes, handover state taken, pickup location, a timestamp per reached transition, and the rejection or cancellation reason where there is one. It is not an API shape.
- **Review line**: The item description, the quantity, and the Available figure at the request's office (or unavailable).
- **Panel action**: One of approve, reject, update status, complete, cancel, close. The status determines which are offered.
- **Transition result**: Either the updated request, or a refusal (`status-changed`, `reason-required`, `location-required`, `unavailable`).
- **Pickup location**: An office from the source's list, or free text.

## Out of Scope

- ~~**Admin cancel** (`Approved` / `For Delivery` / `Ready for Pickup` → `Cancelled`). Spec 001 FR-010b stands, but no control is drawn. Deferred to a follow-up ticket by the project owner, 2026-09-26.~~ *Brought in as Story 5 by BEN-135, 2026-09-30.*
- Who cancelled a request. The source may return it, but no frame draws it, so the panel does not show it.
- Cancelling from `Received` or `Completed`, and any change to the Employee's own cancel (spec 007).
- The Employee's accountability form and its transition to `Received`. They are the amendment's and the Employee panel's. The Admin's own path to `Received` is in scope (FR-008a).
- The `Received` amendment itself, which landed with constitution 5.0.0 (BEN-43, ADR-0009).
- The queue list, filters, search, sort and pagination (BEN-46).
- History and its read-only panel (BEN-49 / spec 001 FR-016a).
- Stock arithmetic, email sending, and REST contract definition.
- An Admin-on-submit email and the per-unit register (drift-2026-09-24 §3, §4).

## Success Criteria

- **SC-001**: For each status in the seeded data set, the panel renders exactly the actions in FR-005's table, and no others.
- **SC-002**: An Admin can take a seeded request from `Pending Approval` to `Ready for Pickup` with a location, entirely in the panel, without the address changing.
- **SC-003**: An empty or whitespace-only rejection reason, or a missing pickup location, never changes a request's status.
- **SC-004**: After each successful transition, the panel, the row, the chip counts and the summary cards agree with the source.
- **SC-005**: No handover state offers Complete. Once Complete is built, only `Received` offers it, and only after confirmation.
- **SC-006**: An Employee cannot reach any control in this feature through navigation or a direct address.
- **SC-007**: Review of the feature finds no invented route, payload, field, error code, stock calculation or office name.
- **SC-008**: **Cancel Request** appears on exactly the `Approved` and `Ready for Pickup` requests in the seeded data set, and on no other.
- **SC-009**: An empty or whitespace-only cancellation reason never changes a request's status. A valid one takes the request out of the queue, and its panel reads the reason back.

## Clarifications

### Session 2026-09-26

Raised while specifying BEN-47 (G0, BEN-76) against the 2026-09-22 frames, and decided by the project owner.

- Q: `Ready for Pickup` must record a location (spec 001 FR-011a), but the Update Status frame draws only `Status *`. How is it collected? → A: **A select of the office locations, with a last option that reveals a free-text field.** This is an undrawn addition, recorded in `docs/design-system/additions.md` and flagged to the designer.
- Q: Admin cancel has no drawn control. Where does it go? → A: **Out of scope for BEN-47.** It is deferred to a follow-up ticket. Spec 001 FR-010b is unchanged.
- Q: The handed-over frame draws only **Complete**, yet `For Delivery` and `Ready for Pickup` are peers. → A: **The Employee's `Received` (accountability form, drift-2026-09-24 §2) comes before Complete.** The Admin sees **Complete** only once the status is `Received`.
- ~~Q: Adopting `Received` redefines constitution IV (4.0.0) and supersedes ADR-0007. Where does that land? → A: **Recorded here, amended separately.**~~ *Superseded: it landed as constitution 5.0.0 (below).* A follow-up change carries the constitution, ADR, spec 001, process-flow and `status.ts` amendment. This spec's Complete story is gated on it.
- ~~Q: With `Received`, which transition consumes stock? → A: **`Completed`, unchanged.**~~ *Superseded by constitution 5.0.0 III: the units are assigned, and Total and Reserved fall, at `Received`. Complete changes nothing.*
- Q: What does the Admin's panel offer during `For Delivery` / `Ready for Pickup`? → A: **Update Status only**, so the two peers can be swapped. Complete appears at `Received`.
- Q: Should Complete, which is irreversible, confirm first? → A: **Yes, a confirm step.** The frame draws none. This is an undrawn addition, flagged to the designer.

Inferred from existing specs, not asked:

- The reject reason is an **inline block in the panel**, not a modal. That is how `02.2.2` draws it (drift-2026-09-24 §5).
- The open panel is component state, not part of the address, as in spec 007. *(Later the same day `/requests/:id` became a deep link that opens the panel; see below.)*
- The pickup-location select preselects the request's office, which is the most likely pickup point. This is our default, not drawn. *(Refined in review: a request that already has a location opened on it. Withdrawn 2026-09-29: the current status is no longer offered, so a `Ready for Pickup` request cannot be re-set to `Ready for Pickup`, and there is no stored location to open on.)*

### Session 2026-09-26 — after merging `dev`

Decided by the project owner.

- Q: `dev` adopted `Received` as constitution 5.0.0 (BEN-43, ADR-0009): the Employee's form sets it, units are assigned then, and Complete changes nothing. What happens to this spec's gate? → A: **It is met.** The banner, Story 4, FR-012 and FR-016 follow 5.0.0. Complete stays unbuilt for now; `Received` offers no action until it is.
- Q: An email's *View request* button links to `/requests/:id`, which this spec had retired. → A: **Build it as a deep link that opens the panel** (FR-001a). Spec 003 is amended the same day.
- Q: The Admin can view every request. Should the Admin's notice for an unopenable link also say "or it may not be yours to view"? → A: **No.** The Admin's reads "That request is not available. It may not exist." The Employee's stays identical for missing and foreign ids (FR-001a). Opening any panel clears the notice.
- Q: The timeline dots: the frames' own shades, or the pills'? → A: **The pills.** A reached dot takes its status pill's ink ([drift-2026-09-26 §4b](../../docs/design-system/drift-2026-09-26.md)).

### Session 2026-09-29

Raised by frame `02.2` as the project owner supplied it
([drift-2026-09-29](../../docs/design-system/drift-2026-09-29.md)), and decided by the project owner.

- Q: `02.2` now draws an **Other Notes** box above Reject / Approve. Required or optional? → A: **Optional**, labelled **Other Notes (optional)** (FR-007a).
- Q: Once a request is `For Delivery` / `Ready for Pickup`, should the Status select offer **Received**? → A: **Yes.** This redefined constitution IV, so it landed as constitution 6.0.0 and [ADR-0010](../../docs/adr/0010-admin-marks-received.md) first (FR-008, FR-008a, Story 3 criteria 8–9). ~~The Employee's Accountability Form still sets `Received` too.~~ **Amended 2026-09-29 (constitution 7.0.0, [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md))**: the owning Employee now sets `Received` with **Mark as Received** ([spec 012](../012-accountability-form/spec.md)); signing the Accountability Form records the acknowledgement and changes no status.
- Q: Should the select offer the request's current status? → A: **No.** `For Delivery` offers `Received` · `Ready for Pickup`; `Ready for Pickup` offers `Received` · `For Delivery` (FR-008). Moving a pickup to a new location in place is no longer possible: it takes For Delivery, then Ready for Pickup again, which is two transitions and two `Status changed` emails. Accepted by the project owner (plan R6).
- Q: Where does **Received** sit in the select, and does Update Status confirm? → A: **First and preselected** on a handover state, and **every** Update Status asks in a confirmation dialog first (FR-008b). Both undrawn, logged in additions.md §3h.

Inferred, not asked:

- The note goes with the decision, approve or reject, because it sits above both buttons. It is shown only where a decision is offered, which is `Pending Approval`.
- It is built against the seeded source while the contract lacks the field, as the rest of this panel is (FR-017), and the gap is raised as contracts conflict 6 rather than papered over.

### Session 2026-10-01 — No Admin cancel on `For Delivery` (BEN-135)

Raised by the project owner during review of PR #50.

- Q: Is an "On Delivery" status missing, where Cancel Request should not be shown? → A: **No new status.** `For Delivery` already means the items are on their way; no frame or contract has another state.
- Q: Should an Admin cancel a `For Delivery` request? → A: **No.** Cancel is offered only on `Pending Approval` (the Employee's own), `Approved` and `Ready for Pickup`. Constitution 8.0.0 IV, [ADR-0012](../../docs/adr/0012-no-admin-cancel-on-for-delivery.md). FR-005, FR-020, SC-008, Story 1 criterion 6 and Story 5 criteria 1–2 are reworded in place.
- Q: Can a request that was `For Delivery` be cancelled after it goes back to `Ready for Pickup`? → A: **Yes.** The rule reads the current status only, so a delivery that falls through is moved to `Ready for Pickup` first (edge case "Delivery falls through").

### Session 2026-09-30 — Admin cancel (BEN-135)

Raised by BEN-135, which the project owner had scoped out of BEN-47 on 2026-09-26, and decided by the project owner.

- Q: Where does Admin cancel get specified: a new feature folder, or this spec? → A: **Amend this spec** (Story 5, FR-005, FR-020–FR-023). It is one more action on the same panel, as the Admin's `Received` was on 2026-09-29.
- Q: No frame draws the control. Where does it go? → A: **The ticket's proposal, as an undrawn addition.** A secondary **Cancel Request** beside **Update Status** opens the same inline reason block as reject, labelled **Reason for cancellation \*** with **Cancel** / **Confirm Cancellation**, which is the Employee's `04.2` copy. It is logged in `docs/design-system/additions.md` and flagged to the designer.
- Q: `04.2 - Cancelled` collapses a cancelled timeline to Submitted → Cancelled, but an Admin cancel comes after approval, and sometimes after handover. What does its timeline show? → A: **The nodes it reached, then Cancelled** (FR-022). This is the same answer [drift-2026-09-29-export](../../docs/design-system/drift-2026-09-29-export.md) flag H3 proposes for History. An Employee's cancel still draws as `04.2` does. *(Revised at the rebase on `dev`, 2026-10-01: [spec 013](../013-admin-history/spec.md) FR-009a had already landed this rule, drawn from timestamps, and had amended spec 007 Story 1 criterion 4. FR-022 follows it.)*
- Q: Update Status confirms in a dialog (FR-008b); reject and the Employee's cancel do not. Does Confirm Cancellation open one? → A: **No.** It sends at once. The required reason is the deliberate step (FR-023).
- Q: What placeholder does the Admin's reason field show? The Employee's `e.g duplicate request...` fits a requester, not an unfulfillable request. → A: **An Admin-specific one:** `e.g item discontinued, no stock at this office...`. It is an undrawn addition, logged with the control.

Inferred, not asked:

- Whether `Received` can be cancelled was left open on the ticket, pending the constitution 4.0.0 amendment. Constitution 6.0.0 IV settles it, and 7.0.0 IV keeps it: **no**.
- The backend item on the ticket is met. The published contract has a cancel operation with a required reason. It lets an Admin cancel only from `Approved`, `Ready for Pickup` or `For Delivery`, and refuses every other status, `Received` included, as a conflict. The plan types the source against it and records it in `contracts/README.md`. No invented shape is needed. *(2026-10-01: constitution 8.0.0 removes `For Delivery`; the API still allows it, which is raised with the backend team.)*
- The Admin's **Other Notes** (FR-007a) are not offered with a cancel. The field is drawn only where a decision is offered.
- The reason block replaces the action row, as reject's does in `02.2.2`. So at most one of Update Status and the reason block is open at a time (Story 5 criterion 7).

### Session 2026-10-03 — Actions report in a toast

- Q: The panel stood open while an action ran, with nothing to show for it. The project owner asked that a confirmed action close the panel and report its progress and outcome in a toast. → A: **FR-013, FR-014 and FR-015 amended.** Loading, then success or the refusal, in a toast (additions.md); a refusal's toast reopens the request. In-panel refusals are retired; the field checks stay in the panel. The Employee's request panel (spec 007) is unchanged.

### Session 2026-10-03 — `/queue/:id`

- Q: The project owner asked for the Admin's review panel to have its own address, `/queue/REQ-2026-2`, which an email's *View request* reaches. → A: **FR-001b.** `/queue/:id` opens the panel, as Review does; `/requests/:id` redirects an Admin there; closing returns to `/queue`. Review itself still does not navigate (FR-001); making it write the address is a separate decision. Spec 003's deep-link amendment and ARCHITECT.md's route table follow.

## Validation

- Completeness: PASS. All four P1 stories and P2 Story 5 have acceptance criteria. Story 4 is explicitly gated.
- Clarity: PASS
- Consistency: PASS against constitution 8.0.0. FR-022 follows spec 013 FR-009a, which amended spec 007's cancelled timeline without contradicting `04.2`.
- Measurability: PASS
- Coverage: PASS. Admin cancel is in scope as of 2026-09-30.
- Edge cases: PASS. ~~CHK001 (2026-09-30): a reached node with no time from the source still shows as reached, with no time printed (FR-022).~~ Superseded at the rebase on `dev` (2026-10-01): spec 013 FR-009a draws a node only when its facts are present (FR-022).

No checklist overrides and no unresolved critical ambiguities.
