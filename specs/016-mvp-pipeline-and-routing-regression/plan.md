# Implementation Plan: MVP pipeline and routing regression

**Date**: 2026-10-02
**Spec**: specs/spec.md
**Status**: Draft

## Summary

Playwright drives the signed-in screens of the Vite SPA and checks the demo path, the reject and cancel paths, and direct-address refusals. The SPA does not call the published API yet: catalog stock, the unit register, My Requests, and the Admin queue are separate in-memory stores, so a submit the Employee makes never appears in the queue and never moves Reserved. Before the suite can observe the spec, those existing source boundaries share one demo register for the life of a page. The suite does not add a route, a payload, or an inbox.

## Technical Context

**Stack**: React 19, TypeScript, Vite 8, React Router 7, Playwright (`@playwright/test`)
**Primary Dependencies**: `@playwright/test` (dev). The app dependencies stay as they are.
**Storage**: The existing module-level demo register in the browser. A reload starts it over, which is how each test gets a clean run. No database and no new server.
**Target Layer(s)**: Frontend. The suite is UI-only. A shared-register seam sits behind the source boundaries the screens already call.
**Performance Goals**: None in the spec. The suite is re-runnable on demand, and a failed run is visible on the pull request.
**Constraints**:

- Two signed-in people only: Maya Santos (Employee) and Ethan Cruz (Admin), the placeholders in `specs/001-office-supplies-mvp/quickstart.md`. Sign-out and sign-in is the only role change.
- Every pipeline action goes through the screens. Direct navigation is for routing checks and for opening a destination that role may use.
- Quantities are fixed at Davao, Maya Santos's home office: 10 available units, request quantity 3, and after `Received` that office shows Total 7 / Available 7 / Reserved 0. `Total = Available + Reserved` after every checkpoint. Her office stays Davao. Ethan Cruz stays the Admin.
- Do not invent REST routes, payloads, or error codes. The published contract stays the Swagger UI linked from `specs/001-office-supplies-mvp/contracts/README.md`.
- Where a notification record is absent from the screens the suite already uses, the run reports a gap. A record that is visible and does not match the template fails the checkpoint. No mailbox and no notification screen.
- BitLocker identifier and recovery key/PIN stay Admin-only and are never opened by the suite.
- This work does not add a status, a role, or a stock rule.

## Office under test

The 10 units are added at Davao. That is Maya Santos's home office in `src/features/auth/seeded-source.ts`, and a request reserves stock only there. The spec's earlier Cebu wording is amended to Davao. Maya's office is not edited, and no third person is added. Inventory counts for the new asset are filtered to Davao so seeded units of other assets are not part of the 10.

## Data Model

No new entity and no migration. The demo register is the unit register that Assets and Inventory already share (`src/features/inventory/seeded-unit-register.ts`), plus one request list that My Requests and the Admin queue both read.

A request row carries the fields the screens already show: id, requestor, office, status, lines (asset, quantity), optional note, rejection reason, cancellation reason and who cancelled, pickup location, and the Accountability Form acknowledgement (signed name, signed time) once signed.

Unit status moves only as the product already specifies:

| Transition | Unit status | Counts at Davao |
|------------|-------------|----------------------------------|
| Submit | Available → Reserved | Total unchanged, Available −3, Reserved +3 |
| Reject or legal cancel | Reserved → Available | Total unchanged |
| Approve, For Delivery, Ready for Pickup, sign, Complete | unchanged | unchanged |
| Received | Reserved → Assigned to the requestor | Total −3, Reserved −3, Available unchanged |

Assigned and Inactive units stay out of Total. The catalog's separate Available map (`src/features/catalog/seeded-stock.ts`) stops being a second stock figure for assets the suite creates. Catalog availability for those assets becomes a count of Available units on the register. Units that already exist in the seed stay on their current rows. `npm run verify` stays green; the seam does not retarget the checks that already pass.

## API Contracts

