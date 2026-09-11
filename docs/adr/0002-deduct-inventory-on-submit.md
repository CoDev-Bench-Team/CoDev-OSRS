# ADR-0002: Deduct inventory when the request is submitted

## Status

Accepted

## Context

Inventory could be reserved at approve time (common in procurement) or at submit time. The process diagram is explicit: deduct on submit (`Pending Approval`), restore on reject, leave deducted through approve/release/complete.

## Decision

**On-hand quantity decreases at submit** in the same atomic operation that creates the request in `Pending Approval`. Reject increments by the same line quantities. Approve, prepare, release, and complete do not touch quantity.

Concurrent submits MUST NOT drive on-hand below zero (one succeeds; others fail with insufficient stock).

## Consequences

### Positive

- Matches the published process diagram and Linear inventory rules
- Pending requests cannot oversell the same last unit
- Reject has a clear compensating action

### Negative

- Stock is reserved even while waiting for approval (items look unavailable to others)
- A forgotten pending request holds stock until someone rejects or a later ops policy is added (not in MVP)

### Neutral

- “Available to request” equals current on-hand; there is no separate reserved column in MVP

## Alternatives Considered

**Deduct on approve** — rejected: contradicts the diagram (submit already deducts; reject restores).

**Soft reserve + deduct on release** — more accurate warehousing; too much model for MVP.

## References

- `docs/process-flow.md`
- Linear initiative: inventory rules 1–4
