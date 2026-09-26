# Implementation Plan: Request Review Panel + Admin Transitions

**Date**: 2026-09-26  
**Spec**: `specs/008-request-review-panel/spec.md`  
**Status**: Draft

## Summary

**Review** on a Requests Queue row opens the shared `SidePanel` over `/queue` instead of navigating. The panel is one component. A pure function maps the request's status to the actions it offers, and a local "mode" (idle, rejecting, updating, confirming-complete) swaps the action area. It never swaps the body. Every transition goes through one typed Admin request source, the seeded source until the contract publishes. After each attempt the queue reloads from that source, so the panel, rows, chips and summary cards are always one snapshot, never an optimistic guess.

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 7  
**Primary Dependencies**: Existing shared UI (`SidePanel`, `StatusPill`, `StatusTimeline`, `Avatar`, `Select`, `TextField`, `Button`, `Notice`). No new package.  
**Storage**: None in the SPA. The seeded source is a mutable in-memory store that resets on reload.  
**Target Layer**: Frontend SPA only  
**Performance Goals**: None beyond the existing queue. The panel reads one request, and the reload after a transition reuses the queue's single `load()`.  
**Constraints**: Constitution 3.0.1 (`Received` is **not** in `RequestStatus` until BEN-134 lands 4.0.0); no invented REST contract; no stock arithmetic; feature code under `src/features/requests/queue/*` (BEN-47 ownership); Admin cancel is BEN-135's.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **One panel, status-driven.** `reviewActions(status)` returns a discriminated union of the actions offered. `ReviewPanel` renders only those. There is no `disabled` branch anywhere. | BEN-77 constraints 1–2; spec FR-005 ("impossible to render, not merely disabled"). |
| D2 | `reviewActions` is exhaustive over `RequestStatus` via a `satisfies Record<RequestStatus, …>` table. When BEN-134 adds `Received`, the build fails until the table gains its row. | This turns the FR-012 gate into a compile-time checkpoint instead of a memory. |
| D3 | **Refetch, not optimistic.** The source applies the transition, then the page re-runs `load()`. The panel re-reads its request from the fresh snapshot by id. The reload that follows a transition MUST keep the current snapshot on screen (no `loading` state, so the panel never unmounts) and swaps in the new one on success. If that reload fails, the old snapshot stays and the panel shows a notice (spec 007's pattern). | BEN-77 constraint 5: Complete mutates stock, so the `In Processing` card and CURRENT INVENTORY must come from the source. |
| D4 | The queue and the panel share **one source**. `AdminRequestSource extends QueueSource` with `get(id)` and the transition methods. The seeded queue data moves into it. | A transition and the reload that follows must see the same store (FR-013). Two seeds would drift. |
| D5 | The panel stays mounted while its request becomes terminal. The page keeps the open id, and after the reload the panel shows the terminal read-only state. The row is gone from the table behind it. | Story 2 AC5: after rejecting, the Admin sees the reason and **Close**. Unmounting would hide the result of the action. |
| D6 | **One `ReasonForm`** (required, trimmed, `TextField tone="danger"`, Cancel / Confirm) is extracted from `RequestDetailPanel`. It has two callers today (the Employee's cancel and the Admin's reject) and BEN-135 will add a third. | BEN-77 constraint 4. |
| D7 | The Update Status form is a small `UpdateStatusForm`: `Status *` select, then, for `Ready for Pickup`, a `Pickup location *` select listing `source.pickupOffices` plus a final `Other…`, then a free-text field for `Other…`. The request's office is preselected. The value is a `PickupLocation` union (below). | Spec FR-008/FR-009, Clarifications 2026-09-26. The office list comes from the source, never a literal in the panel (see Known Risks: Pasig/Ortigas). |
| D8 | The Complete confirm is **inline** in the action area (`Mark this request as completed?` · Cancel / Complete), not a modal over the panel. | FR-011. A dialog on a dialog would double the focus-trap logic. Inline matches how reject is drawn. |
| D9 | Complete code (`CompleteConfirm`, the `complete` source method, the `Received` row) ships in a **separate PR after BEN-134**. G2 and G3a do not contain it. | Spec FR-012. Nothing unreachable ships behind a flag. |
| D10 | **`/requests/:id` is a deep link** *(amended 2026-09-26, after the `dev` merge; it was first retired)*. `RequestDeepLink` forwards to `/queue` (Admin) or `/requests` (Employee) with the id in navigation state; `useDeepLinkedRequest` opens the panel once the page's list has loaded, or shows one fixed notice for an id it may not show, then consumes the state. The `requestDetail` destination is kept for both roles so the link survives sign-in; `RequestDetailPlaceholder` and `seeded-request-ids.ts` stay deleted. | Email *View request* buttons link to the address (T005). Deciding existence against the page's own list keeps a missing and a foreign id identical (spec 003 FR-012a). |
| D11 | The timeline mapping is widened to a structural `TimelineFacts` type (the fields it reads), so `requestTimeline` serves both `EmployeeRequest` and `ReviewRequest`. It moves to `src/features/requests/request-timeline.ts`. | FR-018: reuse the 007 timeline, with one mapping for both panels. |
| D12 | Undrawn additions (pickup-location select, `Other…` field, pickup-location read-back row, Complete confirm, the `Update Status` action on a handover state) are logged in `docs/design-system/additions.md` §3h. | Constitution I: undrawn UI is recorded, not silent. |

### Actions by status (D1)

| Status | `reviewActions` | Ships in |
|--------|-----------------|----------|
| `Pending Approval` | `approve`, `reject` | G2 |
| `Approved` | `updateStatus` | G3a |
| `For Delivery`, `Ready for Pickup` | `updateStatus` | G3a |
| `Received` *(after BEN-134)* | `complete` | G3b |
| `Rejected`, `Cancelled`, `Completed` | `close` | G2 |

### Panel modes (D1, D8)

`idle` → (`rejecting` \| `updating` \| `confirming-complete`) → `submitting` → `idle`. Any form's **Cancel** returns to `idle` and clears that form. Modes change only the action area. The body (header, REQUESTED BY, lines, note, timeline, stop reason, pickup row) is identical in every mode.

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
  approvedAt?: string; handedOverAt?: string; completedAt?: string;
  rejection?: { reason: string; at: string };
  cancellation?: { reason: string; at: string };
}
type ReviewRefusal = 'status-changed' | 'reason-required' | 'location-required' | 'unavailable';
type TransitionResult = { ok: true } | { ok: false; refusal: ReviewRefusal };
interface ReviewSnapshot extends QueueSnapshot { requests: readonly ReviewRequest[] }
interface AdminRequestSource extends QueueSource {
  readonly pickupOffices: readonly Office[];
  load(): Promise<ReviewSnapshot>;   // the panel reads its request from the table's own snapshot
  approve(id: string): Promise<TransitionResult>;
  reject(id: string, reason: string): Promise<TransitionResult>;
  updateStatus(id: string, to: 'For Delivery' | 'Ready for Pickup', pickup?: PickupLocation): Promise<TransitionResult>;
  // complete(id): added in G3b, after BEN-134
}
```

`Office` is `src/features/auth/types.ts`'s, which holds the contract's enum (`Pasig`), now also exported as the `OFFICES` list. `ReviewSnapshot` narrows `QueueSnapshot`, and `ReviewRequest` is a structural superset of `QueueRequest`, so the existing `buildQueueViewModel` is untouched. *(As built: the planned `get(id)` was dropped. The panel reads its request from the snapshot the table shows, which removes a second read that could disagree with it.)*

## API Contracts

None added. `AdminRequestSource` is an internal UI seam. The backend's approve, reject, update-status and complete endpoints, their refusal codes and their stock semantics (contracts conflict 1) are the API-integration ticket's job. The seeded source's transitions change **status only**. Its `available` figures are fixed seed values, and a comment says release and consumption are the API's (FR-016).

## Component / Module Breakdown

**Feature: `src/features/requests/queue/`**

- `review-types.ts`: the read model and source interface above.
- `review-actions.ts`: `reviewActions(status)` (D1/D2), a pure, exhaustive table.
- `seeded-admin-request-source.ts`: replaces `seeded-queue-source.ts`. It keeps the same 15 rows and ids and adds `lines` (with `available`), `requestorOffice`, notes and timestamps. REQ-2026-1847 matches the frame: three lines, "temporary project setup", Davao. The terminal rows carry placeholder reasons, and 1715 carries a pickup location. Transitions guard the from-status and refuse otherwise with `status-changed`, and they trim and require reasons and locations.
- `admin-request-source.ts`: picks the source. On the dev server only, `?review=changes|failing|reload-fails` wraps it in `dev/review-stub.ts`, which reaches the refusal and failure paths the seed cannot (FR-014). `import.meta.env.DEV` drops it from production.
- `ReviewPanel.tsx`: the `SidePanel` body plus the action area, driven by `reviewActions` and the panel mode.
- `UpdateStatusForm.tsx`: D7.
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
- `src/shared/ui/forms/Select.tsx`: inside an open `<dialog>`, the list is portalled into the dialog (outside it would be inert and under the top layer) and positioned against the dialog's box.
- `src/shared/ui/gallery/Gallery.tsx`: split into one component per section (react-doctor `no-giant-component`, approved by the owner). It renders the same thing, and the fidelity and pixel gates pass.
- `scripts/check-catalog.mjs`, `scripts/check-request-detail.mjs`: they select `dialog[open]`, send a real Esc (a synthetic `KeyboardEvent` never raises a native `cancel`), and wait for the dialog to leave the DOM.

**App**

- `src/app/destinations.ts`, `src/app/routes.tsx`: `requestDetail` is a deep link for both roles; `src/app/RequestDeepLink.tsx` forwards it (D10).
- `src/features/requests/deep-link.ts`: `useDeepLinkedRequest`, used by `QueuePage` and `MyRequestsPage` (D10).
- `src/app/placeholders.tsx`, `src/app/seeded-request-ids.ts`: the placeholder and seeded ownership ids are deleted (D10).

**Docs**

- `docs/design-system/additions.md` §3h (D12).
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
└── queue/
    ├── QueuePage.tsx                 # Review opens the panel
    ├── ReviewPanel.tsx               # new
    ├── UpdateStatusForm.tsx          # new (G3a)
    ├── review-actions.ts             # new
    ├── review-types.ts               # new
    ├── admin-request-source.ts       # new
    ├── seeded-admin-request-source.ts# replaces seeded-queue-source.ts
    └── dev/review-stub.ts            # new, dev only

scripts/check-review-panel.mjs        # new; wired into scripts/verify.mjs
```

