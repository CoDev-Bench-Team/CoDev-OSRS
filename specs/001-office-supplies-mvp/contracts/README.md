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
| `model` | Required on create, **for every category** — see conflict 9 |
| `description` | Optional free text |
| `ram` · `storage` · `processor` · `graphics` · `operatingSystem` | Optional spec strings. Replace the `specs[]` key/value list |
| `lowQtyAlert` | Low-stock threshold, one per asset, default 5 — see conflict 3 |

`GET /assets` takes `page`, `limit`, `search` (name, model or category),
`category`, `location` ("scope available quantities … to a single office") and
`stockLevel` (`in_stock` · `low_stock` · `out_of_stock`, from Available against
the threshold). **Its `200` response has no documented schema.** The backend source
(2026-09-24) returns each asset with `quantity` = its count of **Available**
units, at `location` when given; Reserved, Total and Assigned are not returned. The Catalog (spec 005)
reads it through a seeded `CatalogSource` until it is.

Stock itself is now carried by **inventory items**, one per unit:
`/inventory-items` (and `/inventory-items/bulk`) with `assetId`, `location`
(Cebu · Bacolod · Makati · **Ortigas** · Davao), purchase details,
`serialNumber`, `bitlockerIdentifier`, `recoveryPin`, `assignedToId`, and on
update a `status` of `Available` · `Reserved` · `Assigned` · `Inactive`.

## Open conflicts with the 2026-09-22 design (raised 2026-09-22)

### State on 2026-09-30

The backend answered 1–3 in PR #87 (BEN-20). Spec 014 (Assets, BEN-48) runs on
seeded data until the per-asset counts in 1 are published.

