# Tasks: Catalog page (view stock + start request)

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Linear**: [BEN-42](https://linear.app/bench-synergy-project/issue/BEN-42) — B2 [BEN-53](https://linear.app/bench-synergy-project/issue/BEN-53), B3 [BEN-54](https://linear.app/bench-synergy-project/issue/BEN-54), B4 [BEN-55](https://linear.app/bench-synergy-project/issue/BEN-55)

Format: `- [ ] [TaskID] [P?] [US?] Description — path`

Owns `src/features/catalog/*`. Shared edits are limited to the placeholder swap
and the one justified `SupplyCard` exception recorded in the plan.

## Phase 1: Domain (US1)

- [ ] T001 [US1] `CatalogItem` type carrying only published contract fields — `src/features/catalog/types.ts`
- [ ] T002 [US1] Stock status derivation from on-hand and threshold, including the `onHand === lowQtyAlert` boundary — `src/features/catalog/stock.ts`

## Phase 2: Boundary (US1)

- [ ] T003 [US1] `CatalogSource` interface in SPA vocabulary — no endpoint, payload or error code — `src/features/catalog/catalog-source.ts`
- [ ] T004 [US1] Seeded implementation covering In Stock, Low Stock and Out of Stock, an item with no image, and a long name — `src/features/catalog/seeded-source.ts`
- [ ] T005 [US1] Provider resolving the source, exposing loading, loaded, empty and failed states as distinct outcomes — `src/features/catalog/CatalogProvider.tsx`

## Phase 3: Read UI (US1) — B2

- [ ] T006 [US1] Additive optional props on the shared tile: on-hand count and `StockStatus` pill, every existing call unchanged — `src/shared/ui/data-display/SupplyCard.tsx`
- [ ] T007 [US1] Card wrapper mapping a `CatalogItem` onto the tile — `src/features/catalog/CatalogItemCard.tsx`
- [ ] T008 [US1] Grid layout with its no-results empty state — `src/features/catalog/CatalogGrid.tsx`
- [ ] T009 [US1] Page composition: heading, search slot, chip row, grid — `src/features/catalog/CatalogPage.tsx`
- [ ] T010 [US4] Loading, empty-catalog and retrieval-failure screens wired to the provider states — `src/features/catalog/CatalogPage.tsx`

## Phase 4: Find an item (US2) — B2

- [ ] T011 [P] [US2] Chip control — `src/features/catalog/CategoryChip.tsx`
- [ ] T012 [US2] Filter state: search over name and model, type chip, combined; chips derived from returned data plus an all-items chip — `src/features/catalog/useCatalogFilters.ts`
- [ ] T013 [US2] Clearing the type chip preserves the search term; no-results state offers to clear filters — `src/features/catalog/useCatalogFilters.ts`, `src/features/catalog/CatalogGrid.tsx`

## Phase 5: Employee-only request CTA (US3) — B3

- [ ] T014 [US3] `RequestListDraft` seam and a minimal in-memory provider for Parent C to replace — `src/features/catalog/request-draft.ts`
- [ ] T015 [US3] Gate the add action to the Employee role; other roles see the card unchanged — `src/features/catalog/CatalogItemCard.tsx`
- [ ] T016 [US3] Disable the action at zero on-hand and label it out of stock — `src/features/catalog/CatalogItemCard.tsx`
- [ ] T017 [US3] Bound requested quantity between 1 and on-hand — `src/features/catalog/CatalogItemCard.tsx`
- [ ] T018 [US3] Feed the shell's existing request-list badge count; do not re-implement it — `src/features/catalog/request-draft.ts`

## Phase 6: Route swap

- [ ] T019 Swap the placeholder for the real page — `src/app/routes.tsx`
- [ ] T020 Remove the dead `CatalogPlaceholder` — `src/app/placeholders.tsx`

## Phase 7: Verification — B4

- [ ] T021 Typecheck, lint and build clean — `npx tsc -b --force`, `npm run lint`, `npm run build`
- [ ] T022 Walk all three roles against SC-001, SC-002 and SC-003
- [ ] T023 Reach each of loading, empty-catalog, no-results and failure (SC-004)
- [ ] T024 Confirm no rendered field is absent from the published contract (SC-005)

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
