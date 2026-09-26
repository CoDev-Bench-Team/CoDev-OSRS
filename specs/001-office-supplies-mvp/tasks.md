# Tasks: Office Supplies Request System MVP

**Spec**: specs/001-office-supplies-mvp/spec.md
**Plan**: specs/001-office-supplies-mvp/plan.md
**Structure**: By user story (P1 first), after SPA foundations
**Amended**: 2026-09-22 to constitution 3.0.0 and the design re-export ([drift](../../docs/design-system/drift-2026-09-22.md))

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

This list is **SPA-only**. Do not implement or specify REST routes here. Wire HTTP only after the backend team's contract covers the shape — the remaining contract gaps are listed in `contracts/README.md`.

## Phase 0: Realign the shipped shell to constitution 3.0.0

The app shell (spec 003) and Profile (spec 006, merged 2026-09-23) both shipped
against the three-role model, and the shell against the `For Release` /
`Released` vocabulary. Both are retired. Nothing below can be built on top of the
current types.

`Office` in `src/features/auth/types.ts` keeps **`Pasig`**, not the design's
`Ortigas`, until the contract moves — spec 006 D3 transcribed the published
enum, which is the right call under constitution VII. Conflict 2 in
`contracts/README.md` tracks it.

- [x] T000 Collapse `Role` to `'employee' | 'admin'`; drop `approver` / `supply_admin` — `src/features/auth/types.ts`
- [x] T000a Rework navigation sets and role home for two roles: Employee → Catalog · My Requests; Admin → Requests Queue · Assets · Inventory · History — `src/features/auth/navigation.ts`, `src/app/destinations.ts`
- [x] T000b Reseed demo identities to one Employee + one Admin — `src/features/auth/seeded-source.ts`
- [x] T000c Replace `For Release` / `Released` with `For Delivery` / `For Pickup` in `REQUEST_STATUSES` and `REQUEST_TONE`; delete `Handover` / `HANDOVER_LABEL` (they are states now, not labels) — `src/shared/ui/status.ts`
- [x] T000d Update `StatusPill` and the gallery's status section to the new vocabulary — `src/shared/ui/data-display/StatusPill.tsx`, `src/shared/ui/gallery/Gallery.tsx`
- [ ] T000e Re-vendor `design-system/` from the 2026-09-22 export (two exports stale; token layer included) — `design-system/`
  - **Deferred (2026-09-24, BEN-122).** There is no skill-folder export of the 2026-09-22 `.fig` to vendor — the 09-15 and 09-22 drifts were read from the `.fig` directly. Waiting on a fresh export from the designer.
- [x] T000g Add `Received` (constitution 5.0.0, ADR-0009): `REQUEST_STATUSES`, the `received` tone and its orange pair, the five-node timeline, and `Received` as live on the Requests Queue — `src/shared/ui/status.ts`, `src/shared/ui/data-display/StatusPill.tsx`, `src/features/requests/detail/request-timeline.ts`, `src/features/requests/queue/queue-types.ts`
- [x] T000f Reconcile the **shipped Profile** (spec 006, merged 2026-09-23): `ROLE_LABEL`, the D2 "Approver and Supply Admin reuse" rationale, and the role copy in `ProfilePage.tsx` all name retired roles — `specs/006-profile/*`, `src/features/profile/ProfilePage.tsx`, `docs/design-system/additions.md`

## Phase 1: Setup (SPA)

- [ ] T001 Add API origin env (or Vite proxy target) and gitignore local env — `.env.example`, `.gitignore`, `vite.config.ts`
- [ ] T002 [P] Shared fetch wrapper (base URL, credentials as the backend contract requires) — `src/shared/api.ts`
- [ ] T003 Types copied or generated from the **backend-published** contract — `src/shared/types.ts`
- [ ] T003a Shared parser mapping BEN-98 `errors[].pointer` → under-field messages, reused by every form — `src/shared/validation.ts`

## Phase 2: Foundational (SPA auth)

Depends on backend auth/session resources.

- [ ] T005 Login UI against the backend contract's auth endpoints — `src/features/auth/LoginPage.tsx`
- [ ] T006 Session bootstrap (current user, role, home office) and logout — `src/features/auth/session.ts`
- [ ] T007 Role home routing (employee / admin) — `src/features/auth/RoleHome.tsx`

## Phase 3: User Story 1 — Assets and stock (P1)

**Goal**: Admin encodes assets and sets per-office stock; Employee sees availability.

- [ ] T008 [US1] Assets table + search + category filter + chips + pagination — `src/features/assets/AssetsPage.tsx`
- [ ] T009 [US1] Add Asset panel with category-dependent fields (FR-002a) — `src/features/assets/AddAssetPanel.tsx`
- [ ] T009a [US1] View Asset panel + Update Asset panel (prefilled, custom spec row) — `src/features/assets/AssetPanels.tsx`
- [ ] T010 [US1] ~~Inventory table: Total / Available / Reserved / status pill / Update stock~~ **Re-scoped 2026-09-26 (BEN-107):** Inventory unit table: MODEL · CATEGORY · PR · SERIAL NUMBER · OFFICE · ASSIGNED · STATUS · ACTION, chips All items · Assigned · Available · Reserved — `src/features/inventory/InventoryPage.tsx`
- [ ] T010a [US1] ~~Update stocks panel: low-stock threshold + one stepper per office~~ **Re-scoped 2026-09-26 (BEN-108):** unit panels: Add Inventory dropdown, Add Single Unit, Add Multiple Units, Review/Edit unit, Remove Unit + confirmation. The threshold moves to Update Asset (T009a) — `src/features/inventory/`

