# Implementation Plan: Employee Request Panel + Cancel

**Date**: 2026-09-23  
**Spec**: `specs/007-employee-request-panel/spec.md`  
**Status**: Draft

## Summary

Replace the `/requests` placeholder with a minimal My Requests table, and open a side panel from its *View details*. The panel reads a request back and cancels a `Pending Approval` one with a required reason. A typed, seeded, in-memory source sits behind an interface, as BEN-46's approval queue does. When the backend contract publishes, a real source replaces the seeded one and nothing above it changes.

## Technical Context

**Stack**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4  
**Primary Dependencies**: Existing React Router and shared OSRS UI exports; no new package  
**Storage**: None in the SPA; a mutable in-memory seed that resets on reload  
**Target Layer**: Frontend SPA  
**Constraints**: Employee-only panel; no confirm-receipt control; no invented REST contract; no inventory modelling; feature code under `src/features/requests/detail/*`, with the stand-in list under `src/features/requests/history/*` for BEN-44 to replace

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | Ship a **minimal seeded My Requests table** with *View details*. It replaces `RequestsPlaceholder` and is marked as a stand-in for BEN-44. | BEN-44 isn't on `dev`, and the panel needs something to open it. |
| D2 | Remove **`employee` only** from the `requestDetail` destination. Approver and Supply Admin keep `/requests/:id` until BEN-47. | PR #36 (BEN-46) links Approver rows to `/requests/:id`. Removing the route outright would break it. |
| D3 | The constitution change goes into **PR #33's 3.0.0**, not a separate version bump. | Linear cites "constitution 3.0.0 IV". Two different 3.0.0s would conflict whichever PR merges second. |
| D4 | The panel's open state lives **in component state**, not the address. | The ticket: "opens from View details and closes without navigating". Consistent with D2. |
| D5 | Each drawn timeline node maps to states (table below). | The design's labels aren't state names, and `For Release` has no node. |
| D6 | The reason is `trim()`med first, so whitespace counts as empty. | Acceptance criterion 3, made safe against whitespace. |

### Timeline mapping (D5)

| Drawn node | Reached when status is… | Time |
|------------|-------------------------|------|
| Submitted | always | `submittedAt` |
| Approved | `Approved`, `For Release`, `Released`, `Completed` | `approvedAt` |
| Handover (*Ready for Pickup* / *For Delivery*; *For Delivery/For Pickup* while unknown) | `Released`, `Completed` (`For Release` leaves it pending) | `releasedAt` |
| Complete | `Completed` | `completedAt` |

`Cancelled` collapses to **Submitted → Cancelled** in slate, as `04.2 - Cancelled` draws it. `Rejected` takes the same shape in red; it isn't drawn, so it is logged in `docs/design-system/additions.md` §3e.

## Data Model

Feature-local read model, not a backend contract:

- `RequestLine`: `name` (for the list summary), `description` (for the panel), `qty`.
- `EmployeeRequest`: `id`, `submittedAt`, `lines`, optional `noteToApprover`, `status`, optional `handover`, optional `approvedAt` / `releasedAt` / `completedAt` / `rejectedAt`, optional `cancellation: { reason, at }`.
- `CancelResult`: `{ ok: true, request }` or `{ ok: false, refusal: 'status-changed' | 'reason-required' | 'unavailable' }`.
- `EmployeeRequestSource`: `list(user)` returns only that Employee's requests; `cancel(user, id, reason)`.

## API Contracts

The backend contract is linked from `specs/001-office-supplies-mvp/contracts/README.md`, but this feature adds no HTTP call, endpoint, payload, response field or error mapping. `EmployeeRequestSource` is an internal UI seam, not a proposed REST contract. The backend's cancel endpoint is not named yet; that belongs to the API integration ticket.

## Component / Module Breakdown

**Shared UI** (drawn in Figma, so not additions). Each is exported from `src/shared/ui/index.ts` and has a gallery row.

- `overlay/SidePanel.tsx`: a right-hand sheet over the existing `Backdrop` scrim, with a header slot and ✕. Closes on Esc and scrim click; traps focus and returns it on close.
- `data-display/StatusTimeline.tsx`: the Figma `Status Timeline`. Nodes are reached, pending, cancelled (slate) or rejected (red), each with a time.
- `forms/TextField.tsx`: the labelled input from the cancel form, with a required asterisk, placeholder, and invalid state announced through `aria-describedby`.

**Feature**

- `src/features/requests/detail/request-detail-types.ts`: the read model and source interface above.
- `src/features/requests/detail/seeded-employee-request-source.ts`: Maya's six requests from `04 - My Requests` (1847 Pending Approval, 1805 Approved, 1842 Ready for Pickup, 1838 For Delivery, 1760 Rejected, 1733 Completed), with items and note from `04.1`. `cancel` refuses anything not `Pending Approval`. Stock restore is the backend's job, and the file says so.
- `src/features/requests/detail/request-timeline.ts`: a pure mapping from request to timeline nodes (D5).
- `src/features/requests/detail/RequestDetailPanel.tsx`: header and pill, Items Requested, Note to Approver, Status timeline, and the cancel form. No confirm-receipt control.
- `src/features/requests/history/MyRequestsPage.tsx`: the D1 stand-in. `PageHeader`, the five drawn columns, loading/empty/failure states, and the open panel.
- `src/features/requests/format.ts`: date formatting and the item summary ("Laptop, Keyboard + 1 more"). The summary copies BEN-46's helper; dedupe once #36 merges.

