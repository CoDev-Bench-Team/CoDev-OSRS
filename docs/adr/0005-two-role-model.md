# ADR-0005: Employee and Admin — two human roles

## Status

Accepted — 2026-09-22. **Supersedes [ADR-0003](0003-three-role-model.md).**

## Context

ADR-0003 split the proposal's single "Admin" into **Approver** (team lead /
department head) and **Supply Admin** (IT / General Services), on the strength
of the 2026-09-11 process-flow diagram. Constitution II then made that split
binding and forbade a combined Admin.

The 2026-09-15 re-export already drew a merged admin bar. That was treated as a
drift to override, because a bar is weak evidence against a diagram.

The 2026-09-22 re-export draws the merged role three more times, and not as
navigation chrome:

- `Top Navigation` Admin variant: **Requests Queue · Assets · Inventory ·
  History**, account cluster reading *Ethan Cruz — Admin*.
- `02 - Requests Queue`, subtitled **"Review, approve, and fulfill supply
  requests"**, with summary cards for *Pending approval*, *In Processing* and
  *Low stock alerts* side by side.
- `02.2 - Requests Queue - Review`, a **single** panel whose actions are
  **Reject Request** / **Approve Request**, and which after approval offers
  **Update Status** and then **Complete**.

One screen, one role, both halves of the pipeline. There is no second queue for
a fulfilment-only actor anywhere in the file, and the employee's own request
panel offers no confirm-receipt action for the pipeline to hand back to.

See [drift-2026-09-22 §2](../design-system/drift-2026-09-22.md) for the evidence
and the timestamps.

## Decision

Persist a single `role` per user: **`employee` | `admin`**.

- **Employee** — browses the catalog, builds a request list, submits, tracks
  their own requests, and cancels their own request before it is handed over.
- **Admin** — reviews the queue, approves or rejects, moves an approved request
  to `For Delivery` or `For Pickup`, completes it, cancels a request that
  cannot be fulfilled, and owns Assets and Inventory.
- **System** remains the non-human actor for stock movements and mail.

`approver` and `supply_admin` are retired. Seed two demo users, one per role.

## Consequences

### Positive

- Matches every screen in the current design file; nothing in the SPA has to
  override the drawn navigation any more.
- One queue instead of two. The fulfilment queue that BEN-47 was opened for is
  no longer a missing screen — it is the same screen.
- Fewer logins for QA: two, not three.

### Negative

- **The control point ADR-0003 existed to protect is gone.** One Admin can
  approve a request and release the stock for it. There is no separation of
  duty between judging necessity and handing over goods.
- `docs/product.md`'s "the process diagram splits the old combined Admin" note
  is now historical rather than current.
- A later decision to restore the split is a schema and authorization change,
  not a UI change.

### Neutral

- The request drawer's **"Note to Approver (optional)"** label is now the only
  place in the product that says *Approver*. Flagged to the designer
  ([drift-2026-09-22 §8](../design-system/drift-2026-09-22.md)); until it is
  renamed, the SPA renders the drawn copy.

## Alternatives Considered

**Keep the three-role split and override the design a second time.** Rejected
by the project owner on 2026-09-22: the file has now drawn the merged role in
navigation, in a page title, in a subtitle and in a single review panel, and
overriding all four is not a drift correction, it is a different product.

**Admin as a superuser layered over Approver and Supply Admin.** Rejected —
that is the role hierarchy ADR-0003 already declined as overkill for an MVP,
and it would leave two roles nothing draws.

## References

- [drift-2026-09-22 §2](../design-system/drift-2026-09-22.md)
- `AGENTS.md` — constitution 3.0.0, principle II
- `ARCHITECT.md` §7 (authorization matrix)
- [ADR-0003](0003-three-role-model.md) (superseded)
