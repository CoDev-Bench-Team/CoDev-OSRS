import type { RequestStatus } from '../../../shared/ui';
import { DEFAULT_PAGE_SIZE } from '../../../shared/page-size-preference';

/** A feature-local read model, not a backend response shape. */
export interface QueueRequest {
  /** The key the source acts on: the API's numeric id, as a string (spec 017
   *  FR-005). */
  id: string;
  /** `REQ-…`, when it differs from `id`. Read it through `requestLabel`. */
  displayId?: string;
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
}

/** The statuses the queue lists. Terminal ones — `Rejected`, `Cancelled`,
 *  `Completed` — belong to History (spec 001 FR-016a). `Received` is live: it
 *  waits on the Employee's Accountability Form and then the Admin's Complete
 *  (spec 004 amendment 5). An Admin or the owning Employee marks a handed-over
 *  request `Received`; signing the form changes no status (constitution 7.0.0
 *  IV, ADR-0011). */
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

/** Each order as the address writes it (`?sort=`). The default, Newest
 *  First, is left out of the address. */
export const SORT_PARAM: Record<QueueSort, string> = {
  'Newest First': '',
  'Oldest First': 'oldest',
  'Employee (A-Z)': 'employee',
};

/** The order an address's `sort` names; anything else is the default. */
export function sortFromParam(value: string): QueueSort {
  return QUEUE_SORTS.find((sort) => SORT_PARAM[sort] === value) ?? 'Newest First';
}

/** The fields a request table keeps in its address (`?search=&sort=`). */
export const ADDRESS_FIELDS = ['search', 'sort'] as const;

/** The sizes offered. The default is 10, and the visitor's choice is
 *  remembered (`shared/page-size-preference.ts`). */
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
  pageSize: DEFAULT_PAGE_SIZE,
};

/** A row is a projection of a request: the identity fields are carried over
 *  as-is (typed off the source so they cannot drift), and the display-only
 *  `items`/`submittedAt` are replaced by their rendered forms. */
export interface QueueRow
  extends Pick<QueueRequest, 'id' | 'displayId' | 'requestorName' | 'requestorContext'> {
  itemSummary: string;
  submittedLabel: string;
  status: LiveStatus;
}

export interface QueueViewModel {
  pendingApprovalCount: number;
  inProcessingCount: number;
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

/** The table's part of the view model: what one page read answers. */
export type QueueTable = Pick<QueueViewModel, 'matchCount' | 'page' | 'rows'>;

/** The counts' part: the summary cards, the chips, and whether anything is
 *  live at all. Read in parallel beside the rows, so the table never waits
 *  on them (FR-055). */
export type QueueCounts = Omit<QueueViewModel, keyof QueueTable>;
