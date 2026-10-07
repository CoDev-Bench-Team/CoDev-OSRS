# Implementation Plan: API Integration — Screen Sources (Phase 2)

**Date**: 2026-10-03
**Spec**: `specs/017-api-integration/spec.md`
**Status**: Draft
**Branch**: `emmanuelr/ben-154-int-api-integration`

## Summary

Each screen already reads through a source seam in its own vocabulary (`CatalogSource`, `RequestSubmitSource`, `EmployeeRequestSource`, `AdminRequestSource`, `HistorySource`, `AssignedEquipmentSource`, `AssetSource`, `InventorySource`, `UserDirectory`). This slice adds one API-backed implementation per seam, and the existing selector returns it when `apiConfigured()` is true. The published operations live once each in `src/shared/api/`. The four paged tables (Requests Queue, History, Assets, Inventory) move from "load everything, filter in the page" to "ask the source for one page". The seeded sources answer that page query in memory with today's model functions, so seeded behavior does not change. Sign and Complete are withheld in API mode through a capability flag on the source, not through a fake refusal.

## Technical Context

**Stack**: React 19, TypeScript (strict), Vite 8, Tailwind CSS 4, React Router v7. No new framework.
**Primary Dependencies**: The BEN-157 client (`apiRequest`, `ApiProblemError`, `readPage`, `readProblem`, `REQUEST_STATUS_LABEL`, `API_ASSET_CATEGORIES`, `assetImageSrc`), and `parseValidationProblem` from `src/shared/validation.ts`. No new package.
**Storage**: None added. The user list for the assignee picker stays in component memory. Nothing new goes to browser storage.
**Target Layer(s)**: Frontend only.
**Performance Goals**: None in the spec. Paged tables send one list call and one counts call per query change. Search is debounced at 300 ms. Catalog and My Requests read all pages at `limit=100`.
**Constraints**: Constitution VII (no invented route, field or parameter), VIII and IX (BitLocker identifier and recovery PIN never rendered for an Employee and never logged), IV (no SPA path to `Completed` that skips the Admin; no Admin cancel on `For Delivery`). The spec requires no redraw.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **Server-side paging** for the Requests Queue, History, Assets and Inventory. Each of those sources gains `page(query)`, which returns the rows of one page plus the totals and chip counts the page draws. The pages call it on each query change and stop computing these themselves. | Decided by the user 2026-10-03 (spec FR-027, FR-035, FR-045). |
| D2 | **Seeded sources implement `page(query)` in memory** by calling today's `buildQueueViewModel`, `buildHistoryViewModel`, and the Assets and Inventory filters. | Seeded mode stays exactly as it is (spec FR-001, SC-001), and the page code has one path. |
| D3 | **Catalog and My Requests read every page** through `readAllPages` (`limit=100`, loop to `totalPages`). | Neither screen draws paging, search or filters (spec 005, spec 009 D2). The spec forbids a redraw. |
| D4 | **One search box maps to one API parameter.** ~~Queue and History: text starting with `REQ-` → `displayId`; anything else → `requester` (first name, last name, email).~~ Queue and History: `search` (*amended 2026-10-07*: C13 closed; it matches the display id, the requester's name or email, and the items' names and models, and goes to the list, the history read and the counts). Assets and Inventory: `search`. ~~In API mode, item-name search on the Queue and History is lost. The gap is recorded (C13).~~ | ~~The API has no "or" across `displayId`, `requester` and `itemName`. Two calls would break paging.~~ Since 2026-10-07 the API matches all of them in one parameter. |
| D5 | ~~**Queue "All requests" merges the five live statuses.** For page `p` of size `n`, the API source calls `listRequests` once per live status (`pending_approval`, `approved`, `for_delivery`, `ready_for_pickup`, `received`) with `page=1`, `limit=p·n` and the same sort and search. It merges the rows with the API's own order (`createdAt` for newest/oldest, requester name then `createdAt` for Employee A–Z) and returns the slice `[(p−1)·n, p·n)`. The total and the chip count are the live statuses summed from `/requests/counts`. A single-status chip is one call. Recorded as C14, with a filter on several statuses as the ask.~~ **Amended 2026-10-06 (frontend owner): "All requests" is one `GET /requests` with no status** (`sort`, search, `page`, `limit=n`). The API also returns resolved requests there; the queue drops them, so a page may hold fewer than `n` rows and the pager's total counts them too, until C14 is answered. `/requests/counts` is read beside the rows, for the chips and cards, and the rows never wait on it. A single-status chip is one call, its total from the list. | Five calls per page, and the counts before them, kept the table waiting. C14 still asks the backend for a live-only filter, which would make the pages full again. |
| D6 | **Panels read by id.** `AdminRequestSource.get(id)` and `EmployeeRequestSource.get(id)` are added. Read models gain `displayId`. In API mode `id` is the numeric id as a string. In seeded mode `id === displayId`. The table shows `displayId`. | The spec's FR-005. List rows carry no `units` and no timeline (live schema note on `units`). |
| D7 | **Deep links resolve through `get(id)`**, not through membership in a loaded list. `useDeepLink` takes a resolver instead of `ids`. A `404` gives the existing unavailable notice. | Under paging the page cannot hold every id. |
| D8 | *(Rewritten 2026-10-04, ADR-0013.)* **Sign is a call; Complete is withheld.** The API employee source signs through `signRequest` (`POST /requests/:id/sign`, `{ agreed, fullName }`), and the request comes back `Completed`. `AdminRequestSource.canComplete` defaults to `false` and the API source sets `false`: there is no Admin complete. | Spec FR-023, FR-051; constitution 10.0.0 IV. |
| D9 | **Not-published numbers are `null`.** ~~`QueueSnapshot.lowStockAlertCount` widens to `number \| null`.~~ *(Removed 2026-10-03 with the card.)* *(`Asset.reserved` and `Asset.assigned` are plain numbers since 2026-10-03, when `/assets` published the counts; FR-041.)* `null` renders as `—` with the accessible name "Not published". | Spec FR-028 and FR-041. A `0` would be a false fact. |
| D10 | **Status mapping** uses the existing `REQUEST_STATUS_LABEL` keys into the shell's `RequestStatus`. `completed` → `Completed` in the shell vocabulary, with the display word left to the pill, as BEN-157 recorded. A status outside the map makes the row unreadable: the source rejects, and the screen shows its error state. | No invented status (constitution VII). |
| D11 | **Mutation results.** `400` with pointers → `invalid` (BEN-98). A stock `400` on submit with no pointer → `refused` with the API's `detail`/`title`. `404` → `unavailable`. `409` → `status-changed` with the API's `detail`, after which the existing `runThenReload` re-reads. `401`/`403` stay with the BEN-157 client. | Spec FR-006 and FR-007. The panels' refusal types already exist. |
| D12 | **Fields never sent in API mode**: Admin Other Notes, ~~unit Purchase Request number,~~ unit attachment file, an office on submit, a `location` on `/inventory-items`, `notes` on sign. Each API source builds its body from an explicit field list, not from a spread of the draft. *(Amended 2026-10-07: the unit Purchase Request number is sent on create, bulk create and update, `null` when cleared, and read from both unit reads (contracts G5, closed 2026-10-06).)* | Spec FR-008, FR-015, FR-032, FR-045, FR-049. |
| D13 | **Inactive on create** is not offered in API mode. `InventorySource.createStatuses` lists what create offers: the seeded source gives `Available · Assigned · Inactive` and the API source `Available · Assigned`. | Spec Clarifications default (conflict 11 G10). |
| D14 | **Secrets are dropped at the mapper.** `api-assigned-source.ts` and the Inventory row mapper never copy `bitlockerIdentifier` or `recoveryPin`. Only the Inventory `get` mapper copies them, into `UnitDetail`. No API source logs a response body. | Spec FR-039 and FR-050 (conflict 11 G3: the list returns secrets to Employees). |
| D15 | **T0 is a hard gate** (spec FR-010, red-team R1). Before any request, unit or asset mapper is written, T0 signs in on the deployed API as an Employee and as an Admin. It records the field names (never values) of: `GET /requests` rows, `GET /requests/:id`, `/requests/counts`, `/requests/history` rows, `POST /requests` success, a stock `400`, `/receive` and `/cancel` success, `GET /assets` rows, `GET /inventory-items` rows, `GET /users`, and the request id the *Request received* email's link carries. The record goes in the contract README. Wire types are written only from that record. The mapper check fails when a field the mapper treats as required is missing from the fixture. | The live schema documents only `items` and `units` for a request. |
| D16 | **One screen at a time, seeded side first** (red-team R2). For each paged screen, in the order Queue → History → Assets → Inventory: (1) add `page()` to the seeded source over today's model function and switch the page to it; (2) `npm run verify`, where that screen's existing `check-*.mjs` passes **without editing its fixtures or assertions**; (3) only then write that screen's API source. A check that needs editing to pass is a behavior change and stops the slice. | Four screens change from filtering in the page to asking the source for a page. Sixteen existing checks drive them. |
| D17 | **Deep links accept either id** (red-team R4). If T0 shows the email link carries the display id, the resolver in API mode maps a `REQ-…` id with `listRequests({ displayId, limit: 2 })`. Exactly one exact match opens it. Anything else gives the existing unavailable notice. A numeric id goes straight to `get(id)`. | Emails may link by display id while panels read by numeric id. |
| D18 | **C12 is raised with the backend on day one** (red-team R5): a GitHub issue on `codev-osrs-backend`, linked from the contract README, asking for sign without status change, a signed flag and time on the request read, an Admin complete limited to a signed `Received` request, and the email to Admins on sign. The demo runs the full path in seeded mode and the API path up to `Received`. FR-026's amendment lifts the withholding when the backend ships. | Requests stop at `Received` in API mode until then. |

