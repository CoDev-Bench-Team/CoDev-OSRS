# Implementation Plan: Requests Queue — list, filters, search, sort

**Date**: 2026-09-22  
**Spec**: `specs/004-approver-pending-queue/spec.md`  
**Status**: Draft

## Summary

Replace the `/queue` shell placeholder with the Admin's Requests Queue composed from the existing design-system components. Until the backend contract is published, one typed feature-local source supplies demonstrable queue data; the page derives request metrics and pending rows without defining HTTP behavior or inventory thresholds.

## Technical Context

**Stack**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4  
**Primary Dependencies**: Existing React Router and shared OSRS UI exports; no new package  
**Storage**: None in the SPA; temporary in-memory fixture data  
**Target Layer**: Frontend SPA  
**Performance Goals**: Derive metrics and rows in one linear pass over the small internal queue; no additional network behavior  
**Constraints**: Admin-only (constitution 3.0.0 II); no request transitions; no invented REST contract or low-stock threshold; feature ownership stays under `src/features/requests/queue/*` with a minimal route swap

## Data Model

Feature-local view data, not a backend contract:

- `QueueRequest`: request id, requestor name, optional organizational context, item names, submitted timestamp, and canonical request status.
- `QueueSnapshot`: requests plus a source-provided low-stock alert count.
- `QueueViewModel`: three summary metrics, per-chip counts, the range label's numbers, and the current page of rows (**amended — third 2026-09-24 amendment**; was rows filtered to `Pending Approval`).
- `QueueQuery`: chip, search term, sort, page and page size — one value, projected with the snapshot in one pure step.
- `QueueSource`: asynchronous read boundary returning one snapshot.

The temporary source owns fixture values. The view model may count canonical request statuses but must not classify inventory or define a low-stock threshold.

## API Contracts

The backend contract remains unpublished at `specs/001-office-supplies-mvp/contracts/README.md`. This feature adds no HTTP call, endpoint, payload, response field, or error mapping.

`QueueSource` is an internal UI seam, not a proposed REST contract. It can be replaced only after the backend-published contract defines the real data.

## Component / Module Breakdown

- `src/features/requests/queue/queue-types.ts` — feature-local request, snapshot, source, and view-model types.
- `src/features/requests/queue/queue-model.ts` — pure derivation of pending, in-processing, and pending-row projections.
- `src/features/requests/queue/seeded-queue-source.ts` — explicit temporary fixture source; supplies low-stock count rather than a threshold.
- `src/features/requests/queue/QueuePage.tsx` — loading, failure, empty, summaries, responsive table, and Review links.
- `src/app/routes.tsx` — import the real page and replace only the `QueuePlaceholder` route element (was `ApprovalsPlaceholder` before the 3.0.0 realignment), and drop that placeholder from `src/app/placeholders.tsx` once nothing references it.
- `src/shared/ui/actions/button-styles.ts` — `BUTTON_SHAPE` and `BUTTON_VARIANT`, lifted out of `Button.tsx` (**amended 2026-09-22**, see below).
- `src/shared/ui/data-display/table-columns.ts` — `tableColumnStyle`, the one column-sizing rule shared by `TableHead` and the queue's row cells (**amended 2026-09-24**, see below).

**Amendment — 2026-09-22.** This section previously read "Shared components remain unchanged." Code review found the Review action had hand-copied eleven of `Button`'s twelve primary classes and dropped the semantic `min-w-touch-target`, which is the drift this plan's own red-team section warns about in a different form. The row's action must be an `<a>` so copy-link and middle-click keep working, so it cannot simply *be* a `<Button>`.

The resolution is the smallest one that removes the duplication: the class strings move to their own module and both `Button` and the link consume them. `Button`'s rendered output is unchanged, no component gains a prop, and no other caller is touched. They live apart from `Button.tsx` because a component file that also exports constants loses Fast Refresh. Recorded here rather than applied silently, per constitution I.

**Amendment — 2026-09-24.** Code review found the page's `column()` helper restated `TableHead`'s inline column-sizing expression by hand — and had already drifted from it (`minWidth: 0` on the fluid column, so `truncate` can take effect in cells). Same class of duplication as the 2026-09-22 amendment, one file over. The resolution is the same shape: the expression moves to `tableColumnStyle` in its own module, and both `TableHead` and the row cells call it. `TableHead`'s fluid heading now also carries `minWidth: 0`, which changes nothing visible for a short heading; no component gains a prop, and no other caller is touched.

