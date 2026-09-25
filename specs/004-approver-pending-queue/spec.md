# Feature Specification: Requests Queue — list, filters, search, sort

**Feature Branch**: `emmanuelr/ben-46-p2spa-approver-pending-queue`  
**Created**: 2026-09-22  
**Status**: Draft  
**Sources**: BEN-46, BEN-72, `specs/001-office-supplies-mvp/spec.md`, `specs/003-app-shell-routing/spec.md`, vendored Figma re-export dated 2026-09-15 — **superseded**; realigned to the 2026-09-22 export ([drift](../../docs/design-system/drift-2026-09-22.md)) by the second 2026-09-24 amendment below, and extended to the full list surface from the 2026-09-24 export ([drift](../../docs/design-system/drift-2026-09-24.md)) by the third

## Overview

Give an Admin a focused landing page — the **Requests Queue** — that summarizes request workload and lists every live request, filterable by status, searchable, sortable and paginated. Each row leads to the existing request-detail destination where review actions belong.

This feature is the list slice of the merged Admin queue the design source draws (constitution 3.0.0 II, [ADR-0005](../../docs/adr/0005-two-role-model.md)). It does not implement approval, rejection, handover or completion actions; those belong to the review panel (BEN-47).

## User Stories

### Story 1 — See approval workload at a glance (Priority: P1)

An Admin opens their landing page and sees current workload totals before reviewing individual requests.

**Why this priority**: The queue is the Admin's primary work surface and must immediately communicate whether action is required.

**Acceptance Criteria**:

1. **Given** an Admin with pending requests, **When** they open `/queue`, **Then** they see summary cards for Pending approval, In Processing, and Low stock alerts.
2. **Given** the summary and queue are based on the same current state, **When** the page renders, **Then** the Pending approval total equals the number of requests eligible for review.
3. **Given** inventory items have been classified as low stock by the system's data source, **When** the page renders, **Then** Low stock alerts shows that count without defining a new low-stock threshold in the SPA.

### Story 2 — Find and open a request (Priority: P1)

An Admin narrows the live queue by status, search and sort, pages through it, identifies the requestor and requested items, and opens a request for review.

**Why this priority**: Moving from the queue to request detail is the feature's core task.

**Acceptance Criteria**:

1. **Given** live requests exist, **When** the queue renders, **Then** each row shows request id, requestor identity and organizational context, item summary, its own status pill, submitted date, and a Review action.
2. **Given** a request row, **When** the Admin activates Review, **Then** the application navigates to `/requests/:id` for that request.
3. **Given** requests that are `Rejected`, `Cancelled` or `Completed`, **When** the table renders, **Then** they do not appear — resolved requests belong to History.
4. **Given** the Admin returns from request detail after a decision changed the request status, **When** current data is shown, **Then** the row carries its new status (or is gone, if the new status is terminal) and the summary and chip counts reflect the current workload.
5. **Given** the chips `All requests · Pending Approval · Approved · For Delivery · Ready for Pickup`, **When** the Admin selects one, **Then** only requests in that status are listed and the chip's count equals the number of matching requests.
6. **Given** a search term, **When** it matches a request id, employee name, employee email or item name (case-insensitive), **Then** only matching requests are listed and every chip count is recomputed over the matches.
7. **Given** the sort select, **When** the Admin picks Newest First, Oldest First or Employee (A-Z), **Then** the order changes and is kept while paging.
8. **Given** more matching requests than the page size, **When** the Admin pages or changes Result per page, **Then** the range label reports the true range and total and the table shows that slice.

### Story 3 — Understand non-success states (Priority: P1)

An Admin receives a clear, usable page while data is loading, when no requests are pending, or when current data cannot be shown.

**Why this priority**: An empty queue is a normal outcome; failures and waiting must not look like an empty workload.

**Acceptance Criteria**:

1. **Given** queue data is still being determined, **When** the page renders, **Then** a deliberate loading state appears without stale request rows.
2. **Given** no live requests, or none matching the chip and search, **When** loading succeeds, **Then** the table states which of the two it is while preserving the workload summary and the controls.
3. **Given** queue data cannot be loaded, **When** the failure is shown, **Then** the page distinguishes the failure from an empty queue and offers a retry when retry is supported.

