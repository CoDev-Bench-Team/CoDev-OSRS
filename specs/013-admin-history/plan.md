# Implementation Plan: Admin History — resolved requests

**Date**: 2026-09-29  
**Spec**: `specs/013-admin-history/spec.md`  
**Status**: Draft  
**Linear**: BEN-144 (L1: BEN-149)

## Summary

`/history` renders a `HistoryPage` that reads the **same seeded Admin request store** the Requests Queue reads, keeps only `Completed`, `Rejected` and `Cancelled`, and projects it through a pure `buildHistoryViewModel(snapshot, query)`, the queue's pattern with RESOLVED in place of SUBMITTED. A row's **Review** opens a `HistoryPanel`: the shared `SidePanel` with no footer, composed from the review panel's requester block and reason callout and the Employee read-back's `ITEM · QTY` table and timeline. The shared timeline learns to show the nodes a cancelled request reached before it stopped (FR-009a). Nothing in the feature can call a transition: the source it holds is typed read-only.

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 7  
**Primary Dependencies**: Existing shared UI (`PageHeader`, `Search`, `Select`, `FilterChip`, `TableCard`, `TableHead`, `tableColumnStyle`, `tableMinWidth`, `Pagination`, `StatusPill`, `Button`, `SidePanel`, `Avatar`, `StatusTimeline`, `Notice`, `LoadingState`). No new package.  
**Storage**: None in the SPA. The seeded Admin store is in memory and resets on reload.  
**Target Layer**: Frontend SPA only  
**Performance Goals**: None beyond the queue's. One `load()` per page visit and retry; the projection is a single pass over tens of rows.  
**Constraints**: Constitution 7.0.0; no invented REST contract (VII); no transition reachable from History (IV); Admin-only (II, spec 003 FR-006); reuse over redraw (spec FR-014); no drive-by refactors (CLAUDE.md).

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **One store.** History reads `adminRequestSource(search)`, the queue's seeded store (`src/features/requests/queue/seeded-admin-request-source.ts`), through a read-only seam `historySource(search): HistorySource`, where `HistorySource = Pick<AdminRequestSource, 'load'>`. | `ReviewRequest` already carries requester name, department (`requestorContext`), email, office, lines, note, every transition timestamp and both reasons. A request rejected on the queue is in History on the next load, as it would be against the API. The `Pick` makes FR-011 a type error, not a convention. |
| D2 | **Resolved time is derived, not a new field.** `resolvedAt(request)` returns `completedAt` for `Completed`, `rejection.at` for `Rejected` and `cancellation.at` for `Cancelled`; `undefined` otherwise. It is the **only** place the resolved time is read: the RESOLVED label, both date sorts and the stub's blank-date path all go through it, so integration changes one function (R3). | The read model already records when each terminal status was set. Adding `resolvedAt` would be a second copy that could disagree. What the contract must expose is recorded as a gap (D10). |
| D3 | **A History projection beside the queue's, not a generalised table.** `history-model.ts` exports `buildHistoryViewModel(snapshot, query)`: de-duplicate, keep terminal statuses, search, count per chip, filter, sort, clamp, slice. The shared rules move to `src/features/requests/list-query.ts`: `matchesSearch` (id, name, email, items), `byTime(getTime, direction)` (unusable times sort last under both orders), and a generic `updateQuery<Q extends { page: number }>` (re-selecting the current value keeps the page). `queue-model.ts` imports them, with no behaviour change. | Spec FR-005 to FR-007 restate spec 004 FR-020 to FR-022. One implementation of each rule keeps the two tables in step. The page layout is composed from the same `shared/ui` primitives rather than extracted from `QueuePage`, which would be a refactor of a shipped screen. |
| D4 | **Types.** `history-types.ts`: `TERMINAL_STATUSES = ['Completed', 'Cancelled', 'Rejected']` (chip order as drawn), `HistoryChip = 'All requests' \| TerminalStatus`, `HISTORY_SORTS` = the queue's three, `HistoryQuery` (chip, search, sort, page, pageSize; defaults `All requests`, `''`, `Newest First`, 1, 50), `HistoryRow` (`id`, `requestorName`, `requestorContext`, `itemSummary`, `resolvedLabel`, `status`), `HistoryViewModel` (`chipCounts`, `matchCount`, `page`, `rows`). `PAGE_SIZES` is imported from the queue. | Chip counts on every chip (spec Clarification 5). Sort: the queue's set, with date orders by `resolvedAt` (Clarification 4). |
| D5 | **Page.** `HistoryPage.tsx` owns a `LoadState` (`loading` · `failed` · `loaded`) exactly as `QueuePage` does: `LoadingState` while loading, a `Notice` with **Try again** on failure, the empty-table state on no match. Columns: `REQUEST ID 200px · REQUESTER 180px · ITEMS fluid · STATUS 180px · RESOLVED 180px · ACTION 180px` through `tableColumnStyle` / `tableMinWidth`. ACTION is `Button` **Review** with `aria-label="Review request <id>"`. `RESOLVED` uses `formatDate`, or `NO_VALUE` when unusable. The table sits in `TableCard`, which scrolls horizontally at narrow widths as the queue's does, and the toolbar wraps, so 360px has no page-level overflow. Every control is a native button, input or the shared `Select` and `FilterChip`, so keyboard access and visible focus come from them (FR-015). | Spec FR-003, FR-012, Clarification 1. Same geometry as the queue, so the two tables read as one system. |
| D6 | **Panel.** `HistoryPanel.tsx`: `SidePanel` titled `Request <id>`, header = id heading + `StatusPill`, **no footer** (✕, Esc, scrim only). Body, in the frame's order: requester block, `ITEMS REQUESTED` (`ITEM · QTY`), Note to Approver, `STATUS` timeline, reason callout. The page holds the open id; closing returns focus to that row's **Review** (the `SidePanel` contract). | Spec FR-008 to FR-011. The frame draws no actions. |
| D7 | **Extract, then reuse, the panel parts.** From `queue/ReviewPanel.tsx`, move `RequesterBlock` (avatar, name, `email • Office`) and `StoppedReason` (the callout plus `stoppedReason(request)`, which picks the label and tone from status) into `src/features/requests/review-parts.tsx`. From `detail/RequestReadBack.tsx`, move the `ITEMS REQUESTED` section into `ItemsRequested({ lines })`, typed on `{ description; qty }` so both `RequestLine` and `ReviewLine` satisfy it. *(Amended 2026-09-30, after rebasing on `dev`: BEN-136 had already extracted the table into `detail/RequestLinesTable.tsx` with a shared `SECTION_HEADING`, so `ItemsRequested` is that heading over `RequestLinesTable`, whose `lines` is widened to `Pick<RequestLine, 'description' \| 'qty'>`. `stoppedReason` and `NO_REASON` live in `stopped-reason.ts`.)* Each current caller imports the extracted part, and none of them renders differently, except for a missing reason: `StoppedReason` renders for any `Rejected` or `Cancelled` request, and shows the label over *No reason recorded* when the reason is absent (spec edge case). The seed always stores one, so this appears only through the stub. **Tone:** Cancelled stays **slate**, as in the review panel, and Rejected stays red. The History frame draws the cancellation callout red; that departure is logged (D12). | Spec FR-014. Three panels, one requester block, one reason callout, one items table. The extraction is limited to what History needs. |
| D8 | **Timeline (FR-009a).** In `src/features/requests/request-timeline.ts`, a `Cancelled` request returns `Submitted`, then `Approved` if `approvedAt` is set, then the handover node only if `approvedAt`, `handover` and `handedOverAt` are **all** set, then `Cancelled`. A node is never inferred from one fact alone: a stray `handedOverAt` with no `handover` draws nothing (R2). Each node is `reached` in its own tone and dated. `Rejected` is unchanged, because a rejection only happens from `Pending Approval`. `Received` cannot be cancelled, so no longer shape exists. | The terminal status alone cannot say how far the request got; the timestamps can, and they are what the timeline reads. My Requests and the review panel get the same change (spec 007 is amended). |
| D9 | **Seed.** Add terminal rows to the shared seed so History pages at 10 per page and covers every shape: Completed by delivery and by pickup; Rejected; Cancelled from pending (Employee), from `Approved`, from `For Delivery` and from `Ready for Pickup` (Admin) (*2026-10-01, constitution 8.0.0: `For Delivery` cannot be cancelled, so REQ-2026-1650 became a failed delivery set back to `Ready for Pickup`, then cancelled; spec 008 D19*); a row with no note; several requesters and dates. It reaches about 14 terminal rows. REQ-2026-1847 is left alone, since it is frame `02.2`'s. `?history=<mode>` on the dev server (`history/dev/history-stub.ts`, behind `import.meta.env.DEV`, as `review-stub.ts` does) reaches what the seed cannot: `failing` (load fails), `slow` (a held load, for the loading state), `empty` (no terminal rows), `no-reason` (a Rejected and a Cancelled row with no stored reason), `no-resolved-date` (a terminal row whose terminal timestamp is missing), `recovers` (loads fail until released, so **Try again** can be shown to reload), and `received` (REQ-2026-1715 is Received, so all eight statuses are present and a live `Received` request can be shown to stay off History). | Spec SC-001 and the edge cases. The seed keeps every stored reason, because constitution IV requires one. The missing-reason marker is reached only through the stub. |
| D10 | **Contract gap, recorded, not invented.** Add conflict **7, "History: resolved requests"** to `specs/001-office-supplies-mvp/contracts/README.md`: `GET /requests` filtered to terminal statuses (BEN-105), the time each terminal status was set, the stored rejection and cancellation reason on read, and the requester's department. No route, parameter or field name is proposed. | Constitution VII; spec FR-013. |
| D11 | **Route.** `src/app/routes.tsx` renders `guarded('history', <HistoryPage />)`; `HistoryPlaceholder` is deleted from `src/app/placeholders.tsx`. `DESTINATIONS.history` already carries the title and the subheading copy. | Spec FR-001. The guard already refuses an Employee (spec 003). |
| D14 | **A terminal deep link opens History** (spec FR-016). `RequestDeepLink` is unchanged: it still forwards an Admin to `/queue` with `{ openRequest: id }`, because it does not know the status. `QueuePage` resolves the id against its snapshot, which holds every request. If the request is `Completed`, `Rejected` or `Cancelled`, it navigates (`replace`) to `/history` with the same `DeepLinkState` instead of opening the review panel. `HistoryPage` resolves it with `useDeepLinkedRequest(terminalIds, open, REQUEST_NOT_FOUND)`. A missing id still gets the queue's notice. One load, one forward, and the id is consumed at each hop, so Back never reopens it. | Resolves R5. Amends spec 008 FR-001a: a terminal request's panel is History's, with no CURRENT INVENTORY and no queue behind a row that isn't there. |
| D12 | **Additions log.** In `docs/design-system/additions.md`: the composed Rejected and Completed panels (H2 / D8), counts on every History chip, History's sort menu, and the timeline rule for a stopped request (replacing the collapse rule for Cancelled), the *No reason recorded* marker, and History's cancellation callout in slate where the frame draws red (the owner's call: one status keeps one colour). | Constitution I: undrawn UI is recorded. |
| D13 | **Checks.** `scripts/check-history.mjs`, wired into `scripts/verify.mjs`, covers: Admin-only (nav item absent and `/history` refused for the Employee); terminal statuses only; each chip's list and count; search by id, name, email and item; the three sorts; pagination and page-size reset; the panel's reason block per status and no action controls; the stub modes; a `no-resolved-date` stub row showing `NO_VALUE` and sorting last under both date orders (R3); every seeded Cancelled row's exact timeline node list (R2); `/requests/<terminal id>` as an Admin opening the History panel, and a live id still opening the review panel (D14); no page-level horizontal overflow at 360px and 1440px; keyboard reach to chips, search, sort, **Review** and pagination, with focus returning to **Review** when the panel closes. `check-request-detail.mjs` and `check-review-panel.mjs` update their Cancelled-timeline expectations to D8. | BEN-148 (L4). |

## Data Model

No new entity. History reads `ReviewRequest` (`src/features/requests/queue/review-types.ts`) unchanged:

| Spec entity field | Read from |
|-------------------|-----------|
| id, status | `id`, `status` (narrowed to `TerminalStatus`) |
| requester name / department / email / office | `requestorName` / `requestorContext` / `requestorEmail` / `requestorOffice` |
| lines (item, quantity) | `lines[].description`, `lines[].qty`; the row's ITEMS reads `items` |
| note | `noteToApprover` |
| submitted, per-transition times | `submittedAt`, `approvedAt`, `handedOverAt`, `handover`, `completedAt` |
| resolved time | `resolvedAt(request)` (D2) |
| reason | `rejection.reason` / `cancellation.reason` |

`lines[].available` and `otherNotes` are present and never read by History.

## API Contracts

None published for this read (D10). The feature reads the typed seeded source behind `historySource()`. When the contract publishes, a contract-backed `AdminRequestSource` maps the API into `ReviewRequest`, and History changes nothing above the source.

## Component / Module Breakdown

| File | Change |
|------|--------|
| `src/features/requests/history/HistoryPage.tsx` | **New.** Page, load state, toolbar, chips, table, pagination, open-panel state (D5) |
| `src/features/requests/history/HistoryPanel.tsx` | **New.** Read-only panel (D6) |
| `src/features/requests/history/history-model.ts` | **New.** `buildHistoryViewModel`, `resolvedAt` (D2, D3) |
| `src/features/requests/history/history-types.ts` | **New.** (D4) |
| `src/features/requests/history/history-source.ts` | **New.** `HistorySource`, `historySource(search)` (D1) |
| `src/features/requests/history/dev/history-stub.ts` | **New.** Dev-only modes (D9) |
| `src/features/requests/list-query.ts` | **New.** `matchesSearch`, `byTime`, generic `updateQuery` (D3) |
| `src/features/requests/review-parts.tsx` | **New.** `RequesterBlock`, `Card`, `StoppedReason`, `ItemsRequested` (D7) |
| `src/features/requests/stopped-reason.ts` | **New.** `stoppedReason`, `NO_REASON` (D7) |
| `src/features/requests/detail/RequestLinesTable.tsx` | `lines` widened to `Pick<RequestLine, 'description' \| 'qty'>`, so `ItemsRequested` wraps it (D7, amended 2026-09-30) |
| `src/features/requests/queue/queue-model.ts` | Imports the `list-query` helpers; no behaviour change |
| `src/features/requests/queue/ReviewPanel.tsx` | Imports `RequesterBlock`, `StoppedReason` |
| `src/features/requests/detail/RequestReadBack.tsx` | Imports `ItemsRequested` |
| `src/features/requests/request-timeline.ts` | Cancelled keeps reached nodes (D8) |
| `src/features/requests/queue/seeded-admin-request-source.ts` | More terminal rows (D9) |
| `src/features/requests/queue/QueuePage.tsx` | Forwards a deep-linked terminal id to `/history` (D14) |
| `src/features/requests/deep-link.ts` | `open` may return a path to forward the link to (D14) |
| `src/app/destinations.ts` | History's subheading is the drawn copy (Story 1) |
| `src/app/routes.tsx`, `src/app/placeholders.tsx` | Route to `HistoryPage`; delete the placeholder (D11) |
| `scripts/check-history.mjs`, `scripts/verify.mjs`, `scripts/check-request-detail.mjs`, `scripts/check-review-panel.mjs`, `scripts/check-shell.mjs` | (D13; check-shell for the forwarded terminal link) |
| `specs/001-office-supplies-mvp/contracts/README.md` | Conflict 7 (D10) |
| `docs/design-system/additions.md` | (D12) |
| `specs/008-request-review-panel/spec.md` | FR-001a amended in place for D14 |

## Project Structure

```
src/features/requests/
├── list-query.ts            # new: shared list rules
├── review-parts.tsx         # new: requester block, card, reason callout, items section
├── stopped-reason.ts        # new: reason label, tone and marker
├── request-timeline.ts      # changed
├── history/
│   ├── MyRequestsPage.tsx   # existing (Employee)
│   ├── HistoryPage.tsx      # new
│   ├── HistoryPanel.tsx     # new
│   ├── history-model.ts     # new
│   ├── history-types.ts     # new
│   ├── history-source.ts    # new
│   └── dev/history-stub.ts  # new
├── queue/                   # queue-model, ReviewPanel, seed changed
└── detail/                  # RequestReadBack, RequestLinesTable changed
scripts/check-history.mjs    # new
```

## Dependencies

- No new package.
- Backend (not blocking the build): contracts conflict 7 (D10), BEN-105.
- Merged work reused: BEN-46 (queue), BEN-45 / BEN-47 (read-back, review panel, timeline).

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Implements spec 013; undrawn parts logged (D12); the spec 007 amendment is recorded |
| II. Two Human Roles | PASS | Admin-only through the existing guard (D11); checked (D13) |
| III. Inventory Integrity | PASS | No stock figure read or computed |
| IV. State Machine | PASS | Read-only by type (D1); no transition, no reopen |
| V. Notifications | PASS | Not touched |
| VI. Testable Increments | PASS | Stands alone on the seeded store; `check-history.mjs` |
| VII. Typed Contracts | PASS | No invented route or field; gap raised (D10) |
| VIII. MVP Restraint | PASS | No new dependency; no export or date filter |
| IX. Secrets | PASS | Seed is non-production placeholder data; no unit secrets read |

## Analysis

Cross-checked against spec 013 on 2026-09-29. Coverage is FR-001 to FR-016 plus FR-009a: 17/17 (FR-016 was added during the red team and is covered by D14). No CRITICAL or HIGH findings.

- A1 (MEDIUM, fixed): FR-015 was uncovered. D5 and D13 now carry responsiveness and keyboard access.
- A2 (MEDIUM, decided): the cancellation callout's tone. The frame draws red and the review panel uses slate. **Slate everywhere**, logged in additions.md (D7, D12).
- A3 (MEDIUM, fixed): the missing-reason marker is in `StoppedReason` (D7).

No analysis overrides.

## Build Order

R1: the refactor ships before the feature, so a regression in a shipped screen cannot hide in the History diff.

1. **Extract, with no behaviour change.** `list-query.ts` and `review-parts.tsx` (D3, D7), with the queue, review panel and read-back importing them. One commit. Full `npm run verify` MUST pass on it, the pixel and fidelity gates included, before step 2.
2. **Timeline (D8)**, with `check-request-detail` and `check-review-panel` updated. One commit, verified.
3. **History table (L2):** types, model, source, seed, stub, page, route (D1 to D5, D9, D11).
4. **History panel (L3):** panel, missing-reason marker, terminal deep link (D6, D14).
5. **Checks and docs (L4):** `check-history.mjs`, `verify.mjs`, contracts conflict 7, additions.md.

## Red Team

Steelman: History is a read-only projection of the store the queue already writes to. It reuses the queue's list rules, the review panel's parts and the shared timeline, and it cannot call a transition because its source is typed read-only.

| # | Failure mode | Response |
|---|--------------|----------|
| R1 | The D3/D7 extraction regresses a shipped screen, hidden in a large diff | **Mitigated**: extract-first commit with full verify (Build Order 1) |
| R2 | The widened timeline draws nodes a cancelled request never reached, when its facts are inconsistent | **Mitigated**: a node needs all its facts (D8); every seeded Cancelled row is checked (D13) |
| R3 | The derived resolved time does not survive the real contract | **Mitigated**: one `resolvedAt()` (D2); conflict 7 names the need (D10); the blank path is stubbed and checked (D9, D13) |
| R4 | A load-everything, filter-in-the-browser list does not scale to the drawn 1,250 rows | **Accepted**, see Known Risks |
| R5 | An email link to a resolved request opens the queue's review panel, not History | **Mitigated**: D14; spec 013 FR-016; spec 008 FR-001a amended |

## Known Risks

- **R4, client-side projection.** `HistorySource.load()` returns the whole store and `buildHistoryViewModel` filters, sorts and pages in the browser. That is right for the seed and wrong for the drawn 1,250 rows. When BEN-105 publishes a server-paged `GET /requests`, the contract-backed source takes the query and the projection's filter and page steps move behind it. The projection stays pure and the seam narrow so the swap stays inside `history/`. Conflict 7 records that the list is expected to be paged on the server. Accepted by the project owner, 2026-09-29.

**Strengthened position:** History is a read-only projection of the one Admin store. It lands after a behaviour-preserving extraction that the full gate suite verifies, and it reuses one set of list rules and one set of panel parts. Its two contract-sensitive derivations, the resolved time and the stopped timeline, each live in one guarded function. A resolved request has one home, including when an email links to it.
