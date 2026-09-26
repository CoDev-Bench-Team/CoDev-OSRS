# Tasks: Ratify the open design questions from the 2026-09-22 export

**Spec**: specs/010-design-ratification/spec.md
**Plan**: specs/010-design-ratification/plan.md
**Structure**: plan D1 order (each document cites only documents that already exist), with a story tag on each task
**Tracker**: BEN-116

Format: `- [ ] [TaskID] [P?] [Story?] [Tracker] Description — path`

Documentation only. No `src/`, `e2e/` or config changes (plan D12).

## Done before this list

- [x] T000 [US6] [BEN-116] [BEN-107] [BEN-108] Linear tasks BEN-107, BEN-108, BEN-80, BEN-82, BEN-84 and BEN-115 were updated to the owner's 2026-09-26 decisions, each with a dated change note, on 2026-09-26 (spec FR-013). Originals are backed up in the session scratchpad — Linear

## Phase 1: Record the 2026-09-26 export

Constitution I: the drift has to exist before anything cites it.

- [x] T001 [US5] [BEN-116] Create the drift file. Header: baseline 09-24; export `2026-09-26T02:49:27Z`; 17,152 nodes; status. §How this was read: the kiwi/zstd method, rolled up by edit time after `2026-09-24T05:59:31Z`, the style-over-cache rule, and the **panel-frame rule** (in a frame with a side panel, only the panel is authoritative; plan D8) — `docs/design-system/drift-2026-09-26.md`
- [x] T002 [US5] [BEN-116] §1 What moved: the six frames with touched/new node counts and last-edit times (`Status changed email - Received`, `03.1 - Request List - Request Submitted`, `02 - Catalog`, `02.1 - Catalog - View Specs`, `04.1 - My Requests - View Request`, `04.2- My Requests - Cancel Request`), plus the frames that did not change — `docs/design-system/drift-2026-09-26.md`
- [x] T003 [US5] [BEN-116] [BEN-107] [BEN-108] §2 Accepted, the project owner's 2026-09-26 decision: Inventory is a unit register. Cover the single Mockups `03 - Inventory` @(878,21390) and its columns and chips; the unit frames (dropdown, Add Single Unit, Selected Catalog Item, Bulk Add Units, Review/Edit ×2, Delete Unit, Delete Unit Confirmation with `Reason for removal *`); `03.4 - Update Stocks` and `Add Catalog Item` moved to Archive on 09-23; the Assets subtitle "Assigned and available units"; `ASSIGNED UNITS`; and `STOCKS · Low-stock threshold` on Update Asset. Cite ADR-0008 and constitution 4.0.0 — `docs/design-system/drift-2026-09-26.md`
- [x] T004 [US5] [BEN-116] §3 Not applied: the `Received` step on three Employee five-step timelines and `Status changed email - Received`, pending the project owner (drift-09-24 §2) — `docs/design-system/drift-2026-09-26.md`
- [x] T005 [US1] [BEN-116] §4 Evidence per question, one anchored subsection each, for the §10 table to link to:
  - #4: the `For Pickup` chip locations and the `Property 1=For Dellivery` symbol
  - #5: no `Pasig` in the file
  - #6: `REQ-2026-1847` / `REQ-10482` / `SR-1042`
  - #7: every "Approver" surface
  - #8, #9: the Add Asset frames
  - #10: the four style bindings
  - brand red: `#c62828` 375 (359 unbound), `#cc2f4a` 320 (305 bound)
  - §3d: Prototype `05 - Profile` `Sign Out`; no loading, not-found, forbidden, error, collapsed-nav or Admin-profile frames

  — `docs/design-system/drift-2026-09-26.md`
- [x] T006 [US3] [US4] [BEN-116] §5 **Designer follow-up**, the single list (plan D6). Each item gets frame, current text and intended text, or the decision being asked for:
  - the `For Pickup` chip → `Ready for Pickup` (queue, sort menu, Prototype queue)
  - the `For Dellivery` symbol name
  - the Status Definitions copy ("Supply Admin"; approval "deducts" stock)
  - the brand red
  - the five §3d items as ratify-or-replace, with sign-out showing both placements

  State that no Linear ticket exists, by the owner's choice (spec FR-012) — `docs/design-system/drift-2026-09-26.md`