### Story 4 — Use the queue safely across supported devices (Priority: P2)

An Admin can review the queue with keyboard controls and at every width supported by the application shell.

**Why this priority**: The queue must preserve the shell's accessibility and responsive commitments.

**Acceptance Criteria**:

1. **Given** keyboard-only use, **When** focus moves through Review actions, **Then** every action has a visible focus indicator and can be activated.
2. **Given** a viewport from 360px through 1440px, **When** the queue renders, **Then** content remains reachable without causing page-level horizontal overflow.
3. **Given** the 1440px design viewport, **When** the page renders, **Then** its hierarchy matches the source: page header beside the summary cards, search and sort, filter chips, request table, and pagination.

## Edge Cases

- A request changes status between loading the queue and opening detail: detail remains the authority and offers only actions legal for its current status.
- Duplicate request identifiers from a malformed source do not produce duplicate interactive row identities.
- Long requestor names and item summaries remain readable without overlapping adjacent columns or controls.
- A request with many items uses a concise item summary rather than expanding the row indefinitely.
- A metric may be available while pending rows are empty; each value reflects its own defined population.
- An Employee opening `/queue` continues to receive the shell's existing access refusal.
- The retired `/approvals` address renders not-found for every role, the Admin included (ADR-0005).

## Functional Requirements

