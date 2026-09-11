# Research: Office Supplies Request System MVP

**Date**: 2026-09-11  
**Status**: Complete for SPA planning (HTTP contract owned by backend)

## R1. Where code lives

**Decision**: This repository is the SPA only. It consumes REST JSON. The backend team publishes the HTTP contract.

**Rationale**: Paths and payloads are not this team’s to decide (ADR-0001).

**Alternatives**: Frontend-authored `contracts/api.md` — rejected.

## R2. Auth

**Decision**: Whatever the backend contract specifies (session, token, or other). SPA persists only what that contract returns. Demo users are a backend seed concern; emails in `quickstart.md` are a suggested demo cast, not an API design.

**Rationale**: Auth mechanism is part of the HTTP contract.

**Alternatives**: Specifying login URL/body in this repo — rejected.

## R3. Inventory reservation model

**Decision**: Single on-hand quantity; decrement on submit; increment on reject (ADR-0002). API MUST make submit/reject atomic with stock. How that is exposed over HTTP is backend-owned.

**Rationale**: Diagram-mandated domain rule.

**Alternatives**: Separate reserved column; deduct on approve — rejected.

## R4. Approval routing

**Decision**: Global Approver queue (any approver, any pending request).

**Rationale**: Small internal team; no org chart in MVP.

## R5. Email transport

**Decision**: The API emits the five notification types. SPA does not send mail. Transport and any “list notifications” resource are backend-owned.

**Rationale**: Product requires email at each step; QA asserts through whatever the backend contract exposes.

## R6. Persistence

**Decision**: Unresolved here. Logical model only in `data-model.md`.

## R7. Frontend data fetching

**Decision**: Native `fetch` + small wrappers. No Redux. React state + lightweight context for auth.

**Rationale**: Few screens; avoid extra libraries.

**Alternatives**: TanStack Query — optional later if caching pain appears.

## R8. Public request id

**Decision**: Display as `#<id>` in UI copy, matching the process-diagram mockups. Id type is whatever the backend returns.

## R9. Timezone

**Decision**: Display API timestamps in the browser’s local zone. Wire format is backend-owned (ISO-8601 UTC recommended).

## R10. Line item names

**Decision**: History should keep a readable item name after catalog renames. Whether that is a snapshot field is the backend contract’s choice; the UI must show whatever name the API returns on the request line.
