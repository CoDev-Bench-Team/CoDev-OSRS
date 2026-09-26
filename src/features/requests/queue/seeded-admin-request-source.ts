import { OFFICES, type Office } from '../../auth/types';
import type { RequestStatus } from '../../../shared/ui';
import type {
  AdminRequestSource,
  HandoverStatus,
  PickupLocation,
  ReviewLine,
  ReviewRequest,
  ReviewSnapshot,
  TransitionResult,
} from './review-types';

/** Non-production demo data, used only until the backend team publishes its
 *  contract (constitution IX permits seeded placeholders).
 *
 *  The queue's rows and the review panel read this one store, so a transition
 *  and the reload that follows see the same data (spec 008 plan D3, D4).
 *
 *  No requestor here is the seeded Admin, because one person holds one role
 *  (ARCHITECT.md §7). The signed-in Admin must never find their own request
 *  waiting on their own decision. Maya Santos is the seeded Employee. Names
 *  follow the Filipino register in docs/design-system/content-conventions.md,
 *  and emails follow the `mayas@codev.com` shape the Profile frame draws.
 *  REQ-2026-1847's lines, note and office are frame `02.2`'s.
 *
 *  There are enough live rows to page at 10 per page, and three terminal ones
 *  the queue leaves to History.
 *
 *  **What the store does not do.** It changes status only. Releasing a
 *  reservation on reject, and consuming stock on complete, are the API's
 *  (constitution III, spec 008 FR-016). The `available` figures are fixed
 *  sample values and never move. How the API names these transitions and their
 *  refusals is contracts conflict 1's to settle, and nothing here proposes a
 *  shape for it. */

const line = (description: string, qty: number, available: number | null): ReviewLine => ({ description, qty, available });

const person = (requestorName: string, requestorContext: string, requestorEmail: string, requestorOffice: Office) => ({
  requestorName,
  requestorContext,
  requestorEmail,
  requestorOffice,
});

