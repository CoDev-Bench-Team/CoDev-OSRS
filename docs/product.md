# Product: Office Supplies Request System

**Initiative**: Internal process improvement MVP (4 weeks)  
**Audience**: Codev employees and supply admins  
**Source**: Linear initiative brief + process-flow diagram (2026-09-11), amended by the 2026-09-22 design re-export ([drift](design-system/drift-2026-09-22.md)) and the 2026-09-26 `Received` step ([drift](design-system/drift-2026-09-26.md))

## Problem

Today office-supply requests run over chat and email. Status is fragmented, inventory is not visible in real time, duplicates and missed requests are common, and ops spends time chasing follow-ups.

## Opportunity

A single platform with an automated four-stage pipeline, live stock numbers, and email at every step.

## MVP Outcome

A **functional** end-to-end demo — not a perfect procurement suite — that shows Dev and QA shipping together:

**Browse Catalog → Create Request → Review & Approve (or Reject, then a new request) → Hand over by Delivery or Pickup → Employee signs the Accountability Form (Received) → Completed**, with stock movements and notifications on each transition.

## Who Uses It

| Actor | Job |
|-------|-----|
| **Employee (Requestor)** | Browse the catalog by category and office, build a request list, submit with a note, see rejection and cancellation reasons, track status and history, cancel their own pending request, sign the Accountability Form on receipt |
| **Admin** | Review the queue; approve or reject (reason required); set For Delivery or Ready for Pickup; complete; cancel what cannot be fulfilled; own Assets and Inventory, including the unit register (add, review, remove units) |
| **System** | Show availability; reserve units on submit; release on reject or cancel; set `Received` and assign the units to the requester when the Accountability Form is submitted; email at each defined step |

The 2026-09-11 process diagram split the old combined “Admin” into **Approver** and **Supply Admin**. The 2026-09-22 design re-export merges them back into a single **Admin**, and permissions follow that merge — see [ADR-0005](adr/0005-two-role-model.md), which names the control point this gives up.

## Four-Week Execution

| Week | Focus |
|------|--------|
| 1 | Planning & setup (this documentation) |
| 2 | Core development |
| 3 | Integration & QA |
| 4 | Regression & demo |

Stack (this repo): React + TypeScript + Vite + Tailwind. The SPA consumes a REST JSON API **published by the backend team** (this repo does not author the HTTP contract). QA: Playwright; CI: GitHub Actions.

## Expected Impact

- Employees: simpler submit path and live status
- Admins: one place to manage assets, stock and fulfillment
- Codev: less manual tracking

## Explicit Non-Goals (MVP)

- Buying from vendors, budgets, cost centers
- SSO / SAML / MFA
- Native mobile apps
- Multi-level or delegated approval
- Ingesting requests from email or chat
- Multi-warehouse, forecasting, or automatic reorder
- Requesting more information from a requester (the `Action required` email has a template but no drawn flow)
