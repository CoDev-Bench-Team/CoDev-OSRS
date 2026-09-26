# Constitution

Canonical copy of the project constitution for version tracking. The binding text also lives in `AGENTS.md` under `## Constitution`. If the two drift, `AGENTS.md` wins until they are reconciled in the same change.

**Version**: 4.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-26

### I. Spec-Driven Development

All user-facing behavior MUST be specified before implementation. Agents MUST read the active `spec.md`, `plan.md`, and `tasks.md` before writing code. Chat instructions that contradict the spec MUST be treated as spec-amendment requests, not silent overrides. Implementation tasks MUST map to a functional requirement or user story.

A change in the design file is a spec-amendment request of the same kind. It MUST be diffed and recorded under `docs/design-system/` before any screen is built from it, and the amendment MUST cite that diff.

### II. Two Distinct Human Roles

The system MUST enforce two human roles — **Employee** (requestor) and **Admin** (reviews, approves or rejects, fulfils, and owns Assets and Inventory) — plus a System actor for stock movements and notifications. Each protected action MUST authorize against the role that owns that step in the process flow. A user MUST hold exactly one role.

An Admin both decides a request and hands over the stock for it. This removes the separation of duty the 2026-09-11 process diagram drew, and it is deliberate: the 2026-09-22 design file draws a single merged Admin in the navigation, the queue title, the queue subtitle and one review panel. See [ADR-0005](../docs/adr/0005-two-role-model.md); the cost is named there.

### III. Inventory Integrity

An Asset MUST exist and MUST hold stock before it can be requested. Stock is a register of **units**: one row per physical item, each belonging to an asset and held at one of the five offices the design defines. Stock per **(asset, office)** is a vector, never a single number. It is expressed as counts of that asset's units at that office by status:

- **Available**: units in `Available` status
- **Reserved**: units in `Reserved` status
- **Total** = Available + Reserved: the units still in the store. `Assigned` and `Inactive` units are not in Total.

`Total = Available + Reserved` MUST hold at all times, and no quantity MUST EVER be negative.

Submitting a request MUST move the requested number of units from `Available` to `Reserved` in the same transaction as the status change to `Pending Approval`. Rejecting or cancelling MUST move them back in the same transaction as the status change. Approving and moving to `For Delivery` or `Ready for Pickup` MUST NOT change any unit's status. Completing MUST move the reserved units to `Assigned`, with the requester as assignee, because that is when the items leave the store. Which specific units are reserved is the API's decision. Only these request transitions move a unit into or out of `Reserved`. Outside them, an Admin MAY move a unit between `Available` and `Inactive`, and MAY record an existing assignment (`Assigned`, with a user) for equipment handed out outside a request; that unit leaves the store without a request.

A request quantity MUST NOT exceed Available at the requesting office at submit time. A unit that is `Assigned` or `Reserved` MUST NOT be removed. The low-stock threshold is held per asset.

### IV. Explicit Request State Machine

A request MUST move only through the documented statuses: `Pending Approval` → (`Approved` | `Rejected`); `Approved` → (`For Delivery` | `Ready for Pickup`) → `Completed`; with `Cancelled` reachable from `Pending Approval`, `Approved`, `For Delivery` and `Ready for Pickup`. `For Delivery` and `Ready for Pickup` are peers, not a sequence. Illegal transitions MUST be rejected by the API.

Rejection MUST require a reason, and is the Admin's decision on a request awaiting one.

Cancellation is a different act and MUST be modelled as one: stopping a request that has not been refused. The owning Employee MAY cancel their own request while it is `Pending Approval`. An Admin MAY cancel an `Approved`, `For Delivery` or `Ready for Pickup` request that cannot be fulfilled. **A cancellation MUST require a reason, from whoever cancels.** A `Completed` request MUST NOT be cancelled.

`Completed` MUST be set by an Admin. The system does not ask the requester to confirm receipt.

`Rejected`, `Cancelled` and `Completed` are terminal. After rejection or cancellation the employee submits a **new** request; neither record is reopened.

### V. Notification Completeness

Every defined transition MUST send an email. The system MUST provide the templates the design defines: **Request received**, **Request approved**, **Request declined**, and a generic **Status changed** carrying the transition as a previous-status / new-status pair. One template MAY serve more than one transition — `Status changed` is the template for every transition the first three do not cover, cancellation and completion included. Recipients MUST match `docs/process-flow.md`. A successful status change with a failed notification is a defect and MUST be visible in logs.

