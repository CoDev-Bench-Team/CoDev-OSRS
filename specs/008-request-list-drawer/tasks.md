# Tasks: Request List drawer & submit

**Spec**: `specs/008-request-list-drawer/spec.md`
**Plan**: `specs/008-request-list-drawer/plan.md`
**Linear**: [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43). Sub-tickets: BEN-58 (drawer UI), BEN-59 (submit + validation mapping), BEN-60 (checks + PR)
**Structure**: By user story, after the foundational phase. The foundational phase follows the plan's *Delivery order*.

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 1: Setup

- [ ] T001 [P] [BEN-58] Request List types: `RequestListLine` (`assetId`, `name`, `model`, `quantity`, `available`) and `RequestListDraftInput` (plan Data Model) — `src/features/requests/create/request-list-types.ts`
- [ ] T002 [P] [BEN-59] `RequestSubmitSource` seam and the `SubmitResult` union (`ok` / `invalid` / `refused` / `unreachable`), in SPA vocabulary only, with no HTTP (D8) — `src/features/requests/create/request-submit-source.ts`

## Phase 2: Foundational (blocks every story)

- [ ] T003 [BEN-59] Extract the Items Requested table, Note to Approver block and Status section from `RequestDetailPanel` into `RequestReadBack`. The DOM must stay byte-identical. **Land it as its own commit** and prove it with `node scripts/check-request-detail.mjs` before anything else (D10, Known Risks 4) — `src/features/requests/detail/RequestReadBack.tsx`, `src/features/requests/detail/RequestDetailPanel.tsx`
- [ ] T004 [P] [BEN-59] `parseValidationProblem(body: unknown)` and `pointerPath(pointer)`. Handle the fragment form with percent-decoding, the plain form, and RFC 6901 `~1`/`~0`. Return `null` for anything that is not an RFC 9457 `validation-error` with `errors[]`. No `any` (D13) — `src/shared/validation.ts`
- [ ] T005 [BEN-59] Place problems: `#/purpose` goes to the note, `#/items/N/…` to line N, everything else to the drawer. Deduplicate by `detail` (D14). Depends on T004 — `src/features/requests/create/place-problems.ts`
- [ ] T006 [P] [BEN-58] Module-scoped seeded stock store (`available(assetId, office)`, all-or-nothing `reserve(lines, office)`, never negative). Point the seeded catalog source at it (D11) — `src/features/catalog/seeded-stock.ts`, `src/features/catalog/seeded-source.ts`
- [ ] T007 [BEN-59] Add `reload()` to the `ready` catalog state, reusing the provider's `attempt` counter (D18) — `src/features/catalog/catalog-context.ts`, `src/features/catalog/CatalogProvider.tsx`
- [ ] T008 [BEN-58] Move the `RequestListDraft` seam into the requests feature. Keep `add(item, quantity)` and add `useRequestList()` (lines, note, setNote, setQuantity, remove, clear, isOpen, openList, closeList). Change only the import paths in the card and the View Specs panel (D4) — `src/features/requests/create/request-draft.ts`, `src/features/catalog/CatalogItemCard.tsx`, `src/features/catalog/ViewSpecsPanel.tsx`
- [ ] T009 [BEN-58] `RequestListProvider`:
  - one line per asset, merge-and-cap on `add` (FR-002);
  - quantity bounded by `1…available`, never lowered by a read (FR-003);
  - remove, clear and note;
  - sync the count to the shell with `setCount(lines.length)` (D2);
  - open state (D3).
  Depends on T001 and T008 — `src/features/requests/create/RequestListProvider.tsx`
- [ ] T010 [BEN-58] Mount `RequestListProvider` inside `RequestListCountProvider`, keyed by the signed-in user's id (FR-004a, D1). Remove the interim provider from `CatalogPage` and delete it — `src/app/App.tsx`, `src/features/catalog/CatalogPage.tsx`, `src/features/catalog/RequestListDraftProvider.tsx`
- [ ] T011 [BEN-60] Update the gates D3 and D4 change: a repeat add of the same item no longer raises the badge, and the marker opens the drawer. Cite spec 008 FR-002 / D3 in each changed assertion (Known Risks 3) — `scripts/check-catalog.mjs`, `scripts/check-shell.mjs`

## Phase 3: User Story 1 — Review and edit the request list (P1)

**Goal**: The Employee opens the drawer from the top-bar marker, and edits and removes lines, without stock moving.
**Independent test**: Add two items, open the drawer, step a quantity, remove a line, close and reopen, leave and return to the Catalog. The count and lines agree throughout, and Available is unchanged.

- [ ] T012 [US1] [BEN-58] Line row: name (bold) over model, a `− qty +` stepper disabled at 1 and at `available`, **Remove**, and a slot for the line's validation messages — `src/features/requests/create/RequestListLineRow.tsx`
- [ ] T013 [US1] [BEN-58] The drawer's editing state, on `SidePanel`:
  - `Request List` header with its count, and rows;
  - **Note to Approver (optional)** on `TextField`;
  - **Submit Request**, disabled when the list is empty;
  - the empty-state copy (FR-006, FR-006c, FR-007, D17).
  — `src/features/requests/create/RequestListDrawer.tsx`
- [ ] T014 [US1] [BEN-58] On every open, read `CatalogSource.items(homeOffice)` and refresh each line's `available` without lowering its `quantity` (FR-006b, D6) — `src/features/requests/create/RequestListDrawer.tsx`
- [ ] T015 [US1] [BEN-58] Make the top-bar marker call `openList()`, navigating to `/catalog` first when elsewhere. On close, return focus explicitly to the marker (FR-006a, D3, Story 1 AC7) — `src/app/AppLayout.tsx`
- [ ] T016 [US1] [BEN-58] Render `RequestListDrawer` on the Catalog when `isOpen` and the role is Employee, passing `homeOffice` and the catalog source (FR-016) — `src/features/catalog/CatalogPage.tsx`
- [ ] T017 [P] [US1] [BEN-58] Log the empty drawer and the marker's new behaviour as design additions. Record the marker change as an amendment to spec 003 — `docs/design-system/additions.md`, `specs/003-app-shell-routing/spec.md`

