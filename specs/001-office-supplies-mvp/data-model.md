# Data Model: Office Supplies Request System MVP

Logical **product** model (roles, statuses, stock rules). **Not a database schema and not an HTTP contract.** JSON field names, paths, and types come from the backend team's published API contract when it exists.

Amended 2026-09-22 to the design re-export — see [drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md) and ADRs [0005](../../docs/adr/0005-two-role-model.md), [0006](../../docs/adr/0006-assets-and-inventory.md), [0007](../../docs/adr/0007-fulfilment-status-vocabulary.md).

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

> The published `CreateAssetDto` says `Pasig` where the design says `Ortigas`. Unresolved; the SPA uses whatever the contract exposes and invents no third spelling.

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
| createdAt / updatedAt | datetime | |

**Category-dependent specs** (design-defined):

| Category | Spec keys |
|----------|-----------|
| Laptop | RAM, Storage, Processor, Graphics, Operating System |
| Phone | RAM, Storage |
| all others | none by default; the update panel allows a free key/value row |

**Rules**: Inactive assets cannot be added to new requests. An asset with no stock at the selected office is not requestable from there.

### Stock

Held per **(asset, office)**. This is the entity that replaced the old single `quantityOnHand`.

| Field | Type | Notes |
|-------|------|--------|
| assetId | id | |
| office | enum | |
| total | integer | ≥ 0 |
| available | integer | ≥ 0 |
| reserved | integer | ≥ 0 |
| lowStockThreshold | integer | ≥ 0; drives the pill and the chip counts |
| updatedAt | datetime | |

**Invariant**: `total = available + reserved`, always, and none of the three may be negative.

**Derived stock status**: `Out of Stock` when `available = 0`; `Low Stock` when `0 < available ≤ lowStockThreshold`; `In Stock` otherwise.

**Derived on Assets**: *available units* = `available`, *pending/reserved units* = `reserved`, *deployed units* = cumulative quantity consumed by `Completed` requests.

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
Asset 1──* Stock (one per office)
Asset 1──* Request line
Request 1──* Request line
Request 1──* Notification log
```

## Stock vs request status

Per line, against the `(asset, office)` stock row:

| Transition | total | available | reserved |
|------------|-------|-----------|----------|
| → pending_approval | — | −qty | +qty |
| → rejected | — | +qty | −qty |
| → cancelled | — | +qty | −qty |
| → approved | — | — | — |
| → for_delivery / for_pickup | — | — | — |
| → completed | −qty | — | −qty |

`available` at the requesting office is authoritative for new submits.

## Deliberately not modelled (MVP)

The design file describes a **per-unit asset register** — an individual unit with a tag (`CODEV-LAPTOP-1232`, `CDV-MS-00087`), a serial number, purchase details (price, supplier, purchased date), a BitLocker identifier and recovery key, an office, and an assignment to a person with an assigned-on date. It appears in `Add Catalog Item`, in Inventory variant A, and in Profile's *Currently Assigned* list.

It is **out of scope** (constitution VIII), and the shapes above must not foreclose it: a unit would hang off `Asset` and carry its own office and assignee, and `Stock` would become a projection over units rather than a stored row.

## Seed (demo)

Documented in `quickstart.md`: two users (one employee, one admin), a handful of assets with non-zero stock at one or more offices (provided by the API).
