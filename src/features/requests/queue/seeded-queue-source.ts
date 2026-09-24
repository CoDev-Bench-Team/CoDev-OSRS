import type { QueueSnapshot, QueueSource } from './queue-types';

/** Non-production demo data used only until the backend team publishes its contract.
 *
 *  No requestor here is the seeded Admin: one person holds one role
 *  (ARCHITECT.md 7), so the signed-in Admin must never find their own request
 *  waiting on their own decision. Maya Santos is the seeded Employee. Names follow the Filipino register in
 *  docs/design-system/content-conventions.md. */
const SEEDED_SNAPSHOT: QueueSnapshot = {
  lowStockAlertCount: 2,
  requests: [
    {
      id: 'REQ-2026-1847',
      requestorName: 'Maya Santos',
      requestorContext: 'Product Design',
      items: ['Laptop', 'Keyboard', 'USB-C Headset'],
      submittedAt: '2026-09-11T09:42:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1842',
      requestorName: 'Andrea Villanueva',
      requestorContext: 'Finance',
      items: ['Monitor', 'Dock'],
      submittedAt: '2026-09-08T08:15:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1805',
      requestorName: 'Daniel Santos',
      requestorContext: 'Customer Success',
      items: ['Ergonomic Mouse'],
      submittedAt: '2026-08-29T13:20:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1760',
      requestorName: 'Isabella Mendoza',
      requestorContext: 'Engineering',
      items: ['Laptop Stand'],
      submittedAt: '2026-08-14T11:05:00Z',
      status: 'Pending Approval',
    },
    {
      id: 'REQ-2026-1748',
      requestorName: 'Rafael Garcia',
      requestorContext: 'Operations',
      items: ['External Monitor'],
      submittedAt: '2026-08-12T10:10:00Z',
      status: 'Approved',
    },
    {
      id: 'REQ-2026-1726',
      requestorName: 'Bea Reyes',
      requestorContext: 'People Operations',
      items: ['Headset'],
      submittedAt: '2026-08-09T07:40:00Z',
      status: 'For Delivery',
    },
    {
      id: 'REQ-2026-1703',
      requestorName: 'Miguel Cruz',
      requestorContext: 'Engineering',
      items: ['Keyboard'],
      submittedAt: '2026-08-05T12:30:00Z',
      status: 'For Pickup',
    },
  ],
};

export const seededQueueSource: QueueSource = {
  async load() {
    return SEEDED_SNAPSHOT;
  },
};
