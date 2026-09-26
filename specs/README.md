# Specs

AI-SDD feature folders. Do not put application code here.

| Folder | Feature | Status |
|--------|---------|--------|
| [001-office-supplies-mvp](001-office-supplies-mvp/spec.md) | Office Supplies Request System MVP | Draft |
| [005-catalog](005-catalog/spec.md) | Catalog page (view stock + start request) | Draft |
| [006-profile](006-profile/spec.md) | Profile (all roles) | Draft |
| [008-request-review-panel](008-request-review-panel/spec.md) | Request review panel + admin transitions (BEN-47) | Draft |
| [constitution.md](constitution.md) | Governing principles (also in AGENTS.md) | 1.2.0 |

When starting a new feature: copy the lifecycle in `docs/ai-sdd.md`, create `specs/00N-slug/` with `spec.md` first, then plan and tasks. Do not invent a REST `contracts/api.md` — the backend team owns HTTP.

`ACTIVE_WORKFLOW.md` is a local agent pointer (gitignored). The committed source of truth is this folder plus `CLAUDE.md`.
