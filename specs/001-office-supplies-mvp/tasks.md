# Tasks: Office Supplies Request System MVP

**Spec**: specs/001-office-supplies-mvp/spec.md  
**Plan**: specs/001-office-supplies-mvp/plan.md  
**Structure**: By user story (P1 first), after SPA foundations

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

This list is **SPA-only**. Do not implement or specify REST routes here. Wire HTTP only after the backend team’s contract is linked in `contracts/README.md`.

## Phase 1: Setup (SPA)

- [ ] T001 Add API origin env (or Vite proxy target) and gitignore local env — `.env.example`, `.gitignore`, `vite.config.ts`
- [ ] T002 [P] Shared fetch wrapper (base URL, credentials as the backend contract requires) — `src/shared/api.ts`
- [ ] T003 Types copied or generated from the **backend-published** contract — `src/shared/types.ts`
- [ ] T004 App shell replacing the Vite starter, with a place for role navigation — `src/App.tsx`

## Phase 2: Foundational (SPA auth)

Depends on backend auth/session resources.

- [ ] T005 Login UI against the backend contract’s auth endpoints — `src/features/auth/LoginPage.tsx`
- [ ] T006 Session bootstrap (current user + role) and logout — `src/features/auth/session.ts`
- [ ] T007 Role home routing (employee / approver / supply_admin) — `src/features/auth/RoleHome.tsx`

## Phase 3: User Story 1 — Encode and view inventory (P1)

**Goal**: Supply Admin encodes stock; Employee can see quantities.

- [ ] T008 [US1] Catalog UI (read-only for Employee/Approver) — `src/features/inventory/CatalogPage.tsx`
- [ ] T009 [US1] Encode/edit UI for Supply Admin — `src/features/inventory/EncodePage.tsx`

## Phase 4: User Story 2 — Submit a supply request (P1)

**Goal**: Employee submits; UI reflects pending status and updated stock from the API.

- [ ] T010 [US2] Request form with live stock and optional purpose — `src/features/requests/CreateRequestPage.tsx`
- [ ] T011 [US2] Map insufficient-stock / validation errors as the backend contract defines them — `src/features/requests/CreateRequestPage.tsx`

## Phase 5: User Story 3 — Approve or reject (P1)

**Goal**: Approver queue; reject requires a reason.

- [ ] T012 [US3] Approver pending queue and reject-reason UI — `src/features/requests/ApproverQueuePage.tsx`
- [ ] T013 [US3] Employee sees rejection reason on detail — `src/features/requests/RequestDetailPage.tsx`

## Phase 6: User Story 4 — Prepare and release (P1)

**Goal**: Supply Admin fulfillment; location on release.

- [ ] T014 [US4] Fulfillment queue UI — `src/features/requests/FulfillmentQueuePage.tsx`

## Phase 7: User Story 5 — Confirm receipt (P1)

**Goal**: Owning employee completes.

- [ ] T015 [US5] Confirm receipt control on Released detail — `src/features/requests/RequestDetailPage.tsx`

## Phase 8: User Story 6 — Status and history (P2)

**Goal**: Role-appropriate lists and visible current status.

- [ ] T016 [P] [US6] Employee history list — `src/features/requests/HistoryPage.tsx`
- [ ] T017 [US6] Wire role navigation to history / queues — `src/App.tsx`, `src/features/auth/RoleHome.tsx`

## Phase 9: Notifications in the UI

- [ ] T018 Show notification details on request detail **if** the backend contract exposes them — `src/features/requests/RequestDetailPage.tsx`

## Final Phase: Polish

- [ ] T019 [P] GitHub Actions: lint, typecheck, build for the SPA — `.github/workflows/ci.yml`
- [ ] T020 Playwright e2e for happy path, reject path, RBAC (against a real or stubbed API matching the backend contract) — `e2e/mvp-pipeline.spec.ts`

## Dependencies

- T003 and all HTTP-backed UI (T005+) need the backend contract (or an explicit throwaway mock)
- UI stories 1 → 2 → 3 → 4 → 5; story 6 after 2
- T020 needs T008–T018 plus a contract-compliant API

## MVP slice

Phases 1–7, then T020.

## Parallel opportunities

T002 with T001; T008 with T009; T016 after T010.
