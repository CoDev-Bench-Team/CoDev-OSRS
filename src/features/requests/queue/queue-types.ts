import type { RequestStatus } from '../../../shared/ui';

/** A feature-local read model, not a backend response shape. */
export interface QueueRequest {
  id: string;
  requestorName: string;
  requestorContext?: string;
  /** Searched (FR-020) but not displayed: the table's REQUESTER column is name
   *  over department. */
  requestorEmail?: string;
  items: readonly string[];
  submittedAt: string;
  status: RequestStatus;
}

export interface QueueSnapshot {
  requests: readonly QueueRequest[];
  /** Classified by the source; the SPA deliberately owns no threshold. */
  lowStockAlertCount: number;
}

export interface QueueSource {
  load(): Promise<QueueSnapshot>;
}

/** The statuses the queue lists. Terminal ones — `Rejected`, `Cancelled`,
 *  `Completed` — belong to History (spec 001 FR-016a). `Received` is live: it
 *  waits on the Admin's Complete (constitution 4.0.0; spec 004 amendment 5). */
export const LIVE_STATUSES = [
  'Pending Approval',
  'Approved',
  'For Delivery',
  'Ready for Pickup',
  'Received',
] as const satisfies readonly RequestStatus[];
export type LiveStatus = (typeof LIVE_STATUSES)[number];

/** The statuses the file draws a chip for (FR-019). `Received` has none —
 *  it is reached through `All requests` and search (drift-2026-09-26 §3). */
const CHIP_STATUSES = ['Pending Approval', 'Approved', 'For Delivery', 'Ready for Pickup'] as const satisfies readonly LiveStatus[];
export type ChipStatus = (typeof CHIP_STATUSES)[number];

/** A chip is either every live request or one drawn live status. */
export type QueueChip = 'All requests' | ChipStatus;
export const QUEUE_CHIPS: readonly QueueChip[] = ['All requests', ...CHIP_STATUSES];

export const QUEUE_SORTS = ['Newest First', 'Oldest First', 'Employee (A-Z)'] as const;
export type QueueSort = (typeof QUEUE_SORTS)[number];

/** 50 is the value the file draws; the rest are ours (spec 004, amendment 3). */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Chip, search, sort and page as one value (FR-023). */
export interface QueueQuery {
  chip: QueueChip;
  search: string;
  sort: QueueSort;
  /** 1-based. May run past the last page; the projection clamps it. */
  page: number;
  pageSize: number;
}

export const INITIAL_QUERY: QueueQuery = {
  chip: 'All requests',
  search: '',
  sort: 'Newest First',
  page: 1,
  pageSize: 50,
};

/** A row is a projection of a request: the identity fields are carried over
 *  as-is (typed off the source so they cannot drift), and the display-only
 *  `items`/`submittedAt` are replaced by their rendered forms. */
export interface QueueRow
  extends Pick<QueueRequest, 'id' | 'requestorName' | 'requestorContext'> {
  itemSummary: string;
  submittedLabel: string;
  status: LiveStatus;
}

export interface QueueViewModel {
  pendingApprovalCount: number;
  inProcessingCount: number;
  lowStockAlertCount: number;
  /** Live requests before any search: tells "nothing to do" apart from
   *  "nothing matches" when `rows` is empty. */
  liveCount: number;
  /** Per chip, over the search matches. */
  chipCounts: Readonly<Record<QueueChip, number>>;
  /** Rows the selected chip and search match, across every page. */
  matchCount: number;
  /** The page actually shown, after clamping. */
  page: number;
  rows: readonly QueueRow[];
}
