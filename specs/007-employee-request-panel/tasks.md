# Tasks: Employee Request Panel + Cancel

**Spec**: `specs/007-employee-request-panel/spec.md`  
**Plan**: `specs/007-employee-request-panel/plan.md`  
**Structure**: By user story, P1 first

Linear lifecycle: BEN-65 (E0, spec) → BEN-66 (E1, plan/tasks) → BEN-67 (E2, read UI) → BEN-70 (E5, cancel) → BEN-71 (E6, checks/PR). E3 (BEN-68) and E4 (BEN-69) moved to BEN-47.

## Phase 0: Spec amendments

- [x] T001 [BEN-65] Amend spec 001: FR-009a reason required, FR-012 withdrawn, FR-012a and FR-012b added, US5 re-scoped, T015 and CHK011 withdrawn — `specs/001-office-supplies-mvp/`
- [x] T002 [BEN-65] Record ADR-0007, the Supply Admin completes a request — `docs/adr/0007-admin-completes-requests.md`, `docs/adr/README.md`
- [x] T003 [BEN-65] Amend spec 003: Request detail is Approver and Supply Admin only — `specs/003-app-shell-routing/spec.md`
- [x] T004 [BEN-65] Remove confirm receipt from the cross-cutting docs — `ARCHITECT.md`, `docs/product.md`, `docs/process-flow.md`, `docs/linear-spa-pages-epic.md`
- [x] T005 [BEN-65] Constitution 3.0.0 IV: every cancellation requires a reason — `specs/constitution.md`, `AGENTS.md` *(on PR #33, plan D3)*

## Phase 1: Foundational

- [x] T006 [BEN-67] Add `SidePanel`, `StatusTimeline` and `TextField` with gallery rows — `src/shared/ui/overlay/SidePanel.tsx`, `src/shared/ui/data-display/StatusTimeline.tsx`, `src/shared/ui/forms/TextField.tsx`, `src/shared/ui/index.ts`, `src/shared/ui/gallery/Gallery.tsx`
- [x] T007 [BEN-67] Define the read model and source interface — `src/features/requests/detail/request-detail-types.ts`
- [x] T008 [P] [BEN-67] Seed Maya's six drawn requests — `src/features/requests/detail/seeded-employee-request-source.ts`
- [x] T009 [P] [BEN-67] Map states onto the drawn timeline nodes (D5) — `src/features/requests/detail/request-timeline.ts`
- [x] T010 [P] [BEN-67] Date formatting and item summary — `src/features/requests/format.ts`

## Phase 2: User Story 1 — Read back a request (P1)

- [x] T011 [US1] [BEN-67] Stand-in My Requests table with *View details* (D1) — `src/features/requests/history/MyRequestsPage.tsx`
- [x] T012 [US1] [BEN-67] Request panel: header, Items Requested, Note to Approver, Status — `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T013 [US1] [BEN-67] Route `/requests` to the page; drop `employee` from `requestDetail` (D2) — `src/app/routes.tsx`, `src/app/destinations.ts`, `src/app/placeholders.tsx`, `src/app/seeded-request-ids.ts`

## Phase 3: User Story 2 — Cancel a pending request (P1)

- [x] T014 [US2] [BEN-70] Cancel Request on `Pending Approval` only, inline reason form, trimmed-empty refusal, refused-cancel note — `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T015 [US2] [BEN-70] Seeded `cancel` that refuses non-pending requests; the page reloads after every attempt — `src/features/requests/detail/seeded-employee-request-source.ts`, `src/features/requests/history/MyRequestsPage.tsx`

## Phase 4: User Story 3 — No confirm receipt (P1)

- [x] T016 [US3] [BEN-70] No receipt or completion control in any state — `src/features/requests/detail/RequestDetailPanel.tsx`

## Final Phase: Checks and PR

- [x] T017 [BEN-71] Log the panel's design additions (Rejected ending, For Release node, refusal note, stand-in list, REQ-2026-1838) — `docs/design-system/additions.md`
- [x] T018 [BEN-71] Employee refused on `/requests/:id` for owned, unowned and missing ids — `scripts/check-shell.mjs`
- [x] T019 [BEN-71] Request-detail gate for acceptance 1–5, wired into verify — `scripts/check-request-detail.mjs`, `scripts/verify.mjs`
- [x] T020 [BEN-71] `npm run verify`, scoped diff review, and PR #38 against `dev`
- [x] T021 [BEN-65] [BEN-66] Record this feature's spec, plan and tasks — `specs/007-employee-request-panel/`
- [x] T022 [US1] [US2] [BEN-67] [BEN-70] Read back the cancel or rejection reason on a stopped request, and check it — `src/features/requests/detail/`, `scripts/check-request-detail.mjs`, `docs/design-system/additions.md`

## Dependencies

- T001–T004 block all code tasks (constitution I). T005 lands separately on PR #33.
- T006 and T007 block T008–T012.
- T011–T013 block T014–T016.
- T014–T016 block T018–T020.
- T021 and T022 were added after T020, when the sub-issues' descriptions were checked against the branch. T022 reopens files from T008, T009, T012 and T019.

## Parallel Opportunities

- T008, T009 and T010 touch different files and may proceed together after T007.

## MVP Slice

T001–T016. T017–T020 are the delivery gate.
