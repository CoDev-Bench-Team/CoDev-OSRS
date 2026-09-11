# API Contract: Office Supplies Request System MVP

This is a **REST JSON** contract. Any backend that honors it is valid. Language, framework, and datastore are not specified here.

Base path: `/api`. JSON in and out. Authenticated routes send `Authorization: Bearer <token>` or session cookie (implementation may pick one; the SPA MUST use the same).

Error body:

```json
{ "error": { "code": "STRING_CODE", "message": "Human readable" } }
```

Common codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `ILLEGAL_TRANSITION`, `INVENTORY_INSUFFICIENT`, `CONFLICT`.

## Auth

### POST /api/auth/login

Request: `{ "email": "string", "password": "string" }`  
Response 200: `{ "user": { "id": 1, "name": "string", "email": "string", "role": "employee" }, "token": "string" }`  
401 on bad credentials.

### GET /api/auth/me

200: `{ "user": { "id", "name", "email", "role" } }`

### POST /api/auth/logout

204 empty.

## Inventory

### GET /api/inventory

All authenticated roles. Query `?active=true` optional.  
200: `{ "items": [ { "id", "name", "quantityOnHand", "isActive", "updatedAt" } ] }`

### POST /api/inventory

Supply Admin. `{ "name": "string", "quantityOnHand": 0, "isActive": true }`  
201: item object. 403 otherwise.

### PATCH /api/inventory/:id

Supply Admin. Partial `{ "name"?, "quantityOnHand"?, "isActive"? }`  
Quantity updates here are **manual encode/adjust**, not request-driven. Request-driven changes MUST NOT use this endpoint.  
200: item. 400 if quantityOnHand < 0.

## Requests

Request object:

```json
{
  "id": 123,
  "status": "pending_approval",
  "purpose": "string | null",
  "rejectionReason": "string | null",
  "pickupLocation": "string | null",
  "requestor": { "id": 1, "name": "string", "email": "string" },
  "items": [{ "inventoryItemId": 1, "itemName": "Pen", "quantity": 2 }],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "submittedAt": "ISO-8601",
  "approvedAt": null,
  "releasedAt": null,
  "completedAt": null
}
```

Status strings in JSON: `pending_approval` | `rejected` | `approved` | `for_release` | `released` | `completed`.

### GET /api/requests

Role-scoped list:

- Employee: own requests
- Approver: `?status=pending_approval` default queue; may pass other filters later
- Supply Admin: `approved` and `for_release` by default; may include `released` for awareness

200: `{ "requests": [ Request ] }`

### GET /api/requests/:id

Allowed if caller is requestor, Approver, or Supply Admin. 404 if hidden from role (do not leak existence to random employees for others’ ids — return 404).

### POST /api/requests

Employee only.

```json
{ "purpose": "optional string", "items": [{ "inventoryItemId": 1, "quantity": 2 }] }
```

201: Request (`pending_approval`). Side effects: decrement stock; notification `submitted`.  
400 `VALIDATION` / `INVENTORY_INSUFFICIENT`.

### POST /api/requests/:id/approve

Approver. Empty body. 200 Request (`approved`). Notification `approved`. 409 `ILLEGAL_TRANSITION`.

### POST /api/requests/:id/reject

Approver. `{ "reason": "string" }` (trimmed non-empty). 200 Request (`rejected`). Increment stock; notification `rejected`.

### POST /api/requests/:id/prepare

Supply Admin. 200 Request (`for_release`).

### POST /api/requests/:id/release

Supply Admin. `{ "pickupLocation": "string" }` non-empty. 200 Request (`released`). Notification `ready_for_pickup`.

### POST /api/requests/:id/confirm

Owning Employee. 200 Request (`completed`). Notification `completed`.

## Notifications (QA / ops)

### GET /api/requests/:id/notifications

Approver, Supply Admin, or owning Employee.  
200: `{ "notifications": [ { "id", "type", "recipients", "subject", "status", "createdAt" } ] }`  
Body may be omitted in list; include `body` on this endpoint for Playwright assertions (MVP: include `body`).

## Health

### GET /api/health

200: `{ "ok": true, "db": true }` (unauthenticated). `db` false → 503.
