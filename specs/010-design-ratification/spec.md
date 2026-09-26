# Feature Specification: Ratify the open design questions from the 2026-09-22 export

**Created**: 2026-09-26
**Status**: Draft
**Linear**: [BEN-116](https://linear.app/bench-synergy-project/issue/BEN-116/design-ratify-10-open-questions-from-the-2026-09-22-export) (follow-up to BEN-113; blocks BEN-107, BEN-108). Closes when this work merges
**Sources**: drift-2026-09-22 §10, drift-2026-09-24 §8, additions §3d, the published backend contract (re-read 2026-09-25), and the `.fig` exported **2026-09-26T02:49:27Z** (17,152 nodes). This spec re-checks every question against that export.

## Overview

The 2026-09-22 export left ten questions for the designer, plus the brand red and the shell inventions in additions §3d. When re-checked against the 2026-09-26 export, most have now been answered: by the project owner (2026-09-24 and 2026-09-26), by the backend contract, by the file itself, or by a rule already on record. This feature does three things:

1. It **records** each answer, its authority and its evidence.
2. It **amends** the governing documents where the project owner's answer redefines a principle. The owner's decision to follow the file on #1/#2 makes Inventory a **per-unit register**, which constitution VIII and ADR-0006 currently put out of scope.
3. It **hands off** everything still open to a named follow-up, so BEN-116 can close.

It changes no screen, component or contract itself. The screens that follow from the amendment are built by the Assets & Inventory tasks, which this work updates.

## Where each question stands at the 2026-09-26 export

This is the baseline the stories below act on. The record is produced from this table, not from the ticket text, which is now out of date on seven of the ten.

| # | Question (drift-09-22 §10) | Finding against the 09-26 export | Proposed status |
|---|---|---|---|
| 1 | Two `03 - Inventory` frames; we took B (stock lines) | Mockups now has **one** `03 - Inventory`, and it draws **units**: `MODEL · CATEGORY · PR · SERIAL NUMBER · OFFICE · ASSIGNED · STATUS · ACTION`, with chips `Assigned · Available · Reserved`. B's stock-line table survives only as the backdrop behind two Add Inventory overlays. `03.4 - Update Stocks` and `Add Catalog Item` moved to **Archive** on 09-23. The file has picked A, not B | **Closed by the project owner, 2026-09-26: follow the file.** Inventory is the unit table. Frame B is retired. Carried by the amendment in Story 2 |
| 2 | `+ Add Inventory` opens a per-unit form from an aggregate table | It now opens `Add Single Unit` / `Add Multiple Units` from the unit table, so the design no longer contradicts itself. The backend has also moved stock onto per-unit inventory items | **Closed by the project owner, 2026-09-26: follow the file.** `+ Add Inventory` offers **Add Single Unit** and **Add Multiple Units**. Affected Linear tasks are updated (FR-009) |
| 3 | `location` / `quantity` / `lowQtyAlert` left the asset form; DTO still had them | The contract dropped `location` and `quantity`. The threshold stays on the asset in **both** the contract (`lowQtyAlert`) and the design (Update Asset panel → `STOCKS · Low-stock threshold`) | **Closed by the contract and the file.** The threshold is per **asset**. Spec 001 FR-003 is amended in Story 2 |
| 4 | Three handover labels for two states; `For Dellivery` | The project owner decided on 2026-09-24 that the state is `Ready for Pickup` (constitution 3.0.1). The file still says `For Pickup` on the queue chip (`02 - Requests Queue`, its sort menu, the Prototype queue), and the symbol is still `Property 1=For Dellivery` | **Closed by the project owner, file fix owed** |
| 5 | `Ortigas` (file) vs `Pasig` (DTO) | The file has no `Pasig` anywhere. Every contract `location` enum now says `Ortigas` | **Closed by the contract, no file fix.** The repo's own `Office` type still has to follow; that is a repo task, not a designer one |
| 6 | Two request-id formats | Still two: every screen shows `REQ-2026-1847`, every email shows `REQ-10482`. A third, `SR-1042`, appears in sample reason copy (History, the decline email, the reject panel) | **Closed by the project owner, 2026-09-26: deferred to the backend.** The SPA prints whatever id the API returns, and formats it in the API-integration phase. No designer fix |
| 7 | Request drawer still says "Note to **Approver**" | **Wider than reported.** "Note to Approver" is the title of the note block on every request panel (the six queue review panels, three My Requests panels, History, Request Submitted). "sent to your approver" appears in the submit confirmation and in the `Request received` email. Status Definitions still names "the Approver" and "the Supply Admin" | **Closed by the project owner, 2026-09-26: by design.** "Approver" names the job (whoever approves the request), not a role, so it stays valid after the Admin merge. No file fix for the "Approver" copy. The rest of the Status Definitions copy ("Supply Admin", "Inventory is automatically deducted" on approve) is a separate slip and goes to the designer follow-up (Story 3) |
| 8 | Wifi / Type C Hub / Other Device show `Category *` = "Mice" | Unchanged | **Closed by the project owner, 2026-09-26: not an issue.** No file fix |
| 9 | Eight Add Asset frames carry Inventory's subtitle and chips | Unchanged ("Monitor stock levels…", `All items (238)`). Separately, `03- Assets` itself now reads "Assigned and available units" | **Closed by the project owner, 2026-09-26.** Every Assets screen reads **"Assigned and available units"**. The Add Asset header is backdrop, which the panel-frame rule below says to ignore. No file fix |
| 10 | `Inventory Status` labels all paint `#2e7e47` | Six of seven labels **bind** a status style (`Status/Rejected` `#c81e1e`, `Status/Pending Approval` `#b4740e`, `Status/Ready for Pickup` `#235ea7`, `Ink-600` `#4b5063`). Only the cache is green. `Available` binds nothing and is genuinely green. The rule "the style is the authority" (drift-09-22 §9) says the component is correct | **Closed by the existing rule.** A cache refresh is optional, not owed |
| — | Brand red | Still two: `#c62828` in 375 paints (359 unbound), `#cc2f4a` in 320 (305 bound to `Codev Red`) | **Open**, still blocks a clean re-vendor |
| — | additions §3d shell inventions | The Prototype page's `05 - Profile` (09-18) draws a **Sign Out** button inside the profile card; we placed ours in the top bar. Loading, not-found, forbidden, error, collapsed navigation and an Admin profile are still undrawn | **Open.** One is partly answered by the Prototype page, the rest are unanswered |

**Reading rule, set by the project owner on 2026-09-26.** In a frame that draws a side panel over a page, **only the panel is authoritative**. The page behind it is backdrop and may be out of date. This is why the stock-line table behind `Add Inventory` does not count as evidence for frame B, and why the Inventory header behind the eight Add Asset panels does not count as Assets copy.

Overlaps folded in from drift-09-24 §8, and where each goes:

- 09-24 #4 (who completes a request) and the **`Received`** status: the 09-26 export takes these further. Three Employee frames now draw a five-step timeline with `Received`, and there is a new `Status changed email - Received`. These **stay with the project owner's pending 09-24 §2 decision**. This work cross-references them and neither decides nor builds them.
- 09-24 #5 (Status Definitions copy): the "Approver" wording is closed under #7. "Supply Admin" and "deducted on approve" go to the designer follow-up.
- 09-24 #6 (queue chip `For Pickup`): the same as #4's file fix.
- 09-24 #7 (unit-level Inventory frames): answered by #1/#2.

## User Stories

### Story 1 — Record a status for every question (Priority: P1)

A maintainer updates each of the ten questions, the brand red and each §3d invention in drift-2026-09-22 §10. Each entry gets one status, its authority, the date, and a link to the evidence in the 2026-09-26 drift entry. The panel-frame reading rule goes in alongside the style-over-cache rule, so later diffs apply it too.

**Why this priority**: The ticket text is out of date on nine of ten. Anyone who reads it as-is waits on answers that already exist, or builds frame B, which is now retired.

**Acceptance Criteria**:

1. **Given** the drift-09-22 §10 list, **When** the record is updated, **Then** each item carries exactly one status, an authority, a date and a link to its evidence.
2. **Given** an item closed by someone other than the designer (all ten questions), **When** it is recorded, **Then** the entry names that authority and asks the designer at most for a file correction.
3. **Given** #10, **When** it is recorded, **Then** the entry cites the style-over-cache rule and the four bindings that satisfy it.
4. **Given** the panel-frame rule, **When** a later export is diffed, **Then** the rule is written down where the drift method is described, not only in this record.

### Story 2 — Amend the governing documents for the unit register (Priority: P1)

The project owner has decided that Inventory follows the file: each row is a **unit** of an asset, and `+ Add Inventory` adds one unit or several. Constitution I requires that decision to land as an amendment before any screen is built from it. The maintainer carries it through the constitution, a new ADR, spec 001, the process flow and ARCHITECT, all citing drift-2026-09-26.

**Why this priority**: BEN-107 and BEN-108 cannot be rebuilt against units until the constitution stops forbidding them. It is also the one answer that changes the domain, not just copy.

**Acceptance Criteria**:

1. **Given** constitution 3.0.1, **When** the amendment lands, **Then** it is **4.0.0** (MAJOR). VIII no longer puts the register out of scope, and III defines stock per (asset, office) as counts of units by status. Both copies of the constitution change together.
2. **Given** ADR-0006, **When** the amendment lands, **Then** a new ADR records the register decision, supersedes ADR-0006's stock-line and "register is post-MVP" decisions, and keeps the Assets/Inventory split. ADR-0006 is marked accordingly.
3. **Given** spec 001, **When** it is amended, **Then** US1, FR-003 and Key Entities describe units (tag, serial, office, assignment, status, purchase and device details). The threshold is per asset. The register leaves Out of Scope. The Update stocks panel is withdrawn.
4. **Given** the request pipeline, **When** the rules are restated, **Then** every transition still moves stock exactly as today, expressed as unit status changes (FR-006).

### Story 3 — Hand the designer one follow-up (Priority: P2)

Everything still owed by the designer goes into one list, with the frame, what is wrong and what it should say. It covers: the `For Pickup` chip → `Ready for Pickup`; the `For Dellivery` symbol; the Status Definitions copy ("Supply Admin"; approval "deducts" stock); the brand red; and the §3d ratification (Story 4). The list becomes a single follow-up so BEN-116 can close.

**Why this priority**: None of these blocks a screen, because the build works around each one. They do block a clean re-vendor.

**Acceptance Criteria**:

1. **Given** the record, **When** the list is produced, **Then** every *file fix owed* or *Open* designer item appears exactly once, with frame name, current text and intended text, or with the decision being asked for.
2. **Given** BEN-116 closes, **When** the list is checked, **Then** it lives in the repo as the follow-up of record (no Linear ticket, by the owner's choice).

### Story 4 — Put the §3d inventions to the designer (Priority: P2)

Each shell invention goes to the designer as ratify-or-replace: the feedback surfaces (loading, not-found, unavailable, forbidden, placeholder, error) and their use of status tints; the sign-out control; collapsed navigation; the 32px gutter; and the Admin profile. The sign-out question shows both placements: ours in the top bar, and the Prototype page's inside the profile card.

**Why this priority**: The ticket's third done-when. Every invention already ships, so nothing waits on it.

**Acceptance Criteria**:

1. **Given** additions §3d, **When** the request is written, **Then** each of the five items is listed with what we built and a ratify-or-replace choice.
2. **Given** a later designer answer, **When** it is recorded, **Then** additions §3d marks the item *Ratified* or *Replaced by <frame>*.

### Story 5 — Record the 2026-09-26 export (Priority: P2)

The 09-26 export gets its own drift entry. It lists the six frames that moved since 09-24. It records the Mockups-page state behind #1/#2: the single unit-level `03 - Inventory`, `03.4 - Update Stocks` and `Add Catalog Item` on Archive, and the unit frames. It routes the new `Received` timeline step and email to the owner's pending 09-24 §2 decision, and it holds the evidence the §10 statuses link to.

**Why this priority**: Constitution I requires the diff before the amendment in Story 2 can cite it.

**Acceptance Criteria**:

1. **Given** the 09-26 export, **When** it is recorded, **Then** every top-level frame with a node edited after 2026-09-24T05:59:31Z is listed with node counts and last-edit times.
2. **Given** the `Received` additions, **When** they are recorded, **Then** they are marked *Not applied, pending the project owner (drift-09-24 §2)*.

### Story 6 — Bring the affected Linear tasks up to date (Priority: P2)

The Assets & Inventory tasks were written against frame B and the Update stocks panel. The maintainer rewrites each affected task against the latest file: the unit table, the Add Inventory dropdown, Add Single Unit, Add Multiple Units, Review/Edit unit, and Delete Unit with its confirmation. The Assets subtitle becomes "Assigned and available units", the Assets column becomes `ASSIGNED UNITS`, and the threshold moves to Update Asset. Each task says what changed and cites this record.

**Why this priority**: The tasks are In Progress right now. Every day they point at frame B is work thrown away.

**Acceptance Criteria**:

1. **Given** BEN-107 (Inventory table), **When** it is updated, **Then** its title, checklist and design source describe the unit table, and its "Which frame?" blocker is removed.
2. **Given** BEN-108 (Update stocks panel), **When** it is updated, **Then** it describes the add-unit, review/edit-unit and delete-unit panels, and says the Update stocks panel is retired.
3. **Given** the Assets tasks (BEN-80, BEN-82, BEN-84), **When** they are updated, **Then** they carry the "Assigned and available units" subtitle, the `ASSIGNED UNITS` column, and the threshold on Update Asset.
4. **Given** BEN-115 (backend conflicts), **When** it is updated, **Then** conflict 1 records that the owner chose the unit register. The aggregate read the Assets screen needs (available / reserved / assigned counts per asset) is the part still open.
5. **Given** any updated task, **When** a developer reads it, **Then** a dated note at the top says what changed and why.

### Edge Cases

- **A designer answer disagrees with an owner decision** (for example, keeps `For Pickup`). The owner's decision stands, and the disagreement goes back to the owner.
- **A later export reverses a finding** (for example, frame B returns to Mockups). The record is re-checked against it, and the owner's 2026-09-26 decision stands unless the owner reverses it.
- **Deleting a unit that is assigned or reserved.** Refused. The file draws "This unit can't be removed because it is assigned to a user", and a reserved unit is holding stock for a live request.
- **Adding units to an office that has none.** Allowed. The asset becomes requestable from that office.
- **Recovery Key/PIN and BitLocker Identifier.** These are secrets under constitution IX, visible and editable by the Admin only, and never shown to an Employee or written to a log.
- **The file draws unit statuses the contract lacks** (`In Storage`), or the contract has statuses the file lacks. The SPA shows the contract's set. The gap is raised under constitution VII, not bridged.
- **The brand red is answered with a repaint.** The answer is recorded here. The repaint goes through the re-vendor (T000e), not this work.
- **Nobody answers the designer follow-up within the MVP window.** Every open item keeps its current, recorded workaround.

## Functional Requirements

**Record**

- **FR-001**: The record MUST give each of the ten drift-09-22 §10 questions, the brand red, and each of the five §3d items exactly one status: *Open*, *Closed*, *Closed — file fix owed*, *Closed — by design*, or *Closed — deferred to <owner>*.
- **FR-002**: Each entry MUST name the closing authority (designer, project owner, backend contract, or a named recorded rule), the date, and link to its evidence.
- **FR-003**: The record MUST be checked against the latest export, 2026-09-26T02:49:27Z at the time of writing, not against the ticket text. The statuses MUST live in drift-09-22 §10 and the evidence in a new drift-2026-09-26 entry.
- **FR-004**: The panel-frame reading rule MUST be recorded as a standing method rule: in a frame drawing a side panel over a page, only the panel is authoritative.

**Amendment (unit register)**

- **FR-005**: Constitution MUST move to **4.0.0**. **VIII** admits the per-unit register (tag, serial number, office, assignee, status, purchase details, device details including BitLocker identifier and recovery key/PIN) into the MVP. **III** defines stock per (asset, office) as counts of units by status. Both copies change together, with a version-history row citing drift-2026-09-26.
- **FR-006**: The stock rules MUST stay behaviourally the same, restated over units, per (asset, office):
  - **Available** is the count of units in `Available` status.
  - **Reserved** is the count in `Reserved` status.
  - **Total** = Available + Reserved, which is units in store. Assigned and inactive units are not in store.
  - **Submit** moves *qty* units Available → Reserved. **Reject** and **cancel** move them back. **Complete** moves them Reserved → Assigned, with the requester as assignee. Approve and handover change nothing.
  - Which specific units are chosen is the backend's decision. A request line's quantity MUST NOT exceed Available at the requesting office.
  - Only request transitions move units into or out of `Reserved`. Admin unit edits outside a request (`Available` ↔ `Inactive`, recording an existing assignment) can change Total, and are the one exception to "same numbers" (clarification, review 2026-09-26).
- **FR-007**: A new ADR MUST record the register decision and withdraw ADR-0006 decision 5 (register post-MVP) and the stored-quantity parts of decisions 1 and 3 ("stock is a quantity", the stock-set row, the Deployed column). Decisions 2 (vector over offices) and 4 (the threshold term), the Assets/Inventory split and reserve-on-submit stay. *(Corrected 2026-09-26 in review: the original numbering did not match ADR-0006.)* ADR-0006's status MUST say which parts were superseded.
- **FR-008**: Spec 001 MUST be amended with a dated session citing drift-2026-09-26:
  - US1 (stock is added as units, one or several at once).
  - FR-003 (units per office; threshold per asset).
  - Key Entities (a Unit entity).
  - Out of Scope (the register removed).
  - US8 / FR-017 (Currently Assigned comes from units assigned to the user).
  - The Update stocks panel is withdrawn.
  - `docs/process-flow.md` stock rules and ARCHITECT §4/§6 MUST follow.
- **FR-009**: The amendment MUST keep the Admin as the only role that can create, edit or delete units. It MUST forbid deleting a unit that is `Assigned` or `Reserved`. It MUST treat BitLocker identifier and recovery key/PIN as Admin-only secrets that are never shown to an Employee or logged.
- **FR-010**: The `Received` status, the accountability form and the Admin-on-submit email MUST NOT be adopted by this amendment. They remain the owner's pending drift-09-24 decisions.

**Hand-off**

- **FR-011**: The record MUST produce one designer follow-up list. Each owed item appears once, with frame, current text and intended text (or the decision asked for), and the five §3d items are posed as ratify-or-replace, including any placement the file already draws.
- **FR-012**: BEN-116 closes when this work merges. Every item not *Closed* MUST link to a follow-up that carries it: the in-repo designer follow-up list (FR-011) for designer items, and the named task for anything else. No new Linear ticket is created. The project owner declined one on 2026-09-26, and raising it later is the maintainer's choice.
- **FR-013**: The affected Linear tasks MUST be updated to the owner's decisions, with a dated change note on each. The project owner authorized this on 2026-09-26. The affected tasks are BEN-107, BEN-108, BEN-80, BEN-82, BEN-84 and BEN-115. The designer follow-up list itself lives in the repo, and forwarding it to the designer is the maintainer's choice.
- **FR-014**: Follow-ons that belong to other tasks MUST be listed with an owner, not done here. The known one is the repo's `Office` type still spelling `Pasig`.

## Out of Scope

- Building any screen, component, type or route. The unit screens are built by the updated Assets & Inventory tasks.
- Deciding anything left to the designer (Story 3/4 items) or to the backend (request-id format, unit selection, the aggregate read).
- The `Received` status, the accountability form and the Admin-on-submit email.
- Re-vendoring the design system (T000e).
- Editing the `.fig`.

## Success Criteria

- **SC-001**: All 17 items (ten questions, the brand red, five §3d items) carry a status, an authority, a date and an evidence link. 0 items still read as the ticket first stated them.
- **SC-002**: Items closed by an authority other than the designer have 0 decision requests sent to the designer.
- **SC-003**: Constitution, the new ADR, ADR-0006, spec 001, process flow and ARCHITECT agree on the unit register. A reviewer finds 0 remaining statements that the register is out of scope or that stock is set per office by stepper.
- **SC-004**: Every stock rule in FR-006 gives the same Available / Reserved / Total numbers as the 3.0.1 rules for the same request history.
- **SC-005**: BEN-107, BEN-108, BEN-80, BEN-82, BEN-84 and BEN-115 each name the latest frames. 0 of them still point at frame B or `03.4 - Update Stocks`.
- **SC-006**: When BEN-116 closes, 0 items are left without a follow-up.

## Clarifications

### Session 2026-09-26

- Q: Has the designer answered any of the ten? → A: Not stated. Re-check the latest `.fig` (exported 2026-09-26T02:49:27Z) and the latest `origin/dev` (= HEAD `7dec3ef`, nothing newer), and revisit each question. The re-check produced the status table above.
- Q: Questions settled by the project owner or the contract (#3, #4, #5): designer sign-off still needed? → A: **No.** Record them as *Closed*. The designer is asked only for the file correction, if one is owed.
- Q: Fold in the overlapping drift-09-24 §8 designer items? → A: **Only where they sharpen one of the ten.** `Received` and the accountability form stay with the owner's 09-24 §2 decision.
- Q: Where does the record live? → A: **Both, split by role.** Statuses go in drift-09-22 §10 (the done-when). A new drift-2026-09-26 holds the export's diff and the evidence (FR-012).
- Q: What does finishing mean for BEN-116? → A: **Close on our PR.** The designer's remaining corrections and ratifications move to a follow-up (FR-013).
- Q: How do the designer and the owner receive the list and the escalation? → A: **In-repo only**, and the maintainer forwards them (FR-014).
- Q: #6 request-id format? → A: **Deferred to the backend.** The SPA prints and formats whatever the API returns, in the integration phase.
- Q: #7 "Approver" after the role merge? → A: **Still valid.** It names whoever approves the request, and an Admin is that person.
- Q: #8 "Mice" category on three Add Asset panels? → A: **Not an issue.** Ignore.
- Q: #9 Assets subtitle? → A: **"Assigned and available units"** on every Assets screen.
- Q: #1 which Inventory? → A: **The latest file.** `MODEL · CATEGORY · PR · SERIAL NUMBER · OFFICE · ASSIGNED · STATUS · ACTION`. In a frame with a side panel, only the panel counts; the page behind it is out of date.
- Q: #2 what `+ Add Inventory` opens? → A: **The latest file.** Add Single Unit and Add Multiple Units. Update the affected Linear tasks.
- Q: Where does the unit-register amendment land? → A: **In this work.** Constitution 4.0.0, a new ADR, spec 001, process flow and ARCHITECT (Story 2).
- Q: Which unit frames do the updated tasks cover? → A: **All drawn unit frames.** Table, Add Inventory dropdown, Add Single Unit, Add Multiple Units, Review/Edit unit, Delete Unit and confirmation.
- Q: How do the stock rules map onto units? → A: **Counts of unit statuses per (asset, office).** Submit Available→Reserved; reject/cancel back; complete Reserved→Assigned to the requester. The backend picks the units (FR-006).
- Q: Create a Linear ticket for the designer follow-up? → A: **No.** The in-repo list is the follow-up of record (FR-012).
- Q (review, 2026-09-26): The unit panels let an Admin set Status and User directly. Can a hand-edit reserve or assign a unit? → A: **The pipeline owns `Reserved`.** Only request transitions move units into or out of `Reserved`. An Admin may set `Available` ↔ `Inactive` and may record an existing assignment, which counts as units leaving the store outside a request (constitution 4.0.0 III, ADR-0008).
