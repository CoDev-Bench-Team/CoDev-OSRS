# Architecture — Office Supplies Request System

**Status**: Accepted for MVP  
**Date**: 2026-09-11 · **Last amended**: 2026-09-26 (unit register; constitution 4.0.0)  
**Companion docs**: [product](docs/product.md), [process flow](docs/process-flow.md), [ADRs](docs/adr/), [feature plan](specs/001-office-supplies-mvp/plan.md)

This file is the cross-cutting HOW. Feature WHAT lives in specs. Do not duplicate user stories here.

## 1. System Context

OSRS is an internal web application. Employees browse a catalog of assets and request them; an Admin approves or rejects, hands over by delivery or pickup, and completes; the System keeps stock consistent and emails participants.

Two human roles, not three — see [ADR-0005](docs/adr/0005-two-role-model.md). Stock is a register of units, counted per office as Total / Available / Reserved — see [ADR-0006](docs/adr/0006-assets-and-inventory.md) and [ADR-0008](docs/adr/0008-per-unit-inventory-register.md). The request ends when the Admin completes it — see [ADR-0007](docs/adr/0007-fulfilment-status-vocabulary.md).

This repository is the **browser SPA**. All durable state, authorization, inventory math, and email sending live behind a **REST JSON API** that the SPA consumes. The API’s runtime, language, and storage are **undecided** and must not be assumed in this repo.

```
┌─────────────┐                  ┌──────────────────┐
│  Browser    │      HTTPS       │  Vite React SPA  │
│  Employee / │◀────────────────▶│  (this repo)     │
│  Admin      │                  └────────┬─────────┘
│             │                           │ REST JSON
                                  │                           │ (backend contract)
└─────────────┘                           ▼
                                 ┌──────────────────┐
                                 │  REST API        │
                                 │  (stack TBD)     │
                                 └────────┬─────────┘
                                          │
                    persistence, auth,    │    outbound email
                    inventory rules       ▼
                                 ┌──────────────────┐
                                 │  API-owned       │
                                 │  backing store   │
                                 │  + mail gateway  │
                                 └──────────────────┘
```

## 2. Technology

| Layer | Choice | Rationale |
|-------|--------|-----------|
| SPA | React 19, TypeScript, Vite 8, Tailwind CSS 4 | Already scaffolded in this repo |
| API | REST JSON published by the backend team | This repo consumes HTTP; it does not specify the contract |
| Persistence | TBD (backend) | Not chosen here |
| Auth | As defined by the backend contract | SPA stores whatever session the API returns |
| Email | Emitted by the API on each defined transition | SPA does not send mail |
| Routing | React Router v7 (declarative, client-only) | Durable addresses, guards, e2e targets ([ADR-0004](docs/adr/0004-client-routing.md)) |
| E2E | Playwright against the SPA | QA automation requirement |
| API tests | HTTP against the published contract | Stack-agnostic |
| CI | GitHub Actions for the SPA | lint, typecheck, build |
| Lint | oxlint (existing) | Keep the scaffold toolchain |

## 3. Repository Layout (this repo)

```
CoDev-OSRS/
├── CLAUDE.md
├── AGENTS.md
├── ARCHITECT.md
├── docs/
│   └── design-system/         # token map, additions, content conventions
├── design-system/             # vendored design-system source (read-only reference)
├── specs/
├── src/                       # React SPA
│   ├── assets/                # fonts, brand, photography
│   ├── features/
│   │   ├── auth/
│   │   ├── catalog/           # employee-facing asset catalog
│   │   ├── assets/            # admin: asset records + add/update panels
│   │   ├── inventory/         # admin: unit register + add / review / remove unit panels
│   │   ├── profile/
│   │   └── requests/          # create drawer, history, queue, detail
│   ├── styles/                # Tailwind @theme token layer
│   └── shared/                # API client, types, ui/ component library
├── e2e/                       # Playwright (to be added)
└── .github/workflows/
```

Do not add an API implementation directory until an ADR names the stack. Configure the SPA with an API base URL (Vite proxy in development is allowed).

## 4. Logical Modules (API must provide; SPA must call)

| Module | Owns | Does not own |
|--------|------|--------------|
| Auth | Login, logout, current user | Role-specific business rules in the UI |
| Users | Identity, role, home office | Request workflow |
| Assets | Asset record: name, category, model, description, image, category-dependent specs, low-stock threshold | Units and quantities |
| Inventory | Units (tag, serial, office, status, assignee, purchase and device details); Total / Available / Reserved per (asset, office) derived from unit statuses | Request status; the low-stock threshold (on the Asset) |
| Requests | Request aggregate, line items, legal transitions, reasons, pickup location | Email transport internals |
| Notifications | Templates, recipients, send, send log | Whether a transition is allowed |