## Delivery slices

| Slice | Ticket | Contents |
|-------|--------|----------|
| G2 | BEN-78 | Source + seed, `reviewActions`, `ReviewPanel` read body, approve, reject via `ReasonForm`, terminal read-only, Review-opens-panel, D10 retirement, check script |
| G3a | BEN-79 | `UpdateStatusForm`, pickup location, handover-state actions, pickup read-back |
| G3b | BEN-79, **blocked by BEN-134** | `Received` row, `complete`, inline confirm, five-node timeline |

## Dependencies

- Merged: BEN-46 queue (spec 004), BEN-45 panel pieces (spec 007: `SidePanel`, `StatusTimeline`, `TextField`).
- BEN-134 (constitution 4.0.0) gates G3b only.
- BEN-135 (Admin cancel) adds a `cancel` action and reuses `ReasonForm`. It is not a dependency.
- The backend contract, for replacing the seeded source later.

## Verification

- `npm run lint`, `npm run build`, `npm run verify`.
- `scripts/check-review-panel.mjs`, signed in as the Admin on `/queue`:
  - SC-001: for each seeded status, open the panel and assert that the rendered action buttons equal the `reviewActions` row exactly.
  - Open and close via ✕, Esc and scrim: the address is `/queue`, focus is back on the row, and chip/search/page are preserved.
  - Reject with an empty or whitespace reason: invalid, no status change. With a valid reason: `Rejected`, reason read back, **Close** only, and the row is gone and the chip counts drop.
  - Approve: the pill reads `Approved`, the panel offers Update Status, and the `Pending approval` card drops by 1.
  - Update Status: `Ready for Pickup` with no location is refused. With an office it succeeds. With `Other…` and empty text it is refused. `For Delivery` ↔ `Ready for Pickup` swaps.
  - `?review=changes`: a refusal names the current status. `?review=failing`: status unchanged and input kept.
  - No handover state renders **Complete** (SC-005, pre-4.0.0).
