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
`src/features/auth/seeded-source.ts`, which resolves one of these two seeded
identities — one per role, so every role's landing screen and every refusal can
be exercised:

| Name | Role | Lands on |
|------|------|----------|
| Maya Santos · mayas@codev.com | `employee` | `/catalog` |
| Ethan Cruz · ethanc@codev.com | `admin` | `/queue` |

Choose one on the sign-in screen before pressing the Google control — the
chooser is the seeded source's stand-in for Google's account picker, and it
disappears on its own once a source backed by the published contract replaces
it. A third entry, **Refused account**, makes sign-in fail, so the refusal path
can be demonstrated.

Inventory (spec 015) assigns units to users from a seeded directory,
`src/features/inventory/seeded-user-directory.ts`. These are non-production
placeholders too, and only Maya and Ethan can sign in:

| Name | Email | Department |
|------|-------|------------|
| Maya Santos | mayas@codev.com | Engineering |
| Ethan Cruz | ethanc@codev.com | IT Operations |
| Samantha Reyes | samanthar@codev.com | Design |
| Paolo Garcia | paolog@codev.com | Engineering |
| Lea Villanueva | leav@codev.com | Finance |
| Marco Dizon | marcod@codev.com | Quality Assurance |
| Nina Bautista | ninab@codev.com | People Operations |
| Carlo Mendoza | carlom@codev.com | — |

The seeded units' serial numbers, PRs, BitLocker Identifiers and Recovery
Key/PINs are visibly fake (`DEMO-…`) and reset on reload.

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

## QA regression

```bash
npm run lint
npm run build
npm run e2e
```

`npm run e2e` runs the Playwright suite in `e2e/` against the Vite dev server. It does not need the backend API: the walk uses the seeded screens. The documented path is Davao, Maya Santos’s home office.

Playwright covers:

1. Happy path through Ready for Pickup, `Received`, the Employee’s signature, and Admin Complete. Stock moves on submit and on `Received` only.
2. Reject path with the reservation released and a new request
3. Cancel paths from both sides, each requiring a reason
4. Notifications where the product exposes a record; a missing record is reported, not invented
5. Role cannot perform the other role’s transition

## Demo script (human)

1. Admin encodes a Mice asset and adds 10 Available units at Davao — Total 10 / Available 10 / Reserved 0
2. Maya (Davao) adds 3 to the Request List and submits — Total 10 / Available 7 / Reserved 3, status Pending Approval. `Request received` is asserted only where the product shows that record
3. Admin approves — quantities unchanged. `Request approved` likewise
4. Admin sets **Ready for Pickup** at the Davao office — quantities unchanged
5. Complete is not offered yet. Admin or Maya sets **Received** — Total 7 / Available 7 / Reserved 0
6. Maya signs the Accountability Form — status stays `Received`, quantities unchanged
7. Admin presses **Complete** — quantities unchanged, status `Completed`
8. A rejection or a cancellation with a reason releases the reservation. An empty reason does not. For Delivery cannot be cancelled
