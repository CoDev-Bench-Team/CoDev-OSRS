# ADR-0012: An Admin cannot cancel a `For Delivery` request

## Status

Accepted — 2026-10-01. Constitution **8.0.0**. Narrows the Admin cancel that
[ADR-0007](0007-fulfilment-status-vocabulary.md)'s state machine drew from both
handover states, and that constitution 3.0.0 to 7.0.0 IV carried.

## Context

Constitution 7.0.0 IV let an Admin cancel an `Approved`, `For Delivery` or
`Ready for Pickup` request that cannot be fulfilled. Building the Admin cancel
(BEN-135, spec 008 Story 5) put the rule in front of the project owner, who
asked whether a request already out for delivery should still offer **Cancel
Request**.

The two handover states differ in where the items are:

- **`Ready for Pickup`**: the items wait at a pickup location in the office.
  They are still in the store's hands, so stopping the request and releasing
  its reserved units back to `Available` matches what is on the shelf.
- **`For Delivery`**: the items have gone out with the delivery. Cancelling
  would put the units back to `Available` while they are not in the store, so
  the register would claim stock that cannot be handed to anyone.

No status between `For Delivery` and `Received` is drawn or published, and the
owner decided not to add one ("On Delivery" was considered and dropped).
`For Delivery` already means the items are on their way.

## Decision

**1. An Admin may cancel only `Approved` and `Ready for Pickup`.** `For
Delivery`, like `Received` and `Completed`, cannot be cancelled. The owning
Employee's cancel, while `Pending Approval`, is unchanged.

**2. The rule reads the current status only.** A delivery that falls through
and comes back is first moved to `Ready for Pickup` with Update Status, the
peer swap that already exists, and can then be cancelled. That step records
that the items are back in the office before the reservation is released.

**3. The API must refuse it.** Constitution IV requires the API to reject an
illegal transition. The published contract still lets an Admin cancel
`for_delivery`; that is raised with the backend team in
[contracts/README.md](../../specs/001-office-supplies-mvp/contracts/README.md).
Until the API changes, the SPA does not offer the action.

## Consequences

### Positive

- The register no longer shows units as `Available` that are out with a
  delivery.
- The panel's action row for `For Delivery` is just **Update Status**: on to
  `Received`, or back to `Ready for Pickup`.

### Negative

- **Cancelling a failed delivery takes two steps** (Update Status to `Ready for
  Pickup`, then Cancel), and two `Status changed` emails.
- **The SPA is narrower than the published API** until the backend refuses
  `for_delivery` too. A client other than this SPA could still cancel one.
- History may hold requests cancelled from `For Delivery` before this change.
  The seed is changed to match the new rule; real data has none yet, because
  the API is not integrated.

### Neutral

- No new status, template or stock rule. Cancel still releases the
  reservation in the same transaction (constitution III).

## Alternatives Considered

**Add an `On Delivery` status between `For Delivery` and `Received`.** Rejected
by the project owner: no frame draws it, the contract does not publish it, and
`For Delivery` already covers the period.

**Block cancel on any request that was ever `For Delivery`.** Rejected: it needs
history on the request and a matching backend rule, and it leaves a failed
delivery with no way to be stopped.

## References

- `AGENTS.md`: constitution 8.0.0, principle IV
- `docs/process-flow.md`: §3b Cancel, Status Values
- [spec 008](../../specs/008-request-review-panel/spec.md): FR-020, Session 2026-10-01
- [spec 001](../../specs/001-office-supplies-mvp/spec.md): FR-010b
