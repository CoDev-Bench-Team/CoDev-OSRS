# Data Model: Office Supplies Request System MVP

Logical **product** model (roles, statuses, stock rules). **Not a database schema and not an HTTP contract.** JSON field names, paths, and types come from the backend team's published API contract when it exists.

Amended 2026-09-22 to the design re-export — see [drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md) and ADRs [0005](../../docs/adr/0005-two-role-model.md), [0006](../../docs/adr/0006-assets-and-inventory.md), [0007](../../docs/adr/0007-fulfilment-status-vocabulary.md).

Amended 2026-09-26: stock is a **register of units**, and `Stock` is a projection over them. See [drift-2026-09-26](../../docs/design-system/drift-2026-09-26.md) and [ADR-0008](../../docs/adr/0008-per-unit-inventory-register.md).

## Entities

### User

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| name | string | Display and email greeting |
| email | string unique | Login identifier |
| credential | secret | API-owned; never returned on REST |
| role | enum | `employee` \| `admin` |
| office | enum | Home office; the catalog's default office selector |
| createdAt | datetime | |

**Rules**: One role per user. Emails are notification addresses. `approver` and `supply_admin` are retired (ADR-0005).

### Office

A fixed enum, not a table: `Cebu` \| `Bacolod` \| `Makati` \| `Ortigas` \| `Davao`.

> ~~The published `CreateAssetDto` says `Pasig` where the design says `Ortigas`. Unresolved.~~ The contract adopted `Ortigas` on 2026-09-25. The SPA's shell `Office` type still says `Pasig` and has to follow (contracts README, conflict 2).

### Asset

The requestable model. What an employee picks from the catalog.

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| name | string | Required |
| category | enum | `Laptop` \| `Headset` \| `Monitor` \| `Phone` \| `UPS` \| `Mice` \| `WiFi` \| `Type C Hub` \| `Other Devices` |
| model | string? | Required for Laptop / Phone / Headset; optional for WiFi / Type C Hub; absent for UPS / Mice / Other Devices |
| description | string? | |
| image | binary/base64? | `.jpeg` / `.png`, max 25 MB |
| specs | `{ key, value }[]` | Category-dependent; see below |
| isActive | boolean | default true |
| lowStockThreshold | integer | ≥ 0; per asset (moved from Stock 2026-09-26); drives the pill and the chip counts |
| createdAt / updatedAt | datetime | |

**Category-dependent specs** (design-defined):

| Category | Spec keys |
|----------|-----------|
| Laptop | RAM, Storage, Processor, Graphics, Operating System |
| Phone | RAM, Storage |
| all others | none by default; the update panel allows a free key/value row |

**Rules**: Inactive assets cannot be added to new requests. An asset with no stock at the selected office is not requestable from there.

### Unit

One physical item of an asset, held at one office. Added 2026-09-26 (ADR-0008).

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| assetId | id | → Asset |
| tag | string | `PR` on the table, e.g. `CODEV-LAPTOP-1232` |
| serialNumber | string? | |
| office | enum | Office |
| status | enum | The contract's set: `Available` \| `Reserved` \| `Assigned` \| `Inactive` |
| assigneeId | id? | → User; set when the unit is `Assigned` |
| assignedAt | datetime? | Profile's "Assigned Jan 14, 2026" |
| price / supplier / purchasedDate | money? / string? / date? | Purchase details |
| bitlockerIdentifier | **secret?** | Admin-only; never shown to an Employee, never logged |
| recoveryKey | **secret?** | Admin-only; never shown to an Employee, never logged |
| description / attachment | string? / file? | Notes; `.jpeg` / `.png`, max 25 MB |
| createdAt / updatedAt | datetime | |

**Rules**: Only an Admin creates, edits or removes units. A unit that is `Assigned` or `Reserved` cannot be removed. Only request transitions move a unit into or out of `Reserved`. A manual edit may set `Available` ↔ `Inactive` or record an existing assignment. Units can be added one at a time or in bulk.

> The design's `Inventory Status` also draws `In Storage`, which the contract lacks. The SPA shows the contract's set and raises the gap (constitution VII).

### Stock

**A projection over units, not a stored row** (2026-09-26). ~~Held per (asset, office) as `total` / `available` / `reserved` / `lowStockThreshold`.~~

| Derived field | Per (asset, office) |
|---------------|---------------------|
| available | count of units in `Available` |
| reserved | count of units in `Reserved` |
| total | available + reserved: the units still in the store |

**Invariant**: `total = available + reserved`, always, and none of the three may be negative.

**Derived stock status**: `Out of Stock` when `available = 0`; `Low Stock` when `0 < available ≤` the asset's `lowStockThreshold`; `In Stock` otherwise. The comparison uses Available in the scope on screen: one office when selected, otherwise the sum.

