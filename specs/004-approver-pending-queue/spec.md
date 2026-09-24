# Feature Specification: Approver Pending Queue

**Feature Branch**: `emmanuelr/ben-46-p2spa-approver-pending-queue`  
**Created**: 2026-09-22  
**Status**: Draft  
**Sources**: BEN-46, BEN-72, `specs/001-office-supplies-mvp/spec.md`, `specs/003-app-shell-routing/spec.md`, vendored Figma re-export dated 2026-09-15 — **superseded**; see the 2026-09-24 amendment below

## Overview

Give an Approver a focused landing page that summarizes request workload and lists every request awaiting an approval decision. Each row leads to the existing request-detail destination where review actions belong.

This feature specializes the merged Admin queue from the design source for the Approver role. It does not grant Supply Admin access or implement approval and rejection actions.

## User Stories

### Story 1 — See approval workload at a glance (Priority: P1)

An Approver opens their landing page and sees current workload totals before reviewing individual requests.

**Why this priority**: The queue is the Approver's primary work surface and must immediately communicate whether action is required.

**Acceptance Criteria**:

1. **Given** an Approver with pending requests, **When** they open `/approvals`, **Then** they see summary cards for Pending approval, In Processing, and Low stock alerts.
2. **Given** the summary and queue are based on the same current state, **When** the page renders, **Then** the Pending approval total equals the number of requests eligible for review.
3. **Given** inventory items have been classified as low stock by the system's data source, **When** the page renders, **Then** Low stock alerts shows that count without defining a new low-stock threshold in the SPA.

### Story 2 — Find and open a pending request (Priority: P1)

An Approver scans pending requests, identifies the requestor and requested items, and opens a request for review.

**Why this priority**: Moving from the queue to request detail is the feature's core task.

**Acceptance Criteria**:

1. **Given** pending requests exist, **When** the queue renders, **Then** each row shows request id, requestor identity and organizational context, item summary, submitted date, a `Pending Approval` status pill, and a Review action.
2. **Given** a pending request row, **When** the Approver activates Review, **Then** the application navigates to `/requests/:id` for that request.
3. **Given** requests in statuses other than `Pending Approval`, **When** the pending table renders, **Then** those requests do not appear as reviewable rows.
4. **Given** the Approver returns from request detail after a decision changed the request status, **When** current data is shown, **Then** the decided request is no longer in the pending table and the summary reflects the current workload.

### Story 3 — Understand non-success states (Priority: P1)

An Approver receives a clear, usable page while data is loading, when no requests are pending, or when current data cannot be shown.

**Why this priority**: An empty queue is a normal outcome; failures and waiting must not look like an empty workload.

**Acceptance Criteria**:

1. **Given** queue data is still being determined, **When** the page renders, **Then** a deliberate loading state appears without stale request rows.
2. **Given** no requests are pending, **When** loading succeeds, **Then** the page states that there are no requests awaiting approval while preserving the workload summary.
3. **Given** queue data cannot be loaded, **When** the failure is shown, **Then** the page distinguishes the failure from an empty queue and offers a retry when retry is supported.

### Story 4 — Use the queue safely across supported devices (Priority: P2)

An Approver can review the queue with keyboard controls and at every width supported by the application shell.

**Why this priority**: The queue must preserve the shell's accessibility and responsive commitments.

**Acceptance Criteria**:

1. **Given** keyboard-only use, **When** focus moves through Review actions, **Then** every action has a visible focus indicator and can be activated.
2. **Given** a viewport from 360px through 1440px, **When** the queue renders, **Then** content remains reachable without causing page-level horizontal overflow.
3. **Given** the 1440px design viewport, **When** the page renders, **Then** its hierarchy matches the source: page header, three summary cards, Pending Approval section, and request table.

## Edge Cases

- A request changes status between loading the queue and opening detail: detail remains the authority and offers only actions legal for its current status.
- Duplicate request identifiers from a malformed source do not produce duplicate interactive row identities.
- Long requestor names and item summaries remain readable without overlapping adjacent columns or controls.
- A request with many items uses a concise item summary rather than expanding the row indefinitely.
- A metric may be available while pending rows are empty; each value reflects its own defined population.
- A non-Approver opening `/approvals` continues to receive the shell's existing access refusal.

