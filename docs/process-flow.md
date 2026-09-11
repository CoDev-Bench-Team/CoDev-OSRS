# Process Flow — Inventory and Notifications

Transcribed from the Office Supplies Request System process diagram. This is the canonical status, inventory, and notification behavior.

**Purpose:** Clear path for requesting, approving, and releasing office supplies, including inventory updates and notifications.

## Swimlanes

### 1. Check Inventory & Create Request (Employee)

1. Start
2. **Check Available Inventory** — view current stock number per item
3. **Fill Out Request** — select items, enter quantity, optional purpose, submit
4. System: **Deduct inventory**; status becomes **Pending Approval**
5. Notification: **Request Submitted** (to Employee)

### 2. Review & Approve (Approver)

1. **Review Request** — check items, verify inventory and necessity
2. Decision: Approve?
   - **No** → **Reject Request (with reason)** → System **increments inventory**; status **Rejected** → notification **Request Rejected** (to Employee) → Employee may submit a **new** request
   - **Yes** → **Approve Request** → notification **Request Approved** (to Employee and Supply Admin) → inventory stays deducted

### 3. Prepare & Release (Supply Admin)

1. **Prepare Items** — check inventory, pick and pack, status **For Release**
2. **Release Items to Employee** — hand over, status **Released**
3. Notification: **Items Ready for Pickup / Released** (to Employee)
4. System: inventory already deducted; no further qty change

### 4. Complete (Employee)

1. **Receive Items**
2. **Confirm Receipt in System** → status **Completed**
3. Notification: **Request Completed** (to Employee and Approver)
4. System: no inventory change

## Status Values

| Status | Set when | Inventory |
|--------|----------|-----------|
| `Pending Approval` | Employee submits | Decremented |
| `Rejected` | Approver rejects with reason | Incremented back |
| `Approved` | Approver approves | Already deducted |
| `For Release` | Supply Admin finishes prepare | Already deducted |
| `Released` | Supply Admin hands over | Already deducted |
| `Completed` | Employee confirms receipt | No change |

## Inventory Rules

1. Inventory MUST be encoded in the system before requests can be submitted.
2. When a request is submitted, on-hand quantity is decremented by the requested quantity (`Pending Approval`).
3. When a request is rejected, on-hand quantity is incremented by the requested quantity (`Rejected`).
4. When a request is approved and items are released, quantity stays decremented (`Released` / `Completed`).

## Notification Catalog

### 1. Request Submitted

- **When:** Submit
- **To:** Employee
- **Subject:** Office Supplies Request Submitted
- **Body pattern:** Hi [Name]. Your office supplies request has been submitted. Request ID: #[id]. Items / Quantity. Current inventory has been updated.

### 2. Request Approved

- **When:** Approve
- **To:** Employee and Supply Admin
- **Subject:** Office Supplies Request Approved
- **Body pattern:** Request #[id] has been approved. The supply team will now prepare your items. Items / Quantity. Inventory remains deducted.

### 3. Request Rejected

- **When:** Reject
- **To:** Employee
- **Subject:** Office Supplies Request Rejected
- **Body pattern:** Request #[id] has been rejected. Reason: [reason]. Inventory has been returned. You may submit a new request if needed.

### 4. Items Ready for Pickup / Released

- **When:** Release
- **To:** Employee
- **Subject:** Office Supplies Ready for Pickup
- **Body pattern:** Items are ready for pickup at [Location] / have been released. Items / Quantity. Please collect them at your earliest convenience.

### 5. Request Completed

- **When:** Confirm receipt
- **To:** Employee and Approver
- **Subject:** Office Supplies Request Completed
- **Body pattern:** Request #[id] has been completed.

## Mermaid (happy path + reject)

```mermaid
flowchart TD
  start([Start]) --> inv[Check available inventory]
  inv --> form[Fill out and submit request]
  form --> deduct[Deduct inventory / Pending Approval]
  deduct --> mail1[Email: Request Submitted]
  mail1 --> review[Approver reviews]
  review -->|No| reject[Reject with reason]
  reject --> inc[Increment inventory / Rejected]
  inc --> mailR[Email: Request Rejected]
  mailR --> newReq[Employee may submit a new request]
  review -->|Yes| approve[Approve]
  approve --> mailA[Email: Request Approved]
  mailA --> prep[Supply Admin prepares / For Release]
  prep --> rel[Release to employee / Released]
  rel --> mailP[Email: Items Ready for Pickup]
  mailP --> recv[Employee receives items]
  recv --> conf[Confirm receipt / Completed]
  conf --> mailC[Email: Request Completed]
  mailC --> endNode([End])
```
