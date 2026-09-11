# Product: Office Supplies Request System

**Initiative**: Internal process improvement MVP (4 weeks)  
**Audience**: Codev employees, approvers, and supply admins  
**Source**: Linear initiative brief + process-flow diagram (2026-09-11)

## Problem

Today office-supply requests run over chat and email. Status is fragmented, inventory is not visible in real time, duplicates and missed requests are common, and ops spends time chasing follow-ups.

## Opportunity

A single platform with an automated four-stage pipeline, live stock numbers, and email at every step.

## MVP Outcome

A **functional** end-to-end demo — not a perfect procurement suite — that shows Dev and QA shipping together:

**Check Inventory → Create Request → Review & Approve (or Reject, then a new request) → Prepare Items → Release to Employee → Confirm Receipt → Completed**, with inventory updates and notifications on each transition.

## Who Uses It

| Actor | Job |
|-------|-----|
| **Employee (Requestor)** | See stock, submit a request (items, qty, optional purpose), receive rejection reasons, confirm receipt, track status and history |
| **Approver (Team Lead / Department Head)** | Review pending requests against stock and necessity; approve or reject (reason required) |
| **Supply Admin (IT / General Services)** | Encode inventory; pick/pack approved requests; mark For Release; hand over and mark Released |
| **System** | Show stock; decrement on submit; increment on reject; email at each defined step |

The process diagram splits the old combined “Admin” into **Approver** and **Supply Admin**. Permissions follow that split.

## Four-Week Execution

| Week | Focus |
|------|--------|
| 1 | Planning & setup (this documentation) |
| 2 | Core development |
| 3 | Integration & QA |
| 4 | Regression & demo |

Stack (this repo): React + TypeScript + Vite + Tailwind. The SPA consumes a REST JSON API (contract in `specs/001-office-supplies-mvp/contracts/api.md`). API runtime and datastore are not chosen. QA: Playwright + HTTP contract tests; CI: GitHub Actions.

## Expected Impact

- Employees: simpler submit path and live status
- Admins: one place to manage stock and fulfillment
- Codev: less manual tracking

## Explicit Non-Goals (MVP)

- Buying from vendors, budgets, cost centers
- SSO / SAML / MFA
- Native mobile apps
- Multi-level or delegated approval
- Ingesting requests from email or chat
- Multi-warehouse, forecasting, or automatic reorder
