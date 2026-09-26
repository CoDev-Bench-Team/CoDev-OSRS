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
| [0008](0008-per-unit-inventory-register.md) | Inventory is a per-unit register; stock is counted from unit statuses — **amended by 0009** |
| [0009](0009-received-and-accountability-form.md) | `Received`, set by the Employee's Accountability Form; units assigned on `Received`; the Admin completes |

Template: context, decision, consequences, alternatives. See `ARCHITECT.md` §13.
