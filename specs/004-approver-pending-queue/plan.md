# Implementation Plan: Approver Pending Queue

**Date**: 2026-09-22  
**Spec**: `specs/004-approver-pending-queue/spec.md`  
**Status**: Draft

## Summary

Replace the `/approvals` shell placeholder with an Approver-only queue composed from the existing design-system components. Until the backend contract is published, one typed feature-local source supplies demonstrable queue data; the page derives request metrics and pending rows without defining HTTP behavior or inventory thresholds.

## Technical Context

**Stack**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4  
**Primary Dependencies**: Existing React Router and shared OSRS UI exports; no new package  
**Storage**: None in the SPA; temporary in-memory fixture data  
**Target Layer**: Frontend SPA  
**Performance Goals**: Derive metrics and rows in one linear pass over the small internal queue; no additional network behavior  
**Constraints**: Approver-only; exactly three roles remain distinct; no request transitions; no invented REST contract or low-stock threshold; feature ownership stays under `src/features/requests/approvals/*` with a minimal route swap

## Data Model

Feature-local view data, not a backend contract:

- `ApprovalQueueRequest`: request id, requestor name, optional organizational context, item names, submitted timestamp, and canonical request status.
- `ApprovalQueueSnapshot`: requests plus a source-provided low-stock alert count.
- `ApprovalQueueViewModel`: three summary metrics and rows filtered to `Pending Approval`.
- `ApprovalQueueSource`: asynchronous read boundary returning one snapshot.

The temporary source owns fixture values. The view model may count canonical request statuses but must not classify inventory or define a low-stock threshold.

## API Contracts

The backend contract remains unpublished at `specs/001-office-supplies-mvp/contracts/README.md`. This feature adds no HTTP call, endpoint, payload, response field, or error mapping.

`ApprovalQueueSource` is an internal UI seam, not a proposed REST contract. It can be replaced only after the backend-published contract defines the real data.

## Component / Module Breakdown

- `src/features/requests/approvals/approval-queue-types.ts` — feature-local request, snapshot, source, and view-model types.
- `src/features/requests/approvals/approval-queue-model.ts` — pure derivation of pending, in-processing, and pending-row projections.
- `src/features/requests/approvals/seeded-approval-queue-source.ts` — explicit temporary fixture source; supplies low-stock count rather than a threshold.
- `src/features/requests/approvals/ApprovalsQueuePage.tsx` — loading, failure, empty, summaries, responsive table, and Review links.
- `src/app/routes.tsx` — import the real page and replace only the `ApprovalsPlaceholder` route element.

Shared components remain unchanged. Approve, reject, and request-detail behavior remain owned by BEN-45.

## UI and State Flow

1. The existing shell and route guard admit only an Approver to `/approvals`.
2. The page loads one snapshot through `ApprovalQueueSource`.
3. A pure projection filters pending rows and derives Pending approval and In Processing counts; Low stock alerts is copied from the source.
4. Loading, failure, and successful empty states remain distinguishable.
5. Review is a router link to `/requests/:id`; the queue performs no mutation.
6. The table uses a contained horizontal overflow region at narrow widths so the application page itself does not overflow.

## Project Structure

```text
specs/004-approver-pending-queue/
├── spec.md
├── plan.md
└── tasks.md

src/features/requests/approvals/
├── ApprovalsQueuePage.tsx
├── approval-queue-model.ts
├── approval-queue-types.ts
└── seeded-approval-queue-source.ts
```

## Dependencies

- BEN-38 / A6 shell dependency is complete.
- Existing `/approvals` destination and Approver guard.
- Existing shared `PageHeader`, `SummaryCard`, `TableCard`, `TableHead`, feedback, and action components.
- BEN-45 owns the request-detail screen reached by Review and may still render its placeholder independently.
- A published backend contract is not required for this fixture-backed read-only slice.

## Verification

- `npm run lint`
- `npm run build`
- `npm run verify`
- Inspect at Approver `/approvals` for populated and empty fixture projections.
- Confirm Employee and Supply Admin direct access remains refused by the existing route guard.
- Confirm Review changes only the location to `/requests/:id`.
- Confirm no page-level horizontal overflow from 360px through 1440px.

No unit-test runner exists in this repository, so this feature will not add a new framework. Pure projection logic is isolated for later unit coverage, and current repository checks provide static verification.

## Requirement Coverage

- FR-001–FR-003: Existing destination and guard plus the Approver-only route replacement.
- FR-004–FR-008: Snapshot model and pure projection.
- FR-009–FR-010: Queue table and Review links.
- FR-011: Navigation-only component boundary.
- FR-012–FR-013: Explicit async page states and reload path.
- FR-014–FR-016: Shared controls/tokens and contained responsive table.
- FR-017–FR-018: Internal source seam with no HTTP or threshold logic.

All 18 requirements are covered.

## Constitution Compliance

| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven Development | PASS | `spec.md` is finalized before plan, tasks, and code. |
| II. Three Distinct Human Roles | PASS | The page is Approver-only and adds no combined Admin. |
| III. Inventory Integrity | PASS | Read-only metrics perform no inventory mutation or threshold classification. |
| IV. Explicit Request State Machine | PASS | The queue filters status and performs no transition. |
| V. Notification Completeness | PASS | No transition or notification is implemented. |
| VI. Independently Testable Increments | PASS | The queue can be demonstrated with the typed temporary source. |
| VII. Typed Contracts | PASS | Internal view types are not represented as backend JSON; no REST contract is invented. |
| VIII. MVP Restraint | PASS | No new framework, package, mutation, search, filter, pagination, or sorting. |
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

- **Early warning**: Approve/reject handlers, dialogs, or status writes appear under `approvals/`.
- **Mitigation**: Review is a link only; BEN-45 remains the sole owner of decision actions.

## Known Risks

All identified plan risks are mitigated. The remaining accepted limitation is that the live Figma node could not be read in this agent session; implementation fidelity is based on the vendored 2026-09-15 re-export.

## Strengthened Position

The queue is a small, typed, read-only page slice: existing shell authorization controls entry, one replaceable local source controls demo data, one pure projection controls metrics and rows, and request-detail navigation is the only action.
