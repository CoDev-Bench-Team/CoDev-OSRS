# Implementation Plan: Request Review Panel + Admin Transitions

**Date**: 2026-09-26  
**Spec**: `specs/008-request-review-panel/spec.md`  
**Status**: Draft  
**Amended**: 2026-09-29: constitution 6.0.0 / ADR-0010 (the Admin may mark `Received`), the Status select's options, and a modal confirmation for Update Status (D2, D7, D8, D12, D13). 2026-09-29: constitution 7.0.0 / [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md) supersedes the Employee's form setting `Received` (D13, IV row).  
**Amended**: 2026-09-30: BEN-135, Admin cancel (spec Story 5, FR-020–FR-023): D14–D18, slice G4. 2026-10-01: constitution 8.0.0, no Admin cancel on `For Delivery` (D19).

## Summary

**Review** on a Requests Queue row opens the shared `SidePanel` over `/queue` instead of navigating. The panel is one component. A pure function maps the request's status to the actions it offers, and a local "mode" (idle, rejecting, updating, cancelling) swaps the action area. Update Status, and later Complete, confirm in a modal `ConfirmDialog` over the panel (D8). It never swaps the body. Every transition goes through one typed Admin request source, the seeded source until the contract publishes. After each attempt the queue reloads from that source, so the panel, rows, chips and summary cards are always one snapshot, never an optimistic guess.