- `scripts/check-shell.mjs`: the Admin and Employee `/requests/:id` cases are updated to expect not-found (D10).
- `scripts/check-request-detail.mjs`: unchanged and still green, which proves the `ReasonForm` extraction.
- Manual: compare with `02.2`, `02.2.1 Approve`, `02.2.1 Update Status` and `02.2.2`/`02.2.2.1` at 1440px, and check 360px for overflow.

## Requirement Coverage

| FR | Where |
|----|-------|
| FR-001, FR-002 | `QueuePage` openId + `SidePanel`; focus return |
| FR-003, FR-004 | `ReviewPanel` body; `ReviewLine.available` from the source |
| FR-005 | `review-actions.ts` + `ReviewPanel` |
| FR-006, FR-007 | `approve`, `reject` + `ReasonForm` |
| FR-008, FR-009 | `UpdateStatusForm`, `pickupOffices`, `PickupLocation` |
| FR-010 | `reviewActions` handover rows have no `complete` |
| FR-011, FR-012 | G3b `CompleteConfirm`, gated by D2/D9 |
| FR-013 | D3 refetch + D5 |
| FR-014, FR-015 | `TransitionResult` refusals; `submitting` mode |
| FR-016, FR-017 | Source seam; no HTTP, no stock math |
| FR-018 | Shared UI + D11 timeline |
| FR-019 | `SidePanel` focus trap; check-a11y-responsive |