- [x] T007 [US1] [BEN-116] Add one line: apply the panel-frame rule, with a link to drift-09-26 §How this was read — `docs/design-system/fidelity-checklist.md`

## Phase 2: Ratification record

Depends on Phase 1.

- [x] T008 [US1] [BEN-116] Amend the status line. Under §10's ten verbatim questions, add the **status table** (# · status · authority · date · evidence link) with 16 rows: #1–#10, the brand red, and the five §3d items (plan D7). Point "What is left" item 4 at drift-09-26 §5 — `docs/design-system/drift-2026-09-22.md`
- [x] T009 [P] [US1] [BEN-116] Mark §4 and §8 item 7 *resolved by the owner 2026-09-26 → drift-09-26 §2*. Cross-reference §8 items 4–6 to where they now live — `docs/design-system/drift-2026-09-24.md`

## Phase 3: Amendment core (constitution 4.0.0, ADR-0008)

Depends on Phase 1 (T003). T010 and T011 land in the same commit (Governance).

- [x] T010 [US2] [BEN-116] Constitution → **4.0.0**, last amended 2026-09-26 (plan D3).
  - Rewrite **III** as counts of units by status per (asset, office). Keep `Total = Available + Reserved`, with Total = Available + Reserved units and Assigned/Inactive excluded. Submit Available→Reserved; reject/cancel back; complete Reserved→Assigned to the requester; the backend picks the units.
  - Rewrite **VIII**: the register is in scope; BitLocker identifier and recovery key/PIN are Admin-only secrets (cross-reference IX).
  - The intro cites drift-09-26.

  — `AGENTS.md`