### Execution note (2026-10-03)

D1, D2, D6 and D8 were built with the new seam members **optional** (`page?`, `get?`, `canSign?`, `canComplete?`, `displayId?`). A source without them keeps the pre-017 code path exactly: it loads once and projects in the page. Only API sources implement them. This is stronger than D2's in-memory `page()`, because seeded mode runs the old code, not a re-implementation of it. It also leaves the dev stubs that wrap seeded sources untouched. *(2026-10-04: `canSign` is removed, and an absent `canComplete` now means `false`, FR-023.)*

## Data Model

No database. Feature read models change as follows. Wire types stay private to `src/shared/api/*`.

| Read model | Change |
|------------|--------|
| `EmployeeRequest` (`requests/detail/request-detail-types.ts`) | + `displayId: string`. `id` is opaque (numeric string in API mode). |
| `QueueRequest` (`requests/queue/queue-types.ts`) | + `displayId: string` |
| `QueueSnapshot` | ~~`lowStockAlertCount: number \| null`~~ (removed 2026-10-03 with the card) |
| `QueueQuery` → `QueuePage` (new, `queue-types.ts`) | `{ rows: ReviewRequest[]; total; page; totalPages; chipCounts; pendingApprovalCount; inProcessingCount; liveCount }` |
| `HistoryPage` (new, `history-types.ts`) | `{ rows; total; page; totalPages; chipCounts }` |
| `Asset` (`assets/types.ts`) | `available`, `reserved`, `assigned`, `total`: `number`, read from `quantity`, `reservedQuantity`, `assignedQuantity`, `totalQuantity` (amended 2026-10-03; the per-office `stock` record is gone) |
| `AssetPage` (new, `assets/types.ts`) | `{ rows; total; page; totalPages; chipCounts: Record<StockChip, number> }` |
| `UnitPage` (new, `inventory/types.ts`) | `{ rows: UnitRow[]; total; page; totalPages; chipCounts }` |
| `UnitRow.assignee` | Stays optional. In API mode it is unset, because the unit read has no assignee (G6). The cell renders `—` with "Not published". |
| `AssignedItem` | `tag` unset in API mode (no PR, G5); `assignedOn` ← `assignedAt` date part |

