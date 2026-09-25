# Feature Specification: My Requests

**Feature Branch**: `rockyc/ben-44-p2spa-my-requests-history`
**Created**: 2026-09-26
**Status**: Draft
**Linear**: [BEN-44](https://linear.app/bench-synergy-project/issue/BEN-44) (D0 [BEN-61](https://linear.app/bench-synergy-project/issue/BEN-61), D1 [BEN-62](https://linear.app/bench-synergy-project/issue/BEN-62), D2 [BEN-63](https://linear.app/bench-synergy-project/issue/BEN-63), D3 [BEN-64](https://linear.app/bench-synergy-project/issue/BEN-64))
**Sources**: Figma `04 - My Requests` (2026-09-25 export, unchanged since 2026-09-22); spec 001 US6, FR-016; spec 007 (the request panel); constitution 3.0.1 IV; [ADR-0007](../../docs/adr/0007-fulfilment-status-vocabulary.md); [drift-2026-09-24 §6](../../docs/design-system/drift-2026-09-24.md)

## Overview

The Employee's own request history at `/requests`: every request they have submitted, newest first, each with its live status pill and a **View details** that opens the request panel.

**Relationship to other specs**: spec 007 (BEN-45) shipped the panel and, so it had somewhere to open from, a stand-in of this list over its seeded source. This feature makes that list the real one. It adds no status, no transition and no source: the panel, the cancel flow and `EmployeeRequestSource` stay spec 007's.

## Decisions

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | **The pickup state is `Ready for Pickup`.** The issue says to build the queue chip's `For Pickup`; the project owner reversed that on 2026-09-24 and chose the `Request Status` component's label (drift-2026-09-24 §6, constitution 3.0.1). | The seven states are `Pending Approval`, `Approved`, `Rejected`, `For Delivery`, `Ready for Pickup`, `Completed`, `Cancelled` — `REQUEST_STATUSES` in `src/shared/ui/status.ts`. No local status union. |
| D2 | **Newest first is the page's rule, not the source's.** The list sorts by submission time, descending, whatever order the source returns. Ties break on request id, descending. A request whose time does not parse sorts last. | A contract-backed source does not have to promise an order. The drawn frame lists its sample rows out of date order; the order is the issue's acceptance, not the frame's. |
| D3 | **No filters, search or pagination.** The frame draws none and the issue asks for none; spec 001 FR-018 paginates the Admin tables only. Spec 007 had deferred "filters and pagination" to this feature; that is withdrawn here. | If an Employee's history grows long enough to need them, that is a spec amendment. |
| D4 | **Ownership is the source's job, proved by the page.** `EmployeeRequestSource.list(user)` returns the signed-in Employee's requests only (spec 007). The seed carries a request owned by a second Employee, who cannot sign in, so the check can assert it never appears. | No client-side filter by owner: the read model carries no owner, and inventing one would be a field the contract does not expose. |
| D5 | **Geometry from the 2026-09-25 export.** `04 - My Requests` is unedited since the 09-24 baseline (the only later change in the file is a new `Status changed email - Received` frame). Read from the `.fig`: columns 200 / 180 / fill / 190 / 90 inside a 20px gutter; 41px header, 63px rows ruled **below**; ID 13 bold black, DATE 13 regular `ink-secondary`, ITEMS 13 regular black; *View details* 12 bold `Codev Red` with a 12px drawn arrow stroked in the other red; title 34px under the bar, table 40px under the subtitle. | Two drawn values are not reproduced, both shell-wide: the card is 1376 wide, not 1344 (the symmetric 32px gutter, additions §3d), and the header is 39px, not 41 (the shared `TableHead`, as on the Requests Queue). The subtitle drops the frame's full stop (content conventions). |

## User Stories

### Story 1 — See my requests and where each one is (Priority: P1)

An Employee opens **My Requests** and sees `My Requests` over `Track every request from submission through pickup and completion`, then a table: `REQUEST ID` · `DATE` · `ITEMS` · `STATUS` · `ACTION`.

**Acceptance Criteria**:

1. **Given** Maya has seven requests, **When** she opens `/requests`, **Then** exactly her seven are listed, and a request owned by anyone else is not.
2. **Given** requests submitted on different days, **Then** the newest is first and the oldest last.
3. **Given** a request with three items, **Then** `ITEMS` reads the first two and a count, e.g. `Laptop, Keyboard + 1 more`; with two or fewer, their names.
4. **Given** each of the seven statuses, **Then** its pill reads the state name in that state's tone.
5. **Given** any row, **When** **View details** is activated, **Then** the request panel opens over the page and the address does not change.
6. **Given** an Employee with no requests, **Then** the page says so instead of drawing an empty table.

## Requirements

- **FR-001**: The list MUST show only the signed-in Employee's requests (D4).
- **FR-002**: Rows MUST be ordered newest first by submission time (D2).
- **FR-003**: `ITEMS` MUST use the shared `summarizeItems` with two names shown.
- **FR-004**: `STATUS` MUST render `StatusPill` with a `RequestStatus`; no value outside `REQUEST_STATUSES` MUST be expressible (type-level).
- **FR-005**: **View details** MUST open spec 007's panel without navigating. There is no Employee `/requests/:id` destination (spec 003, amended 2026-09-23).
- **FR-006**: Loading, empty and failure MUST be distinct states (spec 007 FR-011, unchanged).
- **FR-007**: `/requests` MUST stay Employee-only.

## Out of Scope

Filters, search and pagination (D3). The panel and cancel (spec 007). Real data: the list reads spec 007's seeded source until the request contract publishes (constitution VII).

## Open questions for the designer

1. The frame lists its sample rows out of date order; confirm newest first (D2).
3. The *View details* arrow is stroked in one red and its label bound to the other (drift-2026-09-22 §9).
2. The frame gives `REQ-2026-1842` to two rows (already flagged by spec 007).

## Success Criteria

- **SC-001**: As Maya, the seven requests appear newest first, each with the right pill, and another Employee's request never appears.
- **SC-002**: `npm run verify` passes, including a My Requests gate.
