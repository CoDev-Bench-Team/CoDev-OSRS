# CoDev-OSRS — Office Supplies Request System

Internal Codev MVP that replaces chat/email supply requests with a four-stage pipeline: **Check Inventory & Create Request → Review & Approve → Prepare & Release → Complete**.

This repository is run as **AI-SDD / AI-DLC**: agents implement from markdown specs, not from chat memory.

## Current state

This repo is the **Vite + React + TypeScript + Tailwind SPA**. It consumes a REST JSON API **owned by the backend team**. This repo does not define routes or payloads. Link the published contract in `specs/001-office-supplies-mvp/contracts/README.md` when it exists.

Follow `specs/001-office-supplies-mvp/tasks.md`.

## Start here (humans and agents)

| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](CLAUDE.md) | Agent entry: commands, hard rules, pointers |
| [AGENTS.md](AGENTS.md) | Constitution (binding) |
| [ARCHITECT.md](ARCHITECT.md) | System design (SPA + REST) |
| [docs/ai-sdd.md](docs/ai-sdd.md) | Lifecycle and artifact map |
| [docs/product.md](docs/product.md) | Problem, users, non-goals |
| [docs/process-flow.md](docs/process-flow.md) | Status, inventory, emails |
| [specs/001-office-supplies-mvp/spec.md](specs/001-office-supplies-mvp/spec.md) | Feature WHAT |
| [specs/001-office-supplies-mvp/plan.md](specs/001-office-supplies-mvp/plan.md) | Feature HOW |
| [specs/001-office-supplies-mvp/tasks.md](specs/001-office-supplies-mvp/tasks.md) | Implementation backlog |

## SPA

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npm run verify   # every gate: typecheck, lint, design-system fidelity, shell routing, build
```

The application opens at `/login`. Sign-in resolves a **seeded demo account**
until the backend contract publishes — pick one on the sign-in screen; the three
roles are listed in
[quickstart.md](specs/001-office-supplies-mvp/quickstart.md).

The design system's component gallery is not part of the application. It stays
reachable in development at **`/__gallery`** (and the fidelity harness at
`/__compare`), and ships in no production build.

Set `VITE_GOOGLE_CLIENT_ID` to run against the published contract instead of the seeded
demo users; `VITE_API_URL` is for deployed builds only, since development proxies
`/api` through the dev server. See `specs/001-office-supplies-mvp/quickstart.md`.

## Stack

- **This repo:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Integration:** REST JSON (backend-owned contract)
- **API runtime / datastore / HTTP contract:** backend team
- **QA (planned):** Playwright · HTTP contract tests · GitHub Actions

## Roles

**Employee** requests and confirms receipt · **Approver** accepts or rejects · **Supply Admin** encodes stock and fulfills · **System** (API) mutates inventory and sends email
