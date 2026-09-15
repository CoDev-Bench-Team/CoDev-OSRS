# Architecture — Office Supplies Request System

**Status**: Accepted for MVP  
**Date**: 2026-09-11  
**Companion docs**: [product](docs/product.md), [process flow](docs/process-flow.md), [ADRs](docs/adr/), [feature plan](specs/001-office-supplies-mvp/plan.md)

This file is the cross-cutting HOW. Feature WHAT lives in specs. Do not duplicate user stories here.

## 1. System Context

OSRS is an internal web application. Employees request encoded office supplies; Approvers accept or reject; Supply Admins pick, pack, and release; the System keeps inventory consistent and emails participants.

This repository is the **browser SPA**. All durable state, authorization, inventory math, and email sending live behind a **REST JSON API** that the SPA consumes. The API’s runtime, language, and storage are **undecided** and must not be assumed in this repo.

```
┌─────────────┐                  ┌──────────────────┐
│  Browser    │      HTTPS       │  Vite React SPA  │
│  Employee / │◀────────────────▶│  (this repo)     │
│  Approver / │                  └────────┬─────────┘
│  Supply Adm │                           │ REST JSON
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
│   │   ├── inventory/
│   │   └── requests/
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
| Users | Identity and role | Request workflow |
| Inventory | Catalog, on-hand qty, encode/adjust by Supply Admin | Request status |
| Requests | Request aggregate, line items, legal transitions | Email transport internals |
| Notifications | Templates, recipients, send, send log | Whether a transition is allowed |

**Atomicity (API):** submit, reject and cancel MUST change request status and on-hand quantity together. After a valid transition is committed, send the matching email. A notification failure MUST be recorded and MUST NOT undo a valid transition; the API SHOULD surface that the mail step failed.

## 5. Request State Machine

```
            submit                reject
  [create] ───────► Pending Approval ──────► Rejected
                         │   │
                         │   └── cancel (owning Employee) ──► Cancelled
                         │ approve                              ▲
                         ▼                                      │
                      Approved ──── cancel (Supply Admin) ──────┤
                         │                                      │
                         │ prepare (Supply Admin)               │
                         ▼                                      │
                    For Release ─── cancel (Supply Admin) ──────┘
                         │
                         │ release (Supply Admin)
                         ▼
                      Released
                         │
                         │ confirm receipt (Employee)
                         ▼
                      Completed
```

Guards (enforced by the API; SPA mirrors them in the UI):

- Submit: authenticated Employee; every line qty ≥ 1; qty ≤ on-hand; items exist and are active.
- Approve / Reject: Approver; request is `Pending Approval`; reject body includes non-empty reason.
- Prepare: Supply Admin; request is `Approved`.
- Release: Supply Admin; request is `For Release`; pickup location recorded.
- Confirm: owning Employee; request is `Released`.
- Cancel: owning Employee while `Pending Approval` (reason optional), or Supply Admin while `Approved` or `For Release` (reason required). Never once `Released`. Restores stock in the same transaction, exactly as reject does.

## 6. Inventory Coupling

| Event | Status after | On-hand qty |
|-------|--------------|-------------|
| Item encoded | — | Set by Supply Admin (≥ 0) |
| Request submitted | Pending Approval | Decrement by requested qty |
| Request rejected | Rejected | Increment by requested qty |
| Request cancelled | Cancelled | Increment by requested qty |
| Approved / For Release / Released / Completed | those statuses | No change (already deducted) |

Concurrent submits for the last units MUST serialize so on-hand never goes negative (one caller succeeds, others get a clear insufficient-stock failure). How the API names that error is the backend contract’s choice.

## 7. AuthZ Matrix (MVP)

| Action | Employee | Approver | Supply Admin |
|--------|----------|----------|--------------|
| View catalog / stock | yes | yes | yes |
| Encode / edit inventory | no | no | yes |
| Create request | yes | no* | no* |
| View own requests | yes | — | — |
| View pending queue | no | yes | no |
| Approve / reject | no | yes | no |
| Prepare / release | no | no | yes |
| Confirm receipt | own released request | no | no |
| Cancel a request | own, while pending | no | any approved or for-release |
| View resolved history | own only (My Requests) | yes (all requestors) | yes (all requestors) |

\*A person may hold only one role in the MVP seed data. If a real user needs two jobs, that is a later change — do not invent a superuser.

Approvers may review any pending request (small internal team). Supply Admins may prepare any approved request.

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
| Concurrent submit of last unit | One succeeds, one 409/insufficient | API must not persist negative stock |
| Mail gateway down | Status still changes | Notification log `failed`; ops follow up |
| Approver inactive | Queue stalls | Manual; no auto-escalate in MVP |

## 12. Testing Architecture

- **Contract**: HTTP against the **backend-published** REST contract (not a file invented in this repo).
- **E2E (Playwright)**: encoded stock → employee request → approver reject (stock restored) → new request → approve → prepare → release → confirm; assert notifications as the backend contract exposes them.

## 13. Decisions

| ADR | Decision |
|-----|----------|
| [0001](docs/adr/0001-spa-rest-api.md) | SPA in this repo; REST API owned by backend team |
| [0002](docs/adr/0002-deduct-inventory-on-submit.md) | Deduct stock on submit, not on approve |
| [0003](docs/adr/0003-three-role-model.md) | Approver and Supply Admin are separate roles |
| [0004](docs/adr/0004-client-routing.md) | Client-side routing via React Router v7 |
