# UI kit — Office Supplies Request System (web app)

A click-through recreation of the OSRS mockups page of `Office Supplies Request System (OSRS).fig`, at the source frame size of 1440×1024.

Open `index.html`. Everything is fake data held in React state; no network calls.

## Flow

1. **Login** — the 421×500 white card on the full-bleed photo, Google sign-in only.
2. **Catalog** (Employee) — search, category chips, supply cards with model select and quantity stepper. Adding an item opens the Request List drawer.
3. **Request List drawer** — line items, optional purpose field, Submit Request. Submitting creates the request, deducts inventory and fires the "Request Submitted" notification (shown as the bottom-right toast).
4. **My Requests** (Employee) — the request-history table with a live status pill per row.
5. **Profile** (Employee) — details plus currently assigned supplies.
6. **Requests Queue** (Approver / Supply Admin) — summary cards, the pending table, Review per row.
7. **Review Request** — line items with stock counts, Approve or Reject.
8. **Reject confirmation** — the scrim dialog with the required rejection reason; confirming restores inventory and flips the requester's row to Rejected.
9. **Inventory** (Supply Admin) — summary, search, the six-column stock table with pagination.

Use the "Viewing as" switcher at the bottom-left to move between the Employee and the Approver / Supply Admin surfaces.

## Files

| File | Contents |
| --- | --- |
| `Chrome.jsx` | `TopBar`, `Avatar`, `PageHeader`, `SummaryCard`, `Button`, `TableCard`, `TableHead`, `SectionTitle` |
| `LoginScreen.jsx` | Login frame |
| `CatalogScreen.jsx` | Catalog grid, category chips, Request List drawer |
| `RequestScreens.jsx` | Requests Queue, Review Request, Reject dialog, My Requests |
| `InventoryScreen.jsx` | Inventory management table |
| `ProfileScreen.jsx` | Profile and assigned supplies |
| `App.jsx` | Role switching, state, notifications |

Primitives (`SupplyCard`, `StatusPills`, `Search`, `SignInButton`, `Backdrop`, the icons and logos) come from the compiled design-system bundle — the kit never re-implements them.

## Knowingly omitted

The source has no designed hover, focus, press, empty or loading states, no mobile frames, and no notification-email designs. Those are left out rather than invented.
