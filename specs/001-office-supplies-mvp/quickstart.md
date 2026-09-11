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

Suggested cast for walkthroughs (actual emails/passwords are whatever the backend seeds):

| Suggested email | Role |
|-----------------|------|
| employee@codev.local | employee |
| approver@codev.local | approver |
| supply@codev.local | supply_admin |

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