**Atomicity (API):** submit, reject, cancel and complete MUST change request status and stock quantities together, holding `Total = Available + Reserved`. After a valid transition is committed, send the matching email. A notification failure MUST be recorded and MUST NOT undo a valid transition; the API SHOULD surface that the mail step failed.

## 5. Request State Machine

```
            submit                     reject (reason)
  [create] ───────► Pending Approval ─────────────────► Rejected
                         │   │
                         │   └── cancel (owning Employee, reason) ──► Cancelled
                         │ approve                                       ▲
                         ▼                                               │
                      Approved ──────── cancel (Admin, reason) ──────────┤
                         │                                               │
                         │ update status (Admin)                         │
                         ▼                                               │
        For Delivery │ Ready for Pickup ── cancel (Admin, reason) ───────┘
                    (peers, not a sequence;
                     Ready for Pickup records a location)
                         │
                         │ complete (Admin)
                         ▼
                      Completed
```

Guards (enforced by the API; SPA mirrors them in the UI):

- **Submit**: authenticated Employee; every line qty ≥ 1; qty ≤ `Available` at the requesting office; assets exist and are active.
- **Approve / Reject**: Admin; request is `Pending Approval`; reject body includes a non-empty reason.
- **Update status**: Admin; request is `Approved`, `For Delivery` or `Ready for Pickup`; target is `For Delivery` or `Ready for Pickup`; `Ready for Pickup` records a pickup location.
- **Complete**: Admin; request is `For Delivery` or `Ready for Pickup`.
- **Cancel**: owning Employee while `Pending Approval`, or Admin while `Approved`, `For Delivery` or `Ready for Pickup`. **A reason is required from whoever cancels.** Never once `Completed`. Releases the reservation in the same transaction, exactly as reject does.

There is no confirm-receipt transition. `Completed` is an Admin action — see [ADR-0007](docs/adr/0007-fulfilment-status-vocabulary.md).

## 6. Stock Coupling

Stock is a register of **units** ([ADR-0008](docs/adr/0008-per-unit-inventory-register.md)). Per **(asset, office)**, Available and Reserved count units in those statuses, and `Total = Available + Reserved` is an invariant; none may be negative. The API chooses which units move.

| Event | Status after | Unit status change | Total | Available | Reserved |
|-------|--------------|--------------------|-------|-----------|----------|
| Units added (single or bulk) | — | → `Available` | +n | +n | — |
| Unit made `Inactive`, or an `Available` unit removed | — | `Available` → `Inactive` / removed | −n | −n | — |
| Unit reactivated | — | `Inactive` → `Available` | +n | +n | — |
| Existing assignment recorded (Admin, outside a request) | — | `Available` → `Assigned` | −n | −n | — |
| Request submitted | Pending Approval | *qty* units `Available` → `Reserved` | — | −qty | +qty |
| Request rejected | Rejected | those units → `Available` | — | +qty | −qty |
| Request cancelled | Cancelled | those units → `Available` | — | +qty | −qty |
| Approved | Approved | none | — | — | — |
| For Delivery / Ready for Pickup | those statuses | none | — | — | — |
| Request completed | Completed | those units → `Assigned` to the requester | −qty | — | −qty |

`Completed` is the only transition that reduces `Total`; those units are what the Assets screen counts as *Assigned units*. Concurrent submits for the last units MUST serialize so `Available` never goes negative (one caller succeeds, others get a clear insufficient-stock failure). How the API names that error is the backend contract's choice.

A unit that is `Assigned` or `Reserved` cannot be removed. Only request transitions move a unit into or out of `Reserved`; a manual edit may set `Available` ↔ `Inactive` or record an existing assignment.

Each asset carries one **low-stock threshold** (per asset, compared against Available in the scope on screen), which drives the `In Stock` / `Low Stock` / `Out of Stock` pill and the chip counts on Assets and Inventory.

## 7. AuthZ Matrix (MVP)