Published contract: [CoDev OSRS API (Swagger UI)](https://codev-osrs-be.vercel.app/), recorded in `specs/001-office-supplies-mvp/contracts/README.md`.

The suite does not call it. The SPA still has no HTTP client (`src/shared/api.ts` is not present). Building a stub server would mean inventing the routes the contract has not finished publishing, which this repo must not do.

Notification records are the same rule. The contract notes in this repo do not describe a notification resource the SPA reads, and no screen shows one. Story 7 and `FR-016` treat absence as a gap annotation on the Playwright report. A record that is already visible on a request screen and does not match its template, previous status, new status, pickup location, or the Admin-queue recipient on an Employee cancel fails that checkpoint. Signing the Accountability Form expects no status-change notification (`FR-017`).

## Component / Module Breakdown

The suite reads controls that already exist. It does not add screens.

| Concern | Where the suite looks | Code that must share one register |
|---------|----------------------|-----------------------------------|
| Sign in, sign out, land by role | `src/features/auth/LoginScreen.tsx`, `src/features/auth/seeded-source.ts` | Unchanged. Maya stays Davao. |
| Encode an asset, add 10 units | `src/features/assets/AssetsPage.tsx`, `src/features/inventory/InventoryPage.tsx` | `src/features/assets/seeded-asset-source.ts`, `src/features/inventory/seeded-unit-register.ts`, `src/features/inventory/seeded-inventory-source.ts` |
| Submit 3, see the request | `src/features/catalog/CatalogPage.tsx`, `src/features/requests/create/RequestListDrawer.tsx`, `src/features/requests/history/MyRequestsPage.tsx` | `src/features/requests/create/seeded-request-submit-source.ts`, `src/features/requests/detail/seeded-employee-request-source.ts` |
| Approve, reject, handover, Admin Received, complete, Admin cancel | `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/queue/ReviewPanel.tsx`, `src/features/requests/queue/UpdateStatusForm.tsx`, `src/features/requests/ReasonForm.tsx` | `src/features/requests/queue/seeded-admin-request-source.ts` |
| Employee cancel, Employee Received, sign | `src/features/requests/history/MyRequestsPage.tsx`, `src/features/requests/detail/RequestDetailPanel.tsx`, `src/features/requests/detail/AccountabilityForm.tsx` | Employee request source, same request list as the queue |
| Stock checkpoints | Inventory table: office and status are already on each row (`src/features/inventory/InventoryPage.tsx`). Default page size is 50, so 10 units fit on one page. | Counts come from the register the table shows |
| Refusals and unknown addresses | `src/shared/ui/feedback/ForbiddenScreen.tsx`, `src/shared/ui/feedback/NotFoundScreen.tsx`, routes in `src/app/routes.tsx` and `src/app/destinations.ts` | No data change |
| History of Rejected, Cancelled, Completed | `src/features/requests/history/HistoryPage.tsx` | Same request list |

Role switch stays inside one browser page. The register lives in the page's module state, so a second browser context would not see it. A pipeline test loads `/login` once, which reloads and resets the register, then signs Maya and Ethan in and out through the account cluster. It does not call `page.goto` again until the test ends. Routing tests are the exception: there the address load is the action under test, and they do not continue a stock walkthrough after that load.

The `e2e/` files import no register and read no module state. Stock is checked by counting Inventory rows for the asset that test created, at Davao: Available, Reserved, and Total = Available + Reserved. A request checkpoint reads My Requests or the queue and requires the request id the screen just showed. The suite does not open a unit's secret fields.

A request owned by someone who cannot sign in (a directory user who is not Maya or Ethan) is how Story 6 proves another Employee cannot mark it received: Maya opens `/requests/:id` for that id and the screen refuses, with the same response it gives an unknown id. That is not a third login.

## Project Structure

```
playwright.config.ts          # testDir e2e/, baseURL of the Vite dev server, one worker-safe browser
e2e/fixtures/session.ts       # one document load at /login; later switches use the account cluster
e2e/fixtures/stock.ts         # count Inventory rows for the asset this test created, at Davao
e2e/fixtures/gaps.ts          # absence is a gap annotation; a visible mismatch fails the test
e2e/happy-path.spec.ts        # Story 1, SC-001, complete-before-sign
e2e/reject-path.spec.ts       # Story 2, SC-002
e2e/cancel-path.spec.ts       # Story 3, SC-003
e2e/routing.spec.ts           # Story 4, SC-004
e2e/delivery.spec.ts          # Story 5, SC-005 cancel refusal
e2e/employee-received.spec.ts # Story 6
e2e/notifications.spec.ts     # Story 7, SC-007, gaps only
.github/workflows/ci.yml      # lint, build, Playwright; trace uploaded on failure
```

`package.json` gains an `e2e` script that runs Playwright. `playwright.config.ts` starts the existing Vite dev server. `specs/001-office-supplies-mvp/quickstart.md` gains the command and replaces the stale demo tail (Admin Complete as the stock change) with Received, the signature, then Complete.

No new screen, no `src/shared/api.ts`, and no server directory.

## Dependencies

- Dev dependency: `@playwright/test`
- Browser: Playwright's Chromium, installed in CI
- No new runtime dependency
- No mail service and no API process

## Requirement Coverage

| Spec | Plan |
|------|------|
| Story 1, SC-001, FR-003, FR-004, FR-006, FR-007, FR-008, FR-010 | `e2e/happy-path.spec.ts` through the screens; stock counted on Inventory |
| Story 2, SC-002, FR-005, FR-009 | `e2e/reject-path.spec.ts`, including an empty reason and a new submit |
| Story 3, SC-003 | `e2e/cancel-path.spec.ts`: Employee pending, Admin approved, Admin ready-for-pickup, empty reason, Employee refused on Approved |
| Story 4, SC-004, FR-014, FR-015, FR-015a | `e2e/routing.spec.ts` against `/queue`, `/assets`, `/inventory`, `/history`, `/requests`, `/catalog`, `/profile`, `/login`, and an unknown path |
| Story 5, SC-005, FR-013 | `e2e/delivery.spec.ts` |
| Story 6, FR-011, FR-012 | `e2e/employee-received.spec.ts` |
| Story 7, SC-007, FR-016, FR-017 | `e2e/notifications.spec.ts`: absence is a gap; a visible record that mismatches the template fails |
| FR-001 | Maya and Ethan only, via `e2e/fixtures/session.ts` |
| FR-002 | Pipeline steps click and type after a single `/login` load. `page.goto` is the routing action, and those tests do not continue a stock walkthrough |
| FR-018, SC-008 | `npm run e2e` locally; `.github/workflows/ci.yml` on pull request, trace artifact on failure |
| FR-019 | Shared register implements rules already specified. Missing outcomes are gaps, not new screens |
| Edge cases in the spec | Folded into the spec file that owns that transition. The never-signed case is the complete-before-sign check. A guessed request id is the routing deep-link check. |

## Constitution Compliance

| Principle | Status |
|-----------|--------|
| I. Spec-driven | PASS. The plan implements `specs/spec.md` and does not add behavior the spec does not ask the suite to prove. |
| II. Two roles | PASS. Two people, one role each. No third role and no role switcher. |
| III. Inventory integrity | PASS. The shared register moves units only on submit, reject, cancel, and Received. Counts stay non-negative and Total = Available + Reserved. |
| IV. State machine | PASS. The suite walks only legal transitions and expects refusals for the illegal ones, including cancel on For Delivery and Complete before the form is signed. |
| V. Notifications | PASS. Gaps are reported. The suite does not invent a template or a recipient list. |
| VI. Independently testable | PASS. Each spec file can run on its own from a fresh page load. |
| VII. Typed contracts | PASS. No new route, payload, or error code. The Swagger link stays the contract. |
| VIII. MVP restraint | PASS. Playwright is the E2E choice already recorded in `ARCHITECT.md`. No new framework beyond that. |
| IX. Secrets | PASS. Seeded placeholders only, already documented. The suite does not read BitLocker fields or commit credentials. |

## Known Risks

All four red-team risks are mitigated. None are accepted.

| Risk | Mitigation in this plan |
|------|-------------------------|
| The register and the screens diverge, and a test reads the register to pass | `e2e/` imports no register. Stock comes from the Inventory table for the asset that test created. The request id must be the one the screen just showed. |
| A reload between Maya and Ethan drops the units and the request | A pipeline test loads `/login` once. Later sign-in uses the account cluster. Routing tests load addresses on their own and stop there. |
| A notification gap stays green after a record is visible and wrong | Absence is an annotation. A visible record that misses the template, the status pair, the pickup location, or the Admin-queue recipient on an Employee cancel fails the checkpoint. |
| Joining the stores turns `npm run verify` red or moves seeded rows | The seam applies to requests and units the suite creates. Existing seeded rows stay. `npm run verify` stays green. |
