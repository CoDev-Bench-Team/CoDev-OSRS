# ADR-0001: SPA consumes a backend-owned REST API

## Status

Accepted

## Context

This repo is the Vite + React SPA. Durable inventory, requests, and email live on a REST API. An earlier draft in this repo specified paths, payloads, and error codes in `contracts/api.md`. That HTTP design is **the backend team’s**, not this team’s.

## Decision

1. **This repository implements the SPA only.**
2. The SPA talks to a **REST JSON API**. Paths, payloads, status codes, auth, and errors are **defined by the backend team**. This repo MUST NOT author a substitute contract.
3. When the backend contract is published, link it from `specs/001-office-supplies-mvp/contracts/README.md` and type the client against it.
4. Agents MUST NOT add a server, ORM, or database to this repo, and MUST NOT invent endpoints “for the frontend to need.”

Product behavior (roles, status machine, inventory rules, notification events) remains specified here as **domain requirements**. How those map to HTTP is not.

## Consequences

### Positive

- Frontend and backend can agree on one contract source.
- Product specs stay valid if the backend changes URL shape.

### Negative

- SPA implementation that needs HTTP is blocked until the backend contract exists (or uses a disposable mock).
- Local full-stack `npm run dev` for the API is not defined here.

### Neutral

- Vite may proxy to a configurable API origin once a host exists.

## Alternatives Considered

**Frontend-authored `contracts/api.md`** — rejected; backend team owns the API.

**GraphQL or tRPC** — not chosen here; consumption model is REST as agreed with backend.

## References

- `ARCHITECT.md`
- `specs/001-office-supplies-mvp/contracts/README.md`
