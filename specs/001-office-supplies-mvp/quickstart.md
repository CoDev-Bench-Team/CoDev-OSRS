# Quickstart — OSRS MVP demo

This repo runs the **SPA**. A REST API **from the backend team** must be reachable separately. Point the SPA at it; do not invent routes here.

## Prerequisites

- Node.js 22+ (for the Vite app)
- Backend API origin and the backend team’s published contract

## Environment

Copy `.env.example` to `.env` (gitignored; never commit secrets). Both variables are
optional — **with neither set the SPA runs against the seeded demo users below and
makes no network call at all.**

```
# Switches the SPA from seeded demo users to the published contract.
VITE_GOOGLE_CLIENT_ID=
# Google Workspace domain, used as the `hd` account-picker hint (a hint, not a
# control — the API validates the domain).
VITE_COMPANY_DOMAIN=codev.com
# Deployed builds only. Unset in development.
VITE_API_URL=
```

### Running against the real backend

The contract published on 2026-09-16 and is linked from
`specs/001-office-supplies-mvp/contracts/README.md`.

1. Put the **Google Web OAuth client id** in `.env` as `VITE_GOOGLE_CLIENT_ID` and restart
   `npm run dev`. It must come from the same Google Cloud project the backend verifies
   tokens against, and that client must list `http://localhost:5173` as an authorized
   JavaScript origin.
2. Set `VITE_COMPANY_DOMAIN=codev.com`.
3. **Leave `VITE_API_URL` unset.** The dev server proxies `/api` to the backend
   (`vite.config.ts`), which keeps the API same-origin — necessary because the backend
   returns no CORS allow-origin header today, and convenient because the session cookie is
   then first-party. Setting it to the absolute origin is correct for a deployed build and
   will fail in the browser until the backend adds the SPA's origin to its allowlist.

The seeded account chooser disappears on its own once the client id is set, and Google's
own sign-in button is mounted invisibly over the drawn control. The sign-in screen needs no
flag of its own — it asks the active source whether it brings a button, exactly as it asks
whether it offers demo accounts.

**Keyboard note**: while Google's button is mounted, the drawn control is `inert` and
Google's button is the real focusable control. It is invisible at rest and becomes visible
while focused, so a keyboard user sees and operates it with its own focus ring.

**Running the checks.** `npm run verify` drives the **seeded** source, which is what
gives it three roles to sign in as, so start the dev server with the client id blanked —
otherwise your own `.env` changes what is under test:

```bash
VITE_GOOGLE_CLIENT_ID= npm run dev   # one terminal
npm run verify                        # another
```

If a stale headless Chrome is listening on 9222 the browser gates time out; either kill it
or give the run a browser of its own with `OSRS_CDP_PORT=9433 npm run verify`.

**The dev server must be on port 5173.** Only `http://localhost:5173` is registered as an
authorized JavaScript origin on the OAuth client, and Google refuses any other origin — the
sign-in screen can only report its generic "Sign-in did not succeed", because the SPA is
never told why. `vite.config.ts` sets `strictPort: true` so a second `npm run dev` fails
with *"Port 5173 is already in use"* instead of quietly starting on 5174, where sign-in
cannot work. If you see that error, stop the dev server you already have running.

**Known limitation.** The contract's `role` enum is `admin | employee`, so `admin` is
mapped to Supply Admin and **the Approver role is unreachable through real sign-in**.
Demo the approve/reject stage through the seeded source until the backend adds a third
role. See [ADR-0005](../../docs/adr/0005-google-sign-in-against-the-published-contract.md)
and `RG_DOCS/questionsToBackend.md`.

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
