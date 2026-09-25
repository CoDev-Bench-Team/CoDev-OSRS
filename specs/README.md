# Specs

AI-SDD feature folders. Do not put application code here.

| Folder | Feature | Status |
|--------|---------|--------|
| [001-office-supplies-mvp](001-office-supplies-mvp/spec.md) | Office Supplies Request System MVP | Draft |
| [005-catalog](005-catalog/spec.md) | Catalog page (view stock + start request) | Draft |
| [006-profile](006-profile/spec.md) | Profile (all roles) | Draft |
| [008-request-list-drawer](008-request-list-drawer/spec.md) | Request List drawer & submit | Draft |
| [010-design-ratification](010-design-ratification/spec.md) | Ratify the 2026-09-22 export's open questions; unit-register amendment (BEN-116) | Draft |
| [constitution.md](constitution.md) | Governing principles (also in AGENTS.md) | 4.0.0 |

When starting a new feature: copy the lifecycle in `docs/ai-sdd.md`, create `specs/00N-slug/` with `spec.md` first, then plan and tasks. Do not invent a REST `contracts/api.md` — the backend team owns HTTP.

`ACTIVE_WORKFLOW.md` is a local agent pointer (gitignored). The committed source of truth is this folder plus `CLAUDE.md`.