**App**

- `src/app/routes.tsx`: `/requests` renders `MyRequestsPage`.
- `src/app/destinations.ts`: `requestDetail.roles` becomes `['approver', 'supply_admin']` (D2).
- `src/app/seeded-request-ids.ts`: the Employee ownership branch no longer applies to the route; `mayViewRequest` stays for the other roles.

## UI and State Flow

1. The shell admits only an Employee to `/requests` as My Requests.
2. The page loads the Employee's requests through `EmployeeRequestSource.list`.
3. *View details* sets the open id in component state; the panel renders that request.
4. Cancel Request opens the inline form. Confirm trims the reason; if empty, the form goes invalid and nothing is sent.
5. Otherwise the page calls `source.cancel`, then reloads the list whether it succeeded or not, so both the panel and the row show the current status.
6. A refusal shows an inline note above the items.

## Project Structure

```text
specs/007-employee-request-panel/
├── spec.md
├── plan.md
└── tasks.md

src/features/requests/
├── format.ts
├── detail/
│   ├── RequestDetailPanel.tsx
│   ├── request-detail-types.ts
│   ├── request-timeline.ts
│   └── seeded-employee-request-source.ts
└── history/
    └── MyRequestsPage.tsx          # stand-in; BEN-44 replaces it

src/shared/ui/
├── overlay/SidePanel.tsx
├── data-display/StatusTimeline.tsx
└── forms/TextField.tsx

scripts/check-request-detail.mjs
```

## Dependencies

- BEN-38 / A6 shell (merged).
- Spec 001 and spec 003 amendments of 2026-09-23 and ADR-0007, on this branch.
- Constitution 3.0.0 IV amendment, on PR #33 (D3).
- BEN-44 replaces the stand-in list; BEN-47 owns the Admin panel and completion.

## Verification

- `npm run dev`, then `npm run verify`: typecheck, lint, utilities/adherence, fidelity, pixels, a11y and responsive, shell, request detail, and build. Needs Node ≥ 22, because `scripts/cdp.mjs` uses the global `WebSocket`.
- `scripts/check-shell.mjs`: an Employee on `/requests/:id` gets the role refusal for owned, unowned and missing ids; Approver deep links are unchanged.
- `scripts/check-request-detail.mjs` proves the five acceptance criteria: open and close without navigating; Cancel Request only on Pending Approval; empty and whitespace reasons refused; a valid reason gives Cancelled in the panel pill, timeline and row pill; no receipt control in any of the six seeded states.
- Manual: sign in as Maya and compare with Figma `04.1`, `04.2` and Cancelled at 1440px. Sign in as the Approver and confirm `/requests/REQ-2026-1847` still renders.

No unit-test runner exists in this repository, so this feature adds no framework. The timeline mapping is a pure function, ready for unit coverage later.

## Requirement Coverage

- FR-001, FR-002: `SidePanel` and component state in `MyRequestsPage`.
- FR-003, FR-004: `RequestDetailPanel` and `request-timeline.ts`.
- FR-005 to FR-008: the cancel form in `RequestDetailPanel` and the seeded source's `cancel`.
- FR-009: no such control exists; checked by `check-request-detail.mjs`.
- FR-010: `destinations.ts`; checked by `check-shell.mjs`.
- FR-011: `MyRequestsPage` load states.
- FR-012: adherence lint.
- FR-013, FR-014: the source seam; no HTTP, no inventory.

All 14 requirements are covered.

## Constitution Compliance

| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven Development | PASS | Specs 001 and 003 were amended before code; this spec records the feature. |
| II. Three Distinct Human Roles | PASS | The panel is Employee-only; the other roles keep their address. |
| III. Inventory Integrity | PASS | No inventory is modelled; restore is the API's. |
| IV. Explicit Request State Machine | PASS | Only `Pending Approval` → `Cancelled`, with a reason (3.0.0 IV as amended on PR #33). |
| V. Notification Completeness | PASS | The API emits Request Cancelled; the SPA sends nothing. |
| VI. Independently Testable Increments | PASS | Demonstrable with the seeded source and the stand-in list. |
| VII. Typed Contracts | PASS | Internal read model only; no invented REST shape. |
| VIII. MVP Restraint | PASS | No new package; the three components are drawn in Figma. |
| IX. Secrets and Internal Data | PASS | Seed data is non-production and has no credentials. |

## Red-Team Analysis

### The stand-in list outlives BEN-44

- **Early warning**: BEN-44 builds a second My Requests page instead of replacing this one.
- **Mitigation**: The stand-in sits in BEN-44's own folder, says it is a stand-in in its header comment, and is logged in `additions.md`.

### The seed drifts into an accidental contract

- **Early warning**: HTTP-shaped names or status codes appear in the source types.
- **Mitigation**: The types are named as a read model, and the source's comments say a real source maps the API into them.

### Removing the Employee's route breaks Approver links

- **Early warning**: BEN-46's Review links land on a refusal.
- **Mitigation**: D2 removes only `employee`; `check-shell.mjs` covers the Approver deep link.

## Known Risks

- Constitution 3.0.0 IV lands with PR #33. If #38 merges first, `dev` briefly says the owner's reason is optional while the code requires it. The spec 001 amendment already on this branch is the tie-breaker.
- The cancellation reason is stored but not shown on a cancelled request, pending the designer.
