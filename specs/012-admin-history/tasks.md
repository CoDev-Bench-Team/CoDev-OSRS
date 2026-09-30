# Tasks: Admin History — resolved requests

**Spec**: `specs/012-admin-history/spec.md`  
**Plan**: `specs/012-admin-history/plan.md`  
**Structure**: By the plan's Build Order. The two refactor phases (1, 2) each end on a full `npm run verify` before any History code lands (R1).

Linear lifecycle: BEN-145 (L0, spec) → BEN-149 (L1, plan + tasks) → BEN-146 (L2, table) → BEN-147 (L3, panel) → BEN-148 (L4, checks + PR). Parent: BEN-144.

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 0: Docs and contract gap (BEN-149)

- [x] T001 [P] [BEN-149] Mark spec 001 T022 as owned by spec 012 — `specs/001-office-supplies-mvp/tasks.md`
- [x] T002 [P] [BEN-149] Add conflict **7, "History: resolved requests"**: terminal statuses from `GET /requests` (BEN-105), the time each terminal status was set, the stored rejection and cancellation reason on read, the requester's department, and a server-paged list (R4). No route, parameter or field name is proposed (D10) — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T003 [P] [BEN-149] Log the undrawn parts (D12): composed Rejected and Completed History panels (H2 / D8), counts on every History chip, History's sort menu, the stopped-request timeline rule (replacing the Cancelled collapse), the *No reason recorded* marker, and History's cancellation callout in slate where the frame draws red — `docs/design-system/additions.md`

## Phase 1: Extract with no behaviour change (BEN-146)

- [x] T004 [BEN-146] Move `matchesSearch` (id, name, email, items), `byTime(getTime, direction)` (unusable times last under both orders) and a generic `updateQuery<Q extends { page: number }>` out of the queue model; `queue-model.ts` imports them, same behaviour (D3) — `src/features/requests/list-query.ts`, `src/features/requests/queue/queue-model.ts`
- [x] T005 [P] [BEN-146] Extract `RequesterBlock`, `StoppedReason` + `stoppedReason(request)` from the review panel, and `ItemsRequested({ lines })` (typed on `{ description; qty }`) from the read-back. Both callers import them and render identically; the missing-reason marker is **not** added here (D7) — `src/features/requests/review-parts.tsx`, `src/features/requests/queue/ReviewPanel.tsx`, `src/features/requests/detail/RequestReadBack.tsx`
- [x] T006 [BEN-146] Gate: full `npm run verify` passes, pixel and fidelity included, and Phase 1 is its own commit (R1) — `scripts/verify.mjs`

## Phase 2: Timeline for a stopped request (BEN-146)

- [x] T007 [BEN-146] `Cancelled` returns Submitted, Approved when `approvedAt` is set, the handover node only when `approvedAt`, `handover` and `handedOverAt` are all set, then Cancelled, each reached, toned and dated. `Rejected` is unchanged (D8, R2) — `src/features/requests/request-timeline.ts`
- [x] T008 [BEN-146] Update the Cancelled-timeline expectations: pending-cancelled still reads Submitted → Cancelled, and an approved-then-cancelled row reads its reached nodes — `scripts/check-request-detail.mjs`, `scripts/check-review-panel.mjs` *(Done in `check-request-detail.mjs` only. `check-review-panel.mjs` needed no change: it opens no cancelled request, and without Admin cancel (BEN-135) the review panel cannot reach an approved-then-cancelled one. `check-history.mjs` covers that shape.)*
- [x] T009 [BEN-146] Gate: full `npm run verify` passes, and Phase 2 is its own commit — `scripts/verify.mjs`

## Phase 3: US1 — Browse resolved requests (BEN-146)

