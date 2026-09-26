# Implementation Plan: Request List drawer & submit

**Date**: 2026-09-25
**Spec**: `specs/010-request-list-drawer/spec.md`
**Linear**: [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43) (C1 = [BEN-57](https://linear.app/bench-synergy-project/issue/BEN-57))
**Status**: Draft

## Summary

Replace the Catalog's interim `RequestListDraftProvider` with a session-scoped
Request List that owns the lines, the note and the drawer's open state, and
drives the top-bar count. The drawer is a `SidePanel` over `/catalog` with two
states, **editing** and **submitted**. Submit goes through a `RequestSubmitSource`
seam. A seeded implementation reserves against a shared in-memory stock store, so
the Catalog visibly drops after a submit. The live implementation lands when the
contract documents the success and insufficient-stock shapes (contract conflict 4).
The RFC 9457 validation parser goes in `src/shared/validation.ts` and is built
against the published format from the start.

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 7
**Primary Dependencies**: None new. Existing `SidePanel`, `StatusTimeline`, `StatusPill`, `TextField`, `Button`, `Notice`, table-column helpers
**Storage**: None durable. The Request List is React state for the signed-in session. Seeded stock and seeded requests are in-memory and reset on reload
**Target Layer**: Frontend SPA
**Performance Goals**: None beyond the MVP's. The drawer's availability read is one `CatalogSource.items(homeOffice)` call per open
**Constraints**: Constitution VII (no invented fields, routes or error codes). Feature code under `src/features/requests/create/*` (BEN-43). Employee-only (II). No stock change before submit (III). Verification via the repo's CDP check scripts. No new test framework (VIII)

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | `RequestListProvider` mounts in `App.tsx`, inside `RequestListCountProvider`. It resets its own state in place when the signed-in user changes, so sign-out or a different user starts empty. *(Amended during implementation: it was originally keyed by user id, but a key would remount every route beneath it and break the shell's role-change redirect, spec 003 FR-017b; `check-shell` caught it.)* | FR-004a: session lifetime, cleared on sign-out. |
| D2 | The provider **writes** the shell count (`setCount(lines.length)`) in an effect, as the interim provider does. The count context is unchanged. | Spec 003 FR-015 made the count a shell-owned seam. The list is the only writer, so FR-005 holds by construction. |
| D3 | The drawer's open state lives in the provider. The top-bar marker calls `openList()`. When not on `/catalog`, `AppLayout` navigates to `/catalog` and then opens. The drawer renders only inside `CatalogPage`. | FR-006 draws it over the Catalog. FR-006a allows only the marker to open it, and the marker exists on every route. Today the marker navigates to `/requests` as a stand-in (spec 003); that is retired. On close, focus goes back to the top-bar marker explicitly, not to whatever `SidePanel` recorded at mount. After a route change that would be `<body>` (Story 1 AC7). *(Amended 2026-09-25, review cycle 1: the marker's attribute and the query that finds it live together in `src/shared/ui/layout/request-list-marker.ts` (`focusRequestListMarkerIfIdle`), so the drawer no longer queries the shell's DOM itself. And because the open flag lives above the routes, `AppLayout` clears it on the transition **off** `/catalog` — browser Back included — so the next visit does not open the drawer by itself. It is keyed to the transition, not to an unmount cleanup, because the marker pressed elsewhere opens the list before the Catalog mounts, and StrictMode's rehearsal unmount would close it.)* |
| D4 | The `RequestListDraft` seam keeps its one method, `add(item, quantity)`. Merge-and-cap moves into the real provider (FR-002). `CatalogItemCard` and `ViewSpecsPanel` are unchanged. | `request-draft.ts` was written so this swap needs no page change. It moves to `src/features/requests/create/`, with the catalog importing it from there. |
| D5 | A line stores `assetId`, `category`, `name`, `model`, `quantity` and `available` (the last-read bound). | The drawer row draws the category as an eyebrow over the name (`03 - Request List` since 2026-09-23; spec FR-006 as amended). `model` is not drawn and nothing reads it today — the read-back description comes from the returned request (D8a). It is kept, with `name`, as the SPA-side display data D8a's accepted risk may need if the live 201 is thin; it is never sent (FR-017). `available` is what FR-003 bounds the `+` against. |
| D6 | On each drawer open, read `CatalogSource.items(homeOffice)` and refresh every line's `available`. A line's `quantity` is never lowered by a read. | FR-006b and FR-003. The drawer reads the **home** office, not the Catalog's selected office, because the request is made from home (spec 005 FR-014). |
| D7 | The drawer is one `SidePanel` with a discriminated state: `editing`, `submitting`, or `submitted(request)`. `submitting` disables the steppers, Remove, the note and Submit, and labels the button *Submitting…*. Closing the drawer from `submitted` returns it to `editing`. What was sent is already out of the list (D18), so the next open shows the empty state unless an item was added mid-submit (Story 3 AC6). *(Amended 2026-09-25, review cycle 1: while `submitting` the drawer cannot be closed — `SidePanel` gained an optional `dismissible` prop, default `true`, that makes ✕, Esc and the scrim inert — so the confirmation cannot be lost to a close mid-submit. The one-submit guard is the session list's (`beginSubmit` / `endSubmit` in the provider), not the drawer's, so no remount can start a second submit.)* *(Amended 2026-09-25, review cycle 2: `submitting` and `submitted(request)` are held by the session list, not the drawer — `endSubmit(created?)` clears the list and holds the created request as `submitted`, whether or not a drawer is mounted. Browser Back mid-submit still leaves the Catalog, and leaving closes the drawer (FR-006a) — it does not auto-open on the way back — but the confirmation is no longer lost: the next open from the marker shows it, with the returned id. Closing the confirmation dismisses it (`dismissSubmitted`), and only then does the next open show the empty state. A confirmation held for one signed-in user is dropped when the user changes.)* *(Amended 2026-09-25, review cycle 3: a refusal is held the same way. The placed messages (D14, D15) live in the session list, not the drawer, so a refusal that settles after Back closed the drawer is shown — alert, placed messages, focus on the first — the next time the marker opens it. They are cleared when a new submit starts, when a submit succeeds, when the user changes, and field by field as the Employee edits what they name; closing the drawer keeps them. `beginSubmit()` returns a ticket and `endSubmit(ticket, { created } \| { problems })` settles it; the ticket is dropped when the signed-in user changes, which frees the one-submit slot for the next user and makes the earlier user's late answer a no-op — no confirmation, refusal or `Submitting…` crosses users. For one user, FR-010's single-submit guard is unchanged.)* The note is a plain `<textarea>` styled as the drawn `Purpose field`, not `TextField`: `TextField` is a single-line input, where Enter would submit the form. | BEN-57 constraint 5 (the confirmation is a state, not a toast), plus FR-010 and FR-010a. |
| D8 | `RequestSubmitSource.submit({ lines: [{ assetId, quantity }], note? })` returns `SubmitResult`: `{ ok: true, request: EmployeeRequest }`, or `{ ok: false, reason: 'invalid', problems: FieldProblem[] }`, or `{ ok: false, reason: 'refused', message: string }`, or `{ ok: false, reason: 'unreachable' }`. | These are SPA-internal outcomes, not error codes. `refused.message` is the API's own text, verbatim (FR-014). The lines go in the list's order, so `#/items/N` maps back to row N. |
| D8a | `SubmittedView` builds each Items Requested row from the returned line, through `RequestReadBack`, keyed by position: `EmployeeRequest` lines carry no id of their own and the list never reorders, so the index is stable (no id is invented in the shared read model). Names, descriptions and quantities are read from the **returned** request, never from the draft. *(Amended 2026-09-25, review cycle 3: an earlier version said a live mapper would fill `name` and `model` from the submitted draft. It cannot — `RequestSubmitSource.submit` receives only `assetId` + `quantity` per line. If the live 201 turns out to carry only `assetId` + `quantity`, the seam will need the display names alongside the draft — kept SPA-side and never sent (FR-017) — or a follow-up read of the created request. Which one is decided when the 201 is published, not designed now against an unpublished body (VII).)* | The confirmation shows what the system recorded (SC-005). A thin success body is an open risk, not a solved one (Known Risks 1). |
| D9 | The success value reuses spec 007's `EmployeeRequest` read model. | The confirmation draws exactly what 007's panel draws (id, pill, Items Requested, note, timeline). One read model means one `requestTimeline` mapping. |
| D10 | Extract the read-back body of `RequestDetailPanel` (Items Requested table, Note to Approver block, Status section) into `src/features/requests/detail/RequestReadBack.tsx`. Both panels render it; 007's markup and behaviour are unchanged by the extraction commit (`df66022`), which was byte-identical. *(Later styling on this branch — QTY column, heading type, note card, `StatusTimeline` — follows drift-2026-09-24 §10 and additions.md §3f, and changes both panels on purpose; it is recorded as a spec 007 amendment dated 2026-09-25.)* | Two copies of the same drawn block would drift. This is a needed extraction for reuse, not a drive-by refactor. The 007 check script guards it. |
| D11 | Add a module-scoped seeded stock store, `src/features/catalog/seeded-stock.ts` (`available(assetId, office)`, `reserve(lines, office)`). `seeded-source.ts` reads from it, and the seeded submit reserves into it. | Without shared stock, SC-002 (Available falls by the quantity) cannot be demonstrated before the backend ships. Reserve is all-or-nothing: check every line, then apply. |
| D12 | The seeded submit also appends the created request to the seeded Employee request store (spec 007), so it appears in My Requests. | Makes the demo path continuous (Catalog → My Requests → View details) with no extra UI. **Seeded-only glue:** the live source drops it, because the API owns the request list. BEN-44 owns My Requests, and this adds nothing to its UI. |
| D13 | Validation parser: `parseValidationProblem(body: unknown): FieldProblem[] \| null` and `pointerPath(pointer: string): string[]`. It handles the fragment form (`#/…`) with percent-decoding and plain form (`/…`), plus RFC 6901 `~1`/`~0` unescaping. A body that is not an RFC 9457 `validation-error` with `errors[]` returns `null`. *(Amended 2026-09-26, PR review: #41 (BEN-48) wrote the same T003a module with `ValidationProblem`, `isValidationProblem`, `pointerToField` and `fieldErrors`. Those names are exported here too, each a thin layer over the two functions above, so the two PRs share one parser and #41's panels import it unchanged.)* | BEN-57 constraint 4. H3/H4 reuse it, so it knows nothing about requests. |
| D14 | Placement: `#/purpose` goes under the note. `#/items/N/…` goes under row N. Anything else (`#/items`, `#/`, unknown) goes in one alert at the top of the drawer, deduplicated by `detail`. | FR-013 and FR-013a. The contract's own example repeats identical `detail`s, so deduplication keeps the drawer readable. |
| D15 | Top-of-drawer messages (`refused`, `unreachable`, unplaced validation) use the `role="alert"` block spec 007 uses for refusals, now one shared piece, `src/features/requests/detail/RefusalAlert.tsx`, rendered by both panels. Nothing is cleared from the lines or note (FR-015). After a refusal, focus moves to the first thing needing attention in reading order — the alert, a line, the note — and a line's message describes its controls. The same happens when the drawer opens onto a refusal held since it was closed (D7, review cycle 3). | Reuse of one treatment, as one component, so the two panels cannot drift. |
| D16 | **Note to Approver (optional)** keeps its drawn label and maps to the contract's `purpose`. Whitespace-only is sent as absent. | Drift-2026-09-22 §8 (label as drawn). Constitution VII (the field is `purpose`). |
| D17 | The **empty state** is plain body copy in the drawer, *"Your request list is empty. Add supplies from the catalog."*, logged in `docs/design-system/additions.md`. | The design draws no empty drawer. BEN-58 requires one. |
| D18 | After success: clear the list, which sets the count to 0 through D2, and re-read the Catalog. `reload` is on every `CatalogState` (a read in flight may predate the reserve, so it is dropped and restarted, and a `failed` catalog is retried). *(Amended 2026-09-25, review cycle 2: the `failed` state's separate `retry` was the same callback under a second name; it is folded into `reload`.)* *(Amended 2026-09-26, review-fix cycle 1: "clear the list" means take out what was sent. `beginSubmit(sent)` records the submitted `{ assetId, quantity }` lines and the note with the ticket; a successful `endSubmit` subtracts those quantities, drops lines that reach 0, and clears the note only if it is still the one sent. An item added after Back mid-submit (D7) was never sent and survives. Gated in `scripts/check-request-list.mjs`.)* *(Amended 2026-09-26, review-fix cycle 4: the re-read is keyed on a `submissions` success counter in the session's Request List, not on a drawer callback. A submit that lands after Back mid-submit (D7) and a return to the Catalog must re-read the Catalog mounted then, not the unmounted one the drawer was opened from. Not on mount. Gated in `scripts/check-request-list.mjs`.)* | FR-011. `CatalogProvider` already has an `attempt` counter to reuse. |
| D19 | A dev-only fixture hook, `window.__osrs.submitFixture`, compiled out of production like the gallery. When set, the seeded source returns that exact problem body once. The check script feeds it the contract's documented 400 example, verbatim. | The UI cannot produce a contract 400 by itself, because the steppers and types prevent it. This is the only way to prove FR-013/13a end to end before the live source. BEN-60 still requires a real 400 once live. |

## Data Model

Feature-local types. None is a backend shape.

```ts
// src/features/requests/create/request-list-types.ts
type RequestListLine = { assetId: string; category: string; name: string; model: string; quantity: number; available: number };
type RequestListDraftInput = { lines: { assetId: string; quantity: number }[]; note?: string };

// src/shared/validation.ts
type FieldProblem = { path: string[]; detail: string };   // path = decoded JSON Pointer segments

// src/features/requests/create/request-submit-source.ts
type SubmitResult =
  | { ok: true; request: EmployeeRequest }                 // spec 007 read model
  | { ok: false; reason: 'invalid'; problems: FieldProblem[] }
  | { ok: false; reason: 'refused'; message: string }       // API's own message
  | { ok: false; reason: 'unreachable' };
interface RequestSubmitSource { submit(user: User, draft: RequestListDraftInput): Promise<SubmitResult> }
```

`EmployeeRequest` (spec 007) is unchanged. The seeded submit fills `id` with the
next `REQ-2026-NNNN`, `status: 'Pending Approval'`, `submittedAt: now`, and
`lines[].description` as `"<name> - <model>"`, as 007's seed does.

## API Contracts

Only what the live Swagger publishes (read 2026-09-25):

- `POST /requests`, body `CreateRequestDto { purpose?: string; items: { assetId: number; quantity: number }[] }`. There is no office field.
- `400 application/problem+json`: `{ type: 'validation-error', title, status, errors[]: { detail, pointer } }`.
- **Not published:** the success body, and any insufficient-stock refusal. Tracked as conflict 4 in `specs/001-office-supplies-mvp/contracts/README.md`.

This feature adds **no HTTP call**. `RequestSubmitSource` is a UI seam. When the
contract publishes, a live source gets written in the same folder:

- `assetId` string → number;
- the 201 body → `EmployeeRequest`;
- the 400 → `parseValidationProblem`;
- the documented stock refusal → `refused` with its own message;
- a network failure → `unreachable`.

`src/shared/api.ts` (tasks T002) is not created here.

## Component / Module Breakdown

**New — `src/features/requests/create/`** (owned by BEN-43)

- `request-draft.ts`: moved from `src/features/catalog/`. It keeps the `RequestListDraft` seam (`add`) and gains `useRequestList()`, which returns `lines`, `note`, `setNote`, `setQuantity`, `remove`, `refreshAvailability`, `isOpen`, `openList`, `closeList`, the session's one-submit guard `beginSubmit(sent)` (a ticket, or `null` while one is in flight) / `endSubmit(ticket, { created } | { problems })` — which on success also takes what was sent out of the list (D18) — and the held `submitting` / `submitted` / `dismissSubmitted` and `problems` / `refusals` / `editProblems` (D7).
- `RequestListProvider.tsx`: session-scoped state, merge-and-cap on `add` (D4), count sync (D2), open state (D3).
- `request-list-types.ts`: the types above.
- `request-submit-source.ts`: the seam and `SubmitResult`.
- `seeded-request-submit-source.ts`: validates all lines against `seeded-stock` at the user's home office. It refuses with its own message if any line's quantity is not a whole number of at least 1, with a stock message if any asset's lines exceed Available, otherwise reserves all lines, creates the request and appends it to the 007 store (D11, D12, D19).
- `RequestListDrawer.tsx`: the `SidePanel`, header icon and `Request List` (no count in the header — the count is the top bar's, D2), and the editing / submitting / submitted states (D7).
- `RequestListLineRow.tsx`: the category eyebrow over the name (bold), the `− qty +` stepper bounded by `1…available` (D6), **Remove**, and the line's validation message.
- `SubmittedView.tsx`: the success card (check icon, *Request submitted*, drawn copy) plus `RequestReadBack`.
- `place-problems.ts`: D14's placement from `FieldProblem[]` to `{ note?: string[]; lines: Record<number, string[]>; drawer: string[] }`.

**New — shared**

- `src/shared/validation.ts`: D13.

**Modified**

- `src/app/App.tsx`: mount `RequestListProvider`, not keyed; it resets in place (D1).
- `src/app/AppLayout.tsx`: `onOpenRequestList` opens the list, navigating to `/catalog` first when elsewhere; leaving `/catalog` closes it (D3).
- `src/shared/ui/overlay/SidePanel.tsx`: optional `dismissible` (D7); Tab with nothing enabled stays on the dialog.
- `src/shared/ui/layout/TopBar.tsx` and `request-list-marker.ts`: the marker's attribute and `focusRequestListMarkerIfIdle` (D3).
- `src/features/catalog/CatalogPage.tsx`: drop `RequestListDraftProvider`, render `RequestListDrawer` when `isOpen`, and pass `homeOffice` and the source.
- `src/features/catalog/catalog-context.ts` and `CatalogProvider.tsx`: one `reload` on every state, replacing `failed`'s `retry` (D18).
- `src/features/catalog/seeded-source.ts`: read Available from `seeded-stock.ts` (D11).
- `src/features/catalog/CatalogItemCard.tsx` and `ViewSpecsPanel.tsx`: the import path of `useRequestListDraft` only.
- `src/features/requests/detail/RequestDetailPanel.tsx`: render `RequestReadBack` (D10) and `RefusalAlert` (D15).
- `src/features/requests/detail/seeded-employee-request-source.ts`: export an `appendSeededRequest(user, request)` for D12.

**Deleted**

- `src/features/catalog/RequestListDraftProvider.tsx` (the interim provider).

**Docs**

- `specs/003-app-shell-routing/spec.md`: an amendment recording that the request-list marker now opens the drawer (D3), replacing the `/requests` stand-in.
- `scripts/check-catalog.mjs` and `scripts/check-shell.mjs`: unchanged. Neither asserted what D3 and D4 change, and both pass as they are. A repeat add not raising the badge (FR-002) and the marker opening the drawer (D3) are asserted in `scripts/check-request-list.mjs` (T011).
- `docs/design-system/additions.md`: the empty drawer (D17), and the marker now opening the drawer rather than going to `/requests`.
- `scripts/check-request-list.mjs`, registered in `scripts/verify.mjs`. It checks:
  - add, merge, cap, Remove, and the count at every step;
  - close and reopen;
  - leaving and returning to the Catalog;
  - sign-out clearing the list;
  - submit with and without a note, then the confirmation fields;
  - Catalog Available falling by the quantity;
  - a multi-line over-stock refusal with nothing reserved;
  - the contract's 400 example placed per D14 through the fixture (D19);
  - no drawer or marker for the Admin.

## Delivery order

1. **Extract `RequestReadBack` first**, as its own commit, with 007's DOM byte-identical (done: `df66022`; later styling is recorded in spec 007's 2026-09-25 amendment). Prove it with `check-request-detail.mjs` before anything else lands. This keeps the conflict window with BEN-44 and BEN-47 small (Known Risks 4).
2. `src/shared/validation.ts` and `place-problems.ts`.
3. `seeded-stock.ts`, the catalog `reload`, and the provider and draft move. Re-run the catalog and shell checks at this step. *(Both passed unchanged; the merge rule and the marker are asserted in `check-request-list.mjs` — see T011.)*
4. The drawer (editing), then submit and the submitted state.
5. `check-request-list.mjs`. It **reloads before any assertion on seeded numbers**, and asserts Available as **deltas** from a reading taken in the same load, never as absolutes (Known Risks 5).

## Project Structure

```
src/
├── app/App.tsx, AppLayout.tsx                  (modified)
├── shared/validation.ts                        (new)
└── features/
    ├── catalog/
    │   ├── seeded-stock.ts                     (new)
    │   ├── seeded-source.ts, catalog-context.ts, CatalogProvider.tsx, CatalogPage.tsx  (modified)
    │   └── RequestListDraftProvider.tsx         (deleted)
    └── requests/
        ├── create/                             (new — BEN-43)
        │   ├── request-draft.ts  request-list-types.ts  request-submit-source.ts
        │   ├── seeded-request-submit-source.ts  place-problems.ts
        │   └── RequestListProvider.tsx  RequestListDrawer.tsx  RequestListLineRow.tsx  SubmittedView.tsx
        └── detail/
            ├── RequestReadBack.tsx             (new, extracted)
            └── RequestDetailPanel.tsx, seeded-employee-request-source.ts  (modified)
scripts/check-request-list.mjs                  (new)
```

## Requirement Coverage

| Spec | Where |
|------|-------|
| FR-001, FR-002, FR-004, FR-004a | `RequestListProvider` (D1, D4) |
| FR-003, FR-006b | `RequestListLineRow`, drawer open read (D6) |
| FR-005 | D2 |
| FR-006, FR-006a, FR-006c | `RequestListDrawer` on `SidePanel` (D3) |
| FR-007 | Empty state (D17). Submit disabled when there are no lines |
| FR-008, FR-009 | One `submit` call with all lines. Seeded reserve is all-or-nothing (D11) |
| FR-010, FR-010a | `submitting` state (D7) |
| FR-011 | D18 |
| FR-012 | `SubmittedView` + `RequestReadBack` (D9, D10) |
| FR-013, FR-013a | `validation.ts` + `place-problems.ts` (D13, D14, D19) |
| FR-014, FR-015 | `refused.message` verbatim; state untouched on failure (D8, D15) |
| FR-016 | Marker and `add` are Employee-only already. The drawer renders only for `role === 'employee'` |
| FR-017 | `RequestListDraftInput` carries nothing `CreateRequestDto` does not (lines as asset + quantity, the note); the live source maps it to the wire names and types — `items`, numeric `assetId`, `purpose` (D16) |

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Implements spec 010. Every decision maps to an FR |
| II. Two roles | PASS | Employee-only list, marker and submit |
| III. Inventory integrity | PASS | Nothing reserved before submit. Seeded reserve is all-or-nothing and never negative. Total is untouched |
| IV. State machine | PASS | Creates `Pending Approval` only |
| V. Notifications | PASS | API's job. The confirmation copy promises email, as drawn |
| VI. Testable increments | PASS | Demonstrable end to end on seeded sources. The CDP check covers the stories |
| VII. Typed contracts | PASS | No HTTP added. The input mirrors `CreateRequestDto`. Refusal text passes through verbatim. The gap is logged as conflict 4 |
| VIII. MVP restraint | PASS | No new dependency. The dev fixture is compiled out of production |
| IX. Secrets | PASS | Seeded data only |

## Known Risks

| # | Risk | Status |
|---|------|--------|
| 1 | The live 201 body is thinner than `EmployeeRequest` (no line names). | **Accepted — open until the 201 schema is published** (contract conflict 4). The submit seam carries no names today; D8a records the two ways out |
| 2 | Nested validation failures arrive as bare `#/items`, as in the contract's example, so per-line placement (D14) never fires and item errors show at the top of the drawer. | **Accepted.** Nothing is dropped and SC-003 holds. Revisit when C4 captures a real 400 |
| 3 | The merge rule and the marker change break existing gates (`check-catalog`, `check-shell`). | **Mitigated**: both gates pass unchanged, because neither asserted what changed (`check-catalog` adds each item once; `check-shell` never follows the marker). The new behaviour is gated in `check-request-list.mjs` instead (T011), and spec 003 is amended |
| 4 | Extracting `RequestReadBack` conflicts with concurrent work on `requests/detail/`. | **Mitigated**: extraction first, DOM-identical in that commit, proven by `check-request-detail`. Later drift-driven styling is a recorded spec 007 amendment, not a silent change |
| 5 | Module-scoped seeded stock and requests leak between assertions. | **Mitigated**: reload before absolute reads; the new check asserts deltas |

## Analysis Overrides

None. The three analysis items (focus return after a route change, confirmation close, D12 scope) were fixed in D3, D7 and D12.