| # | State | What is still needed |
|---|-------|----------------------|
| 1 | **Decided 2026-09-26: the per-unit register** (constitution 4.0.0, ADR-0008). Available / Reserved / Total are counts of unit records by status. | The published read of per-asset counts (available / reserved / assigned) the Assets table needs — see the 2026-09-26 note under 1 below. |
| 2 | **Resolved: `Ortigas`**, in every location enum (users, assets, inventory items). | — |
| 3 | **Resolved**: `location` and `quantity` left the asset; `lowQtyAlert` stayed, one per asset, which the Add and Update Asset panels' `STOCKS · Low-stock threshold` matches (spec 014 D8). Spec 001 FR-003 now says per asset. | — |
| 9 | **Open.** `model` is required for every category; the design asterisks it only on Laptop, Phone and Headset, offers it optionally on Wifi and Type C Hub, and draws no Model field on UPS, Mice and Other Device. | One of the two moves. See 9 below. |
| 10 | **Withdrawn 2026-10-01.** The SPA misread the file: no Add or Update Asset frame draws a custom-spec row ([drift-2026-10-01](../../../docs/design-system/drift-2026-10-01.md) A2). The five fixed fields cover the design. | — |
| 11 | **Open.** Spec 015 (Inventory, BEN-150) builds the unit register on a seeded source; nine gaps against the published inventory-items contract. | G1 to G9. See 11 below. |

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
- unit fields the design and spec 001 FR-003 need that the contract field list above lacks: ~~the unit **tag** (`PR`, e.g. `CODEV-LAPTOP-1232`)~~ (withdrawn 2026-10-01: `PR` is the Purchase Request number, not a tag; see conflict 11 G5, and G7 for the attachment), an **assigned-on** date (Profile's "Assigned Jan 14, 2026"), and the notes **description / attachment**
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

### 9. `model` is required for every category (raised 2026-09-24)

`CreateAssetDto` requires `model` whatever the category. The eight `03.1 Add
Asset - <category>` frames asterisk it on Laptop, Phone and Headset, offer it
unstarred on Wifi and Type C Hub, and draw no Model field on UPS, Mice and
Other Device. Spec 014 D6 follows the design, so a contract-backed source would
be refused on those categories. **Needed:** the DTO makes `model` optional, or
the designer draws it on every category.

### 10. No field for a custom specification (raised 2026-09-24)

The DTO replaced the `specs[]` key/value list with five fixed fields (`ram`,
`storage`, `processor`, `graphics`, `operatingSystem`). The Update Asset panel
still draws a free row (`e.g. External Keyboard`). Spec 014 D7 builds it on the
seeded source only. **Needed:** a custom-spec field on the asset, or the
designer drops the row. A contract-backed source MUST NOT send it until then.

**2026-10-01 — withdrawn.** Re-reading the 2026-10-01 export, no Add Asset or
Update Asset frame draws the row; it was a misreading on the SPA side, not a
gap in the DTO. Spec 014 D7 is withdrawn and the row is gone from the SPA
([drift-2026-10-01](../../../docs/design-system/drift-2026-10-01.md) A2).
Nothing is needed from the backend.

### 11. Inventory: the unit register (raised 2026-10-01)

Spec 015 (BEN-150) builds Inventory, the per-unit register of ADR-0008, against
a seeded source behind `InventorySource`, because the published inventory-items
contract leaves the gaps below. Each row states what is published and what the
design or the constitution needs. None of the asks proposes a route, parameter
or field name: the shapes are the backend team's to choose. Until each is
answered, the SPA keeps its rule client-side and MUST NOT send what the
contract does not accept (constitution VII). Evidence: spec 015 §Contract gaps,
[drift-2026-10-01](../../../docs/design-system/drift-2026-10-01.md) §5.

| # | Published today | Needed |
|---|-----------------|--------|
| G1 | **Removal guards nothing.** `DELETE /inventory-items/{id}` removes any unit, `Assigned` and `Reserved` included | The API refuses both (constitution III) |
| G2 | **No removal reason** on `DELETE /inventory-items/{id}` | A reason field, or the design drops it (spec 015 D10) |
| G3 | **Secrets reach Employees.** `GET /inventory-items` and `GET /inventory-items/{id}` allow the `employee` role and return `bitlockerIdentifier` and `recoveryPin` | Omit both for an Employee, or make the reads Admin-only (constitution VIII, IX) |
| G4 | **`PATCH` accepts any status**, `Reserved` included, and any assignee change on a reserved unit | The API refuses manual moves into or out of `Reserved` (constitution III) |
| G5 | **No Purchase Request number** (`PR`) on the unit, single or bulk (spec 015 D14). The earlier record under 1 asked for a unit *tag*; that reading is withdrawn | A PR field on create, bulk, update and read |
| G6 | **No assignee on read.** The unit returns its asset only, not `assignedTo`; users carry no department | The assignee's name and department on the unit read |
| G7 | **Attachment is a URL** (`attachmentUrl`), and no upload operation is published; the design draws a file uploader | An upload operation, or the design changes |
| G8 | **`In Storage`** drawn, not in the status set (spec 015 D1) | One status set |
| G9 | **Search, counts and order.** `search` matches asset name, model or category, not PR or serial; there is no office filter and no per-status count for the chips; the list is ordered by id ascending, not newest added first (spec 015 FR-005) | Search by PR and serial; status counts, or the SPA counts per status; a newest-first order |

What the seeded source does meanwhile, so QA can tell the stand-in from the
contract: it refuses removing an `Assigned` or `Reserved` unit with `409`, keeps
the removal reason in memory, returns secrets from the single-unit read only,
refuses a status change on a unit reserved behind the panel with `409`, joins
the assignee from a seeded user directory, holds the attachment as a data URI,
searches PR and serial in the browser and lists newest first. Its `400`, `404`
and `409` bodies follow the shapes this file already records.

### Also worth a word

The design's emails print request ids as `REQ-10482`; every SPA screen prints
`REQ-2026-1847`. Whichever the API returns is what the SPA shows — but the two
should not both ship.

**2026-09-26 — deferred to the backend** by the project owner. The SPA prints
and formats whatever id the API returns, at API integration.

**Follow-on for BEN-107 — done 2026-10-01:** the `INVENTORY_STATUSES` comment
in `src/shared/ui/status.ts` no longer calls the unit register out of scope;
`UNIT_STATUSES` models the unit statuses (spec 015 T009).

Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.
