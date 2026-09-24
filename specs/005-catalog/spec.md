# Feature Specification: Catalog page (view stock + start request)

**Feature Branch**: `rockyc/ben-42-p2spa-catalog-page-view-stock-start-request`
**Linear**: [BEN-42](https://linear.app/bench-synergy-project/issue/BEN-42) (B0 = [BEN-51](https://linear.app/bench-synergy-project/issue/BEN-51))
**Created**: 2026-09-22
**Status**: Draft
**Sources**: Figma/UI-kit Catalog screen, published Assets contract (`specs/001-office-supplies-mvp/contracts/README.md`), spec 001 US1/US2, `docs/process-flow.md`

## Overview

The Catalog is where every authenticated user sees what office supplies exist and
how many are on hand, and where an Employee begins a request. It is the entry
point to the pipeline described in `docs/process-flow.md`: nothing can be
requested that is not encoded and in stock.

This spec covers **reading** the catalog and **starting** a request. The request
list drawer, its line-item editing, and submission are a separate feature
(Parent C / BEN-43) and are out of scope here.

## User Scenarios & Testing

### User Story 1 — See what is in stock (Priority: P1)

Any authenticated user, whatever their role, opens the catalog
and sees each active item with its image, name, model, type, on-hand quantity,
and a stock status. Nobody can edit stock from this page.

**Why this priority**: Spec 001 FR-003 requires on-hand quantity to be visible
before a request is submitted; every later story reads from this view.

**Independent Test**: Sign in as each role, open the catalog, confirm the same
item facts render and that no role sees an edit affordance.

**Acceptance Scenarios**:

1. **Given** encoded active items exist, **When** any authenticated user opens the catalog, **Then** each item shows name, model, type, image, and its current on-hand quantity.
2. **Given** an item whose on-hand quantity is above its low-quantity threshold, **When** it renders, **Then** its stock status reads `In Stock`.
3. **Given** an item whose on-hand quantity is at or below its low-quantity threshold but above zero, **When** it renders, **Then** its stock status reads `Low Stock`.
4. **Given** an item whose on-hand quantity is zero, **When** it renders, **Then** its stock status reads `Out of Stock`.
5. **Given** any role, **When** the catalog renders, **Then** no control to change stock is present.

### User Story 2 — Find an item (Priority: P1)

A user narrows a long catalog by typing a search term and by selecting a type
chip. The two filters combine.

**Why this priority**: The catalog is the only route to a request; an unusable
list blocks the pipeline.

**Independent Test**: With several items encoded, search and chip-filter and
assert the visible set.

**Acceptance Scenarios**:

1. **Given** items exist, **When** a user types a term matching an item name or model, **Then** only matching items remain visible.
2. **Given** items of more than one type, **When** a user selects a type chip, **Then** only items of that type remain visible.
3. **Given** a search term and a type chip are both active, **When** the list renders, **Then** only items satisfying both remain visible.
4. **Given** an active filter combination that matches nothing, **When** the list renders, **Then** an empty state explains that no items match and offers to clear the filters.
5. **Given** a chip is selected, **When** the user selects the all-items chip, **Then** the type filter is cleared and the search term is preserved.

### User Story 3 — Employee starts a request (Priority: P1)

An Employee chooses a quantity on an item and adds it to their request list.
Every non-requesting role sees the same catalog without that action.

**Why this priority**: This is the only entry to the request pipeline, and
constitution II requires the action to authorize against the owning role.

**Independent Test**: Sign in as Employee and add an item; sign in as every
other seeded role and confirm the action is absent.

**Acceptance Scenarios**:

1. **Given** an Employee and an item with on-hand quantity ≥ 1, **When** they view the card, **Then** an add-to-request-list action is present.
2. **Given** any non-Employee role, **When** they view the same card, **Then** the add action is absent and the rest of the card is unchanged.
3. **Given** an Employee and an item with on-hand quantity 0, **When** they view the card, **Then** the add action is present but disabled and labelled as out of stock.
4. **Given** an Employee on an item with on-hand quantity N, **When** they raise the requested quantity, **Then** it cannot exceed N and cannot fall below 1.
5. **Given** an Employee adds an item, **When** the action completes, **Then** the item is recorded in their pending request list and the catalog's on-hand quantity is unchanged.

### User Story 4 — Know when the catalog cannot be shown (Priority: P2)

The page distinguishes loading, empty, and failed states rather than showing a
blank grid.

**Why this priority**: Required for a demonstrable page, but it does not block
the pipeline itself.

**Acceptance Scenarios**:

1. **Given** the catalog is being fetched, **When** the page renders, **Then** a loading state is shown.
2. **Given** no active items are encoded at all, **When** the page renders, **Then** an empty state explains that no supplies have been encoded yet.
3. **Given** the catalog cannot be retrieved, **When** the page renders, **Then** an error state is shown with a way to retry, and no partial or stale grid is presented as current.

### Edge Cases

- An item's on-hand quantity drops to zero while an Employee has it open: the add action must reflect the refreshed quantity once the page reloads or the add is refused; the catalog never presents a stale count as current.
- An item has no image: the card still renders with a neutral placeholder.
- An item's name or model is long enough to overflow the card: text is clamped, not allowed to break the grid.
- An inactive item exists: it does not appear in the catalog at all.
- A type value appears in the data that has no chip: the item is still reachable via search and via the all-items chip.
- A user without a session reaches `/catalog` directly: the existing route guard governs; this feature adds no new access path.

## Requirements

### Functional Requirements

- **FR-001**: System MUST show the catalog at `/catalog` to every authenticated role.
- **FR-002**: System MUST display, per active item, the item's name, model, type, image, and current on-hand quantity.
- **FR-003**: System MUST derive a stock status of `In Stock`, `Low Stock`, or `Out of Stock` from the item's on-hand quantity and its low-quantity threshold, and display it.
- **FR-004**: System MUST NOT offer any control that changes stock on this page, for any role.
- **FR-005**: System MUST filter the visible items by a free-text search over item name and model.
- **FR-006**: System MUST filter the visible items by item type, offered as selectable chips derived from the types present in the catalog, plus an all-items chip.
- **FR-007**: System MUST apply search and type filters together.
- **FR-008**: System MUST present the add-to-request-list action only to users in the Employee role.
- **FR-009**: System MUST disable the add action for an item whose on-hand quantity is zero.
- **FR-010**: System MUST bound the requested quantity for an item between 1 and that item's current on-hand quantity.
- **FR-011**: System MUST distinguish loading, empty-catalog, no-results, and retrieval-failure states.
- **FR-012**: System MUST NOT display or require any item field the published Assets contract does not expose, and MUST NOT invent routes, payloads, or error codes.
- **FR-013**: System MUST leave on-hand quantity unchanged when an item is added to a request list; stock moves only on submit, per `docs/process-flow.md`.

### Key Entities

- **Catalog item**: An active supply with name, model, type, image, on-hand quantity, and a low-quantity threshold, as published by the Assets contract.
- **Request list entry**: An item plus a requested quantity, held for the Employee until the request is submitted. Owned by Parent C; this feature only appends to it.

## Assumptions

Recorded rather than asked, per the decisions in `## Clarifications`.

- Any authenticated role may read the catalog; only Employee may start a request (ARCHITECT.md §7).
- Role language here is deliberately written by *count-free* description — "every authenticated role", "non-Employee" — rather than by naming Approver and Supply Admin. See the note below.
- The low-quantity threshold published as `lowQtyAlert` is the boundary for `Low Stock`.
- Chips are derived from the `type` values present in the returned catalog rather than hard-coded, so a contract enum change does not strand the UI.
- The catalog reflects API state after load or after a successful mutation; it is not a live socket feed (spec 001 assumption, unchanged).

## Out of Scope

- The request list drawer, its editing, and request submission (Parent C / BEN-43).
- Inventory encoding and editing (Parent H / BEN-48).
- Filtering or grouping by `location`. The contract exposes an office enum, but multi-warehouse is an explicit product non-goal (`docs/product.md`); surfacing it here would imply per-office stock the MVP does not model. **Flagged** below.
- Displaying the contract's custom `specs[]` on the card.
- Any write to inventory.

## Success Criteria

- **SC-001**: A tester signed in as an Employee can find an item by search and by type chip, set a quantity within stock, and add it to their request list, without stock changing.
- **SC-002**: A tester signed in as each non-Employee role sees identical item facts and no add action.
- **SC-003**: For items above, at, and below the low-quantity threshold, the three stock statuses render correctly, and a zero-quantity item's add action is disabled.
- **SC-004**: Loading, empty-catalog, no-results, and failure states are each reachable and visually distinct.
- **SC-005**: No field rendered on the catalog is absent from the published Assets contract.

## Clarifications

### Session 2026-09-22

Four decisions were put to the project owner, who directed the work to proceed
on the recommended option in each case. Recorded here because constitution I
requires decisions that shape behavior to live in the spec, not in chat.

- Q: The card shows a binary Available/Unavailable pill, but FR-003 requires the on-hand number and the contract ships `quantity` + `lowQtyAlert`. What should it show? → A: **The on-hand number plus the three-state stock status** (`In Stock` / `Low Stock` / `Out of Stock`) already defined in spec 002, derived from quantity against the threshold. See drift note D1.
- Q: The chips filter by the mock's `category`, which no contract exposes. What drives them? → A: **The contract's `type` values.** `category` is dropped as stale UI-kit drift, per BEN-42's own instruction. See drift note D2.
- Q: New spec slug, or extend spec 001 US1/US2? → A: **New slug `specs/005-catalog/`**, matching 002/003/004 and keeping the parallel page PRs independent.
- Q: Base the branch on `dev`, where `contracts/README.md` still reads "pending"? → A: **Stack on the contract commit** so the spec's cited source-of-truth exists for reviewers.

## Design drift — raised for the designer

Consistent with `docs/design-system/drift-2026-09-15.md`. None of these are
invented behavior; each is a conflict between the checked-in mock and the
published contract, resolved in the contract's favour as BEN-42 directs.

- **D1 — Availability pill → stock status.** The drawn card carries a two-state
  `available` / `unavailable` pill and no on-hand number. Spec 001 FR-003
  requires the number, and the contract publishes `quantity` and `lowQtyAlert`,
  which is exactly the three-state `StockStatus` vocabulary spec 002 already
  shipped. The card gains the count and the three-state pill. **Needs designer
  confirmation of the drawn treatment.**
- **D2 — `category` → `type`.** The mock groups by four invented categories
  (Office Supplies, Devices, Accessories, Audio). The contract has no
  `category`; it has `type`. Rendering `category` would invent a field, which
  constitution VII forbids. Chips now derive from `type`. **The Figma chip row
  should be re-exported against the contract's type values.**
- **D3 — `location` unsurfaced.** The contract carries an office enum (Cebu,
  Bacolod, Makati, Pasig, Davao) that the catalog screen never draws, and
  multi-warehouse is a product non-goal. The catalog therefore shows a single
  pooled quantity. **If stock is genuinely per-office, the MVP's inventory
  model — not this page — is what needs revisiting.**
- **D4 — `specs[]` unsurfaced.** The contract allows arbitrary key/value specs.
  The drawn card has no slot for them. Left off rather than invented.

## Constitution 3.0.0 — role model

This spec was written against constitution 2.0.0, which required three human
roles. Constitution **3.0.0** (2026-09-22, [ADR-0005](../../docs/adr/0005-two-role-model.md))
supersedes that with two: **Employee** and **Admin**.

Nothing in this feature's behavior changes. The catalog has only ever asked one
question — *is this the requesting Employee?* — and `employee` is a role in both
models. The gate in `CatalogItemCard` is unchanged and forward-compatible.

What changed is the wording: role references above now describe access by
position ("every authenticated role", "non-Employee") instead of enumerating
Approver and Supply Admin, so this spec stays true whichever model the SPA is
running.

**The SPA has not migrated yet.** `src/features/auth/types.ts` on `dev` still
carries the three-role union, so at runtime the seeded roles remain Employee,
Approver and Supply Admin, and that is what SC-002 was verified against. When
the role migration lands, this feature needs no code change — only the seeded
accounts it is tested against will differ.