**Amendment — 2026-09-24 (second review round).** A further review raised five
items, four of them in this feature and one in the shared gallery. None changes
what the page does; all four are the same theme as the two amendments above —
a value or a guarantee stated in two places instead of derived in one.

- **The table's minimum width was hand-carried.** `min-w-[1090px]` was `COLUMNS`
  added up by a person: 930px of fixed columns, 40px of row padding, and a
  120px floor for the fluid ITEMS column. Widening a fixed column against a
  fixed total silently squeezes ITEMS instead of widening the table. It is now
  `TABLE_MIN_WIDTH`, reduced from `COLUMNS` at module scope. Measured: the
  derived value is 1090px, so the change is output-preserving today and
  drift-proof after.
- **The scroll region clipped the card's shadow.** `overflow-x-auto` computes
  the block axis to `auto` as well, so the region clipped `shadow-card`
  (offset 5px, blur 18 — it paints ~4px above, ~14px below and ~9px either side
  of the card) on three sides. The region now carries padding for the shadow and
  matching negative margins that give the space back. The 9px of horizontal
  bleed sits well inside the shell's 32px gutter; SC-006 was re-measured at 360,
  768, 1024 and 1440px and no page-level overflow appears at any of them.
- **A successful retry dropped keyboard focus.** The Try Again button unmounts
  with the failure notice, leaving `document.activeElement` on `<body>` — the
  visitor had to tab in from the top of the document to reach the queue they had
  just asked for. Focus now moves to the page-heading wrapper, and only after a
  retry, so a successful first load never steals focus. Verified end-to-end by
  making the source fail and pressing the button.
- **`summarizeItems` had no fallback where `formatSubmitted` has one.** An empty
  or all-blank item list rendered a blank cell that cannot be told apart from a
  rendering fault. It now returns the same em dash the date path returns, and
  drops blank names before counting so "+ N more" never promises rows that are
  not there. FR-009's item summary is unchanged for every well-formed input.
- **`tableColumnStyle` was not yet the rule it claimed to be.** The 2026-09-24
  amendment above describes it as the one column-sizing rule for OSRS tables,
  but the repository's only other table rows — the two in
  `src/shared/ui/gallery/Gallery.tsx`, which is the reference the product is
  ported *from* — still hand-wrote `w-[180px] shrink-0` / `flex-1`. Both now
  size their cells through `tableColumnStyle` against one shared
  `REQUEST_COLUMNS`. Output-preserving (the fluid cell already carried
  `truncate`, so its `min-width: auto` had resolved to 0 anyway); the fidelity
  and pixel gates both still pass.

The fifth item was a claim in the pull-request description, not in the code: it
states that the loading and failure notices carry `role="status"` / `role="alert"`.
`Notice` sets neither. What announces is this page's own persistent
`role="status" aria-live="polite"` region, which is the better arrangement and
is unchanged — but it means the failure is announced politely rather than
assertively, and the description should say so.

**Amendment — 2026-09-24 (third review round).** A fourth review raised six
items. The two documentary ones are carried by the 2026-09-24 amendment in
`spec.md` and by the corrected Constitution Compliance table below. The four in
code:

- **`ColumnWidth`.** `tableColumnStyle` accepted any CSS length, but
  `TABLE_MIN_WIDTH` has to *add the columns up*, and `Number.parseInt('12rem')`
  is `12` — a silently wrong total. Column widths are now typed
  `` `${number}px` ``, so a non-px unit is a compile error. It found a real
  looseness on the first run: the gallery's `REQUEST_COLS` was annotated
  `string` and no longer type-checks without the narrower type.
- **The row gutter is shared.** `ROW_PADDING_X = 40` was a literal that had to
  agree with the `px-20` class on `TableHead` and on the queue's rows. Both now
  read `TABLE_ROW_PADDING_CLASS` from `table-columns.ts`, and the number is
  parsed back out of that class, so the padding and the width calculation cannot
  drift.
- **The em dash no longer becomes a tooltip.** `NO_VALUE` is exported from the
  model so the page can recognise the placeholder and omit `title` for it,
  rather than hovering the same character the cell already shows.
- **Retry focus lands on the section heading**, not the page header. The live
  region is already about to announce the count; a page header carrying a title
  *and* a subtitle would be read on top of it. "Pending Approval" is two words,
  it heads the content that just appeared, and it puts the visitor at the table.

**An approach that was tried and rejected.** Deriving the minimum width from CSS
instead of arithmetic — `min-width: min-content` on the sizer with a floor on the
fluid column — would have removed both the unit assumption and the padding
coupling outright. Measured, it resolves to **1195px** rather than 1090px: the
table would demand 105px more and scroll sooner, and the extra could not be
accounted for cleanly from the column set. Rejected in favour of the explicit
calculation, which is duller but is a number anyone can check.

