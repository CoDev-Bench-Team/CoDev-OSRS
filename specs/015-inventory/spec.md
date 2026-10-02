# Feature Specification: Inventory — the unit register

**Feature Branch**: `emmanuelr/ben-150-p2spa-inventory`
**Created**: 2026-10-01
**Status**: Draft
**Linear**: [BEN-150](https://linear.app/bench-synergy-project/issue/BEN-150/p2spa-inventory) (I0 [BEN-151](https://linear.app/bench-synergy-project/issue/BEN-151), I1 [BEN-107](https://linear.app/bench-synergy-project/issue/BEN-107), I2 [BEN-108](https://linear.app/bench-synergy-project/issue/BEN-108), I3 [BEN-152](https://linear.app/bench-synergy-project/issue/BEN-152), I4 [BEN-153](https://linear.app/bench-synergy-project/issue/BEN-153))
**Sources**: Figma `.fig` exported **2026-10-01T00:58:18Z**, Mockups page, the sections the file labels **Inventory**, **Add Single Unit** and **Bulk** (every frame unchanged since 2026-09-26); [drift-2026-10-01 §3, §5](../../docs/design-system/drift-2026-10-01.md) (PR #41); [drift-2026-09-26 §2](../../docs/design-system/drift-2026-09-26.md); constitution 9.0.0 II, III, VII, VIII, IX; [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md), [ADR-0011](../../docs/adr/0011-admin-sets-received-employee-signs.md); spec 001 US1, FR-003, FR-003b, FR-018; spec 014 (Assets, PR #41); the backend's `/inventory-items` and `/users` as published in its source on 2026-10-01 (the live Swagger returned `500` that day)

## Overview

The Admin's **Inventory** screen (`/inventory`): the register of physical units, one row per item, with its purchase request number, serial number, office, assignee and status. From it an Admin adds one unit or a batch of units, reviews and edits a unit, and removes a unit that no one holds.

Inventory is where stock comes from. Per (asset, office), Available and Reserved are counts of units in those statuses and Total is their sum (constitution III). Nothing here writes a count: the counts follow from the units added, edited and removed.

**Relationship to other specs**: implements the Inventory half of spec 001 US1 (acceptance 2 and 2a) and FR-003 / FR-003b for the SPA. Replaces the shell's `/inventory` placeholder. Reads assets from the Assets source of spec 014 for the catalog-item search. Adds no request transition and no notification.

## Decisions

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | **The unit status set is the contract's**: `Available` · `Reserved` · `Assigned` · `Inactive`. The file's `Inventory Status` component also draws `In Storage` (on Delete Unit Confirmation), as a separate variant from `Inactive`. | `In Storage` is not shown. It stays a contract question (constitution VII; spec 010). |
| D2 | **`Reserved` is never a manual choice.** Only request transitions move a unit into or out of it (constitution III). | No Status control offers it. A reserved unit's Status, User and Office are read-only. |
| D3 | **Add Single Unit offers `Available` · `Assigned` · `Inactive`** (amended 2026-10-02 by the project owner; it read `Available` · `Assigned`). `Reserved` stays out: only a request transition reserves a unit (constitution III). | The contract creates a unit `Available`, or `Assigned` when a user is given, and takes no status, so adding a unit as `Inactive` is contract gap G10. |
| D4 | **Review/Edit offers `Available` · `Assigned` · `Inactive`** for a unit that is not reserved. `Assigned` requires a User; `Available` and `Inactive` clear it. | Moving an `Assigned` unit to `Available` returns it to the store; to `Inactive`, no count changes (D5). Clearing the User alone leaves Status `Assigned` and blocks Save. Recording an assignment on an `Inactive` unit changes no count, and is covered by the D5 amendment. |
| D5 | **An Admin may clear any unit's assignment** (`Assigned` → `Available`, Available +1, Total +1; or `Assigned` → `Inactive`, no count change, D4), as the drawn *"Remove assignment first before removing this unit"* requires (Clarifications, Q1). Constitution 8.0.0 III and ADR-0008 did not list this move. | **Amended**: constitution 9.0.0 III and the ADR-0008 amendment (2026-10-01) carry it, as the first commit of this feature's PR. Recorded under Clarifications; the amendment is a task, not a silent edit. |
| D6 | **Secrets are masked.** The BitLocker Identifier and Recovery Key/PIN are masked in every input by default, each with a Show/Hide toggle, and never appear in the table, in an Employee view or in a log (Clarifications, Q3; constitution VIII, IX). | An undrawn addition: the file draws them in plain text. Logged in `docs/design-system/additions.md`. |
| D7 | **`MODEL` prints the asset's item name.** The drawn sample `Dell Latitude 7440` is the Assets screen's ITEM NAME; Assets' MODEL is `Latitude 7440`. | The header reads `MODEL`, as drawn. |
| D8 | **Categories, offices and status labels are the contract's.** The file's samples (`Laptops`, `Keyboards`, `Cables`) are plural or not in the enum. | The category select lists the contract's nine categories. Offices: Cebu · Bacolod · Makati · Ortigas · Davao. |
| D9 | **Removal is refused for `Assigned` and `Reserved` units** (constitution III). The file draws the assigned refusal. The reserved one is ours. | REMOVE UNIT shows a reason in place of the **Remove Unit** link. |
| D10 | **Removal asks for a reason**, as drawn. The contract's removal takes none. | The reason is collected and sent only where the source can carry it. The gap is raised (constitution VII), as spec 008 FR-007a did for Other Notes. |
| D11 | **Data comes through a source boundary.** Whether the first implementation is seeded or the live contract is the plan's decision (BEN-151 item 4). | No screen imports data directly. Every contract gap below is raised, not bridged. |
| D12 | **Admin only** (constitution II). | An Employee has no Inventory item in navigation and is refused `/inventory` by address. |
| D13 | **Device fields follow the asset's category**, per the project owner's *IT Inventory Item Details* table (Clarifications, Q7). **BitLocker Identifier** and **Recovery Key/PIN** exist for **Laptop** only. **Serial Number** is shown for every category and is the one required device field, except for **Mice** and **Other Devices**, which the table gives no serial: there it is optional (Q8). The file draws a Laptop in every unit frame, so it shows all three. | One table, as spec 014 D5 does for asset specifications. Before a catalog item is chosen, DEVICE DETAILS shows Serial Number only. Choosing a non-Laptop item hides the BitLocker fields and drops their values, which are never submitted. |
| D14 | **`PR` is the Purchase Request number**, per the project owner's table (Q9), not a unit tag. The drawn `CODEV-LAPTOP-1232` is sample data. It is labelled **Purchase Request** everywhere it shows, never abbreviated (amended 2026-10-02 by the project owner): the field at the head of PURCHASE DETAILS and the table column, which the file draws as `PR`. It is optional, and shared by a batch. | An undrawn field on Add Single Unit, Review/Edit and Add Multiple Units, logged in `docs/design-system/additions.md`. ADR-0008 decision 1 and spec 001 FR-003 call it a tag; both are corrected with the D5 amendment. The contract has no such field (G5). |

## User Stories

### Story 1 — Browse the unit register (Priority: P1)

An Admin opens **Inventory** and sees every unit across the five offices, narrowed by search, category, status chip and page.

**Why this priority**: The table is the screen. Every panel opens from it.

**Acceptance Criteria**:

1. **Given** a signed-in Admin, **When** they open `/inventory`, **Then** the page shows the heading **Inventory**, the subheading *"Monitor stock levels, manage reservations, and keep office essentials ready"* (the drawn copy without its full stop, as every page subtitle reads), a primary **+ Add Inventory** with a chevron, a search field (*"Search inventory by item name or code"*), an **All categories** select, the chips, the table and the pagination.
2. **Given** units, **When** the table renders, **Then** each row shows `MODEL` (the asset's item name), `CATEGORY`, `PURCHASE REQUEST` (the Purchase Request number, D14), `SERIAL NUMBER`, `OFFICE` (the office label), `ASSIGNED` (the assignee's name over their department, or `Unassigned` alone in muted ink), `STATUS` (the unit's `Inventory Status` pill) and `ACTION`, a **Review** button.
3. **Given** the chips **All items** · **Assigned** · **Available** · **Reserved**, **When** the Admin selects one, **Then** the table lists only units in that status. **All items** lists every unit, `Inactive` included, and is selected by default. Every chip shows its count over the current search and category.
4. **Given** a search term, **When** the Admin types it, **Then** only units whose item name, model, Purchase Request or serial number matches remain, and the chip counts follow.
5. **Given** a category selected, **When** a chip and a search also apply, **Then** rows match all three.
6. **Given** more units than one page holds, **When** the table renders, **Then** it shows the result range, Back / page numbers / Next, and **Result per page** (spec 001 FR-018).
7. **Given** no unit matches, **When** the table renders, **Then** it shows an empty state rather than a blank table.
8. **Given** any row, **Then** it never shows a BitLocker Identifier or a Recovery Key/PIN.

### Story 2 — Add a single unit (Priority: P1)

**+ Add Inventory** → **Add Single Unit** opens a 400px side panel. The Admin picks the catalog item, fills purchase, device, assignment and notes details, and saves one unit.

**Why this priority**: Without adding units there is no stock to request (constitution III: an asset must hold stock before it can be requested).

**Acceptance Criteria**:

1. **Given** the Inventory page, **When** the Admin activates **+ Add Inventory** (a primary button with a chevron-down at its right, `03 - Inventory - Open Add Inventory Dropdown`), **Then** a menu opens directly under it, as a white card, listing **Add Single Unit** and **Add Multiple Units**. Choosing one opens its panel. Esc or a click outside closes the menu without opening a panel.
2. **Given** Add Single Unit is open, **When** it renders, **Then** it shows `Catalog Item *` (a search, *"Search catalog item name or code"*); PURCHASE DETAILS (Purchase Request · Price · Supplier · Purchased Date; Purchase Request is ours, D14); DEVICE DETAILS (Serial Number, plus BitLocker Identifier · Recovery Key/PIN for a Laptop, D13); ASSIGNMENT (User, *"Insert here..."* · `Office *`, defaulting to **Cebu** · `Status *`, reading *"Select Status"*); NOTES (Description · Attachment, *"Drop file or browse"*, *"Format: .jpeg, .png & Max file size: 25 MB"*); and **Cancel** / **Save Changes**.
3. **Given** the Admin types in `Catalog Item *`, **When** an asset's item name or model matches, **Then** it is offered. **When** they pick one, **Then** the field shows the category as an eyebrow over the item name, with ✕ to clear it.
3a. **Given** a Laptop is chosen, **Then** DEVICE DETAILS shows Serial Number, BitLocker Identifier and Recovery Key/PIN. **Given** any other category, **Then** it shows Serial Number only, required except for Mice and Other Devices (D13). **Given** the item changes from a Laptop to another category, **Then** the BitLocker values are dropped and not submitted.
4. **Given** `Status *`, **When** it opens, **Then** it offers **Available**, **Assigned** and **Inactive**, never **Reserved** (D3, as amended 2026-10-02).
5. **Given** Status **Assigned** and no User, **When** Save is pressed, **Then** nothing is saved and a message appears under User. **Given** the Admin picks a User, **Then** Status becomes **Assigned**. **Given** Status **Available**, **Then** the User is cleared.
5a. **Given** the Admin types in User, **When** a user's name or email matches, **Then** it is offered. Every user is assignable, Employee or Admin, at any office.
6. **Given** a missing catalog item, office, status or (except for Mice and Other Devices) serial number, a negative price, a price with more than two decimals, a purchased date in the future, or a file that is not `.jpeg`/`.png` or is over 25 MB, **When** Save is pressed or the file is chosen, **Then** nothing is saved and the message appears under that field.
7. **Given** the source refuses with a validation problem, **When** the panel receives it, **Then** each `detail` appears under the field its `errors[].pointer` names, through the shared parser. **Given** a serial number already in use, **Then** the source's own message is shown.
8. **Given** a valid form, **When** saved, **Then** the panel closes and the unit appears in the table with the chosen status, and the asset's counts at that office follow (Available +1 and Total +1 for an `Available` unit; no count changes for an `Assigned` or `Inactive` one).

### Story 3 — Review and edit a unit (Priority: P1)

A row's **Review** opens the unit in a 400px side panel, headed by the asset's name with the unit's status pill, with every field prefilled and editable within the status rules.

**Why this priority**: Recording an existing assignment, clearing one, and taking a unit out of service are the Admin's only manual moves on stock (constitution III; D4, D5).

**Acceptance Criteria**:

1. **Given** a row, **When** the Admin activates **Review**, **Then** the panel opens with the asset's item name and the unit's `Inventory Status` pill in the header (the catalog item is not editable here); PURCHASE DETAILS, DEVICE DETAILS, ASSIGNMENT and NOTES prefilled from the unit; a REMOVE UNIT section; and **Cancel** / **Save Changes**.
2. **Given** a unit that is not reserved, **When** `Status *` opens, **Then** it offers **Available**, **Assigned** and **Inactive**, never **Reserved** (D2, D4).
3. **Given** an `Assigned` unit, **When** the Admin changes Status to **Available** and saves, **Then** the user is cleared, the unit is `Available`, and the asset's Available and Total at that office each rise by one (D5).
3a. **Given** an `Assigned` unit, **When** the Admin changes Status to **Inactive** and saves, **Then** the user is cleared, the unit is `Inactive`, and no count changes (D5).
4. **Given** an `Available` unit, **When** the Admin chooses **Assigned** with a User and saves, **Then** the unit is `Assigned` to that user and the asset's Available and Total at that office each fall by one.
5. **Given** an `Available` unit, **When** the Admin chooses **Inactive** and saves, **Then** the unit is `Inactive` and counted nowhere (Available and Total fall by one).
5a. **Given** an `Inactive` unit, **When** the Admin chooses **Available** and saves, **Then** Available and Total at that office each rise by one. **When** they choose **Assigned** with a User and save, **Then** the unit is `Assigned` to that user and no count changes (D4).
6. **Given** a `Reserved` unit, **When** the panel renders, **Then** Status reads **Reserved** and Status, User and Office are read-only; purchase, device and notes details stay editable.
7. **Given** a Laptop unit with a stored BitLocker Identifier or Recovery Key/PIN, **When** the panel renders, **Then** each is masked with a Show/Hide toggle; typing replaces the value (D6). **Given** a unit of any other category, **Then** neither field is shown (D13).
7a. **Given** a unit outside Mice and Other Devices whose stored serial is empty, **When** the Admin saves any edit, **Then** Serial Number is required first (D13).
7b. **Given** a unit with an attachment, **When** the panel renders, **Then** the image fills the Attachment uploader with three icon actions, **Replace attachment**, **Download attachment** and **Remove attachment**, the pattern of Update Asset's image (spec 014, drift-2026-10-01 A5). Remove returns it to the empty drop box; nothing changes until Save.
8. **Given** an edit, **When** saved, **Then** the panel closes and the row and chip counts reflect it.

### Story 4 — Remove a unit (Priority: P2)

Under REMOVE UNIT, an Admin removes a unit that no one holds, giving a reason.

**Why this priority**: Corrects mistakes and retires lost or broken items. The Inactive status (Story 3) covers most "out of service" cases, so the register still works without removal.

**Acceptance Criteria**:

1. **Given** an `Available` or `Inactive` unit, **When** the panel renders, **Then** REMOVE UNIT shows a **Remove Unit** link with a delete icon.
2. **Given** **Remove Unit** is activated, **When** the section changes, **Then** it shows `Reason for removal *` (*"e.g item on hold, insufficient justification..."*) and the footer becomes **Cancel** / **Confirm Removal**.
2a. **Given** removal mode, **When** the Admin presses **Cancel**, **Then** the section returns to the **Remove Unit** link and the footer to **Cancel** / **Save Changes**; the panel stays open.
3. **Given** an empty reason, **When** **Confirm Removal** is pressed, **Then** nothing is removed, the confirmation does not open, and a message appears under the field.
4. **Given** a reason, **When** **Confirm Removal** is pressed, **Then** a dialog asks *Remove this unit?* and says *This permanently deletes the unit. You cannot undo it.* Nothing is removed yet.
4a. **Given** that dialog, **When** the Admin presses **Cancel**, Esc, or the scrim, **Then** the dialog closes, the reason stays, and the unit is not removed.
4b. **Given** that dialog, **When** the Admin presses **Remove unit**, **Then** the unit is removed (any unsaved field edits are discarded, not saved first), the panel closes, the row leaves the table, and an `Available` unit's asset loses one Available and one Total at that office.
5. **Given** an `Assigned` unit, **When** the panel renders, **Then** REMOVE UNIT shows *"This unit can’t be removed because it is assigned to a user. Remove assignment first before removing this unit."* and no removal control.
6. **Given** a `Reserved` unit, **When** the panel renders, **Then** REMOVE UNIT shows that the unit can't be removed because it is reserved for a request, and no removal control (D9).

### Story 5 — Add multiple units (Priority: P2)

**+ Add Inventory** → **Add Multiple Units** opens a 650px side panel. The Admin picks one catalog item and office, gives purchase details once, enters each unit's serial and BitLocker details on its own row, and saves the batch all at once.

**Why this priority**: The fast path for a delivery of many identical items. Add Single Unit (Story 2) can do the same job one unit at a time.

**Acceptance Criteria**:

1. **Given** Add Multiple Units is open, **When** it renders, **Then** it shows `Catalog Item *` (the same search as Story 2); a **No. of Units** stepper (`-` · count · `+`) on its own row above `Office *` (defaulting to **Cebu**), as the frame stacks them; PURCHASE DETAILS (Purchase Request · Price · Supplier · Purchased Date) shared by the batch; UNITS, one row per unit of **Serial Number**, plus **BitLocker Identifier · Recovery Key/PIN** when the item is a Laptop (D13); **+ Add another unit** under the list; and **Cancel** / **Save Changes**.
1a. **Given** the panel has just opened, **Then** **No. of Units** reads **1** and UNITS holds one empty row. The file draws `0` over two rows; that frame is inconsistent, and this is the decided start.
2. **Given** the stepper, **When** the Admin presses `+` or **+ Add another unit**, **Then** a unit row is added and the count rises by one; **When** they press `-`, **Then** the last row is removed, even if it holds values; **When** they press a row's ✕, **Then** that row is removed. Either way the count falls by one. The count always equals the number of rows.
3. **Given** any unit row, **Then** it stays editable until the batch is saved and carries one red ✕ that removes it. There is no per-row confirm: the drawn green ✓ is not built, and Save Changes checks every row.
4. **Given** a row with no serial number (for any category but Mice and Other Devices), or two rows with the same non-blank serial number, **When** Save is pressed, **Then** nothing is saved and the message appears under each offending serial. A blank row is refused, except for Mice and Other Devices, where it is one unit with no identifiers.
4a. **Given** rows already typed, **When** the catalog item changes between a Laptop and another category, **Then** the row columns follow the new category, serial numbers are kept, and BitLocker values are dropped.
5. **Given** the source refuses one row, **When** the panel receives the problem, **Then** each `detail` appears under the row and field its pointer names (for example the third row's serial number), and **no** unit is created (all or nothing).
6. **Given** a valid batch of *n* rows, **When** saved, **Then** the panel closes, *n* `Available` units appear in the table at the chosen office, and the asset's Available and Total there each rise by *n*.
7. **Given** 100 rows, **Then** `+` and **+ Add another unit** are disabled. **Given** zero rows, **Then** Save Changes is disabled.
8. The panel offers no User or Status field, and no `RAM` field (drift-2026-10-01 D11).

### Story 6 — Inventory is the Admin's alone (Priority: P1)

Only an Admin reaches Inventory, and no unit secret ever reaches an Employee.

**Why this priority**: Constitution II (role authorization), VIII and IX (secrets).

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** the shell renders, **Then** navigation offers no Inventory item.
2. **Given** a signed-in Employee, **When** they go to `/inventory` by address, **Then** access is refused with an explanation and a route to a screen they may use, and no part of Inventory renders (spec 003 FR-011).
3. **Given** any screen an Employee can reach, **Then** it never shows a BitLocker Identifier or Recovery Key/PIN.

### Edge Cases

- **A unit is reserved while an Admin edits it.** A request submitted elsewhere reserves the unit, and then the Admin saves it as `Inactive` or `Assigned`. The source refuses, and the panel shows the source's message and keeps the edits. The SPA does not retry. *(Needs an API guard; see contract gaps.)*
- **The panel is closed with unsaved edits** (✕, Esc, scrim, Cancel). The edits are discarded without a prompt, as the other side panels do.
- **Office changed on an `Available` unit.** The unit moves between offices: Available and Total fall by one at the old office and rise by one at the new one.
- **Unassigning a unit assigned through a request.** Allowed (D5). The request's history is unchanged. Against the API, where Profile and Inventory read one register, the unit leaves the requester's Profile *Currently Assigned* list; until then Profile keeps its own data (spec 006 FR-010).
- **A serial number already in use** (source conflict). The panel shows the source's message, for example *"Serial numbers already in use: PF3ABCXY."*, and saves nothing.
- **A unit with no serial number.** Only a Mice or Other Devices unit may be saved without one (D13). A unit stored without one (one of those two, or a unit created before this rule) shows an explicit empty marker in `SERIAL NUMBER`.
- **The contract is looser than the SPA.** The contract makes every device field optional for every category. Requiring Serial Number and hiding the BitLocker fields by category is stricter client validation, not an invented field.
- **No PR.** PR is optional. A unit without one shows an explicit empty marker in `PURCHASE REQUEST`. The SPA does not make one up.
- **The asset of a unit has no units left at an office** after a removal or inactivation. The Assets screen's counts show it. Against the API, where the catalog reads the same register, the catalog shows it unavailable there (spec 005); until then the catalog keeps its own seeded stock. Nothing on this screen warns about it.
- **Loading.** The shared loading state shows until the source settles. The empty state never flashes first.
- **Source failure.** The page shows an error state with a retry, not an empty table. A failed save keeps the panel open with the entered values.
- **Concurrent removal.** The unit was already removed elsewhere: the source reports it not found, the panel shows that, closes on dismiss, and the row is dropped on the next load.

## Functional Requirements

- **FR-001**: `/inventory` MUST render the Inventory page for an Admin, replacing the shell's placeholder, and MUST stay refused for an Employee (spec 003 FR-006, FR-011).
- **FR-002**: The table MUST show `MODEL` · `CATEGORY` · `PURCHASE REQUEST` · `SERIAL NUMBER` · `OFFICE` · `ASSIGNED` · `STATUS` · `ACTION`, as Story 1 criterion 2 defines them, and MUST NOT show a BitLocker Identifier or a Recovery Key/PIN.
- **FR-003**: The page MUST offer chips **All items** · **Assigned** · **Available** · **Reserved**, each with its count over the current search and category, **All items** selected by default, and the selected chip MUST expose its pressed state.
- **FR-004**: Search MUST match item name, model, PR and serial number, case-insensitively and ignoring surrounding whitespace. The category select MUST list **All categories** and the contract's categories.
- **FR-005**: The table MUST list units newest added first, and MUST paginate with the shared pagination: range, Back / page numbers / Next, **Result per page** offering 10 · 25 · 50 · 100 and defaulting to 50, as the Queue and History do. Changing chip, search, category or page size MUST return to page 1.
- **FR-006**: **+ Add Inventory** MUST be a menu button (chevron-down) that opens a menu of **Add Single Unit** and **Add Multiple Units** under it; both panels are reached only from this menu, and the menu MUST expose its expanded state and close on Esc and an outside click. The row's **Review** MUST open Review/Edit. The hidden **View details →** link MUST NOT be built.
- **FR-007**: No Status control MUST offer `Reserved`. Add Single Unit MUST offer `Available` · `Assigned` · `Inactive` (D3, amended 2026-10-02). Review/Edit MUST offer `Available` · `Assigned` · `Inactive` for a unit that is not reserved, and MUST make Status, User and Office read-only for a reserved one.
- **FR-008**: `Assigned` MUST require a User. Picking a User MUST set Status to `Assigned`; choosing `Available` or `Inactive` MUST clear the User. The User field MUST search every user by name or email, whatever their role or office.
- **FR-009**: Removal MUST be refused for `Assigned` and `Reserved` units, with the reason shown in REMOVE UNIT, and MUST require a non-blank **Reason for removal** for the rest. A non-blank reason MUST open a confirmation before the unit is deleted; cancelling that confirmation MUST leave the unit in place.
- **FR-010**: Add Multiple Units MUST open with one empty row and keep the **No. of Units** count equal to the number of unit rows, between 0 and 100. Every row MUST stay editable until save, with a ✕ to remove it and no per-row confirm. It MUST refuse to save with zero rows, a row missing a required serial number, or a non-blank serial number repeated within the batch, and MUST save the batch all or nothing. Every unit it creates MUST start `Available`.
- **FR-011**: Validation problems MUST be mapped to fields by the shared parser (`errors[].pointer`), including per-row pointers in a batch. A conflict MUST show the source's own message. The SPA MUST NOT invent an error code.
- **FR-011a**: The device fields MUST follow the asset's category from one data table (D13): BitLocker Identifier and Recovery Key/PIN for Laptop only; Serial Number for every category, required except for Mice and Other Devices. A hidden field MUST NOT be submitted.
- **FR-012**: The BitLocker Identifier and Recovery Key/PIN MUST be masked by default in every input, each with a Show/Hide toggle, and MUST NEVER be written to a log, a URL, or any Employee view.
- **FR-013**: Price MUST be 0 or more with at most two decimals, entered and shown in Philippine pesos (`Php 80,000.00`). Purchased Date MUST NOT be in the future. Supplier and the device fields MUST be at most 255 characters, and Description at most 2,048. Attachment MUST be `.jpeg` or `.png`, at most 25 MB.
- **FR-014**: No UI path MUST write a stock count. Counts MUST change only as a consequence of adding, editing (status, assignee, office) or removing a unit, as Stories 2–5 state.
- **FR-015**: While the source loads, the page MUST show the shared loading state. It MUST show an empty state when nothing matches, and an error state with a retry when the source fails.
- **FR-016**: Panels MUST close on ✕, Esc and a scrim click, MUST hold focus while open, and MUST return focus to the control that opened them. Every control MUST be keyboard-operable with visible focus. The page and panels MUST stay usable from 360px to 1440px without page-level horizontal overflow.
- **FR-017**: The SPA MUST NOT invent REST routes, payloads, response fields or error codes (constitution VII). Every gap in *Contract gaps* MUST be raised in `specs/001-office-supplies-mvp/contracts/README.md`, and a contract-backed source MUST NOT send a field the contract does not publish.

## Key Entities

- **Unit**: one physical item. Asset (item name, model, category), serial number, office, status (`Available` · `Reserved` · `Assigned` · `Inactive`), assignee (name, department), purchase details (PR, price, supplier, purchased date), device details (BitLocker Identifier, Recovery Key/PIN: secrets), notes (description, attachment). This is the SPA's read model, not an API shape.
- **Unit batch**: one asset, one office, shared purchase details, and 1–100 entries, each carrying the device fields the asset's category has (D13): a serial number, plus BitLocker Identifier and Recovery Key/PIN for a Laptop.
- **Inventory query**: chip, search, category, page and page size, as one value.
- **Assignable user**: a user an Admin can assign a unit to: name, email (and department, where published).

## Contract gaps (to raise)

Read from the backend's source on 2026-10-01. Each is raised in `contracts/README.md`, not bridged.

| # | Gap | Needed |
|---|-----|--------|
| G1 | **Removal guards nothing.** `DELETE /inventory-items/{id}` removes any unit, `Assigned` and `Reserved` included | The API refuses both (constitution III) |
| G2 | **No removal reason** on `DELETE /inventory-items/{id}` | A reason field, or the design drops it (D10) |
| G3 | **Secrets reach Employees.** `GET /inventory-items` and `GET /inventory-items/{id}` allow the `employee` role and return `bitlockerIdentifier` and `recoveryPin` | Omit both for an Employee, or make the reads Admin-only (constitution VIII, IX) |
| G4 | **`PATCH` accepts any status**, `Reserved` included, and any assignee change on a reserved unit | The API refuses manual moves into or out of `Reserved` (constitution III) |
| G5 | **No Purchase Request number** (`PR`) on the unit, single or bulk (D14). The earlier record asked for a unit *tag*; that reading is withdrawn | A PR field on create, bulk, update and read |
| G6 | **No assignee on read.** The unit returns its asset only, not `assignedTo`; users carry no department | The assignee's name and department on the unit read |
| G7 | **Attachment is a URL** (`attachmentUrl`), and no upload operation is published; the design draws a file uploader | An upload operation, or the design changes |
| G8 | **`In Storage`** drawn, not in the status set (D1) | One status set |
| G9 | **Search, counts and order.** `search` matches asset name, model or category, not PR or serial; there is no office filter and no per-status count for the chips; the list is ordered by id ascending, not newest added first (FR-005) | Search by PR and serial; status counts, or the SPA counts per status; a newest-first order |
| G10 | **Create takes no status.** A new unit is `Available`, or `Assigned` when a user is given; the design (as amended 2026-10-02) adds a unit as `Inactive` too (D3) | A status on create limited to `Available`, `Assigned` and `Inactive`, or the SPA follows the create with a status update |

## Out of Scope

- The Assets screen and its panels (spec 014). Low-stock thresholds and stock bands live there.
- The retired **Update stocks** panel and per-office steppers (ADR-0008).
- `In Storage` as a status (D1). The `RAM` field in the Bulk rows (drift-2026-10-01 D11).
- The other unit fields in the project owner's *IT Inventory Item Details* table: **Inventory Code** (Laptop), **IMEI**, **MEID** and **Password** (Phone), **Employee ID** and **Deployed**. None is drawn or in the contract. Raised with the designer and the backend as a follow-up (Q10).
- Sort controls, an office filter, export, import, barcode or QR scanning. None is drawn.
- Unit history or audit beyond what the source stores. A returns workflow beyond clearing an assignment (D5).
- Any request transition or notification. Nothing here changes a request.
- REST contract definition.

## Success Criteria

- **SC-001**: A tester adds 3 units of one asset at Cebu with Add Multiple Units and, using only the UI, sees 3 `Available` rows with OFFICE Cebu and the asset's AVAILABLE UNITS on Assets up by 3 (spec 001 US1 acceptance 2). The per-office rise in Available and Total at Cebu is asserted by the check script (plan P19).
- **SC-002**: A tester records an existing assignment on an `Available` unit, then clears it, and the counts return to where they started.
- **SC-003**: For every unit status, the Status control offers exactly the options in FR-007, and no control in the feature can set `Reserved`.
- **SC-004**: Removal succeeds only on `Available` and `Inactive` units, and only with a reason. It is refused on every `Assigned` and `Reserved` unit (spec 001 US1 acceptance 2a).
- **SC-005**: A batch with one invalid row creates no unit, and the error appears under that row's field.
- **SC-006**: No table cell, Employee view, URL or log line contains a BitLocker Identifier or Recovery Key/PIN.
- **SC-007**: An Employee cannot reach Inventory through navigation or by address.
- **SC-008**: Review of the feature finds no invented route, payload, field or error code. Every gap G1–G10 is recorded in `contracts/README.md`.

## Clarifications

### Session 2026-10-01

Raised while specifying BEN-150 (I0, BEN-151) against the 2026-10-01 export and the backend's `/inventory-items` source, and decided by the project owner.

- **Q1**: May an Admin clear a unit's assignment (`Assigned` → `Available`)? The drawn copy says *"Remove assignment first"*, and the contract supports it, but constitution III and ADR-0008 list only `Available` ↔ `Inactive` and recording an assignment. → A: **Yes, for any `Assigned` unit** (D5). It requires a MAJOR amendment of constitution III (9.0.0: an existing principle is redefined) and ADR-0008 decision 3, committed before any feature code (tasks T007 onward). Done 2026-10-01: the amendment is the first commit of this feature's branch and ships in the same PR (project owner).
- **Q2**: Which options does `Status *` offer on Add Single Unit? The contract's create takes no status. → A: **`Available` · `Assigned` only** (D3). `Assigned` requires a User; `Inactive` is set on Review/Edit. **Amended 2026-10-02** by the project owner: `Inactive` is offered on add as well (G10).
- **Q3**: How does Review/Edit show a stored BitLocker Identifier and Recovery Key/PIN? → A: **Masked by default, with a per-field Show/Hide toggle**; editing replaces the value (D6). An undrawn addition.
- **Q4**: How is Add Multiple Units reached? → A: **From the + Add Inventory dropdown**: the button carries a chevron, and the menu under it lists **Add Single Unit** and **Add Multiple Units** (project owner's screenshot of `03 - Inventory - Open Add Inventory Dropdown`). Story 2 criterion 1, FR-006.
- **Q5**: What does Add Multiple Units hold when it first appears? The file draws the count `0` over two filled rows. → A: **Count 1, with one empty row**; the count and the rows always match (Story 5 criterion 1a).
- **Q6**: What does a Bulk row's green ✓ do? → A: **Nothing; it is not built.** Every row stays editable, its ✕ removes it, and Save Changes checks all rows (Story 5 criterion 3, FR-010). A departure from the drawn row states, logged in `docs/design-system/additions.md` and raised with the designer.
- **Q7**: On save, what happens to a blank Bulk row? → A: **Serial Number is the one required unit field, and the BitLocker Identifier and Recovery Key/PIN appear only for the categories that carry them**: Laptop only, per the project owner's *IT Inventory Item Details* table. A blank row is refused under its serial (D13, FR-011a, Story 5 criterion 4).
- **Q8**: The table gives **Mice** and **Other Devices** no Serial Number. → A: **Shown but optional for those two**, required for every other category. A blank Bulk row is one unidentified unit for those two only (D13).

Inferred, not asked:

- `In Storage` follows spec 010: the contract's set is shown, and the gap is raised (D1).
- The removal reason is collected as drawn, and sent only where the source can carry it, as Other Notes was (spec 008 FR-007a).
- `MODEL` prints the asset's item name, which matches the drawn sample (D7).
- `Inactive` units appear under **All items** only. No chip is drawn for them.
- A `Reserved` unit shows `Unassigned` in `ASSIGNED`: its assignee is set on `Received`. The drawn `Samantha Reyes` on the reserved sample row is backdrop sample data, not a rule.
- Masking (D6) applies to every secret input, Add and Bulk included, not only to stored values on Review/Edit.

### Session 2026-10-01 — checklist

No CRITICAL or HIGH item. Seven MEDIUM / LOW items, all fixed at the project owner's choice:

- CHK001: the User field searches every user by name or email, any role, any office (Story 2 criterion 5a, FR-008).
- CHK002: picking a User sets Status to `Assigned`; `Available` or `Inactive` clears it (Story 2 criterion 5, FR-008).
- CHK003: removal mode's Cancel returns to Review/Edit; Confirm Removal asks before deleting, and confirming discards unsaved field edits (Story 4 criteria 2a, 4, 4b).
- CHK004: Bulk `-` removes the last row, even a filled one; a row's ✕ removes that row (Story 5 criterion 2).
- CHK005: newest added first; Result per page defaults to 50 (FR-005).
- CHK006: Price in Philippine pesos with two decimals; Purchased Date not in the future (Story 2 criterion 6, FR-013).
- CHK007: the Unit batch entity follows the category's device fields (Key Entities).

### Session 2026-10-01 — final clarify

- **Q9**: What does the `PR` column hold? The design's sample is `CODEV-LAPTOP-1232` and ADR-0008 calls it a tag; the project owner's table defines PR as *Purchase Request*, with a separate *Inventory Code* for Laptop. → A: **The Purchase Request number**, entered under PURCHASE DETAILS (D14). G5 is rewritten; ADR-0008 decision 1 and spec 001 FR-003 are corrected with the D5 amendment.
- **Q10**: Do the table's other unit fields (Inventory Code, IMEI, MEID, Phone Password, Employee ID, Deployed) belong here? → A: **No: out of scope**, as neither drawn nor in the contract, and raised with the designer and the backend as a follow-up (Out of Scope).
- **Q11**: Review/Edit draws the Attachment uploader empty. What shows when a unit already has one? → A: **Update Asset's image pattern**: the image fills the uploader with Replace / Download / Remove icon actions (Story 3 criterion 7b). An undrawn state, logged in `docs/design-system/additions.md`.

## Validation

- Completeness: PASS. Every P1 story has acceptance criteria.
- Clarity: PASS
- Consistency: PASS against constitution 9.0.0, whose III carries D4 and D5 and whose VIII carries D14 (amended on this branch, 2026-10-01). Consistent with specs 001, 003, 008, 010 and 014.
- Measurability: PASS
- Coverage: PASS, including the loading, empty, error, conflict and concurrent-change states.
- Edge cases: PASS

No checklist overrides.
