# Feature Specification: Admin History — resolved requests

**Feature Branch**: `emmanuelr/ben-144-p2spa-history-resolved-requests-admin`  
**Created**: 2026-09-29  
**Status**: Draft  
**Sources**: BEN-144 (L0 of BEN-149 / BEN-148), constitution 7.0.0, `specs/001-office-supplies-mvp/spec.md` (US6 scenario 2, FR-016a, FR-018; tasks T022), `specs/003-app-shell-routing/spec.md` (FR-006, D6), `specs/004-approver-pending-queue/spec.md` (FR-019–FR-022), `specs/008-request-review-panel/spec.md` (terminal read-only state), `specs/010-design-ratification/spec.md` (Q6, Q7), [drift-2026-09-29-export §2](../../docs/design-system/drift-2026-09-29-export.md), `docs/design-system/additions.md` (Rejected timeline ending, terminal read-only state, struck-through Cancelled pill), Figma *Mockups* frames `04 - History` (page) and `04 - History` (page + Cancelled panel)

## Overview

Give an Admin one place to look back at every request that has ended — `Completed`, `Rejected` or `Cancelled` — across all requestors, and to read any of them, including the stored reason for a rejection or cancellation. It is an audit trail: nothing on it changes a request.

Today `/history` shows the shell's placeholder. This feature replaces it with the drawn page and its read-only panel. It does not own the Requests Queue (live work, spec 004), the Admin's review panel (spec 008), the Employee's My Requests (spec 007), or any backend behaviour.

## User Stories

### Story 1 — Browse resolved requests (Priority: P1)

An Admin opens **History** and sees every resolved request from every requestor, newest resolved first, and narrows the list by status, by search, and by page.

**Why this priority**: This is the screen FR-016a asks for. Without the list, the panel is unreachable.

**Acceptance Criteria**:

