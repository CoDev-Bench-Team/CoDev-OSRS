# Implementation Plan: My Requests

**Spec**: [spec.md](spec.md) · **Linear**: BEN-44 (D1 [BEN-62](https://linear.app/bench-synergy-project/issue/BEN-62))
**Date**: 2026-09-26 · **Status**: Draft

## Summary

Promote spec 007's stand-in list to the real My Requests: sort newest first in the page, prove ownership with a second owner in the seed, and add a gate. The panel, the cancel flow and the source are spec 007's and do not change.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven | PASS | Spec 009 |
| II. Two roles | PASS | `/requests` is Employee-only (unchanged) |
| IV. State machine | PASS | Statuses come from `REQUEST_STATUSES`; the page sets none |
| VII. Typed contracts | PASS | Reads spec 007's typed seeded source; no route, field or error code added |
| VIII. MVP restraint | PASS | No filters or pagination (D3) |

## Changes

```
src/features/requests/history/
  order.ts             newestFirst(): sort by submittedAt desc, id desc, unparseable last  (D2)
  MyRequestsPage.tsx   sorts through newestFirst; the frame's widths, rules, ink and link (D5)
src/features/requests/detail/
  seeded-employee-request-source.ts   + one request owned by `sam.torres`, who has no sign-in  (D4)
scripts/
  check-my-requests.mjs   order · ownership · items summary · seven pills and tones · no navigation
  verify.mjs              + the gate
docs/design-system/additions.md   the stand-in row becomes the list's own row
```

`newestFirst` is a pure function over `EmployeeRequest[]`, so the rule is testable without rendering, and the page memoises it over the loaded list.

## Risks

- **Fidelity (D5).** Two drawn values stay shell-wide rather than per-page: card width and header height.
- Spec 007's gate counts seven rows for Maya; the second owner's request must not change that.
