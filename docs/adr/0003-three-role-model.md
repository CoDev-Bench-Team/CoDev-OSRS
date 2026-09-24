# ADR-0003: Separate Approver and Supply Admin roles

## Status

**Superseded by [ADR-0005](0005-two-role-model.md)** (2026-09-22). The
2026-09-22 design re-export draws one merged **Admin** doing both approval and
fulfilment; the project owner accepted it. Kept for the record — the control
point this ADR protected is named as a cost in ADR-0005.

Was: Accepted

## Context

The written proposal mentioned a single Admin. The process-flow diagram splits that into **Approver** (team lead / department head) and **Supply Admin** (IT / General Services), with **System** as a non-human actor. Combining them would let one person both approve necessity and fulfill stock, hiding the intended control point.

## Decision

Persist a single `role` per user: `employee` | `approver` | `supply_admin`. Authorize each pipeline action by that role. Do not ship a superuser or combined admin for MVP. Seed three demo users, one per role.

## Consequences

### Positive

- Matches the diagram the demo will be judged against
- Simplifies Playwright: three logins, three queues
- Approval and fulfillment are separately testable

### Negative

- A real person who is both lead and supply handler needs two accounts in MVP
- No role hierarchy or impersonation

## Alternatives Considered

**Single Admin** — rejected by the diagram note in the Linear brief.

**RBAC with many permissions** — overkill for three jobs.

## References

- `docs/product.md` (Who Uses It)
- `ARCHITECT.md` §7