> Three requirements below are struck through and marked **SUPERSEDED**: they were
> written against constitution 2.0.0 and no longer hold under 3.0.0. They are
> kept rather than deleted so the amendment has something to point at. The
> record, and which Phase 0 task owns each migration, is the
> [2026-09-24 amendment](#session-2026-09-24--amendment-this-spec-predates-constitution-300).

- **FR-001**: The page MUST be the Admin landing destination at `/queue`, titled **Requests Queue** and subtitled *"Review, approve, and fulfill supply requests"*. ~~Approver landing destination at `/approvals`~~ — realigned by the second 2026-09-24 amendment.
- **FR-002**: ~~The page MUST remain accessible only to users whose single role is Approver.~~ **SUPERSEDED** by constitution 3.0.0. **Now:** the page MUST remain accessible only to users whose single role is **Admin**; see the 2026-09-24 amendments.
- **FR-003**: ~~The page MUST NOT merge Approver and Supply Admin capabilities or identity.~~ **SUPERSEDED** by constitution 3.0.0 — the two roles *are* merged ([ADR-0005](../../docs/adr/0005-two-role-model.md)). **Now:** withdrawn; the one Admin both decides and fulfils, and this page links to both halves through Review.
- **FR-004**: The page MUST show three read-only summary cards labelled Pending approval, In Processing, and Low stock alerts.
- **FR-005**: Pending approval MUST count requests whose current status is `Pending Approval`.
- **FR-006**: In Processing MUST count non-terminal requests that have passed approval: `Approved`, ~~`For Release`, and `Released`~~ — those two statuses are **SUPERSEDED** by constitution 3.0.0 ([ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md)). **Now:** `Approved`, `For Delivery` and `Ready for Pickup`.
- **FR-007**: Low stock alerts MUST count inventory items classified as low stock by the system's data source; the SPA MUST NOT invent a threshold.
- **FR-008**: ~~The pending table MUST contain only requests currently in `Pending Approval`.~~ **SUPERSEDED** by the third 2026-09-24 amendment. **Now:** the table MUST contain every live request — `Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup` — narrowed by the selected chip and the search term.
- **FR-009**: Each row MUST show request id, requestor name, requestor organizational context when available, an item summary, the row's own status pill, submitted date, and Review.
- **FR-010**: Review MUST navigate to the stable request-detail destination for that request.
- **FR-011**: The queue MUST NOT approve, reject, cancel, prepare, release, or complete a request.
- **FR-012**: The page MUST show distinct loading, empty, and failure states.
- **FR-013**: A successful refresh after a request changes status MUST show its new status, remove it when that status is terminal, and update affected metrics and chip counts.
- **FR-014**: Interactive controls MUST be keyboard operable and show a visible focus indicator.
- **FR-015**: The page MUST remain usable from 360px through 1440px without page-level horizontal overflow.
- **FR-016**: The page MUST use the established design vocabulary and shared shell rather than introduce a second Admin layout.
- **FR-017**: The SPA MUST NOT invent REST routes, payloads, response fields, error codes, or low-stock thresholds.
- **FR-018**: Until the backend contract is published, demonstrable queue data MAY come from a typed temporary source that preserves these product semantics.
- **FR-019**: The page MUST offer filter chips `All requests`, `Pending Approval`, `Approved`, `For Delivery`, `Ready for Pickup` (the file's chip says `For Pickup`; see amendment 4), each with its count; `All requests` MUST be selected by default and the selected chip MUST expose its pressed state.
- **FR-020**: Search MUST match request id, employee name, employee email and item names, case-insensitively and ignoring surrounding whitespace; chip counts MUST be computed over the search matches, not over the current page.
- **FR-021**: Sort MUST offer Newest First (default), Oldest First and Employee (A-Z). A request whose submitted timestamp is unusable sorts after every dated request under both date orders; Employee (A-Z) breaks ties newest first.
- **FR-022**: The table MUST be paginated with a `first-last of total` range label, Back / numbered pages / Next, and a Result per page select defaulting to 50. Back and Next MUST be disabled at the ends. Changing the chip, search, sort or page size MUST return to page 1. Re-selecting the value already in effect — pressing the chip that is already selected — is not a change and MUST keep the page.
- **FR-023**: Chip, search, sort and page MUST be one query state projected in one pure step, so the counts, range label and rows cannot disagree.

## Key Entities

- **Requests queue**: The current set of live requests — awaiting a decision, or approved and not yet completed.
- **Queue query**: The selected chip, search term, sort order, page and page size, held as one value.
- **Queue row**: A concise projection of one live request for navigation to detail.
- **Workload metric**: A read-only count for pending approval, in-processing requests, or low-stock items.

## Out of Scope

- Approve and reject mutations, including rejection-reason entry
- Request-detail content and status actions
- Fulfilment (For Delivery / Ready for Pickup, Complete) and cancellation actions — the review panel's (BEN-47)
- Asset and inventory-management actions
- Employee request history
- Defining or publishing a REST contract
- Defining the low-stock threshold
- Persisting chip, search, sort or page in the address bar
- The new `Received` status, the Employee's accountability form, and the Admin's new-request email ([drift-2026-09-24 §2–§3](../../docs/design-system/drift-2026-09-24.md)) — not adopted by the constitution
- Email notification behavior

## Success Criteria

- **SC-001**: An Admin can open `/queue`, identify every request awaiting review, and reach any listed request detail in one action.
- **SC-002**: Pending approval equals the number of reviewable rows for every demonstrated data set.
- **SC-003**: Employee users cannot access the page through navigation or direct address.
- **SC-004**: Empty, loading, and failure outcomes are visually distinguishable.
- **SC-005**: Every Review action is keyboard operable with visible focus.
- **SC-006**: The page is usable without page-level horizontal overflow at every viewport width from 360px through 1440px.
- **SC-007**: Review of the feature finds no invented backend route, payload, response field, error code, or inventory threshold.

## Clarifications

### Session 2026-09-22

- Q: Is this the merged Admin queue drawn in Figma? → A: No. It is Approver-only; Supply Admin fulfillment remains separate.
- Q: Which summary cards remain after the role split? → A: The vendored re-export retains Pending approval, In Processing, and Low stock alerts as read-only context.
- Q: Where do decisions occur? → A: Review links to `/requests/:id`; approve and reject belong to BEN-45.
- Q: May this feature define the missing HTTP contract or a low-stock threshold? → A: No. Both remain owned outside this SPA feature.
- Q: Was the linked live Figma node verified? → A: No. Cursor's Figma integration continued to report `needsAuth` after reauthentication and session refresh, so the repository's 2026-09-15 re-export and drift report were used.
- Q: Does the pending table include a Status column? → A: Yes. Confirmed by the project owner after initial implementation; each row displays the canonical `Pending Approval` pill.
- Q: Which timezone does the submitted date display in? → A: `Asia/Manila`. Codev is Manila-based, and a UTC label reads a day early for anything submitted before 08:00 local — misleading in the column an Approver uses to judge how long a request has waited. Pinned rather than viewer-local so every Approver reads the same date whatever their machine is set to. Revisit if the system ever serves more than one timezone.
- Q: What does a row show when the source supplies an unusable submitted timestamp? → A: An em dash in that cell. Date formatting happens during render, so an unparseable value would otherwise escape the page's own failure state and surface as the shell's generic error — a worse outcome than one incomplete cell, and a regression against FR-012.

### Session 2026-09-24 — Amendment: this spec predates constitution 3.0.0

Raised by code review. Constitution I requires an instruction or a governing
change that contradicts a resolved clarification to be recorded here rather than
applied silently — and it applies just as much when the contradiction arrives
from *underneath*, as this one did.

**What happened.** This spec and its plan were written on 2026-09-22 against
constitution **2.0.0**. On 2026-09-24 the project owner adopted the 2026-09-22
design re-export as constitution **3.0.0**
([drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md)), and this
branch was rebased onto it. Two of that amendment's changes cut directly across
this feature:

| This spec says | Constitution 3.0.0 says |
|---|---|
| Three roles; the page is **Approver-only** (FR-002) and MUST NOT merge Approver and Supply Admin (FR-003) | Two roles. Approver and Supply Admin are **one Admin** ([ADR-0005](../../docs/adr/0005-two-role-model.md)) |
| In Processing counts `Approved`, **`For Release`**, **`Released`** (FR-006) | Those two statuses are retired in favour of **`For Delivery`** / **`For Pickup`** ([ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md)) |
| Fidelity is against the vendored **2026-09-15** re-export | The accepted baseline is the **2026-09-22** export; `design-system/` is two exports stale (spec 001 T000e) |

**Resolution — recorded, not repaired here.** FR-002, FR-003 and FR-006 are
**superseded** as written. They are left in place rather than rewritten, because
rewriting them would make this spec claim a compliance it does not have: the
code still reads `approver` and `For Release` / `Released` from
`src/features/auth/types.ts` and `src/shared/ui/status.ts`, which
`specs/001-office-supplies-mvp/tasks.md` **Phase 0** (T000–T000d) exists to
replace and which it declares blocking for all downstream work.

So this feature ships as a **pre-3.0.0 slice**, and Phase 0 owns its migration:

- **T000** collapses `Role`, which retires FR-002 and FR-003. The page becomes
  the Admin queue; `docs/process-flow.md` already titles it *Requests Queue* and
  subtitles it *"Review, approve, and fulfill supply requests"*.
- **T000c** replaces the status vocabulary, which retires FR-006. In Processing
  becomes `Approved` | `For Delivery` | `For Pickup` — the same idea (non-terminal,
  past approval) over the new names.
- **T000e** re-vendors `design-system/`, after which this feature's fidelity
  should be re-checked against the 2026-09-22 export rather than the 2026-09-15
  one.

**What this costs, said plainly.** Merging before Phase 0 means the repository
briefly carries one more file-set built on a retired model. The alternative —
holding this work until Phase 0 lands — was weighed and not taken, because the
queue is navigation-only, changes no status and no stock, and its migration is
a rename across two constants. The cost is recorded so that it is a decision and
not a surprise, which is the same standard
[drift-2026-09-22 §2](../../docs/design-system/drift-2026-09-22.md) sets for the
role merge itself.

`plan.md`'s Constitution Compliance table is corrected in the same change: its
principle II row named a principle that 3.0.0 deleted.

### Session 2026-09-24 — Amendment 2: realigned to constitution 3.0.0

Spec 001 Phase 0 (T000–T000d, T000f) merged to `dev` as PR #40, and this branch
was rebased onto it. The first 2026-09-24 amendment above recorded this spec as a
pre-3.0.0 slice whose migration Phase 0 owned. Once Phase 0 landed, the slice no
longer compiled — `DESTINATIONS.approvals` and the `For Release` / `Released`
statuses were gone — and at runtime the Admin's landing screen fell to the shell's
error boundary (*"This screen could not be shown"*). The migration is therefore
done here, not deferred.

- The page is the **Admin**'s **Requests Queue** at `/queue`. Title and subtitle
  come from `DESTINATIONS.queue`, which carries the design's copy verbatim.
  FR-001–FR-003 are rewritten in place; the struck text stays.
- **In Processing** counts `Approved`, `For Delivery` and `For Pickup` (FR-006).
- Feature code moves from `src/features/requests/approvals/` to
  `src/features/requests/queue/`, the path spec 001 T014 names for this screen,
  and drops the `Approval` prefix from its module and type names.
- The seeded fixtures use the new statuses; no requestor is the seeded Admin.

**Kept out of this spec, on purpose.** The 2026-09-22 export also gives the
queue filter chips (`All requests · Pending Approval · Approved · For Delivery
· For Pickup`), search, sort and pagination, and
`docs/linear-spa-pages-epic.md` re-scopes BEN-46 to include them. The vendored
`design-system/` still has only the 2026-09-12 queue, which draws none of them
(spec 001 T000e, deferred), so they cannot be built to a verifiable design yet.
They stay under Out of Scope here and wait for a spec amendment and a re-vendor.
Review still links to `/requests/:id`; the design's review side panel belongs
to BEN-47.

### Session 2026-09-24 — Amendment 3: the full list surface

Raised by the 2026-09-24 `.fig` re-export
([drift-2026-09-24](../../docs/design-system/drift-2026-09-24.md)). Amendment 2
kept chips, search, sort and pagination out because the vendored
`design-system/` did not draw them. That reason no longer holds.
`02 - Requests Queue` and its sort menu have **not changed** since the
2026-09-22 export, which the project owner accepted as the baseline. Drift §7
reads their geometry, copy and colours directly from the file, the same way the
09-22 drift was read. Re-vendoring (spec 001 T000e) is still deferred. It is no
longer what blocks these frames.

- Q: Does the table stay pending-only? → A: **No.** The queue frame lists mixed statuses with Review on every row, and its chips filter by the four live statuses. FR-008 is superseded; terminal requests belong to History (spec 001 FR-016a).
- Q: Do chip counts follow the search term? → A: **Yes.** A count is the number of rows that chip would show, so it counts the search matches. Otherwise selecting a chip labelled `(7)` could list two rows.
- Q: Which page sizes does Result per page offer? → A: 10, 25, 50 (default) and 100. The file draws only the 50 state. The other values are ours, and none of them changes what the default shows.
- Q: The review frames add a third card, *Low stock alerts*; the queue frame draws two. → A: Keep three (FR-004 unchanged); BEN-46 names it.
- Q: The file's search placeholder has a double space after "ID,". → A: Transcribed with one. It is a typo, not copy.
- Q: Does Review open the design's side panel? → A: Not yet. The panel is BEN-47's. Until it lands, Review keeps navigating to `/requests/:id` (FR-010). The row hands BEN-47 a single seam to replace.
- Q: Review navigates away, so the chip, search, sort and page reset when the Admin comes back from request detail (Story 1 scenario 4). Hold the query above the route? → A: **No — acceptable until BEN-47.** Its side panel opens over the queue, so the page no longer unmounts and the query survives a review. URL persistence stays out of scope.
- Q: The export adds a `Received` status and an Employee-signed completion. Do the chips or pills gain it? → A: **No.** It contradicts constitution 3.0.0 IV and ADR-0007 and waits for the project owner (drift §2). The queue keeps the four live statuses.

The `Pending Approval` section heading that came from the retired approver
screen is removed. The queue frame does not draw it. The retry-focus target
moves to the filter chips' group, which is the first control of the content
that appears.

### Session 2026-09-24 — Amendment 4: `Ready for Pickup` and the drawn pill colours

Decided by the project owner ([drift-2026-09-24 §6](../../docs/design-system/drift-2026-09-24.md);
constitution 3.0.1; ADR-0007 amendment).

- Q: The queue frame's chip says `For Pickup`, while its pills and the `Request Status` component say `Ready for Pickup`. → A: **`Ready for Pickup`**, chip included. Ignore the chip's label.
- Q: Handover pills: ADR-0007's green, or the drawn colours? → A: **Drawn.** `For Delivery` is pink and `Ready for Pickup` is blue.

The live requirements, acceptance scenarios and Out of Scope list above are
reworded in place (FR-006, FR-008, User Story 1 scenario 5). Earlier amendments
in this spec keep the name `For Pickup`, as they used it at the time.

## Validation

- Completeness: PASS
- Clarity: PASS
- Consistency: PASS
- Measurability: PASS
- Coverage: PASS
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
