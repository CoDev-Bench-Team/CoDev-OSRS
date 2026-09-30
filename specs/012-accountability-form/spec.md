# Feature Specification: Accountability Form (Employee confirms receipt on `Received`)

**Feature Branch**: `emmanuelr/ben-136-p2spa-accountability-form-employee-confirms-receipt-received`
**Linear**: [BEN-136](https://linear.app/bench-synergy-project/issue/BEN-136) (K0–K4 = BEN-137 to BEN-141)
**Created**: 2026-09-26
**Status**: Draft
**Sources**: `04.1 - My Requests - View Request`, Accountability Form view (2026-09-26 `.fig`, exported 02:49:27Z; [drift-2026-09-26 §3](../../docs/design-system/drift-2026-09-26.md)), constitution 7.0.0 II–VI, [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md) (amending [ADR-0009](../../docs/adr/0009-received-and-accountability-form.md)), spec 001 US5 / FR-012 / FR-012b / tasks T018b, spec 007 (Employee request panel), `docs/process-flow.md` §3 steps 5–10, `specs/001-office-supplies-mvp/contracts/README.md` conflict 5, [BEN-98](https://linear.app/bench-synergy-project/issue/BEN-98) validation format

## Overview

*(Rewritten 2026-09-29, constitution 7.0.0.)* Once a request is handed over, the owning Employee can mark it **`Received`** themselves (an Admin can too, from their own panel); that is when the units are assigned. On a `Received` request, the owning Employee then confirms that it reached them by signing the **Accountability Form** from their own request panel. Signing records the acknowledgement; the request stays `Received`. The Admin's **Complete** is refused until the form is signed.

This feature adds the form to the Employee request panel of spec 007. It does not own the panel, My Requests, the Admin's *mark received* and *Complete* actions (spec 001 tasks T017, T018), the Requests Queue, or any backend behaviour. The five-node timeline and the `Received` pill already shipped (tasks T000g).

## User Stories

### Story 0 — Mark a handed-over request received (Priority: P1)

An Employee whose request is `For Delivery` or `Ready for Pickup` has the items in hand. They open it from My Requests, press **Mark as Received**, confirm, and the request becomes `Received`, which puts **Sign accountability form** in front of them.

**Why this priority**: The Employee can move their own request to the signing step without waiting for an Admin (constitution 7.0.0 IV). It assigns the units, so it is confirmed first.

**Acceptance Criteria**:

1. **Given** the panel for the Employee's own `For Delivery` or `Ready for Pickup` request, **When** it renders, **Then** its footer offers **Mark as Received**, and no other request state offers it.
2. **Given** the Employee presses **Mark as Received**, **When** the confirmation opens in the footer, **Then** it says *"Confirm you have received every item listed above. This can't be undone."* and offers **Cancel** and **Confirm Received**. Nothing has been sent.
3. **Given** the confirmation is open, **When** the Employee presses **Cancel**, **Then** it closes with nothing sent and the status unchanged, and focus returns to **Mark as Received**.
4. **Given** the confirmation is open, **When** the Employee presses **Confirm Received**, **Then** the panel shows `Received` in its pill, its timeline (with the time) and its My Requests row; **Mark as Received** is gone; **Sign accountability form** is offered and takes focus.
5. **Given** the request changed while the panel was open (for example, an Admin cancelled it or marked it received), **When** the Employee confirms, **Then** the panel shows the system's message and the request's current status.
6. **Given** the system does not answer, **When** the Employee confirms, **Then** the panel says it was not marked received and offers **Mark as Received** again.
7. **Given** the confirmation is being sent, **When** the Employee presses **Confirm Received** again, **Then** nothing further is sent.

### Story 1 — Sign for a received request (Priority: P1)

An Employee whose request is `Received` (marked by them or by an Admin) opens it from My Requests, follows **Sign accountability form**, reads what they are signing for and the conditions, ticks the agreement, types their full name, and signs. The request stays `Received`, now signed for, and the Admin can complete it.

**Why this priority**: It is the Employee's step in the demo path (constitution VI), and the Admin's Complete waits on it (constitution IV).

**Acceptance Criteria**:

1. **Given** the panel for the Employee's own `Received` request that has not been signed, **When** it renders, **Then** it offers **Sign accountability form**, below the status timeline as `04.1` draws it. It offers no *Complete Request* button (FR-001a).
2. **Given** the Employee activates **Sign accountability form**, **When** the form opens in the panel, **Then** it shows, in order: an **EQUIPMENT ASSIGNED** list of the request's lines (item and quantity); an **ACKNOWLEDGEMENT** block carrying the eleven conditions verbatim (FR-004), in a box that scrolls; an **I have read and agree to the above** checkbox, unticked and not yet available (FR-005a); a **Type full name to sign** field, empty; and **Cancel** / **I acknowledge and sign**. It carries no *Other Notes* (Out of Scope).
3. **Given** the form is open, **When** the Employee activates **Cancel**, **Then** the panel returns to the request's read-back with nothing sent and the status unchanged, and focus returns to **Sign accountability form**.
4. **Given** the checkbox is ticked and the full name is non-blank, **When** the Employee activates **I acknowledge and sign**, **Then** the panel still shows the request as `Received` (pill, timeline, and its My Requests row), no longer offers **Sign accountability form**, and shows **Accountability form signed** with the time it was signed in its place (FR-009).
5. **Given** a signature is being sent, **When** the Employee activates **I acknowledge and sign** again, **Then** nothing further is sent: one form yields at most one signature.

### Story 2 — Refuse an incomplete signature (Priority: P1)

An Employee who has not agreed, or has not typed their name, is told what is missing and nothing is sent.

**Why this priority**: The agreement and the name are the evidence of receipt (ADR-0009); a signature without them is not one (spec 001 US5 scenario 5).

**Acceptance Criteria**:

1. **Given** the checkbox is unticked, **When** the Employee activates **I acknowledge and sign**, **Then** the checkbox shows its invalid state with a message saying the agreement is required, nothing is sent, and the status is unchanged.
2. **Given** the full name is empty or only whitespace, **When** the Employee activates **I acknowledge and sign**, **Then** the name field shows its invalid state with a message saying the name is required, nothing is sent, and the status is unchanged.
3. **Given** both are missing, **When** the Employee signs, **Then** both fields show their messages at once.
4. **Given** a field is showing its message, **When** the Employee corrects that field, **Then** its message clears.

### Story 2a — Read before agreeing (Priority: P1)

The Employee cannot tick the agreement until they have scrolled the acknowledgement to its end. If they try to tick it early, they are told to read it first.

**Why this priority**: The signature says *I have read and agree to the above*. Gating the box on reaching the end of the text makes the first half of that claim harder to skip. It is the project owner's requirement (Clarifications, Session 2026-09-26).

**Acceptance Criteria**:

1. **Given** the form has just opened and the acknowledgement has not been scrolled to its end, **When** it renders, **Then** the checkbox is shown as unavailable: announced as disabled, still focusable, and not tickable.
2. **Given** the checkbox is unavailable, **When** the Employee clicks it or presses Space on it, **Then** it stays unticked and a message under it says to read the acknowledgement to the end first.
3. **Given** the Employee scrolls the acknowledgement to its end (by pointer, wheel, touch or keyboard), **When** the end comes into view, **Then** the checkbox becomes available, and the read-first message clears if it was showing.
4. **Given** the checkbox has become available, **When** the Employee scrolls back up, **Then** it stays available and keeps its state.
5. **Given** the whole acknowledgement fits in its box without scrolling (for example, at a large viewport or with a small text size), **When** the form opens, **Then** the checkbox is available at once.
6. **Given** the Employee signs before reaching the end, **When** the form refuses (Story 2 scenario 1), **Then** the checkbox's message is the read-first one, not the agreement-required one.

### Story 3 — Show a refusal from the system (Priority: P1)

The backend can refuse a well-formed signature — most often because the request changed while the form was open. The Employee sees why, in the system's words, and where the request now stands.

**Why this priority**: Constitution VII: the SPA shows the system's refusal and does not invent its own.

**Acceptance Criteria**:

1. **Given** the request changed while the form was open (for example, it was signed from another tab), **When** the Employee signs, **Then** the signature is refused, the panel shows the system's message, the form is closed, and the panel shows the request's current status.
2. **Given** the system refuses with errors that name a form field, **When** the refusal arrives, **Then** each message appears under the field it names; any message that names no field appears at the top of the form.
3. **Given** the system does not answer, **When** the Employee signs, **Then** the form stays open with what they typed, a message says the signature was not sent, and they can try again.

### Story 4 — Nobody else is offered the form (Priority: P1)

Only the owning Employee, and only on their own unsigned `Received` request, is offered the form.

**Why this priority**: Constitution II and IV: no other actor may sign, and a request is signed once.

**Acceptance Criteria**:

1. **Given** the Employee's own request in `Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup`, `Completed`, `Rejected` or `Cancelled`, or a `Received` request already signed, **When** its panel renders, **Then** it offers no **Sign accountability form**.
2. **Given** an Admin, **When** they view any request anywhere in the product, **Then** they are never offered the Accountability Form.
3. **Given** a request not owned by the signed-in Employee, **When** anything is rendered, **Then** no form is offered for it (My Requests never lists it; spec 001 US6 scenario 3).
4. **Given** a `Received` request, **When** its panel renders, **Then** it offers no **Cancel Request** (constitution IV: `Received` cannot be cancelled).

### Edge Cases

- **Panel closed with the form open** (✕, Esc or scrim): the unsent form is discarded, nothing is sent, and the status is unchanged. Reopening the request starts a fresh form.
- **Name with surrounding whitespace**: accepted; what is sent is the name as typed less leading and trailing whitespace.
- **Already signed when signed** (for example, in another tab): refused as in Story 3 scenario 1; the panel shows the request as signed, and the acknowledgement is recorded once (spec 001 edge case "Duplicate Accountability Form").
- **Very long name**: whatever limit the system sets is shown as its field message (Story 3 scenario 2). The SPA invents no limit.
- **Reopening the form** (Cancel, then **Sign accountability form** again): the gate starts over, and the checkbox is unavailable until the end is reached again.
- **Resizing or zooming while the form is open**: if the text comes to fit without scrolling, the checkbox becomes available. A checkbox that is already available never becomes unavailable again.
- **Refresh after a successful signature**: the request reads back as signed from the source, not from memory.
- **The Employee never signs**: the request stays `Received` with the link on offer, and the Admin cannot complete it. No reminder or timeout (Out of Scope).
- **Loading and failure of the panel itself**: unchanged from spec 007.

## Functional Requirements

- **FR-001**: The Employee request panel MUST offer **Sign accountability form** if and only if the signed-in user is an Employee, owns the request, the request is `Received`, and it has not been signed. *(Rewritten 2026-09-29; was `For Delivery` / `Ready for Pickup`.)*
- **FR-001a**: The Employee request panel MUST NOT offer a *Complete Request* control in any state. `04.1` draws one, but only an Admin completes (constitution IV).
- **FR-002**: Activating it MUST replace the panel's read-back with the Accountability Form, in the same panel, without changing the address.
- **FR-003**: The form's **EQUIPMENT ASSIGNED** list MUST show each request line's item and quantity, as the panel's read-back names them. It MUST NOT show per-unit tags (ADR-0009 decision 7).
- **FR-004**: The **ACKNOWLEDGEMENT** block MUST carry this text, as a numbered list between its lead-in and closing line. The eleven conditions are the project owner's text of 2026-09-26, which replaces the ten `04.1` draws; the lead-in and closing line are `04.1`'s (Clarifications, Session 2026-09-26):

  > By affixing your signature below you hereby agree to the following conditions:
  >
  > 1. It is expected that you will have to take care of the unit. You are responsible for maintaining the equipment/item(s) in working condition while it is in your possession.
  > 2. That you agree and understand that if the equipment/item(s) are stolen, vandalized, misplaced, destroyed, damaged, or lost, you will reimburse CoDev the amount required to replace or repair them through salary deduction. The amount is based on the current market value minus the wear and tear of the equipment.
  > 3. The issued equipment/item(s) will be returned in the same working condition upon request or at the termination of employment.
  > 4. That failure to return the above item(s) will be considered as theft by the company and may lead to criminal and/or civil prosecution. All fees in relation to recovery will be charged to you.
  > 5. That you will not attempt to modify, alter, or upgrade the equipment/item(s) unless approved by CoDev and facilitated by authorized IT personnel.
  > 6. You agree to immediately report to CoDev within twenty-four (24) hours any technical malfunction, loss, or damage involving the equipment/item(s), and to return the equipment/item(s) to the office upon the instruction of the IT Department for further inspection or checking.
  > 7. That you will cover the shipping cost of returned equipment/item(s) to CoDev.
  > 8. That you will submit yourself to regular IT audit, permit remote access to the machine anytime if needed, and have no expectation of privacy.
  > 9. Any installation of software from the day the machine was issued shall be administered or performed by authorized IT personnel.
  > 10. On-site employees shall not bring assigned peripherals, laptops, or machines outside the office premises. When necessary, prior written approval from the corresponding client, supervisor, and IT Department must first be obtained.
  > 11. Failure to return company-issued machines, peripherals, and other items mentioned above upon clearance or separation from the company may result in the withholding of the employee’s final pay and Certificate of Employment (COE) until such items are returned in good working condition.
  >
  > For your information and guidance.

- **FR-005**: The form MUST require the **I have read and agree to the above** checkbox to be ticked and **Type full name to sign** to be non-blank, where whitespace-only counts as blank.
- **FR-005a**: The checkbox MUST be unavailable until the acknowledgement has been scrolled to its end, or at once when the text fits without scrolling. Once available it MUST stay available for as long as the form is open. While unavailable, it MUST stay focusable, MUST be announced as disabled, and MUST NOT tick. Clicking it, or pressing Space on it, MUST show a message under it saying to read the acknowledgement to the end first. The message MUST clear when the box becomes available.
- **FR-006**: The form MUST refuse to send while FR-005 is unmet, showing a message under each unmet field, and MUST clear a field's message once that field is corrected.
- **FR-007**: A valid signature MUST send the agreement and the full name (trimmed) for that request, and nothing else the contract does not define (constitution VII).
- **FR-008**: The form MUST send at most one signature per open form; a second activation while one is in flight MUST be ignored.
- **FR-009**: On acceptance, the panel MUST re-read the request. It stays `Received` in its pill, timeline and My Requests row; the panel MUST no longer offer **Sign accountability form** or **Cancel Request**, and MUST show **Accountability form signed** with the time it was signed where the link was. Any signed `Received` request shows the same line. *(Rewritten 2026-09-29.)*
- **FR-010**: On a refusal that says the request changed, the panel MUST show the system's message, close the form, and show the request's current status.
- **FR-011**: On a refusal carrying field-level errors in the BEN-98 format, the form MUST show each under the field it points at, and any that point at no field at the top of the form.
- **FR-012**: When the system does not answer, the form MUST stay open with its values, say the signature was not sent, and allow a retry.
- **FR-013**: No Admin surface MUST offer the Accountability Form or the Employee's **Mark as Received**, and the form MUST NOT change the request's status. *(Rewritten 2026-09-29: the Admin now sets `Received`, spec 001 FR-012a.)*
- **FR-014**: The form MUST be reachable and operable by keyboard alone; the checkbox and fields MUST have visible labels and announce their required and invalid states.
- **FR-016**: The Employee request panel MUST offer **Mark as Received** if and only if the signed-in user is an Employee, owns the request, and the request is `For Delivery` or `Ready for Pickup`. It sits in the panel footer, full width, where **Cancel Request** sits on a pending request.
- **FR-017**: **Mark as Received** MUST open a confirmation in the footer before anything is sent: *"Confirm you have received every item listed above. This can't be undone."*, **Cancel** and **Confirm Received**.
- **FR-018**: **Confirm Received** MUST send at most one request per confirmation. On acceptance the panel MUST re-read the request and show `Received` (pill, timeline with time, list row), offer **Sign accountability form**, and move focus to it.
- **FR-019**: A refusal saying the request changed MUST close the confirmation, show the system's message (or SPA copy when there is none) and the request's current status. When the system does not answer, the panel MUST say the request was not marked received and offer **Mark as Received** again.
- **FR-015**: Until the backend contract exposes `Received` and the form submission (contracts/README.md conflict 5), the form MUST sign — and **Mark as Received** MUST mark — against a seeded source that follows the same rules (signing: owner-only, unsigned `Received` only, records the signed time and leaves the status alone; marking: owner-only, `For Delivery` / `Ready for Pickup` only, sets `Received` with its time) — behind the seam the Employee request panel already reads through, so the contract-backed source replaces it without changing the form.

## Out of Scope

- The Admin's **mark received** and **Complete** actions, including Complete's wait for the signature (spec 001 FR-011, FR-012; tasks T017, T018), and the queue's treatment of `Received` (shipped, T000g).
- Per-unit tags on the form's lines, and any per-unit register UI (ADR-0009 decision 7).
- **Other Notes.** `04.1` draws it as a read-only card between EQUIPMENT ASSIGNED and ACKNOWLEDGEMENT, a note from the Admin side. It is not an Employee field, and nothing supplies it yet. Waits on a design change (Clarifications, Session 2026-09-26).
- The drawn *Complete Request* button on the Employee panel (FR-001a).
- Reading back the signed name after signing. The signed time is shown (FR-009; Clarifications, Session 2026-09-29).
- A reminder, timeout or escalation for an unsigned form (ADR-0011, negative consequences).
- Drawing, stylus or image signatures: the signature is the typed full name.
- Profile's *Currently Assigned* list reacting to the signature (spec 006 / spec 001 US8).
- The `Status changed` email for `Received`: sent by the API (constitution V). The SPA shows status only.
- Any invented route, payload field or error code (constitution VII).

## Success Criteria

- **SC-001**: **Sign accountability form** is offered on exactly the seeded Employee's own unsigned `Received` request, and on no other request, state or role.
- **SC-002**: With the checkbox unticked, the name blank, or the name only whitespace, signing sends nothing and the status is unchanged — in every combination.
- **SC-003**: A valid signature on the seeded unsigned `Received` request leaves it `Received` in the panel pill, timeline and list row, removes the sign link, shows **Accountability form signed** with a time, and offers no cancel control.
- **SC-004a**: A signature refused because the request changed shows the system's message and the request's current status. Refusal messages that name no field show at the top of the form. *(Proven in K2.)*
- **SC-004b**: A field-level refusal shows each message under the field it names. *(Proven in K3, once the contract names the form's fields; until then no pointer maps to a field, constitution VII.)*
- **SC-005**: Double activation of **I acknowledge and sign** produces one signature.
- **SC-006**: The form's lead-in, eleven conditions and closing line match FR-004 word for word.
- **SC-008**: **Mark as Received** is offered on exactly the seeded Employee's own `For Delivery` and `Ready for Pickup` requests. Cancel sends nothing. Confirming shows `Received` in the pill, timeline and row, and offers **Sign accountability form**, focused. A double confirm sends once. A request changed meanwhile shows the system's message and its current status.
- **SC-006a**: On opening, the checkbox cannot be ticked, and clicking it or pressing Space shows the read-first message. After the acknowledgement is scrolled to its end, the checkbox can be ticked, and it still can after scrolling back up. When the text fits without scrolling, it can be ticked at once.
- **SC-007**: `npm run verify` proves SC-001 to SC-008 (SC-004b from K3) through a check script for the form, and `check-request-detail` still passes.

## Clarifications

### Session 2026-09-26

Raised while specifying BEN-136. Constitution I requires the first to be recorded as an amendment, because it contradicts a sentence in two governing documents.

- Q: contracts/README.md conflict 5 says the SPA "does not build the form" until the contract carries it, and spec 001's `Received` session says "the form is specced and not built". BEN-136 says build it now against a seeded source. Which wins? → A: **Build it now, behind the seam** (FR-015), as specs 007 and 011 do. The contract-backed source replaces the seeded one in K3 (BEN-140). Conflict 5 and spec 001 are amended to say so; the contract gap itself stays open.
- Q: After signing, does the panel read back the signed name and time? → A: **No.** It reads back status and timeline only. The contract exposes none of them, and `04.1` does not clearly draw a signed read-back. Added to Out of Scope.
- Q: BEN-136's "Open: which transition consumes stock" — `Received` or `Completed`? → A: **Already settled: `Received`.** Constitution 5.0.0 III, ADR-0009 decision 4 and spec 001 FR-012a, decided by the project owner under BEN-43 after BEN-136 was written. The form's UI does not depend on it; the seeded source does not model stock.
- Q: The ticket cites constitution 4.0.0 and "ADR-0008 (received-and-accountability-form)". → A: Renumbered on merge: the governing text is **constitution 5.0.0** and **ADR-0009**. ADR-0008 is the per-unit register.

### Session 2026-09-26 — from planning (the `04.1` node tree)

Raised when `/create-plan` decoded `04.1` from the 2026-09-26 `.fig`: the form view is a 564px panel, and two drawn elements contradict the governing text.

- Q: `04.1` draws **Other Notes** as a read-only summary card holding "With laptop bag, mouse, mousepad and charger". process-flow §3, spec 001 FR-012b and this spec had it as an optional Employee field. Which? → A: **It is a note from the Admin side. Omit it for now and wait for the design to change.** Withdrawn from this spec, from spec 001 FR-012b and its Request entity, from process-flow §3 step 5 and from contracts/README.md conflict 5.
- Q: `04.1`'s Employee panel draws a full-width **Complete Request** footer button beside the **Sign accountability form** link. → A: **Omit it.** The link is the only way in. A *Complete* control would name an act only the Admin takes (FR-001a).

- Q (plan analysis A1): SC-004's field-level half cannot be proven before the contract names the form's fields. → A: **Split it**: SC-004a in K2, SC-004b in K3.

### Session 2026-09-29 — Amendment (the Admin sets `Received`; constitution 7.0.0)

Raised by the project owner after seeing the form on the seeded data: the link should show only on a `Received` request, as `04.1` draws it. That reverses the 2026-09-26 decision (ADR-0009), so it is recorded as an amendment and carried by constitution **7.0.0** and [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md).

- Q: Where is **Sign accountability form** offered? → A: **Only on the owner's `Received` request**, and only until it is signed.
- Q: Who sets `Received`? → A: **The Admin**, with Update Status, **or the owning Employee**, with **Mark as Received** on their own request (Story 0), from `For Delivery` / `Ready for Pickup`. The units become `Assigned` then.
- Q: What is the Employee's control? → A: **A full-width *Mark as Received* button in the footer, behind an inline confirmation** (*Cancel* / *Confirm Received*), as the cancel flow does. Not drawn; additions §3i.
- Q: What does signing do? → A: **It records the acknowledgement; the status stays `Received`.** The Admin's Complete is refused until the form is signed.

Recorded as a default, not asked: because signing no longer changes the status, the panel shows **Accountability form signed** with its time where the link was (FR-009), or nothing would tell the Employee it worked. This reverses the 2026-09-26 "status and timeline only" answer for the signed time; the signed name is still not read back. The seeded `Completed` request counts as signed, and the seeded `Received` request (REQ-2026-1820) is unsigned. For Delivery and Ready for Pickup requests no longer offer the link.

### Session 2026-09-26 — Amendment (conditions text, read-to-the-end gate)

Given by the project owner after the plan was finalized. Constitution I: the text departs from `04.1`, so it is recorded here and in `docs/design-system/additions.md`, and flagged to the designer.

- Q: Whose conditions does the form carry? → A: **The project owner's eleven**, which replace the ten `04.1` draws. What changed: the wording of 1–6 and 8; the design's 9 (monitoring-software cost for work-from-home employees) is dropped; the design's 10 becomes 9; and 10 (on-site employees keep peripherals in the office) and 11 (final pay and COE withheld until items are returned) are new. The drawn 6 gains the duty to return items for IT inspection.
- Q: Keep the drawn lead-in and closing line around them? → A: **Yes, both.**
- Q: When can the Employee tick the agreement? → A: **Only after scrolling the acknowledgement to its end.** Before that, clicking the checkbox shows an error telling them to read it first (Story 2a, FR-005a).

Recorded as defaults, not asked: the gate is on the acknowledgement box's own scroll, not the panel's; it stays open once opened; text that fits needs no scroll; the name field is not gated.

Recorded as defaults, not asked: the form is a view inside the panel, not a separate dialog, as `04.1` draws it; closing the panel discards an unsent form; the SPA sets no length limit of its own.

**Flagged to the designer** (already in [drift-2026-09-26 §3](../../docs/design-system/drift-2026-09-26.md)): `04.1` draws per-unit tags on the form's lines, and its timeline puts `Received` after `Complete`. This spec follows ADR-0009 on both.

## Checklist Overrides

Dismissed 2026-09-26 at finalization:

- **CHK001** [Clarity] FR-014 names no accessibility standard. Dismissed: it follows the panel's existing keyboard and labelling behaviour (spec 007), which `check-a11y-responsive` already gates.
- **CHK002** [Consistency] SC-007 names `npm run verify` and a check script. Dismissed: the same convention as specs 007 and 011.
- **CHK003** [Coverage] The copy of the "agreement required" and "name required" messages is not fixed. Dismissed: the plan sets it, as spec 007's plan does for the cancel reason.

## Validation

- Completeness: PASS
- Clarity: PASS (CHK001 dismissed)
- Consistency: PASS. Agrees with constitution 7.0.0, ADR-0011 (amending ADR-0009) and spec 001 as amended above.
- Measurability: PASS
- Coverage: PASS (CHK003 dismissed)
- Edge cases: PASS

No unresolved critical ambiguities.
