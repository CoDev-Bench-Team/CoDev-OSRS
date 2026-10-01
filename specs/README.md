# Specs

AI-SDD feature folders. Do not put application code here.

| Folder | Feature | Status |
|--------|---------|--------|
| [001-office-supplies-mvp](001-office-supplies-mvp/spec.md) | Office Supplies Request System MVP | Draft |
| [005-catalog](005-catalog/spec.md) | Catalog page (view stock + start request) | Draft |
| [006-profile](006-profile/spec.md) | Profile (all roles) | Draft |
| [008-request-review-panel](008-request-review-panel/spec.md) | Request review panel + admin transitions (BEN-47) | Draft |
| [009-my-requests](009-my-requests/spec.md) | My Requests (Employee history) | Draft |
| [011-request-list-drawer](011-request-list-drawer/spec.md) | Request List drawer & submit | Draft |
| [012-accountability-form](012-accountability-form/spec.md) | Accountability Form — Employee confirms receipt on `Received` (BEN-136) | Draft |
| [013-admin-history](013-admin-history/spec.md) | Admin History — resolved requests, read-only panel (BEN-144) | Draft |
| [010-design-ratification](010-design-ratification/spec.md) | Ratify the 2026-09-22 export's open questions; unit-register amendment (BEN-116) | Draft |
| [014-assets-inventory](014-assets-inventory/spec.md) | Assets (Admin) — SPA mock (BEN-48); Inventory is BEN-107 / BEN-108 | Draft |
| [constitution.md](constitution.md) | Governing principles (also in AGENTS.md) | 9.0.0 |

When starting a new feature: copy the lifecycle in `docs/ai-sdd.md`, create `specs/00N-slug/` with `spec.md` first, then plan and tasks. Do not invent a REST `contracts/api.md` — the backend team owns HTTP.

`ACTIVE_WORKFLOW.md` is a local agent pointer (gitignored). The committed source of truth is this folder plus `CLAUDE.md`.
