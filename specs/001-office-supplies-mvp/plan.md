# Implementation Plan: Office Supplies Request System MVP

**Branch**: `001-office-supplies-mvp` | **Date**: 2026-09-11 | **Spec**: specs/001-office-supplies-mvp/spec.md  
**Status**: Draft

## Summary

Build the Vite React SPA in this repo so it can run the four-stage supply pipeline against a **REST JSON API**. The API must satisfy `contracts/api.md` (inventory atomicity, roles, notifications). API language, framework, and datastore are **not part of this plan**.

## Technical Context

**Language/Version (this repo)**: TypeScript as used by the Vite scaffold  
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS 4, Playwright (e2e)  
**Storage**: Owned by the REST API (TBD)  
**Testing**: Playwright against the SPA; HTTP tests against `contracts/api.md` on whatever hosts the API  
**Target Platform**: Internal web (desktop-class browser)  
**Project Type**: SPA consuming REST  
**Performance Goals**: API p95 < 500 ms on LAN (API SLA); SPA usable on typical laptops  
**Constraints**: 4-week MVP; constitution in AGENTS.md; no backend stack assumed

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Spec-Driven Development | PASS | This plan implements spec 001 only |
| II. Three Distinct Human Roles | PASS | Role from `GET /api/auth/me`; separate queues |
| III. Inventory Integrity | PASS | Required of the API; SPA displays API quantities |
| IV. Explicit Request State Machine | PASS | SPA only offers legal actions; API enforces |
| V. Notification Completeness | PASS | API emits; SPA can read notification log |
| VI. Independently Testable Increments | PASS | Stories ordered; e2e on demo path |
| VII. Typed Contracts | PASS | `contracts/api.md`; typed client |
| VIII. MVP Restraint | PASS | No server folder; no invented API stack |
| IX. Secrets and Internal Data | PASS | `.env` for API base URL and local secrets |

No justified violations.

## Data Model

Logical entities in `data-model.md`. Persistence is the API’s concern.

## API Contracts

`contracts/api.md`. SPA uses `/api` (Vite proxy to `VITE_API_ORIGIN` or equivalent when a host exists).

## Component / Module Breakdown

**SPA (this repo)**

- `src/shared/api.ts` — fetch wrapper, auth header, error mapping
- `src/shared/types.ts` — types aligned to the contract
- `src/features/auth/` — login, session, role home
- `src/features/inventory/` — catalog; Supply Admin encode form
- `src/features/requests/` — create, detail, queues, history, transitions

**REST API (external / TBD)**

Must implement every route and side effect in `contracts/api.md`. Not implemented in this repository.

**QA**

- `e2e/mvp-pipeline.spec.ts` — SC-001 / SC-002 / notification log
- HTTP collection or tests targeting the live API base URL

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

- A reachable REST host that implements the contract (mock server is acceptable for UI development)
- `VITE_API_ORIGIN` (or Vite proxy target) in `.env`
- Playwright as a dev dependency when e2e lands

## Complexity Tracking

None. Deferring the API stack avoids premature backend choices.

## Phase 0 — Research

`research.md`. Backend stack explicitly unresolved.

## Phase 1 — Design & Contracts

- `data-model.md` (logical)
- `contracts/api.md`
- `quickstart.md`

## Constitution re-check (post-design)

PASS — contracts remain stack-agnostic REST; SPA plan does not add a backend.
