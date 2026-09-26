# Tasks: Request List drawer & submit

**Spec**: `specs/011-request-list-drawer/spec.md`
**Plan**: `specs/011-request-list-drawer/plan.md`
**Linear**: [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43). Sub-tickets: BEN-58 (drawer UI), BEN-59 (submit + validation mapping), BEN-60 (checks + PR)
**Structure**: By user story, after the foundational phase. The foundational phase follows the plan's *Delivery order*.

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 1: Setup

- [x] T001 [P] [BEN-58] Request List types: `RequestListLine` (`assetId`, `category`, `name`, `model`, `quantity`, `available`) and `RequestListDraftInput` (plan Data Model) — `src/features/requests/create/request-list-types.ts`
- [x] T002 [P] [BEN-59] `RequestSubmitSource` seam and the `SubmitResult` union (`ok` / `invalid` / `refused` / `unreachable`), in SPA vocabulary only, with no HTTP (D8) — `src/features/requests/create/request-submit-source.ts`

## Phase 2: Foundational (blocks every story)

- [x] T003 [BEN-59] Extract the Items Requested table, Note to Approver block and Status section from `RequestDetailPanel` into `RequestReadBack`. The DOM must stay byte-identical in that commit (it did: `df66022`; later drift-driven styling is recorded in spec 007's 2026-09-25 amendment). **Land it as its own commit** and prove it with `node scripts/check-request-detail.mjs` before anything else (D10, Known Risks 4) — `src/features/requests/detail/RequestReadBack.tsx`, `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T004 [P] [BEN-59] `parseValidationProblem(body: unknown)` and `pointerPath(pointer)`. Handle the fragment form with percent-decoding, the plain form, and RFC 6901 `~1`/`~0`. Return `null` for anything that is not an RFC 9457 `validation-error` with `errors[]`. No `any` (D13) — `src/shared/validation.ts`
- [x] T005 [BEN-59] Place problems: `#/purpose` goes to the note, `#/items/N/…` to line N, everything else to the drawer. Deduplicate by `detail` (D14). Depends on T004 — `src/features/requests/create/place-problems.ts`
- [x] T006 [P] [BEN-58] Module-scoped seeded stock store (`available(assetId, office)`, all-or-nothing `reserve(lines, office)`, never negative). Point the seeded catalog source at it (D11) — `src/features/catalog/seeded-stock.ts`, `src/features/catalog/seeded-source.ts`
- [x] T007 [BEN-59] Add `reload()` to every catalog state (amended by D18; not only `ready`), reusing the provider's `attempt` counter (D18) — `src/features/catalog/catalog-context.ts`, `src/features/catalog/CatalogProvider.tsx`
- [x] T008 [BEN-58] Move the `RequestListDraft` seam into the requests feature. Keep `add(item, quantity)` and add `useRequestList()` (lines, note, setNote, setQuantity, remove, refreshAvailability, isOpen, openList, closeList, and the submit guard `beginSubmit` / `endSubmit` with `submitting`, `submitted`, `dismissSubmitted`, `problems`, `refusals`, `editProblems`). There is no `clear`: a successful `endSubmit` takes what `beginSubmit(sent)` recorded out of the list and clears the note if unchanged; lines added mid-submit stay (FR-011, D18). Change only the import paths in the card and the View Specs panel (D4) — `src/features/requests/create/request-draft.ts`, `src/features/catalog/CatalogItemCard.tsx`, `src/features/catalog/ViewSpecsPanel.tsx`
- [x] T009 [BEN-58] `RequestListProvider`:
  - one line per asset, merge-and-cap on `add` (FR-002);
  - quantity bounded by `1…available`, never lowered by a read (FR-003);
  - remove and note; the list is emptied by a successful `endSubmit`, and a held confirmation is closed with `dismissSubmitted` (D7);
  - sync the count to the shell with `setCount(lines.length)` (D2);
  - open state (D3).
  Depends on T001 and T008 — `src/features/requests/create/RequestListProvider.tsx`
- [x] T010 [BEN-58] Mount `RequestListProvider` inside `RequestListCountProvider`, resetting in place when the signed-in user changes — not keyed, see D1 (FR-004a). Remove the interim provider from `CatalogPage` and delete it — `src/app/App.tsx`, `src/features/catalog/CatalogPage.tsx`, `src/features/catalog/RequestListDraftProvider.tsx`
- [x] T011 [BEN-60] Update the gates D3 and D4 change: a repeat add of the same item no longer raises the badge, and the marker opens the drawer. Cite spec 011 FR-002 / D3 in each changed assertion (Known Risks 3) — `scripts/check-catalog.mjs`, `scripts/check-shell.mjs`
  - **Done with no edits (2026-09-25).** Both gates pass unchanged: `check-catalog`'s "+1 badge" adds an item for the first time, which the merge rule doesn't change, and `check-shell` never asserted where the marker went. It did catch a real defect instead: keying the provider by user id remounted the routes and broke FR-017b. See plan D1 (amended). The merge rule and the marker are asserted in `check-request-list.mjs`.

## Phase 3: User Story 1 — Review and edit the request list (P1)

**Goal**: The Employee opens the drawer from the top-bar marker, and edits and removes lines, without stock moving.
**Independent test**: Add two items, open the drawer, step a quantity, remove a line, close and reopen, leave and return to the Catalog. The count and lines agree throughout, and Available is unchanged.

- [x] T012 [US1] [BEN-58] Line row: the category eyebrow over the name (bold), a `− qty +` stepper disabled at 1 and at `available`, **Remove**, and a slot for the line's validation messages — `src/features/requests/create/RequestListLineRow.tsx`
- [x] T013 [US1] [BEN-58] The drawer's editing state, on `SidePanel`:
  - `Request List` header (icon and title; the count is the top bar's), and rows;
  - **Note to Approver (optional)** on a `<textarea>` styled as the drawn `Purpose field` — not `TextField`, whose single-line input submits on Enter (D7);
  - **Submit Request**, disabled when the list is empty;
  - the empty-state copy (FR-006, FR-006c, FR-007, D17).
  — `src/features/requests/create/RequestListDrawer.tsx`
- [x] T014 [US1] [BEN-58] On every open, read `CatalogSource.items(homeOffice)` and refresh each line's `available` without lowering its `quantity` (FR-006b, D6) — `src/features/requests/create/RequestListDrawer.tsx`
- [x] T015 [US1] [BEN-58] Make the top-bar marker call `openList()`, navigating to `/catalog` first when elsewhere. On close, return focus explicitly to the marker (FR-006a, D3, Story 1 AC7) — `src/app/AppLayout.tsx`
- [x] T016 [US1] [BEN-58] Render `RequestListDrawer` on the Catalog when `isOpen` and the role is Employee, passing `homeOffice` and the catalog source (FR-016) — `src/features/catalog/CatalogPage.tsx`
- [x] T017 [P] [US1] [BEN-58] Log the empty drawer and the marker's new behaviour as design additions. Record the marker change as an amendment to spec 003 — `docs/design-system/additions.md`, `specs/003-app-shell-routing/spec.md`

## Phase 4: User Story 2 — Submit the request (P1)

**Goal**: One submit creates one `Pending Approval` request and reserves every line at the Employee's office, or nothing.
**Independent test**: Submit a two-line list with and without a note. The list and count reset, and each asset's Available falls by exactly its quantity.

- [x] T018 [US2] [BEN-59] Seeded submit source:
  - check every line against `seeded-stock` at the user's home office;
  - if any line exceeds Available, refuse with a stock message and reserve nothing;
  - otherwise reserve all lines and return an `EmployeeRequest` with the next `REQ-2026-NNNN`, `Pending Approval`, `submittedAt: now`, and descriptions `"<name> - <model>"` (D8, D11).
  — `src/features/requests/create/seeded-request-submit-source.ts`
- [x] T019 [US2] [BEN-59] Export `appendSeededRequest(user, request)` from the spec 007 seed, and call it from the seeded submit. This is seeded-only glue (D12) — `src/features/requests/detail/seeded-employee-request-source.ts`, `src/features/requests/create/seeded-request-submit-source.ts`
- [x] T020 [US2] [BEN-59] Wire submit in the drawer:
  - the `submitting` state disables the steppers, Remove, the note and the button, labelled *Submitting…*, and blocks a second submit (FR-010, FR-010a);
  - send lines in list order, and a whitespace-only note as absent (D16);
  - on success, take what was sent out of the list and bump the session's `submissions` count; whichever Catalog is mounted then calls its `reload()` (FR-011, D18).
  — `src/features/requests/create/RequestListDrawer.tsx`

## Phase 5: User Story 3 — See what was submitted (P1)

**Goal**: The drawer turns into a confirmation of the request as the system recorded it.
**Independent test**: After a submit, every value in the confirmation matches the created request.

- [x] T021 [US3] [BEN-59] Submitted view:
  - header: the returned id and a `Pending Approval` pill;
  - a success card with the check icon, *Request submitted* and the drawn copy;
  - `RequestReadBack` for items, note (only when present) and the timeline;
  - rows keyed by position — `EmployeeRequest` lines carry no id and never reorder (FR-012, D8a, D9).
  — `src/features/requests/create/SubmittedView.tsx`
- [x] T022 [US3] [BEN-59] Closing from `submitted` returns the drawer to `editing`, so the next open shows the empty state (D7, Story 3 AC6) — `src/features/requests/create/RequestListDrawer.tsx`
  - *Review cycle 2:* `submitting` and `submitted` live in the session list (`RequestListProvider`), so leaving the Catalog by Back mid-submit closes the drawer without losing the confirmation; the next marker open shows it, and closing it (`dismissSubmitted`) returns to `editing`. Gated in `scripts/check-request-list.mjs` with `?slow-submit` — `src/features/requests/create/RequestListProvider.tsx`, `src/features/requests/create/request-draft.ts`
  - *Review cycle 3:* a refusal is held there too (`problems`, `refusals`, `editProblems`), so a refusal that settles after Back closed the drawer is shown, with focus on it, on the next marker open; closing keeps it. `beginSubmit()` returns a ticket that is dropped when the signed-in user changes, so a late answer for the previous user is a no-op and never leaves the next one stuck on `Submitting…`. Gated in `scripts/check-request-list.mjs` with `?slow-submit` and the `submitFixture` hook (D7)

## Phase 6: User Story 4 — Understand a refused submit (P1)

**Goal**: Every refusal is shown where it belongs, verbatim, and nothing is lost or reserved.
**Independent test**: A multi-line over-stock refusal, and the contract's 400 example through the fixture. Messages land in place, the lines and note are intact, and Available is unchanged.

- [x] T023 [US4] [BEN-59] Top-of-drawer `role="alert"` block for `refused` (the API's message verbatim), `unreachable` (*"Your request was not sent."*) and unplaced validation messages. Lines and note are left untouched (FR-013, FR-014, FR-015, D15) — `src/features/requests/create/RequestListDrawer.tsx`
- [x] T024 [US4] [BEN-59] Feed `place-problems` output into the note's invalid state and each line row's message slot. Clear them when the Employee edits that field (FR-013a) — `src/features/requests/create/RequestListDrawer.tsx`, `src/features/requests/create/RequestListLineRow.tsx`
- [x] T025 [US4] [BEN-59] Dev-only `window.__osrs.submitFixture`. When set, the seeded source returns that problem body once as `invalid` through `parseValidationProblem`. Guard it with `import.meta.env.DEV` so it is compiled out of production (D19) — `src/features/requests/create/seeded-request-submit-source.ts`
  - Also exposes the app's own `seededStock` on `window.__osrs` in development. A dynamic import from the check script loads a second copy of the module under Vite. Confirmed absent from `dist/`. The `?fail-submit` flag makes the unreachable state reachable.

## Final Phase: Polish

- [x] T026 [BEN-60] Add a CDP check script. It covers:
  - add, merge, cap, Remove and the count at each step;
  - close and reopen, leaving and returning, and sign-out clearing the list;
  - submit with and without a note, then the confirmation fields;
  - Available deltas;
  - a multi-line over-stock refusal with nothing reserved;
  - the contract's documented 400 example placed through the fixture;
  - no drawer and no marker for the Admin;
  - *(review cycle 1)* a reopen after the stock moved keeps a quantity above the fresher Available with `+` disabled; leaving the Catalog by Back does not leave the drawer set to reopen; Tab / Shift+Tab stay inside; a held submit (`?slow-submit=<ms>`, dev only) cannot be closed by Esc, scrim or ✕ and sends exactly one request (`window.__osrs.submitCalls`); focus moves to a refusal.
  It must **reload before absolute reads and assert deltas only** (Known Risks 5).
  — `scripts/check-request-list.mjs`
- [x] T027 [BEN-60] Register the new gate — `scripts/verify.mjs`
- [x] T028 [BEN-60] Run `npm run verify` (typecheck, lint, every gate, build) and check fidelity against `03 - Request List` and `03.1 - Request List - Request Submitted` — `scripts/verify.mjs`

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
