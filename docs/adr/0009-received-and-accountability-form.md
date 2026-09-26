# ADR-0009: `Received`, set by the Employee's Accountability Form; the Admin completes

## Status

Accepted — 2026-09-26. **Amends [ADR-0007](0007-fulfilment-status-vocabulary.md)**
(decision 2's "the employee's confirm-receipt step is withdrawn") and
**amends [ADR-0008](0008-per-unit-inventory-register.md)** (the reserved units
move to `Assigned` on `Received`, not on completion). Constitution **5.0.0**.

## Context

The 2026-09-24 export added a `Received` pill and a Status Definitions table
that made `Completed` mean "the Employee has signed the Accountability Form".
[drift-2026-09-24 §2](../design-system/drift-2026-09-24.md) held it back: it
contradicted constitution IV, ADR-0007 and FR-012a, and the file had both the
Admin and the Employee completing a request.

The 2026-09-26 export put a **`Received`** node on every drawn status
timeline — `03.1`, `04.1`, `04.2` — between the handover and `Complete`, and
added a `Status changed email - Received`
([drift-2026-09-26 §3](../design-system/drift-2026-09-26.md)). The Admin's
Update Status panel still draws one **Complete** button.

The file draws the step and not who takes it. The project owner decided.

## Decision

**1. `Received` is a status.** The machine becomes

```
Pending Approval ──approve──► Approved ──► For Delivery ─┐
        │                        │         Ready for     ├──(form)──► Received ──complete──► Completed
        │ reject                 │         Pickup ───────┘   System               Admin
        ▼                        └──── cancel (Admin, reason) ──► Cancelled
     Rejected
        └── cancel (Employee, reason, while Pending Approval) ──► Cancelled
```

**2. The Employee's Accountability Form moves the request to `Received`.** The
owning Employee submits it while the request is `For Delivery` or
`Ready for Pickup`. The System sets `Received` when the backend accepts it. No
one can set `Received` by hand.

**3. The Admin completes, from `Received` only.** The Update Status panel's
**Complete** action is unchanged in who presses it. Its guard narrows from
"`For Delivery` or `Ready for Pickup`" to "`Received`".

**4. `Received` is when the items leave the store.** The request's reserved
units move from `Reserved` to `Assigned`, with the requester as assignee, in the
same transaction as the move to `Received`, so `Total` and `Reserved` fall by
the requested quantity. `Completed` changes no unit's status. This moves
ADR-0008's "Request completed" row to `Received`.

**5. `Received` cannot be cancelled**, for the same reason `Completed` cannot:
the items are with the Employee.

**6. `Received` notifies with `Status changed`** (to the Employee), using the
file's `Status changed email - Received`.

**7. The form signs for request lines.** The file draws per-unit tags on the
form. The register is in scope (ADR-0008), but which units a request holds is
the API's decision and the contract does not expose them on a request, so the
form lists the request's items and quantities. Tags can be added when the
contract carries them.

## Consequences

### Positive

- The audit gap ADR-0007 named — "nobody confirms receipt" — is closed. The
  record of handover no longer rests only on the word of the person who handed
  over.
- Every drawn timeline, the `Received` pill and the `Received` email now agree
  with the written machine.
- Stock is consumed when the items actually leave. An Admin who is slow to
  press Complete no longer leaves delivered items counted as Reserved.

### Negative

- **A request can stall at the handover.** If the Employee never submits the
  form, the request never reaches `Received` and its stock stays reserved. The
  MVP has no reminder or timeout; the Admin can still cancel it while it is
  `For Delivery` / `Ready for Pickup`.
- **`Completed` is now inventory-neutral and mostly administrative.** It closes
  a request the Employee has already signed for.
- **The backend contract does not expose it.** It has no `Received` status and
  no form submission
  ([contracts/README.md](../../specs/001-office-supplies-mvp/contracts/README.md)
  conflict 5). The SPA can show the status and the timeline, but cannot build
  the form against the API until the contract carries it.
- The frames read the order the other way round: `04.1` and the `Received`
  email put the signature *after* `Received`. Flagged to the designer
  (drift-2026-09-26 §3).

### Neutral

- `src/shared/ui/status.ts` gains an eighth status and a `received` tone
  (`#ff8d28` on a 10% tint).
- The Requests Queue lists `Received` as live work, with no chip, because
  none is drawn.

## Alternatives Considered

**Admin marks `Received`, Employee signs to complete.** This is the reading the
frames and the email suggest. The owner rejected it: the Employee's signature
is the evidence of receipt, so it is what moves the status.

**Assign on `Completed`, as ADR-0006/0007/0008 had it.** Rejected: once the items
are signed for they are no longer in the store.

**Leave `Received` out and keep four timeline nodes** (drift-2026-09-24 §2's
default). Rejected: the owner adopted the step.

## References

- [drift-2026-09-26 §3](../design-system/drift-2026-09-26.md),
  [drift-2026-09-24 §2](../design-system/drift-2026-09-24.md)
- `AGENTS.md` — constitution 5.0.0, principles II–V
- `docs/process-flow.md` — Status Values, Stock Rules
- spec 001 FR-012, FR-012a, FR-012b
