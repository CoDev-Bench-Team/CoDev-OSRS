# Data Model: Office Supplies Request System MVP

Logical **product** model (roles, statuses, inventory rules). **Not a database schema and not an HTTP contract.** JSON field names, paths, and types come from the backend team’s published API contract when it exists.

## Entities

### User

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| name | string | Display and email greeting |
| email | string unique | Login identifier |
| credential | secret | API-owned; never returned on REST |
| role | enum | `employee` \| `approver` \| `supply_admin` |
| createdAt | datetime | |

**Rules**: One role per user. Emails are notification addresses.

### Inventory item

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| name | string | |
| quantityOnHand | integer | ≥ 0 |
| isActive | boolean | default true |
| createdAt / updatedAt | datetime | |

**Rules**: Inactive items cannot be added to new requests.

### Request

| Field | Type | Notes |
|-------|------|--------|
| id | id | Public `#id` |
| requestor | User ref | Must be employee at submit |
| status | enum | see below |
| purpose | string? | Optional |
| rejectionReason | string? | Required when rejected |
| pickupLocation | string? | Set on release |
| submittedAt | datetime | Same as create for MVP (no draft) |
| approvedAt / approvedBy | datetime? / User ref? | |
| rejectedAt / rejectedBy | datetime? / User ref? | |
| preparedAt / preparedBy | datetime? / User ref? | |
| releasedAt / releasedBy | datetime? / User ref? | |
| completedAt | datetime? | Completer is requestor |
| createdAt / updatedAt | datetime | |

**Status**: `pending_approval` \| `rejected` \| `approved` \| `for_release` \| `released` \| `completed`

**Legal transitions**

| From | To | Actor |
|------|-----|--------|
| (new) | pending_approval | employee |
| pending_approval | approved | approver |
| pending_approval | rejected | approver |
| approved | for_release | supply_admin |
| for_release | released | supply_admin |
| released | completed | owning employee |

### Request line

| Field | Type | Notes |
|-------|------|--------|
| inventoryItemId | id | |
| itemName | string | Snapshot at submit |
| quantity | integer | ≥ 1; immutable after submit |

**Rules**: At least one line per request. Unique item per request.

### Notification log

| Field | Type | Notes |
|-------|------|--------|
| id | id | |
| requestId | id | |
| type | enum | `submitted` \| `approved` \| `rejected` \| `ready_for_pickup` \| `completed` |
| recipients | string[] | |
| subject | string | |
| body | string | Rendered body |
| status | enum | `sent` \| `failed` \| `logged` |
| error | string? | |
| createdAt | datetime | |

## Relationships

```
User 1──* Request (requestor)
User 1──* Request (actor on review / fulfill)
Inventory item 1──* Request line
Request 1──* Request line
Request 1──* Notification log
```

## Inventory vs request status

| Status | This request’s line quantities vs on-hand |
|--------|-------------------------------------------|
| pending_approval, approved, for_release, released, completed | already subtracted |
| rejected | subtracted then added back |

On-hand on the inventory item is authoritative for new submits.

## Seed (demo)

Documented in `quickstart.md`: three users, a handful of catalog items with non-zero stock (provided by the API).
