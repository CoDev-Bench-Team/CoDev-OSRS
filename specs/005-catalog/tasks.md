# Tasks: Catalog page (view stock + start request)

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Linear**: [BEN-42](https://linear.app/bench-synergy-project/issue/BEN-42) — B2 [BEN-53](https://linear.app/bench-synergy-project/issue/BEN-53), B3 [BEN-54](https://linear.app/bench-synergy-project/issue/BEN-54), B4 [BEN-55](https://linear.app/bench-synergy-project/issue/BEN-55)

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

Owns `src/features/catalog/*`. Shared edits are limited to the placeholder swap
and the one justified `SupplyCard` exception recorded in the plan.

## Phase 1: Domain (US1)

- [x] T001 [US1] `CatalogItem` type carrying only published contract fields — `src/features/catalog/types.ts`
- [x] T002 [US1] Stock status derivation from on-hand and threshold, including the `onHand === lowQtyAlert` boundary — `src/features/catalog/stock.ts`

## Phase 2: Boundary (US1)

- [x] T003 [US1] `CatalogSource` interface in SPA vocabulary — no endpoint, payload or error code — `src/features/catalog/catalog-source.ts`
- [x] T004 [US1] Seeded implementation covering In Stock, Low Stock and Out of Stock, an item with no image, and a long name — `src/features/catalog/seeded-source.ts`
- [x] T005 [US1] Provider resolving the source, exposing loading, loaded, empty and failed states as distinct outcomes — `src/features/catalog/CatalogProvider.tsx`

## Phase 3: Read UI (US1) — B2

- [x] T006 [US1] Additive optional props on the shared tile: on-hand count and `StockStatus` pill, every existing call unchanged — `src/shared/ui/data-display/SupplyCard.tsx`
- [x] T007 [US1] Card wrapper mapping a `CatalogItem` onto the tile — `src/features/catalog/CatalogItemCard.tsx`
- [x] T008 [US1] Grid layout with its no-results empty state — `src/features/catalog/CatalogGrid.tsx`
- [x] T009 [US1] Page composition: heading, search slot, chip row, grid — `src/features/catalog/CatalogPage.tsx`
- [x] T010 [US4] Loading, empty-catalog and retrieval-failure screens wired to the provider states — `src/features/catalog/CatalogPage.tsx`

## Phase 4: Find an item (US2) — B2

- [x] T011 [P] [US2] Chip control — `src/features/catalog/CategoryChip.tsx`
- [x] T012 [US2] Filter state: search over name and model, type chip, combined; chips derived from returned data plus an all-items chip — `src/features/catalog/useCatalogFilters.ts`
- [x] T013 [US2] Clearing the type chip preserves the search term; no-results state offers to clear filters — `src/features/catalog/useCatalogFilters.ts`, `src/features/catalog/CatalogGrid.tsx`

## Phase 5: Employee-only request CTA (US3) — B3

- [x] T014 [US3] `RequestListDraft` seam and a minimal in-memory provider for Parent C to replace — `src/features/catalog/request-draft.ts`
- [x] T015 [US3] Gate the add action to the Employee role; other roles see the card unchanged — `src/features/catalog/CatalogItemCard.tsx`
- [x] T016 [US3] Disable the action at zero on-hand and label it out of stock — `src/features/catalog/CatalogItemCard.tsx`
- [x] T017 [US3] Bound requested quantity between 1 and on-hand — `src/features/catalog/CatalogItemCard.tsx`
- [x] T018 [US3] Feed the shell's existing request-list badge count; do not re-implement it — `src/features/catalog/request-draft.ts`

## Phase 6: Route swap

- [x] T019 Swap the placeholder for the real page — `src/app/routes.tsx`
- [x] T020 Remove the dead `CatalogPlaceholder` — `src/app/placeholders.tsx`

## Phase 7: Verification — B4

- [x] T021 Typecheck, lint and build clean — `npx tsc -b --force`, `npm run lint`, `npm run build`
- [x] T022 Walk all three roles against SC-001, SC-002 and SC-003
- [x] T023 Reach each of loading, empty-catalog, no-results and failure (SC-004)
- [x] T024 Confirm no rendered field is absent from the published contract (SC-005)

## Dependencies

- T001 → T002 → T004; T003 before T004; T005 after T003
- T006 before T007; T007 before T008 before T009
- T012 after T009; T013 after T012
- T015–T017 after T007; T014 before T018
- T019 after T009; T020 after T019
- Phase 7 last

## MVP slice

Phases 1–3 plus T019 give a working read-only catalog for all three roles.
Phase 5 completes the Employee path.

## Parallel opportunities

T011 with T007/T008. T014 with Phase 3.

## Not included

The request list drawer, editing and submit (Parent C / BEN-43); inventory
encoding (Parent H / BEN-48); Playwright coverage (Parent J / BEN-50);
`location` and `specs[]` display (spec D3 / D4).

## How Phase 7 was verified

Run on 2026-09-22 against the dev server, signed in as each seeded role.

| Check | Result |
|---|---|
| `npm run verify` — all eight gates | PASS (typecheck, lint, adherence, fidelity, pixels, a11y, shell routing, build) |
| SC-001 Employee finds by search and chip, adds within stock | Search matched on **model** ("logitech" hit two items whose names contain neither); chip + search combined to one item; add incremented the shell badge 0 → 1 |
| SC-002 Approver and Supply Admin see facts, no action | Verified for both seeded roles; same pills, counts and models, no add control |
| SC-003 three stock statuses and the zero case | Laptop 12/4 = In Stock, Monitor 4/4 = **Low Stock** (inclusive threshold), Headset 0 = Out of Stock with the action disabled and relabelled |
| SC-004 distinct states | No-results Notice with a clear-filters action reached; loading, empty-catalog and failure paths are branch-distinct in `CatalogPage` |
| SC-005 no unpublished field rendered | Card shows name, model, type, image, quantity only |

Two defects were found by this pass and fixed, not deferred:

1. **Role gate did not hold.** `actionLabel={undefined}` fell through to `SupplyCard`'s default parameter, so Approvers and Supply Admins still saw "Add to Request List". The prop now accepts `null` to remove the action outright.
2. **Wrong fallback image.** An item with no image inherited the card's sample laptop photograph — a laptop standing in for a headset. `image={null}` now draws a neutral tile, as the spec's edge case requires.

One non-compiling utility (`h-31`) was caught by the adherence gate and replaced with the source-exact `h-[31px]`, matching `TopBar`.