`Welcome` and `Action required` are designed templates that are not transitions. `Welcome` MAY be sent on account creation. `Action required` presupposes a request-for-information flow that no screen draws; it MUST NOT be implemented until that flow is specified.

### VI. Independently Testable Increments

Each user story MUST be demonstrable without unfinished sibling stories once its dependencies are met. QA MUST be able to verify acceptance criteria with Playwright (UI flow) and HTTP tests (API contracts). The MVP demo path — browse catalog → request → approve/reject → set For Delivery or Ready for Pickup → complete — MUST have an end-to-end test.

### VII. Typed Contracts

The SPA MUST be TypeScript. REST request/response shapes MUST match the **backend team's published API contract**, not a contract invented in this repository. The client MUST NOT invent fields, routes, or error codes the API does not expose. Where the design file and the published contract disagree, the SPA MUST NOT paper over the gap: it MUST be raised with the backend team and recorded in `specs/001-office-supplies-mvp/contracts/README.md`. Changes that affect both stock quantity and request status MUST be atomic on the API.

### VIII. MVP Restraint

This is a 4-week internal MVP. Agents MUST NOT add features, frameworks, or infrastructure that are not in the active spec or `ARCHITECT.md`. New architectural choices MUST be recorded as ADRs under `docs/adr/`. The goal is a working demo of Dev + QA collaboration, not an asset-management platform.

The **per-unit register** is in scope: tag, serial number, office, status, assignee, purchase details, and device details. It is how Inventory holds stock (III; [ADR-0008](../docs/adr/0008-per-unit-inventory-register.md)). A unit's **BitLocker identifier** and **recovery key/PIN** are secrets under IX. Only an Admin MAY view or edit them. They MUST NEVER be shown to an Employee or written to a log.

### IX. Secrets and Internal Data

Credentials and other secrets MUST NOT be committed. Seed users for the demo are allowed in source only as non-production placeholders documented in `quickstart.md`. Office-supply request data is internal; the REST API MUST require authentication.

### Governance

- This constitution supersedes informal practice, README tips, and chat preference.
- Amendments require an update to this file and to `AGENTS.md`, with a version bump (MAJOR for removed/redefined principles, MINOR for added principles, PATCH for wording).
- A design-file change that redefines a principle MUST land as an amendment citing the drift document it came from, never as a silent edit to a screen.
- Every pull request MUST be reviewable against these principles.

## Version history

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-09-11 | Ratified: three roles, deduct-on-submit, six statuses, five notifications |
| 2.0.0 | 2026-09-15 | `Cancelled` admitted as a seventh status (IV redefined; III and V extended) |
| **3.0.0** | **2026-09-22** | **II** collapsed to Employee + Admin ([ADR-0005](../docs/adr/0005-two-role-model.md)); **III** rewritten for per-office Total/Available/Reserved stock ([ADR-0006](../docs/adr/0006-assets-and-inventory.md)); **IV** replaced `For Release`/`Released` with `For Delivery`/`For Pickup` and moved `Completed` to the Admin ([ADR-0007](../docs/adr/0007-fulfilment-status-vocabulary.md)), and made a cancellation reason always required; **V** redrawn around four transactional templates. Source: [drift-2026-09-22](../docs/design-system/drift-2026-09-22.md) |
| 3.0.1 | 2026-09-24 | **IV** wording: the pickup handover state is named **`Ready for Pickup`**, as the design's `Request Status` component names it, not `For Pickup` as the queue's filter chip did. Same state, same transitions, so PATCH. Decided by the project owner. Source: [drift-2026-09-24 §6](../docs/design-system/drift-2026-09-24.md); carried by the [ADR-0007](../docs/adr/0007-fulfilment-status-vocabulary.md) amendment |
| **4.0.0** | **2026-09-26** | **III** rewritten: stock is a register of units, and per (asset, office) Available / Reserved / Total are counts of units by status. Complete moves reserved units to `Assigned` to the requester; the numbers are unchanged from 3.0.1. The low-stock threshold is per asset; assigned or reserved units cannot be removed; only request transitions move units into or out of `Reserved`, and an Admin may set `Available` ↔ `Inactive` or record an existing assignment. **VIII** redefined: the per-unit register is in scope, and BitLocker identifier and recovery key/PIN are Admin-only secrets. Decided by the project owner (BEN-116). Source: [drift-2026-09-26 §2](../docs/design-system/drift-2026-09-26.md); carried by [ADR-0008](../docs/adr/0008-per-unit-inventory-register.md) |
