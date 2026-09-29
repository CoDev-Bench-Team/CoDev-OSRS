# Tasks: Request Review Panel + Admin Transitions

**Spec**: `specs/008-request-review-panel/spec.md`  
**Plan**: `specs/008-request-review-panel/plan.md`  
**Structure**: By delivery slice. One phase is one PR, as plan "Delivery slices" sets out.

Linear lifecycle: BEN-76 (G0, spec) → BEN-77 (G1, plan/tasks) → BEN-78 (G2) → BEN-79 (G3a, G3b). G3b was blocked on the `Received` amendment, which landed as constitution 5.0.0 (BEN-43). Admin cancel is BEN-135 and is not in this list.

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 0: Spec and doc amendments (BEN-77)

- [x] T001 [BEN-77] Amend spec 003, Session 2026-09-26: the Admin's `/requests/:id` is retired and falls to not-found for every role and id (plan D10) — `specs/003-app-shell-routing/spec.md` *(superseded by T031–T034: the route stays, as a deep link that opens the panel)*
- [x] T002 [P] [BEN-77] Annotate FR-010 "superseded by spec 008 FR-001" — `specs/004-approver-pending-queue/spec.md`
- [x] T003 [P] [BEN-77] Log undrawn additions §3h: pickup-location select + `Other…` field, pickup read-back row, Update Status on handover states, Complete confirm (D12) — `docs/design-system/additions.md`
- [x] T004 [P] [BEN-77] Add spec 008 to the index; tick tasks.md T015/T016/T017/T018 as owned by spec 008 — `specs/README.md`, `specs/001-office-supplies-mvp/tasks.md`
- [ ] T005 [BEN-77] Ask the backend whether the "View request" email links to `/requests/:id`, and record the answer on BEN-78 before G2 merges (accepted risk R3) — `specs/008-request-review-panel/plan.md` *(asked on BEN-78, 2026-09-26. No longer blocking: `/requests/:id` is now a deep link that opens the panel (T031–T034), so an email that links there works. The answer only confirms the address the emails use.)*

## Phase 1: Foundations (BEN-78)