| Action | Employee | Admin |
|--------|----------|-------|
| View catalog (assets + availability) | yes | yes |
| Create / edit assets | no | yes |
| Add / edit / remove units (single or bulk) | no | yes |
| View a unit's BitLocker identifier / recovery key | no | yes |
| Set the low-stock threshold (on the asset) | no | yes |
| Create request | yes | no\* |
| View own requests | yes | — |
| View requests queue (all requestors) | no | yes |
| Approve / reject | no | yes |
| Set For Delivery / Ready for Pickup | no | yes |
| Complete a request | no | yes |
| Cancel a request | own, while `Pending Approval`, reason required | any `Approved` / `For Delivery` / `Ready for Pickup`, reason required |
| View resolved history | own only (My Requests) | yes (History, all requestors) |
| View own profile | yes | yes\*\* |

\*A person holds exactly one role in the MVP seed data. If a real user needs both jobs, that is a later change — do not invent a superuser.

\*\*Profile is drawn for the Employee only; the Admin variant is undesigned (see [drift-2026-09-22 §7](docs/design-system/drift-2026-09-22.md)).

Any Admin may review any request and fulfil any approved one.

### Routes

| Route | Role | Screen |
|-------|------|--------|
| `/catalog` | Employee (Admin may view) | `02 - Catalog` + Request List drawer |
| `/requests` | Employee | `04 - My Requests` + detail panel |
| `/queue` | Admin | `02 - Requests Queue` + review / update-status / reject panels |
| `/assets` | Admin | `03- Assets` + add / view / update panels |
| `/inventory` | Admin | `03 - Inventory` (unit table) + Add Single Unit / Add Multiple Units / Review-Edit / Remove Unit panels |
| `/history` | Admin | `04 - History` + read-only detail panel |
| `/profile` | both | `05 - Profile` |

## 8. API Shape

The **backend team** publishes the REST contract (base path, routes, JSON, auth, errors). This repository does not define it.

Until that document is linked from `specs/001-office-supplies-mvp/contracts/README.md`, do not hard-code invented endpoints. Domain capabilities the UI must support are in `spec.md` (login by role, catalog, submit, approve/reject, prepare/release, confirm, history, notification visibility).

## 9. Data

Canonical **logical** model: `specs/001-office-supplies-mvp/data-model.md` (product language). JSON field names and resource URLs come from the backend contract when it exists.

## 10. Non-Functional (MVP)

| Concern | Target |
|---------|--------|
| Users | Internal Codev staff; tens of concurrent users, not thousands |
| API p95 | < 500 ms on LAN for CRUD and transitions |
| Availability | Business hours; 99% class is enough |
| Security | Authenticated REST + RBAC; HTTPS in deployed env |
| Audit | Request status timestamps + actor ids; notification log |
| Email | Best-effort after a successful transition; retry policy is API-owned for MVP (failures must be logged) |

## 11. Failure Modes

| Failure | User impact | Mitigation |
|---------|-------------|------------|
| API unreachable | Forms fail | Health check; clear SPA error; Vite proxy or CORS in deploy |
| Concurrent submit of last unit | One succeeds, one 409/insufficient | API must not persist negative `Available` |
| Mail gateway down | Status still changes | Notification log `failed`; ops follow up |
| No Admin acts | Queue stalls | Manual; no auto-escalate in MVP |

## 12. Testing Architecture

- **Contract**: HTTP against the **backend-published** REST contract (not a file invented in this repo).
- **E2E (Playwright)**: units added → employee request → admin reject (reservation released) → new request → approve → For Delivery or Ready for Pickup → complete (units assigned; Total and Reserved fall); assert notifications as the backend contract exposes them.

## 13. Decisions

| ADR | Decision |
|-----|----------|
| [0001](docs/adr/0001-spa-rest-api.md) | SPA in this repo; REST API owned by backend team |
| [0002](docs/adr/0002-deduct-inventory-on-submit.md) | Deduct stock on submit, not on approve |
| [0003](docs/adr/0003-three-role-model.md) | Approver and Supply Admin are separate roles — **superseded by 0005** |
| [0004](docs/adr/0004-client-routing.md) | Client-side routing via React Router v7 |
| [0005](docs/adr/0005-two-role-model.md) | Employee and Admin — two human roles |
| [0006](docs/adr/0006-assets-and-inventory.md) | Assets and Inventory are separate; per-office Total/Available/Reserved stock — **partly superseded by 0008** |
| [0007](docs/adr/0007-fulfilment-status-vocabulary.md) | One handover state (For Delivery / For Pickup), completed by the Admin — amended 2026-09-24: `Ready for Pickup`, drawn pink/blue pills |
| [0008](docs/adr/0008-per-unit-inventory-register.md) | Inventory is a per-unit register; stock counted from unit statuses (partly supersedes 0006) |
