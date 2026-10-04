# ADR-0013: Signing the Accountability Form completes the request; the name is the signed-in Employee's own

## Status

Accepted — 2026-10-04. **Amends [ADR-0011](0011-admin-sets-received-employee-signs.md)**
decisions 3, 4 and 5. Decisions 1 and 2 stand: the Admin or the owning
Employee sets `Received`, and the units move to `Assigned` then. Constitution
**10.0.0**. Closes contracts conflict 12.

## Context

ADR-0011 had the Employee sign on a `Received` request without a status change,
and the Admin complete it afterwards. The published API never matched that:
`POST /requests/:id/sign` stores the signature and moves the request to
`completed` in the same write, and `PATCH /requests/:id` offers no
`completed` target (contracts conflict 12). The SPA therefore withheld both the
form and **Complete** (spec 017 Story 4), and the demo path stopped at
`Received`.

On 2026-10-04 the project owner decided to follow the API rather than wait on a
backend change, and to make signing a single press.

## Decision

**1. Signing completes the request.** The owning Employee signs the
Accountability Form on their own `Received` request, and the request moves to
`Completed` in the same write. No other actor may sign, and a request is
signed once.

**2. There is no separate Admin complete.** `Completed` is reached only by the
Employee's signature. The Admin's Review panel offers no **Complete**.

**3. The signature is the signed-in Employee's full name, prefilled and not
editable.** The form still requires the acknowledgement to be read to its end
and the agreement ticked; the Employee then presses **I acknowledge and sign**.
An Employee whose account carries no full name cannot sign and is told to
contact an Admin.

**4. Signing sends `Status changed`** (`Received` → `Completed`), since it is
now a transition (constitution V). The API sends it.

**5. Stock is unchanged by signing.** The units were assigned on `Received`.

## Consequences

### Positive

- The SPA and the published API agree; the full demo path runs end to end.
- Signing is two actions (tick, press) instead of typing a name.

### Negative

- **The Admin no longer closes the request.** ADR-0011's control point, where
  the Admin checks the signed form before completion, is gone. A request whose
  Employee never signs stays `Received` in the Admin's queue indefinitely.
- A prefilled name records who was signed in, not a name the Employee typed as
  an act of assent. The tick on the agreement carries that weight now.

## Alternatives considered

- **Keep ADR-0011 and wait on the backend** to split `/sign` from completion.
  Rejected by the project owner: it blocks the demo path on another team.
- **Keep a typed name.** Rejected: the owner asked for one-press signing.