- [x] T006 [BEN-78] Read model and source interface: `ReviewLine`, `PickupLocation`, `ReviewRequest`, `ReviewRefusal`, `TransitionResult`, `AdminRequestSource extends QueueSource` — `src/features/requests/queue/review-types.ts`
- [x] T007 [BEN-78] `reviewActions(status)`, exhaustive via `satisfies Record<RequestStatus, …>`, no `complete` row (D1, D2) — `src/features/requests/queue/review-actions.ts`
- [x] T008 [BEN-78] Seeded Admin source replacing the queue seed: same 15 ids, plus lines with `available`, `requestorOffice`, notes, timestamps, and terminal reasons. 1847 matches frame `02.2`. `pickupOffices` comes from the auth `Office` enum. `approve`/`reject` guard the from-status. No stock math — `src/features/requests/queue/seeded-admin-request-source.ts`, delete `src/features/requests/queue/seeded-queue-source.ts`
- [x] T009 [BEN-78] Source picker plus dev-only `?review=changes|failing|reload-fails` stub (FR-014) — `src/features/requests/queue/admin-request-source.ts`, `src/features/requests/queue/dev/review-stub.ts`
- [x] T010 [P] [BEN-78] Move the timeline to `requests/` and widen it to `TimelineFacts` (D11); update the 007 import — `src/features/requests/request-timeline.ts`, `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T011 [P] [BEN-78] Extract `ReasonForm` (required, trimmed, `TextField tone="danger"`, Cancel/Confirm) and switch the Employee's cancel to it, with no behaviour change (D6) — `src/features/requests/ReasonForm.tsx`, `src/features/requests/detail/RequestDetailPanel.tsx`

## Phase 2: G2 — Read, approve, reject (US1, US2) (BEN-78)

- [x] T012 [US1] [BEN-78] `ReviewPanel` body: id + pill header, REQUESTED BY (Avatar, name, `email • office`), `ITEM · QTY · CURRENT INVENTORY` (`<n> in stock` / unavailable marker), Note to Approver when present, STATUS timeline, stop-reason read-back — `src/features/requests/queue/ReviewPanel.tsx`
- [x] T013 [US1] [BEN-78] **Review** becomes a button that sets `openId`, and the page renders the panel. Shared `reload()` keeps the snapshot on screen during a post-transition reload (D3, D5). Focus returns to the row, or to the chips' group if the row has gone. Query state is preserved — `src/features/requests/queue/QueuePage.tsx`
- [x] T014 [US2] [BEN-78] Pending actions **Reject Request** / **Approve Request** with the email note. Panel modes `idle`/`rejecting`/`submitting`. Reject via `ReasonForm` (`Reason for rejection *`, placeholder `e.g item on hold, insufficient justification...`, **Confirm Rejection**). Refusal and failure notices keep the input (FR-014, FR-015) — `src/features/requests/queue/ReviewPanel.tsx`
- [x] T015 [US2] [BEN-78] Terminal read-only state: reason read-back and **Close** only — `src/features/requests/queue/ReviewPanel.tsx`
- [x] T016 [BEN-78] Retire `requestDetail`: remove the destination, route and placeholder, and delete the seeded ownership ids (D10) — `src/app/destinations.ts`, `src/app/routes.tsx`, `src/app/placeholders.tsx`, `src/app/seeded-request-ids.ts` *(superseded by T031–T034: `requestDetail` is kept as a deep link)*
- [x] T017 [BEN-78] Update the shell check: `/requests/:id` is not-found for both roles and every id — `scripts/check-shell.mjs` *(superseded by T034: the check now asserts the deep link)*
- [x] T018 [BEN-78] New check, G2 cases:
  - FR-005 actions per seeded status
  - open/close via ✕, Esc and scrim, with address, focus and query kept
  - reject empty/whitespace refused, valid → `Rejected` + read-back + row gone + counts drop
  - approve → `Approved` + Pending card −1
  - `?review=changes|failing|reload-fails`

  Wire it into verify — `scripts/check-review-panel.mjs`, `scripts/verify.mjs`
- [ ] T019 [BEN-78] `npm run lint`, `npm run build`, `npm run verify` green, including the unchanged `scripts/check-request-detail.mjs`. Fidelity against `02.2`, `02.2.2` and `02.2.2.1` at 1440px and 360px. PR to `dev` *(all 15 gates green; PR #46 open against `dev`. What remains: the designer's fidelity sign-off.)*

## Phase 2b: Other Notes on a decision (BEN-47, 2026-09-29)

- [x] T035 [US2] [BEN-47] Record frame `02.2`'s Other Notes: drift note, FR-007a, contracts conflict 6 — `docs/design-system/drift-2026-09-29.md`, `specs/008-request-review-panel/spec.md`, `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T036 [US2] [BEN-47] Optional **Other Notes (optional)** box at the bottom of the pending panel, sent trimmed with approve or reject; `approve(id, notes?)` / `reject(id, reason, notes?)`, and the seed stores `otherNotes` — `src/features/requests/queue/ReviewPanel.tsx`, `src/features/requests/queue/review-types.ts`, `src/features/requests/queue/seeded-admin-request-source.ts`, `src/features/requests/queue/QueuePage.tsx`
- [x] T037 [US2] [BEN-47] Check: field present and optional on a pending request, kept on backing out of a reject and on a failed reject, gone after the decision; the reason selectors target the required box — `scripts/check-review-panel.mjs`

## Phase 2c: The Admin marks `Received` (BEN-47, 2026-09-29)

