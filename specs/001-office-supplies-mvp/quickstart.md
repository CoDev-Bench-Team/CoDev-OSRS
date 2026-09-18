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
| Samantha Reyes · samanthar@codev.com | `approver` | `/approvals` |
| Ethan Cruz · ethanc@codev.com | `supply_admin` | `/fulfillment` |

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

### Signing in today

There is no authentication in the SPA and no backend contract to delegate to
yet, so the session boundary (`src/features/auth/session-source.ts`) is
satisfied by `seeded-source.ts`: three non-production seed users, one per role,
permitted in source by constitution IX. The drawn Google control resolves to the
Supply Admin seed — **Ethan Cruz**, `ethan.cruz@codev.local` — because the
Supply Admin's screens are the ones that exist. No password, no token, no
secret.

A reload keeps you signed in for eight hours: browser storage holds an opaque
reference and a timestamp, never a user or a role, and every load re-resolves
it. Sign out from the account cluster clears it.

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

1. Happy path to `Completed` with stock decremented once
2. Reject path with stock restored and a new request
3. Notifications as the backend contract exposes them
4. Role cannot perform another role’s transition

## Demo script (human)

1. Supply Admin encodes pens (10) and notebooks (5)
2. Employee requests 3 pens — stock 7, status Pending Approval, submitted notification
3. Approver rejects “Duplicate of last week” — stock 10, rejected notification
4. Employee submits 3 pens again — stock 7
5. Approver approves — approved notifications to employee and supply
6. Supply Admin prepare → For Release; release at “GS Counter”
7. Employee confirms receipt — Completed; completed notifications to employee and approver
