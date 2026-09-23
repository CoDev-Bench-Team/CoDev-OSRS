# API contract — not authored here

The **backend team** owns the REST JSON contract (paths, payloads, status codes, auth headers, error shapes).

This folder MUST NOT contain an invented `api.md`. Agents MUST NOT design endpoints for the SPA to “require.”

**Published contract:** <https://codev-osrs-backend.vercel.app/#/> (Swagger UI; the OpenAPI document
is embedded in `swagger-ui-init.js` at that origin). Published 2026-09-16, first consumed 2026-09-17.

Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.

## What the SPA consumes today

Only the auth endpoints. Everything else in the contract is read when the feature that needs it lands.

| Endpoint | Used by |
|----------|---------|
| `POST /auth/google` | `SessionSource.signIn()` — body `{ credential }`, a Google ID token obtained in the browser |
| `GET /auth/me` | `SessionSource.current()` — `401` means signed out, which is a state, not an error |
| `POST /auth/logout` | `SessionSource.signOut()` |

Sessions are an httpOnly cookie named `session` (`components.securitySchemes.cookie`). There is no
bearer token, so every request goes out with `credentials: 'include'`.

## Known divergences from this repository's requirements

| Contract | This repo | Status |
|----------|-----------|--------|
| `User.role` is `admin \| employee` | Constitution II and ADR-0003 require three roles and forbid a combined Admin | Temporarily mapped `admin` → `supply_admin`; see [ADR-0005](../../../docs/adr/0005-google-sign-in-against-the-published-contract.md). Raised with the backend team in `RG_DOCS/questionsToBackend.md` §1. |
| No `Access-Control-Allow-Origin` is returned for any origin | The SPA is a separate origin | Local development proxies through the Vite dev server (`/api`). Deployed builds are blocked until the backend adds the allowlist; raised in `RG_DOCS/questionsToBackend.md` §3. |
