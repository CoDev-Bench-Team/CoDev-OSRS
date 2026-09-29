# Tasks: Accountability Form (Employee confirms receipt on `Received`)

**Spec**: `specs/012-accountability-form/spec.md`
**Plan**: `specs/012-accountability-form/plan.md`
**Linear**: [BEN-136](https://linear.app/bench-synergy-project/issue/BEN-136). Sub-tickets: BEN-138 (K1 plan + tasks), BEN-139 (K2 form UI), BEN-140 (K3 submit + API errors), BEN-141 (K4 checks + PR)
**Structure**: By Linear sub-issue. K2 is split by user story after its foundations. K3 is blocked on the backend contract (conflict 5).

Format: `- [ ] [TaskID] [P?] [Story?] [Ticket] Description — path`

## Phase 1: K1 — Governing docs (BEN-138)

- [x] T001 [BEN-138] Amend spec 007: Story 3 and SC-005 now read that no control **sets** `Received` or `Completed` directly, and that the only receipt control is spec 012's form. Add a Session 2026-09-26 amendment that cites spec 012 (D16) — `specs/007-employee-request-panel/spec.md`
- [x] T002 [P] [BEN-138] Point spec 001's T018b at `specs/012-accountability-form/tasks.md` for the breakdown — `specs/001-office-supplies-mvp/tasks.md`

## Phase 2: K2 — Foundations (BEN-139; blocks every story)

- [x] T003 [BEN-139] **Design re-check before any code.** Compare `exported_at` in the current `.fig` with 2026-09-26T02:49:27Z. If it is newer, re-decode `04.1` and diff it against plan D2–D9: the Other Notes card, the Complete Request button, the timeline order, and the form's fields and copy. Any change is recorded as a drift entry first, and it stops this phase until the spec absorbs it (D16a, constitution I) — `docs/design-system/drift-2026-09-26.md`
  - **Done 2026-09-26: no change.** The only export is still `2026-09-26T02:49:27.712Z`, the baseline the plan was read from.
- [x] T004 [P] [BEN-139] Types: `Signature` (`{ agreed: true; fullName: string }`), `SignResult` (`ok` / `status-changed` / `unavailable` with optional `detail` / `invalid` with `FieldProblem[]`), and `sign(user, id, signature)` on `EmployeeRequestSource` (plan Data Model) — `src/features/requests/detail/request-detail-types.ts`
- [x] T005 [BEN-139] Extract `RequestLinesTable` (ITEM / QTY) from `RequestReadBack`. **Land it as its own commit**, with the DOM unchanged, and prove it with `node scripts/check-request-detail.mjs` (D7) — `src/features/requests/detail/RequestLinesTable.tsx`, `src/features/requests/detail/RequestReadBack.tsx`
  - **Done.** `check-request-detail` passed on the extraction alone. Not committed yet, so it is not a separate commit yet; see the PR note.
- [x] T006 [P] [BEN-139] `SidePanel` `width?: 'default' | 'wide'`, as `min(400px|564px, 100vw)`. Default rendering unchanged (D3) — `src/shared/ui/overlay/SidePanel.tsx`
- [x] T007 [P] [BEN-139] `Checkbox`: native input, visually hidden; 24px hit, 22px thumb, `r=6`, 1px inside `--color-black` border; ticked: black thumb with a white check. It has an invalid state (a `red-600` ring, a message via `aria-describedby`) and an unavailable state (`aria-disabled="true"`, never `disabled`): the change is cancelled, the thumb is `Border-Strong`, the label is `Ink-400`, and `onBlockedAttempt` fires on click and Space. The JSDoc names the D5 rationale (D5) — `src/shared/ui/forms/Checkbox.tsx`
  - **Done, with one change.** The focus ring sits on the 24px box as a `has-focus-visible:` box-shadow, not a `peer-focus-visible:` outline. `check-utilities` reads the `peer` marker as a dead utility, and the a11y gate's Tab check reads a ringed parent. The ticked state's icon is an undrawn placeholder in the file, so the white check is an addition (§3i).
- [x] T008 [P] [BEN-139] `InputField`: label Inter Bold 11 in `Ink-900`, 6px above a 39px box with a 1px `Border` stroke, `r=6`, 12px side padding and Inter Regular 12; `required` / `invalid` / `message` as `TextField`. Cross-reference `TextField` in both JSDocs (D6, A3) — `src/shared/ui/forms/InputField.tsx`, `src/shared/ui/forms/TextField.tsx`
- [x] T009 [P] [BEN-139] `BoxiconsPenAlt` 16px icon, with the vector path taken from `04.1`'s `boxicons:pen-alt` (D9) — `src/shared/ui/icons/BoxiconsPenAlt.tsx`
  - **Done.** The path is the file's own fill geometry, decoded from the `.fig`.
- [x] T010 [BEN-139] Export T007–T009 and add gallery rows: checkbox unticked / ticked / invalid / unavailable; input field resting / invalid; the icon. Depends on T007–T009 — `src/shared/ui/index.ts`, `src/shared/ui/gallery/Gallery.tsx`
- [x] T011 [P] [BEN-139] The conditions constant: `04.1`'s lead-in, the eleven items of spec 012 FR-004 **verbatim** (curly `’` in item 11 included), and the closing line (D8) — `src/features/requests/detail/accountability-conditions.ts`
- [x] T012 [P] [BEN-139] `useReadToEnd(boxRef)`: a one-way `false → true` when `scrollTop + clientHeight >= scrollHeight - 2`, checked on `scroll`, on mount and on `ResizeObserver` (D8a) — `src/features/requests/detail/use-read-to-end.ts`
- [x] T013 [P] [BEN-139] `placeSignProblems(problems)` → `{ agreed, fullName, form }`. The pointer table is **empty**, so everything goes to `form`; deduplicate by `detail`. A comment says K3 fills the table from the contract (D13) — `src/features/requests/detail/place-sign-problems.ts`
- [x] T014 [BEN-139] Seeded `sign`, refusing in D14's order: not an Employee or not the owner → `unavailable`; not agreed or blank name → `invalid` at the whole document; status not `Received`, or already signed → `status-changed`. On success: `signedAt: now`, the status left at `Received`, the signature not stored (amended 2026-09-29, T036). Depends on T004 — `src/features/requests/detail/seeded-employee-request-source.ts`
- [x] T015 [BEN-139] Dev stub: add a `sign` passthrough to every existing mode, plus `sign-changes`, `sign-invalid`, `sign-fails` and `sign-slow` (D15). Update the header comment. Depends on T014 — `src/features/requests/detail/dev/request-stub.ts`
- [x] T016 [BEN-139] Page `sign` handler beside `cancel`: catch → `unavailable`; reload; a `status-changed` whose reload fails → `unavailable`; a failed reload keeps the list with the signed request swapped in. Pass it as `onSign`. Depends on T004 — `src/features/requests/history/MyRequestsPage.tsx`

## Phase 3: K2 — Story 1: Sign for a received request (P1, BEN-139)

**Goal**: The Employee opens the form from their own unsigned `Received` request, signs, and sees it recorded (amended 2026-09-29).
**Independent test**: On the seed, sign REQ-2026-1820 (`Received`, unsigned). It stays `Received`, the link goes, and *Accountability form signed* shows with a time.

- [x] T017 [US1] [BEN-139] `AccountabilityForm` body: **EQUIPMENT ASSIGNED** over `RequestLinesTable`, then **ACKNOWLEDGEMENT** over the 412px scrolling box (`Body 3`, 1px `--color-osrs-border-strong`, `r=8`, 10px padding, `role="region"`, `aria-label="Acknowledgement"`, `tabIndex={0}`; `<p>` + `<ol>` + `<p>`), then the checkbox, then *Type full name to sign*. Inner blocks are `w-full`. No Other Notes. The footer's **Cancel** / **I acknowledge and sign** buttons submit through `form={id}` (D4, D7, D8) — `src/features/requests/detail/AccountabilityForm.tsx`
- [x] T018 [US1] [BEN-139] Panel modes `read | cancel | sign`. The **Sign accountability form** link goes after the timeline, only on an unsigned `Received` request (amended 2026-09-29, T036; `receive` mode added by T039). In `sign`: the header is **Accountability Form** (`H2`) with no pill, `width="wide"`, and the form as the body and footer. No Complete Request control in any mode (D2, D9, FR-001a). Depends on T017 — `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T019 [US1] [BEN-139] Focus across modes: entering `sign` focuses the form heading; **Cancel** returns focus to the link; success or a `status-changed` refusal returns focus to the panel heading, or to the `RefusalAlert` when it shows (D9a) — `src/features/requests/detail/RequestDetailPanel.tsx`
- [x] T020 [US1] [BEN-139] One signature per open form: `submitting` disables both buttons, a `useRef` guard drops a second activation, and `SidePanel dismissible={!submitting}`. The ok path returns to `read` (D11, D12) — `src/features/requests/detail/RequestDetailPanel.tsx`, `src/features/requests/detail/AccountabilityForm.tsx`

## Phase 4: K2 — Story 2: Refuse an incomplete signature (P1, BEN-139)

**Goal**: Nothing is sent without the agreement and a non-blank name.
**Independent test**: Try every combination of an unticked box, an empty name and a whitespace name. Nothing is sent, the right messages show, and they clear as fields are fixed.

- [x] T021 [US2] [BEN-139] Submit-time validation: `agreed`, and `fullName.trim()` non-empty. Messages: *"Tick the box to confirm you agree to the conditions."* / *"Type your full name to sign."* Focus the first invalid control, and clear each message once its field is valid. Send the name trimmed (D10, FR-007) — `src/features/requests/detail/AccountabilityForm.tsx`

## Phase 5: K2 — Story 2a: Read before agreeing (P1, BEN-139)

**Goal**: The checkbox unlocks only once the acknowledgement has been scrolled to its end.
**Independent test**: On opening, a click or Space on the checkbox shows the read-first message. Scroll to the end and it ticks; scroll back up and it still ticks. Text that fits unlocks at once.

- [x] T022 [US2a] [BEN-139] Wire `useReadToEnd` to the box and the checkbox's unavailable state. A blocked attempt shows *"Scroll to the end of the acknowledgement and read it before agreeing."*, which clears on unlock. A submit before unlock shows that message instead of the agreement one. Reopening the form starts locked (D8a, FR-005a). Depends on T012, T017, T021 — `src/features/requests/detail/AccountabilityForm.tsx`

## Phase 6: K2 — Story 3: Show a refusal from the system (P1, BEN-139)

**Goal**: A refused signature shows the system's words and the request's current state.
**Independent test**: `?requests=sign-changes` → back in `read`, with the alert, and the request shown `Received` and signed. `?requests=sign-invalid` → both messages at the top of the form. `?requests=sign-fails` → the form stays with its values and can be retried.

- [x] T023 [US3] [BEN-139] Outcome handling. `status-changed`: back to `read`, with a `RefusalAlert` showing `detail`, or SPA copy when there is none. `invalid`: stay in `sign`, with `placeSignProblems` output under its fields and at the top. `unavailable` or a throw: stay in `sign`, keep the values, and show *"Your signature was not sent. Try again."* at the top (D12, D13). Depends on T013, T016, T018 — `src/features/requests/detail/RequestDetailPanel.tsx`, `src/features/requests/detail/AccountabilityForm.tsx`

## Phase 7: K2 — Story 4: Nobody else is offered the form (P1, BEN-139)

**Goal**: Only the owning Employee, and only on their own unsigned `Received` request (amended 2026-09-29).
**Independent test**: Every other seeded status, and a signed `Received` request, shows no link. `Received` shows no Cancel Request. The Admin queue offers no form.

- [x] T024 [US4] [BEN-139] Audit the Admin surfaces and confirm that nothing offers the form. Add a comment to the queue source recording how `Received` is reached: an Admin or the owning Employee marks it, and signing changes no status (FR-013, as amended 2026-09-29). No behaviour change is expected — `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/queue/seeded-queue-source.ts`
  - **Done, in `queue-types.ts`**, where the queue defines `Received` as live; `QueuePage.tsx` and `seeded-queue-source.ts` offer only *Review* and needed no comment.

## Phase 8: K2 — Design record (BEN-139)

- [x] T025 [BEN-139] additions §3i: the checkbox's invalid and unavailable states; the read-to-the-end gate; the owner's eleven conditions in place of the drawn ten (flagged); the name field's invalid state; the field and refusal copy; QTY in place of PR; the omitted Other Notes card and Complete Request button (flagged); the native scrollbar; the header without a pill (D17) — `docs/design-system/additions.md`

## Phase 8b: Amendment — the Admin or the owning Employee sets `Received` (2026-09-29, constitution 7.0.0)

- [x] T035 [BEN-139] Constitution 7.0.0 and ADR-0011; `ARCHITECT.md`, `CLAUDE.md`, `docs/product.md`, `docs/process-flow.md`, drift-2026-09-26 note; spec 001 (US5, FR-011/012/012a/012b, entity, edge cases, SC-001, session), its tasks T017/T018/T018b, contracts conflict 5; spec 007 Story 3; spec 012 and plan 012 — `AGENTS.md`, `specs/constitution.md`, `docs/adr/0011-admin-sets-received-employee-signs.md`
- [x] T036 [BEN-139] Read model gains `signedAt`; the link shows only on an unsigned `Received` request; the signed line (plan D18); the seeded `sign` records `signedAt` and leaves the status; the seeded Completed request counts as signed; `sign-changes` becomes "signed from another tab" — `src/features/requests/detail/`
- [x] T037 [BEN-141] Gates follow: `check-accountability-form` opens the form from REQ-2026-1820 and expects the request to stay `Received` with the signed line; `check-a11y-responsive` opens it from REQ-2026-1820. `npm run verify`: all 15 gates pass — `scripts/check-accountability-form.mjs`, `scripts/check-a11y-responsive.mjs`
- [x] T039 [BEN-139] **Mark as Received** for the owning Employee (constitution 7.0.0 widened, ADR-0011; spec 012 Story 0, FR-016–FR-019; plan D19): seam `markReceived`, seeded guard, `receive-changes` stub, page handler, the panel's `receive` mode with its confirmation, `Button` forwards `ref`. Governing docs, spec 001, spec 007 and `contracts/README.md` widened to match — `src/features/requests/`, `src/shared/ui/actions/Button.tsx`
- [x] T040 [BEN-141] Gates: `check-accountability-form` covers Story 0 (SC-008), including a double confirm, an end-to-end mark-then-sign, and the no-answer path through a `receive-fails` stub (AC6); `check-request-detail`'s no-receipt assertion is narrowed to completion controls, with Mark as Received required exactly on handed-over rows. `npm run verify`: all 15 gates pass — `scripts/check-accountability-form.mjs`, `scripts/check-request-detail.mjs`
- [ ] T038 Hand-off to BEN-47 (the Admin review/Update Status panel): it must offer `Received` from `For Delivery` / `Ready for Pickup` (the Admin's own route to it; the Employee's is T039), and offer **Complete** only on a signed `Received` request (spec 001 T017, T018) — `specs/001-office-supplies-mvp/tasks.md`

## Phase 9: K3 — Contract-backed submission (BEN-140; **blocked on contracts/README.md conflict 5**)

- [ ] T026 [BEN-140] A contract-backed `EmployeeRequestSource.sign` that maps `Signature` into the published payload. Send only contract fields; `agreed` stays client-side if the API takes no flag. Pass RFC 9457 `detail` through as `detail`, and map a "changed meanwhile" refusal to `status-changed`. Any field the API wants that the SPA lacks is raised as a new conflict, not invented (plan Data Model, constitution VII) — `src/features/requests/detail/employee-request-source.ts`
- [ ] T027 [BEN-140] Fill `placeSignProblems`' pointer table from the contract's field names. Depends on T026 — `src/features/requests/detail/place-sign-problems.ts`
- [ ] T028 [BEN-140] Close conflict 5's form half, citing spec 012 and the contract version — `specs/001-office-supplies-mvp/contracts/README.md`

## Phase 10: K4 — Checks + PR (BEN-141)

- [x] T029 [BEN-141] `check-accountability-form.mjs` over CDP:
  - **Done, with one change.** The *text that fits* case grows the box, not the text: the acknowledgement is sized in px, so the root font size does not reach it. It exercises the same resize path. A real pointer click was added too, because the global `[aria-disabled]` rule sets `pointer-events: none` on the input.
  - SC-001: link offered on exactly the seeded unsigned `Received` request, REQ-2026-1820 (amended 2026-09-29).
  - SC-002: every invalid combination sends nothing.
  - SC-003: REQ-2026-1820 stays `Received` in the pill, the timeline and the row, with the signed line and a time, and no sign or cancel control (amended 2026-09-29).
  - SC-004a: `sign-changes` and `sign-invalid`.
  - SC-005: `sign-slow` with a double activation gives one signature.
  - SC-006: FR-004, parsed from `spec.md`, markdown-normalised, and compared with a word diff on failure.
  - SC-006a: the lock, the blocked message, unlock at the end, staying unlocked after scrolling up, and unlock at once when the text fits (shrunk root font size).
  - D9a's focus targets.
  — `scripts/check-accountability-form.mjs`
- [x] T030 [BEN-141] Wire the check into verify: `['accountability form (spec 012)', 'node', ['scripts/check-accountability-form.mjs']]`. Depends on T029 — `scripts/verify.mjs`
- [x] T031 [P] [BEN-141] Add the form view to the a11y/responsive gate at 1440, 768 and 375px: no horizontal page scroll, every control reachable, the checkbox's disabled state announced (D3) — `scripts/check-a11y-responsive.mjs`
  - **Done.** It caught two missing focus outlines (`outline-none` on the name input and on the acknowledgement box), both fixed. The read view's sign link also gained `hit-area` for the 44px touch minimum below 1440px.
- [x] T032 [BEN-141] Re-run the `04.1` re-check (T003's procedure) before opening the PR (D16a) — `docs/design-system/drift-2026-09-26.md`
  - **Done 2026-09-27: no change.** The export is still `2026-09-26T02:49:27.712Z`.
- [x] T033 [BEN-141] `npm run verify` green, with `check-request-detail` unchanged and passing. Take 1440px screenshots of the read view with the link, the form (locked and unlocked), the invalid state and `Received`, against `04.1`. Attach them to the PR — `scripts/verify.mjs`
  - **Done.** All 15 gates pass. Screenshots are taken of the read view with the link, the form locked, before reading with both messages, ready to sign, and `Received`; they are not committed and get attached to the PR.
- [x] T034 [BEN-141] PR to `dev`, linking BEN-136 and the K-tickets, the spec 007 / 001 / process-flow / contracts amendments, and the designer flags — `specs/012-accountability-form/tasks.md`
  - **Done:** [PR 47](https://github.com/CoDev-Bench-Team/CoDev-OSRS/pull/47).

## Dependencies

- **Phase 1** can land with the spec and plan (docs only).
- **T003 gates all of K2.** No code is built from an undiffed export.
- T004 → T014 → T015; T004 → T016. T005 before T017. T007 / T008 / T009 → T010.
- T017 → T018 → T019 / T020. T021 → T022 (with T012). T013 + T016 + T018 → T023.
- Stories 1 → 2 → 2a → 3 in that order (they all edit `AccountabilityForm.tsx` / `RequestDetailPanel.tsx`). Story 4 (T024) and T025 can go any time after T018.
- **K3 (T026–T028)** waits on the backend publishing `Received` and the submission. K2 and K4 do not.
- T029 needs K2 complete. T033 needs T029–T032.

## Parallel opportunities

T004, T006, T007, T008, T009, T011, T012 and T013 touch separate files and can go together after T003. T005 runs alongside them but lands as its own commit. T031 can be written while T029 is.

## MVP slice

Phase 1, Phase 2, Stories 1 / 2 / 2a / 3 / 4, T025, then K4 (T029–T034). This is demonstrable on the seed; K3 follows when the contract lands.
