# ADR-0004: Client-side routing via React Router

**Status**: Accepted
**Date**: 2026-09-12
**Context**: `specs/003-app-shell-routing/spec.md` (D2), constitution VIII

## Context

Spec 003 requires every screen to have a durable address: bookmarkable, refresh-safe, supporting browser back and forward, and reachable directly by a Playwright test (FR-008, FR-009, SC-002, SC-004). The design system's UI kit drives screens from React state with no URLs at all.

Constitution VIII forbids adding frameworks that are not in the active spec or `ARCHITECT.md` without an ADR. A router is a new dependency, so it needs one.

Three options were weighed:

1. **A routing library.** Standard, complete, well understood. One dependency.
2. **Hand-rolled History API routing.** No dependency, roughly 50 lines — until guards, redirects, nested layouts, and scroll restoration arrive, at which point it is a router we maintain ourselves.
3. **State-driven screens, as the UI kit does it.** No URLs. Refresh loses the page, browser back exits the app, requests cannot be linked, and every e2e test must click through the whole pipeline to reach any screen.

Option 3 fails FR-008 outright and makes constitution VI's e2e requirement expensive. Option 2 trades a well-tested dependency for bespoke code in the exact area — authorization guards and redirects — where a subtle bug becomes a security problem.

## Decision

Use **React Router v7** (`react-router`) for client-side routing.

- One dependency. In v7 the DOM bindings ship in the same package, so there is no separate `react-router-dom`.
- Declarative route configuration, not the framework/data mode. This repo is a Vite SPA; adopting React Router's framework mode would pull in its build pipeline and effectively change the app's architecture, which is out of scope.
- Routing stays client-side only. No SSR, no loaders that fetch — `ARCHITECT.md` §8 reserves the REST contract to the backend team, and spec 003 performs no HTTP.

## Consequences

**Positive**

- Deep links, refresh-safety, and browser history come for free.
- Playwright can target any destination by URL in one navigation (SC-004).
- Route guards have one obvious home, applied uniformly rather than per screen.

**Negative**

- One runtime dependency the MVP did not previously have, and a version to keep current.
- Route configuration becomes a place where an authorization mistake can hide. Mitigated by spec 003's FR-010: authorization is checked on every entry to a protected destination, not only at route definition.

**Neutral**

- If the SPA ever needs SSR or React Router's framework mode, this decision does not block it, but that would be a separate ADR.

## Compliance

- Constitution VII (typed contracts): routing introduces no REST shapes; the session boundary is defined in SPA terms.
- Constitution VIII (MVP restraint): this ADR is the record the principle requires.
- `ARCHITECT.md` §2's technology table is updated to list routing.
