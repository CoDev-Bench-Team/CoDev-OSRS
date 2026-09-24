# ADR-0007: One handover state (For Delivery / For Pickup), completed by the Admin

## Status

Accepted — 2026-09-22.

## Context

Constitution 2.0.0 ran the tail of the pipeline as
`Approved → For Release → Released → Completed`, with the owning Employee
setting `Completed` by confirming receipt. `Ready for Pickup` and `For Delivery`
were presentational labels on `Released` (spec 002, D5).

The 2026-09-22 file disagrees in three places at once:

- The **`Status Timeline`** component has four nodes:
  *Submitted · Approved · For Delivery/For Pickup · Complete*.
- **`02.2.1 - … - Update Status`** offers a `Status *` **select** whose drawn
  value is *For Delivery* — a choice between alternatives, not a sequence — and
  a second frame of the same panel whose only button is **Complete**.
- The **Requests Queue** filters by them:
  `All requests (238) · Pending Approval (7) · Approved (7) · For Delivery (7) ·
  For Pickup (7)`. A filter chip is bound to a stored value, not to a label.

And the employee's `04.1 - My Requests - View Request` panel has exactly one
action: **Cancel Request**. No confirm-receipt control exists in the file.

See [drift-2026-09-22 §3](../design-system/drift-2026-09-22.md).

## Decision

**1. One handover state with two forms.** After `Approved`, the Admin sets
either **`For Delivery`** or **`For Pickup`**. They are peers, not a sequence.
`For Release` and `Released` are retired.

**2. The Admin completes the request.** `Completed` is set from the Update
Status panel's **Complete** action, by an Admin, not by the requester. The
employee's confirm-receipt step is withdrawn.

**3. Pickup location survives.** When the Admin chooses `For Pickup`, a pickup
location is recorded — it is the **Pickup** row the `Status changed email`
prints ("6th floor IT desk").

**4. The state machine becomes:**

```
Pending Approval ──approve──► Approved ──► For Delivery ─┐
        │                        │         For Pickup   ├──complete──► Completed
        │ reject                 │                       │
        ▼                        └───────────────────────┘
     Rejected              cancel (Admin, reason) ──► Cancelled
        │
        └── cancel (Employee, reason, while Pending Approval) ──► Cancelled
```

`Rejected`, `Cancelled` and `Completed` are terminal.

## Consequences

### Positive

- One fewer state, and the remaining ones are all things a filter chip can
  count — which is how the queue is drawn.
- The timeline component, the status select and the filter chips finally agree
  with the written machine.

### Negative

- **Nobody confirms receipt.** The MVP demo path loses its last employee step,
  and the system records that items were handed over on the word of the person
  who handed them over. SC-001 changes shape accordingly.
- Spec 001 FR-012 is withdrawn; anything written against "owning Employee moves
  Released to Completed" is stale, including the parts of spec 002 D5 that made
  pickup and delivery mere labels.
- `Completed` is now where stock actually leaves (see
  [ADR-0006](0006-assets-and-inventory.md)), so the terminal transition is no
  longer inventory-neutral.

### Neutral

- `src/shared/ui/status.ts` keeps seven request statuses; two names change and
  the tone map gains no new colour — `For Delivery` and `For Pickup` both read
  as *moving*.

## Alternatives Considered

**Keep `Released` and treat For Delivery / For Pickup as labels on it**, as
spec 002 D5 did. Rejected: the queue filters by them, and a filter chip counts a
stored value.

**Keep the employee confirm-receipt step and add it to the design.** Rejected by
the project owner on 2026-09-22 — the instruction was to honour the file, and
the file gives the employee no such control. Recorded here as the obvious thing
to restore if the audit trail matters more than the drawn flow.

## References

- [drift-2026-09-22 §3](../design-system/drift-2026-09-22.md)
- `AGENTS.md` — constitution 3.0.0, principle IV
- `docs/process-flow.md` — Status Values
- `src/shared/ui/status.ts`
