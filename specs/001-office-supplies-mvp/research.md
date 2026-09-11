# Research: Office Supplies Request System MVP

**Date**: 2026-09-11  
**Status**: Complete for MVP planning (backend stack open)

## R1. Where code lives

**Decision**: This repository is the SPA only. Integration is REST JSON per `contracts/api.md`.

**Rationale**: Backend runtime and datastore are not agreed (ADR-0001).

**Alternatives**: Express + PostgreSQL in-repo, Nest, Next fullstack — deferred until an ADR.

## R2. Auth mechanism (contract)

**Decision**: Email + password via `POST /api/auth/login`, then bearer token or session cookie as the API chooses. SPA stores whatever the contract returns. Seed three demo users on the API side.

**Rationale**: Internal MVP; SSO is a non-goal. Hashing and session implementation belong to the API.

**Alternatives**: Magic links, Google SSO — deferred.

## R3. Inventory reservation model

**Decision**: Single on-hand quantity; decrement on submit; increment on reject (ADR-0002). API MUST make submit/reject atomic with stock.

**Rationale**: Diagram-mandated. Locking strategy is the API’s choice.

**Alternatives**: Separate reserved column; deduct on approve — rejected.

## R4. Approval routing

**Decision**: Global Approver queue (any approver, any pending request).

**Rationale**: Small internal team; no org chart in MVP.

## R5. Email transport

**Decision**: The API emits the five notification types and records outcomes (`sent` / `failed` / `logged`). SPA does not send mail. Transport (SMTP, provider, or dev log) is TBD with the API stack.

**Rationale**: Product requires email at each step; QA asserts via `GET /api/requests/:id/notifications`.

## R6. Persistence

**Decision**: Unresolved. Logical model only in `data-model.md`.

**Rationale**: Choosing SQL vs document store vs hosted BaaS without a team decision would fake certainty.

## R7. Frontend data fetching

**Decision**: Native `fetch` + small wrappers. No Redux. React state + lightweight context for auth.

**Rationale**: Few screens; avoid extra libraries.

**Alternatives**: TanStack Query — optional later if caching pain appears.

## R8. Public request id

**Decision**: Integer (or integer-like) id displayed as `#123` in UI and notification copy, matching the process-diagram mockups.

## R9. Timezone

**Decision**: API timestamps as ISO-8601 (UTC recommended); SPA displays in the browser’s local zone.

## R10. Line item names

**Decision**: Each request line includes `itemName` as returned by the API (snapshot at submit) so history stays readable if the catalog name changes.
