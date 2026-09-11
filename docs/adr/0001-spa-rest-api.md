# ADR-0001: SPA consumes a REST API (backend stack deferred)

## Status

Accepted

## Context

The 4-week MVP needs a web UI, durable inventory/request behavior, and email. This repo already contains a Vite + React + TypeScript + Tailwind SPA. An earlier draft assumed Node.js, Express, and PostgreSQL. Those choices are **not agreed**. The frontend still needs a stable integration surface.

## Decision

1. **This repository implements the SPA only.**
2. The SPA talks to a **REST JSON API** whose paths, payloads, and error codes are specified in `specs/001-office-supplies-mvp/contracts/api.md`.
3. **API language, framework, and datastore are out of scope** until a later ADR. Agents MUST NOT add a server, ORM, or database to this repo, and MUST NOT document a backend stack as locked.

## Consequences

### Positive

- Frontend work can proceed against the contract (mock, stub, or real host).
- Backend can be chosen later without rewriting product specs.
- QA can test HTTP against the contract regardless of implementation.

### Negative

- Local full-stack `npm run dev` for the API is not defined here.
- Atomic inventory rules are requirements on the API, not something this repo can enforce in SQL.

### Neutral

- Vite may proxy `/api` to a configurable origin once an API host exists.

## Alternatives Considered

**Lock Express + PostgreSQL now** — rejected; team has not chosen a backend.

**GraphQL or tRPC** — rejected for MVP; REST is the agreed consumption model.

**BFF in this SPA repo** — rejected until an ADR names an API stack.

## References

- `ARCHITECT.md`
- `specs/001-office-supplies-mvp/contracts/api.md`
