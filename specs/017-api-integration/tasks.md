# Tasks: API Integration — Screen Sources (Phase 2)

**Spec**: `specs/017-api-integration/spec.md`
**Plan**: `specs/017-api-integration/plan.md`
**Structure**: By user story (P1 first), after Setup and Foundational
**Linear**: parent [BEN-154](https://linear.app/bench-synergy-project/issue/BEN-154); one sub-issue per story

Format: `- [ ] [TaskID] [P?] [Story?] [BEN-ID] Description — path`

Each published operation is added **once**, by the issue the plan's API table names, and reused after that. Seeded mode (no `VITE_API_BASE_URL`) MUST behave exactly as before at every step (spec FR-001, SC-001).

## Execution status (2026-10-03)

The amendment *remove seeded data entirely* (spec Session 2026-10-03, second) changed how the phases below landed:

- **Every screen reads only the API.** The API sources are `api-catalog-source`, `api-request-submit-source`, `api-employee-request-source`, `api-admin-request-source`, `api-history-source`, `api-assigned-source`, `api-asset-source`, `api-inventory-source` and `api-user-directory`. The shared readers are `shared/api/wire.ts`, `readAsset`, `readUnit` and `requests/api-request-read.ts`.
- **What was deleted:** every seeded source, the demo register, the demo session and chooser, every dev stub (`?requests=`, `?review=`, `?history=`, `?inventory=`, `?assigned=`), and the in-browser table paths.
- **Checks:** the 13 browser checks that drove the seeded data are retired. `check-build.mjs` fails a build that carries seeded markers. The e2e suite runs against a **test-only** fake API (`e2e/fixtures/fake-api.ts`).
- **e2e is green against the fake** (10/10). It found two app bugs, both fixed:
  - The submit confirmation printed the numeric id instead of `REQ-…`.
  - An Admin's cancel or reject closed the review panel instead of showing the result, because the request had left the live page. `useOpenRequest` now reads it by id.
- **T002 (T0) is still open.** The request reader is provisional: its field names come from the Swagger descriptions. The asset and unit readers follow the published examples. The fake answers with the same names, so T0 corrects both together.

## Phase 1: Setup

- [x] T001 [BEN-154] *(Done as a draft 2026-10-03, at the user's choice; the frontend owner posts it and links it.)* Raise contract conflict C12 as an issue on `codev-osrs-backend`. It covers: sign completes the request; there is no Admin complete; sign emails the requester, not Admins; there is no signed flag or time on the request read. Link the issue from a dated 2026-10-03 section (plan D18) — `specs/001-office-supplies-mvp/contracts/README.md`
- [ ] T002 [BEN-154] **T0 live field record, hard gate (plan D15).** Sign in on the deployed API as an Employee and as an Admin. Record field names only, never values, for every read and write listed in plan D15, plus the id the *Request received* email link carries. Add C13 (no "or" search), C14 (no live-status filter) and C15 (no low-stock count). Update conflicts 1, 6, 7, 8 and 11 — `specs/001-office-supplies-mvp/contracts/README.md`
- [ ] T003 [P] [BEN-154] Redacted fixtures with T0's field names and fake values: requests list, detail, counts, history, create success, stock 400, receive, cancel, assets list, units list, users — `scripts/fixtures/api/*.json`

## Phase 2: Foundational (blocks every story)

- [x] T004 [BEN-154] `readAllPages(fetchPage)` at `limit=100`, looping until `totalPages` — `src/shared/api/page.ts`
- [x] T005 [P] [BEN-154] `toRequestStatus` / `toApiStatus` over the frozen keys. An unknown status throws (plan D10) — `src/shared/api/maps.ts`
- [x] T006 [P] [BEN-154] `ApiProblemError` → `invalid | refused | unavailable | status-changed` with the API's `detail` (plan D11) — `src/shared/api/problem-outcome.ts`
- [x] T007 [BEN-154] *(Static half done 2026-10-03 and registered in `verify.mjs`, 0 failures. The fixture-driven mapper harness is added with T003, after T002.)* `check-api-screens.mjs`, registered in `verify.mjs`. With no base URL, every selector returns its seeded source. Each route string is defined in one function. `/sign` is defined once in `src/shared/api/` *(was "never appears" until 2026-10-04, FR-051)*. No `localStorage` or `console` calls in API sources. The mapper harness runs on T003's fixtures with `fetch` stubbed and fails on a missing required field — `scripts/check-api-screens.mjs`, `scripts/verify.mjs`
- [x] T008a [BEN-154] Same-origin `/api/*` proxy for screen routes, prefix stripped, in dev (`server.proxy`) and on Netlify (`_redirects`). `/auth` stays as itself. `apiUrl` prefixes non-auth paths on a proxied host. Needed because `/requests` and `/profile` are SPA addresses, and `/assets` is the dev design-system middleware. The live cookie is `Path=/`. *(Added during execute 2026-10-03; it blocks T002.)* — `vite.config.ts`, `src/shared/api/client.ts`, `public/_redirects`, `scripts/check-api-session.mjs`, `specs/001-office-supplies-mvp/quickstart.md`
- [x] T008 [BEN-154] Re-export the new modules as they land; one import path — `src/shared/api/index.ts`

**Checkpoint**: `npm run verify` is green in seeded mode. T002 is done before any mapper in Phase 3 onward.

## Phase 3: Story 1 — Catalog and submit against the API (P1)

- [ ] T009 [US1] [BEN-156] `listAssets(params)` and `getAsset(id)` with an allowlisted query (`page`, `limit`, `search`, `category`, `location`, `stockLevel`) — `src/shared/api/assets.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T010 [US1] [BEN-156] `createRequest({ purpose?, items })` with no office field — `src/shared/api/requests.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T011 [US1] [BEN-156] API catalog source: `items(office)` reads all pages of `listAssets({ location })`. The stock pill is `quantity` vs `lowQtyAlert`. `Wifi` maps through the category map. Images go through `assetImageSrc` — `src/features/catalog/api-catalog-source.ts`
- [ ] T012 [US1] [BEN-156] Optional `specs(id)` on `CatalogSource`. Seeded returns what it holds; API uses `getAsset`. View Specs keeps the list's office-scoped quantity (FR-014) — `src/features/catalog/catalog-source.ts`, `src/features/catalog/seeded-source.ts`, `src/features/catalog/ViewSpecsPanel.tsx`
- [ ] T013 [US1] [BEN-156] API submit source. Success maps to `EmployeeRequest` (adds `displayId`) and keeps the numeric `id`. A pointer `400` → `invalid`. A stock `400` → `refused` with the API message. Notes are capped at 500 characters — `src/features/requests/create/api-request-submit-source.ts`
- [ ] T014 [US1] [BEN-156] `catalogSource()` and `requestSubmitSource()` selectors on `apiConfigured()` replace the two literals. On a refusal the drawer re-reads availability and the list is cleared only on success (FR-016, FR-017) — `src/features/catalog/catalog-source.ts`, `src/features/requests/create/request-submit-source.ts`, `src/features/catalog/CatalogPage.tsx`, `src/features/requests/create/RequestListDrawer.tsx`
- [ ] T015 [US1] [BEN-156] Fixture assertions for the catalog and submit mappers — `scripts/check-api-screens.mjs`

## Phase 4: Story 2 — My Requests: track, cancel, mark received (P1)

- [x] T016 [US2] [BEN-155] *(Done 2026-10-03, with `get`, `canSign` and `displayId` **optional**: absent means seeded behaviour, so the dev stubs that wrap the seeded source stay untouched. The panel also gained the withheld-sign note, which T029 then only needs to verify.)* `displayId` on `EmployeeRequest`; `get(id)` and `canSign` on `EmployeeRequestSource`. The seeded source implements both (`id === displayId`, `canSign: true`). The list and panel show `displayId` — `src/features/requests/detail/request-detail-types.ts`, `src/features/requests/detail/seeded-employee-request-source.ts`, `src/features/requests/history/MyRequestsPage.tsx`
- [ ] T017 [US2] [BEN-155] `listRequests(params)`, `getRequest(id)`, `cancelRequest(id, reason)`, `receiveRequest(id)` — `src/shared/api/requests.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T018 [US2] [BEN-155] API employee source:
  - `list` reads all pages of `listRequests({ requesterId, sort: 'newest' })`.
  - `get` maps the timeline from recorded times only (FR-019).
  - `cancel` and `markReceived` map their results through `problem-outcome`.
  - ~~`canSign: false`, and `sign` returns `unavailable` without a network call.~~ *(Superseded 2026-10-04 by T029a: `sign` calls `/sign`; `canSign` removed.)*

  — `src/features/requests/detail/api-employee-request-source.ts`
- [ ] T019 [US2] [BEN-155] The panel reads `get(id)` on open. A `409` re-reads it — `src/features/requests/detail/RequestDetailPanel.tsx`
- [ ] T020 [US2] [BEN-155] Selector returns the API source on `apiConfigured()`. Dev stub precedence is unchanged — `src/features/requests/detail/employee-request-source.ts`
- [ ] T021 [US2] [BEN-155] Deep links resolve through a resolver, not loaded ids. A numeric id goes to `get`. A `REQ-…` id is looked up with `listRequests({ displayId })` and opens only on one exact match (plan D7, D17) — `src/features/requests/deep-link.ts`, `src/app/RequestDeepLink.tsx`
- [ ] T022 [US2] [BEN-155] Fixture assertions for the employee mappers and the deep-link lookup — `scripts/check-api-screens.mjs`

## Phase 5: Story 3 — Admin Requests Queue (P1)

Plan D16 order: T023 → T024 green with unedited checks → then T025 onward.

- [x] T023 [US3] [BEN-159] *(Done 2026-10-03, differently from the plan: `page`, `get` and `canComplete` are **optional** on `AdminRequestSource`. A source without `page` (seeded) keeps its load-once flow and the unchanged `buildQueueViewModel` projection, so seeded mode runs the old code path, not an emulation of it. `displayId` is optional too, and `lowStockAlertCount` is `number | null`.)* Seeded side first.
  - Add `displayId` to `QueueRequest` and `ReviewRequest`, and widen `lowStockAlertCount` to `number | null`.
  - Add a new `QueuePage` type, and `page(query)`, `get(id)` and `canComplete` on `AdminRequestSource`.
  - The seeded source implements `page()` over the unchanged `buildQueueViewModel`.

  — `src/features/requests/queue/queue-types.ts`, `src/features/requests/queue/review-types.ts`, `src/features/requests/queue/seeded-admin-request-source.ts`
- [x] T024 [US3] [BEN-159] *(Done 2026-10-03. `check-queue`, `check-review-panel`, `check-shell`, `check-history`, `check-my-requests`, `check-request-detail` and `check-accountability-form` pass unedited against a seeded dev server.)* `QueuePage` drives `page(query)` with 300 ms search debounce. The panel reads `get(id)`. `SummaryCard` renders `—` with "Not published" for `null`. Complete renders only when `canComplete`. `npm run verify` must pass with `check-queue.mjs` and `check-review-panel.mjs` **unedited** — `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/queue/ReviewPanel.tsx`
- [ ] T025 [US3] [BEN-159] `requestCounts(params)` and `updateRequestStatus(id, { status, rejectionReason?, pickupLocation? })`. The status enum is limited to the four PATCH targets — `src/shared/api/requests.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T026 [US3] [BEN-159] API admin source:
  - `page()` maps search to one parameter (D4).
  - ~~"All requests" merges the five live statuses into full pages, with totals from `/counts` (D5).~~ *(Amended 2026-10-07, after plan D5 was amended 2026-10-06: "All requests" is one `GET /requests` with no status, and `/counts` is read beside it.)*
  - Counts give Pending approval and In Processing; low stock is `null`.
  - Approve, reject and handover go through PATCH. `Received` goes through `receiveRequest`, and cancel through `cancelRequest`.
  - Other Notes is never sent. `canComplete: false`, and `complete` returns `unavailable` without a network call.

  — `src/features/requests/queue/api-admin-request-source.ts`
- [ ] T027 [US3] [BEN-159] Selector returns the API source on `apiConfigured()` — `src/features/requests/queue/admin-request-source.ts`
- [ ] T028 [US3] [BEN-159] Fixture assertions: search → parameter mapping, the five-status merge order and slice, a PATCH body with no `notes`, Received routed to `/receive` — `scripts/check-api-screens.mjs`

## Phase 6: Story 4 — Sign and Complete withheld in API mode (P1)

> **Superseded 2026-10-04** (FR-051, ADR-0013): T029 and T031 are withdrawn; T030 stands, restated.

- [x] T029a [US4] [BEN-155] Sign through `POST /requests/:id/sign`; prefilled, read-only full name; the panel reads `Completed` back (FR-051) — `src/shared/api/requests.ts`, `src/features/requests/detail/`, `e2e/`

- [ ] ~~T029~~ *(withdrawn)* [US4] [BEN-155] When `!source.canSign` on an unsigned `Received` request, replace the Accountability Form with the note "Signing is not available yet." Seeded mode renders the form as before — `src/features/requests/detail/RequestDetailPanel.tsx`, `src/features/requests/detail/AccountabilityForm.tsx`
- [x] T030 [US4] [BEN-159] Assert that no Complete button exists: `canComplete` defaults to `false` and the API source sets `false` (FR-023; no seeded source since 2026-10-03) — `src/features/requests/queue/ReviewPanel.tsx`, `scripts/check-api-screens.mjs`
- [ ] ~~T031~~ *(withdrawn)* [US4] [BEN-154] Assert that no `/sign` route and no `completed` PATCH target exist anywhere in `src/shared/api/` (FR-022, FR-023, FR-025) — `scripts/check-api-screens.mjs`

## Phase 7: Story 5 — History (P2)

- [x] T032 [US5] [BEN-160] *(Done 2026-10-03 with optional `page`/`get`, as T023. The shared hooks live in `src/features/requests/paged-source.ts`. `check-history`, `check-queue` and `check-review-panel` pass unedited.)* Seeded side first: `HistorySource = Pick<AdminRequestSource, 'get'> & { page(query) }`, with the seeded `page()` over the unchanged `buildHistoryViewModel`. `HistoryPage` and `HistoryPanel` are query-driven, and the panel reads `get(id)`. `check-history.mjs` passes **unedited** — `src/features/requests/history/history-source.ts`, `src/features/requests/history/history-types.ts`, `src/features/requests/history/HistoryPage.tsx`, `src/features/requests/history/HistoryPanel.tsx`
- [ ] T033 [US5] [BEN-160] `requestHistory(params)` — `src/shared/api/requests.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T034 [US5] [BEN-160] API history source:
  - `page()` reads `requestHistory`, with chip counts from `requestCounts` and search per D4.
  - `get` reuses `getRequest`.
  - Reasons are shown only when the payload carries them. No delete.

  — `src/features/requests/history/api-history-source.ts`, `src/features/requests/history/history-source.ts`
- [ ] T035 [US5] [BEN-160] Fixture assertions for the history mapper, including a missing reason left unset — `scripts/check-api-screens.mjs`

## Phase 8: Story 6 — Profile (P2)

- [ ] T036 [US6] [BEN-158] `listUnits(params)` and `getUnit(id)` with an allowlisted query (`page`, `limit`, `search`, `category`, `status`, `assignedToId`; never `location`) — `src/shared/api/inventory.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T037 [US6] [BEN-158] API assigned source: reads all pages of `listUnits({ assignedToId: user.id })` → `AssignedItem`. `assignedOn` comes from `assignedAt`, and `tag` is unset. Secrets are never copied (D14) — `src/features/profile/api-assigned-source.ts`
- [ ] T038 [US6] [BEN-158] `resolveAssignedSource(search, user)` returns the API source in API mode; the seeded path is unchanged. `ProfilePage` passes the user — `src/features/profile/assigned-source-registry.ts`, `src/features/profile/useAssignedEquipment.ts`, `src/features/profile/ProfilePage.tsx`
- [ ] T039 [US6] [BEN-158] Fixture assertions: a unit fixture **with** a BitLocker identifier and recovery PIN maps to an `AssignedItem` without them — `scripts/check-api-screens.mjs`

## Phase 9: Story 7 — Assets (P2)

- [x] T040 [US7] [BEN-161] *(Done 2026-10-03: optional `page` on `AssetSource`. `AssetsPage` picks `ListedAssets` (the old in-memory path) or `PagedAssets` over the new `useRemoteTableQuery`, and both render one `AssetsView`. `Asset.stock` and `Asset.assigned` are nullable, and `available` is carried alone. `NotPublished` lives in `shared/ui`. `check-assets` and `check-catalog` pass unedited.)* Seeded side first.
  - Widen `Asset.reserved` and `Asset.assigned` to `number | null`, and add an `AssetPage` type.
  - Add `page(query)` to `AssetSource`, with an in-memory seeded `page()`.
  - `AssetsPage` and `useTableQuery` are query-driven, and a `null` count renders `—` with "Not published".
  - `check-assets.mjs` passes **unedited**.

  — `src/features/assets/types.ts`, `src/features/assets/asset-source.ts`, `src/features/assets/seeded-asset-source.ts`, `src/features/assets/useTableQuery.ts`, `src/features/assets/AssetsPage.tsx`
- [ ] T041 [US7] [BEN-161] `createAsset(body)` and `updateAsset(id, patch)`. Reuse T009's reads — `src/shared/api/assets.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T042 [US7] [BEN-161] API asset source:
  - `page()` reads `listAssets`, with chip counts from three `stockLevel` totals at `limit=1`. `reserved` and `assigned` are `null`.
  - Create and update use an explicit field allowlist. `Wifi` maps through the category map, cleared fields are sent as `null`, and no quantity is sent.
  - A missing-model refusal (conflict 9) surfaces through `ValidationProblem`.

  — `src/features/assets/api-asset-source.ts`
- [ ] T043 [US7] [BEN-161] Select the source on `apiConfigured()` — `src/features/assets/asset-store.ts`
- [ ] T044 [US7] [BEN-161] Fixture assertions: PATCH bodies send only changed fields, `null` clears, and no `quantity` is sent — `scripts/check-api-screens.mjs`

## Phase 10: Story 8 — Inventory (P2)

- [x] T045 [US8] [BEN-162] *(Done 2026-10-03: optional `page` and `createStatuses` on `InventorySource`. `ListedInventory` (old path) and `PagedInventory` share one `InventoryView`. An `Assigned` unit with no published assignee shows the not-published dash. `check-inventory` and `check-assets` pass unedited.)* Seeded side first.
  - Add a `UnitPage` type, plus `page(query)` and `createStatuses` on `InventorySource`.
  - The seeded `page()` is in memory, and seeded `createStatuses` is Available, Assigned and Inactive.
  - `InventoryPage` is query-driven, and `UnitFormPanel` offers `createStatuses` on create.
  - `check-inventory.mjs` passes **unedited**.

  — `src/features/inventory/types.ts`, `src/features/inventory/inventory-source.ts`, `src/features/inventory/seeded-inventory-source.ts`, `src/features/inventory/inventory-store.ts`, `src/features/inventory/InventoryPage.tsx`, `src/features/inventory/UnitFormPanel.tsx`
- [ ] T046 [US8] [BEN-162] `createUnit`, `createUnits` (1–100), `updateUnit`, `deleteUnit` — `src/shared/api/inventory.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T047 [P] [US8] [BEN-162] `listUsers()` — `src/shared/api/users.ts` *(Call function done 2026-10-03: the request side is typed from Swagger, and the response stays `unknown` until T002.)*
- [ ] T048 [US8] [BEN-162] API inventory source:
  - `page()` reads `listUnits`, with chip counts from ~~per-status totals at `limit=1`~~ the same body's `counts` *(amended 2026-10-07, after FR-045 was amended 2026-10-06; contracts conflict 16)*.
  - The row mapper drops secrets; only `get` copies them into `UnitDetail`.
  - `update` sends `assignedToId: null` only when the assignee is cleared.
  - `remove` sends the reason, which the API requires since 2026-10-03 (G2 closed). ~~Purchase Request and~~ The attachment ~~are~~ is never sent. *(Amended 2026-10-07: the Purchase Request number is sent on create, bulk create and update, `null` when cleared; contracts G5, closed 2026-10-06.)*
  - `createStatuses` is Available and Assigned (D13). The assignee is unset (G6).

  — `src/features/inventory/api-inventory-source.ts`
- [ ] T049 [US8] [BEN-162] API user directory over `listUsers()`. The list lives in hook state only, with no department — `src/features/inventory/api-user-directory.ts`, `src/features/inventory/user-directory.ts`
- [ ] T050 [US8] [BEN-162] Select the source on `apiConfigured()`. Dev stub precedence is unchanged. The ASSIGNED cell shows `—` with "Not published" when a unit is `Assigned` with no assignee — `src/features/inventory/inventory-source.ts`, `src/features/inventory/InventoryPage.tsx`
- [ ] T051 [US8] [BEN-162] Fixture assertions:
  - Secrets appear only in `get`.
  - There is no `location` query and no PR or attachment in bodies. Delete carries `{ reason }`.
  - `assignedToId` is omitted when untouched and `null` when cleared.

  — `scripts/check-api-screens.mjs`

## Final Phase: Polish

- [ ] T052 [BEN-154] Record the T0 response shapes as final, or name the ones still open, and the outcome of every gap found during Phases 3–10 — `specs/001-office-supplies-mvp/contracts/README.md`
- [ ] T053 [P] [BEN-154] Mark spec 001's integration work as owned by spec 017 (T003, T005–T013, T024 notes) — `specs/001-office-supplies-mvp/tasks.md`
- [ ] T054 [P] [BEN-154] API-mode smoke steps for each screen, and the demo note: full path in seeded mode, API path to `Received` until C12 — `specs/001-office-supplies-mvp/quickstart.md`
- [ ] T055 [BEN-154] Manual API-mode run against the deployed API (SC-002 to SC-007): Employee submit → Admin approve → Ready for Pickup → Received by each role; cancel as both roles; no `/sign` in the network log; no user list or secrets in storage or the console — `specs/017-api-integration/tasks.md` (record the result under this task)

## Dependencies

- **T002 (T0) gates every mapper**: T011, T013, T018, T026, T034, T037, T042, T048, T049. T001 and T002 can run together.
- **Phase 2 blocks every story.**
- **Shared function ownership** (plan API table):
  - T009 (assets reads) comes before T041 and T042.
  - T017 (request reads and writes) comes before T025, T026, T033 and T034.
  - T025 (`requestCounts`) comes before T034.
  - T036 (unit reads) comes before T046 and T048.
- **Seeded side first inside a story** (plan D16):
  - Queue: T023 → T024 green → T026.
  - History: T032 → T034.
  - Assets: T040 → T042.
  - Inventory: T045 → T048.
- **Story order between stories:**
  - US4 needs US2 (T016, T018) and US3 (T023, T026).
  - US5 needs US3's `AdminRequestSource` changes (T023).
  - US1, US2, US6, US7 and US8 are otherwise independent after Phase 2.
- **Final phase** comes after every story.

## Parallel opportunities

- **Setup and Foundational:** T003, T005 and T006. T001 runs with T002.
- **Between stories, after Phase 2:** US1 (BEN-156), US2 (BEN-155), US6 (BEN-158) and US7 (BEN-161) are different sub-issues and touch different feature folders. They can proceed in parallel. They share only `src/shared/api/index.ts` and `scripts/check-api-screens.mjs`, so merge those carefully.
- **Inside Story 8:** T047.
- **Final phase:** T053 and T054.

## MVP slice

Phase 1, Phase 2, then US1 → US2 → US3 → US4. That is the API demo path to `Received`, with Sign and Complete honestly withheld. US5 to US8 follow.

## Phase 12: Session 2026-10-04 additions

- [x] T070 [BEN-154] Form drafts for Add Single Unit, Add Multiple Units, Add Asset and Update Asset (FR-052) — `src/shared/form-draft-cache.ts`, `src/features/inventory/`, `src/features/assets/AssetFormPanel.tsx`, `src/features/auth/SessionProvider.tsx`, `e2e/form-draft.spec.ts`
- [x] T071 [BEN-154] Dev-only role select on sign-in (FR-053). **Reverted 2026-10-06** before merge to `dev` — `src/features/auth/dev-role-override.ts`, `src/features/auth/LoginScreen.tsx`, `src/features/auth/api-session-source.ts`

## Phase 13: Session 2026-10-06 additions

- [x] T072 [BEN-154] **Refresh** button on the Requests Queue (FR-054) — `src/features/requests/queue/QueuePage.tsx`, `e2e/queue-refresh.spec.ts`
- [x] T073 [BEN-154] Rows first: counts read beside the list, independent reads in parallel, *All requests* as one list call (FR-055; early reads superseded by T076, FR-058) — `src/features/requests/page-counts.ts`, `src/features/requests/queue/`, `src/features/requests/history/`, `src/features/inventory/api-inventory-source.ts`, `src/features/assets/useRemoteTableQuery.ts`, `src/shared/api/page.ts`, `e2e/table-first.spec.ts`
- [x] T074 [BEN-154] Search and sort in the address (FR-056) — `src/shared/address-fields.ts`, `src/features/requests/request-address.ts`, `src/features/assets/useRemoteTableQuery.ts`, `e2e/table-address.spec.ts`
- [x] T076 [BEN-154] Keep the signed-in user; render from it and read `/auth/me` in the background once idle (FR-058) — `src/features/auth/session-cache.ts`, `src/features/auth/SessionProvider.tsx`, `src/features/auth/api-session-source.ts`, `src/shared/api/client.ts`, `e2e/session-cache.spec.ts`
- [x] T075 [BEN-154] Panels have their own address: Review opens `/queue/:id` and View details opens `/requests/:id`; closing returns to the list (spec 008 FR-001, spec 007 FR-001, amended) — `src/features/requests/queue/QueuePage.tsx`, `src/features/requests/history/MyRequestsPage.tsx`, `src/app/RequestDeepLink.tsx`, `src/app/routes.tsx`, `src/app/AppLayout.tsx`, `e2e/panel-address.spec.ts`