function seed(): ReviewRequest[] {
  return [
    {
      id: 'REQ-2026-1847',
      ...person('Maya Santos', 'Product Design', 'mayas@codev.com', 'Davao'),
      items: ['Laptop', 'Keyboard', 'USB-C Headset'],
      lines: [
        line('Business Laptop - Dell Latitude', 1, 12),
        line('Wireless Keyboard - Logitech M185', 1, 24),
        line('USB-C Headset - A4Tech Hu-10', 2, 12),
      ],
      noteToApprover: 'temporary project setup',
      // 9:42 AM Manila, as frame `02.2`'s timeline reads.
      submittedAt: '2026-09-11T01:42:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1842',
      ...person('Andrea Villanueva', 'Finance', 'andreav@codev.com', 'Makati'),
      items: ['Monitor', 'Dock'],
      lines: [line('Monitor - Dell P2422H', 1, 6), line('USB-C Dock - Dell WD19S', 1, 3)],
      noteToApprover: 'second screen for month-end close',
      submittedAt: '2026-09-08T08:15:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1838',
      ...person('Paolo Navarro', 'Engineering', 'paolon@codev.com', 'Cebu'),
      items: ['Type C Hub'],
      lines: [line('Type C Hub - Anker 7-in-1', 1, null)],
      submittedAt: '2026-09-07T03:05:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1831',
      ...person('Carla Mercado', 'Marketing', 'carlam@codev.com', 'Pasig'),
      items: ['Wireless Mouse', 'Headset', 'Laptop Stand', 'Keyboard'],
      lines: [
        line('Wireless Mouse - Logitech M185', 1, 18),
        line('Headset - Jabra Evolve2 30', 1, 2),
        line('Laptop Stand - Rain Design mStand', 1, 7),
        line('Wireless Keyboard - Logitech K380', 1, 0),
      ],
      noteToApprover: 'new hire starting Monday',
      submittedAt: '2026-09-04T06:30:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1805',
      ...person('Daniel Santos', 'Customer Success', 'daniels@codev.com', 'Bacolod'),
      items: ['Ergonomic Mouse'],
      lines: [line('Ergonomic Mouse - Logitech Lift', 1, 9)],
      noteToApprover: 'wrist strain from the current mouse',
      submittedAt: '2026-08-29T13:20:00Z',
      status: 'Approved',
      approvedAt: '2026-08-30T02:05:00Z',
    },
    {
      id: 'REQ-2026-1790',
      ...person('Liza Bautista', 'People Operations', 'lizab@codev.com', 'Davao'),
      items: ['UPS'],
      lines: [line('UPS - APC Back-UPS 650VA', 1, 4)],
      submittedAt: '2026-08-24T02:45:00Z',
      status: 'Approved',
      approvedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REQ-2026-1760',
      ...person('Isabella Mendoza', 'Engineering', 'isabellam@codev.com', 'Cebu'),
      items: ['Laptop Stand'],
      lines: [line('Laptop Stand - Rain Design mStand', 1, 7)],
      submittedAt: '2026-08-14T11:05:00Z',
      status: 'Approved',
      approvedAt: '2026-08-15T01:30:00Z',
    },
    {
      id: 'REQ-2026-1748',
      ...person('Rafael Garcia', 'Operations', 'rafaelg@codev.com', 'Makati'),
      items: ['External Monitor'],
      lines: [line('External Monitor - Dell P2422H', 1, 6)],
      submittedAt: '2026-08-12T10:10:00Z',
      status: 'For Delivery',
      handover: 'For Delivery',
      approvedAt: '2026-08-12T12:00:00Z',
      handedOverAt: '2026-08-13T03:00:00Z',
    },
    {
      id: 'REQ-2026-1726',
      ...person('Bea Reyes', 'People Operations', 'bear@codev.com', 'Pasig'),
      items: ['Headset'],
      lines: [line('Headset - Jabra Evolve2 30', 1, 2)],
      submittedAt: '2026-08-09T07:40:00Z',
      status: 'For Delivery',
      handover: 'For Delivery',
      approvedAt: '2026-08-09T09:00:00Z',
      handedOverAt: '2026-08-10T02:00:00Z',
    },
    {
      id: 'REQ-2026-1715',
      ...person('Joaquin Flores', 'Finance', 'joaquinf@codev.com', 'Makati'),
      items: ['Phone'],
      lines: [line('Mobile Phone - Samsung Galaxy A15', 1, 5)],
      submittedAt: '2026-08-07T01:20:00Z',
      status: 'Ready for Pickup',
      handover: 'Ready for Pickup',
      pickupLocation: { kind: 'other', text: '6th floor IT desk' },
      approvedAt: '2026-08-07T04:00:00Z',
      handedOverAt: '2026-08-08T01:00:00Z',
    },
    {
      id: 'REQ-2026-1703',
      ...person('Miguel Cruz', 'Engineering', 'miguelc@codev.com', 'Cebu'),
      items: ['Keyboard'],
      lines: [line('Wireless Keyboard - Logitech K380', 1, 11)],
      submittedAt: '2026-08-05T12:30:00Z',
      status: 'Ready for Pickup',
      handover: 'Ready for Pickup',
      pickupLocation: { kind: 'office', office: 'Cebu' },
      approvedAt: '2026-08-06T01:00:00Z',
      handedOverAt: '2026-08-06T05:00:00Z',
    },
    {
      id: 'REQ-2026-1698',
      ...person('Trisha Aquino', 'Product Design', 'trishaa@codev.com', 'Davao'),
      items: ['WiFi Adapter', 'Mouse'],
      lines: [line('WiFi Adapter - TP-Link Archer T3U', 1, 3), line('Wireless Mouse - Logitech M185', 1, 14)],
      submittedAt: '2026-08-03T05:55:00Z',
      status: 'Ready for Pickup',
      handover: 'Ready for Pickup',
      pickupLocation: { kind: 'office', office: 'Davao' },
      approvedAt: '2026-08-03T08:00:00Z',
      handedOverAt: '2026-08-04T02:00:00Z',
    },
    // Terminal requests belong to History, not the queue.
    {
      id: 'REQ-2026-1690',
      ...person('Nico Ramos', 'Operations', 'nicor@codev.com', 'Bacolod'),
      items: ['Monitor'],
      lines: [line('Monitor - Dell P2422H', 1, 4)],
      submittedAt: '2026-08-01T04:00:00Z',
      status: 'Completed',
      handover: 'For Delivery',
      approvedAt: '2026-08-01T06:00:00Z',
      handedOverAt: '2026-08-02T02:00:00Z',
      completedAt: '2026-08-03T02:00:00Z',
    },
    {
      id: 'REQ-2026-1684',
      ...person('Gia Castillo', 'Marketing', 'giac@codev.com', 'Pasig'),
      items: ['Headset'],
      lines: [line('Headset - Jabra Evolve2 30', 1, 2)],
      submittedAt: '2026-07-30T04:00:00Z',
      status: 'Rejected',
      rejection: { reason: 'Duplicate of request SR-1042', at: '2026-07-30T08:00:00Z' },
    },
    {
      id: 'REQ-2026-1677',
      ...person('Enzo Dela Cruz', 'Engineering', 'enzod@codev.com', 'Cebu'),
      items: ['Laptop'],
      lines: [line('Business Laptop - Dell Latitude', 1, 8)],
      submittedAt: '2026-07-28T04:00:00Z',
      status: 'Cancelled',
      approvedAt: '2026-07-28T06:00:00Z',
      cancellation: { reason: 'Model discontinued; employee will re-request', at: '2026-07-29T02:00:00Z' },
    },
  ];
}

