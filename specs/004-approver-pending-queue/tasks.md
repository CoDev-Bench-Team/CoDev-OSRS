# Tasks: Requests Queue — list, filters, search, sort

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

- [x] T005 [US2] [BEN-74] Render pending-only rows with status pills and keyboard-operable Review links to request detail — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Phase 4: User Story 3 — Understand non-success states (P1)

- [x] T006 [US3] [BEN-74] Add distinct loading, empty, failure, and retry states — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Phase 5: User Story 4 — Use the queue safely across supported devices (P2)

- [x] T007 [US4] [BEN-74] Make summary cards wrap and contain narrow table overflow without page-level overflow — `src/features/requests/approvals/ApprovalsQueuePage.tsx`

## Final Phase: Integration and Verification

- [x] T008 [BEN-74] Replace only the guarded `/approvals` placeholder with the real page, and retire the now-unreferenced placeholder — `src/app/routes.tsx`, `src/app/placeholders.tsx`
- [x] T009 [BEN-75] Run lint, build, verify, scoped diff review, and PR delivery — `package.json`
- [x] T010 [BEN-75] Share the button's class strings with the Review link instead of hand-copying them; see the 2026-09-22 amendment in `plan.md` — `src/shared/ui/actions/button-styles.ts`, `src/shared/ui/actions/Button.tsx`, `src/shared/ui/index.ts`
- [x] T011 [BEN-75] Share `TableHead`'s column sizing with the queue's row cells instead of hand-copying it, type the row's identity fields off the request, and qualify FR-013/FR-014 coverage; see the 2026-09-24 amendment in `plan.md` — `src/shared/ui/data-display/table-columns.ts`, `src/shared/ui/data-display/cards.tsx`, `src/shared/ui/index.ts`, `src/features/requests/approvals/ApprovalsQueuePage.tsx`, `src/features/requests/approvals/approval-queue-types.ts`
- [x] T012 [BEN-75] Derive the table's minimum width from `COLUMNS`, give the scroll region room for the card's shadow, restore keyboard focus after a successful retry, fall back to an em dash for an empty item list, and move the gallery's two tables onto `tableColumnStyle`; see the 2026-09-24 second-review amendment in `plan.md` — `src/features/requests/approvals/ApprovalsQueuePage.tsx`, `src/features/requests/approvals/approval-queue-model.ts`, `src/shared/ui/gallery/Gallery.tsx`
- [x] T013 [BEN-75] Type column widths as `ColumnWidth` so a non-px unit cannot compile, share the table row gutter, keep the em-dash placeholder out of the `title` tooltip, move retry focus to the section heading, and record the constitution-3.0.0 supersession in `spec.md` and the compliance table; see the 2026-09-24 third-review amendment in `plan.md` — `src/shared/ui/data-display/table-columns.ts`, `src/shared/ui/data-display/cards.tsx`, `src/shared/ui/index.ts`, `src/shared/ui/gallery/Gallery.tsx`, `src/features/requests/approvals/ApprovalsQueuePage.tsx`, `src/features/requests/approvals/approval-queue-model.ts`, `specs/004-approver-pending-queue/spec.md`
- [x] T014 [BEN-75] Type the shared row-gutter class so a named token cannot hand `NaN` to the width calculation, move the width arithmetic into a guarded `tableMinWidth`, migrate the gallery's rows onto the shared gutter, and mark the superseded requirements inline in `spec.md`; see the 2026-09-24 fourth-review amendment in `plan.md` — `src/shared/ui/data-display/table-columns.ts`, `src/shared/ui/index.ts`, `src/shared/ui/gallery/Gallery.tsx`, `src/features/requests/approvals/ApprovalsQueuePage.tsx`, `specs/004-approver-pending-queue/spec.md`

- [x] T015 [BEN-75] Realign to constitution 3.0.0 after the rebase onto spec 001 Phase 0: mount the page on the Admin's `/queue`, take title and subtitle from `DESTINATIONS.queue`, count In Processing over `Approved` / `For Delivery` / `For Pickup`, move the feature to `src/features/requests/queue/`, and reseed with the new statuses; see the second 2026-09-24 amendment in `spec.md` — `src/app/routes.tsx`, `src/app/placeholders.tsx`, `src/features/requests/queue/*`, `specs/004-approver-pending-queue/*`
- [x] T016 [BEN-74] Record the 2026-09-24 export as `drift-2026-09-24.md` and amend spec 004 (FR-008 superseded; FR-019–FR-023) and plan — `docs/design-system/drift-2026-09-24.md`, `specs/004-approver-pending-queue/*`
- [x] T017 [P] [BEN-74] Shared `FilterChip` and `Pagination`, plus the four pagination primitives — `src/shared/ui/forms/FilterChip.tsx`, `src/shared/ui/data-display/Pagination.tsx`, `src/styles/theme.css`, `docs/design-system/token-map.md`, `src/shared/ui/index.ts`; `SummaryCard` neutral tone and `Search` focus outline — `src/shared/ui/data-display/cards.tsx`, `src/shared/ui/forms/Search.tsx`
- [x] T018 [BEN-74] `QueueQuery` and the single projection: live statuses, search, chip counts, sort, page clamp and slice — `src/features/requests/queue/queue-types.ts`, `src/features/requests/queue/queue-model.ts`
- [x] T019 [BEN-74] Toolbar, chips, all-status table with Review on every row, pagination, and the no-match empty state; drop the `Pending Approval` heading; reseed with emails and enough rows to page — `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/queue/seeded-queue-source.ts`

> **On the checkmarks.** T001–T013 are complete as written. Three of the
> requirements they implement — FR-002, FR-003 and FR-006 — were superseded by
> constitution 3.0.0 after this work was done, and are struck through in
> `spec.md`. The tasks are not reopened. Spec 001 Phase 0 changed the role and status
> vocabulary underneath them, and T015 moves this feature onto it.

## Dependencies

- T001 blocks T002 and T003.
- T002 and T003 block T004–T007.
- T004–T007 are implemented together in one page and completed in story order.
- T004–T007 block T008.
- T008 blocks T009.
- T010 arose from review during T009 and touches no file T001–T008 owns.
- T011 arose from a second review round during T009; its shared-UI change is output-preserving for every existing `TableHead` caller.
- T016–T019 arose from the 2026-09-24 re-export and BEN-46's re-scope. T016 blocks T017–T019; T017 and T018 are parallel; both block T019.
- T015 arose from the rebase onto `dev` after spec 001 Phase 0 (PR #40) merged: the page no longer compiled, and the Admin's `/queue` landing rendered the shell's error boundary.
- T014 arose from a fifth review round during T009, which found that T013's own gutter constant carried the very failure mode T013 added `ColumnWidth` to prevent: `px-touch-target` compiled, rendered 44px, and produced `NaN` — dropped silently by React, collapsing the table's minimum width and the ITEMS column with it.
- T013 arose from a fourth review round during T009. It records the constitution-3.0.0 supersession that spec 001 Phase 0 owns, and closes four code findings; `ColumnWidth` is a narrowing, so it changes no rendered output but does reject a loose annotation in the gallery.
- T012 arose from a third review round during T009. Its four feature changes touch files T004–T007 own and its gallery change is output-preserving; all five were measured rather than inspected (derived width, shadow room, SC-006 at four widths, the retry focus path driven end-to-end, and the model exercised against empty and blank item lists).

## Parallel Opportunities

- T002 and T003 may proceed in parallel after T001 because they modify different files.

## MVP Slice

T001–T008. T009 is the required delivery gate; T010–T014 were raised by review inside it, and T015 by the rebase.