- [x] T038 [US3] [BEN-47] Amend first: constitution 6.0.0, ADR-0010, process flow, ARCHITECT, spec 001 FR-012a / US5, spec 008 FR-008 / FR-008a, contracts conflict 5, additions §3h — `AGENTS.md`, `specs/constitution.md`, `docs/adr/0010-admin-marks-received.md`, `docs/process-flow.md`, `ARCHITECT.md`, `specs/001-office-supplies-mvp/`, `specs/008-request-review-panel/spec.md`, `docs/design-system/additions.md`
- [x] T039 [US3] [BEN-47] `UpdateStatusTarget` and `updateStatusTargets(status)`; the Status select offers **Received** from a handover state; seeded `updateStatus(id, 'Received')` from `For Delivery` / `Ready for Pickup` only, setting `receivedAt` and keeping the handover and location — `src/features/requests/queue/review-types.ts`, `src/features/requests/queue/UpdateStatusForm.tsx`, `src/features/requests/queue/ReviewPanel.tsx`, `src/features/requests/queue/seeded-admin-request-source.ts`
- [x] T040 [US3] [BEN-47] Check: no **Received** from `Approved`; offered from a handover state, asks no location, reaches `Received` with the handover node kept, and offers no action — `scripts/check-review-panel.mjs`
- [x] T041 [US3] [BEN-47] **Received** first and preselected on a handover state; shared `ConfirmDialog`; every valid Update Status confirms first (FR-008b) — `src/shared/ui/overlay/ConfirmDialog.tsx`, `src/shared/ui/index.ts`, `src/features/requests/queue/review-types.ts`, `src/features/requests/queue/UpdateStatusForm.tsx`, `docs/design-system/additions.md`
- [x] T042 [US3] [BEN-47] Check: an invalid submit asks nothing; the dialog names the change and opens on Cancel; Cancel and Esc send nothing and keep the panel and form; Received is preselected and its dialog warns it cannot be undone — `scripts/check-review-panel.mjs`
- [x] T043 [US3] [BEN-47] The Status select drops the current status; the stored-location start and the no-change refusal go with it — `src/features/requests/queue/review-types.ts`, `src/features/requests/queue/UpdateStatusForm.tsx`, `src/features/requests/queue/ReviewPanel.tsx`, `scripts/check-review-panel.mjs`
- [x] T044 [BEN-47] Review fixes: `ConfirmDialog` scrim needs press and release on the scrim; checks for the dialog's scrim and a failed Update Status; plan amended (D2, D7, D8, D12, D13, R6, R7) — `src/shared/ui/overlay/ConfirmDialog.tsx`, `scripts/check-review-panel.mjs`, `specs/008-request-review-panel/plan.md`
- [x] T045 [BEN-47] Review fixes: the seeded source refuses a handover to the current status `status-changed` (FR-014); `SidePanel` and `ConfirmDialog` share one scrim guard and one Tab wrap; checks for the confirmation's Tab cycle, focus returning to Update Status, and the same-status refusal; FR-008b drops the unreachable "unchanged" case — `src/features/requests/queue/seeded-admin-request-source.ts`, `src/shared/ui/overlay/modal-dialog.ts`, `src/shared/ui/overlay/SidePanel.tsx`, `src/shared/ui/overlay/ConfirmDialog.tsx`, `scripts/check-review-panel.mjs`, `specs/008-request-review-panel/spec.md`

## Phase 3: G3a — Hand over (US3) (BEN-79)

