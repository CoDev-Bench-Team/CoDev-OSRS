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
| D2 | Remove **`employee` only** from the `requestDetail` destination. The Admin keeps `/requests/:id` until BEN-47. | PR #36 (BEN-46) links queue rows to `/requests/:id`. Removing the route outright would break it. |
| D3 | No constitution change on this branch. | Constitution 3.0.0 IV (BEN-113, on `dev`) already requires a reason from whoever cancels. *(Was: amend within PR #33's 3.0.0 — superseded 2026-09-24.)* |
| D4 | The panel's open state lives **in component state**, not the address. | The ticket: "opens from View details and closes without navigating". Consistent with D2. |
| D5 | Each drawn timeline node maps to states (table below). | The nodes are the state machine, but the third one stands for two peer states. |
| D6 | The reason is `trim()`med first, so whitespace counts as empty. | Acceptance criterion 3, made safe against whitespace. |

### Timeline mapping (D5)

| Drawn node | Reached when status is… | Time |
|------------|-------------------------|------|
| Submitted | always | `submittedAt` |
| Approved | `Approved`, `For Delivery`, `Ready for Pickup`, `Completed` | `approvedAt` |
| Handover (*For Delivery* or *Ready for Pickup*, the state taken; the drawn *For Delivery/For Pickup* before then) | `For Delivery`, `Ready for Pickup`, `Completed` | `handedOverAt` |
| Complete | `Completed` | `completedAt` |

`Cancelled` collapses to **Submitted → Cancelled** in slate, as `04.2 - Cancelled` draws it. `Rejected` takes the same shape in red; it isn't drawn, so it is logged in `docs/design-system/additions.md` §3e.

## Data Model

Feature-local read model, not a backend contract:

- `RequestLine`: `name` (for the list summary), `description` (for the panel), `qty`.
- `EmployeeRequest`: `id`, `submittedAt`, `lines`, optional `noteToApprover`, `status`, optional `handover` (`For Delivery` \| `Ready for Pickup`, kept once completed), optional `approvedAt` / `handedOverAt` / `completedAt`, optional `rejection: { reason, at }` and `cancellation: { reason, at }`.
- `CancelResult`: `{ ok: true, request }` or `{ ok: false, refusal: 'status-changed' | 'reason-required' | 'unavailable' }`.
- `EmployeeRequestSource`: `list(user)` returns only that Employee's requests; `cancel(user, id, reason)`.

## API Contracts

The backend contract is linked from `specs/001-office-supplies-mvp/contracts/README.md`, but this feature adds no HTTP call, endpoint, payload, response field or error mapping. `EmployeeRequestSource` is an internal UI seam, not a proposed REST contract. The backend's cancel endpoint is not named yet; that belongs to the API integration ticket.

## Component / Module Breakdown

**Shared UI** (drawn in Figma, so not additions). Each is exported from `src/shared/ui/index.ts` and has a gallery row.

- `overlay/SidePanel.tsx`: a right-hand sheet over the existing `Backdrop` scrim, with a header slot and ✕. Closes on Esc and scrim click; traps focus and returns it on close.
- `data-display/StatusTimeline.tsx`: the Figma `Status Timeline`. Nodes are reached, pending, cancelled (slate) or rejected (red), each with a time.
- `forms/TextField.tsx`: a labelled one-row textarea — a long reason wraps; Enter submits, Shift+Enter breaks the line — with a required asterisk, placeholder, and invalid state announced through `aria-describedby`. `tone="danger"` is the cancel form's drawn pink block (redrawn 2026-09-25); the default `neutral` tone is a plain card, so a later non-destructive field does not inherit it.

**Feature**

- `src/features/requests/detail/request-detail-types.ts`: the read model and source interface above.
- `src/features/requests/detail/employee-request-source.ts`: picks the page's source — the seeded one today, a contract-backed one later. On the dev server only, `?requests=loading|empty|failing|blank-items|changes|refresh-fails|changes-reload-fails` wraps it in `dev/request-stub.ts`, which reaches the list's loading, empty and failure states (FR-011) and the refused-cancel (FR-008) and failed-reload paths the seed cannot. `import.meta.env.DEV` drops both from a production build.
- `src/features/requests/detail/seeded-employee-request-source.ts`: Maya's six requests from `04 - My Requests` (1847 Pending Approval, 1805 Approved, 1842 Ready for Pickup, 1838 For Delivery, 1760 Rejected, 1733 Completed), with items and note from `04.1`. The Rejected row carries a placeholder reason, since the frame draws none. `cancel` refuses anything outside the signed-in Employee's own requests, and anything not `Pending Approval`. Stock restore is the backend's job, and the file says so.
- `src/features/requests/detail/request-timeline.ts`: a pure mapping from request to timeline nodes (D5).
- `src/features/requests/detail/RequestDetailPanel.tsx`: header and pill, Items Requested, Note to Approver, the stop reason (*Reason for cancellation* / *Reason for rejection*) in the same card style, Status timeline, and the cancel form. No confirm-receipt control.
- `src/features/requests/history/MyRequestsPage.tsx`: the D1 stand-in. `PageHeader`, the five drawn columns, loading/empty/failure states, and the open panel.
- `src/features/requests/format.ts`: date formatting, `NO_VALUE`, and the item summary ("Laptop, Keyboard + 1 more"). Since #36 merged, `summarizeItems(names, shown)` is the one helper for both screens: My Requests passes 2 and the Requests Queue 3, as each frame draws (`shown` is typed `2 | 3`). `formatDate` is shared the same way: the queue's SUBMITTED label uses it. It drops blank names and shows `NO_VALUE` for an empty list, the guard the queue's copy had.

**App**

- `src/app/routes.tsx`: `/requests` renders `MyRequestsPage`.
- `src/app/destinations.ts`: `requestDetail.roles` becomes `['admin']` (D2).
- `src/app/seeded-request-ids.ts`: the Employee ownership branch no longer applies to the route; `mayViewRequest` stays for the other roles.

## UI and State Flow

1. The shell admits only an Employee to `/requests` as My Requests.
2. The page loads the Employee's requests through `EmployeeRequestSource.list`.
3. *View details* sets the open id in component state; the panel renders that request.
4. Cancel Request opens the inline form. Confirm trims the reason; if empty, the form goes invalid and nothing is sent.
5. Otherwise the page calls `source.cancel` with the trimmed reason, then reloads the list whether it succeeded or not, so both the panel and the row show the current status. If that reload fails, the page keeps the list it had — with the cancelled request in it when the cancel worked — so the panel stays open rather than being swapped for the failure notice. A `status-changed` refusal whose reload fails is reported as `unavailable`, because the panel cannot show the current status that refusal's copy promises.
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
- The spec 003 amendment of 2026-09-23, on this branch.
- Constitution 3.0.0, spec 001 and ADR-0005/0007 on `dev` (BEN-113), and the two-role shell (BEN-114, PR #40).
- BEN-44 replaces the stand-in list; BEN-47 owns the Admin panel and completion.

## Verification

- `npm run dev`, then `npm run verify`: typecheck, lint, utilities/adherence, fidelity, pixels, a11y and responsive, shell, request detail, and build. Needs Node ≥ 22, because `scripts/cdp.mjs` uses the global `WebSocket`.
- `scripts/check-shell.mjs`: an Employee on `/requests/:id` gets the role refusal for owned, unowned and missing ids; the Admin's deep link is unchanged.
- `scripts/check-request-detail.mjs` proves the list's loading, empty and failure states (FR-011) through `?requests=loading|empty|failing`; the shared item summary's blank-name guard through `?requests=blank-items`; Story 2 AC5 (FR-008) through `?requests=changes`; that a cancel survives a failed reload through `?requests=refresh-fails`; and that a refusal whose reload fails does not claim a current status through `?requests=changes-reload-fails`. It also proves the five acceptance criteria: open and close without navigating; Cancel Request only on Pending Approval; empty and whitespace reasons refused; a valid reason gives Cancelled in the panel pill, timeline and row pill, and is read back; only the Rejected row shows a rejection reason; no receipt control in any of the six seeded states.
- Manual: sign in as Maya and compare with Figma `04.1`, `04.2` and Cancelled at 1440px. Sign in as the Admin and confirm `/requests/REQ-2026-1847` still renders.

No unit-test runner exists in this repository, so this feature adds no framework. The timeline mapping is a pure function, ready for unit coverage later.

## Requirement Coverage

- FR-001, FR-002: `SidePanel` and component state in `MyRequestsPage`.
- FR-003, FR-003a, FR-004: `RequestDetailPanel` and `request-timeline.ts`.
- FR-005 to FR-008: the cancel form in `RequestDetailPanel` and the seeded source's `cancel`.
- FR-009: no such control exists; checked by `check-request-detail.mjs`.
- FR-010: `destinations.ts`; checked by `check-shell.mjs`.
- FR-011: `MyRequestsPage` load states.
- FR-012: adherence lint.
- FR-013, FR-014: the source seam; no HTTP, no inventory.

All 15 requirements are covered.

## Constitution Compliance

| Principle | Status | Reason |
|---|---|---|
| I. Spec-Driven Development | PASS | Specs 001 and 003 were amended before code; this spec records the feature. |
| II. Three Distinct Human Roles | PASS | The panel is Employee-only; the other roles keep their address. |
| III. Inventory Integrity | PASS | No inventory is modelled; restore is the API's. |
| IV. Explicit Request State Machine | PASS | Only `Pending Approval` → `Cancelled`, with a reason (constitution 3.0.0 IV). |
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

### Removing the Employee's route breaks Admin links

- **Early warning**: BEN-46's Review links land on a refusal.
- **Mitigation**: D2 removes only `employee`; `check-shell.mjs` covers the Admin deep link.

## Known Risks

- The stop-reason card is not drawn in Figma. It reuses the Note to Approver card and is flagged to the designer.
- E6 (BEN-71) says "PR base `main`". PR #38 targets `dev`, like every other P2 page PR (#35, #36, #37).
