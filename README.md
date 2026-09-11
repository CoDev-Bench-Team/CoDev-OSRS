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
```

Set `VITE_API_ORIGIN` when an API host exists (see `quickstart.md`).

## Stack

- **This repo:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Integration:** REST JSON (backend-owned contract)
- **API runtime / datastore / HTTP contract:** backend team
- **QA (planned):** Playwright · HTTP contract tests · GitHub Actions

## Roles

**Employee** requests and confirms receipt · **Approver** accepts or rejects · **Supply Admin** encodes stock and fulfills · **System** (API) mutates inventory and sends email