- [x] T011 [US2] [BEN-116] Same III/VIII text, character for character, plus a version-history row for 4.0.0 citing drift-09-26 and ADR-0008 — `specs/constitution.md`
- [x] T012 [P] [US2] [BEN-116] [BEN-107] [BEN-108] New ADR-0008 "Inventory is a per-unit register".
  - Context: the 09-26 export, the owner decision, backend `/inventory-items`.
  - Decision: unit fields and statuses (the contract's set); derived stock (plan D4); threshold per asset against Available in the shown scope (plan D5); Admin-only secrets; no removal while `Assigned` or `Reserved`.
  - Consequences: partly supersedes ADR-0006 (decision 5, and the stored-quantity parts of 1 and 3; corrected in review); PR #41's Update stocks work is retired; Profile gains a source.
  - Alternatives: stock lines (frame B); hybrid.

  — `docs/adr/0008-per-unit-inventory-register.md`
- [x] T013 [US2] [BEN-116] Status: "Accepted — partly superseded by ADR-0008 (2026-09-26)", naming decision 5 and the stored-quantity parts of 1 and 3 — `docs/adr/0006-assets-and-inventory.md`
- [x] T014 [US2] [BEN-116] Add the 0008 row and mark 0006 partly superseded — `docs/adr/README.md`

## Phase 4: Derived governing documents

Depends on Phase 3. The [P] tasks touch different files and can run in any order.

- [x] T015 [US2] [BEN-116] Add `### Session 2026-09-26 — Amendment` citing drift-09-26 (plan D9).
  - Rewrite US1 (units added one at a time or in bulk; threshold on the asset).
  - Rewrite FR-003 (units per office; derived counts; threshold per asset).
  - Add FR-003b (removal guard; Admin-only secrets).
  - FR-017: source is the units assigned to the user.
  - Key Entities: add Unit; Stock becomes derived.
  - Out of Scope: drop the register bullet.
  - Assumptions: drop the Ortigas/Pasig line.
  - Withdraw the Update stocks panel.

  Strike through withdrawn text; never delete it silently — `specs/001-office-supplies-mvp/spec.md`
- [x] T016 [P] [US2] [BEN-116] Add the Unit entity. Stock becomes a projection, with `lowStockThreshold` moved to Asset. Deployed → assigned units. Add the relationships. Restate the stock-vs-status table over unit statuses. Remove the register from "Deliberately not modelled", and note `In Storage` as a VII gap — `specs/001-office-supplies-mvp/data-model.md`
- [x] T017 [P] [US2] [BEN-116] Baseline note. Restate Stock Rules 1–9 over units. "Deployed" → "Assigned". Close the Ortigas/Pasig callout — `docs/process-flow.md`
- [x] T018 [P] [US2] [BEN-116] Update the last-amended line. §1 references ADR-0008. §4 Inventory owns Units. Restate the §6 table over unit statuses. §7 authZ adds "Create / edit / remove units: Admin". The `/inventory` route becomes `03 - Inventory` + unit panels. §13 adds ADR-0008 — `ARCHITECT.md`
- [x] T019 [P] [US2] [BEN-116] Remove the register non-goal. The Admin job adds "manage units" — `docs/product.md`
- [x] T020 [P] [US2] [BEN-116] Hard Rules stock line → ADR-0008 unit counts. The Out of Scope line drops the register — `CLAUDE.md`
- [x] T021 [P] [US2] [BEN-116] Conflict statuses:
  - Conflict 1 decided: register, per ADR-0008. Still open: the per-asset count read, and a reason on unit delete.
  - Conflict 2 closed, with the `Office` = `Pasig` follow-on in `src/features/auth/types.ts`.
  - Conflict 3 closed: threshold per asset.
  - Request id deferred to the backend.
  - The `status.ts` comment follow-on goes to BEN-107 (plan D12).

  — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T022 [P] [US2] [BEN-116] Constraints line → constitution 4.0.0. Update the Constitution Check III note — `specs/001-office-supplies-mvp/plan.md`
- [x] T023 [P] [US2] [BEN-116] [BEN-107] [BEN-108] Re-scope T010 to the unit table and T010a to the unit panels, naming BEN-107/BEN-108. Update "Blocked on decisions" (§4d and §4f closed) (plan D10) — `specs/001-office-supplies-mvp/tasks.md`
- [x] T024 [P] [US2] [BEN-116] Add a dated note: the register is in scope now, so D1's premise no longer holds, and `Currently Assigned` can read assigned units once the contract exposes them. No behaviour change (plan D11) — `specs/006-profile/spec.md`
- [x] T025 [P] [US6] [BEN-116] [BEN-107] [BEN-108] Update the route table row and rename the H6/H7 rows to the re-scoped Linear titles — `docs/linear-spa-pages-epic.md`
- [x] T026 [P] [US2] [BEN-116] Constitution row → `4.0.0`. Add the `010-design-ratification` row (plan D13) — `specs/README.md`

## Phase 5: §3d ratification hand-off

Depends on T006.

- [x] T027 [US4] [BEN-116] §3d: each of the five inventions gets "Ratification: pending designer — drift-09-26 §5". The sign-out entry notes the Prototype's in-card placement. In the closing list, update item 9 and item 11's register clause — `docs/design-system/additions.md`

## Final Phase: Verify

- [x] T028 [BEN-116] Consistency sweep:
  - The III/VIII text is identical in both copies.
  - No governing document still says the register is out of scope, or points `/inventory` at `03.4 - Update Stocks` (drift files, historical sessions and the preserved Linear history excepted).
  - Every §10 evidence link resolves.

  — `AGENTS.md`, `specs/constitution.md`, `docs/`, `specs/`
- [x] T029 [BEN-116] Guard: `npm run lint` and `npm run build` still pass — `package.json`

## Dependencies

- Phase 1 → Phase 2 and Phase 3. T001 comes before T002–T007.
- Phase 3 → Phase 4. T010 and T011 go together. T012 comes before T013 and T014.
- T006 → T027.
- T028 and T029 come last.

## Parallel opportunities

- T009 alongside T008.
- T012 alongside T010/T011.
- T016–T026 alongside each other once Phase 3 is done.

## MVP slice

Phases 1–3. At that point the record exists and the amendment is binding, so BEN-107 and BEN-108 can build legitimately. Phase 4 brings the rest of the governing documents in line.