## Phase 4: User Story 2 — Catalog and submit (P1)

**Goal**: Employee browses by category and office, builds a request list, submits.

- [ ] T011 [US2] Catalog page: office selector, category chips, supply cards (model select, availability pill, stepper) — `src/features/catalog/CatalogPage.tsx`
- [ ] T011a [US2] View Specs panel — `src/features/catalog/ViewSpecsPanel.tsx`
- [ ] T012 [US2] Request List drawer: lines, steppers, Remove, Note to Approver, Submit — `src/features/requests/create/RequestListDrawer.tsx`
- [ ] T013 [US2] Submit + confirmation toast; map insufficient-stock and validation errors from the contract only — `src/features/requests/create/`

## Phase 5: User Story 3 — Approve or reject (P1)

**Goal**: Admin queue; reject requires a reason.

- [x] T014 [US3] Requests Queue: summary cards, chips, search, sort, table, pagination — `src/features/requests/queue/QueuePage.tsx`
- [ ] T015 [US3] Review panel: requester, lines with current inventory, note, timeline, Approve / Reject — `src/features/requests/queue/ReviewPanel.tsx` — **owned by [spec 008](../008-request-review-panel/tasks.md)**
- [ ] T016 [US3] Reject dialog with required reason; rejected read-back state — `src/features/requests/queue/RejectDialog.tsx` — **owned by [spec 008](../008-request-review-panel/tasks.md)**

## Phase 6: User Story 4 + 5 — Handover and complete (P1)

**Goal**: Admin sets For Delivery / Ready for Pickup; the Employee signs the Accountability Form (`Received`); the Admin completes.

- [ ] T017 [US4] Update Status panel: `Status *` select, pickup location when Ready for Pickup — `src/features/requests/queue/UpdateStatusPanel.tsx` — **owned by [spec 008](../008-request-review-panel/tasks.md)**
- [ ] T018 [US5] Complete action and its confirmation, offered on `Received` only (FR-012) — `src/features/requests/queue/UpdateStatusPanel.tsx` — **owned by [spec 008](../008-request-review-panel/tasks.md)**
- [ ] T018b [US5] Accountability Form on the Employee's own `For Delivery` / `Ready for Pickup` request (FR-012a, FR-012b) — `src/features/requests/detail/AccountabilityForm.tsx`. **Blocked on contracts/README.md conflict 5.**

## Phase 7: User Story 6 + 7 — History and cancel (P2)

- [ ] T019 [P] [US6] My Requests table + status pills + detail panel — `src/features/requests/history/MyRequestsPage.tsx`
- [ ] T020 [US7] Cancel Request dialog with required reason (employee, while pending) — `src/features/requests/history/CancelDialog.tsx`
- [ ] T021 [US7] Admin cancel from the review panel (approved / for delivery / for pickup) — `src/features/requests/queue/ReviewPanel.tsx` — **moved to BEN-135** (no control drawn; spec 008 Out of Scope)
- [ ] T022 [US6] History page: chips, table, read-only detail panel showing the stored reason — `src/features/requests/history/HistoryPage.tsx`

## Phase 8: User Story 8 — Profile (P3)

- [ ] T023 [US8] Profile page: identity, `email • office`, Currently Assigned list with empty state — `src/features/profile/ProfilePage.tsx`

## Phase 9: Notifications in the UI

- [ ] T024 Show notification history on request detail **if** the backend contract exposes it — `src/features/requests/`

## Final Phase: Polish

- [ ] T025 [P] GitHub Actions: lint, typecheck, build for the SPA — `.github/workflows/ci.yml`
- [ ] T026 Playwright e2e: happy path (SC-001), reject path (SC-002), cancel paths (SC-002a), RBAC refusals — `e2e/mvp-pipeline.spec.ts`

## Dependencies

- **Phase 0 blocks everything.** The shipped types name roles and statuses that no longer exist.
- T003 and all HTTP-backed UI (T005+) need the backend contract, and T008–T013 additionally need the remaining contract gaps in `contracts/README.md` resolved
- UI stories 1 → 2 → 3 → 4/5; 6/7 after 2; 8 anytime after Phase 2
- T026 needs T008–T024 plus a contract-compliant API

## MVP slice

Phase 0, then Phases 1–6, then T026.

## Parallel opportunities

T002 with T001; T008 with T010; T009/T009a with T010a; T019 after T013; T023 anytime after Phase 2.

## Blocked on decisions, not on code

- Contract gaps — `contracts/README.md`. Conflict 2 is closed and conflict 3 is closed. Conflict 1 is decided (units); the per-asset count read and the unit-removal reason are still open
- ~~Ten designer questions~~ **Ratified 2026-09-26** — [drift-2026-09-22 §10 status table](../../docs/design-system/drift-2026-09-22.md#status-2026-09-26). §4d and §4f no longer block T009/T010. What the designer still owes blocks nothing: [drift-2026-09-26 §5](../../docs/design-system/drift-2026-09-26.md#5-designer-follow-up)
