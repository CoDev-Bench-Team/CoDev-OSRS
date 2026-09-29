# ADR-0010: The Admin may also mark a handed-over request `Received`

## Status

Accepted — 2026-09-29, agreed by the team. **Amends [ADR-0009](0009-received-and-accountability-form.md)**
(decision 2's "No one can set `Received` by hand"). Constitution **6.0.0**.
**Amended by [ADR-0011](0011-admin-sets-received-employee-signs.md)**
(2026-09-29, constitution 7.0.0): the Admin's path stands; the owning Employee
now sets `Received` with **Mark as Received** rather than by the form, and
signs the Accountability Form on the `Received` request.

## Context

ADR-0009 made the Employee's Accountability Form the only way to reach
`Received`. Its first negative consequence was that a request can stall at the
handover: if the Employee never submits the form, the request never reaches
`Received`, its units stay reserved, and the Admin can never complete it.
Nothing in the MVP chases the Employee.

The Admin is the one who handed the items over, at a desk or by courier, and
often knows they have arrived before the Employee opens the app. The
Accountability Form is not built yet (spec 001 T018b; contracts conflict 5), so
today no request can reach `Received` at all.

The Admin's Update Status panel (frame `02.2.1 - Update Status`) draws a
`Status *` select. No frame draws `Received` in it.

The project owner decided, 2026-09-29.

## Decision

**1. Update Status offers `Received` from `For Delivery` and `Ready for Pickup`.**
The select keeps the two handover peers and adds `Received`. From `Approved` it
offers the two peers only, because no state is skipped.

**2. The Employee's Accountability Form still sets `Received`.** There are now
two ways in: the owning Employee's form, after which the System sets it, and
the Admin's Update Status. Whichever comes first wins; the other is refused as
a changed status.

**3. Everything else about `Received` is unchanged** (ADR-0009 decisions 4–6):
the reserved units move to `Assigned` to the requester in the same transaction,
`Received` cannot be cancelled, and it sends `Status changed` to the Employee.
The Admin completes from `Received` only.

**4. No pickup location; a confirmation dialog.** Marking `Received` keeps the
handover state and the pickup location the request already has. On a handover
state `Received` is the first option and is preselected. Every Update Status
asks in a confirmation dialog before anything is sent, and for `Received` the
dialog says it cannot be undone. *(The confirmation was added the same day at
the project owner's request.)*

## Consequences

### Positive

- A request no longer stalls because the Employee did not sign.
- The pipeline can reach `Received`, and so `Complete`, before the form ships.

### Negative

- **Receipt can rest on the word of the person who handed over.** This reopens
  the audit gap ADR-0009 closed, for the requests the Admin marks. The record
  does not say who set `Received`, because the read model has no field for it
  and the contract exposes none.
- **An Admin can still assign units by mistake.** `Received` is irreversible:
  it assigns the units and cannot be cancelled. The confirmation dialog, and
  `Received` being preselected, make it one click away from the form; the
  dialog's warning is the only guard.
- **The contract does not expose it.** Conflict 5 already asks for `Received`;
  it now also asks for an Admin transition to it.

### Neutral

- The Update Status select has a third option on handover states. It is undrawn
  and logged in `docs/design-system/additions.md` §3h.

## Alternatives Considered

**Keep `Received` Employee-only (ADR-0009 as it stood).** Rejected by the
project owner: it leaves stalled requests with no way forward but cancellation,
which releases units the Employee already holds.

**A separate "Mark as received" action.** Not chosen: the owner asked for it in
the existing select, behind the same confirmation as the other targets.

## References

- [ADR-0009](0009-received-and-accountability-form.md)
- `AGENTS.md` — constitution 6.0.0, principles II and IV
- `docs/process-flow.md` — Status Values
- spec 001 FR-012a; spec 008 FR-008, FR-008a