1. **Given** a signed-in Admin, **When** they open History, **Then** the page shows the heading **History**, the subheading *"Full audit trail — completed, cancelled, and rejected requests"*, a search field, a sort select reading **Newest First**, the chips, the table and the pagination.
2a. **Given** the sort select, **When** the Admin picks Newest First, Oldest First or Employee (A-Z), **Then** the order changes and is kept while paging; the two date orders use the resolved time.
2. **Given** resolved requests from several requestors, **When** the table renders, **Then** it lists every `Completed`, `Rejected` and `Cancelled` request from every requestor, and no request in any other status, ordered by the time it was resolved, newest first.
3. **Given** a row, **When** it renders, **Then** it shows `REQUEST ID`, `REQUESTER` (name over department), `ITEMS` (the item names as a list), `STATUS` (the request's status pill), `RESOLVED` (the date it was resolved) and `ACTION`, a **Review** button.
4. **Given** the chips **All requests** · **Completed** · **Cancelled** · **Rejected**, **When** the Admin selects one, **Then** the table lists only that status; **All requests** lists all three and is selected by default. Every chip carries its count over the current search matches.
5. **Given** a search term, **When** the Admin types it, **Then** the table lists only requests whose id, requester name, requester email or an item name matches it.
6. **Given** more requests than one page holds, **When** the table renders, **Then** it shows the result range, page controls and a results-per-page control (spec 001 FR-018).
7. **Given** no resolved request matches the chip and search, **When** the table renders, **Then** it shows an empty state instead of rows.

### Story 2 — Read a resolved request (Priority: P1)

An Admin activates a row's action and reads that request in a panel over History: who asked, what for, the note, how it ended, and why.

**Why this priority**: The stored reason is the reason History exists (FR-016a). A list of ids without it is not an audit trail.

**Acceptance Criteria**:

1. **Given** an Admin on History, **When** they activate a row's **Review**, **Then** a side panel opens over History, and the list's chip, search, sort and page are kept.
2. **Given** the panel is open, **When** it renders, **Then** it shows the request id with its status pill, **REQUESTED BY:** (avatar, name, `email • office`), **ITEMS REQUESTED** as `ITEM · QTY` (no `CURRENT INVENTORY`), the **Note to Approver** when one exists, and the **STATUS** timeline.
3. **Given** a `Cancelled` request, **When** the panel renders, **Then** it shows the stored reason under **Reason for cancellation**.
4. **Given** a `Rejected` request, **When** the panel renders, **Then** it shows the stored reason under **Reason for rejection**.
5. **Given** a `Completed` request, **When** the panel renders, **Then** it shows no reason block.
5a. **Given** a request cancelled after it was approved, **When** the timeline renders, **Then** it shows every node the request reached, dated, and ends at **Cancelled**; for example Submitted → Approved → For Delivery → Cancelled. A request cancelled or rejected while `Pending Approval` reads Submitted → ending, as `04.2` draws it.
6. **Given** the panel is open, **When** the Admin activates ✕, presses Esc, or clicks the scrim, **Then** the panel closes and focus returns to the row's **Review**.
7. **Given** a signed-in Admin, **When** they follow `/requests/<id>` for a `Completed`, `Rejected` or `Cancelled` request (an email's *View request*), **Then** History opens with that request's panel. A live request still opens the review panel over the Requests Queue.

### Story 3 — History is Admin-only and read-only (Priority: P1)

Only an Admin reaches History, and nothing on it can change a request.

**Why this priority**: Constitution II (role authorization) and IV (terminal states are never reopened).

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** the shell renders, **Then** navigation offers no History item.
2. **Given** a signed-in Employee, **When** they go to `/history` by address, **Then** access is refused with an explanation and a route to a screen they may use, and no part of History renders (spec 003 FR-011).
3. **Given** any row or open panel, **When** it renders, **Then** it offers no control that approves, rejects, cancels, changes status, completes, edits or reopens a request.

### Edge Cases

- **`Received` request.** Not terminal: it waits on the Employee's Accountability Form signature and then the Admin's Complete (constitution 7.0.0 IV), and stays on the Requests Queue (spec 004). It never appears in History.
- **Request resolved while History is open.** The list shows what the source returned when it loaded; a request resolved later appears on the next load. No live update.
- **No reason stored** on a `Rejected` or `Cancelled` request (for example, a record the source returns without one). The reason block shows an explicit "No reason recorded" marker, not an empty callout.
- **No note.** The Note to Approver block is not drawn.
- **Unusable resolved time.** A request whose resolved time is missing or unparsable shows an explicit unavailable marker in `RESOLVED` and sorts after every dated request under both date orders, as the queue does (spec 004 FR-021).
- **Many items.** The ITEMS cell stays one line; overflow is handled as the queue handles it.
- **Loading.** The shared loading state shows until the source settles; the empty state never flashes first.
- **Source failure.** The list does not load. The page shows an error state with a retry, not an empty table.
- **Request id and dates.** The page prints whatever id and date the source returns (spec 010 Q6); it does not reformat the id.

## Functional Requirements

- **FR-001**: `/history` MUST render the History page for an Admin, replacing the shell's placeholder, and MUST remain refused for an Employee (spec 003 FR-006).
- **FR-002**: The page MUST list only requests whose status is `Completed`, `Rejected` or `Cancelled`, from every requestor.
- **FR-003**: The table MUST show `REQUEST ID` · `REQUESTER` (name over department) · `ITEMS` · `STATUS` · `RESOLVED` · `ACTION`. `STATUS` MUST use the shared request status pill. `RESOLVED` MUST show the date the request reached its terminal status, as the source reports it.
- **FR-004**: The page MUST offer chips **All requests** · **Completed** · **Cancelled** · **Rejected**, each with its count computed over the search matches (not over the current page), with **All requests** selected by default, and the selected chip MUST expose its pressed state. The file draws a count only on *All requests*; the rest are ours, as the queue's are.
- **FR-005**: Search MUST match request id, requester name, requester email and item names, case-insensitively and ignoring surrounding whitespace, as the queue's does (spec 004 FR-020).
- **FR-006**: Sort MUST offer **Newest First** (default), **Oldest First** and **Employee (A-Z)**, the queue's drawn set (spec 004 FR-021). The date orders use the resolved time; a request with an unusable resolved time sorts after every dated request under both; Employee (A-Z) breaks ties newest resolved first.
- **FR-007**: The table MUST be paginated as the queue is (spec 004 FR-022): a `first-last of total` range, Back / numbered pages / Next, and a results-per-page select defaulting to 50. Changing the chip, search, sort or page size MUST return to page 1. Re-selecting the value already in effect, such as pressing the chip that is already selected, is not a change and MUST keep the page.
- **FR-008**: A row's action MUST be a **Review** button, as drawn, and MUST open a read-only panel over History and MUST NOT lose the list's chip, search, sort or page. The panel MUST close on ✕, Esc and a scrim click, MUST hold focus while open, and MUST return focus to the invoking **Review**.
- **FR-009**: The panel MUST show the request id and status pill, REQUESTED BY (avatar, name, `email • office`), `ITEM · QTY`, the Note to Approver when present, and the STATUS timeline. It MUST NOT show current inventory.
- **FR-009a**: The timeline MUST show every node the request reached before it ended, each dated, then the terminal node. A request cancelled after approval therefore reads Submitted → Approved → [For Delivery | Ready for Pickup] → Cancelled, as far as it got; one cancelled or rejected from `Pending Approval` reads Submitted → ending, as `04.2` draws it. `Received` cannot be cancelled, and rejection happens only from `Pending Approval`, so no other shape exists. This is the one request timeline shared with the Employee's panel (spec 007) and the review panel (spec 008), and they follow it.
- **FR-010**: The panel MUST read back the stored reason under **Reason for rejection** for `Rejected` and **Reason for cancellation** for `Cancelled`, and MUST show no reason block for `Completed`. Only the Cancelled panel is drawn; Rejected composes the read-only reason block `02.2.2.1` draws, and Completed is the same panel without one.
- **FR-011**: Neither the page nor the panel MUST offer any control that changes a request (constitution IV: terminal states are never reopened). The only panel action is closing it.
- **FR-012**: While the source loads, the page MUST show the shared loading state (`LoadingState`, spec 003 FR-018) in place of the table, and MUST NOT show the empty state until the load settles. It MUST show an empty state when nothing matches, and an error state with a retry when the source fails.
- **FR-013**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes (constitution VII). The contract publishes no terminal-status list, resolved time, stored rejection or cancellation reason, or requester department on a request today; until it does, data MAY come from a typed seeded source behind an interface, as specs 004, 007 and 011 do, and the gap MUST be raised in `specs/001-office-supplies-mvp/contracts/README.md`.
- **FR-014**: The page and panel MUST compose shared UI and reuse the queue's table, chips, search, sort and pagination and the request panels' read-back, timeline and reason block, rather than redrawing them.
- **FR-016**: An Admin's `/requests/:id` for a `Completed`, `Rejected` or `Cancelled` request MUST open this panel over History, not the review panel over the queue. A live request's link, and a missing id's notice, are unchanged (spec 008 FR-001a, amended). The link MUST survive sign-in (spec 003 FR-013).
- **FR-015**: Every control MUST be keyboard-operable with visible focus. The page and panel MUST stay usable from 360px to 1440px without page-level horizontal overflow.

## Key Entities

- **Resolved request**: The Admin's read model of one terminal request: id, status (`Completed` · `Rejected` · `Cancelled`), requester (name, department, email, office), lines (item, quantity), optional note, submitted time, a time per reached transition, resolved time, and the rejection or cancellation reason where there is one. It is not an API shape.
- **History query**: chip, search, sort, page and page size, as one value.

## Out of Scope

- Export, date-range filters, and any audit of who changed what beyond status, time and reason. None is drawn.
- Any transition from History, including reopening a terminal request (constitution IV).
- `Received` requests, which stay on the Requests Queue.
- The Admin's *Other Notes* read-back, which no frame draws (drift-2026-09-29 §4).
- Notification history on a request (spec 001 T024).
- Stock figures, email, and REST contract definition.

## Success Criteria

- **SC-001**: For a seeded data set with requests in all eight statuses, History lists exactly the `Completed`, `Rejected` and `Cancelled` ones, and each chip's list contains only its status.
- **SC-002**: A search for any seeded request's id, requester name, requester email or one of its item names finds it.
- **SC-003**: Every `Rejected` and `Cancelled` request's panel shows its stored reason under the matching label; no `Completed` panel shows a reason block.
- **SC-004**: No row or panel renders a control that changes a request.
- **SC-005**: An Employee cannot reach History through navigation or by address.
- **SC-006**: Review of the feature finds no invented route, payload, field or error code.

## Clarifications

### Session 2026-09-29

Raised while specifying BEN-144 (L0) against the 2026-09-29 export ([drift-2026-09-29-export §2](../../docs/design-system/drift-2026-09-29-export.md)), and decided by the project owner.

- Q: **H1 / D7.** The row action is drawn as a red **Review** button, with a hidden **View details →** link. Which label for a read-only panel? → A: **Review, as drawn** (FR-008). It matches the queue's action. D7 stays with the designer.
- Q: **H2 / D8.** Only the Cancelled panel is drawn. How are Rejected and Completed built? → A: **Compose from drawn parts.** Rejected reuses `02.2.2.1`'s read-only **Reason for rejection** block. Completed has no reason block (FR-010). Logged in `docs/design-system/additions.md`; D8 stays with the designer.
- Q: **H3.** No frame draws the timeline of a request cancelled after approval. Collapse it to Submitted → Cancelled, as the shared timeline does today, or show what it reached? → A: **Show the reached nodes, then the ending** (FR-009a, Story 2 criterion 5a). This changes the shared timeline, so My Requests and the review panel follow it. It is an undrawn addition and replaces the additions.md collapse rule for that case.
- Q: The sort menu is not drawn for History. Which options? → A: **The queue's three**: Newest First · Oldest First · Employee (A-Z), with the date orders by resolved time (FR-006).
- Q: Only *All requests* carries a count in the drawing. Counts on the status chips too? → A: **Yes, on every chip**, over the search matches, as the queue does (FR-004).

Inferred, not asked:

- History is not live. It shows what the source returned on load, like the queue.
- The panel is component state over `/history`, not an address. ~~`/requests/:id` for an Admin still opens the review panel over `/queue` (spec 008 FR-001a).~~ *Superseded in planning: see below.*
- The resolved time is the time the request reached its terminal status. The contract publishes none, so it is raised as a contracts gap with the stored reasons and the terminal-status list (FR-013; drift H4).

### Session 2026-09-29 — checklist

- Q: FR-009a contradicts spec 007 Story 1 criterion 4, which collapses every Cancelled or Rejected timeline. → A: **Amend spec 007 in place**, dated and citing FR-009a. There is one shared timeline. `docs/design-system/additions.md` (*Rejected timeline ending* and the collapse rule) follows at execute time.
- Fixed from the checklist: the requester's **department** joins the contract gap (FR-013); re-selecting the current chip keeps the page (FR-007); a **loading** state (FR-012); the Employee refusal cites spec 003 FR-011 (Story 3 criterion 2).

## Validation

- Completeness: PASS. All three P1 stories have acceptance criteria.
- Clarity: PASS
- Consistency: PASS against constitution 7.0.0 (re-checked 2026-09-30 after rebasing on `dev`; the terminal statuses are unchanged from 6.0.0) and specs 003, 004 and 008. Spec 007 is amended to match FR-009a.
- Measurability: PASS
- Coverage: PASS, including the loading, empty, error and no-reason states.
- Edge cases: PASS

No checklist overrides.

### Session 2026-09-29 — planning

- Q: (plan red team, R5) An email's *View request* for a resolved request opens the queue's review panel, which shows CURRENT INVENTORY over a queue with no row for it. Keep that, or send it to History? → A: **Send it to History** (FR-016, Story 2 criterion 7). Spec 008 FR-001a is amended in place.