**Amendment — 2026-09-24 (fourth review round).** The previous amendment added
`ColumnWidth` so a non-pixel column width could not reach the width calculation
as a silently wrong number. Review then found the constant *directly beneath it*
carrying the same defect, and worse:

`TABLE_ROW_PADDING_CLASS` was an untyped `'px-20'` whose number was parsed back
out of the class. `px-touch-target` is a real utility in this system (44px). As a
bare literal it compiled, rendered 44px of padding, and handed `NaN` to
`TABLE_MIN_WIDTH` — which React drops without a warning. Measured at 700px, the
result was not a small error: `min-width` vanished, the card fell from 1090px to
621px, the ITEMS column collapsed to **0px**, and the table stopped scrolling.
`tsc`, `oxlint` and all ten verify gates passed throughout.

The resolution is the one the previous amendment should have applied to both
constants: the class is typed `` `px-${number}` ``, so a named token is a compile
error. Two further changes follow from it:

- **The width arithmetic moves into `tableMinWidth`**, beside the type it
  depends on, with guards for what `ColumnWidth` cannot express — the template
  literal admits `-5px` and `1e3px`, and a negative addend would quietly shrink
  the minimum. It throws rather than laying out wrongly.
- **The gallery's two table rows move onto the shared gutter.** T013 introduced
  `TABLE_ROW_PADDING_CLASS` as "the gutter shared by every OSRS table header and
  row" and then left the gallery's rows on a literal `px-20` — the same
  inconsistency T012 had just fixed for `tableColumnStyle`, one constant over.

`spec.md`'s three superseded requirements are also marked **inline** rather than
only in the amendment 70 lines below them, since the Functional Requirements
section is what a developer implements from.

**The lesson, recorded because it recurred three rounds running.** Each of
T011, T012, T013 and T014 fixed a value stated in two places and introduced or
left another one beside it. A type or a shared constant is only a guarantee for
the values it actually covers; the neighbouring value is where the next defect
lives.

Approve, reject, and request-detail behavior remain owned by BEN-45.

**Amendment — 2026-09-24 (realignment to constitution 3.0.0).** Spec 001
Phase 0 merged to `dev` and removed `DESTINATIONS.approvals`, the `approver`
role and the `For Release` / `Released` statuses. After the rebase the page
read `DESTINATIONS.approvals.title` during render, the render threw, and the
Admin's landing screen fell to the shell's error boundary. The feature moves to
`src/features/requests/queue/` behind dev's `/queue` destination, reads its
title and subtitle from `DESTINATIONS.queue`, and counts In Processing over the
new statuses. No shared component changes. See the second 2026-09-24 amendment
in `spec.md` for what stays out of scope (chips, search, sort, pagination).

**Amendment — 2026-09-24 (third: the full list surface).** Spec 004's third
amendment brings chips, search, sort and pagination into scope from the
2026-09-24 export ([drift §7](../../docs/design-system/drift-2026-09-24.md)).
The queue frames did not change after 09-22.

- **One query, one projection.** `QueueQuery` holds chip, search, sort, page and
  page size. `buildQueueViewModel(snapshot, query)` de-duplicates, drops terminal
  statuses, applies search, counts per chip, filters by chip, sorts, clamps the
  page and slices it, all in that order in one function. The counts, the range
  label and the rows come from the same pass, so they cannot disagree (FR-023).
  A change to anything except the page returns to page 1. That rule lives in
  one reducer-style helper, not in four handlers. (Refined by the T020
  amendment below: re-selecting the current value is not a change.)
- **Two shared components, promoted rather than local.** `FilterChip`
  (`src/shared/ui/forms/FilterChip.tsx`) and `Pagination`
  (`src/shared/ui/data-display/Pagination.tsx`) are built to the file's
  `Category` chip and `pagination control` / `page` / `result per page`
  components. BEN-73 requires Assets, Inventory and History to reuse the same
  pagination, and Catalog's category chips share the chip's geometry. The
  result-per-page control is a styled native `<select>`. The shared `Select`
  trigger is the 46px, r10 form control, and the file draws this one at 36px,
  r4.
- **Four primitives added** for the pagination greys the source draws and the
  token layer lacks: `#e9e9e9` (ring), `#f4f4f4` (hover), `#313131` (ink),
  `#939393` (open ring). They are recorded in `token-map.md`.
