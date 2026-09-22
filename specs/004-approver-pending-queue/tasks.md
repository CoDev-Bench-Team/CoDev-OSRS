# Tasks: Approver Pending Queue

**Spec**: `specs/004-approver-pending-queue/spec.md`  
**Plan**: `specs/004-approver-pending-queue/plan.md`  
**Structure**: By user story, P1 first

Linear lifecycle: BEN-72 (spec) → BEN-73 (plan/tasks) → BEN-74 (execute) → BEN-75 (checks/PR).

## Phase 1: Foundational

- [x] T001 [BEN-74] Define feature-local queue request, snapshot, source, and view-model types — `src/features/requests/approvals/approval-queue-types.ts`
- [x] T002 [P] [BEN-74] Implement pure pending-row and workload-metric projection — `src/features/requests/approvals/approval-queue-model.ts`
- [x] T003 [P] [BEN-74] Add the explicit temporary queue source and non-production fixtures — `src/features/requests/approvals/seeded-approval-queue-source.ts`

## Phase 2: User Story 1 — See approval workload at a glance (P1)

- [x] T004 [US1] [BEN-74] Render the page header and three source-backed summary cards — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Phase 3: User Story 2 — Find and open a pending request (P1)

- [x] T005 [US2] [BEN-74] Render pending-only rows and keyboard-operable Review links to request detail — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Phase 4: User Story 3 — Understand non-success states (P1)

- [x] T006 [US3] [BEN-74] Add distinct loading, empty, failure, and retry states — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Phase 5: User Story 4 — Use the queue safely across supported devices (P2)

- [x] T007 [US4] [BEN-74] Make summary cards wrap and contain narrow table overflow without page-level overflow — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Final Phase: Integration and Verification

- [x] T008 [BEN-74] Replace only the guarded `/approvals` placeholder with the real page — `src/app/routes.tsx`
- [x] T009 [BEN-75] Run lint, build, verify, scoped diff review, and PR delivery — `package.json`

## Dependencies

- T001 blocks T002 and T003.
- T002 and T003 block T004–T007.
- T004–T007 are implemented together in one page and completed in story order.
- T004–T007 block T008.
- T008 blocks T009.

## Parallel Opportunities

- T002 and T003 may proceed in parallel after T001 because they modify different files.

## MVP Slice

T001–T008. T009 is the required delivery gate.
