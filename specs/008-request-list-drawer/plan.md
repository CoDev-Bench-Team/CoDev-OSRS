# Implementation Plan: Request List drawer & submit

**Date**: 2026-09-25
**Spec**: `specs/008-request-list-drawer/spec.md`
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
| D1 | `RequestListProvider` mounts in `App.tsx`, inside `RequestListCountProvider` and keyed by the signed-in user's id, so it resets on sign-out or a user change. | FR-004a: session lifetime, cleared on sign-out. Keying by user makes a second sign-in start empty without explicit clear calls. |
| D2 | The provider **writes** the shell count (`setCount(lines.length)`) in an effect, as the interim provider does. The count context is unchanged. | Spec 003 FR-015 made the count a shell-owned seam. The list is the only writer, so FR-005 holds by construction. |
| D3 | The drawer's open state lives in the provider. The top-bar marker calls `openList()`. When not on `/catalog`, `AppLayout` navigates to `/catalog` and then opens. The drawer renders only inside `CatalogPage`. | FR-006 draws it over the Catalog. FR-006a allows only the marker to open it, and the marker exists on every route. Today the marker navigates to `/requests` as a stand-in (spec 003); that is retired. On close, focus goes back to the top-bar marker explicitly, not to whatever `SidePanel` recorded at mount. After a route change that would be `<body>` (Story 1 AC7). |
| D4 | The `RequestListDraft` seam keeps its one method, `add(item, quantity)`. Merge-and-cap moves into the real provider (FR-002). `CatalogItemCard` and `ViewSpecsPanel` are unchanged. | `request-draft.ts` was written so this swap needs no page change. It moves to `src/features/requests/create/`, with the catalog importing it from there. |
| D5 | A line stores `assetId`, `name`, `model`, `quantity` and `available` (the last-read bound). | The drawer row draws name over model (`03 - Request List`). `available` is what FR-003 bounds the `+` against. |
| D6 | On each drawer open, read `CatalogSource.items(homeOffice)` and refresh every line's `available`. A line's `quantity` is never lowered by a read. | FR-006b and FR-003. The drawer reads the **home** office, not the Catalog's selected office, because the request is made from home (spec 005 FR-014). |
| D7 | The drawer is one `SidePanel` with a discriminated state: `editing`, `submitting`, or `submitted(request)`. `submitting` disables the steppers, Remove, the note and Submit, and labels the button *Submitting…*. Closing the drawer from `submitted` returns it to `editing`. The list is already empty (D18), so the next open shows the empty state (Story 3 AC6). | BEN-57 constraint 5 (the confirmation is a state, not a toast), plus FR-010 and FR-010a. |
| D8 | `RequestSubmitSource.submit({ lines: [{ assetId, quantity }], note? })` returns `SubmitResult`: `{ ok: true, request: EmployeeRequest }`, or `{ ok: false, reason: 'invalid', problems: FieldProblem[] }`, or `{ ok: false, reason: 'refused', message: string }`, or `{ ok: false, reason: 'unreachable' }`. | These are SPA-internal outcomes, not error codes. `refused.message` is the API's own text, verbatim (FR-014). The lines go in the list's order, so `#/items/N` maps back to row N. |
| D8a | `SubmittedView` builds each Items Requested row from the returned line, keyed by `assetId`. When the live 201 carries only `assetId` and `quantity`, the live mapper fills `name` and `model` from the submitted draft's line for that `assetId`. | Those names are Catalog-published, not invented (VII), and the quantity still comes from the created request (SC-005). This guards against a thin success body (Known Risks 1). |
| D9 | The success value reuses spec 007's `EmployeeRequest` read model. | The confirmation draws exactly what 007's panel draws (id, pill, Items Requested, note, timeline). One read model means one `requestTimeline` mapping. |
| D10 | Extract the read-back body of `RequestDetailPanel` (Items Requested table, Note to Approver block, Status section) into `src/features/requests/detail/RequestReadBack.tsx`. Both panels render it; 007's markup and behaviour are unchanged. | Two copies of the same drawn block would drift. This is a needed extraction for reuse, not a drive-by refactor. The 007 check script guards it. |
| D11 | Add a module-scoped seeded stock store, `src/features/catalog/seeded-stock.ts` (`available(assetId, office)`, `reserve(lines, office)`). `seeded-source.ts` reads from it, and the seeded submit reserves into it. | Without shared stock, SC-002 (Available falls by the quantity) cannot be demonstrated before the backend ships. Reserve is all-or-nothing: check every line, then apply. |
| D12 | The seeded submit also appends the created request to the seeded Employee request store (spec 007), so it appears in My Requests. | Makes the demo path continuous (Catalog → My Requests → View details) with no extra UI. **Seeded-only glue:** the live source drops it, because the API owns the request list. BEN-44 owns My Requests, and this adds nothing to its UI. |
| D13 | Validation parser: `parseValidationProblem(body: unknown): FieldProblem[] \| null` and `pointerPath(pointer: string): string[]`. It handles the fragment form (`#/…`) with percent-decoding and plain form (`/…`), plus RFC 6901 `~1`/`~0` unescaping. A body that is not an RFC 9457 `validation-error` with `errors[]` returns `null`. | BEN-57 constraint 4. H3/H4 reuse it, so it knows nothing about requests. |
| D14 | Placement: `#/purpose` goes under the note. `#/items/N/…` goes under row N. Anything else (`#/items`, `#/`, unknown) goes in one alert at the top of the drawer, deduplicated by `detail`. | FR-013 and FR-013a. The contract's own example repeats identical `detail`s, so deduplication keeps the drawer readable. |
| D15 | Top-of-drawer messages (`refused`, `unreachable`, unplaced validation) use the `role="alert"` block spec 007 draws for refusals. Nothing is cleared from the lines or note (FR-015). | Reuse of a drawn treatment. No new component. |
| D16 | **Note to Approver (optional)** keeps its drawn label and maps to the contract's `purpose`. Whitespace-only is sent as absent. | Drift-2026-09-22 §8 (label as drawn). Constitution VII (the field is `purpose`). |
| D17 | The **empty state** is plain body copy in the drawer, *"Your request list is empty. Add supplies from the catalog."*, logged in `docs/design-system/additions.md`. | The design draws no empty drawer. BEN-58 requires one. |
| D18 | After success: clear the list, which sets the count to 0 through D2, and call the Catalog's `reload()`. Add `reload` to `CatalogState['ready']`. | FR-011. `CatalogProvider` already has an `attempt` counter to reuse. |
| D19 | A dev-only fixture hook, `window.__osrs.submitFixture`, compiled out of production like the gallery. When set, the seeded source returns that exact problem body once. The check script feeds it the contract's documented 400 example, verbatim. | The UI cannot produce a contract 400 by itself, because the steppers and types prevent it. This is the only way to prove FR-013/13a end to end before the live source. BEN-60 still requires a real 400 once live. |

