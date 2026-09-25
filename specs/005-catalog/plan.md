# Implementation Plan: Catalog page (view stock + start request)

**Branch**: `rockyc/ben-42-p2spa-catalog-page-view-stock-start-request`
**Date**: 2026-09-22 | **Spec**: [spec.md](spec.md) | **Linear**: [BEN-42](https://linear.app/bench-synergy-project/issue/BEN-42)
**Status**: Draft · **Amended**: 2026-09-25 — see spec Session 2026-09-25

## Summary

Replace the `/catalog` placeholder with the real catalog: a searchable,
type-filtered grid of supply cards showing on-hand stock, with an Employee-only
action that appends to a request list. The page reads through a **catalog
boundary** expressed in SPA vocabulary, exactly as spec 003 reads identity
through `SessionSource`, so no HTTP is invented while the contract is unwired.

## Technical Context

**Language**: TypeScript (strict), React 19, Tailwind 4 — as scaffolded
**Routing**: React Router v7, already mapped (`/catalog` exists and is guarded)
**Components**: spec 002 design system — `SupplyCard`, `StatusPill`, `Search`, `Select`, feedback screens
**Storage**: none in the SPA; catalog data comes from the boundary
**Testing**: `npm run verify` gates; Playwright deferred to Parent J
**Constraints**: constitution VII (no invented contract), BEN-42 folder ownership

## Blocking Preconditions

| Precondition | State |
|---|---|
| A6 / BEN-38 merged to `dev` | **Met** — shell, routes and guards are live |
| Spec 002 components exported | **Met** — `SupplyCard`, `StatusPill`, `Search` in the barrel |
| Assets contract published | **Met** — `specs/001-office-supplies-mvp/contracts/README.md` |

## Data Model

One domain type, named in product language, carrying only fields the published
Assets contract exposes.

| Field | Source | Notes |
|---|---|---|
| `id` | contract | Stable identifier |
| `name` | `name` | The specific item — one card per asset (D5) |
| `category` | `category` | Contract enum; drives the chips (D6) |
| `model` | `model` | Brand / model string; a View Specs row |
| `description` | `description` | Optional; a View Specs row |
| `image` | `imageBase64` | Optional; card falls back to a neutral tile |
| `specs` | `ram`, `storage`, `processor`, `graphics`, `operatingSystem` | Optional; rows chosen by category (FR-015) |
| `available` | `location`-scoped availability | Available at the selected office (FR-014) |
| `lowQtyAlert` | `lowQtyAlert` | Threshold for `Low in Stock` |

*(Amended 2026-09-25.)* The published assets list now takes a `location`
parameter that scopes availability to one office, and publishes `category` and
the spec fields as top-level properties. The 09-22 table above replaces the
`type` / `quantity` one.

### Stock status derivation

Single pure function, the only place the rule lives:

```
available <= 0              -> 'Out of Stock'
available <= lowQtyAlert    -> 'Low in Stock'
otherwise                   -> 'Available'
```

`StockStatus` and its tones already exist in `src/shared/ui/status.ts` (spec
002). This plan adds only the derivation, and puts it in the catalog feature
rather than in `shared/`, because Inventory (Parent H) is the second caller and
promoting it should be that feature's decision, not a speculative one here.

## Catalog Boundary

Mirrors `SessionSource` (spec 003 D3). The page never learns there is HTTP.

```ts
export interface CatalogSource {
  /** Every active item, with availability at that office. Rejects on
   *  failure — an empty catalog and an unreachable one are different outcomes. */
  items(office: CatalogOffice): Promise<CatalogItem[]>;
}
```

Today a seeded implementation satisfies it, using the same demo posture spec 003
established and constitution IX permits. When the Assets contract is wired, a
second implementation is written against it and **no page code changes**. Search
and type filtering are client-side over the returned set; pushing them into
query parameters would invent contract surface.

## Request List Handoff

The Employee action appends to a request list that Parent C (BEN-43) owns.
This feature must not build the drawer, the line editing, or submit. It exposes
the narrowest possible seam:

```ts
export interface RequestListDraft {
  add(item: CatalogItem, quantity: number): void;
}
```

A minimal in-memory provider satisfies it so Story 3 is demonstrable now; Parent
C replaces the provider with the real drawer state and the seam does not move.
The shell already ships a request-list badge count context from A5 — this
feature feeds it and does not re-implement it.

## Component / Module Breakdown

Owned — `src/features/catalog/`:

| File | Responsibility |
|---|---|
| `types.ts` | `CatalogItem` |
| `stock.ts` | Stock status derivation |
| `catalog-source.ts` | `CatalogSource` interface |
| `seeded-source.ts` | Demo data behind the boundary |
| `CatalogProvider.tsx` | Load, loading / error / empty state |
| `useCatalogFilters.ts` | Search + type chip state, combined |
| ~~`CategoryChip.tsx`~~ | Replaced by the shared `FilterChip` (spec 004), 2026-09-25 |
| `CatalogGrid.tsx` | The grid and its empty-results state |
| `CatalogItemCard.tsx` | Wraps `SupplyCard`; owns the Employee gate and stock bounds |
| `CatalogPage.tsx` | Composition: heading, search + office, chips, grid |
| `OfficeSelect.tsx` | The office selector (shared `Select`) |
| `request-action.ts` | The Employee / home-office / stock gate, shared by card and panel |
| `specs.ts` | Category → View Specs rows (FR-002a) |
| `ViewSpecsPanel.tsx` | `02.1 - Catalog - View Specs` on the shared `SidePanel` |

Shared touch — kept to the minimum BEN-42 allows:

| File | Change |
|---|---|
| `src/app/routes.tsx` | Swap `CatalogPlaceholder` for `CatalogPage` (1 import + 1 element) |
| `src/app/placeholders.tsx` | Remove the now-dead `CatalogPlaceholder` |

### Shared `SidePanel` (2026-09-25)

`src/shared/ui/overlay/SidePanel.tsx`, its export and its slide/fade utilities
in `src/styles/utilities.css` are taken **byte-for-byte** from PR #38 (BEN-45),
not re-implemented, so the two screens share one sheet and the two branches
merge without a real conflict. Whichever lands second sees identical content.

### One justified exception to folder ownership

`SupplyCard` lives in `src/shared/ui/data-display/` and must gain an optional
on-hand count and the ability to carry a `StockStatus` pill instead of the
binary availability pill (spec D1). This is a **shared component edit**, which
BEN-42's ownership note does not strictly allow.

It is taken deliberately because:

- `SupplyCard`'s own docstring says it *is* the catalog tile — it exists for this page and has no other caller.
- `StatusPill` already accepts `stock`, so the change is additive plumbing, not new design.
- The additions are optional props; every existing call keeps its current behavior.
- 2026-09-25: `model={null}` hides the model block (D5), `onViewSpecs` draws the `View specs >` link, and `actionLabel={null}` now removes the stepper along with the action. The on-hand count prop is removed; nothing else used it.
- The alternative — a second card inside the feature — forks the design system, which constitution VIII forbids more seriously than a one-file overlap.

Inventory (Parent H) renders a table, not cards, so the collision risk with the
one other in-flight feature is nil.

## API Contracts

Not authored here. `specs/001-office-supplies-mvp/contracts/README.md` is the
pointer; the field table above is transcribed from it. No route, payload, or
error code appears in this feature.

## Verification

| Gate | How |
|---|---|
| Typecheck | `npx tsc -b --force` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Full gates | `npm run verify` (needs a dev server; see `scripts/verify.mjs`) |
| Stock derivation | Exercised at all three boundaries incl. `onHand === lowQtyAlert` |
| Role gating | Signed in as each seeded role |

## Implementation Sequence

1. Types, stock derivation, boundary, seeded source
2. Provider with loading / error / empty states
3. Filters (search + chips), combined
4. `SupplyCard` additive props
5. Card wrapper with the Employee gate and quantity bounds
6. Page composition
7. Placeholder swap
8. Run the gates

## Known Risks

| Risk | Mitigation |
|---|---|
| Designer rejects the stock-pill treatment (D1) | Confined to `CatalogItemCard` + two optional props; reversible |
| Contract `type` enum differs from Figma chips (D2) | Chips derive from returned data, so an enum change needs no code edit |
| Seeded data mistaken for real integration | Boundary is explicit and named; swap is one implementation |
| Parent C lands a different request-list shape | Seam is one method; Parent C owns the provider |

## Constitution Compliance

| Principle | Status | Note |
|---|---|---|
| I. Spec-Driven | PASS | Implements spec 005 only; decisions recorded there |
| II. Two Roles (3.0.0) | PASS | Action gated to Employee; read open to every role. Gate is role-count agnostic — see spec's constitution note |
| III. Inventory Integrity | PASS | Page never mutates stock; add does not deduct |
| IV. State Machine | PASS | No transition occurs here |
| V. Notifications | PASS | None emitted by this page |
| VI. Testable Increments | PASS | Stories 1, 2, 3 independently demonstrable |
| VII. Typed Contracts | PASS | Only published fields; no routes or error codes |
| VIII. MVP Restraint | PASS | No new dependency, no new framework |
| IX. Secrets | PASS | Seeded demo data only, no credentials |
