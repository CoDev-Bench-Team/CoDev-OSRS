# AI-Driven Development Lifecycle (AI-DLC) and AI-SDD

How this repository is specified, planned, and implemented with coding agents.

## Why this exists

The product started as a Vite scaffold with no domain specs. These markdown files are the **source of truth**. Agents implement from them; humans amend them when the product changes.

## Artifact map

| Layer | File | Job |
|-------|------|-----|
| Agent entry | `CLAUDE.md` | Short, always-loaded rules and pointers |
| Agent + law | `AGENTS.md` | Tool-agnostic instructions + constitution |
| Agent skills | `.agents/skills/` | On-demand AI-SDD (and other) skills, any agent |
| Architecture | `ARCHITECT.md` | System HOW: modules, state machine, NFRs |
| Product | `docs/product.md` | Problem, users, MVP outcome, non-goals |
| Domain flow | `docs/process-flow.md` | Status, inventory, emails |
| Decisions | `docs/adr/*.md` | Why we chose X over Y |
| Linear SPA epic map | `docs/linear-spa-pages-epic.md` | Dependency graph, BEN parents/sub-issues, merge gates for shell + pages |
| Constitution (versioned) | `specs/constitution.md` | Same principles, changelog-friendly |
| Feature WHAT | `specs/001-office-supplies-mvp/spec.md` | Stories, FRs, success criteria |
| Feature HOW | `specs/001-office-supplies-mvp/plan.md` | Stack, structure, compliance |
| Research | `specs/001-office-supplies-mvp/research.md` | Resolved choices |
| Data | `specs/001-office-supplies-mvp/data-model.md` | Domain entities (not HTTP) |
| API contract | Backend team (link in `contracts/README.md`) | REST JSON — not authored here |
| Tasks | `specs/001-office-supplies-mvp/tasks.md` | Ordered, path-specific work |
| QA bootstrap | `specs/001-office-supplies-mvp/quickstart.md` | Run the demo locally |
| Spec quality | `specs/001-office-supplies-mvp/checklists/requirements.md` | Requirements quality checklist |

## Lifecycle (this repo)

```
create-spec → create-plan → create-tasks → execute → create-pr → code-review / code-reviewer
```

Skills live in `.agents/skills/`. Supporting: `analyze` (inside execute), `run-checks` (after implement). Do not invent a REST contract; backend team owns HTTP.

## Rules of engagement

1. **Constitution beats improvisation.** If a change violates a MUST, stop and amend the constitution or drop the change.
2. **Spec beats chat.** If a prompt conflicts with `spec.md`, update the spec first.
3. **One active feature folder.** Current work is `specs/001-office-supplies-mvp/`. Future features get `002-…` (do not overwrite 001).
4. **ADRs for irreversible HOW.** REST-for-the-SPA and role/inventory rules are recorded. HTTP paths and backend stack are the backend team’s.
5. **Mark tasks `[x]` only when done and verified** at the task’s own level.

## What “done” means for the MVP

The Playwright path in `quickstart.md` can be demonstrated: encoded inventory, submit (stock down), reject (stock up), resubmit, approve, prepare, release, confirm, emails logged for each transition.
