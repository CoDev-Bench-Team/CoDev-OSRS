# Implementation Plan: Ratify the open design questions from the 2026-09-22 export

**Date**: 2026-09-26
**Spec**: specs/010-design-ratification/spec.md
**Linear**: BEN-116
**Status**: Draft

## Summary

This is a documentation-only change set in three parts:

1. **Record.** Every drift-09-22 §10 item gets a status, the authority that closed it, and a link to its evidence. The evidence lives in a new `drift-2026-09-26.md`, which also holds the one designer follow-up list.
2. **Amend.** The project owner's 2026-09-26 decision (Inventory is a per-unit register) goes through the constitution (**4.0.0**), a new **ADR-0008**, spec 001 and every governing document that currently puts the register out of scope.
3. **Hand off.** Anything not closed points at the in-repo follow-up list or at a named task.

No application code, types, routes or contracts change.

## Technical Context

**Stack**: Markdown documentation in the SPA repo (React 19 + TypeScript + Vite + Tailwind 4; untouched)
**Primary Dependencies**: none added
**Storage**: n/a
**Target Layer(s)**: governance docs (`AGENTS.md`, `specs/`, `docs/`), no `src/`
**Performance Goals**: n/a
**Constraints**:
- Constitution I: the drift is recorded before the amendment cites it.
- Governance clause: MAJOR bump for a redefined principle, and both constitution copies change in the same commit.
- Constitution VII: no invented contract fields.
- The spec's Out of Scope: no screen, no `.fig` edit, no re-vendor, no `Received`.
- `npm run lint` and `npm run build` still pass. They are unaffected, and run only as a guard.

## Decisions

