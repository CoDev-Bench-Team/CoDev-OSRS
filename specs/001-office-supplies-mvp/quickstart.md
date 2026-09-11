# Quickstart — OSRS MVP demo

This repo runs the **SPA**. A REST API that implements `contracts/api.md` must be reachable separately (stack TBD).

## Prerequisites

- Node.js 22+ (for the Vite app)
- A contract-compliant API origin (real or mock)

## Environment

Create `.env` (never commit secrets):

```
VITE_API_ORIGIN=http://localhost:8080
```

Point this at whatever hosts `/api`. Optionally proxy `/api` through Vite (`vite.config.ts`) so the browser stays same-origin.

## Demo users (API seed)

The API SHOULD provide:

| Email | Role | Password (dev) |
|-------|------|----------------|
| employee@codev.local | employee | password123 |
| approver@codev.local | approver | password123 |
| supply@codev.local | supply_admin | password123 |

## Run the SPA

```bash
npm install
npm run dev
```

Open the Vite URL and log in against the API.

## QA regression (target)

```bash
npm run lint
npm run build
npx playwright test   # when e2e/ exists; API must be up
```

Playwright MUST cover:

1. Happy path to `Completed` with stock decremented once
2. Reject path with stock restored and a new request
3. Notification log entries for all five types across those runs
4. Role cannot perform another role’s transition

## Demo script (human)

1. Supply Admin encodes pens (10) and notebooks (5)
2. Employee requests 3 pens — stock 7, status Pending Approval, submitted notification
3. Approver rejects “Duplicate of last week” — stock 10, rejected notification
4. Employee submits 3 pens again — stock 7
5. Approver approves — approved notifications to employee and supply
6. Supply Admin prepare → For Release; release at “GS Counter”
7. Employee confirms receipt — Completed; completed notifications to employee and approver