*(2026-09-30, BEN-135.)* Admin cancel is one more row entry and one more mode on the same panel. `Approved` and `Ready for Pickup` gain a `cancel` action (`For Delivery` did too until constitution 8.0.0, D19), which opens the existing `ReasonForm` inline and calls a new `cancel(id, reason)` on the same source. The shared timeline already keeps the nodes a cancelled request reached, from its timestamps (spec 013 FR-009a, BEN-144), so the seeded cancel only has to keep them (D16).

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 7  
**Primary Dependencies**: Existing shared UI (`SidePanel`, `StatusPill`, `StatusTimeline`, `Avatar`, `Select`, `TextField`, `Button`, `Notice`). No new package.  
**Storage**: None in the SPA. The seeded source is a mutable in-memory store that resets on reload.  
**Target Layer**: Frontend SPA only  
**Performance Goals**: None beyond the existing queue. The panel reads one request, and the reload after a transition reuses the queue's single `load()`.  
**Constraints**: Constitution 6.0.0 (`Received` is a status since 5.0.0; since 6.0.0 the Admin may set it from a handover state, ADR-0010); no invented REST contract; no stock arithmetic; feature code under `src/features/requests/queue/*` (BEN-47 ownership); Admin cancel is BEN-135's (G4), under constitution 8.0.0 IV: an Admin cancels `Approved` or `Ready for Pickup`, never `For Delivery` (D19).

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **One panel, status-driven.** `reviewActions(status)` returns a discriminated union of the actions offered. `ReviewPanel` renders only those. There is no `disabled` branch anywhere. | BEN-77 constraints 1–2; spec FR-005 ("impossible to render, not merely disabled"). |
| D2 | `reviewActions` is exhaustive over `RequestStatus` via a `satisfies Record<RequestStatus, …>` table. When BEN-134 adds `Received`, the build fails until the table gains its row. *(It did, at the 5.0.0 merge: `Received` has an empty row until Complete is built.)* | This turns the FR-012 gate into a compile-time checkpoint instead of a memory. |
| D3 | **Refetch, not optimistic.** The source applies the transition, then the page re-runs `load()`. The panel re-reads its request from the fresh snapshot by id. The reload that follows a transition MUST keep the current snapshot on screen (no `loading` state, so the panel never unmounts) and swaps in the new one on success. If that reload fails, the old snapshot stays and the panel shows a notice (spec 007's pattern). | BEN-77 constraint 5: Complete mutates stock, so the `In Processing` card and CURRENT INVENTORY must come from the source. |
| D4 | The queue and the panel share **one source**. `AdminRequestSource extends QueueSource` with the transition methods. The seeded queue data moves into it. | A transition and the reload that follows must see the same store (FR-013). Two seeds would drift. |
| D5 | The panel stays mounted while its request becomes terminal. The page keeps the open id, and after the reload the panel shows the terminal read-only state. The row is gone from the table behind it. | Story 2 AC5: after rejecting, the Admin sees the reason and **Close**. Unmounting would hide the result of the action. |
| D6 | **One `ReasonForm`** (required, trimmed, `TextField tone="danger"`, Cancel / Confirm) is extracted from `RequestDetailPanel`. It has two callers today (the Employee's cancel and the Admin's reject) and BEN-135 will add a third. | BEN-77 constraint 4. |
| D7 | The Update Status form is a small `UpdateStatusForm`: `Status *` select, then, for `Ready for Pickup`, a `Pickup location *` select listing `source.pickupOffices` plus a final `Other…`, then a free-text field for `Other…`. The request's office is preselected. The value is a `PickupLocation` union (below). *(Amended 2026-09-29.)* The options come from `updateStatusTargets(status)`: from `Approved`, `For Delivery` · `Ready for Pickup`; from a handover state, `Received` (first and preselected) and the other peer. The current status is never offered, so there is no "no change" refusal and no stored-location start. | Spec FR-008/FR-009, Clarifications 2026-09-26. The office list comes from the source, never a literal in the panel (see Known Risks: Pasig/Ortigas). |
| D8 | *(Amended 2026-09-29; was an inline Complete confirm.)* A confirmation is a **modal over the panel**: the shared `ConfirmDialog` (`src/shared/ui/overlay/`), a native `<dialog>` stacked in the top layer. Update Status uses it now (FR-008b) and Complete will reuse it (FR-011). Reject and the Employee's cancel stay inline, because they collect a reason: a form, not a yes/no. | The project owner asked for a dialog on Update Status. The focus-trap cost this decision first avoided is paid once, in `ConfirmDialog`: it handles Esc and Tab itself and stops them before `SidePanel`'s document listener. The press-and-release scrim rule and the Tab wrap live once, in `overlay/modal-dialog.ts`, and both dialogs use them. |
| D9 | Complete code (`CompleteConfirm`, the `complete` source method, the `Received` row) ships in a **separate PR after BEN-134**. G2 and G3a do not contain it. | Spec FR-012. Nothing unreachable ships behind a flag. |
| D10 | **`/requests/:id` is a deep link** *(amended 2026-09-26, after the `dev` merge; it was first retired)* *(amended 2026-09-29, [spec 013](../013-admin-history/spec.md) FR-016: a `Completed`, `Rejected` or `Cancelled` request is forwarded on to `/history` and opens History's read-only panel)*. `RequestDeepLink` forwards to `/queue` (Admin) or `/requests` (Employee) with the id in navigation state; `useDeepLinkedRequest` opens the panel once the page's list has loaded, or shows one fixed notice for an id it may not show, then consumes the state. The `requestDetail` destination is kept for both roles so the link survives sign-in; `RequestDetailPlaceholder` and `seeded-request-ids.ts` stay deleted. | Email *View request* buttons link to the address (T005). Deciding existence against the page's own list keeps a missing and a foreign id identical (spec 003 FR-012a). |
| D11 | The timeline mapping is widened to a structural `TimelineFacts` type (the fields it reads), so `requestTimeline` serves both `EmployeeRequest` and `ReviewRequest`. It moves to `src/features/requests/request-timeline.ts`. | FR-018: reuse the 007 timeline, with one mapping for both panels. |
| D12 | Undrawn additions (pickup-location select, `Other…` field, pickup-location read-back row, Complete confirm, the `Update Status` action on a handover state, `Received` in the Status select, the Update Status confirmation) are logged in `docs/design-system/additions.md` §3h. | Constitution I: undrawn UI is recorded, not silent. |
| D13 | *(2026-09-29.)* **The Admin may set `Received`** through `updateStatus(id, 'Received')`, accepted only from `For Delivery` / `Ready for Pickup`. It keeps `handover` and `pickupLocation`, sets `receivedAt`, and does no stock math. ~~The Employee's Accountability Form stays the other way in.~~ **Amended 2026-09-29 (constitution 7.0.0, [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md))**: the Employee's way in is **Mark as Received** ([spec 012](../012-accountability-form/spec.md)); the form records the acknowledgement and changes no status. | Constitution 6.0.0 IV, ADR-0010, spec 008 FR-008a. |
| D14 | *(2026-09-30, BEN-135.)* **`cancel` is a `ReviewAction`.** The `Approved`, ~~`For Delivery`~~ and `Ready for Pickup` rows become `['cancel', 'updateStatus']` (*`For Delivery` withdrawn by D19*). They render left to right as **Cancel Request** (`variant="ghost"`, as Reject Request) and **Update Status** (primary), each `flex-1` in the row. Update Status loses its lone `w-full`, since it is never alone any more. Activating Cancel Request enters a new mode, `cancelling`, which renders `ReasonForm` with label *Reason for cancellation*, placeholder `e.g item discontinued, no stock at this office...`, confirm *Confirm Cancellation*, and required message *Enter a reason for cancelling this request.* There is **no `ConfirmDialog`**: D8 already keeps reason-collecting steps inline, and FR-023 says so. No email note sits above the row: that note belongs to the decision (`deciding`), and it stays scoped to `Pending Approval`. | Spec Story 5, FR-005, FR-020, FR-023. The order mirrors Reject / Approve: the stopping action on the left, the forward action on the right. Because the modes are exclusive, Story 5 criterion 7 needs no extra code: `updating` renders only its form, and `cancelling` only its own. |
| D15 | **`AdminRequestSource.cancel(id, reason)`.** The seed accepts it only from `Approved`, ~~`For Delivery`~~ or `Ready for Pickup` (*`For Delivery` withdrawn by D19*) and refuses anything else with `status-changed`. It trims the reason, and an empty one is refused `reason-required`. It sets `status: 'Cancelled'` and `cancellation: { reason, at }`, and keeps `handover`, `pickupLocation` and every earlier timestamp, which is what the timeline reads (D16). It does no stock math. The pickup card already renders only while the status is `Ready for Pickup`, so a cancelled pickup does not read its location back (spec edge case). | FR-016, FR-020, FR-021. `status-changed` is the vocabulary the seed already uses for "not from here", so `run()` in `ReviewPanel` needs no new branch. |
| D16 | *(Revised at the rebase on `dev`, 2026-10-01.)* **The timeline needs no change.** [Spec 013](../013-admin-history/spec.md) FR-009a (BEN-144) already makes `requestTimeline` keep the nodes a cancelled request reached, from its timestamps: Submitted; **Approved** when `approvedAt` is set; the handover node, named, when `handover` and `handedOverAt` are both set; then **Cancelled**. The seeded `cancel` keeps every timestamp (D15), so an Admin cancel reads Submitted → Approved → [handover] → Cancelled in both panels, and the Employee's own cancel from `Pending Approval` still reads Submitted → Cancelled. | One mapping for both panels (D11). G4 first derived the nodes from a new `cancellation.by` field. BEN-144 landed the timestamp rule first, which needs no new field, so G4 dropped `by`. At integration the cancelled request's body must carry `approvedAt`, `handover` and `handedOverAt` (contracts README, Cancel). |
| D17 | **Dev stubs reach what the seed cannot.** In `review-stub.ts`: under `changes`, a cancel is overtaken: a handover state moves to `Received`, as if the Employee had just marked it received (constitution 7.0.0 IV), and `Approved` moves to `For Delivery`, as if another Admin had handed it over; then the cancel is refused `status-changed` (spec edge case "Received while cancelling"). Under `failing`, a cancel fails outright. Under `reload-fails`, a cancel that succeeds breaks the next load. *(Review 2026-10-01.)* A new `reason-refused` mode refuses reject and cancel `reason-required` even with a reason, as the API's `400 #/reason` will, so FR-021's "the source refuses the reason" path runs in the browser. In `request-stub.ts`, a new `?requests=admin-cancelled` mode adds to Maya's list one request an Admin cancelled after `Ready for Pickup`, so the Employee's side of FR-022 is provable without changing her seed. | FR-014, FR-022. The shared seed stays untouched by any stub. |
| D18 | **Docs travel with the code.** `docs/design-system/additions.md` §3h gains three rows: the **Cancel Request** placement, its placeholder, and a cancelled-after-handover panel that no longer reads back a pickup location. The cancelled-after-approval timeline is already §3j (BEN-144). `specs/001-office-supplies-mvp/contracts/README.md` records the published cancel operation (below), and adds one line under conflict 5: the contract describes `POST /requests/{id}/sign` as *completing* a received request, while constitution 7.0.0 IV has signing change no status and only an Admin set `Completed`. Raised, not papered over. | Constitution I (undrawn UI is logged) and VII (a contract gap is recorded and raised). |
| D19 | *(2026-10-01, constitution 8.0.0, [ADR-0012](../../docs/adr/0012-no-admin-cancel-on-for-delivery.md).)* **`For Delivery` offers only Update Status.** Its `reviewActions` row becomes `['updateStatus']`, and the seed's `ADMIN_CANCEL_FROM` drops `For Delivery`, so a cancel that reaches it is refused `status-changed`. Update Status keeps `flex-1`: alone in the flex row it fills the width, as its old `w-full` did. D14 and D15 read with `For Delivery` removed. The `changes` stub needs no change: an `Approved` request overtaken to `For Delivery` now comes back with no Cancel Request, which is the new edge case. The published contract still accepts an Admin cancel on `for_delivery`; that is recorded in `contracts/README.md` and raised with the backend team. Spec 013's seeded REQ-2026-1650, cancelled from `For Delivery`, becomes a cancel after `Ready for Pickup`, so the seed holds no history the rule forbids. | Spec FR-005, FR-020, SC-008, edge cases "Handed over for delivery while cancelling" and "Delivery falls through". The rule reads the current status only, so a failed delivery moved back to `Ready for Pickup` can be cancelled. |

### Actions by status (D1)

| Status | `reviewActions` | Ships in |
|--------|-----------------|----------|
| `Pending Approval` | `approve`, `reject` | G2 |
| `Approved` | `cancel`, `updateStatus` | G3a; `cancel` in G4 |
| `For Delivery` | `updateStatus` | G3a; `cancel` in G4, removed by D19 |
| `Ready for Pickup` | `cancel`, `updateStatus` | G3a; `cancel` in G4 |
| `Received` | none until Complete; then `complete` | G3b |
| `Rejected`, `Cancelled`, `Completed` | `close` | G2 |

### Panel modes (D1, D8)

`idle` → (`rejecting` \| `updating` \| `cancelling`) → `submitting` → `idle`. In `updating`, a valid submit first opens `ConfirmDialog` (D8); Confirm sends, and Cancel, Esc or the scrim returns to the form with its input. Any form's **Cancel** returns to `idle` and clears that form. Modes change only the action area. The body (header, REQUESTED BY, lines, note, timeline, stop reason, pickup row) is identical in every mode.

## Data Model

These are feature-local read models, not API shapes. When the contract publishes, a new source maps the API into them.

```ts
// src/features/requests/queue/review-types.ts
interface ReviewLine { description: string; qty: number; available: number | null } // null → "unavailable"
type PickupLocation = { kind: 'office'; office: Office } | { kind: 'other'; text: string };
interface ReviewRequest extends QueueRequest {          // id, requestor*, items, submittedAt, status
  requestorOffice: Office;
  lines: readonly ReviewLine[];
  noteToApprover?: string;
  handover?: 'For Delivery' | 'Ready for Pickup';
  pickupLocation?: PickupLocation;
  otherNotes?: string;
  approvedAt?: string; handedOverAt?: string; receivedAt?: string; completedAt?: string;
  rejection?: { reason: string; at: string };
  cancellation?: { reason: string; at: string };
}
type ReviewRefusal = 'status-changed' | 'reason-required' | 'location-required' | 'unavailable';
type TransitionResult = { ok: true } | { ok: false; refusal: ReviewRefusal };
interface ReviewSnapshot extends QueueSnapshot { requests: readonly ReviewRequest[] }
interface AdminRequestSource extends QueueSource {
  readonly pickupOffices: readonly Office[];
  load(): Promise<ReviewSnapshot>;   // the panel reads its request from the table's own snapshot
  approve(id: string, notes?: string): Promise<TransitionResult>;
  reject(id: string, reason: string, notes?: string): Promise<TransitionResult>;
  updateStatus(id: string, to: 'For Delivery' | 'Ready for Pickup' | 'Received', pickup?: PickupLocation): Promise<TransitionResult>; // Received: D13
  cancel(id: string, reason: string): Promise<TransitionResult>; // G4, D15
  // complete(id): added in G3b, after BEN-134
}
```

*(Revised at the rebase on `dev`, 2026-10-01, D16.)* No read-model field is added: `EmployeeRequest.cancellation` and `TimelineFacts.cancellation` stay `{ reason; at }`, and the Cancelled timeline reads the timestamps a request already carries (spec 013 FR-009a). `ReviewAction` gains `'cancel'`. `ReviewRefusal` is unchanged: a cancel meets only `status-changed`, `reason-required` and `unavailable`.

`Office` is `src/features/auth/types.ts`'s, which holds the contract's enum (`Ortigas` since 2026-09-26), now also exported as the `OFFICES` list. `ReviewSnapshot` narrows `QueueSnapshot`, and `ReviewRequest` is a structural superset of `QueueRequest`, so the existing `buildQueueViewModel` is untouched. *(As built: the planned `get(id)` was dropped. The panel reads its request from the snapshot the table shows, which removes a second read that could disagree with it.)*

## API Contracts

None added. `AdminRequestSource` is an internal UI seam. The backend's approve, reject, update-status and complete endpoints, their refusal codes and their stock semantics (contracts conflict 1) are the API-integration ticket's job. The seeded source's transitions change **status only**. Its `available` figures are fixed seed values, and a comment says release and consumption are the API's (FR-016).

**Cancel is published (read from the live Swagger, 2026-09-30).** The [published contract](https://codev-osrs-be.vercel.app/) has `POST /requests/{id}/cancel` with `CancelRequestDto { reason }` (required). An Admin may cancel `approved`, `ready_for_pickup` or `for_delivery` (*constitution 8.0.0 removes `for_delivery`; the SPA does not offer it, and the API's acceptance is raised with the backend team, D19*). Any other status, `received` included, returns `409`. A missing reason returns the standard `400` with pointer `#/reason`. `404` means no such request. `200` returns the cancelled request, described as carrying `cancellationReason` and `cancelledBy`. G4 still ships against the seeded source only (FR-017): no Admin source over HTTP exists yet, and building one is the API-integration ticket's job. For that ticket, D18 records this mapping in `contracts/README.md`: `409` → `status-changed`, `400 #/reason` → `reason-required` (the field turns invalid with its required message; showing the API's `detail` there is the integration ticket's to add), `404` → `unavailable`, and `cancellationReason` → `cancellation.reason`. `cancelledBy` is not read: the timeline draws from timestamps (D16), and no screen names who cancelled. **Still unpublished, and raised in the same entry:** the `200` body's schema documents only `items` and `units`. So whether a cancelled request still carries its handover state and per-transition times, which D16 needs for the reached nodes, is not yet confirmed. History flag H4 is the same gap.

## Component / Module Breakdown

**Feature: `src/features/requests/queue/`**

- `review-types.ts`: the read model and source interface above.
- `review-actions.ts`: `reviewActions(status)` (D1/D2), a pure, exhaustive table.
- `seeded-admin-request-source.ts`: replaces `seeded-queue-source.ts`. It keeps the same 15 rows and ids and adds `lines` (with `available`), `requestorOffice`, notes and timestamps. REQ-2026-1847 matches the frame: three lines, "temporary project setup", Davao. The terminal rows carry placeholder reasons, and 1715 carries a pickup location. Transitions guard the from-status and refuse otherwise with `status-changed`, and they trim and require reasons and locations.
- `admin-request-source.ts`: picks the source. On the dev server only, `?review=changes|failing|reload-fails` wraps it in `dev/review-stub.ts`, which reaches the refusal and failure paths the seed cannot (FR-014). `import.meta.env.DEV` drops it from production.
- `ReviewPanel.tsx`: the `SidePanel` body plus the action area, driven by `reviewActions` and the panel mode.
- `UpdateStatusForm.tsx`: D7, with the D8 confirmation.
- `QueuePage.tsx` (modify):
  - **Review** becomes a `<button>` that sets `openId`, replacing the `Link`.
  - The page renders `<ReviewPanel>` when `openId` is set.
  - A new `reload()` is shared by Try Again and post-transition refreshes.
  - The query state is untouched (FR-002).
  - Focus returns to the row's **Review**. If the row has gone (the request became terminal), focus goes to the chips' group, the existing recovery target.

**Shared, within requests**

- `src/features/requests/request-timeline.ts`: moved from `detail/`, widened to `TimelineFacts` (D11).
- `src/features/requests/ReasonForm.tsx`: extracted (D6). `RequestDetailPanel.tsx` is switched to use it, with no behaviour change, and 007's check proves that.

**Shared UI**

- `src/shared/ui/overlay/SidePanel.tsx`:
  - `footer` may be a function that receives the animated `close`, for the terminal state's **Close**.
  - *(Review 2026-09-26, react-doctor `prefer-html-dialog`, approved by the owner.)* It is now a native `<dialog>` opened with `showModal()`:
    - The scrim is `::backdrop`, and the page behind is inert natively.
    - Esc is the dialog's `cancel` event. A child that handled Esc itself (an open `Select`) prevents it.
    - A close the browser forces (Chrome makes `cancel` un-cancellable on repeated Esc without user activation) still reports `onClose`.
    - `will-change-transform` makes the dialog the containing block for fixed descendants.
- `src/shared/ui/overlay/ConfirmDialog.tsx`: the modal confirmation (D8).
- `src/shared/ui/forms/Select.tsx`: inside an open `<dialog>`, the list is portalled into the dialog (outside it would be inert and under the top layer) and positioned against the dialog's box.
- `src/shared/ui/gallery/Gallery.tsx`: split into one component per section (react-doctor `no-giant-component`, approved by the owner). It renders the same thing, and the fidelity and pixel gates pass.
- `scripts/check-catalog.mjs`, `scripts/check-request-detail.mjs`: they select `dialog[open]`, send a real Esc (a synthetic `KeyboardEvent` never raises a native `cancel`), and wait for the dialog to leave the DOM.

**App**

- `src/app/destinations.ts`, `src/app/routes.tsx`: `requestDetail` is a deep link for both roles; `src/app/RequestDeepLink.tsx` forwards it (D10).
- `src/features/requests/deep-link.ts`: `useDeepLinkedRequest`, used by `QueuePage` and `MyRequestsPage` (D10).
- `src/app/placeholders.tsx`, `src/app/seeded-request-ids.ts`: the placeholder and seeded ownership ids are deleted (D10).

**G4: Admin cancel (BEN-135, 2026-09-30)**

- `queue/review-types.ts`: `AdminRequestSource.cancel` (D15).
- `queue/review-actions.ts`: `'cancel'` joins `ReviewAction`, and the three rows become `['cancel', 'updateStatus']` (D14). The header comment's "no status offers Complete yet" stays true.
- `queue/seeded-admin-request-source.ts`: `cancel` (D15). The header's "what the store does not do" names the cancel release too.
- `queue/ReviewPanel.tsx`: `Mode` gains `'cancelling'`, the `onCancel(id, reason)` prop, the Cancel Request button, and the `ReasonForm` branch (D14). `run()` is reused as is.
- `queue/QueuePage.tsx`: `onCancel={(id, reason) => transition(id, () => source.cancel(id, reason))}`, beside the other three.
- `queue/dev/review-stub.ts`: `cancel` in `changes`, `failing` and `reload-fails` (D17).
- `detail/dev/request-stub.ts`: the `admin-cancelled` mode (D17).
- `request-timeline.ts` and the read models are unchanged: the Cancelled branch is BEN-144's (D16).
- `ReasonForm.tsx`: unchanged. Its comment already names BEN-135 as the third caller.

**Docs**

- `docs/design-system/additions.md` §3h (D12), plus the G4 rows (D18).
- `specs/001-office-supplies-mvp/contracts/README.md`: the published cancel operation, its refusal mapping, the unpublished body fields, and the `/sign` wording under conflict 5 (D18).
- `specs/003-app-shell-routing/spec.md`: Session 2026-09-26 amendment (D10).
- `specs/004-approver-pending-queue/spec.md`: FR-010 annotated "superseded by spec 008 FR-001".

## Project Structure

```text
specs/008-request-review-panel/
├── spec.md
├── plan.md
└── tasks.md

src/features/requests/
├── ReasonForm.tsx                    # new (extracted)
├── request-timeline.ts               # moved from detail/
├── detail/RequestDetailPanel.tsx     # uses ReasonForm
├── detail/dev/request-stub.ts        # G4: ?requests=admin-cancelled
└── queue/
    ├── QueuePage.tsx                 # Review opens the panel; G4: onCancel
    ├── ReviewPanel.tsx               # new; G4: cancelling mode
    ├── UpdateStatusForm.tsx          # new (G3a)
    ├── review-actions.ts             # new; G4: cancel
    ├── review-types.ts               # new; G4: cancel
    ├── admin-request-source.ts       # new
    ├── seeded-admin-request-source.ts# replaces seeded-queue-source.ts; G4: cancel
    └── dev/review-stub.ts            # new, dev only; G4: cancel in three modes

scripts/check-review-panel.mjs        # new; wired into scripts/verify.mjs; G4: Story 5
scripts/check-request-detail.mjs      # G4: the admin-cancelled timeline
```

G4 adds no new file. Every change lands in a file that already exists.

## Delivery slices

| Slice | Ticket | Contents |
|-------|--------|----------|
| G2 | BEN-78 | Source + seed, `reviewActions`, `ReviewPanel` read body, approve, reject via `ReasonForm`, terminal read-only, Review-opens-panel, D10 retirement, check script |
| G3a | BEN-79 | `UpdateStatusForm`, pickup location, handover-state actions, pickup read-back |
| G3a+ | BEN-47, 2026-09-29 | Constitution 6.0.0 / ADR-0010 docs, `Received` in the Status select (D7, D13), `ConfirmDialog` on Update Status (D8) |
| G3b | BEN-79 *(unblocked: 5.0.0 landed)* | `complete` in the `Received` row, `ConfirmDialog` for it, five-node timeline *(timeline already arrived with 5.0.0)* |
| G4 | BEN-135 | `cancel` action and mode, seeded `cancel` (keeping the timestamps the Cancelled timeline reads), dev stubs, checks, and the additions and contracts entries (D14–D18) |

## Dependencies

- Merged: BEN-46 queue (spec 004), BEN-45 panel pieces (spec 007: `SidePanel`, `StatusTimeline`, `TextField`).
- ~~BEN-134 (constitution 4.0.0) gates G3b only.~~ Met: `Received` landed as constitution 5.0.0 (BEN-43).
- BEN-135 (Admin cancel) adds a `cancel` action and reuses `ReasonForm`. It is not a dependency. *(2026-09-30: planned as G4. It depends only on G2 and G3a, both merged in PR #46. G3b and G4 touch different rows of `reviewActions`, and either can land first.)*
- The backend contract, for replacing the seeded source later.

## Verification

- `npm run lint`, `npm run build`, `npm run verify`.
- `scripts/check-review-panel.mjs`, signed in as the Admin on `/queue`:
  - SC-001: for each seeded status, open the panel and assert that the rendered action buttons equal the `reviewActions` row exactly.
  - Open and close via ✕, Esc and scrim: the address is `/queue`, focus is back on the row, and chip/search/page are preserved.
  - Reject with an empty or whitespace reason: invalid, no status change. With a valid reason: `Rejected`, reason read back, **Close** only, and the row is gone and the chip counts drop.
  - Approve: the pill reads `Approved`, the panel offers Update Status and Cancel Request (G4), and the `Pending approval` card drops by 1.
  - Update Status: `Ready for Pickup` with no location is refused. With an office it succeeds. With `Other…` and empty text it is refused. `For Delivery` ↔ `Ready for Pickup` swaps. The current status is not offered. From a handover state `Received` is first and preselected, asks no location, and keeps the handover node.
  - Confirmation (FR-008b): an invalid submit asks nothing; a valid one names the change and opens on Cancel; Cancel, Esc and a scrim click send nothing and keep the panel and form; a drag onto the scrim does not cancel; `Received` warns it cannot be undone; a failed update closes the dialog and keeps the input.
  - `?review=changes`: a refusal names the current status. `?review=failing`: status unchanged and input kept.
  - No handover state renders **Complete** (SC-005, pre-4.0.0).
- `scripts/check-shell.mjs`: `/requests/:id` opens the panel for both roles; a decided request's link lands on `/history` *(amended 2026-09-29, [spec 013](../013-admin-history/spec.md) FR-016: a `Completed`, `Rejected` or `Cancelled` request is forwarded on to `/history` and opens History's read-only panel)*; a missing id and, for an Employee, a foreign one open nothing and get the same notice without echoing the id; the link survives sign-in (D10).
- `scripts/check-request-detail.mjs`: unchanged and still green, which proves the `ReasonForm` extraction.
- **G4 (BEN-135)**, added to `scripts/check-review-panel.mjs`:
  - SC-008: `EXPECTED` becomes `['Cancel Request', 'Update Status']` for `Approved` and `Ready for Pickup`, and `['Update Status']` for `For Delivery` (D19). The existing FR-005 loop then proves that no pending row offers Cancel Request. For terminal requests, the Story 5 checks see Close as the only action once a request is cancelled, and the direct probe of the seed's `cancel` finds Received, Completed, Rejected and Cancelled refused `status-changed`. A terminal deep link opens History's read-only panel (spec 013 FR-016), which has no actions at all.
  - Story 5 on REQ-2026-1805 (`Approved`):
    - Cancel Request opens the form with its label, asterisk, placeholder, and Cancel / Confirm Cancellation, and Update Status is gone (criterion 7).
    - An empty or whitespace reason goes invalid with the cancel form's own message, not reject's, and the status is unchanged.
    - Cancel backs out, and reopening shows an empty field.
    - A valid reason: no confirmation dialog opens (FR-023); the pill reads `Cancelled`; the timeline is exactly Submitted → Approved → Cancelled, with the seeded dates and the cancel's own; focus is on the panel heading; the reason sits under *Reason for cancellation*; the only action is Close; the row is gone; the In Processing summary card drops by 1; the Approved and All requests chips each drop by 1 (FR-013); and History, reached through the nav, lists the request.
  - On REQ-2026-1715 (`Ready for Pickup`): after the cancel, the timeline reads Submitted → Approved → Ready for Pickup → Cancelled, with the seeded Approved and handover dates, and no Pickup location card shows.
  - While the Update Status form is open, Cancel Request is not rendered (criterion 7).
  - `?review=changes` on a handover row: the cancel is refused with the stale copy, the pill reads `Received`, Cancel Request is gone, and focus is on the panel heading. On REQ-2026-1805 (`Approved`): refused, the pill reads `For Delivery`, and only Update Status is offered (D19). `?review=failing`: status unchanged and the reason kept. `?review=reload-fails`: the panel stays open with the saved-but-stale notice. `?review=reason-refused`: the cancel field, and the reject field, go back to invalid with their own messages, with no alert.
  - The seed's `cancel`, probed directly because the stubs replace it (its setup step, REQ-2026-1703 reaching `Received`, is asserted first): refused `status-changed` from Pending, For Delivery (D19), Received, Completed, Rejected and Cancelled; `reason-required` for a blank reason; `unavailable` for an unknown id; and a legal cancel stores the trimmed reason and keeps `approvedAt` and `handedOverAt`. A failed delivery moved back to `Ready for Pickup` can then be cancelled (D19).
  - After the peer swap to `For Delivery`, the panel offers Update Status alone, across the row (D19).
  - Deep link `/requests/REQ-2026-1677` as the Admin: the seeded Admin cancel reads Submitted → Approved → Cancelled, dated by `approvedAt` and `cancellation.at`, in History's read-only panel.
  - At 360px, the Cancel Request / Update Status row stays on one line inside the panel, with no horizontal overflow and both buttons fully visible (FR-019; red-team R10).
- **G4**, added to `scripts/check-request-detail.mjs`: under `?requests=admin-cancelled`, the extra row's timeline reads Submitted → Approved → Ready for Pickup → Cancelled, each node dated from its timestamp, and the reason is read back. The existing REQ-2026-1791 and live-cancel checks, which expect Submitted → Cancelled, stay green unchanged (FR-022).
- Manual: compare with `02.2`, `02.2.1 Approve`, `02.2.1 Update Status` and `02.2.2`/`02.2.2.1` at 1440px, and check 360px for overflow.

## Requirement Coverage

| FR | Where |
|----|-------|
| FR-001, FR-002 | `QueuePage` routes Review to `/queue/:id` (amended 2026-10-06) + `SidePanel`; focus return |
| FR-003, FR-004 | `ReviewPanel` body; `ReviewLine.available` from the source |
| FR-005 | `review-actions.ts` + `ReviewPanel` |
| FR-006, FR-007 | `approve`, `reject` + `ReasonForm` |
| FR-008, FR-009 | `UpdateStatusForm`, `updateStatusTargets`, `pickupOffices`, `PickupLocation` |
| FR-001a | D10: `RequestDeepLink` + `useDeepLinkedRequest` |
| FR-007a | Other Notes in `ReviewPanel`, sent trimmed via `sentNotes()` with approve or reject |
| FR-008a | D13: seeded `updateStatus(id, 'Received')` |
| FR-008b | D8: `ConfirmDialog` in `UpdateStatusForm` |
| FR-010 | `reviewActions` handover rows have no `complete` |
| FR-011, FR-012 | G3b `CompleteConfirm`, gated by D2/D9 |
| FR-013 | D3 refetch + D5 |
| FR-014, FR-015 | `TransitionResult` refusals; `submitting` mode |
| FR-016, FR-017 | Source seam; no HTTP, no stock math |
| FR-018 | Shared UI + D11 timeline |
| FR-019 | `SidePanel` focus trap; check-a11y-responsive |
| FR-005 (G4 rows), FR-020 | D14 `reviewActions`; D15 seeded from-status guard; D19 drops `For Delivery` from both |
| FR-021 | D14 `ReasonForm` (trim, required); D15 `reason-required`; stopped-reason callout (existing) |
| FR-022 | D16 `requestTimeline` (spec 013 FR-009a) + D15 seeded timestamps; D17 Employee stub |
| FR-023 | D14: no `ConfirmDialog` on the cancel path |
| FR-013–FR-016 for cancel | D3 refetch via `transition()`; `run()` refusals; `submitting`; the seed does no stock math (D15) |

27 of 27 covered. FR-011 and FR-012 are covered by G3b, not built yet. FR-020 to FR-023 are covered by G4.

## Constitution Compliance

| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven | PASS | Spec 008 is recorded. Specs 003 and 004 are amended in the same change. Undrawn UI is logged (D12). The Admin's `Received` landed as constitution 6.0.0 and ADR-0010 before the code (D13). G4 follows spec 008's 2026-09-30 amendment, and its undrawn control is logged (D18). |
| II. Two Roles | PASS | `/queue` is Admin-only. There is no Employee path to any action. The Admin's cancel lives only on the review panel, and the Employee's own cancel is untouched. |
| III. Inventory Integrity | PASS | The SPA does no stock math, and CURRENT INVENTORY is read from the source. Releasing the reservation on cancel is the API's (D15). |
| IV. State Machine | PASS | 6.0.0 transitions: `Received` only from a handover state, by the Admin (D13) or ~~the Employee's form~~ the owning Employee's **Mark as Received** (amended 2026-09-29, constitution 7.0.0, [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md); spec 012). Cancel only from `Approved` or `Ready for Pickup`, with a reason (D14, D15, D19); never from `For Delivery`, `Received` or `Completed` (8.0.0 IV). Illegal actions and targets are unrenderable (D1/D2, D7). |
| V. Notifications | PASS | Emails are the API's. The SPA sends none. |
| VI. Testable Increments | PASS | G2, G3a, G3b and G4 each demo on the seed. |
| VII. Typed Contracts | PASS | Internal read model only. Offices come from the contract enum. G4 adds no read-model field. The unpublished cancelled-request body fields and the `/sign` wording are recorded, not assumed (D18). |
| VIII. MVP Restraint | PASS | No new package or framework. |
| IX. Secrets | PASS | Seed data only. |

## Red-Team Analysis

*Steelman:* the panel is a projection of one status through one exhaustive table, and every change round-trips through one store. The UI cannot show an action the state machine forbids, and it cannot show a number the source did not give.

Pre-mortem, "this failed because…":

1. **The seed becomes the de facto contract.** Transition names and refusal codes harden, and the API integration is forced to match them. *Early warning*: HTTP-ish names creep into `review-types.ts`. *Mitigation*: SPA-vocabulary names, a header comment on the read-model boundary, and contract conflict 1 cited in the seed.
2. **The refetch flickers or loses the panel.** `load()` swaps the snapshot, and the queue's loading state unmounts the panel mid-transition. *Early warning*: the panel closes after Approve. *Mitigation*: a post-transition reload keeps the last snapshot on screen (no `loading` state) and swaps it in on success. On reload failure it keeps the old snapshot and shows a notice (the 007 pattern).
3. **Retiring `/requests/:id` (D10) breaks something unseen.** That could be email links ("View request") that point at a request address. *Early warning*: the backend's email templates link to `/requests/:id`. *Mitigation*: confirm with the backend before merging G2. If they need a deep link, keep the route as a redirect to `/queue` with the panel opened, via an amendment.
4. **Two office enums collide.** The catalog uses `Ortigas` and auth uses `Pasig`. The pickup list and the request's office could disagree, and the preselection could miss. *Early warning*: the preselect is empty for a Pasig/Ortigas requester. *Mitigation*: the pickup list and `requestorOffice` both come from the source's single `Office` type, and a check asserts that the preselected value is in the list.
5. **G3b rots behind BEN-134.** The amendment stalls, and the demo path (spec 001 SC-001) never reaches `Completed`. *Early warning*: BEN-134 is not in progress when G3a merges. *Mitigation*: flag it on BEN-79 now. If BEN-134 is declined, G3b reverts to 3.0.1 (Complete from the handover states), a one-row change to `reviewActions`.

### G4 red-team (BEN-135, 2026-09-30)

*Steelman:* no new file; one row entry, one mode and one source method on a panel that already cannot render an illegal action; the reason form the Employee's cancel and the Admin's reject already use; and a timeline rule already on `dev` (spec 013 FR-009a), not a field the SPA made up.

8. **The API's cancelled body drops handover state or times.** *Early warning*: a cancelled `Ready for Pickup` request comes back with no handover information at integration. *Mitigation (D16, revised 2026-10-01)*: the timeline draws only the nodes whose times it has, so it understates and never overstates. The gap is raised in `contracts/README.md`.
9. ~~**`cancelledBy` cannot be mapped to a role.**~~ *Withdrawn 2026-10-01*: G4 no longer reads `cancelledBy` (D16).
10. **A misclick on Cancel Request, or a cramped row at 360px.** *Early warning*: the row wraps or overflows in the responsive check. *Mitigation (applied)*: a misclick only opens the reason form, and a 360px assertion on the row is added to the G4 checks.
11. **G3b and G4 collide in `ReviewPanel` / `reviewActions`.** *Early warning*: both branches are open at once. *Mitigation (applied)*: whichever lands second rebases. They touch different rows, and the exhaustive table (D2) fails the build on a bad merge.

*Strengthened position:* Admin cancel is a projection of one more row in an exhaustive table. Its timeline stays honest even when the API gives less than the seed, and its layout is asserted at the narrowest width.

## Analysis Overrides

None dismissed. The two findings were applied: (1) reload continuity is now binding in D3; (2) the spec 004 FR-010 annotation stays in this PR's docs work.

*G4 (2026-09-30), dismissed by the project owner:*

- ~~**A1 (LOW)**: FR-022 says "with no time printed".~~ *Moot 2026-10-01*: spec 013 FR-009a draws a node only when its time is present (D16).
- ~~**A2 (LOW)**: the spec's *Review request* entity does not list who cancelled.~~ *Moot 2026-10-01*: G4 no longer stores who cancelled (D16).

## Known Risks

- ~~**Pasig vs Ortigas** (contracts conflict 2) stays open.~~ Closed: the contract says `Ortigas`, and `Office` follows it (PR #46 review).
- The **pickup-location UI** and the **Complete confirm** are undrawn and flagged to the designer (D12).
- **R1 (accepted)**: the seed could harden into a de facto contract. Suggested mitigation: SPA-vocabulary names only, and cite contracts conflict 1.
- **R3 (accepted)**: retiring `/requests/:id` could break email deep links. Suggested mitigation: ask the backend before G2 merges.
- **R4 (accepted)**: the Pasig/Ortigas conflict could leave the pickup preselection empty. Suggested mitigation: add a check that the preselected office is in the list.
- **R5 (accepted)**: G3b is stranded if BEN-134 stalls. Suggested fallback: revert Complete to the handover states, a one-row change to `reviewActions`.
- **R6 (accepted, 2026-09-29)**: the current status is not offered, so a wrong pickup location is corrected only by For Delivery → Ready for Pickup, which is two transitions and two `Status changed` emails (FR-016). Decided by the project owner; a location-only edit would need its own spec.
- **R7 (accepted, 2026-09-29)**: `Received` is preselected on a handover state and irreversible (ADR-0010). The confirmation's "cannot be undone" line is the only guard.
- **CURRENT INVENTORY** freshness depends on the source. With the seed it never moves, because the seed does no stock math by design.
- **R8, R10, R11 (G4, mitigated 2026-09-30; R9 withdrawn 2026-10-01)**: see G4 red-team above. What is left is that the unpublished cancelled-request body (handover state, times) is raised in `contracts/README.md` and not yet answered.
- **Cancel Request placement and placeholder** are undrawn and flagged to the designer (D18).
