# ADR-0006: Assets and Inventory are separate; stock is per office and reserved on submit

## Status

Accepted — 2026-09-22. **Amends [ADR-0002](0002-deduct-inventory-on-submit.md)**
(which remains accepted for *when* stock moves; this ADR changes *what* moves).

## Context

Until this export the domain had one inventory concept: an item with a name, an
active flag and a single on-hand quantity, decremented on submit and restored on
reject or cancel. Spec 001's Out of Scope list explicitly excluded "separate
reserved-vs-on-hand stock columns".

The 2026-09-22 design file has two admin destinations where there was one, and
three stock numbers where there was one:

**`Assets`** — "Deployed and available units", by model:
ITEM NAME · CATEGORY · MODEL · AVAILABLE UNITS · PENDING/RESERVED UNITS ·
DEPLOYED UNITS, with **+ Add Asset** and a per-category field set.

**`Inventory`** — "Monitor stock levels, manage reservations, and keep office
essentials ready.":
ITEM NAME · CATEGORY · TOTAL STOCK · AVAILABLE QUANTITY · RESERVED / PENDING ·
STATUS · **Update stock**.

`TOTAL = AVAILABLE + RESERVED` holds in all six drawn rows. **Update stock**
opens a panel whose STOCKS section holds a **Low-stock threshold** and one
stepper per office — Cebu, Bacolod, Makati, Ortigas, Davao — and the Catalog
toolbar carries a matching office selector.

See [drift-2026-09-22 §4](../design-system/drift-2026-09-22.md).

## Decision

**1. Two resources.** An **Asset** is a requestable model (name, category,
model, description, image, category-dependent specs). **Stock** is a quantity
held against an asset **at an office**. Assets answer "what can I request";
Inventory answers "how many, where".

**2. Stock is a vector over offices**, not a scalar. The office set is the five
the `Site Office Label` component defines. Every quantity below is per
(asset, office).

**3. Submitting reserves; it does not deduct.**

| Event | Total | Available | Reserved | Deployed |
|-------|-------|-----------|----------|----------|
| Asset encoded / stock set | set by Admin | = total | 0 | 0 |
| Request submitted | — | −qty | +qty | — |
| Request rejected | — | +qty | −qty | — |
| Request cancelled | — | +qty | −qty | — |
| Approved | — | — | — | — |
| For Delivery / For Pickup | — | — | — | — |
| Completed | −qty | — | −qty | +qty |

`Total` only falls when items actually leave, at `Completed`. `Available` and
`Reserved` are never negative, and `Total = Available + Reserved` is an
invariant the API must hold in the same transaction as the status change.

**4. `Low-stock threshold` replaces `lowQtyAlert` as the product term**, and
drives the `In Stock` / `Low Stock` / `Out of Stock` pill and the chip counts on
both screens.

**5. The per-unit register is post-MVP.** The file also describes individual
units — `Add Catalog Item`'s Serial Number / BitLocker Identifier / Recovery
Key, Inventory variant A's `PR` code and `ASSIGNED` column, Profile's
`Currently Assigned` tags. The MVP ships the aggregate model only. The MVP MUST
NOT choose a shape that forecloses a later unit register hanging off an asset.

## Consequences

### Positive

- Matches the drawn screens, including the three-number arithmetic.
- "Reserved" makes the pipeline legible to an admin: `In Processing` on the
  queue and `RESERVED / PENDING` on Inventory are the same quantity.
- Per-office stock is what a five-site company actually has, and the Catalog's
  office selector finally means something.

### Negative

- **This is a contract change, not a UI preference.** The published
  `CreateAssetDto` carries `location`, `quantity` and `lowQtyAlert` on the
  asset; the design moved all three off it. The SPA cannot satisfy both.
  Raised with the backend team; tracked as an open question in
  [drift-2026-09-22 §10](../design-system/drift-2026-09-22.md).
- Spec 001's Out of Scope line "Separate reserved-vs-on-hand stock columns" is
  withdrawn, and constitution III is rewritten around reserve/release rather
  than decrement/increment.
- Concurrency is now about `Available`, not `Total`: two submits for the last
  unit must serialize so `Available` never goes negative.

### Neutral

- `Ortigas` (file) vs `Pasig` (published DTO) is unresolved. The SPA MUST use
  whichever the contract exposes and MUST NOT invent a third spelling.

## Alternatives Considered

**Keep the single on-hand number and treat RESERVED / PENDING as display.**
Rejected: the arithmetic in the drawn rows only works if reserved is real, and
`Update stock` edits per-office quantities that a scalar cannot hold.

**Model Inventory as the per-unit register now.** Rejected: serial numbers,
assignment and BitLocker escrow are not a four-week job, and nothing in the
request pipeline needs them.

## References

- [drift-2026-09-22 §4](../design-system/drift-2026-09-22.md)
- `AGENTS.md` — constitution 3.0.0, principle III
- `docs/process-flow.md` — Inventory Rules
- `specs/001-office-supplies-mvp/contracts/README.md`
- [ADR-0002](0002-deduct-inventory-on-submit.md)