## Phase 4: User Story 2 — Submit the request (P1)

**Goal**: One submit creates one `Pending Approval` request and reserves every line at the Employee's office, or nothing.
**Independent test**: Submit a two-line list with and without a note. The list and count reset, and each asset's Available falls by exactly its quantity.

- [ ] T018 [US2] [BEN-59] Seeded submit source:
  - check every line against `seeded-stock` at the user's home office;
  - if any line exceeds Available, refuse with a stock message and reserve nothing;
  - otherwise reserve all lines and return an `EmployeeRequest` with the next `REQ-2026-NNNN`, `Pending Approval`, `submittedAt: now`, and descriptions `"<name> - <model>"` (D8, D11).
  — `src/features/requests/create/seeded-request-submit-source.ts`
- [ ] T019 [US2] [BEN-59] Export `append(user, request)` from the spec 007 seed, and call it from the seeded submit. This is seeded-only glue (D12) — `src/features/requests/detail/seeded-employee-request-source.ts`, `src/features/requests/create/seeded-request-submit-source.ts`
- [ ] T020 [US2] [BEN-59] Wire submit in the drawer:
  - the `submitting` state disables the steppers, Remove, the note and the button, labelled *Submitting…*, and blocks a second submit (FR-010, FR-010a);
  - send lines in list order, and a whitespace-only note as absent (D16);
  - on success, clear the list and call the Catalog's `reload()` (FR-011).
  — `src/features/requests/create/RequestListDrawer.tsx`

## Phase 5: User Story 3 — See what was submitted (P1)

**Goal**: The drawer turns into a confirmation of the request as the system recorded it.
**Independent test**: After a submit, every value in the confirmation matches the created request.

- [ ] T021 [US3] [BEN-59] Submitted view:
  - header: the returned id and a `Pending Approval` pill;
  - a success card with the check icon, *Request submitted* and the drawn copy;
  - `RequestReadBack` for items, note (only when present) and the timeline;
  - rows keyed by `assetId` (FR-012, D8a, D9).
  — `src/features/requests/create/SubmittedView.tsx`
- [ ] T022 [US3] [BEN-59] Closing from `submitted` returns the drawer to `editing`, so the next open shows the empty state (D7, Story 3 AC6) — `src/features/requests/create/RequestListDrawer.tsx`

## Phase 6: User Story 4 — Understand a refused submit (P1)

**Goal**: Every refusal is shown where it belongs, verbatim, and nothing is lost or reserved.
**Independent test**: A multi-line over-stock refusal, and the contract's 400 example through the fixture. Messages land in place, the lines and note are intact, and Available is unchanged.

- [ ] T023 [US4] [BEN-59] Top-of-drawer `role="alert"` block for `refused` (the API's message verbatim), `unreachable` (*"Your request was not sent."*) and unplaced validation messages. Lines and note are left untouched (FR-013, FR-014, FR-015, D15) — `src/features/requests/create/RequestListDrawer.tsx`
- [ ] T024 [US4] [BEN-59] Feed `place-problems` output into the note's invalid state and each line row's message slot. Clear them when the Employee edits that field (FR-013a) — `src/features/requests/create/RequestListDrawer.tsx`, `src/features/requests/create/RequestListLineRow.tsx`
- [ ] T025 [US4] [BEN-59] Dev-only `window.__osrs.submitFixture`. When set, the seeded source returns that problem body once as `invalid` through `parseValidationProblem`. Guard it with `import.meta.env.DEV` so it is compiled out of production (D19) — `src/features/requests/create/seeded-request-submit-source.ts`

## Final Phase: Polish

- [ ] T026 [BEN-60] Add a CDP check script. It covers:
  - add, merge, cap, Remove and the count at each step;
  - close and reopen, leaving and returning, and sign-out clearing the list;
  - submit with and without a note, then the confirmation fields;
  - Available deltas;
  - a multi-line over-stock refusal with nothing reserved;
  - the contract's documented 400 example placed through the fixture;
  - no drawer and no marker for the Admin.
  It must **reload before absolute reads and assert deltas only** (Known Risks 5).
  — `scripts/check-request-list.mjs`
- [ ] T027 [BEN-60] Register the new gate — `scripts/verify.mjs`
- [ ] T028 [BEN-60] Run `npm run verify` (typecheck, lint, every gate, build) and check fidelity against `03 - Request List` and `03.1 - Request List - Request Submitted` — `scripts/verify.mjs`

## Dependencies

- Phase 1, then Phase 2, then the stories. T003 lands first and alone.
- T005 needs T004. T009 needs T001 and T008. T010 needs T009. T011 needs T010 for the catalog half, and T015 for the shell half (the marker).
- US1 (T012–T016) needs Phase 2.
- US2 needs US1's drawer (T013), plus T002, T006 and T007.
- US3 needs T003 and T020.
- US4 needs T005 and T020.
- The Polish phase needs everything above.

## MVP slice

Phases 1–4: edit and a reserving submit. US3 and US4 complete BEN-59.

## Parallel opportunities

T001 with T002. After T003: T004 with T006. T017 alongside any US1 task.

## Blocked on the backend, not on code

A live `RequestSubmitSource` needs the success body and the insufficient-stock
refusal published (contract conflict 4). BEN-60's "validation mapping
demonstrated against a real 400" needs the live source too. Until then, T025
demonstrates it with the contract's documented example.
