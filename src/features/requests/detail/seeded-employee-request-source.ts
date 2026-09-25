import type { User } from '../../auth/types';
import type { CancelResult, EmployeeRequest, EmployeeRequestSource } from './request-detail-types';

/** Non-production demo data, used only until the backend team publishes the
 *  request contract (constitution IX permits seeded placeholders).
 *
 *  Maya's first six requests are the rows of the design's `04 - My Requests`
 *  frame, in its order, one per status the list draws. The seventh,
 *  REQ-2026-1791, is `Cancelled`: the list draws no cancelled row, but
 *  `04.2 - Cancelled` draws the panel for one, so the seed carries one to open
 *  it from without cancelling first. `sam.torres` owns one request so the
 *  list can prove it shows only the signed-in Employee's. The file gives REQ-2026-1842 to
 *  two rows — Ready for Pickup and For Delivery — so the delivery row carries
 *  REQ-2026-1838 instead; an id is unique or it is not an id
 *  (docs/design-system/additions.md). REQ-2026-1847's lines and note are
 *  `04.1`'s. Times are Manila office hours, stored in UTC.
 *
 *  The store is in memory and mutable, so a cancel stays visible until the page
 *  reloads. What it does NOT do is restore stock: inventory is the backend's
 *  (constitution III, spec 003 FR-024), and this source models none. */
const SEED: Record<string, readonly EmployeeRequest[]> = {
  'maya.santos': [
    {
      id: 'REQ-2026-1847',
      submittedAt: '2026-09-11T01:42:00Z',
      lines: [
        { name: 'Laptop', description: 'Business Laptop - Dell Latitude', qty: 1 },
        { name: 'Keyboard', description: 'Wireless Keyboard - Logitech M185', qty: 1 },
        { name: 'USB-C Headset', description: 'USB-C Headset - A4Tech Hu-10', qty: 2 },
      ],
      noteToApprover: 'temporary project setup',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1805',
      submittedAt: '2026-08-29T05:20:00Z',
      lines: [{ name: 'Ergonomic Mouse', description: 'Ergonomic Mouse - Logitech Lift', qty: 1 }],
      noteToApprover: 'wrist strain from the current mouse',
      status: 'Approved',
      approvedAt: '2026-08-29T08:05:00Z',
    },
    {
      id: 'REQ-2026-1842',
      submittedAt: '2026-09-08T00:15:00Z',
      lines: [
        { name: 'Monitor', description: 'Monitor - Dell P2422H', qty: 1 },
        { name: 'Dock', description: 'USB-C Dock - Dell WD19S', qty: 1 },
      ],
      status: 'Ready for Pickup',
      handover: 'Ready for Pickup',
      approvedAt: '2026-09-08T03:30:00Z',
      handedOverAt: '2026-09-09T02:10:00Z',
    },
    {
      id: 'REQ-2026-1838',
      submittedAt: '2026-09-08T00:40:00Z',
      lines: [
        { name: 'Monitor', description: 'Monitor - Dell P2422H', qty: 1 },
        { name: 'Dock', description: 'USB-C Dock - Dell WD19S', qty: 1 },
      ],
      noteToApprover: 'for the Cebu office',
      status: 'For Delivery',
      handover: 'For Delivery',
      approvedAt: '2026-09-08T03:32:00Z',
      handedOverAt: '2026-09-10T01:00:00Z',
    },
    {
      id: 'REQ-2026-1760',
      submittedAt: '2026-08-14T03:05:00Z',
      lines: [{ name: 'Laptop Stand', description: 'Laptop Stand - Rain Design mStand', qty: 1 }],
      status: 'Rejected',
      // The frame draws no reason; this one is placeholder copy.
      rejection: { reason: 'A laptop stand was issued to you in June', at: '2026-08-15T01:20:00Z' },
    },
    {
      id: 'REQ-2026-1733',
      submittedAt: '2026-07-28T02:00:00Z',
      lines: [
        { name: 'Headset', description: 'Headset - Jabra Evolve2 40', qty: 1 },
        { name: 'Keyboard', description: 'Wireless Keyboard - Logitech M185', qty: 1 },
        { name: 'Mouse Pad', description: 'Mouse Pad - Logitech Studio', qty: 1 },
      ],
      status: 'Completed',
      handover: 'Ready for Pickup',
      approvedAt: '2026-07-28T06:15:00Z',
      handedOverAt: '2026-07-29T02:30:00Z',
      completedAt: '2026-07-29T08:45:00Z',
    },
    {
      id: 'REQ-2026-1791',
      submittedAt: '2026-08-20T02:15:00Z',
      lines: [
        { name: 'Webcam', description: 'Webcam - Logitech C920', qty: 1 },
        { name: 'Headset', description: 'USB-C Headset - A4Tech Hu-10', qty: 1 },
      ],
      noteToApprover: 'for client calls',
      status: 'Cancelled',
      // The frame draws no reason; this one is placeholder copy.
      cancellation: { reason: 'IT lent me a spare webcam and headset', at: '2026-08-20T02:40:00Z' },
    },
  ],
  // A second Employee with no sign-in account. Nothing here is ever Maya's, so
  // the My Requests gate can assert it never appears on her list — the
  // ownership rule the source owns (spec 009 D4).
  'sam.torres': [
    {
      id: 'REQ-2026-1850',
      submittedAt: '2026-09-12T02:00:00Z',
      lines: [{ name: 'Monitor', description: 'Monitor - Dell P2422H', qty: 1 }],
      status: 'Pending Approval',
    },
  ],
};

const store = new Map<string, EmployeeRequest[]>(
  Object.entries(SEED).map(([owner, requests]) => [owner, requests.map((r) => ({ ...r }))]),
);

export const seededEmployeeRequestSource: EmployeeRequestSource = {
  async list(user: User) {
    return [...(store.get(user.id) ?? [])];
  },

  async cancel(user: User, id: string, reason: string): Promise<CancelResult> {
    const own = store.get(user.id) ?? [];
    const index = own.findIndex((r) => r.id === id);
    if (user.role !== 'employee' || index === -1) return { ok: false, refusal: 'unavailable' };
    const trimmed = reason.trim();
    if (!trimmed) return { ok: false, refusal: 'reason-required' };
    // FR-009a / FR-009c: the Employee cancels only before anyone has decided.
    if (own[index].status !== 'Pending Approval') return { ok: false, refusal: 'status-changed' };

    const cancelled: EmployeeRequest = {
      ...own[index],
      status: 'Cancelled',
      cancellation: { reason: trimmed, at: new Date().toISOString() },
    };
    own[index] = cancelled;
    return { ok: true, request: cancelled };
  },
};
