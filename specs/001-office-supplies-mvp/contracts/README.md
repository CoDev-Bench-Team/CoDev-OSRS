# API contract — not authored here

The **backend team** owns the REST JSON contract (paths, payloads, status codes, auth headers, error shapes).

This folder MUST NOT contain an invented `api.md`. Agents MUST NOT design endpoints for the SPA to “require.”

When the backend team publishes a contract, record the link below and type the client against that document.

**Published contract:** _pending — drop the URL or path here when the backend team shares it._

Until then, SPA work that needs HTTP is blocked or uses a temporary mock that is thrown away when the real contract lands. Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.