- **Two shared components change, both output-preserving for existing
  callers.** `SummaryCard` gains `tone="neutral"` and `size="compact"`: the
  queue binds only *Pending approval* to red and the other values to `Ink-900`,
  and draws its cards 262x75 with 8px vertical padding, not the UI kit's
  103px card. Both defaults are unchanged. `Search`'s input now spans the field so the global focus outline
  lands on the focused element. The shell's keyboard gate failed on `/queue`
  without it. Its 226px default is kept as a minimum, and the fidelity and
  pixel gates still pass.
- **The `Pending Approval` section heading is removed.** The queue frame does
  not draw it. Retry focus moves to the chip group.
- **Review stays a link** to `/requests/:id` until BEN-47's panel exists.

**Amendment — 2026-09-24 (T020: review follow-ups).** Four review rounds after
the full list surface landed, squashed into one commit.

- **A no-op is not a change.** `updateQuery` returns the query unchanged when
  every field in the patch already holds that value, so pressing the chip that
  is already selected keeps the page (FR-022, clarified). Returning the same
  object also lets React skip the state update.
- **`Pagination` keeps focus at the ends.** Back and Next take `aria-disabled`
  and a guarded handler instead of `disabled`. A `disabled` button drops
  keyboard focus to `<body>` the moment the press that reached the last page
  disables it. The global `[aria-disabled='true']` rule dims it and blocks the
  pointer, and it stays in the tab order, as an `aria-disabled` control should.
  The range label is **not** a live region: the screen owning the table
  announces its own result count, and a second region would speak over it on
  every keystroke. Pressing the current page does not call back. Assets,
  Inventory and History inherit all three.
- **`Search` has one focus indicator**, the input's own outline. Its left inset
  is written as the sum of the three spacing tokens it depends on.
- **The sort value is narrowed, not cast**, before it reaches the comparator
  lookup.
- **The projection is memoised** on the load state and the query, so it no
  longer reruns on renders that change neither. At the seeded size this makes no
  difference to speed; it matters at the design's "1-50 of 1,250" once a real
  source arrives.
- **`scripts/check-queue.mjs`** is the queue's own `npm run verify` gate:
  FR-004–FR-008, FR-014 and FR-019–FR-023, driven through the same CDP client as
  the other gates. It was mutation-tested: putting `disabled` back on Next, and
  removing the page reset for chip changes, each fail only the assertion meant
  to catch them. The chip reset is asserted through a return to All, because a
  one-page chip shows page 1 through the clamp whether or not the query reset.

## UI and State Flow

1. The existing shell and route guard admit only an Admin to `/queue`.
2. The page loads one snapshot through `QueueSource`.
3. A pure projection applies the query — search, chip counts, chip filter, sort, page — and derives Pending approval and In Processing over the whole snapshot; Low stock alerts is copied from the source.
4. Loading, failure, and successful empty states remain distinguishable.
5. Review is a router link to `/requests/:id`; the queue performs no mutation.
6. The table uses a contained horizontal overflow region at narrow widths so the application page itself does not overflow.

## Project Structure

```text
specs/004-approver-pending-queue/
├── spec.md
├── plan.md
└── tasks.md

src/features/requests/queue/
├── QueuePage.tsx
├── queue-model.ts
├── queue-types.ts
└── seeded-queue-source.ts

src/shared/ui/actions/
└── button-styles.ts            # added by the 2026-09-22 amendment above

src/shared/ui/data-display/
├── Pagination.tsx              # added by the third 2026-09-24 amendment
└── table-columns.ts            # added by the 2026-09-24 amendment above

src/shared/ui/forms/
└── FilterChip.tsx              # added by the third 2026-09-24 amendment

scripts/
└── check-queue.mjs             # added by the T020 amendment; wired into verify.mjs
```

## Dependencies

