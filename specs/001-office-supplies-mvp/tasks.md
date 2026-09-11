# Tasks: Office Supplies Request System MVP

**Spec**: specs/001-office-supplies-mvp/spec.md  
**Plan**: specs/001-office-supplies-mvp/plan.md  
**Structure**: By user story (P1 first), after SPA foundations

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

REST API work is specified as **contract obligations** (no implementation paths). The SPA is specified with file paths in this repo.

## Phase 1: Setup (SPA)

- [ ] T001 Add `VITE_API_ORIGIN` (or Vite `/api` proxy target) and gitignore local env — `.env.example`, `.gitignore`, `vite.config.ts`
- [ ] T002 [P] Typed models matching the REST contract — `src/shared/types.ts`
- [ ] T003 Fetch client with auth header and `{ error: { code, message } }` mapping — `src/shared/api.ts`
- [ ] T004 App shell replacing the Vite starter, with a place for role navigation — `src/App.tsx`

## Phase 2: Foundational (SPA auth)

- [ ] T005 Login page calling `POST /api/auth/login` and persisting the session — `src/features/auth/LoginPage.tsx`
- [ ] T006 Session bootstrap via `GET /api/auth/me` and logout — `src/features/auth/session.ts`
- [ ] T007 Role home routing (employee / approver / supply_admin) — `src/features/auth/RoleHome.tsx`

## Phase 3: REST API — contract baseline

The API host (wherever it lives) MUST satisfy `specs/001-office-supplies-mvp/contracts/api.md`. Track here; do not add a server tree in this repo.

- [ ] T008 Health: `GET /api/health` — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T009 Auth: login / me / logout and one role per user — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T010 Seed three demo users and sample catalog items — `specs/001-office-supplies-mvp/quickstart.md`
- [ ] T011 Atomic submit (decrement) and reject (increment); never negative on-hand — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T012 Record all five notification types with recipients per `docs/process-flow.md` — `specs/001-office-supplies-mvp/contracts/api.md`

## Phase 4: User Story 1 — Encode and view inventory (P1)

**Goal**: Supply Admin encodes stock; Employee can see quantities.

- [ ] T013 [P] [US1] API: inventory list/create/update with Supply Admin writes — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T014 [US1] Catalog UI (read-only for Employee/Approver) — `src/features/inventory/CatalogPage.tsx`
- [ ] T015 [US1] Encode/edit UI for Supply Admin — `src/features/inventory/EncodePage.tsx`

## Phase 5: User Story 2 — Submit a supply request (P1)

**Goal**: Employee submits; stock decrements; submitted notification recorded.

- [ ] T016 [US2] API: `POST /api/requests` + list/get own — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T017 [US2] Request form with live stock and optional purpose — `src/features/requests/CreateRequestPage.tsx`
- [ ] T018 [US2] Map `INVENTORY_INSUFFICIENT` to inline form errors — `src/features/requests/CreateRequestPage.tsx`

## Phase 6: User Story 3 — Approve or reject (P1)

**Goal**: Approver queue; reject restores stock and requires reason.

- [ ] T019 [US3] API: approve and reject (reason required) — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T020 [US3] Approver pending queue and reject-reason UI — `src/features/requests/ApproverQueuePage.tsx`
- [ ] T021 [US3] Employee sees rejection reason on detail — `src/features/requests/RequestDetailPage.tsx`

## Phase 7: User Story 4 — Prepare and release (P1)

**Goal**: Supply Admin fulfillment; location on release.

- [ ] T022 [US4] API: prepare and release with pickup location — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T023 [US4] Fulfillment queue UI — `src/features/requests/FulfillmentQueuePage.tsx`

## Phase 8: User Story 5 — Confirm receipt (P1)

**Goal**: Owning employee completes.

- [ ] T024 [US5] API: confirm owner-only — `specs/001-office-supplies-mvp/contracts/api.md`
- [ ] T025 [US5] Confirm receipt control on Released detail — `src/features/requests/RequestDetailPage.tsx`

## Phase 9: User Story 6 — Status and history (P2)

**Goal**: Role-appropriate lists and visible current status.

- [ ] T026 [P] [US6] Employee history list — `src/features/requests/HistoryPage.tsx`
- [ ] T027 [US6] Wire role navigation to history / queues — `src/App.tsx`, `src/features/auth/RoleHome.tsx`
- [ ] T028 [US6] SPA uses role-scoped `GET /api/requests` — `src/shared/api.ts`

## Phase 10: Notifications in the UI

- [ ] T029 Show notification log on request detail (body included) — `src/features/requests/RequestDetailPage.tsx`

## Final Phase: Polish

- [ ] T030 [P] GitHub Actions: lint, typecheck, build for the SPA — `.github/workflows/ci.yml`
- [ ] T031 Playwright e2e for happy path, reject path, notifications, RBAC — `e2e/mvp-pipeline.spec.ts`
- [ ] T032 HTTP contract checks against a running API origin — `specs/001-office-supplies-mvp/contracts/api.md`

## Dependencies

- Phase 1 → 2; API baseline (Phase 3) before UI stories that mutate (4–8)
- UI stories 1 → 2 → 3 → 4 → 5; story 6 after 2
- T031 needs a contract-compliant API plus T014–T029

## MVP slice

SPA Phases 1–2 and 4–8 plus API T008–T012 and T013/T016/T019/T022/T024, then T031.

## Parallel opportunities

T002 with T001; T014 with T015 after T013; T026 after T016.
