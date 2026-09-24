# Content conventions

Transcribed from the design system. These are as much a part of the product's
identity as its colours, and page authors are expected to follow them
(spec 002 FR-017).

## Casing is a three-tier system, and it is strict

| Tier | Used for | Examples |
|------|----------|----------|
| **Sentence case** | Page titles, even multi-word ones | "Supply Catalog", "Requests Queue", "My Requests" |
| **Title Case** | Buttons, status pills, nav items | "Add to Request List", "Confirm Rejection", "Pending Approval", "For Pickup" |
| **ALL CAPS** | Table column headings, card eyebrows | "REQUEST ID", "REQUESTER", "ITEMS", "TOTAL STOCK", "DEVICES" |

Exception worth knowing: "Update stock" is sentence case because it is a link,
not a button.

## Voice

Plain, operational, second-person-implied. The product says what a screen is for
and gets out of the way. It never sells, never apologises, never jokes.

**Subtitles are one sentence, no period.** They state what you can do here:

> Review, approve, and fulfill supply requests
> Monitor stock levels, manage reservations, and keep office essentials ready
> Your details and currently assigned supplies

**Buttons are imperative verb phrases naming the object**: "Add to Request
List", "Submit Request", "Approve Request", "Confirm Rejection". Never "Submit",
never "OK", never "Yes / No". Destructive confirmations restate the act —
"Confirm Rejection" — they do not ask "Are you sure?".

**Placeholders show a real example**, lower-case, with a trailing ellipsis when
open-ended: "e.g item on hold, insufficient justification...", "Search supplies
by name or category".

## IDs and codes are load-bearing

| Kind | Format | Example |
|------|--------|---------|
| Request | `REQ-YYYY-NNNN` | `REQ-2026-1847` |
| Inventory item | three-letter category prefix + four digits | `MON-2238`, `CBL-1106` |
| Assigned asset | company, owner initials, sequence | `CDV-MS-00087` |

Always render an identifier in Inter 700 (`type-ui-bold`) so it reads as an
identifier, not prose.

## Dates and counts

- Dates are **"Sep 8, 2026"** — three-letter month, no leading zero, comma.
- Timestamps append " at 9:42 AM".
- A requester line joins them with a bullet: "Maya Santos • Submitted Sep 11, 2026 at 9:42 AM".
- Counts are stated plainly and never rounded: "Showing 6 of 108 inventory items".
- Summary-card labels are sentence case and unpunctuated: "Pending approval", "Low stock alerts".

## No emoji. Anywhere.

Not in copy, not in status, not as iconography. The only non-alphanumeric glyphs
in the entire design file are the "⌄" in the model select and the "-" / "+" in
the quantity stepper — both set in Inter at the surrounding text size, not as
icons. Reproduce them literally rather than substituting a chevron icon.

## Sample data

Names are Filipino and the office is Davao — Maya Santos, Ethan Cruz, Samantha
Reyes, Daniel Santos, Isabella Mendoza; "mayas@codev.com • Davao Office". Keep
that register when writing new sample data.
