# ADR-0003: Separate Approver and Supply Admin roles

## Status

**Superseded** by [ADR-0005](0005-google-sign-in-against-the-published-contract.md) on 2026-09-17.

The backend team's published contract issues two roles, `admin` and `employee`, and the product
owner confirmed that is the role model. Constitution II was amended to match (v3.0.0), so the
three-role requirement and the prohibition on a combined Admin no longer bind.

The control point this ADR was protecting — that approving necessity and fulfilling stock are
separate decisions — survives as separate **stages** in `docs/process-flow.md`, each with its own
transition and notification, even though one role now performs both. What is lost is the
separation of *duty*: an Admin can approve a request and then release it. That is the product
owner's call, recorded here so it is not mistaken for an oversight.

The SPA still models `approver` and `supply_admin`, so a future contract that splits `admin` needs
no amendment. The original decision is kept below for that history.

---

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