### Wire → read model (written after T0; provisional names from the live examples)

| Wire | Read model |
|------|------------|
| request `id` (number) | `id` (string) |
| `displayId` | `displayId` |
| `status` (`pending_approval` …) | `RequestStatus` via D10 |
| `createdAt` | `submittedAt` |
| `purpose` | `noteToApprover` |
| `items[]` (asset name, model, quantity, `availableStock`) | `lines[]` / `ReviewLine.available` |
| `pickupLocation` (string) | `PickupLocation { kind: 'office' }` when it equals an office label, else `{ kind: 'other', text }` |
| `rejectionReason`, `cancellationReason`, `resolvedAt`, `receivedAt`, timeline timestamps | the matching optional fields, only when present |
| asset `quantity` | `Asset.available` (Reserved and Assigned `null`) |
| unit `asset`, `serialNumber`, `status`, `location`, `assignedAt`, purchase fields | `UnitRow` / `UnitDetail` |
| user `id`, `firstName` + `lastName`, `email` | `DirectoryUser` (no department) |

## API Contracts

The backend owns the contract: [Swagger](https://codev-osrs-be.vercel.app/), read 2026-10-03. This repo authors none. Each operation below is implemented once in `src/shared/api/`.

| Module | Function | Call | Added by | Reused by |
|--------|----------|------|----------|-----------|
| `assets.ts` | `listAssets(params)` | `GET /assets?page&limit&search&category&location&stockLevel` | BEN-156 | BEN-161 |
| | `getAsset(id)` | `GET /assets/:id` | BEN-156 | BEN-161 |
| | `createAsset(body)` | `POST /assets` | BEN-161 | — |
| | `updateAsset(id, patch)` | `PATCH /assets/:id` | BEN-161 | — |
| `requests.ts` | `createRequest(body)` | `POST /requests` `{ purpose?, items[{assetId, quantity}] }` | BEN-156 | — |
| | `listRequests(params)` | `GET /requests?page&limit&status&search&displayId&requester&requesterId&itemName&sort` | BEN-155 | BEN-159 |
| | `requestCounts(params)` | `GET /requests/counts?search&displayId&requester&requesterId&itemName` | BEN-159 | BEN-160 (chip counts) |
| | `requestHistory(params)` | `GET /requests/history?page&limit&status&search&displayId&requester&sort` | BEN-160 | — |
| | `getRequest(id)` | `GET /requests/:id` | BEN-155 | BEN-159, BEN-160 |
| | `updateRequestStatus(id, body)` | `PATCH /requests/:id` `{ status, rejectionReason?, pickupLocation? }` | BEN-159 | — |
| | `cancelRequest(id, reason)` | `POST /requests/:id/cancel` | BEN-155 | BEN-159 |
| | `receiveRequest(id)` | `POST /requests/:id/receive` | BEN-155 | BEN-159 |
| `inventory.ts` | `listUnits(params)` | `GET /inventory-items?page&limit&search&category&status&assignedToId` | BEN-158 | BEN-162 |
| | `getUnit(id)` | `GET /inventory-items/:id` | BEN-158 | BEN-162 |
| | `createUnit(body)` / `createUnits(body)` | `POST /inventory-items`, `POST /inventory-items/bulk` | BEN-162 | — |
| | `updateUnit(id, patch)` | `PATCH /inventory-items/:id` | BEN-162 | — |
| | `deleteUnit(id)` | `DELETE /inventory-items/:id` | BEN-162 | — |
| `users.ts` | `listUsers()` | `GET /users` | BEN-162 | — |

**Not added**: `DELETE /requests/:id` (no control), `DELETE /assets/:id` (Assets draws no delete control; see Analysis A1), any `/users` write. `readAllPages(fetchPage)` is added to `page.ts`. *(`POST /requests/:id/sign` was withheld here until 2026-10-04; it is now added, D8.)*

Errors and `401`/`403` handling come from the BEN-157 client unchanged. `POST /requests` and `POST /requests/:id/receive` are already session-ending writes there.

## Component / Module Breakdown

### Shared — `src/shared/api/`
- `assets.ts`, `requests.ts`, `inventory.ts`, `users.ts`: the functions in the table, with private wire types and `URLSearchParams` built from an explicit allowlist (D12). `index.ts` re-exports them.
- `page.ts`: + `readAllPages`.
- `maps.ts`: + `toRequestStatus(api)` / `toApiStatus(shell)` (D10). Same keys BEN-157 froze.
- `problem-outcome.ts` (new): `ApiProblemError` → `invalid | refused | unavailable | status-changed` (D11). Used by every API source.

### Catalog and submit (BEN-156)
- `catalog/api-catalog-source.ts`: `items(office)` → `readAllPages(listAssets({ location: office }))`. The category chips filter on the page as today (D3). The stock pill comes from `quantity` vs `lowQtyAlert` (FR-013). Images via `assetImageSrc`.
- `catalog/ViewSpecsPanel.tsx`: in API mode, specs come from `getAsset(id)`, and the quantity stays the list's (FR-014). The source gains an optional `specs(id)`. The seeded source returns what it already holds.
- `requests/create/api-request-submit-source.ts`: `createRequest`. The success body maps to `EmployeeRequest`. Stock `400` → `refused` with the API message, and the drawer calls `catalogSource` reload (already wired via `RequestListDrawer`).
- `catalog/CatalogPage.tsx`: `catalogSource()` and `requestSubmitSource()` selectors replace the two literals.

### My Requests (BEN-155)
- `requests/detail/api-employee-request-source.ts`: `list(user)` → `readAllPages(listRequests({ requesterId: user.id, sort: 'newest' }))`; `get`, `cancel`, `markReceived`; `canSign = false`; `sign` → `unavailable` without fetch. *(2026-10-04: `sign` calls `signRequest`, D8.)*
- `request-detail-types.ts`: + `get`. *(`canSign` removed 2026-10-04.)*
- `RequestDetailPanel.tsx`: on open, `get(id)` for lines, units and timeline. A `Received` unsigned request offers the Accountability Form, with the signer's name prefilled (D8, FR-051).
- `employee-request-source.ts`: `apiConfigured()` → API source. Dev stub precedence unchanged.

### Requests Queue (BEN-159)
- `requests/queue/api-admin-request-source.ts`: `page(query)` → `listRequests` + `requestCounts` in parallel (D4, D5); `get`; `approve`/`reject`/`updateStatus` → `updateRequestStatus`, except `updateStatus(..., 'Received')` → `receiveRequest`; `cancel` → `cancelRequest`; `canComplete = false`; `pickupOffices` = `OFFICES`.
- `review-types.ts`: + `page`, `get`, `canComplete`. `seeded-admin-request-source.ts`: implements them over `buildQueueViewModel`.
- `QueuePage.tsx`: drives `page(query)`. Rows are `QueuePage.rows`. The panel uses `get(id)` (D6). `SummaryCard` renders `—` for `null`. The deep link uses the resolver (D7).
- `ReviewPanel.tsx`: Complete rendered only when `canComplete`. Cancel stays off `For Delivery` (existing D19).
- `admin-request-source.ts`: `apiConfigured()` → API source.

### History (BEN-160)
- `history/history-source.ts`: `HistorySource = Pick<AdminRequestSource, 'get'> & { page(query): Promise<HistoryPage> }`. The API source uses `requestHistory` and `requestCounts` for the chip counts. The seeded source uses `buildHistoryViewModel`.
- `HistoryPage.tsx`, `HistoryPanel.tsx`: page query; the panel reads `get(id)`, stays read-only.

### Profile (BEN-158)
- `profile/api-assigned-source.ts`: `assignedToMe()` → `readAllPages(listUnits({ assignedToId: user.id }))` → `AssignedItem` (D14). It needs the session user, so `resolveAssignedSource(search, user)`.
- `assigned-source-registry.ts`: API mode returns this source. Seeded mode keeps `null` / stubs exactly as today.

### Assets (BEN-161)
- `assets/api-asset-source.ts`: `page(query)` → one `listAssets` call: its rows, and the chip counts from the same body's `counts` (`total`, `byStockLevel`), which follow search and category but not the chip *(amended 2026-10-03, BEN-115; was three `limit=1` calls)*; `create` / `update` with an explicit field allowlist, `Wifi` via `API_ASSET_CATEGORIES`, cleared fields sent as `null`; no quantity.
- `asset-source.ts`: + `page`. `seeded-asset-source.ts`: in-memory `page`.
- `asset-store.ts`: select by `apiConfigured()`. `AssetsPage.tsx` / `useTableQuery.ts`: query-driven, no local filtering in API mode. `—` for `null` counts.

### Inventory (BEN-162)
- `inventory/api-inventory-source.ts`: `page(query)` → one `listUnits` call: its rows, and the chip counts from the same body's `counts` *(amended 2026-10-06, FR-045, contracts conflict 16; was per-status totals at `limit=1`)*; `get`, `create`, `createBatch`, `update` (assignee `null` only when cleared; Purchase Request sent, `null` when cleared, G5 closed 2026-10-06), `remove(id, reason)` → `deleteUnit(id, reason)` (the API requires it since 2026-10-03, G2 closed); `createStatuses` (D13).
- `inventory/api-user-directory.ts`: `listUsers()` held in the hook's state only. `user-directory.ts` selects it in API mode.
- `inventory-source.ts`, `inventory-store.ts`, `InventoryPage.tsx`, `UnitFormPanel.tsx`: page query; `createStatuses`; assignee `—` when unpublished.

### Contract record and checks
- `specs/001-office-supplies-mvp/contracts/README.md`: a dated 2026-10-03 section with T0's field record and new conflicts. **C12**: sign completes the request, there is no Admin complete, sign emails the requester not Admins, and there is no signed flag. **C13**: no "or" search. **C14**: no live-status filter. **C15**: no low-stock count. It also updates conflicts 1, 6, 7, 8 and 11.
- `scripts/check-api-screens.mjs`, registered in `scripts/verify.mjs`:
  - **Seeded mode:** with no base URL, every selector returns its seeded source, and the existing `check-*.mjs` scripts pass unchanged.
  - **One definition per route:** each published route string appears in exactly one `src/shared/api/*.ts` function, and `/sign` appears nowhere in `src/shared/api/`.
  - **Bodies and queries (D12):** no request body carries `notes`, `otherNotes`, ~~`purchaseRequest`,~~ an attachment file, ~~`reason` on delete,~~ or an office on submit *(amended 2026-10-07: `purchaseRequest` is published, G5 closed 2026-10-06; the delete reason is required, G2 closed 2026-10-03)*, and no `location` query is sent on `/inventory-items`.
  - **Secrets (D14):** no API source references `localStorage` or `console`. `bitlockerIdentifier` and `recoveryPin` appear only in the Inventory `get` mapper.
  - **Mappers:** the mappers run against redacted fixtures in `scripts/fixtures/api/*.json`, built from T0's field names with fake values, with `fetch` stubbed.
- `specs/README.md` (row exists), `specs/001-office-supplies-mvp/tasks.md`: mark T003, T008–T024 integration notes as owned by spec 017.

## Project Structure

```
src/shared/api/
  assets.ts  requests.ts  inventory.ts  users.ts  problem-outcome.ts   # new
  page.ts  maps.ts  index.ts                                           # extended
src/features/catalog/api-catalog-source.ts
src/features/requests/create/api-request-submit-source.ts
src/features/requests/detail/api-employee-request-source.ts
src/features/requests/queue/api-admin-request-source.ts
src/features/requests/history/api-history-source.ts
src/features/profile/api-assigned-source.ts
src/features/assets/api-asset-source.ts
src/features/inventory/api-inventory-source.ts
src/features/inventory/api-user-directory.ts
scripts/check-api-screens.mjs
scripts/fixtures/api/*.json
```

## Dependencies

- None new. A reachable API, and an Employee and an Admin Google Workspace account for T0 and the API-mode smoke test.
- **Blocked by:** nothing. BEN-157, BEN-48 and BEN-150 are Done.

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Implements spec 017. A1 and A2 below amend it in place. |
| II. Two roles | PASS | Role from `/auth/me` (BEN-157). The API enforces every action, and a `403` is shown. |
| III. Inventory integrity | PASS | The SPA moves no stock. It never sends a quantity on assets or a `Reserved` status. Unpublished counts are `null`, not computed. |
| IV. State machine | PASS | Signing completes; no Admin complete (D8, constitution 10.0.0). No Admin cancel on `For Delivery`. `Received` only via `/receive`. |
| V. Notifications | PASS | The SPA sends no mail. The missing Admin email on sign is recorded (C12). |
| VI. Testable increments | PASS | Each screen switches behind its own selector. Seeded checks are unchanged. |
| VII. Typed contracts | PASS | Wire types are written from T0's live record. Every gap goes to the contract README, and nothing is invented (D4, D5, D9, D12). |
| VIII. MVP restraint | PASS | No new framework. No new screen controls. |
| IX. Secrets | PASS | D14. No storage of user lists, tokens or secrets. |

## Analysis

| # | Severity | Finding | Resolution |
|---|----------|---------|-----------|
| A1 | MEDIUM | Spec Story 7 AC5 and FR-043 assume an asset delete control. Assets draws none (spec 014). | Amend the spec in place: "If a delete control exists". No control and no `deleteAsset` are added. |
| A2 | MEDIUM | Spec FR-018 lists paging, sort, filter and search on My Requests. Spec 009 draws none. | Amend: My Requests reads all of the Employee's requests through the API, newest first (D3). |
| A3 | MEDIUM | Spec FR-027 implies search by id, requester and item together. | D4 maps one box to one parameter. Recorded as C13. The spec gets a note. |
| A4 | LOW | Spec Story 3 AC1 and FR-027 do not say what "All requests" returns. | D5, C14. |

All four were applied to the spec in place on 2026-10-03 (Story 2 AC1, Story 3 AC1 and AC1a, Story 7 AC5, FR-018, FR-027, FR-043).

## Known Risks

Red-teamed 2026-10-03 (pre-mortem). Every risk was mitigated; none is accepted unmitigated.

| # | Risk | Early warning | Mitigation |
|---|------|---------------|------------|
| R1 | Live payloads do not match the guessed request, asset and unit shapes. | T0 slips; rows show blank names or "Invalid date". | D15: T0 is a hard gate. Wire types come only from the live record, and the mapper check fails on a missing field. |
| R2 | The page-query rework regresses seeded mode on four screens. | An existing `check-*.mjs` fails or needs its fixtures edited. | D16: one screen at a time, seeded side first, with existing checks green and unedited. |
| R3 | Queue pages come out short or ragged once terminal rows are dropped. | QA sees "page 2 has 4 rows". | D5 (amended 2026-10-06): *All requests* is one list call and short pages are accepted; an empty page says "No live requests on this page". C14 asks the backend for a live-only filter, which would make pages full again. |
| R4 | Email and deep links carry the display id while panels read by numeric id. | "View request" from an email lands on unavailable. | D17: T0 records the link's id, and the resolver looks up a display id. |
| R5 | Pressure to call `/sign` because API-mode requests stop at `Received`. | The demo date nears with C12 open. | D18: raise C12 on day one; the demo runs the full path in seeded mode. FR-026 is the only way to lift the withholding. |

**Strengthened position:** the plan swaps data sources behind seams that already exist. It is gated on a live field record, so no shape is guessed. It moves one screen at a time against unedited regression checks. Every contract gap shows up as a visible dash, a withheld action or a recorded conflict, never as a guessed value. The two places the API cannot do what the screen draws (search across several fields, and the live-only "All") are handled with published parameters alone and raised with the backend.
