# Quickstart — OSRS MVP demo

This repo runs the **SPA**. A REST API **from the backend team** must be reachable separately. Point the SPA at it; do not invent routes here.

## Prerequisites

- Node.js 22+ (for the Vite app)
- Backend API origin and the backend team’s published contract

## Environment

Create `.env` (never commit secrets):

```
VITE_API_ORIGIN=http://localhost:8080
```

Use the origin the backend team documents. Optionally proxy through Vite (`vite.config.ts`) so the browser stays same-origin.

## Demo users

**Non-production placeholders** (constitution IX). There are no credentials here
— no passwords, no tokens, nothing to leak. The SPA implements no authentication
of its own (spec 001 Clarifications, Session 2026-09-12): the sign-in screen
renders the designed Google control and delegates to the **session boundary**,
`src/features/auth/session-source.ts`.

Until the backend contract publishes, that boundary is satisfied by
`src/features/auth/seeded-source.ts`, which resolves one of these three seeded
identities — one per role, so every role's landing screen and every refusal can
be exercised:

| Name | Role | Lands on |
|------|------|----------|
| Maya Santos · mayas@codev.com | `employee` | `/catalog` |
| Ethan Cruz · ethanc@codev.com | `admin` | `/queue` |

> Constitution 3.0.0 retired `approver` and `supply_admin` ([ADR-0005](../../docs/adr/0005-two-role-model.md)). The shipped shell still seeds three identities; T000–T000b in `tasks.md` collapse them to the two above.

Choose one on the sign-in screen before pressing the Google control — the
chooser is the seeded source's stand-in for Google's account picker, and it
disappears on its own once a source backed by the published contract replaces
it. A fourth entry, **Refused account**, makes sign-in fail, so the refusal path
can be demonstrated.

**There is no role switcher inside the application** (spec 003 D5). Changing role
means signing out and signing back in, which is deliberate: it keeps one role
per user absolute and makes the demo exercise the real sign-in path.

A session is held as an opaque reference plus a timestamp, never a user or a
role, and it is re-resolved on every load — so a reload keeps you signed in
while a stale reference left on a shared machine is discarded rather than
trusted.

When the backend publishes its contract, write a second implementation of
`SessionSource` against it. No shell code changes.

## Run the SPA

```bash
npm install
npm run dev
```

Open the Vite URL. The application opens at `/login`; everything else requires
a session. The design system's component gallery is **not** part of the
application — it stays at `/__gallery` in development only.

## QA regression (target)

```bash
npm run lint
npm run build
npx playwright test   # when e2e/ exists; API must be up
```

Playwright MUST cover:

1. Happy path to `Completed`, with the reservation released and `Total` reduced once
2. Reject path with the reservation released and a new request
3. Cancel paths from both sides, each requiring a reason
4. Notifications as the backend contract exposes them
5. Role cannot perform the other role's transition

## Demo script (human)

1. Admin adds a Laptop asset, then sets Cebu stock to 10 — Total 10 / Available 10 / Reserved 0
2. Employee (Cebu) adds 3 to the Request List and submits — Available 7 / Reserved 3, status Pending Approval, `Request received` email
3. Admin rejects with reason “Duplicate of last week” — Available 10 / Reserved 0, `Request declined` email
4. Employee submits 3 again — Available 7 / Reserved 3
5. Admin approves — `Request approved` email; quantities unchanged
6. Admin sets **For Pickup** at “GS Counter” — `Status changed` email carrying the location
7. Admin presses **Complete** — Total 7 / Available 7 / Reserved 0, `Status changed` email
8. Employee cancels a second pending request with a reason — reservation released, `Status changed` email
