# API contract — not authored here

The **backend team** owns the REST JSON contract (paths, payloads, status codes, auth headers, error shapes).

This folder MUST NOT contain an invented `api.md`. Agents MUST NOT design endpoints for the SPA to “require.”

When the backend team publishes a contract, record the link below and type the client against that document.

**Published contract:** [CoDev OSRS API (Swagger UI)](https://codev-osrs-backend.vercel.app/)

OpenAPI is served from that deployment (embedded in Swagger UI). Prefer the live docs over guessing shapes. Example: [Assets create](https://codev-osrs-backend.vercel.app/#/Assets/AssetsController_create).

## Validation error response (all body-validated endpoints)

Backend ticket: [BEN-98](https://linear.app/bench-synergy-project/issue/BEN-98/enforce-a-standard-api-validation-error-response-format) (Done).

Consistent with [RFC 9457](https://www.rfc-editor.org/info/rfc9457/) Problem Details and [RFC 6901](https://www.rfc-editor.org/info/rfc6901/) JSON Pointer. Content-Type: `application/problem+json`. HTTP status: `400`.

```json
{
  "type": "validation-error",
  "title": "Validation Failed",
  "status": 400,
  "errors": [
    {
      "detail": "imageBase64 is invalid",
      "pointer": "#/imageBase64"
    }
  ]
}
```

SPA forms MUST map each `errors[].pointer` to the matching input and show `detail` under that field. Do not invent alternate error codes or shapes.

## Assets create / update fields (reference)

From published `CreateAssetDto` / `UpdateAssetDto` as read from Swagger on **2026-09-24**, after backend PR #87 (BEN-20). Catalog and Inventory UI MUST align with Figma Asset/Catalog screens **and** these fields — do not invent extras.

**Re-read from the live Swagger 2026-09-25** (BEN-42). The DTO has changed since
this table was first written; the previous `type`, `location`, `specs[]` and
`quantity` fields are **gone from the asset**.

| Field | Notes |
|-------|--------|
| `imageBase64` | Optional; base64 image, may include data-URI prefix. Nullable on update |
| `name` | Required on create |
| `category` | Required on create. Enum: Laptop, Headset, Monitor, Phone, UPS, Mice, **Wifi**, Type C Hub, Other Devices. Replaces `type` |
| `model` | Required on create, **for every category** — see conflict 4 |
| `description` | Optional free text |
| `ram` · `storage` · `processor` · `graphics` · `operatingSystem` | Optional spec strings. Replace the `specs[]` key/value list — see conflict 5 |
| `lowQtyAlert` | Low-stock threshold, one per asset, default 5 — see conflict 3 |

`GET /assets` takes `page`, `limit`, `search` (name, model or category),
`category`, `location` ("scope available quantities … to a single office") and
`stockLevel` (`in_stock` · `low_stock` · `out_of_stock`, from Available against
the threshold). **Its `200` response has no documented schema.** The backend source
(2026-09-24) returns each asset with `quantity` = its count of **Available**
units, at `location` when given; Reserved, Total and Deployed are not returned. The Catalog (spec 005)
reads it through a seeded `CatalogSource` until it is.

Stock itself is now carried by **inventory items**, one per unit:
`/inventory-items` (and `/inventory-items/bulk`) with `assetId`, `location`
(Cebu · Bacolod · Makati · **Ortigas** · Davao), purchase details,
`serialNumber`, `bitlockerIdentifier`, `recoveryPin`, `assignedToId`, and on
update a `status` of `Available` · `Reserved` · `Assigned` · `Inactive`.

## Open conflicts with the 2026-09-22 design (raised 2026-09-22)

### State on 2026-09-24

The backend answered all three in PR #87 (BEN-20), before BEN-115 recorded a decision. Spec 014 (Assets and Inventory) ships as an SPA mock on seeded data until 1 is settled.

| # | State | What is still needed |
|---|-------|----------------------|
| 1 | **Answered with a per-unit register.** Total / Available / Reserved are counts of unit records by status. | The per-unit register is out of scope under constitution VIII and contradicts ADR-0006, so the **project owner** must choose: amend ADR-0006 and VIII to adopt it, or ask the backend for an aggregate stock resource. Either way the SPA needs **per (asset, office) Total and Reserved, Deployed per asset, and a way to set a quantity per office in one call** — none is exposed today. |
| 2 | **Resolved: `Ortigas`**, in every location enum (users, assets, inventory items). | — |
| 3 | **Resolved**: `location` and `quantity` left the asset; `lowQtyAlert` stayed, one per asset, which matches the one threshold `03.4 - Update Stocks` draws. | Spec 001 FR-003 says per (asset, office); amend it to per asset. |
| 4 | **New.** `model` is required for every category; the design asterisks it only on Laptop, Phone and Headset, offers it optionally on Wifi and Type C Hub, and draws no Model field on UPS, Mice and Other Device. | One of the two moves. |
| 5 | **New.** `specs[]` was replaced by five fixed fields, so the Update Asset panel's free custom-spec row (`e.g. External Keyboard`) has nowhere to be saved. | Restore a custom-spec field, or the designer drops the row. |

The sections below are the original write-up of 1–3.

Constitution VII forbids the SPA papering over a gap between the design and the
published contract. These three are **not UI preferences**; each needs a
backend decision before the screens that depend on them can be built. Evidence:
[drift-2026-09-22](../../../docs/design-system/drift-2026-09-22.md).

### 1. Stock is three numbers, per office, and reserved on submit

The design's Inventory screen shows **TOTAL STOCK · AVAILABLE QUANTITY ·
RESERVED / PENDING** per item, and the arithmetic `TOTAL = AVAILABLE + RESERVED`
holds in every drawn row. The Assets screen shows **AVAILABLE UNITS ·
PENDING/RESERVED UNITS · DEPLOYED UNITS**. `03.4 - Update Stocks` edits a
quantity **per office** (Cebu, Bacolod, Makati, Ortigas, Davao) with a single
**Low-stock threshold**.

So the pipeline **reserves** on submit and **consumes** on complete, rather than
decrementing on submit ([ADR-0006](../../../docs/adr/0006-assets-and-inventory.md)).

**Needed from the API:** per-(asset, office) `total` / `available` / `reserved`,
atomic reserve / release / consume alongside the status change, and the
invariant held server-side. A single scalar `quantity` cannot express it.

**2026-09-25 — moved, not closed.** The scalar `quantity` is gone. Stock is now
per-unit inventory items with a `location` and a `status`, and `GET /assets`
accepts `location` to scope availability. That answers "per office", but it is
the per-unit register constitution VIII puts out of scope, and the aggregate
Total / Available / Reserved read the screens need is not published as a shape.
Still open with the backend team; see also drift-2026-09-24 §4.

**2026-09-26 — decided: the per-unit register.** The project owner followed the
file and the contract. Inventory is `/inventory-items`, and per-(asset, office)
Total / Available / Reserved are **counts of unit statuses**
([ADR-0008](../../../docs/adr/0008-per-unit-inventory-register.md), constitution
4.0.0 III). Submit reserves units, reject and cancel release them, and `Received`
moves them to `Assigned` to the requester (constitution 5.0.0, ADR-0009). **Still needed from the API:**

- the unit moves atomic with the request status change, with the API choosing the units
- a published read of per-asset counts (available / reserved / assigned) for the Assets table
- whether the contract's unit-removal operation (planned as backend BEN-130) accepts the `Reason for removal` the design draws
- unit fields the design and spec 001 FR-003 need that the contract field list above lacks: the unit **tag** (`PR`, e.g. `CODEV-LAPTOP-1232`), an **assigned-on** date (Profile's "Assigned Jan 14, 2026"), and the notes **description / attachment**
- the design's `In Storage` unit status, which the contract lacks
- storage, masking and access audit for `recoveryPin` / `bitlockerIdentifier` (Admin-only secrets, constitution VIII / IX)

### 2. `Ortigas` vs `Pasig`

The design file's `Site Office Label` component has exactly five variants:
Cebu, Bacolod, Makati, **Ortigas**, Davao. The DTO says **Pasig**.

**Needed:** one spelling. The SPA will render whatever the contract exposes and
MUST NOT map or invent a third.

**2026-09-25 — closed on the contract side.** Every `location` enum in the
Swagger now says **Ortigas**. The Catalog uses it. The shell's `Office` type
(`src/features/auth/types.ts`) still says `Pasig` and has to follow; until it
does, a `Pasig` user has no recognised office and the Catalog offers them no
request action (spec 005 D7). **Follow-on** (spec 010 FR-014): shell/auth owns
moving `Office` to `Ortigas`.

### 3. `location`, `quantity` and `lowQtyAlert` are no longer on the asset form

The design's `03.1 Add Asset - <category>` and Update Asset panels carry only
Image · Item Name · Category · Model · Description · Specifications. All three
stock fields moved to `03.4 - Update Stocks`, where quantity is per office.

**Needed:** either the asset endpoints drop them in favour of a stock resource,
or the design is wrong. **BEN-83 / BEN-84 cannot be built against the current
DTO and the current design at the same time.**

**2026-09-25 — mostly closed.** `location` and `quantity` have left the asset
DTO. `lowQtyAlert` remains on the asset, which matches the design's single
**Low-stock threshold**. Whether that threshold is per asset or per office is
the one part still open.

**2026-09-26 — closed.** The threshold is **per asset**: the contract's
`lowQtyAlert` and the design's Update Asset panel (`STOCKS · Low-stock
threshold`) agree ([drift-2026-09-26 §4](../../../docs/design-system/drift-2026-09-26.md#q3--asset-fields)).

### 4. Request submit: no success body, no insufficient-stock refusal (raised 2026-09-25)

`POST /requests` is published with `CreateRequestDto` — `purpose` (optional;
the design's **Note to Approver**) and `items[]` of `{ assetId, quantity }`,
with no office field. Only its `400` validation response is documented.

**Needed from the API:**

- the **success** response: at least the display id (`REQ-…`), status,
  submitted time and the created lines, which the `03.1 - Request List -
  Request Submitted` confirmation reads back;
- the **insufficient-stock** refusal: its status code and body, so the SPA can
  show the API's own message without inventing a code;
- confirmation that submit is all-or-nothing across lines and reserves at the
  requester's home office.

Until then spec 011 submits through a seeded source behind a seam (spec 011,
Clarifications 2026-09-25). Linear: [BEN-43](https://linear.app/bench-synergy-project/issue/BEN-43).

### 5. `Received` and the Accountability Form (raised 2026-09-26)

Constitution 5.0.0 adds a request status, **`Received`**, between the handover
states and `Completed`
([ADR-0009](../../../docs/adr/0009-received-and-accountability-form.md),
[drift-2026-09-26 §3](../../../docs/design-system/drift-2026-09-26.md)). The
published contract had neither the status nor a way to reach it (as of
2026-09-26; see the 2026-09-30 note below).

**Needed from the API:**

- `Received` in the request status vocabulary, with the time it was set
  *(status published 2026-09-30; the time it was set is not confirmed)*;
- ~~an Employee-only submission of the **Accountability Form** on the owner's
  own `For Delivery` / `Ready for Pickup` request, carrying the agreement,
  the typed full name and optional notes, which sets `Received` and moves
  the reserved units to `Assigned` (`Total` and `Reserved` fall) in one
  transaction;~~ (the optional notes were withdrawn 2026-09-26, spec 012) **Amended 2026-09-29 (constitution 7.0.0, [ADR-0011](../../../docs/adr/0011-admin-sets-received-employee-signs.md)):**
- an **Admin or owning-Employee** transition from `For Delivery` /
  `Ready for Pickup` to `Received`, which moves the reserved units to `Assigned` (`Total` and
  `Reserved` fall) in one transaction *(published 2026-09-30 as `/receive`;
  who may call it and the unit move are not described)*;
- an Employee-only submission of the **Accountability Form** on the owner's
  own `Received` request, carrying the agreement and the typed full name. It
  records the acknowledgement and changes no status or unit, and is refused on
  a request already signed *(published 2026-09-30 as `/sign`; see the wording
  gap below)*;
- **whether a request has been signed, and when**, on the request resource,
  so the SPA can hide the form once signed and the Admin's Complete can wait
  for it;
- **Complete** narrowed to a signed `Received` request, with no unit change;
- ~~cancel refused on `Received`~~ *(published 2026-09-30)*;
- the `Status changed` email on `Received`.

**2026-09-30 — the live Swagger has moved.** It now publishes
`POST /requests/{id}/receive` ("Marks a handed-over request received") and
`POST /requests/{id}/sign` (`SignRequestDto { agreed, fullName, notes? }`), and
cancel is refused on `received` (see Cancel, below). One wording gap is raised
with the backend team: `/sign` is summarised as *"Signs the Accountability Form,
completing a received request"*. Constitution 7.0.0 IV has signing change no
status, and only an Admin sets `Completed`, once the form is signed. The SPA
does not guess which the API does.

Until then the SPA shows `Received` wherever it renders a status or timeline.
~~and does not build the form (spec 001 FR-012b, tasks T018b).~~ **Amended
2026-09-26 (BEN-136, [spec 012](../../012-accountability-form/spec.md)):** the
SPA builds the form against a seeded source behind the Employee request panel's
seam, and swaps in a contract-backed source when the API carries the above. The
gap itself stays open. The Employee's **Mark as Received** (spec 012 Story 0)
and the Admin's **Received** option in Update Status (spec 008 FR-008a) likewise
run against the seeded source only.

### 6. The Admin's Other Notes on a decision (raised 2026-09-29)

Frame `02.2 - Requests Queue - Review` draws an optional **Other Notes** box
above **Reject Request** / **Approve Request**
([drift-2026-09-29](../../../docs/design-system/drift-2026-09-29.md)).
`PATCH /requests/{id}` takes `UpdateRequestDto` — `purpose`, `status` and
`rejectionReason` — and has nowhere to put it. `purpose` is the Employee's
Note to Approver and MUST NOT be overwritten with the Admin's note.

**Needed from the API:** an optional free-text field for the Admin's note on
approve and reject, stored on the request. Say whether it is returned on
`GET /requests/{id}` and whether the `Request approved` / `Request declined`
emails carry it.

Until then the SPA collects the note and sends it only to the seeded source
(spec 008 FR-007a). A contract-backed source MUST NOT send it until the field is
published.

### 7. History: resolved requests (raised 2026-09-29)

The Admin's **History** (spec 001 FR-016a, [spec 013](../../013-admin-history/spec.md))
lists every `Completed`, `Rejected` and `Cancelled` request across all requestors,
with the date each was resolved and a read-only panel carrying the stored reason
([drift-2026-09-29-export §2](../../../docs/design-system/drift-2026-09-29-export.md), H4).
`GET /requests` (backend BEN-105) is not published with a documented response.

**Needed from the API:**

- a read of requests in terminal statuses, across all requestors, for an Admin;
- **the time each terminal status was set** (completed, rejected, cancelled), for
  the RESOLVED column and its sort. A generic "last updated" time does not say
  when the request was resolved;
- the stored **rejection reason** and **cancellation reason** on read (the
  `rejectionReason` on `UpdateRequestDto` is write-only as published), and who
  cancelled;
- the requester's **department**, which the REQUESTER column prints under the
  name, alongside name, email and office;
- the time of each earlier transition (approved, handed over), which the
  panel's timeline shows for a request cancelled after approval;
- **server-side paging, search and status filtering.** The design draws
  `1-50 of 1,250`. The SPA filters in the browser against the seed today (spec
  013 plan R4).

Until then History reads the seeded Admin source (spec 013 FR-013). Nothing
here proposes a route, parameter or field name.

### 8. An Admin cancel on `for_delivery` (raised 2026-10-01)

Constitution **8.0.0** IV ([ADR-0012](../../../docs/adr/0012-no-admin-cancel-on-for-delivery.md))
lets an Admin cancel only an `approved` or `ready_for_pickup` request. A
`for_delivery` request's items are out with the delivery, so releasing its
reservation would put units back to Available that are not in the store. The
published `POST /requests/{id}/cancel` still accepts an Admin cancel on
`for_delivery`.

**Needed from the API:** refuse an Admin cancel on `for_delivery` with the same
`409` as every other status it refuses. Constitution IV requires the API to
reject an illegal transition. A failed delivery is moved to `ready_for_pickup`
first, which the API already allows, and is then cancellable.

Until then the SPA does not offer the action (spec 008 FR-020, D19), and its
seeded source refuses it `status-changed`.

### Cancel (published; read 2026-09-30)

Matches constitution 8.0.0 IV except for conflict 8 (`for_delivery`). Recorded
here for the API-integration ticket, because spec 008 Story 5 (BEN-135) is built
against the seeded source (spec 008 FR-017).

`POST /requests/{id}/cancel` with `CancelRequestDto { reason }` (required;
*"Shown to the requester"*). An Employee may cancel their own `pending_approval`
request. An Admin may cancel `approved`, `ready_for_pickup` or `for_delivery`
(the last is conflict 8). Stock returns to Available and the requester is emailed. Any other status,
`received` included, is refused.

| Response | SPA refusal (spec 008) |
|----------|------------------------|
| `200`: the cancelled request, *"with cancellationReason and cancelledBy"* | success; `cancellationReason` → the read model's `cancellation.reason`. `cancelledBy` is not read: the timeline draws from timestamps (spec 013 FR-009a), and no screen names who cancelled |
| `400` `validation-error`, pointer `#/reason` | `reason-required`: the reason field turns invalid with its required message. Showing the API's `detail` there needs a message carried on the refusal, which the integration ticket adds |
| `404` | `unavailable` |
| `409` | `status-changed` |

**Still needed from the API:** the `200` body's schema documents only `items`
and `units`. Spec 008 FR-022 (with spec 013 FR-009a) draws an Admin-cancelled
request's timeline from its handover state and its approval and handover times.
So say whether a cancelled request still carries those, and publish
`cancellationReason` in the schema. This is the same gap as conflict 7.

### Also worth a word

The design's emails print request ids as `REQ-10482`; every SPA screen prints
`REQ-2026-1847`. Whichever the API returns is what the SPA shows — but the two
should not both ship.

**2026-09-26 — deferred to the backend** by the project owner. The SPA prints
and formats whatever id the API returns, at API integration.

**Follow-on for BEN-107:** the `INVENTORY_STATUSES` comment in
`src/shared/ui/status.ts` still calls the unit register "out of scope
(constitution VIII)". BEN-107 fixes it when it models the unit statuses (spec 010
plan D12).

Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.
