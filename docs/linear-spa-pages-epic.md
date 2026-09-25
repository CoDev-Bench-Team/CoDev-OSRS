# SPA Routing & Pages Epic — Linear Handoff

**Created**: 2026-09-15  
**Last reviewed**: 2026-09-22  
**Team**: BEN (Bench Synergy Project)  
**Project**: [OSRS (Office Supplies Request System)](https://linear.app/bench-synergy-project/project/osrs-office-supplies-request-system-a2a70f69dfae)  
**Labels**: Frontend + Feature  
**Integration branch**: `dev` — every page PR targets `dev`, not `main` (confirmed 2026-09-23)  
**Source**: Figma `Office Supplies Request System (OSRS).fig` (**2026-09-22 export**) → `docs/design-system/drift-2026-09-22.md` → `specs/001-office-supplies-mvp/`  
**Contract**: [Swagger](https://codev-osrs-backend.vercel.app/) — see `specs/001-office-supplies-mvp/contracts/README.md`

> **Rewritten 2026-09-22.** The design re-export collapsed the role model to
> **Employee + Admin**, merged the approvals and fulfilment queues into one
> **Requests Queue**, split admin data into **Assets** and **Inventory**, and
> replaced `For Release` / `Released` / employee-confirmed with
> `For Delivery` / `For Pickup` / Admin-completed. Constitution **3.0.0** and
> ADRs [0005](adr/0005-two-role-model.md)–[0007](adr/0007-fulfilment-status-vocabulary.md)
> carry it. Parents F and G, and H, were re-scoped in place rather than
> recreated — the issue ids below are unchanged, the jobs behind them are not.

This document is the **canonical handoff map** for the Linear epic covering app shell, routing, and product pages. Each parent is an AI-SDD feature; each child is a runnable step (`create-spec` / `create-plan` / `create-tasks` / `execute` / `run-checks` / `create-pr`).

When Linear titles, states, or relations change, update this file in the same change set (or immediately after) so the guide does not drift.

---

## Start here

| Order | Issue | State note (as of 2026-09-15) |
|-------|--------|-------------------------------|
| 1 | **[BEN-31](https://linear.app/bench-synergy-project/issue/BEN-31/p0p1spa-app-shell-routing-and-role-navigation)** — App shell parent | Todo |
| 2 | **[BEN-32](https://linear.app/bench-synergy-project/issue/BEN-32/a0-gate-confirm-design-system-002-barrel-exports-for-shell)** — A0 gate | Todo |
| 3 | Then A1 → (A2 ∥ A3) → A4 → A5 → **A6 merge** → parallel pages |

**Critical merge gate:** [BEN-38 A6](https://linear.app/bench-synergy-project/issue/BEN-38/a6-loginscreen-replace-gallery-root-with-router-critical-merge-gate) — after this lands on `dev`, Catalog / Approvals / Inventory / Profile can branch in parallel without fighting the shell.

**Already done (not in this epic):** Spec 002 design system — all tasks complete. Shell may start immediately.

---

## Priority tiers

| Tier | Meaning | Linear priority |
|------|---------|-----------------|
| **P0 — Foundation** | Must merge first. Unlocks every page. High conflict risk if skipped. | Urgent |
| **P1 — Shell complete** | Routes, guards, placeholders, login. Sequential within Parent A. | Urgent / High |
| **P2 — Independent pages** | Start **after A6 lands**; parallel PRs OK if each owns its folder. | High / Medium / Low |
| **P3 — Polish / e2e** | After enough pages exist. | Medium |

---

## Conflict-avoidance / file ownership

After the shell PR merges, each page feature **owns one folder** and must not edit shared shell files except via a thin placeholder swap.

Folder names below are the **preferred parallel-safe layout**. If an older MVP task path differs (for example `specs/001-office-supplies-mvp/tasks.md` names `src/features/inventory/CatalogPage.tsx`), the feature’s own `plan.md` / `tasks.md` wins — amend 001 or the feature plan so paths do not fork silently.

| Feature | Owns (write freely) | Shared touch (keep tiny) |
|---------|---------------------|---------------------------|
| Shell (P0–P1) | `src/app/*`, `src/features/auth/*`, `src/shared/ui/feedback/*`, `src/main.tsx` | — |
| Catalog | `src/features/catalog/*` *or* inventory Catalog page per plan | 1–2 lines in `src/app/routes.tsx` / `placeholders.tsx` |
| Request submit drawer | `src/features/requests/create/*` | same |
| My Requests | `src/features/requests/history/*` | same |
| Requests Queue | `src/features/requests/queue/*` | same |
| Fulfillment | `src/features/requests/fulfillment/*` | same |
| Request detail | `src/features/requests/detail/*` | same |
| Inventory | `src/features/inventory/*` | same |
| Profile | `src/features/profile/*` | same |
| Playwright | `e2e/*` | CI workflow only as needed |

Shell ships **named placeholders** at every route. Page PRs replace `Placeholder` → real page component only.

---

## Full dependency graph

Hard edges = Linear `blocks` (or required merge gate). Soft edges = preferred order for real data / demo quality, not hard blockers for UI fixtures.

```text
[DONE] Spec 002 Design system
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ P0/P1  Parent A — BEN-31  App shell (MUST MERGE FIRST)          │
│                                                                 │
│   A0 (BEN-32)                                                   │
│    └─► A1 (BEN-33)                                              │
│         ├─► A2 (BEN-34) ─┐                                      │
│         └─► A3 (BEN-35) ─┴─► A4 (BEN-36)                        │
│                                  └─► A5 (BEN-37)                │
│                                        └─► A6 (BEN-38) ★ GATE   │
│                                              ├─► A7 (BEN-39)    │
│                                              │     └─► A8 (BEN-40)
│                                              │           └─► A9 (BEN-41)
│                                              │                  │
│   Merge strategy:                                               │
│   PR #1 = A1→A6 (critical) onto `dev`.                          │
│   PR #2 = A7–A8 optional polish (+ A9 as needed).               │
└────────────────────────────┬────────────────────────────────────┘
                             │ A6 merged to `dev`
                             ▼
        ┌──────────┬─────────┼─────────┬──────────┐
        ▼          ▼         ▼         ▼          ▼
   Parent B    Parent F  Parent H  Parent I   Parent G
   Catalog     Approvals Inventory Profile    Fulfillment
   BEN-42      BEN-46    BEN-48    BEN-49     BEN-47
        │                                         ▲
        ▼                                         │ soft
   Parent C  Request drawer/submit   BEN-43        │
        │                                         │
        │ soft (fixtures OK earlier)               │
        ├──────────────► Parent D  My Requests BEN-44
        │
        └──────────────► Parent E  Request detail BEN-45
                              │
                              │ soft (queue entry)
                              └───────────────────┘

                        Parent J  Playwright  BEN-50
                        (after A8 notes + enough pages)
```

Linear `blocks` relations were created 2026-09-15 (64 relations). They include A6 → every page parent, B → C, C → D/E, A8 → J0, and intra-parent chains. Prefer the graph above when “soft” vs “hard” matters for starting UI work.

---

## Figma → SPA destination map

Screens are the 2026-09-22 export. Routes follow `ARCHITECT.md` §7.

| Figma screen | SPA route | Who | Linear parent |
|--------------|-----------|-----|---------------|
| `01 - Login` | `/login` | signed-out | A (A6) |
| `02 - Catalog`, `02.1 - … View Specs` | `/catalog` | Employee landing; Admin may view | B |
| `03 - Request List` drawer, `03.1 - … Request Submitted` | overlay on `/catalog` | Employee | C |
| `04 - My Requests` | `/requests` | Employee | D |
| `04.1 - … View Request`, `04.2 - … Cancel Request`, `04.2 - … Cancelled` | side panel on `/requests` | Employee (own) | E |
| `02 - Requests Queue`, `02.1 - … Sort Menu` | `/queue` | **Admin landing** | F |
| `02.2 - … Review`, `02.2.1 - … Approve`, `02.2.1 - … Update Status`, `02.2.2 - … Reject` | side panel on `/queue` | Admin | **G (re-scoped)** |
| `03- Assets`, `03.1 Add Asset - <8>`, `03.2- View Asset` | `/assets` | Admin | H |
| `03 - Inventory`, `03.4 - Update Stocks` | `/inventory` | Admin | H |
| `05 - Profile` | `/profile` | both | I |
| six email frames | n/a — backend templates | — | backend |
| *(not drawn)* Not found / Forbidden / Loading / sign-out / collapsed nav | shell feedback | all | A (A3) |

**Constitution note (rewritten 2026-09-22).** The file's merged **Admin** is now
the model — constitution II, [ADR-0005](adr/0005-two-role-model.md). Do **not**
rebuild the three-role split. The "Viewing as" switcher is still dropped
(spec 003 D5): changing role means signing out.

**There is no `/requests/:id` route.** Both detail views are side panels over
their list — the employee's over My Requests, the admin's over the Requests
Queue. Parent E and Parent G own one each.

---

## Parent index (epic)

| Key | Issue | Priority | Spec / notes |
|-----|--------|----------|--------------|
| **A** | [BEN-31](https://linear.app/bench-synergy-project/issue/BEN-31) App shell, routing & role navigation | Urgent | `specs/003-app-shell-routing/` (spec/plan/tasks exist) |
| **B** | [BEN-42](https://linear.app/bench-synergy-project/issue/BEN-42) Catalog page | High | New spec via AI-SDD; Figma CatalogScreen |
| **C** | [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43) Request List drawer & submit | High | Blocked by Catalog B2 |
| **D** | [BEN-44](https://linear.app/bench-synergy-project/issue/BEN-44) My Requests | Medium | `/requests` |
| **E** | [BEN-45](https://linear.app/bench-synergy-project/issue/BEN-45) Request detail (Employee panel) + cancel | High | Side panel over My Requests; admin actions moved to G |
| **F** | [BEN-46](https://linear.app/bench-synergy-project/issue/BEN-46) Requests Queue list | High | ∥ with B/H after A6 |
| **G** | [BEN-47](https://linear.app/bench-synergy-project/issue/BEN-47) Request review panel + admin transitions | High | Re-scoped — the designer gap is closed |
| **H** | [BEN-48](https://linear.app/bench-synergy-project/issue/BEN-48) Assets & Inventory | High | Two screens; blocked on 3 contract decisions |
| **I** | [BEN-49](https://linear.app/bench-synergy-project/issue/BEN-49) Profile | Low | ∥ filler after A6 |
| **J** | [BEN-50](https://linear.app/bench-synergy-project/issue/BEN-50) Playwright MVP + routing e2e | Medium | 001 T020 + 003 T054 |

---

## Parent A — Shell sub-issues

**Spec:** `specs/003-app-shell-routing/` — do **not** re-run `create-spec` unless amending.

| ID | Linear | Title | Priority | Depends on | Unlocks |
|----|--------|-------|----------|------------|---------|
| A0 | [BEN-32](https://linear.app/bench-synergy-project/issue/BEN-32) | Gate: confirm 002 barrel exports | Urgent | Spec 002 DONE | A1 |
| A1 | [BEN-33](https://linear.app/bench-synergy-project/issue/BEN-33) | Add `react-router` (ADR-0004) | Urgent | A0 | A2, A3 |
| A2 | [BEN-34](https://linear.app/bench-synergy-project/issue/BEN-34) | Session boundary + seeded users + multi-tab | Urgent | A1 | A4 |
| A3 | [BEN-35](https://linear.app/bench-synergy-project/issue/BEN-35) | Feedback surfaces (Loading / NotFound / Forbidden / Placeholder / ErrorBoundary) | Urgent | A1 | A4 |
| A4 | [BEN-36](https://linear.app/bench-synergy-project/issue/BEN-36) | Route map + `RequireAccess` + placeholders | Urgent | A2 **and** A3 | A5 |
| A5 | [BEN-37](https://linear.app/bench-synergy-project/issue/BEN-37) | AppLayout + role nav + account cluster + sign-out | Urgent | A4 | A6 |
| A6 | [BEN-38](https://linear.app/bench-synergy-project/issue/BEN-38) | LoginScreen + replace gallery root ★ **CRITICAL MERGE GATE** | Urgent | A5 | **All P2 parents**, A7 |
| A7 | [BEN-39](https://linear.app/bench-synergy-project/issue/BEN-39) | Responsive nav collapse + keyboard | High | A6 | A8 |
| A8 | [BEN-40](https://linear.app/bench-synergy-project/issue/BEN-40) | Verify shell SC + e2e assertion notes | High | A7 | A9, J0 |
| A9 | [BEN-41](https://linear.app/bench-synergy-project/issue/BEN-41) | Create PR for app shell | Urgent | A6 min / A8 full | Parallel page PRs |

**Parallelism inside A:** A2 ∥ A3 after A1.

**Related (not blocking):** [BEN-10](https://linear.app/bench-synergy-project/issue/BEN-10) Login Flow / [BEN-11](https://linear.app/bench-synergy-project/issue/BEN-11) Google OAuth — backend auth. Shell uses seeded `SessionSource` until the contract publishes.

---

## Parent B — Catalog (BEN-42)

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| B0 | [BEN-51](https://linear.app/bench-synergy-project/issue/BEN-51) | Specify Catalog (`create-spec`) | **A6 merged** |
| B1 | [BEN-52](https://linear.app/bench-synergy-project/issue/BEN-52) | Plan + tasks | B0 |
| B2 | [BEN-53](https://linear.app/bench-synergy-project/issue/BEN-53) | Execute Catalog read UI | B1 |
| B3 | [BEN-54](https://linear.app/bench-synergy-project/issue/BEN-54) | Employee-only request CTA gating | B2 |
| B4 | [BEN-55](https://linear.app/bench-synergy-project/issue/BEN-55) | Run checks + PR | B3 |

**Unlocks:** Parent C. **Parallel after A6 with:** F, H, I (and G).

**2026-09-19 field source-of-truth:** Use the **latest Figma Asset/Catalog screens** (inventory-sheet-accurate). Do **not** treat the checked-in `CatalogScreen.jsx` mock fields as authoritative if they drift. Display/read shapes must align with published Assets contract fields (`name`, `model`, `type`, image, `quantity` / availability, etc.) — see `contracts/README.md`.

---

## Parent C — Request drawer & submit (BEN-43)

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| C0 | [BEN-56](https://linear.app/bench-synergy-project/issue/BEN-56) | Specify drawer & submit | **B2** |
| C1 | [BEN-57](https://linear.app/bench-synergy-project/issue/BEN-57) | Plan + tasks | C0 |
| C2 | [BEN-58](https://linear.app/bench-synergy-project/issue/BEN-58) | Execute drawer UI | C1 |
| C3 | [BEN-59](https://linear.app/bench-synergy-project/issue/BEN-59) | Submit + map backend validation errors only | C2 + contract |
| C4 | [BEN-60](https://linear.app/bench-synergy-project/issue/BEN-60) | Run checks + PR | C3 |

**Constraint:** No invented error codes (constitution VII). Soft dep: shell request-list badge context from **A5** (available once shell PR #1 lands — not “already shipped” before A5).

**2026-09-19 validation contract (C3):** Map RFC 9457 / BEN-98 responses — `type: "validation-error"`, `status: 400`, `errors[].detail` + `errors[].pointer` (JSON Pointer, e.g. `#/name`) to under-field messages. Documented in `specs/001-office-supplies-mvp/contracts/README.md`.
---

## Parent D — My Requests (BEN-44)

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| D0 | [BEN-61](https://linear.app/bench-synergy-project/issue/BEN-61) | Specify | A6 |
| D1 | [BEN-62](https://linear.app/bench-synergy-project/issue/BEN-62) | Plan + tasks | D0 |
| D2 | [BEN-63](https://linear.app/bench-synergy-project/issue/BEN-63) | Execute table + status pills | D1 (prefer after C3 for live data; fixtures OK after A6) |
| D3 | [BEN-64](https://linear.app/bench-synergy-project/issue/BEN-64) | Run checks + PR | D2 |

---

## Parent E — Request detail, Employee side (BEN-45) — *re-scoped 2026-09-22*

There is no `/requests/:id` route. The employee's detail is a **side panel** over
My Requests (`04.1 - … View Request`), and its only action is **Cancel Request**.
The admin's review panel and every admin transition moved to **Parent G**.

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| E0 | [BEN-65](https://linear.app/bench-synergy-project/issue/BEN-65) | Specify employee request panel + cancel | A6 + Phase 0 |
| E1 | [BEN-66](https://linear.app/bench-synergy-project/issue/BEN-66) | Plan + tasks | E0 |
| E2 | [BEN-67](https://linear.app/bench-synergy-project/issue/BEN-67) | Execute panel **read UI** — lines, note, status timeline | E1 |
| E3 | [BEN-68](https://linear.app/bench-synergy-project/issue/BEN-68) | **Moved to G** — approve/reject and the Reject dialog are admin actions | — |
| E4 | [BEN-69](https://linear.app/bench-synergy-project/issue/BEN-69) | **Moved to G** — Update Status (For Delivery / For Pickup + location) | — |
| E5 | [BEN-70](https://linear.app/bench-synergy-project/issue/BEN-70) | **Withdrawn → Cancel Request** — there is no confirm-receipt step (ADR-0007); re-scoped to the employee cancel dialog with its required reason | E2 |
| E6 | [BEN-71](https://linear.app/bench-synergy-project/issue/BEN-71) | Run checks + PR | E2 + E5 |

---

## Parent F — Requests Queue list (BEN-46) — *re-scoped 2026-09-22*

Was "Approver pending queue". The queue is no longer approver-only: it is the
single Admin queue, subtitled "Review, approve, and fulfill supply requests".
**F now owns the list surface only**; the review panel and its actions moved to
Parent G.

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| F0 | [BEN-72](https://linear.app/bench-synergy-project/issue/BEN-72) | Specify Requests Queue (list, chips, search, sort, pagination) | A6 + Phase 0 |
| F1 | [BEN-73](https://linear.app/bench-synergy-project/issue/BEN-73) | Plan + tasks | F0 |
| F2 | [BEN-74](https://linear.app/bench-synergy-project/issue/BEN-74) | Execute queue UI | F1 |
| F3 | [BEN-75](https://linear.app/bench-synergy-project/issue/BEN-75) | Run checks + PR | F2 |

**∥ after A6 with** B, H, I. The **Review** action opens Parent G's panel.

---

## Parent G — Request review & status actions (BEN-47) — *re-scoped 2026-09-22*

Was "Supply Admin fulfillment queue — no Figma screen, designer gap". **The gap
is closed**, not by a new screen but by the role merge: fulfilment happens in
the same review panel as approval. G now owns that panel and every transition
it offers.

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| G0 | [BEN-76](https://linear.app/bench-synergy-project/issue/BEN-76) | Specify review panel + all admin transitions | A6 + Phase 0 |
| G1 | [BEN-77](https://linear.app/bench-synergy-project/issue/BEN-77) | Plan + tasks | G0 |
| G2 | [BEN-78](https://linear.app/bench-synergy-project/issue/BEN-78) | Execute review panel (read UI + approve/reject + reject dialog) | G1 |
| G3 | [BEN-79](https://linear.app/bench-synergy-project/issue/BEN-79) | Execute Update Status (For Delivery / For Pickup + location) and Complete; run checks + PR | G2 |

Depends on F2 for the entry point. Admin cancellation also lives here.

---

## Parent H — Assets & Inventory (BEN-48) — *re-scoped 2026-09-22*

Was "Inventory management", one screen. The design now has **two** admin data
destinations: `Assets` (requestable models, unit counts) and `Inventory` (stock
levels per item, edited per office).

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| H0 | [BEN-80](https://linear.app/bench-synergy-project/issue/BEN-80) | Specify Assets **and** Inventory | A6 + Phase 0 |
| H1 | [BEN-81](https://linear.app/bench-synergy-project/issue/BEN-81) | Plan + tasks | H0 |
| H2 | [BEN-82](https://linear.app/bench-synergy-project/issue/BEN-82) | Execute Assets table + search + chips + pagination | H1 |
| H3 | [BEN-83](https://linear.app/bench-synergy-project/issue/BEN-83) | Execute Add Asset panel (category-dependent fields) | H2 |
| H4 | [BEN-84](https://linear.app/bench-synergy-project/issue/BEN-84) | Execute View Asset + Update Asset panels | H2 |
| H6 | *new* | Execute Inventory table (Total / Available / Reserved / status) | H1 |
| H7 | *new* | Execute Update stocks panel (threshold + per-office steppers) | H6 |
| H5 | [BEN-85](https://linear.app/bench-synergy-project/issue/BEN-85) | Run checks + PR | H2+ |

**Related existing Linear (do not duplicate blindly):**

| Issue | Relationship |
|-------|----------------|
| [BEN-13](https://linear.app/bench-synergy-project/issue/BEN-13) Admin – Inventory Page | Related — leave as-is; SPA work tracked here |
| [BEN-7](https://linear.app/bench-synergy-project/issue/BEN-7) Admin – Add Catalog Item | Related (H3) |
| [BEN-18](https://linear.app/bench-synergy-project/issue/BEN-18) Add Catalog item slide-out | Related (H3) |
| [BEN-23](https://linear.app/bench-synergy-project/issue/BEN-23) Admin – Update catalog item | Related (H4) |

> **Blocked on three backend decisions**, not on code:
> `RESERVED / PENDING` as a real quantity; `Ortigas` vs `Pasig`; and
> `location` / `quantity` / `lowQtyAlert` leaving the asset form for the Update
> stocks panel. H3 and H4 **cannot** be built against the current
> `CreateAssetDto` and the current design at the same time. See
> [`contracts/README.md`](../specs/001-office-supplies-mvp/contracts/README.md).
> `03 - Inventory` also exists as **two competing frames**; H6 assumes the
> stock-levels one — see [drift §4d](design-system/drift-2026-09-22.md).

H3/H4 MUST surface BEN-98 validation errors under inputs via `pointer` → field
mapping (shared parser, same as C3).

---

## Parent I — Profile (BEN-49)

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| I0 | [BEN-86](https://linear.app/bench-synergy-project/issue/BEN-86) | Specify Profile (all roles) | A6 |
| I1 | [BEN-87](https://linear.app/bench-synergy-project/issue/BEN-87) | Plan + tasks | I0 |
| I2 | [BEN-88](https://linear.app/bench-synergy-project/issue/BEN-88) | Execute Profile page | I1 |
| I3 | [BEN-89](https://linear.app/bench-synergy-project/issue/BEN-89) | Run checks + PR (base `dev`) | I2 |
| I4 | [BEN-112](https://linear.app/bench-synergy-project/issue/BEN-112) | Map contract `location` → session `office` | I2 + auth integration branch |

Figma draws the Employee profile only; the Admin variant is undesigned — call out in spec. Spec: `specs/006-profile/`. `Currently Assigned` is list / empty / **hidden with no source**, which is the live state (spec 006 FR-007; BEN-49, BEN-88 and BEN-89 amended 2026-09-23).

**Shipped 2026-09-23**, before this export landed. The assigned list reads a per-unit register the MVP does not build, which is why "hidden with no source" is the right third state — see [drift §4e/§7](design-system/drift-2026-09-22.md). Profile is also the one page whose role gating survives the merge unchanged: it was always "both roles".

---

## Parent J — Playwright (BEN-50)

| ID | Linear | Title | Depends on |
|----|--------|-------|------------|
| J0 | [BEN-90](https://linear.app/bench-synergy-project/issue/BEN-90) | Plan suite scope | A8 notes useful |
| J1 | [BEN-91](https://linear.app/bench-synergy-project/issue/BEN-91) | Routing e2e (address + RBAC) | J0 + A6 |
| J2 | [BEN-92](https://linear.app/bench-synergy-project/issue/BEN-92) | Happy-path + reject-path + cancel-path e2e | J0 + B/C/E/F/G (+H) |
| J3 | [BEN-93](https://linear.app/bench-synergy-project/issue/BEN-93) | Wire CI + PR | J1 and/or J2 |

Not a blocker for page feature PRs.

---

## Suggested execution / merge order

### Week-zero (no parallel page PRs yet)

1. A0 → A1 → (A2 ∥ A3) → A4 → A5 → **A6**
2. **Merge PR #1** (A1–A6) to `dev`
3. Optionally A7–A9 as PR #2

### After A6 is on `dev`

Cut parallel branches:

| Branch focus | Parent | Safe in parallel? |
|--------------|--------|-------------------|
| Catalog | B | Yes |
| Approvals | F | Yes |
| Inventory | H | Yes |
| Profile | I | Yes |
| Fulfillment | G | Yes (after A6; undesigned) |
| Request drawer | C | After B2 |
| Request detail | E | After A6 (read UI); actions after APIs |
| My Requests | D | After A6; better after C for live data |
| Playwright | J | Last |

---

## AI-SDD reminder per parent

| Parent | Spec status | First skill |
|--------|-------------|-------------|
| A | Exists (`003-app-shell-routing`) | `execute` (from A0) |
| B–I | Need new/amended specs | `create-spec` → `create-plan` → `create-tasks` → `execute` |
| J | Align with 001 T020 / 003 T054 | plan/tasks if needed → execute |

Hard rules for every issue:

- **Two roles only: Employee and Admin** (constitution 3.0.0 II, ADR-0005)
- Do not invent REST routes, payloads, or error codes — and do **not** paper over the three open conflicts in `contracts/README.md`
- Stock is per (asset, office) as Total / Available / Reserved: submit reserves, reject and cancel release, complete consumes; `Total = Available + Reserved`, never negative (ADR-0006)
- `For Delivery` and `Ready for Pickup` are peers; `Completed` is an **Admin** action; a cancellation reason is required from whoever cancels (ADR-0007, constitution 3.0.1)
- SPA TypeScript strict; secrets stay out of git

---

## Issue ID quick reference

```text
A  BEN-31    A0–A9  BEN-32 … BEN-41
B  BEN-42    B0–B4  BEN-51 … BEN-55
C  BEN-43    C0–C4  BEN-56 … BEN-60
D  BEN-44    D0–D3  BEN-61 … BEN-64
E  BEN-45    E0–E6  BEN-65 … BEN-71
F  BEN-46    F0–F3  BEN-72 … BEN-75
G  BEN-47    G0–G3  BEN-76 … BEN-79
H  BEN-48    H0–H5  BEN-80 … BEN-85
I  BEN-49    I0–I3  BEN-86 … BEN-89
J  BEN-50    J0–J3  BEN-90 … BEN-93
```

**Total:** 10 parents + 53 sub-issues = **63** Linear issues (BEN-31 … BEN-93).

---

## Related docs

| Doc | Why |
|-----|-----|
| `docs/linear-spa-pages-epic.md` | This guide (canonical Linear SPA epic map) |
| `docs/ai-sdd.md` | Lifecycle + artifact map (links here) |
| `specs/003-app-shell-routing/spec.md` | Shell WHAT |
| `specs/003-app-shell-routing/plan.md` | Shell HOW + route table |
| `specs/003-app-shell-routing/tasks.md` | Shell T001–T054 |
| `specs/001-office-supplies-mvp/spec.md` | Product pipeline + FR |
| `docs/process-flow.md` | Status machine + inventory + notifications |
| `ARCHITECT.md` | AuthZ matrix §7 |
| `docs/adr/0004-client-routing.md` | React Router decision |
| `AGENTS.md` | Constitution |

---

## Review log (2026-09-15)

Issues found and corrected in this revision:

| Issue | Fix |
|-------|-----|
| Issue count said 62 (10+52) | Corrected to **63** (10 parents + 53 children; BEN-31…BEN-93) |
| ASCII graph omitted BEN ids for A8/A9 | Added BEN-40 / BEN-41 |
| Graph implied G only after E; D/E only via C | Redrew: A6 unlocks B/F/H/I/**G**; C soft-pref for D; G soft-linked to E4 |
| Parent C said A5 “already shipped” | Clarified: available after shell PR #1 |
| Catalog folder vs 001 `inventory/CatalogPage` | Documented plan-wins rule |
| Integration branch vague | Named **`dev`** |
| Todo states could drift | Marked **as of 2026-09-15** + maintenance note |

## Review log (2026-09-19)

| Trigger | Epic impact |
|---------|-------------|
| UI/UX: Figma Asset + Catalog fields aligned to inventory sheet | Amend **B0–B2**, **H0–H4** (and parents B/H): use latest Figma + Assets DTO; ignore stale UI-kit field lists |
| Backend: BEN-98 validation-error Problem Details schema | Amend **C3**, **H3**, **H4**: map `errors[].pointer` → under-field UI; link `contracts/README.md` |
| Contract published | `specs/001-office-supplies-mvp/contracts/README.md` now points at Swagger |

**Not amended:** A (Done), B3/B4, C0–C2/C4, D–G, H5, I, J — no field-model or validation-mapping change required.

---

## Review log (2026-09-22) — design re-export, constitution 3.0.0

Source: `~/Downloads/Office Supplies Request System (OSRS).fig`, exported
2026-09-22T03:18Z. Full diff: [drift-2026-09-22](design-system/drift-2026-09-22.md).

**What changed in the epic**

| Parent | Was | Now |
|--------|-----|-----|
| F (BEN-46) | Approver pending queue | Requests Queue **list** — one queue for the merged Admin |
| G (BEN-47) | Fulfillment queue — *"no Figma screen, designer gap"* | Request **review panel** + every admin transition. The gap is closed by the role merge, not by a new screen |
| H (BEN-48) | Inventory management, one screen | **Assets** *and* **Inventory**, two screens, two new subtasks |
| E (BEN-45) | Request detail + role actions at `/requests/:id` | Employee's **side panel** over My Requests, plus cancel. Admin actions moved to G |
| D (BEN-44) | My Requests history | unchanged in scope; status vocabulary changed |
| B, C, I, J | — | field lists, categories and e2e paths updated |

**New blocking work**: **Phase 0** in
[`specs/001-office-supplies-mvp/tasks.md`](../specs/001-office-supplies-mvp/tasks.md)
— the shipped shell names `approver` / `supply_admin` and
`For Release` / `Released`, none of which exist any more. Nothing in this epic
can be built on the current types.

**New blocking decisions**: three backend contract conflicts
([`contracts/README.md`](../specs/001-office-supplies-mvp/contracts/README.md))
and ten designer questions
([drift §10](design-system/drift-2026-09-22.md)).