- BEN-38 / A6 shell dependency is complete.
- Existing `/queue` destination and Admin guard (spec 001 Phase 0, PR #40).
- Existing shared `PageHeader`, `SummaryCard`, `TableCard`, `TableHead`, feedback, and action components.
- BEN-45 owns the request-detail screen reached by Review and may still render its placeholder independently.
- A published backend contract is not required for this fixture-backed read-only slice.

## Verification

- `npm run lint`
- `npm run build`
- `npm run verify`, which includes `scripts/check-queue.mjs` (T020): live statuses, cards, chips, search, sort, pagination and focus at the ends, all automated
- Inspect as the Admin at `/queue` for populated and empty fixture projections.
- Confirm Employee direct access remains refused by the existing route guard, and `/approvals` renders not-found.
- Confirm Review changes only the location to `/requests/:id`.
- Confirm no page-level horizontal overflow from 360px through 1440px.

No unit-test runner exists in this repository, so this feature will not add a new framework. Pure projection logic is isolated for later unit coverage, and current repository checks provide static verification.

## Requirement Coverage

- FR-001–FR-003: Existing destination and guard plus the Admin-only route replacement.
- FR-004–FR-008: Snapshot model and pure projection.
- FR-009–FR-010: Queue table and Review links.
- FR-011: Navigation-only component boundary.
- FR-012: Explicit loading, empty, and failure states with retry.
- FR-013: The page reloads its snapshot on every mount and on Try Again; because `/queue` and `/requests/:id` are separate route elements, returning from request detail remounts the page and shows current data. Against the static fixture source this reload is exercised but cannot reflect a decision — the row set never changes — so FR-013 is verifiable end-to-end only once the published source replaces the fixtures.
- FR-014: Keyboard operability comes from the Review action being a real `<a>`; the visible focus indicator is the design system's global `:focus-visible` rule in `src/styles/index.css`, which predates this feature and is intentionally not restated per control. Measured on the Review links, not only inspected.
- FR-015–FR-016: Shared controls/tokens and contained responsive table.
- FR-017–FR-018: Internal source seam with no HTTP or threshold logic.
- FR-019–FR-023: `QueueQuery` and its single projection; `FilterChip`, `Search`, `Select` and `Pagination` render it.

All 23 requirements are covered.

## Constitution Compliance

**Re-read against constitution 3.0.0** after the realignment (second
2026-09-24 amendment in `spec.md`). Rows II and IV were marked SUPERSEDED
between the rebase and the realignment; what they said then is kept in the
amendment, and they are scored against 3.0.0 now.


| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven Development | PASS | `spec.md` is finalized before plan, tasks, and code, and the 2026-09-24 amendment records what changed underneath it. |
| II. Two Distinct Human Roles | PASS | The page is reachable by the **Admin** only, through the shell's `/queue` guard ([ADR-0005](../../docs/adr/0005-two-role-model.md)). Before the realignment this row read SUPERSEDED: the page was Approver-only. |
| III. Inventory Integrity | PASS | Read-only metrics perform no inventory mutation or threshold classification. |
| IV. Explicit Request State Machine | PASS | The queue filters status and performs no transition. In Processing reads `Approved` / `For Delivery` / `Ready for Pickup` ([ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md)); `For Release` / `Released` are gone. |
| V. Notification Completeness | PASS | No transition or notification is implemented. |
| VI. Independently Testable Increments | PASS | The queue can be demonstrated with the typed temporary source, and `check-queue.mjs` verifies its acceptance criteria in `npm run verify`. |
| VII. Typed Contracts | PASS | Internal view types are not represented as backend JSON; no REST contract is invented. |
| VIII. MVP Restraint | PASS | No new framework, package or mutation. Search, filter, sort and pagination are in spec 001 FR-016/FR-018 and in the design; they run client-side over the source's snapshot until the contract says where they run. |
| IX. Secrets and Internal Data | PASS | Fixtures are non-production placeholders and contain no credentials. |

## Red-Team Analysis

### Typed fixtures drift into an accidental API contract

- **Early warning**: HTTP-shaped names or endpoint assumptions appear in source types.
- **Mitigation**: Name the boundary as a queue view source, keep it feature-local, and document that it is replaceable only from the published contract.

### Low-stock logic is silently invented

- **Early warning**: Numeric threshold comparison appears in SPA code.
- **Mitigation**: The source supplies the alert count; the model never receives inventory quantities for classification.

### Desktop fidelity causes narrow-width overflow

- **Early warning**: The body width grows beyond the shell at 360px.
- **Mitigation**: Keep table width inside an explicitly scrollable content region and let summary cards wrap.

### Queue absorbs request-decision behavior

- **Early warning**: Approve/reject handlers, dialogs, or status writes appear under `queue/`.
- **Mitigation**: Review is a link only; BEN-45 remains the sole owner of decision actions.

## Known Risks

All identified plan risks are mitigated. The remaining accepted limitation is that the live Figma node could not be read in this agent session; implementation fidelity was based on the vendored 2026-09-15 re-export until the third 2026-09-24 amendment, and is now read from the 2026-09-24 `.fig` directly (drift-2026-09-24 §7).

## Strengthened Position

The queue is a small, typed, read-only page slice: existing shell authorization controls entry, one replaceable local source controls demo data, one pure projection controls metrics and rows, and request-detail navigation is the only action.
