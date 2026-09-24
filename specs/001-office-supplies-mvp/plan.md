# Implementation Plan: Office Supplies Request System MVP

**Branch**: `ai-sdd-lifecycle-docs` | **Date**: 2026-09-11 | **Amended**: 2026-09-22 | **Spec**: specs/001-office-supplies-mvp/spec.md  
**Status**: Draft

## Summary

Build the Vite React SPA in this repo so it can run the four-stage supply pipeline against a **REST JSON API owned by the backend team**. This plan does not specify HTTP paths, payloads, or a backend stack. SPA types and fetch calls follow the backend-published contract once it is linked from `contracts/README.md`.

## Technical Context

**Language/Version (this repo)**: TypeScript as used by the Vite scaffold  
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS 4, Playwright (e2e)  
**Storage**: Backend  
**Testing**: Playwright against the SPA; HTTP checks against the **backend** contract when published  
**Target Platform**: Internal web (desktop-class browser)  
**Project Type**: SPA consuming REST  
**Performance Goals**: SPA usable on typical laptops; API SLAs are backend-owned  
**Constraints**: 4-week MVP; constitution **3.0.0** in AGENTS.md; do not invent a REST contract; three open contract conflicts (`contracts/README.md`) gate the stock-facing screens

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Spec-Driven Development | PASS | This plan implements spec 001 only |
| II. Two Distinct Human Roles | PASS | Role from the backend session/me resource (ADR-0005) |
| III. Inventory Integrity | PASS | Required of the API; SPA displays API quantities. **Depends on conflict 1 in `contracts/README.md`** |
| IV. Explicit Request State Machine | PASS | SPA only offers legal actions; API enforces |
| V. Notification Completeness | PASS | API emits; SPA shows whatever the contract exposes |
| VI. Independently Testable Increments | PASS | Stories ordered; e2e on demo path |
| VII. Typed Contracts | PASS | Client matches backend-published contract only |
| VIII. MVP Restraint | PASS | No server folder; no invented API spec |
| IX. Secrets and Internal Data | PASS | `.env` for API origin and local secrets |

No justified violations.

## Data Model

Logical entities in `data-model.md` (product language). Persistence and JSON names are backend-owned.

## API Contracts

**Not in this repo.** See `contracts/README.md`. SPA uses a configurable API origin (Vite proxy when a host exists).

## Component / Module Breakdown

**SPA (this repo)**

- `src/shared/api.ts` — fetch wrapper mapped to the backend contract
- `src/shared/types.ts` — types copied/generated from that contract
- `src/features/auth/` — login, session, role home
- `src/features/catalog/` — employee catalog, office selector, view-specs panel
- `src/features/assets/` — Admin asset records; add / view / update panels
- `src/features/inventory/` — Admin stock levels; update-stocks panel
- `src/features/requests/` — create drawer, my requests, queue, review / update-status, history
- `src/features/profile/` — profile and assigned equipment

**REST API**

Backend team. Not implemented here.

**QA**

- `e2e/mvp-pipeline.spec.ts` — SC-001 / SC-002 / SC-002a / notifications as the API exposes them

## Project Structure

```
src/                          # existing Vite app
e2e/
docs/
specs/001-office-supplies-mvp/
.github/workflows/ci.yml      # SPA lint/typecheck/build
```

No `server/` package unless ADR-0001 is superseded.

## Dependencies

- A reachable REST host and the backend team’s published contract
- `VITE_API_ORIGIN` (or Vite proxy target) in `.env`
- Playwright as a dev dependency when e2e lands

## Complexity Tracking

None. Deferring HTTP design to the backend team avoids a second source of truth.

## Phase 0 — Research

`research.md`. HTTP contract explicitly unresolved (backend-owned).

## Phase 1 — Design & Contracts

- `data-model.md` (logical / product)
- `contracts/README.md` (pointer only)
- `quickstart.md`

## Constitution re-check (post-design)

PASS — this repo does not author REST; SPA plan does not add a backend.