- [x] T010 [US1] [BEN-146] `TERMINAL_STATUSES` (`Completed · Cancelled · Rejected`), `HistoryChip`, `HISTORY_SORTS` (the queue's three), `HistoryQuery` + `INITIAL_HISTORY_QUERY`, `HistoryRow`, `HistoryViewModel`; `PAGE_SIZES` imported from the queue (D4) — `src/features/requests/history/history-types.ts`
- [x] T011 [US1] [BEN-146] `resolvedAt(request)`, the only reader of the resolved time (D2, R3), and `buildHistoryViewModel(snapshot, query)`: de-duplicate, keep terminal statuses, search, count every chip over the matches, filter, sort by `resolvedAt` / Employee (A-Z), clamp and slice, via `list-query.ts` (D3) — `src/features/requests/history/history-model.ts`
- [x] T012 [P] [US1] [BEN-146] Add about 11 terminal rows to the shared seed so it reaches about 14: Completed by delivery and by pickup; Rejected; Cancelled from pending, `Approved`, `For Delivery` and `Ready for Pickup`; one with no note; several requesters and dates. Every stored reason is present. REQ-2026-1847 is untouched (D9) — `src/features/requests/queue/seeded-admin-request-source.ts`
- [x] T013 [US1] [BEN-146] `HistorySource = Pick<AdminRequestSource, 'load'>` and `historySource(search)` over `adminRequestSource`. On the dev server only, a `?history=` stub with `failing`, `slow`, `empty`, `no-reason`, `no-resolved-date`, `received` and `recovers` modes, each on a fresh seed (D1, D9) — `src/features/requests/history/history-source.ts`, `src/features/requests/history/dev/history-stub.ts`
- [x] T014 [US1] [BEN-146] `HistoryPage`:
  - `LoadState`: `LoadingState` while loading, a `Notice` + **Try again** on failure, and the empty state on no match.
  - Header from `DESTINATIONS.history`; the toolbar holds `Search` (the drawn placeholder) and the sort `Select`.
  - `FilterChip`s with counts and pressed state.
  - Table `REQUEST ID · REQUESTER (name / department) · ITEMS · STATUS · RESOLVED · ACTION`, using the queue's column widths via `tableColumnStyle` / `tableMinWidth`. RESOLVED is `formatDate` or `NO_VALUE`. ACTION is **Review** with `aria-label="Review request <id>"`.
  - `Pagination` with page-size reset (D5, FR-003 to FR-007, FR-012, FR-015).

  File: `src/features/requests/history/HistoryPage.tsx`
- [x] T015 [US1] [BEN-146] Route `/history` to `guarded('history', <HistoryPage />)` and delete `HistoryPlaceholder` (D11) — `src/app/routes.tsx`, `src/app/placeholders.tsx`

## Phase 4: US2 — Read a resolved request (BEN-147)

- [x] T016 [US2] [BEN-147] `StoppedReason` renders for every `Rejected` or `Cancelled` request, with *No reason recorded* when the reason is absent. Cancelled stays slate and Rejected stays red (D7, A3) — `src/features/requests/review-parts.tsx`
- [x] T017 [US2] [BEN-147] `HistoryPanel`:
  - `SidePanel` titled `Request <id>`; the header is an id heading plus `StatusPill`; **no footer**.
  - Body order: `RequesterBlock`, `ItemsRequested` (`ITEM · QTY`, no current inventory), Note to Approver when present, `STATUS` timeline, `StoppedReason` (D6, FR-008 to FR-011).

  File: `src/features/requests/history/HistoryPanel.tsx`
- [x] T018 [US2] [BEN-147] Wire the panel. **Review** sets the open id and the panel reads its request from the loaded snapshot. Closing via ✕, Esc or the scrim returns focus to that row's **Review**, and the chip, search, sort and page are kept (FR-008) — `src/features/requests/history/HistoryPage.tsx`
- [x] T019 [US2] [BEN-147] Terminal deep link:
  - `QueuePage` forwards a deep-linked `Completed` / `Rejected` / `Cancelled` id to `/history` (`replace`, same `DeepLinkState`).
  - `HistoryPage` resolves it with `useDeepLinkedRequest(terminalIds, open, REQUEST_NOT_FOUND)`.
  - A live id and a missing id behave as before (D14, FR-016).

  Files: `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/history/HistoryPage.tsx`

## Phase 5: US3 + checks and PR (BEN-148)

- [x] T020 [US3] [BEN-148] New check `check-history.mjs`, covering:
  - The Employee: no History nav item, and `/history` refused with a route back (spec 003 FR-011).
  - Terminal statuses only; each chip's list and count; search by id, name, email and item.
  - The three sorts by resolved time; pagination range, Back/Next ends, and page-size reset; re-pressing the selected chip keeps the page.
  - The panel: reason label per status; none for Completed; no action controls on the rows or the panel.
  - Every seeded Cancelled row's exact timeline node list.
  - Stub modes `failing` / `slow` / `empty` / `no-reason` / `no-resolved-date` / `received` (a Received request stays off History, so all eight statuses are present) / `recovers` (Try Again reloads and focus lands on the chips); `no-resolved-date` showing `NO_VALUE` and sorting last under both date orders.
  - `/requests/<terminal id>` as an Admin opens the History panel, and a live id opens the review panel.
  - No page-level overflow at 360px and 1440px; keyboard reach to chips, search, sort, **Review** and pagination (D13).

  File: `scripts/check-history.mjs`
- [x] T021 [BEN-148] Wire `history (spec 012)` into the gates and update the header comment — `scripts/verify.mjs`
- [x] T022 [P] [BEN-148] Confirm the shell check still refuses `/history` for the Employee and offers it to the Admin; add the assertion if it is missing — `scripts/check-shell.mjs`
- [x] T023 [BEN-148] Full `npm run verify` passes; screenshots at 1440px against both `04 - History` frames are attached to the PR — `scripts/verify.mjs` *(Verify passes and the screenshots are taken. Attaching them moves to T025, since the PR does not exist yet.)*
- [x] T024 [BEN-148] Tick T022 `[x]` in spec 001 tasks and T001–T023 here — `specs/001-office-supplies-mvp/tasks.md`, `specs/012-admin-history/tasks.md`
- [ ] T025 [BEN-148] PR to `dev` linking BEN-144, and attach it to the Linear issue — `specs/012-admin-history/` Attach the 1440px screenshots of both `04 - History` frames (T023).

## Dependencies

- Phase 0 blocks nothing and runs any time before the PR.
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5, each refactor phase closing on its verify gate (T006, T009).
- T011 depends on T004 and T010. T013 depends on T012. T014 depends on T011 and T013. T015 depends on T014.
- T017 depends on T005 and T016. T018 depends on T017. T019 depends on T018.
- T020 depends on T019.

## Parallel opportunities

- T001, T002, T003 together.
- T005 alongside T004 (different files).
- T012 alongside T010 and T011.
- T022 alongside T020.

## MVP slice

Phases 1 to 3 give a working, Admin-only History table (BEN-146). Phase 4 adds the panel, which acceptance 5 requires, and Phase 5 is the PR gate.
