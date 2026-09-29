# Design drift — `.fig` re-export, 2026-09-29

The fifth full diff: re-read, diff, reconcile. It follows the same day's
single-frame [drift-2026-09-29.md](drift-2026-09-29.md), which read `02.2` from
a screenshot and asked the next export to confirm it (§4). It is also the design
baseline for the Admin **History** screen (spec 001 FR-016a, tasks T022), which
no earlier drift recorded in full.

**Baseline**: the 2026-09-26 export, as reconciled in
[drift-2026-09-26.md](drift-2026-09-26.md), plus the `02.2` screenshot of
[drift-2026-09-29.md](drift-2026-09-29.md)
**Checked against**: `~/Downloads/Office Supplies Request System (OSRS).fig`,
exported **2026-09-29T04:09:17Z**, read directly (kiwi schema + zstd document,
**17,165** node changes, up from 17,152)

**Status: no amendment needed.**

- Nothing in this export redefines a principle. The two changes that touch
  request behaviour agree with decisions already taken (§3, §4).
- `04 - History` is **unchanged** since 2026-09-14, and is recorded here as the
  build baseline (§2).
- **Still owed by the designer**: §6.

## How this was read

The method is the same as 09-26. `canvas.fig` is Figma's kiwi binary: block 0
is the compiled schema (raw deflate), block 1 the document (zstd). Every node
whose `editInfo.lastEditedAt` falls after **2026-09-26T02:49:27Z** (the
baseline's export time) is rolled up to its owning top-level frame. The 09-26
file is no longer on disk. A 09-24 copy is, so each edited node was also
compared with its 09-24 value to say *what* changed, not only *where*.

Both reading rules from
[drift-2026-09-26](drift-2026-09-26.md#how-this-was-read) apply: the style is
the authority over the cached value, and in a frame that draws a side panel over
a page only the panel is authoritative.

## 1. What moved since 2026-09-26

| Page | Frame | Touched | New | Last edit (UTC) |
|------|-------|--------:|----:|-----------------|
| Mockups | `02.2.1 - Requests Queue - Review - Approve` | 6 | 1 | 09-26 05:12 |
| Mockups | `02.2.1 - Requests Queue - Review - Update Status` (×2) | 9 / 11 | 3 / 3 | 09-26 05:14 |
| Mockups | `02.2.2- Requests Queue - Review - Reject` | 9 | 3 | 09-26 05:15 |
| Mockups | `03.1 Add Asset - Laptop` · `Headset` · `Phone` · `UPS` · `Mice` | 3 each | 0 | 09-26 05:19 |
| Mockups | `03.1 Add Asset - Wifi` · `Type C Hub` · `Other Device` | 10 each | 0 | 09-26 05:20 |
| Mockups | `04.1 - My Requests - View Request` @(565:7456) | 2 | 0 | 09-28 13:06 |
| Mockups | `02.2 - Requests Queue - Review` | 9 | 3 | 09-29 00:42 |

The `04.1` edit is the panel frame only, with no text, colour or size change.

**Unchanged since 09-26**: both `04 - History` frames and the Prototype copy,
every `03 - Inventory` frame and unit panel, `03- Assets` and `03.2- View Asset`,
`02 - Requests Queue` and its sort menu, `02.2.2.1 - … Reject`, every other My
Requests frame, `Top Navigation`, `Request Status`, `Status Timeline`, and every email.

## 2. `04 - History` — the build baseline (spec 001 FR-016a, US6)

Two Mockups frames, both last edited **2026-09-14**, before the two-role merge
and before `Received`. A third copy sits on Prototype.

**`04 - History`** @(1063, 31790) — the page:

- `Top Navigation`, variant `Property 1=Admin`.
- Heading **History**, subheading *"Full audit trail — completed, cancelled, and rejected requests"*.
- Search placeholder *"Search by request ID,  employee name, email, or item..."* (two spaces after the first comma, as in the Queue), and a sort select reading **Newest First**.
- Chips: **All requests (238)** (selected) · **Completed** · **Cancelled** · **Rejected**. Only *All requests* carries a count.
- Table: `REQUEST ID` · `REQUESTER` · `ITEMS` · `STATUS` · `RESOLVED` · `ACTION`.
  - Requester is two lines: name, then department (`Maya Santos` / `Product Design`).
  - Items is a comma list (`Laptop, Keyboard, USB-C Headset`), with no `+ N more` in the sample.
  - Status uses the `Request Status` pills: `Completed` ×2, `Rejected` ×2, `Cancelled` ×3.
  - Resolved is a date (`Sep 11, 2026`).
  - Action is a red **Review** button on every row. A hidden **View details →** link sits beside it.
- Pagination: `1-50 of 1,250`, back / pages / next, and `Result per page`.

**`04 - History`** @(2794, 31790) — the same page behind a **read-only panel**
for a `Cancelled` request:

- `REQ-2026-1847` + `Cancelled` pill, close icon.
- `REQUESTED BY:` — avatar, `Maya Santos`, `mayas@codev.com • Davao Office`.
- `ITEMS REQUESTED` — `ITEM` · `QTY`. There is no `CURRENT INVENTORY` column; the queue panels have one.
- `Note to Approver` → `temporary project setup`.
- `STATUS` timeline with two nodes: **Submitted** → **Cancelled**, as `04.2- My Requests - Cancelled` draws it.
- A red callout: **Reason for cancellation** → `Duplicate of request SR-1042`.
- No actions.

### Flags for the History build

| # | Issue | Proposed handling |
|---|-------|-------------------|
| H1 | **Review** is an action label on a read-only screen. The hidden **View details** link is the Employee-side wording | Decision needed. Both open the same read-only panel. The label is the only difference |
| H2 | **Only the Cancelled panel is drawn.** No Rejected or Completed panel exists in History | Compose from drawn parts: Rejected reuses the read-only **Reason for rejection** block of `02.2.2.1 - … Reject`. Completed shows no reason block |
| H3 | **The timeline for a request cancelled or rejected after approval is not drawn.** The only drawn case is Submitted → Cancelled | Reuse the request timeline and end it at the terminal node. Confirm in the spec |
| H4 | **RESOLVED** needs a resolution time from the API. The contract publishes none, and nor does it publish the stored rejection or cancellation reason on a request | Raise with the backend team (constitution VII). Build against a seeded source until published |
| H5 | The frames predate the Admin merge and `Received`. `Received` is not terminal and is not in History; it stays on the Requests Queue | No file change needed |
| H6 | `Note to Approver` and `SR-1042` sample copy | Already decided: Q7 by design, Q6 deferred to the backend ([spec 010](../../specs/010-design-ratification/spec.md)) |

## 3. `Received` now sits before `Complete` on every timeline

The five queue review panels (`02.2`, `02.2.1 Approve`, `02.2.1 Update Status`
×2, `02.2.2 Reject`) each gained a `Status Timeline Item` reading **Received**
(variant `Pending`) between 05:12 and 05:15 UTC on 09-26. Their timelines now
read:

`Submitted → Approved → For Delivery/For Pickup → Received → Complete`

The Employee frames (`03.1 - … Request Submitted`, `04.1`, `04.2 - Cancel
Request`) read the same way in this export, and `04.1`'s Accountability Form view
dates `Received` and leaves `Complete` pending. This is the order the project
owner decided on 2026-09-26 and the SPA already draws
(`src/features/requests/request-timeline.ts`).
The timeline half of [drift-2026-09-26 R1](drift-2026-09-26.md#5-designer-follow-up)
is closed in the file. The `Received` email half (R2) is not (§6).

The dots did not follow the labels. `02.2.2 Reject` and both `02.2.1 Update
Status` panels gained a fifth dot (`Frame 55`) and line (`Line 7`) outside
`Frame 56`, as R4 reported for `03.1`. `02.2` and `02.2.1 Approve` gained no dot
at all: five labels over four dots. The build draws one dot per node.

## 4. Confirmed — `Other Notes` on the pending review panel

[drift-2026-09-29](drift-2026-09-29.md) read this field from a screenshot, and
the project owner accepted it as the Admin's optional note sent with Approve or
Reject (spec 008 FR-007a; contracts conflict 6). The export confirms it:

- `02.2 - Requests Queue - Review` gained a block, layer name **Purpose field**,
  at 00:42 UTC on 09-29, between the timeline and the actions: label
  **Other Notes** (no asterisk), a bordered input, sample *"With laptop bag,
  mouse, mousepad and charger"*. The panel grew from 1024 to 1164 px tall.
- **Only on `02.2`.** Neither `02.2.1` Approve, the two `02.2.1` Update Status
  panels, nor `02.2.2` Reject gained it. This answers the first question in
  [drift-2026-09-29 §4](drift-2026-09-29.md#4-for-the-designer), and matches the
  SPA showing it only where a decision is offered.
- **Nothing reads it back.** No review panel, neither `04 - History` frame
  (§2), and no email changed. The second question there stays open.

The layer name *Purpose field* echoes `purpose`, the contract's name for the
request's **Note to Approver**. The label and the accepted reading say
otherwise, and the build follows them.

## 5. Add Asset panels — Q8 and Q9 answered in the file

- **Q8**: `03.1 Add Asset - Wifi`, `- Type C Hub` and `- Other Device` now show
  their own category (`Wifi`, `Type C Hub`, `Other Device`) instead of `Mice`.
  `Other Device` still differs from the contract's `Other Devices`; the SPA
  prints the contract's value.
- **Q9**: the backdrop header behind all eight panels now reads **Assets** /
  *"Assigned and available units"*, matching `03- Assets`. Under the panel rule
  this was never binding; it is now consistent.

## 6. Designer follow-up

Re-checked from [drift-2026-09-26 §5](drift-2026-09-26.md#5-designer-follow-up).

| # | Status in the 09-29 file |
|---|--------------------------|
| F1 | **Open.** `For Pickup` chip on `02 - Requests Queue`, `02.1 - … Sort Menu` and Prototype `02 - Requests Queue`. Every timeline still reads `For Delivery/For Pickup` |
| F2 | **Open.** `Request Status` variant still `Property 1=For Dellivery` |
| F3 | **Open.** Status Definitions (`Frame 93`) still names the **Supply Admin** |
| F4 | **Open.** Status Definitions still says inventory is *automatically deducted* on approval |
| D1–D6 | **Open.** Not re-asked; no frame changed that bears on them |
| R1 | **Timelines closed** (§3). The `Received` email's order is unchanged |
| R2 | **Open.** `Status changed email - Received` still reads `Completed Sep 29, 2026, 9:42AM` |
| R3 | **Open.** No `Received` chip on the Requests Queue |
| R4 | **Open, and now in all five queue review panels** (§3) |
| R5 | **Open.** Not re-checked; no style changed |

**New:**

| # | Question |
|---|----------|
| D7 | **History's row action** (§2, H1). **Review** or **View details** for a read-only panel? |
| D8 | **History's Rejected and Completed panels** (§2, H2). Draw them, or ratify composing them from the queue's read-only reject block? |

The Admin's *Other Notes* read-back stays with
[drift-2026-09-29 §4](drift-2026-09-29.md#4-for-the-designer).
