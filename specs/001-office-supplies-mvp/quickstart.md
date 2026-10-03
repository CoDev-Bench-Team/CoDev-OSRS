# Quickstart — OSRS MVP demo

This repo runs the **SPA**. A REST API **from the backend team** must be reachable separately. Point the SPA at it; do not invent routes here.

## Prerequisites

- Node.js 22+ (for the Vite app)
- Backend API origin and the backend team’s published contract

## Environment

Create `.env` (never commit secrets):

```
VITE_API_BASE_URL=https://codev-osrs-be.vercel.app
VITE_GOOGLE_CLIENT_ID=
VITE_COMPANY_DOMAIN=codev.com
```

`VITE_API_BASE_URL` is required. The SPA has no seeded or demo data (spec 017, Session 2026-10-03 second): every screen reads and writes the published API, with the session cookie (`credentials: 'include'`). Left unset, sign-in says the API is not configured.

`VITE_GOOGLE_CLIENT_ID` is the Web client id from the same Google Cloud project the API verifies (BEN-96). It is not a secret. Put it in `.env` only. `.env.example` names the variable and leaves it empty, and the id is not written into source. API-mode sign-in renders Google's button only when it is set. `VITE_COMPANY_DOMAIN` is an account-picker hint; the API still decides which domains may sign in.

The dev server is pinned to port 5173. That origin is the one authorized on the OAuth client. A busy port fails to start.

In development, Vite proxies `/auth` to `VITE_API_BASE_URL`, and every other API route under `/api` with the prefix stripped (`/api/requests` → `/requests`), so the session cookie is first-party on the Vite origin. The prefix exists because `/requests` and `/profile` are SPA addresses. A Netlify build does the same: the browser calls `/auth` and `/api/*` on the Netlify host, and Netlify proxies them to `VITE_API_BASE_URL`. A deploy preview needs that, because the preview and the API are different sites and the browser blocks a direct call. A production build that is not on Netlify calls `VITE_API_BASE_URL` directly, so those hosts must be on the same site, with the cookie `Secure` and `SameSite=Lax`. A refresh on those real hosts must restore the same person. A session that works on localhost or a deploy preview does not satisfy that check.

## Who can sign in

Real Google Workspace accounts that the API accepts. There are no demo users, no
seeded data and no dev stubs in the application. The SPA implements no
authentication of its own: the sign-in screen renders the designed Google
control and hands the credential to `src/features/auth/api-session-source.ts`,
which signs in, restores and signs out through the published API.

**There is no role switcher inside the application** (spec 003 D5). The role is
the one the API reports for the signed-in account.

## Run the SPA

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The application opens at `/login`; everything
else requires a session. The design system's component gallery is **not** part of the
application — it stays at `/__gallery` in development only.

## QA regression

```bash
npm run lint
npm run build
npm run e2e
```

`npm run e2e` runs the Playwright suite in `e2e/` against the Vite dev server in API mode. It does not need the backend: `e2e/fixtures/fake-api.ts` answers `/auth` and `/api` inside the browser with test-only data, keeping the published rules (reserve on submit, release on reject and cancel, assign on receive, Employee sees only their own). That data lives in `e2e/` and never ships; `scripts/check-build.mjs` fails a build that carries it. The documented path is Davao, the test Employee's office. Until contracts conflict 12 is answered, the path stops at `Received`: Sign and Complete are withheld (spec 017 Story 4).

Playwright covers:

1. Happy path through Ready for Pickup and `Received`, with Sign and Complete withheld (contracts conflict 12). Stock moves on submit and on `Received` only.
2. Reject path with the reservation released and a new request
3. Cancel paths from both sides, each requiring a reason
4. Notifications where the product exposes a record; a missing record is reported, not invented
5. Role cannot perform the other role’s transition

## Demo script (human)

1. Admin encodes a Headset asset (with a model) and adds 10 Available units at Davao — Total 10 / Available 10 / Reserved 0
2. An Employee at Davao adds 3 to the Request List and submits — Total 10 / Available 7 / Reserved 3, status Pending Approval. `Request received` is asserted only where the product shows that record
3. Admin approves — quantities unchanged. `Request approved` likewise
4. Admin sets **Ready for Pickup** at the Davao office — quantities unchanged
5. Complete is not offered. Admin or the Employee sets **Received** — Total 7 / Available 7 / Reserved 0
6. The Employee sees *Signing is not available yet*; the Admin sees no **Complete**. Both wait on contracts conflict 12
8. A rejection or a cancellation with a reason releases the reservation. An empty reason does not. For Delivery cannot be cancelled
