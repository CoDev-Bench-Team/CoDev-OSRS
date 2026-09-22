# Feature Specification: Approver Pending Queue

**Feature Branch**: `emmanuelr/ben-46-p2spa-approver-pending-queue`  
**Created**: 2026-09-22  
**Status**: Draft  
**Sources**: BEN-46, BEN-72, `specs/001-office-supplies-mvp/spec.md`, `specs/003-app-shell-routing/spec.md`, vendored Figma re-export dated 2026-09-15

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

1. **Given** pending requests exist, **When** the queue renders, **Then** each row shows request id, requestor identity and organizational context, item summary, submitted date, and a Review action.
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

- **FR-001**: The page MUST be the Approver landing destination at `/approvals`.
- **FR-002**: The page MUST remain accessible only to users whose single role is Approver.
- **FR-003**: The page MUST NOT merge Approver and Supply Admin capabilities or identity.
- **FR-004**: The page MUST show three read-only summary cards labelled Pending approval, In Processing, and Low stock alerts.
- **FR-005**: Pending approval MUST count requests whose current status is `Pending Approval`.
- **FR-006**: In Processing MUST count non-terminal requests that have passed approval: `Approved`, `For Release`, and `Released`.
- **FR-007**: Low stock alerts MUST count inventory items classified as low stock by the system's data source; the SPA MUST NOT invent a threshold.
- **FR-008**: The pending table MUST contain only requests currently in `Pending Approval`.
- **FR-009**: Each pending row MUST show request id, requestor name, requestor organizational context when available, an item summary, submitted date, and Review.
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

## Validation

- Completeness: PASS
- Clarity: PASS
- Consistency: PASS
- Measurability: PASS
- Coverage: PASS
- Edge cases: PASS

No checklist overrides and no unresolved critical ambiguities.
