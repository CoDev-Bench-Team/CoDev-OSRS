# CoDev-OSRS

Internal **Office Supplies Request System** for Codev. Dev and QA are delivering a 4-week MVP: a centralized request pipeline with live inventory, role-based review, and email notifications.

Agents MUST follow the constitution below. Product intent lives in `docs/product.md`. System shape lives in `ARCHITECT.md`. The active feature spec lives in `specs/001-office-supplies-mvp/`. On-demand skills (AI-SDD and others) live in `.agents/skills/` so any coding agent can load them.

## Constitution

**Version**: 2.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-15

### I. Spec-Driven Development

All user-facing behavior MUST be specified before implementation. Agents MUST read the active `spec.md`, `plan.md`, and `tasks.md` before writing code. Chat instructions that contradict the spec MUST be treated as spec-amendment requests, not silent overrides. Implementation tasks MUST map to a functional requirement or user story.

### II. Three Distinct Human Roles

The system MUST enforce three human roles — Employee (requestor), Approver (team lead / department head), and Supply Admin (IT / General Services) — plus a System actor for inventory mutations and notifications. A combined “Admin” role MUST NOT replace Approver and Supply Admin. Each protected action MUST authorize against the role that owns that step in the process flow.

### III. Inventory Integrity

Inventory quantity MUST be encoded before any request can be submitted. Submitting a request MUST decrement stock in the same transaction as the status change to `Pending Approval`. Rejecting a request MUST increment stock back in the same transaction as the status change to `Rejected`; cancelling a request MUST do the same in the same transaction as the status change to `Cancelled`, because the deducted items are not leaving the store. Approving, preparing, releasing, and completing MUST NOT change on-hand quantity. On-hand quantity MUST NEVER be negative. A request quantity MUST NOT exceed available stock at submit time.

### IV. Explicit Request State Machine

A request MUST move only through the documented statuses: `Pending Approval` → (`Approved` | `Rejected`) → `For Release` → `Released` → `Completed`, with `Cancelled` reachable from `Pending Approval`, `Approved` and `For Release`. Illegal transitions MUST be rejected by the API.

Rejection MUST require a reason. A rejection is the Approver's decision on a request awaiting one.

Cancellation is a different act and MUST be modelled as one: stopping a request that has not been refused. The owning Employee MAY cancel their own request while it is `Pending Approval`; a Supply Admin MAY cancel an `Approved` or `For Release` request that cannot be fulfilled. A cancellation by anyone other than the owning Employee MUST require a reason. A `Released` request MUST NOT be cancelled — the items have been handed over.

`Rejected`, `Cancelled` and `Completed` are terminal. After rejection or cancellation the employee submits a **new** request; neither record is reopened.

### V. Notification Completeness

The system MUST send the corresponding email at every defined transition: Request Submitted, Request Approved, Request Rejected, Items Ready for Pickup / Released, Request Completed, Request Cancelled. Recipients MUST match `docs/process-flow.md`. A successful status change with a failed notification is a defect and MUST be visible in logs.

### VI. Independently Testable Increments

Each user story MUST be demonstrable without unfinished sibling stories once its dependencies are met. QA MUST be able to verify acceptance criteria with Playwright (UI flow) and HTTP tests (API contracts). The MVP demo path — check inventory → request → approve/reject → prepare → release → confirm receipt — MUST have an end-to-end test.

### VII. Typed Contracts

The SPA MUST be TypeScript. REST request/response shapes MUST match the **backend team’s published API contract**, not a contract invented in this repository. The client MUST NOT invent fields, routes, or error codes the API does not expose. Changes that affect both inventory quantity and request status MUST be atomic on the API (no partial deduct without a matching request, and the reverse on reject).

### VIII. MVP Restraint

This is a 4-week internal MVP. Agents MUST NOT add features, frameworks, or infrastructure that are not in the active spec or `ARCHITECT.md`. New architectural choices MUST be recorded as ADRs under `docs/adr/`. The goal is a working demo of Dev + QA collaboration, not a purchasing platform.

### IX. Secrets and Internal Data

Credentials and other secrets MUST NOT be committed. Seed users for the demo are allowed in source only as non-production placeholders documented in `quickstart.md`. Office-supply request data is internal; the REST API MUST require authentication.

### Governance

- This constitution supersedes informal practice, README tips, and chat preference.
- Amendments require an update to this section and to `specs/constitution.md`, with a version bump (MAJOR for removed/redefined principles, MINOR for added principles, PATCH for wording).
- Every pull request MUST be reviewable against these principles.
