# ADR-0011: The Admin or the owning Employee sets `Received`; the Employee signs the Accountability Form on it; the Admin completes once signed

## Status

Accepted — 2026-09-29. **Amends [ADR-0009](0009-received-and-accountability-form.md)**
decisions 2 and 3. Decisions 1, 4, 5, 6 and 7 stand. **Amends
[ADR-0010](0010-admin-marks-received.md)**: the Admin's Update Status path to
`Received` stands, and the Employee's form no longer sets `Received` — the
Employee's own path is **Mark as Received**. Constitution **7.0.0**.

## Context

ADR-0009 made the Employee's Accountability Form the thing that *sets*
`Received`: the form was offered on `For Delivery` / `Ready for Pickup`, and the
System moved the request on when it was accepted. It recorded that the design
reads the other way round: `04.1` draws **Sign accountability form** on a
request that is already `Received`, and the `Status changed email - Received`
("Equipment Delivered/Claimed") tells the Employee that IT has issued the items
and asks them to review and sign in the portal. The owner rejected that reading
on 2026-09-26.

Building the form (BEN-136, spec 012) put the question back in front of the
project owner, who decided on 2026-09-29 to follow the design's order.

## Decision

**1. The Admin or the owning Employee sets `Received`.** Once the items are
handed over, either the Admin (with the Update Status panel) or the owning
Employee (with **Mark as Received** on their own request, after a confirmation
step) moves a `For Delivery` or `Ready for Pickup` request to `Received`. No
other actor sets it. *(Widened to the Employee on 2026-09-29 by the project
owner, before this ADR was merged.)*

**2. The units move to `Assigned` on `Received`**, in the same transaction, as
ADR-0009 decision 4 already says. Only who triggers the move changes.

**3. The Employee signs on `Received`.** The owning Employee signs the
Accountability Form on their own `Received` request. Signing **records the
acknowledgement** (the typed full name and the time) and **does not change the
status**. A request is signed once. No other actor may sign.

**4. The Admin completes only once the form is signed.** **Complete** is
offered on a `Received` request whose Accountability Form has been signed, and
refused otherwise.

**5. Signing sends no email.** It is not a status transition (constitution V).
The `Received` transition sends `Status changed`, the design's *Equipment
Delivered/Claimed* email that asks the Employee to sign.

## Consequences

### Positive

- Every drawn frame and the `Received` email now agree with the written
  machine: `04.1`'s link on a `Received` request, and an email that asks for
  the signature after the handover.
- Stock leaves the store when the handover is recorded, by the Admin or the
  Employee, which is when it physically leaves. It no longer waits on the
  Employee's signature.

### Negative

- **A signed acknowledgement is a new fact on the request**, separate from its
  status. The contract has to carry it (whether it is signed, and when), and
  the Admin's Complete has to be refused without it.
  [contracts/README.md](../../specs/001-office-supplies-mvp/contracts/README.md)
  conflict 5 is rewritten.
- **A request can stall at `Received`.** If the Employee never signs, the Admin
  cannot complete, and a `Received` request cannot be cancelled. The items are
  already assigned, so no stock is stuck, but the request stays open. The MVP
  has no reminder or timeout.
- When the Admin marks `Received`, the record of handover rests first on the
  Admin's word, and the Employee's signature follows it. When the Employee
  marks it, the two steps are both theirs.
- **An Employee can assign units to themselves** by marking `Received`. It is
  only possible on their own request once an Admin has approved and handed it
  over, and it is confirmed before it is sent.

### Neutral

- The timeline is unchanged: Submitted → Approved → handover → Received →
  Complete. It shows no separate "signed" node.
- The Admin's Update Status panel gains `Received` as a target from the
  handover states, and its Complete action gains the signed guard. That panel
  is not built on this branch (spec 001 T017/T018; BEN-47).

## Alternatives Considered

**Signing moves `Received` to `Completed`** (the System completes on
signature). This is what the design's Status Definitions table says. It was
rejected: the owner kept Complete with the Admin.

**Assign the units on signing.** Rejected: delivered items would still count as
Reserved until the Employee signs.

**Keep ADR-0009** (the form sets `Received`). Rejected by the owner on
2026-09-29.

## References

- [spec 012](../../specs/012-accountability-form/spec.md), Clarifications, Session 2026-09-29
- [drift-2026-09-26 §3](../design-system/drift-2026-09-26.md)
- `AGENTS.md`: constitution 7.0.0, principles II, III, IV, VI