19 of 19 covered. FR-011 and FR-012 are covered by G3b, which is blocked by BEN-134.

## Constitution Compliance

| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven | PASS | Spec 008 is recorded. Specs 003 and 004 are amended in the same change. Undrawn UI is logged (D12). `Received` waits for its own amendment. |
| II. Two Roles | PASS | `/queue` is Admin-only. There is no Employee path to any action. |
| III. Inventory Integrity | PASS | The SPA does no stock math, and CURRENT INVENTORY is read from the source. |
| IV. State Machine | PASS | Only 3.0.1 transitions until BEN-134. Illegal actions are unrenderable (D1/D2). |
| V. Notifications | PASS | Emails are the API's. The SPA sends none. |
| VI. Testable Increments | PASS | G2, G3a and G3b each demo on the seed. |
| VII. Typed Contracts | PASS | Internal read model only. Offices come from the contract enum. |
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

## Analysis Overrides

None dismissed. The two findings were applied: (1) reload continuity is now binding in D3; (2) the spec 004 FR-010 annotation stays in this PR's docs work.

## Known Risks

- **Pasig vs Ortigas** (contracts conflict 2) stays open. The panel follows the contract enum.
- The **pickup-location UI** and the **Complete confirm** are undrawn and flagged to the designer (D12).
- **R1 (accepted)**: the seed could harden into a de facto contract. Suggested mitigation: SPA-vocabulary names only, and cite contracts conflict 1.
- **R3 (accepted)**: retiring `/requests/:id` could break email deep links. Suggested mitigation: ask the backend before G2 merges.
- **R4 (accepted)**: the Pasig/Ortigas conflict could leave the pickup preselection empty. Suggested mitigation: add a check that the preselected office is in the list.
- **R5 (accepted)**: G3b is stranded if BEN-134 stalls. Suggested fallback: revert Complete to the handover states, a one-row change to `reviewActions`.
- **CURRENT INVENTORY** freshness depends on the source. With the seed it never moves, because the seed does no stock math by design.
