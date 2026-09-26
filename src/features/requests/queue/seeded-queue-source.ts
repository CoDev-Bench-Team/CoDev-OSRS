import type { QueueRequest, QueueSnapshot, QueueSource } from './queue-types';

/** Non-production demo data used only until the backend team publishes its contract.
 *
 *  No requestor here is the seeded Admin: one person holds one role
 *  (ARCHITECT.md 7), so the signed-in Admin must never find their own request
 *  waiting on their own decision. Maya Santos is the seeded Employee. Names follow the Filipino register in
 *  docs/design-system/content-conventions.md, and emails the `mayas@codev.com`
 *  shape the Profile frame draws.
 *
 *  Enough live rows to page at 10 per page, and three terminal ones that the
 *  queue must leave to History. */
const person = (requestorName: string, requestorContext: string, requestorEmail: string) => ({
  requestorName,
  requestorContext,
  requestorEmail,
});

const REQUESTS: QueueRequest[] = [
  { id: 'REQ-2026-1847', ...person('Maya Santos', 'Product Design', 'mayas@codev.com'), items: ['Laptop', 'Keyboard', 'USB-C Headset'], submittedAt: '2026-09-11T09:42:00Z', status: 'Pending Approval' },
  { id: 'REQ-2026-1842', ...person('Andrea Villanueva', 'Finance', 'andreav@codev.com'), items: ['Monitor', 'Dock'], submittedAt: '2026-09-08T08:15:00Z', status: 'Pending Approval' },
  { id: 'REQ-2026-1838', ...person('Paolo Navarro', 'Engineering', 'paolon@codev.com'), items: ['Type C Hub'], submittedAt: '2026-09-07T03:05:00Z', status: 'Pending Approval' },
  { id: 'REQ-2026-1831', ...person('Carla Mercado', 'Marketing', 'carlam@codev.com'), items: ['Wireless Mouse', 'Headset', 'Laptop Stand', 'Keyboard'], submittedAt: '2026-09-04T06:30:00Z', status: 'Pending Approval' },
  { id: 'REQ-2026-1805', ...person('Daniel Santos', 'Customer Success', 'daniels@codev.com'), items: ['Ergonomic Mouse'], submittedAt: '2026-08-29T13:20:00Z', status: 'Approved' },
  { id: 'REQ-2026-1790', ...person('Liza Bautista', 'People Operations', 'lizab@codev.com'), items: ['UPS'], submittedAt: '2026-08-24T02:45:00Z', status: 'Approved' },
  { id: 'REQ-2026-1760', ...person('Isabella Mendoza', 'Engineering', 'isabellam@codev.com'), items: ['Laptop Stand'], submittedAt: '2026-08-14T11:05:00Z', status: 'Approved' },
  { id: 'REQ-2026-1748', ...person('Rafael Garcia', 'Operations', 'rafaelg@codev.com'), items: ['External Monitor'], submittedAt: '2026-08-12T10:10:00Z', status: 'For Delivery' },
  { id: 'REQ-2026-1726', ...person('Bea Reyes', 'People Operations', 'bear@codev.com'), items: ['Headset'], submittedAt: '2026-08-09T07:40:00Z', status: 'For Delivery' },
  { id: 'REQ-2026-1715', ...person('Joaquin Flores', 'Finance', 'joaquinf@codev.com'), items: ['Phone'], submittedAt: '2026-08-07T01:20:00Z', status: 'Ready for Pickup' },
  { id: 'REQ-2026-1703', ...person('Miguel Cruz', 'Engineering', 'miguelc@codev.com'), items: ['Keyboard'], submittedAt: '2026-08-05T12:30:00Z', status: 'Ready for Pickup' },
  { id: 'REQ-2026-1698', ...person('Trisha Aquino', 'Product Design', 'trishaa@codev.com'), items: ['WiFi Adapter', 'Mouse'], submittedAt: '2026-08-03T05:55:00Z', status: 'Ready for Pickup' },
  // Terminal — History's, not the queue's.
  { id: 'REQ-2026-1690', ...person('Nico Ramos', 'Operations', 'nicor@codev.com'), items: ['Monitor'], submittedAt: '2026-08-01T04:00:00Z', status: 'Completed' },
  { id: 'REQ-2026-1684', ...person('Gia Castillo', 'Marketing', 'giac@codev.com'), items: ['Headset'], submittedAt: '2026-07-30T04:00:00Z', status: 'Rejected' },
  { id: 'REQ-2026-1677', ...person('Enzo Dela Cruz', 'Engineering', 'enzod@codev.com'), items: ['Laptop'], submittedAt: '2026-07-28T04:00:00Z', status: 'Cancelled' },
];

const SEEDED_SNAPSHOT: QueueSnapshot = {
  lowStockAlertCount: 2,
  requests: REQUESTS,
};

export const seededQueueSource: QueueSource = {
  async load() {
    return SEEDED_SNAPSHOT;
  },
};
