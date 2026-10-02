# Architecture Decision Records

Significant HOW decisions for OSRS. New ADRs get the next number and `Accepted` only after the team agrees.

| ID | Title |
|----|--------|
| [0001](0001-spa-rest-api.md) | SPA consumes REST owned by the backend team |
| [0002](0002-deduct-inventory-on-submit.md) | Deduct inventory on submit |
| [0003](0003-three-role-model.md) | Separate Approver and Supply Admin — **superseded by 0005** |
| [0004](0004-client-routing.md) | Client-side routing via React Router v7 |
| [0005](0005-two-role-model.md) | Employee and Admin — two human roles |
| [0006](0006-assets-and-inventory.md) | Assets and Inventory are separate; per-office stock, reserved on submit — **partly superseded by 0008** |
| [0007](0007-fulfilment-status-vocabulary.md) | One handover state (For Delivery / For Pickup), completed by the Admin — amended 2026-09-24: `Ready for Pickup`, drawn pink/blue pills; **amended by 0009** |
| [0008](0008-per-unit-inventory-register.md) | Inventory is a per-unit register; stock is counted from unit statuses — **amended by 0009**, and with constitution 9.0.0 (2026-10-01) |
| [0009](0009-received-and-accountability-form.md) | `Received`, set by the Employee's Accountability Form; units assigned on `Received`; the Admin completes — **amended by 0010 and 0011** |
| [0010](0010-admin-marks-received.md) | The Admin may also mark a handed-over request `Received` — **amended by 0011** |
| [0011](0011-admin-sets-received-employee-signs.md) | The Admin or the owning Employee sets `Received`; the Employee signs the Accountability Form on it (no status change); the Admin completes once signed |
| [0012](0012-no-admin-cancel-on-for-delivery.md) | An Admin cannot cancel a `For Delivery` request; a failed delivery goes back to `Ready for Pickup` first |

Template: context, decision, consequences, alternatives. See `ARCHITECT.md` §13.