const HANDOVER_FROM = new Set<RequestStatus>(['Approved', 'For Delivery', 'Ready for Pickup']);

/** A fresh, independent store. The app uses the module-level instance below.
 *  Checks and dev stubs can build their own. */
export function createSeededAdminRequestSource(): AdminRequestSource {
  const store = seed();
  const find = (id: string) => store.find((request) => request.id === id);
  const now = () => new Date().toISOString();
  const refused = (refusal: Exclude<TransitionResult, { ok: true }>['refusal']): TransitionResult => ({
    ok: false,
    refusal,
  });

  return {
    pickupOffices: OFFICES,

    async load(): Promise<ReviewSnapshot> {
      // A new array of new objects on every load, so a reload after a
      // transition is a new snapshot, never a mutated old one.
      return { lowStockAlertCount: 2, requests: store.map((request) => ({ ...request })) };
    },

    async approve(id) {
      const request = find(id);
      if (!request) return refused('unavailable');
      if (request.status !== 'Pending Approval') return refused('status-changed');
      request.status = 'Approved';
      request.approvedAt = now();
      return { ok: true };
    },

    async reject(id, reason) {
      const request = find(id);
      if (!request) return refused('unavailable');
      if (request.status !== 'Pending Approval') return refused('status-changed');
      const trimmed = reason.trim();
      if (!trimmed) return refused('reason-required');
      // The reservation is released by the API, not here (FR-016).
      request.status = 'Rejected';
      request.rejection = { reason: trimmed, at: now() };
      return { ok: true };
    },

    async updateStatus(id, to: HandoverStatus, pickup?: PickupLocation) {
      const request = find(id);
      if (!request) return refused('unavailable');
      if (!HANDOVER_FROM.has(request.status)) return refused('status-changed');
      let location: PickupLocation | undefined;
      if (to === 'Ready for Pickup') {
        if (!pickup) return refused('location-required');
        if (pickup.kind === 'other') {
          const text = pickup.text.trim();
          if (!text) return refused('location-required');
          location = { kind: 'other', text };
        } else {
          if (!OFFICES.includes(pickup.office)) return refused('location-required');
          location = pickup;
        }
      }
      request.status = to;
      request.handover = to;
      request.pickupLocation = location;
      request.handedOverAt = now();
      return { ok: true };
    },
  };
}

export const seededAdminRequestSource: AdminRequestSource = createSeededAdminRequestSource();