**Derived on Assets**: *available units* = `available`, *pending/reserved units* = `reserved`, *assigned units* = count of units in `Assigned` (~~deployed units~~; the column was renamed on 2026-09-24).

### Request

| Field | Type | Notes |
|-------|------|--------|
| id | id | Public `REQ-…` |
| requestor | User ref | Must be an employee at submit |
| office | enum | Where the stock is taken from |
| status | enum | see below |
| noteToApprover | string? | Optional free text from the drawer |
| rejectionReason | string | Required when rejected |
| cancellationReason | string | Required when cancelled, from either actor |
| cancelledBy | User ref? | |
| pickupLocation | string? | Required when status is `for_pickup` |
| submittedAt | datetime | Same as create for MVP (no draft) |
| approvedAt / approvedBy | datetime? / User ref? | |
| rejectedAt / rejectedBy | datetime? / User ref? | |
| handoverSetAt / handoverSetBy | datetime? / User ref? | When `for_delivery` / `for_pickup` was set |
| completedAt / completedBy | datetime? / User ref? | Completer is an **admin** |
| cancelledAt | datetime? | |
| createdAt / updatedAt | datetime | |

**Status**: `pending_approval` \| `approved` \| `rejected` \| `for_delivery` \| `for_pickup` \| `completed` \| `cancelled`

**Legal transitions**

| From | To | Actor | Requires |
|------|-----|--------|----------|
| (new) | pending_approval | employee | every line qty ≤ available at the office |
| pending_approval | approved | admin | |
| pending_approval | rejected | admin | non-empty reason |
| pending_approval | cancelled | owning employee | non-empty reason |
| approved | for_delivery | admin | |
| approved | for_pickup | admin | pickup location |
| for_delivery | for_pickup | admin | pickup location |
| for_pickup | for_delivery | admin | |
| for_delivery \| for_pickup | completed | admin | |
| approved \| for_delivery \| for_pickup | cancelled | admin | non-empty reason |

`rejected`, `cancelled` and `completed` are terminal. There is **no** confirm-receipt transition.

### Request line

| Field | Type | Notes |
|-------|------|--------|
| assetId | id | |
| assetName | string | Snapshot at submit |
| model | string? | Selected model, snapshot at submit |
| quantity | integer | ≥ 1; immutable after submit |

**Rules**: At least one line per request. Unique asset per request.

### Notification log

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| requestId | id? | Absent for `welcome` |
| template | enum | `request_received` \| `request_approved` \| `request_declined` \| `status_changed` \| `welcome` |
| previousStatus / newStatus | enum? | Set for `status_changed` |
| recipients | string[] | |
| subject | string | |
| body | string | Rendered body |
| status | enum | `sent` \| `failed` \| `logged` |
| error | string? | |
| createdAt | datetime | |

> `action_required` is a designed template with no flow behind it. It is out of scope and must not be added to this enum until the flow is specified.

## Relationships

```
User 1──* Request (requestor)
User 1──* Request (actor on review / handover / complete / cancel)
Asset 1──* Unit
User 1──* Unit (assignee)
Stock ⇐ Unit (derived per asset, office)
Asset 1──* Request line
Request 1──* Request line
Request 1──* Notification log
```

## Stock vs request status

Per line, at the requesting office. The API chooses which units.

| Transition | Unit status change | total | available | reserved |
|------------|--------------------|-------|-----------|----------|
| → pending_approval | *qty* units `Available` → `Reserved` | — | −qty | +qty |
| → rejected | those units `Reserved` → `Available` | — | +qty | −qty |
| → cancelled | those units `Reserved` → `Available` | — | +qty | −qty |
| → approved | none | — | — | — |
| → for_delivery / for_pickup | none | — | — | — |
| → completed | those units `Reserved` → `Assigned`, assignee = requester | −qty | — | −qty |

Outside a request (Admin unit edits): `Available` → `Inactive` or removed: total −n, available −n; `Inactive` → `Available`: +n, +n; existing assignment recorded (`Available` → `Assigned`): −n, −n. Removing an `Inactive` unit, or adding one directly as `Assigned`, changes no count.

`available` at the requesting office is authoritative for new submits.

## Deliberately not modelled (MVP)

~~The per-unit asset register~~: modelled since 2026-09-26 (see Unit). Nothing
in this section remains. `In Storage` is noted under Unit as a gap between the
design and the contract, not as an unmodelled entity.

## Seed (demo)

Documented in `quickstart.md`: two users (one employee, one admin), a handful of assets with `Available` units at one or more offices (provided by the API).
