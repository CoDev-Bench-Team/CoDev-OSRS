# ADR-0008: Inventory is a per-unit register

## Status

Accepted — 2026-09-26. Decided by the project owner (BEN-116).
**Partly supersedes [ADR-0006](0006-assets-and-inventory.md)**: ADR-0006 decision 5 (the register is post-MVP) is withdrawn. Decision 1's "Stock is a quantity held against an asset at an office" and decision 3's "Asset encoded / stock set" row and Deployed column no longer hold: stock is counted from unit statuses, and completion assigns units. Decisions 2 (stock is a vector over offices) and 4 (the `Low-stock threshold` term), the Assets/Inventory split in decision 1, and reserve-on-submit in decision 3 still stand.

**Amended 2026-09-26 by [ADR-0009](0009-received-and-accountability-form.md)**: the reserved units move to `Assigned` on `Received` (the Employee's Accountability Form), not on completion. In the tables below, read the "Request completed" row as `Received`; `Completed` now changes no unit's status.

## Context

ADR-0006 modelled stock as three stored numbers per (asset, office), set with
one stepper per office on `03.4 - Update Stocks`. It named the per-unit register
the design drew (serial numbers, BitLocker, assignment) as post-MVP.

Since then the design and the backend have both moved:

- **The design.** The 2026-09-26 export carries a single `03 - Inventory` on the
  Mockups page, and it lists **units**: `MODEL · CATEGORY · PR · SERIAL NUMBER ·
  OFFICE · ASSIGNED · STATUS · ACTION`. `+ Add Inventory` opens **Add Single
  Unit** and **Add Multiple Units**, and Review/Edit and Remove Unit panels
  complete the set. `03.4 - Update Stocks` and `Add Catalog Item` were moved to
  the Archive page on 09-23. The stock-line table (frame B) survives only as the
  backdrop behind two panels. The Update Asset panel now carries
  `STOCKS · Low-stock threshold`. See
  [drift-2026-09-26 §2](../design-system/drift-2026-09-26.md#2-accepted--inventory-is-a-per-unit-register-constitution-400-iii-viii-adr-0008).
- **The backend.** Stock is `/inventory-items` (and `/inventory-items/bulk`),
  one row per unit with `assetId`, `location`, purchase details,
  `serialNumber`, `bitlockerIdentifier`, `recoveryPin`, `assignedToId` and a
  `status` of `Available · Reserved · Assigned · Inactive`. The asset keeps
  `lowQtyAlert` and has lost `location` and `quantity`
  ([contracts README](../../specs/001-office-supplies-mvp/contracts/README.md)).

Constitution 3.0.1 VIII put the register out of scope, so the SPA could build
neither the drawn screens nor the published contract. The project owner decided
to follow the file.

## Decision

**1. Inventory is a register of units.** A unit is one physical item of one
asset, held at one office. It carries a tag (`PR`, e.g. `CODEV-LAPTOP-1232`), a
serial number, an office, a status, an optional assignee and assigned-on date,
purchase details (price, supplier, purchased date), device details (BitLocker
identifier, recovery key/PIN) and notes (description, attachment). The status
set is the **contract's**: `Available`, `Reserved`, `Assigned`, `Inactive`.

**2. Stock is derived from units, never stored.** Per (asset, office):

| Quantity | Is |
|----------|----|
| Available | units in `Available` |
| Reserved | units in `Reserved` |
| Total | Available + Reserved: the units still in the store |
| Assigned (Assets screen) | units in `Assigned` |

`Inactive` units are counted nowhere.

**3. The pipeline moves units, and the numbers are unchanged from ADR-0006.**

| Event | Unit status change | Available | Reserved | Total |
|-------|--------------------|-----------|----------|-------|
| Units added | → `Available` | +n | — | +n |
| Unit made `Inactive`, or an `Available` unit removed | `Available` → `Inactive` / removed | −n | — | −n |
| Unit reactivated | `Inactive` → `Available` | +n | — | +n |
| Existing assignment recorded by an Admin (outside a request) | `Available` → `Assigned` | −n | — | −n |

Removing an `Inactive` unit, or adding a unit directly as `Assigned`, changes no count.
| Request submitted | *qty* units `Available` → `Reserved` | −qty | +qty | — |
| Request rejected / cancelled | those units `Reserved` → `Available` | +qty | −qty | — |
| Approved, For Delivery, Ready for Pickup | none | — | — | — |
| Request completed | those units `Reserved` → `Assigned`, assignee = requester | — | −qty | −qty |

The API chooses which units are reserved, and does so in the same transaction as
the status change. **Only the request transitions move a unit into or out of
`Reserved`.** An Admin editing a unit may move it between `Available` and
`Inactive`, or record an existing assignment. `Reserved` is never offered as a
manual status, so Reserved always equals the units held by live requests. This ADR states that as a **requirement on the API**. It does
not describe current API behaviour.

**4. The low-stock threshold is per asset.** It is compared with Available in the
scope on screen: one office when an office is selected, otherwise the sum
across offices. That matches `GET /assets`' `stockLevel` + `location`.

**5. Units are Admin-only, and two of their fields are secrets.** Only an Admin
creates, edits or removes units. A unit that is `Assigned` or `Reserved` cannot
be removed. The file draws the assigned case; a reserved unit is holding stock
for a live request. The BitLocker identifier and recovery key/PIN are secrets
under constitution IX. They are never shown to an Employee and never written to
a log.

## Consequences

### Positive

- The screens, the contract and the constitution agree for the first time since
  09-22.
- Profile's **Currently Assigned** list gets a real source: units assigned to the
  user.
- The same pipeline numbers as ADR-0006 mean no request screen changes.

### Negative

- **Work in flight is retired.** PR #41 (BEN-48) builds frame B, the Update
  stocks panel with per-office steppers, and a disabled `+ Add Inventory`. All
  three follow ADR-0006 and constitution 3.0.1. BEN-107 and BEN-108 were
  re-scoped to the unit screens on 2026-09-26.
- **The app now holds disk-encryption recovery keys.** The design shows the
  recovery key/PIN in plain text on Review/Edit. "Admin-only" does not settle
  storage, masking or access audit. Those are open with the backend and are a
  named cost of this decision.
- The aggregate counts the Assets table needs (available / reserved / assigned
  per asset) have no published read yet.

### Neutral

- `Inventory Status` draws `In Storage`, which the contract lacks. Under
  constitution VII the SPA shows the contract's set and raises the gap.
- The removal confirmation asks for `Reason for removal *`. Whether the
  contract's unit-removal operation (planned as backend BEN-130) accepts it is
  not published.

## Alternatives Considered

**Keep the stock-line model (frame B) and the Update stocks panel.** Rejected: the
design moved that panel to the Archive page, and the published contract no
longer holds a per-office quantity to set.

**Hybrid: units for serialised devices, quantities for consumables.** Rejected:
neither the design nor the contract draws two models. It would be an invention.

## References

- [drift-2026-09-26](../design-system/drift-2026-09-26.md)
- [drift-2026-09-22 §10, status table](../design-system/drift-2026-09-22.md#status-2026-09-26)
- `AGENTS.md`: constitution 4.0.0, principles III and VIII
- [ADR-0006](0006-assets-and-inventory.md)
- `specs/010-design-ratification/spec.md`
- `specs/001-office-supplies-mvp/contracts/README.md`
