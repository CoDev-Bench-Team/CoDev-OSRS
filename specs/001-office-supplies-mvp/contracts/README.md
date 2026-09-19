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

| Field | Notes |
|-------|--------|
| `imageBase64` | Optional; base64 image, may include data-URI prefix |
| `name` | Required on create |
| `model` | Brand / model string |
| `type` | Category enum (e.g. Laptop, Headset, Monitor, …) |
| `location` | Office enum: Cebu, Bacolod, Makati, Pasig, Davao |
| `specs` | Optional `{ key, value }[]` custom specs |
| `quantity` | On-hand stock |
| `lowQtyAlert` | Low-stock threshold |

Product behavior (roles, statuses, inventory rules) still lives in `spec.md` and `docs/process-flow.md`; those are domain requirements, not HTTP design.
