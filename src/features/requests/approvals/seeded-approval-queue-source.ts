import type { ApprovalQueueSnapshot, ApprovalQueueSource } from './approval-queue-types';

/** Non-production demo data used only until the backend team publishes its contract. */
const SEEDED_SNAPSHOT: ApprovalQueueSnapshot = {
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
      requestorName: 'Samantha Reyes',
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
      requestorName: 'Noah Garcia',
      requestorContext: 'Operations',
      items: ['External Monitor'],
      submittedAt: '2026-08-12T10:10:00Z',
      status: 'Approved',
    },
    {
      id: 'REQ-2026-1726',
      requestorName: 'Ava Reyes',
      requestorContext: 'People Operations',
      items: ['Headset'],
      submittedAt: '2026-08-09T07:40:00Z',
      status: 'For Release',
    },
    {
      id: 'REQ-2026-1703',
      requestorName: 'Liam Cruz',
      requestorContext: 'Engineering',
      items: ['Keyboard'],
      submittedAt: '2026-08-05T12:30:00Z',
      status: 'Released',
    },
  ],
};

export const seededApprovalQueueSource: ApprovalQueueSource = {
  async load() {
    return SEEDED_SNAPSHOT;
  },
};