| ID | Decision | Why |
|----|----------|-----|
| D1 | **Order of the change set**: drift-2026-09-26 first, then the drift-09-22 §10 statuses, then constitution 4.0.0 + ADR-0008, then the derived documents (spec 001, data-model, process-flow, ARCHITECT, product, CLAUDE.md, contracts README, tasks, epic doc, spec 006 note), and additions §3d last | Constitution I requires each document to cite one that already exists. Doing it in this order means nothing cites forward |
| D2 | The new ADR is **ADR-0008 — "Inventory is a per-unit register"**. It withdraws ADR-0006 decision 5 and the stored-quantity parts of decisions 1 and 3, and keeps decisions 2 and 4, the Assets/Inventory split and reserve-on-submit (corrected in review). ADR-0006's status becomes "Accepted — partly superseded by ADR-0008 (2026-09-26)" | Spec FR-007. Superseding ADR-0006 outright would lose the Assets/Inventory split and reserve-on-submit, which still stand |
| D3 | **Constitution 4.0.0**: III and VIII are redefined, and I, II, IV–VII and IX are unchanged. The III text replaces "expressed as three quantities" with "counts of units by status per (asset, office)", keeps `Total = Available + Reserved`, and restates every transition over units (spec FR-006). VIII drops the register exclusion and adds that recovery key/PIN and BitLocker identifier are Admin-only secrets (cross-referencing IX) | Spec FR-005/FR-009. Two redefined principles make this MAJOR |
| D4 | **Total** = units `Available` + units `Reserved` at that (asset, office). `Assigned` and `Inactive` units are **not** in Total. The Assets screen's *Assigned units* = the count of `Assigned` | This keeps the 3.0.1 numbers identical for any request history (spec SC-004). Complete used to "decrease Total and Reserved"; Reserved → Assigned does exactly that |
| D5 | The low-stock threshold is **per asset**, compared against **Available in the scope shown**: one office when an office is selected, otherwise the sum across offices. This matches the contract's `GET /assets` `stockLevel` + `location` behaviour | Spec row #3. It invents nothing: it restates what the contract already documents |
| D6 | The **designer follow-up list** lives in `drift-2026-09-26.md` §"Designer follow-up", the single location required by FR-011. drift-09-22 §10 and additions §3d link to it and do not copy it | One list, one place. SC-003 |
| D7 | drift-09-22 §10 keeps its ten numbered questions verbatim and gains a **status table** under them (# · status · authority · date · evidence link). The brand red and the five §3d items are rows 11–16 | The ticket's done-when names §10. Keeping the questions verbatim preserves the audit trail |
| D8 | The **panel-frame reading rule** goes into drift-2026-09-26 §"How this was read", next to the style-over-cache rule it extends. `docs/design-system/fidelity-checklist.md` gains one line pointing at it | Spec FR-004: a standing method rule, not a one-off |
| D9 | Spec 001 is amended **in place** with a new `### Session 2026-09-26 — Amendment`, in the same form as the 09-22 and 09-24 sessions. Withdrawn text is struck through or replaced, never silently deleted: FR-003, US1 scenario 2, the "per-unit register" Out of Scope bullet, and the Update stocks panel | Constitution I; this matches precedent |
| D10 | **Spec 001 `tasks.md`**: T010 is re-scoped to the unit table and T010a to the unit panels, with a note naming BEN-107/BEN-108. No new tasks are ticked | Keeps tasks.md honest with the Linear re-scope already done |
| D11 | **Spec 006 (Profile)** gains one dated note: the register is now in scope, so D1's "a register the MVP does not build" no longer holds. `Currently Assigned` can read units assigned to the user once the contract exposes them. No behaviour change: the section stays conditional (FR-007) | Spec FR-008 (US8/FR-017). Rewriting a shipped spec is out of scope |
| D12 | The `src/shared/ui/status.ts` comment that calls the register "out of scope (constitution VIII)" is **not** edited here. It goes to BEN-107 as a follow-on | The spec changes no code. A stale comment is BEN-107's to fix when it models unit statuses |
| D13 | `specs/README.md`'s constitution row (it says `1.2.0`) is updated to `4.0.0`, and the 010 folder is added at `execute` | The version row is directly what this change moves |

## Data Model

Logical model only (`specs/001-office-supplies-mvp/data-model.md`). JSON names stay backend-owned.

- **New entity `Unit`**: asset (→ Asset), tag (`PR`, e.g. `CODEV-LAPTOP-1232`), serial number, office (enum; contract spelling `Ortigas`), status (the contract's set: `Available` · `Reserved` · `Assigned` · `Inactive`), assignee (→ User, optional), assigned-on, purchase details (price, supplier, purchased date), device details (BitLocker identifier, recovery key/PIN: **Admin-only secrets**), notes (description, attachment).
- **`Stock` becomes a projection**, not a stored row. Per (asset, office): `available` = count(Available), `reserved` = count(Reserved), `total` = available + reserved. `lowStockThreshold` **moves to `Asset`**.
- **Derived on Assets**: available units, pending/reserved units, *assigned units* (was "deployed units").
- **Rules**: a unit that is `Assigned` or `Reserved` cannot be removed. Adding units at an office makes the asset requestable there.
- **Relationships**: `Asset 1──* Unit`; `User 1──* Unit (assignee)`; `Stock` derived from `Unit`.
- **Stock vs request status table**: rewritten as unit status moves (spec FR-006), with the same numbers.
- **"Deliberately not modelled"**: the register paragraph is removed. `In Storage` (drawn, not in the contract) is noted as a constitution VII gap.
- No migration: this repo has no persistence.

## API Contracts

Backend-owned. See `specs/001-office-supplies-mvp/contracts/README.md` and the [published Swagger](https://codev-osrs-backend.vercel.app/). This change edits only the README's **conflict statuses**:

- **Conflict 1** → *Decided: per-unit register (ADR-0008).* Still open: a published per-asset count read (available / reserved / assigned) for the Assets table, and whether the contract's unit-removal operation (planned as backend BEN-130) accepts the drawn `Reason for removal`.
- **Conflict 2** → *Closed* (already recorded 09-25). Adds the follow-on: `src/features/auth/types.ts` `Office` still says `Pasig` (owner: shell/auth, spec FR-014).
- **Conflict 3** → *Closed*: the threshold is per asset in both contract and design.
- **Request-id** → *Deferred to the backend*: the SPA prints what the API returns.

No routes, payloads or error codes are added.

## Component / Module Breakdown

Every file touched. There are no `src/` files.

| File | Change | Spec |
|------|--------|------|
| `docs/design-system/drift-2026-09-26.md` | **New.** Header (baseline 09-24, export 2026-09-26T02:49:27Z, 17,152 nodes). §How this was read (method, plus the panel-frame rule). §1 the six moved frames with node counts and last edits. §2 the Mockups state behind #1/#2 (single unit `03 - Inventory`, the unit frames, `03.4 - Update Stocks` and `Add Catalog Item` on Archive). §3 `Received` timeline step + `Status changed email - Received`: not applied, pending 09-24 §2. §4 evidence per §10 question (#4 chip/symbol locations, #5 no `Pasig`, #6 id formats, #7 "Approver" surfaces, #9 subtitles, #10 bindings, brand-red counts, Prototype `Sign Out`). §5 **Designer follow-up** | Stories 1, 3, 5; FR-003, FR-004, FR-011 |
| `docs/design-system/drift-2026-09-22.md` | Status line amended. §10 gains the status table (D7), and each row links into drift-09-26 §4. "What is left" item 4 points at the follow-up | Story 1; FR-001–FR-003 |
| `docs/design-system/drift-2026-09-24.md` | §4 and §8 item 7 marked *resolved by the owner 2026-09-26 → drift-09-26*. §8 items 4–6 cross-referenced | FR-008 overlap handling |
| `docs/design-system/additions.md` | §3d: each of the five inventions gets "Ratification: pending designer — see drift-09-26 §5". The sign-out entry notes the Prototype's in-card placement. Item 9 and item 11's register clause in the closing list are updated | Story 4; FR-011 |
| `docs/design-system/fidelity-checklist.md` | One line: apply the panel-frame rule (link) | FR-004 |
| `AGENTS.md` | Constitution → **4.0.0**, 2026-09-26. III and VIII rewritten (D3). The intro line about the baseline also cites drift-09-26 | Story 2; FR-005, FR-009 |
| `specs/constitution.md` | Identical III/VIII text, plus a version-history row for 4.0.0 citing drift-09-26 and ADR-0008 | FR-005 |
| `docs/adr/0008-per-unit-inventory-register.md` | **New.** Context (09-26 export, owner decision, backend `/inventory-items`). Decision (register, unit statuses, derived stock D4, threshold per asset D5, secrets, removal guard). Consequences (partly supersedes ADR-0006 (decision 5; the stored-quantity parts of 1 and 3); BEN-48's Update stocks work is retired; Profile gains a source). Alternatives (keep stock lines, as frame B; hybrid) | FR-007 |
| `docs/adr/0006-assets-and-inventory.md` | Status line: partly superseded by 0008 (D2) | FR-007 |
| `docs/adr/README.md` | Adds the 0008 row and marks 0006 | FR-007 |
| `specs/001-office-supplies-mvp/spec.md` | Session 2026-09-26 amendment (D9). US1 rewritten (add units single/multiple; threshold on the asset). FR-003 rewritten (units per office, derived counts, threshold per asset). New FR-003b (removal guard, Admin-only secrets). FR-017 notes units as the source. Key Entities adds Unit and makes Stock derived. Out of Scope drops the register. Assumptions drop the Ortigas/Pasig line | FR-008, FR-009 |
| `specs/001-office-supplies-mvp/data-model.md` | Per the Data Model section above | FR-008 |
| `specs/001-office-supplies-mvp/tasks.md` | T010/T010a re-scoped (D10). The "Blocked on decisions" section is updated (§4d and §4f closed) | FR-013 |
| `specs/001-office-supplies-mvp/plan.md` | Constraints line: constitution 4.0.0. The Constitution Check III note is updated | consistency |
| `specs/001-office-supplies-mvp/contracts/README.md` | Per the API Contracts section above | FR-014 |
| `docs/process-flow.md` | Baseline note, Stock Rules 1–9 restated over units, "Deployed" → "Assigned", the Ortigas/Pasig callout closed | FR-008 |
| `ARCHITECT.md` | Last-amended line. §1 references ADR-0008. §4 Inventory module owns Units. §6 table restated over unit statuses. §7 authZ gains "Create / edit / remove units: Admin"; `/inventory` route → `03 - Inventory` + unit panels. §13 adds ADR-0008 | FR-008 |
| `docs/product.md` | Removes the register non-goal. The Admin job adds "manage units" | FR-008 |
| `CLAUDE.md` | Hard Rules stock line → ADR-0008 unit counts. The Out of Scope line drops the register | FR-008 |
| `specs/006-profile/spec.md` | One dated note (D11) | FR-008 |
| `docs/linear-spa-pages-epic.md` | Route table and H6/H7 rows renamed to match the re-scoped Linear tasks | FR-013 |
| `specs/README.md` | D13 | consistency |

## Project Structure

```
docs/
  adr/0008-per-unit-inventory-register.md        # new
  design-system/drift-2026-09-26.md              # new
specs/
  spec.md, plan.md                               # → specs/010-design-ratification/ at execute
```

Everything else is an edit to an existing file. No `src/`, `e2e/` or config changes.

## Dependencies

- **Evidence**: the `.fig` at `~/Downloads/Office Supplies Request System (OSRS).fig` (exported 2026-09-26T02:49:27Z). The decoded node dump in the session scratchpad is reproducible from the method in drift-09-26 §How this was read.
- **People**: none blocking. The project owner has decided everything this plan applies. The designer follow-up is outbound and does not block merge.
- **Coordination**: PR #41 (BEN-48, `[WIP]`) implements frame B and the Update stocks panel against constitution 3.0.1. See Known Risks.

## Constitution Compliance

Checked against 3.0.1, the constitution in force when the change is made. The change itself produces 4.0.0 through the Governance clause.

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Spec first. Drift-09-26 is recorded before the amendment cites it (D1). Every change cites the drift |
| II. Two Distinct Human Roles | PASS | Unchanged. Units are Admin-only |
| III. Inventory Integrity | PASS (amended) | Redefined through Governance with a MAJOR bump. The invariant and the transition effects are preserved (D4, SC-004) |
| IV. Explicit Request State Machine | PASS | Unchanged. `Received` is explicitly not adopted |
| V. Notification Completeness | PASS | Unchanged. The Admin-on-submit email is not adopted |
| VI. Independently Testable Increments | PASS | No code |
| VII. Typed Contracts | PASS | Only the contract's statuses and fields are named. `In Storage` and the removal reason are raised as gaps, not bridged |
| VIII. MVP Restraint | PASS (amended) | Redefined by owner decision through Governance. No framework or infrastructure is added |
| IX. Secrets and Internal Data | PASS | BitLocker identifier and recovery key/PIN are named Admin-only secrets, never logged |
| Governance | PASS | Both copies of the constitution change together. MAJOR bump. Cites the drift |

## Analysis Overrides

Dismissed by the project owner on 2026-09-26:

- **A1 (MEDIUM)**: spec SC-001 says "17 items", but the enumerated set (ten questions, the brand red, five §3d items) is 16. Left as written.
- **A2 (LOW)**: FR-013's Linear updates were already applied on 2026-09-26, and the plan does not mark them done. Left as written.

## Known Risks

All accepted by the project owner on 2026-09-26, with no mitigation added to the plan:

1. **PR #41 (BEN-48) collision.** It builds frame B, the Update stocks panel and a disabled `+ Add Inventory` against constitution 3.0.1, and either merge order leaves `dev` inconsistent until it is reconciled.
2. **Conflicts in shared documents** with open PRs #41, #42 and #43 (spec 001, ARCHITECT, contracts README, tasks.md, additions.md).
3. **Backend unit semantics may differ** from 4.0.0 III (when units reserve; whether a per-asset count read is published). The constitution could then describe behaviour the API lacks.
4. **Recovery keys in plain text.** The design shows BitLocker recovery key/PIN on Review/Edit. "Admin-only" does not cover storage, masking or audit.
5. **The designer follow-up may never be delivered.** There is no ticket, so the file's slips (`For Pickup`, `For Dellivery`, Status Definitions copy, brand red, §3d) may persist and keep the re-vendor blocked.

Strengthened position: this is an ordered, docs-only change that closes the ratification record and makes the owner's unit-register decision binding. Integration risks are accepted knowingly, not overlooked.
