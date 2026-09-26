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

From published `CreateAssetDto` / `UpdateAssetDto` (see Swagger). Catalog and Inventory UI MUST align with Figma Asset/Catalog screens **and** these fields — do not invent extras.

**Re-read from the live Swagger 2026-09-25** (BEN-42). The DTO has changed since
this table was first written; the previous `type`, `location`, `specs[]` and
`quantity` fields are **gone from the asset**.

| Field | Notes |
|-------|--------|
| `imageBase64` | Optional; base64 image, may include data-URI prefix. Nullable on update |
| `name` | Required on create |
| `category` | Required on create. Enum: Laptop, Headset, Monitor, Phone, UPS, Mice, **Wifi**, Type C Hub, Other Devices. Replaces `type` |
| `model` | Required on create. Brand / model string |
| `description` | Optional free text |
| `ram` · `storage` · `processor` · `graphics` · `operatingSystem` | Optional spec strings. Replace the `specs[]` key/value list |
| `lowQtyAlert` | Low-stock threshold — still on the asset, see conflict 3 |

`GET /assets` takes `page`, `limit`, `search` (name, model or category),
`category`, `location` ("scope available quantities … to a single office") and
`stockLevel` (`in_stock` · `low_stock` · `out_of_stock`, from Available against
the threshold). **Its `200` response has no documented schema**, so the name of
the per-office availability field is not yet published. The Catalog (spec 005)
reads it through a seeded `CatalogSource` until it is.

Stock itself is now carried by **inventory items**, one per unit:
`/inventory-items` (and `/inventory-items/bulk`) with `assetId`, `location`
(Cebu · Bacolod · Makati · **Ortigas** · Davao), purchase details,
`serialNumber`, `bitlockerIdentifier`, `recoveryPin`, `assignedToId`, and on
update a `status` of `Available` · `Reserved` · `Assigned` · `Inactive`.

## Open conflicts with the 2026-09-22 design (raised 2026-09-22)

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

### 2. `Ortigas` vs `Pasig`

The design file's `Site Office Label` component has exactly five variants:
Cebu, Bacolod, Makati, **Ortigas**, Davao. The DTO says **Pasig**.

**Needed:** one spelling. The SPA will render whatever the contract exposes and
MUST NOT map or invent a third.

**2026-09-25 — closed on the contract side.** Every `location` enum in the
Swagger now says **Ortigas**. The Catalog uses it. The shell's `Office` type
(`src/features/auth/types.ts`) still says `Pasig` and has to follow; until it
does, a `Pasig` user has no recognised office and the Catalog offers them no
request action (spec 005 D7).

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

### Also worth a word

The design's emails print request ids as `REQ-10482`; every SPA screen prints
`REQ-2026-1847`. Whichever the API returns is what the SPA shows — but the two
should not both ship.

Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.