## Data Model

Feature-local types. None is a backend shape.

```ts
// src/features/requests/create/request-list-types.ts
type RequestListLine = { assetId: string; name: string; model: string; quantity: number; available: number };
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

- `request-draft.ts`: moved from `src/features/catalog/`. It keeps the `RequestListDraft` seam (`add`) and gains `useRequestList()`, which returns `lines`, `note`, `setNote`, `setQuantity`, `remove`, `clear`, `isOpen`, `openList` and `closeList`.
- `RequestListProvider.tsx`: session-scoped state, merge-and-cap on `add` (D4), count sync (D2), open state (D3).
- `request-list-types.ts`: the types above.
- `request-submit-source.ts`: the seam and `SubmitResult`.
- `seeded-request-submit-source.ts`: validates all lines against `seeded-stock` at the user's home office. It refuses with a stock message if any line exceeds Available, otherwise reserves all lines, creates the request and appends it to the 007 store (D11, D12, D19).
- `RequestListDrawer.tsx`: the `SidePanel`, header `Request List` plus count, and the editing / submitting / submitted states (D7).
- `RequestListLineRow.tsx`: the name (bold) over the model, the `− qty +` stepper bounded by `1…available` (D6), **Remove**, and the line's validation message.
- `SubmittedView.tsx`: the success card (check icon, *Request submitted*, drawn copy) plus `RequestReadBack`.
- `place-problems.ts`: D14's placement from `FieldProblem[]` to `{ note?: string[]; lines: Record<number, string[]>; drawer: string[] }`.

**New — shared**

- `src/shared/validation.ts`: D13.

**Modified**

- `src/app/App.tsx`: mount `RequestListProvider` keyed by user id (D1).
- `src/app/AppLayout.tsx`: `onOpenRequestList` opens the list, navigating to `/catalog` first when elsewhere (D3).
- `src/features/catalog/CatalogPage.tsx`: drop `RequestListDraftProvider`, render `RequestListDrawer` when `isOpen`, and pass `homeOffice` and the source.
- `src/features/catalog/catalog-context.ts` and `CatalogProvider.tsx`: add `reload` to the `ready` state (D18).
- `src/features/catalog/seeded-source.ts`: read Available from `seeded-stock.ts` (D11).
- `src/features/catalog/CatalogItemCard.tsx` and `ViewSpecsPanel.tsx`: the import path of `useRequestListDraft` only.
- `src/features/requests/detail/RequestDetailPanel.tsx`: render `RequestReadBack` (D10).
- `src/features/requests/detail/seeded-employee-request-source.ts`: export an `append(user, request)` for D12.

**Deleted**

- `src/features/catalog/RequestListDraftProvider.tsx` (the interim provider).

**Docs**

- `specs/003-app-shell-routing/spec.md`: an amendment recording that the request-list marker now opens the drawer (D3), replacing the `/requests` stand-in.
- `scripts/check-catalog.mjs` and `scripts/check-shell.mjs`: update the assertions D3 and D4 change. A repeat add of the same item no longer raises the badge, and the marker opens the drawer. Each updated check cites spec 008 FR-002 / D3.
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

1. **Extract `RequestReadBack` first**, as its own commit, with 007's DOM byte-identical. Prove it with `check-request-detail.mjs` before anything else lands. This keeps the conflict window with BEN-44 and BEN-47 small (Known Risks 4).
2. `src/shared/validation.ts` and `place-problems.ts`.
3. `seeded-stock.ts`, the catalog `reload`, and the provider and draft move. Update the catalog and shell checks at this step.
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
| FR-017 | The `RequestListDraftInput` fields are exactly `CreateRequestDto`'s |

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Implements spec 008. Every decision maps to an FR |
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
| 1 | The live 201 body is thinner than `EmployeeRequest` (no line names). | **Mitigated**, D8a |
| 2 | Nested validation failures arrive as bare `#/items`, as in the contract's example, so per-line placement (D14) never fires and item errors show at the top of the drawer. | **Accepted.** Nothing is dropped and SC-003 holds. Revisit when C4 captures a real 400 |
| 3 | The merge rule and the marker change break existing gates (`check-catalog`, `check-shell`). | **Mitigated**: checks updated in the same PR, and a spec 003 amendment |
| 4 | Extracting `RequestReadBack` conflicts with concurrent work on `requests/detail/`. | **Mitigated**: extraction first, DOM-identical, proven by `check-request-detail` |
| 5 | Module-scoped seeded stock and requests leak between assertions. | **Mitigated**: reload before absolute reads; the new check asserts deltas |

## Analysis Overrides

None. The three analysis items (focus return after a route change, confirmation close, D12 scope) were fixed in D3, D7 and D12.