## Functional Requirements

> Three requirements below are struck through and marked **SUPERSEDED**: they were
> written against constitution 2.0.0 and no longer hold under 3.0.0. They are
> kept rather than deleted so the amendment has something to point at. The
> record, and which Phase 0 task owns each migration, is the
> [2026-09-24 amendment](#session-2026-09-24--amendment-this-spec-predates-constitution-300).

- **FR-001**: The page MUST be the Approver landing destination at `/approvals`.
- **FR-002**: ~~The page MUST remain accessible only to users whose single role is Approver.~~ **SUPERSEDED** by constitution 3.0.0 — the role is **Admin**; see the 2026-09-24 amendment. Owned by spec 001 T000.
- **FR-003**: ~~The page MUST NOT merge Approver and Supply Admin capabilities or identity.~~ **SUPERSEDED** by constitution 3.0.0 — the two roles *are* merged ([ADR-0005](../../docs/adr/0005-two-role-model.md)); see the 2026-09-24 amendment. Owned by spec 001 T000.
- **FR-004**: The page MUST show three read-only summary cards labelled Pending approval, In Processing, and Low stock alerts.
- **FR-005**: Pending approval MUST count requests whose current status is `Pending Approval`.
- **FR-006**: In Processing MUST count non-terminal requests that have passed approval: `Approved`, ~~`For Release`, and `Released`~~ — those two statuses are **SUPERSEDED** by constitution 3.0.0 in favour of `For Delivery` / `For Pickup` ([ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md)); see the 2026-09-24 amendment. Owned by spec 001 T000c.
- **FR-007**: Low stock alerts MUST count inventory items classified as low stock by the system's data source; the SPA MUST NOT invent a threshold.
- **FR-008**: The pending table MUST contain only requests currently in `Pending Approval`.
- **FR-009**: Each pending row MUST show request id, requestor name, requestor organizational context when available, an item summary, submitted date, a `Pending Approval` status pill, and Review.
- **FR-010**: Review MUST navigate to the stable request-detail destination for that request.
- **FR-011**: The queue MUST NOT approve, reject, cancel, prepare, release, or complete a request.
- **FR-012**: The page MUST show distinct loading, empty, and failure states.
- **FR-013**: A successful refresh after a request leaves `Pending Approval` MUST remove it from the table and update affected metrics.
- **FR-014**: Interactive controls MUST be keyboard operable and show a visible focus indicator.
- **FR-015**: The page MUST remain usable from 360px through 1440px without page-level horizontal overflow.
- **FR-016**: The page MUST use the established design vocabulary and shared shell rather than introduce a second Approver layout.
- **FR-017**: The SPA MUST NOT invent REST routes, payloads, response fields, error codes, or low-stock thresholds.
- **FR-018**: Until the backend contract is published, demonstrable queue data MAY come from a typed temporary source that preserves these product semantics.

## Key Entities

- **Approval queue**: The current set of requests awaiting an Approver decision.
- **Queue row**: A concise projection of one pending request for navigation to detail.
- **Workload metric**: A read-only count for pending approval, in-processing requests, or low-stock items.

## Out of Scope

- Approve and reject mutations, including rejection-reason entry
- Request-detail content and status actions
- Supply Admin fulfillment and inventory-management actions
- Employee request history
- Defining or publishing a REST contract
- Defining the low-stock threshold
- Pagination, search, filtering, and unverified sort-menu behavior
- Email notification behavior

## Success Criteria

- **SC-001**: An Approver can open `/approvals`, identify every request awaiting review, and reach any listed request detail in one action.
- **SC-002**: Pending approval equals the number of reviewable rows for every demonstrated data set.
- **SC-003**: Employee and Supply Admin users cannot access the page through navigation or direct address.
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

## Validation

- Completeness: PASS
- Clarity: PASS
- Consistency: PASS
- Measurability: PASS
- Coverage: PASS
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