- [x] T020 [US3] [BEN-79] Seeded `updateStatus(id, to, pickup?)`: from `Approved`/`For Delivery`/`Ready for Pickup` only; `Ready for Pickup` requires a location (`location-required`); sets `handover`, `handedOverAt`, `pickupLocation` — `src/features/requests/queue/seeded-admin-request-source.ts`, `src/features/requests/queue/review-types.ts`
- [x] T021 [US3] [BEN-79] `UpdateStatusForm`: `Status *` select, then for Ready for Pickup `Pickup location *` (source offices, request's office preselected, then `Other…`), then free text for `Other…`, with trimmed-empty refusal (D7) — `src/features/requests/queue/UpdateStatusForm.tsx`
- [x] T022 [US3] [BEN-79] `updateStatus` rows in `reviewActions` for `Approved`/`For Delivery`/`Ready for Pickup`; `updating` mode in the panel; pickup-location read-back row — `src/features/requests/queue/review-actions.ts`, `src/features/requests/queue/ReviewPanel.tsx`
- [x] T023 [US3] [BEN-79] Check G3a cases:
  - Ready for Pickup with no location / `Other…` blank is refused
  - office and `Other…` succeed
  - For Delivery ↔ Ready for Pickup swap
  - no **Complete** on any handover state (SC-005)
  - the preselected office is always in the list (accepted risk R4)

  — `scripts/check-review-panel.mjs`
- [ ] T024 [BEN-79] Lint, build, verify; fidelity against `02.2.1 Approve` and `02.2.1 Update Status`; PR to `dev` *(gates green; PR #46 open against `dev`. What remains: the designer's fidelity sign-off.)*

## Phase 3b: `/requests/:id` deep link (BEN-47, 2026-09-26)

- [x] T031 [BEN-47] Amend spec 003 (Session 2026-09-26) and spec 008 (FR-001a, D10): the address is a deep link that opens the panel — `specs/003-app-shell-routing/spec.md`, `specs/008-request-review-panel/`
- [x] T032 [BEN-47] `requestDetail` destination for both roles; `RequestDeepLink` forwards by role — `src/app/destinations.ts`, `src/app/routes.tsx`, `src/app/RequestDeepLink.tsx`
- [x] T033 [BEN-47] `useDeepLinkedRequest`: open once the list loads, one notice for an id the page may not show, consume the state — `src/features/requests/deep-link.ts`, `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/history/MyRequestsPage.tsx`
- [x] T034 [BEN-47] Check both roles, a decided request, missing and foreign ids, and the link surviving sign-in — `scripts/check-shell.mjs`

## Phase 4: G3b — Complete (US4) (BEN-79) — unblocked by constitution 5.0.0

`Received` is in `RequestStatus` since constitution 5.0.0. Complete comes only from `Received` and changes no quantity (constitution 5.0.0 III, IV); the Employee's Accountability Form, which sets `Received`, is spec 001 T018b.

- [ ] T025 [US4] [BEN-79] Add the `Received` row (`complete`) to `reviewActions`; the build must fail until it is added (D2) — `src/features/requests/queue/review-actions.ts`
- [ ] T026 [US4] [BEN-79] Seeded `complete(id)` from `Received` only, setting `completedAt`, with no stock math — `src/features/requests/queue/seeded-admin-request-source.ts`, `src/features/requests/queue/review-types.ts`
- [ ] T027 [US4] [BEN-79] Confirm `Mark this request as completed?` · Cancel / **Complete** in the shared `ConfirmDialog` (D8, amended 2026-09-29) — `src/features/requests/queue/ReviewPanel.tsx`
- [x] T028 [US4] [BEN-79] Five-node timeline with a `Received` node — `src/features/requests/request-timeline.ts` *(arrived via dev: spec 001 T000g / BEN-43; asserted by `scripts/check-review-panel.mjs`)*
- [ ] T029 [US4] [BEN-79] Check G3b cases: Complete only on `Received`; nothing sent before confirmation; `Completed` → row gone — `scripts/check-review-panel.mjs`
- [ ] T030 [BEN-79] Lint, build, verify; fidelity against `02.2.1 Update Status` (2); PR to `dev`

## Dependencies

- Phase 0 T001 before T016/T017.
- T006 → T007, T008 → T009. T010 and T011 are independent of T006–T009.
- Phase 1 → Phase 2 → Phase 3 → Phase 4.
- Phase 4 needs a `Received` request to act on, which the Admin's **Received** (T039) or the Accountability Form (spec 001 T018b) produces.

## Parallel opportunities

T002, T003, T004 together. T010 and T011 alongside T006–T009.

## MVP slice

Phases 0–2 (G2): a working review panel with approve and reject on the seed. Phase 3 completes the handover. Phase 4 is next.
