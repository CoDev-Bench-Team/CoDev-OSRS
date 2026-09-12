# CoDev-OSRS — Agent Instructions

Office Supplies Request System (OSRS). Internal Codev MVP that replaces chat/email supply requests with a four-stage pipeline: **Check Inventory & Create Request → Review & Approve → Prepare & Release → Complete**.

This file is the always-loaded entry point. Keep it short. Load the pointed files when the work needs them.

## Read First

| File | When |
|------|------|
| @AGENTS.md | Every change — constitution is binding |
| `.agents/skills/` | On-demand AI-SDD skills (any agent; not Claude-only) |
| @ARCHITECT.md | Any feature, API, schema, or folder change |
| @docs/product.md | Scope, roles, success criteria |
| @docs/process-flow.md | Status machine, inventory rules, notifications |
| @specs/001-office-supplies-mvp/spec.md | WHAT to build |
| @specs/001-office-supplies-mvp/plan.md | HOW to build |
| @specs/001-office-supplies-mvp/tasks.md | Ordered implementation work |
| @specs/constitution.md | Versioned governing principles |

Do not implement from chat alone. Spec → plan → tasks → code.

## AI-SDD Lifecycle

1. **Specify** — `create-spec` → `specs/spec.md` (WHAT, not HOW)
2. **Plan** — `create-plan` → `plan.md` (do not author a REST `api.md`)
3. **Tasks** — `create-tasks` → `tasks.md`
4. **Execute** — `execute` (organize `specs/<slug>/`, implement, `run-checks`)
5. **PR** — `create-pr` (base `main`)
6. **Review** — `code-review` and/or `code-reviewer`

Skill files: `.agents/skills/`. See that folder’s README for the full pipeline.

New work that is not in the active spec is out of scope until the spec is amended.

Active feature: `specs/001-office-supplies-mvp/`.

## Commands

```bash
npm install
npm run dev          # Vite SPA (default http://localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # oxlint
```

This repo is the SPA. It consumes a **REST JSON API owned by the backend team**. Do not invent routes, payloads, or error codes in this repo. Do not add a server or database here unless a later ADR says so. When the backend contract is published, link it from `specs/001-office-supplies-mvp/contracts/README.md`.

## Stack (locked for this repo)

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4
- Integration: REST JSON (backend-owned contract; see `specs/001-office-supplies-mvp/contracts/README.md`)
- QA (planned): Playwright against the SPA; HTTP tests against the published REST contract
- CI (planned): GitHub Actions for the SPA (lint, typecheck, build)

Do not introduce a new frontend framework or UI kit without an ADR in `docs/adr/`. Do not invent a backend stack or a REST contract in this repo.

## Hard Rules

- Honor AGENTS.md constitution. MUST violations without a documented exception are errors.
- Three roles only: **Employee**, **Approver**, **Supply Admin**. Do not collapse them into a generic Admin.
- Request status transitions MUST follow `docs/process-flow.md`. No skipped states.
- Inventory: encoded before requests; decrement on submit (`Pending Approval`); increment on reject; stay decremented through approve/release/complete. Never persist negative stock.
- Email notification on every defined transition. Missing a notification is a bug (API responsibility; SPA surfaces status).
- SPA TypeScript is strict. No `any` without justification.
- Secrets stay in `.env` (gitignored). Never commit credentials.
- The SPA MUST NOT invent fields, routes, or error codes the backend contract does not expose.

## Code Style

- File names: kebab-case. React components: PascalCase exports.
- Colocate feature UI under `src/features/<feature>/`.
- HTTP access only through `src/shared/api.ts` (or successors in that folder).
- Prefer small, testable functions. No drive-by refactors.

## Out of Scope for This MVP

Vendor purchasing, budgets, SSO, native mobile, multi-level approval, warehouse transfers, and chat/email ingestion of requests.
