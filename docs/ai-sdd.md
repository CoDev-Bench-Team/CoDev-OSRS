# AI-Driven Development Lifecycle (AI-DLC) and AI-SDD

How this repository is specified, planned, and implemented with coding agents.

## Why this exists

The product started as a Vite scaffold with no domain specs. These markdown files are the **source of truth**. Agents implement from them; humans amend them when the product changes.

## Artifact map

| Layer | File | Job |
|-------|------|-----|
| Agent entry | `CLAUDE.md` | Short, always-loaded rules and pointers |
| Agent + law | `AGENTS.md` | Tool-agnostic instructions + constitution |
| Architecture | `ARCHITECT.md` | System HOW: modules, state machine, NFRs |
| Product | `docs/product.md` | Problem, users, MVP outcome, non-goals |
| Domain flow | `docs/process-flow.md` | Status, inventory, emails |
| Decisions | `docs/adr/*.md` | Why we chose X over Y |
| Constitution (versioned) | `specs/constitution.md` | Same principles, changelog-friendly |
| Feature WHAT | `specs/001-office-supplies-mvp/spec.md` | Stories, FRs, success criteria |
| Feature HOW | `specs/001-office-supplies-mvp/plan.md` | Stack, structure, compliance |
| Research | `specs/001-office-supplies-mvp/research.md` | Resolved choices |
| Data | `specs/001-office-supplies-mvp/data-model.md` | Entities and rules |
| Contracts | `specs/001-office-supplies-mvp/contracts/api.md` | HTTP API |
| Tasks | `specs/001-office-supplies-mvp/tasks.md` | Ordered, path-specific work |
| QA bootstrap | `specs/001-office-supplies-mvp/quickstart.md` | Run the demo locally |
| Spec quality | `specs/001-office-supplies-mvp/checklists/requirements.md` | Requirements quality checklist |

## Lifecycle (this repo)

```
Specify  →  Clarify  →  Plan  →  Tasks  →  Implement  →  Verify  →  Review
  spec.md     spec.md    plan.md  tasks.md    code         tests      PR
```

Aligned skills: `/specify` or `/create-spec` → `/clarify` → `/plan-feature` or `/create-plan` → `/generate-tasks` or `/create-tasks` → `/implement` or `/execute` → `/run-checks` → `/review-changes`.

## Rules of engagement

1. **Constitution beats improvisation.** If a change violates a MUST, stop and amend the constitution or drop the change.
2. **Spec beats chat.** If a prompt conflicts with `spec.md`, update the spec first.
3. **One active feature folder.** Current work is `specs/001-office-supplies-mvp/`. Future features get `002-…` (do not overwrite 001).
4. **ADRs for irreversible HOW.** REST-for-the-SPA, inventory timing, and role model are recorded. Backend runtime/datastore stay deferred until a new ADR.
5. **Mark tasks `[x]` only when done and verified** at the task’s own level.

## What “done” means for the MVP

The Playwright path in `quickstart.md` can be demonstrated: encoded inventory, submit (stock down), reject (stock up), resubmit, approve, prepare, release, confirm, emails logged for each transition.
