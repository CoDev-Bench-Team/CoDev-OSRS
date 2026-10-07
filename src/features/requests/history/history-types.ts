import type { RequestStatus } from '../../../shared/ui';
import { QUEUE_SORTS, type QueueRow, type QueueSort } from '../queue/queue-types';
import { DEFAULT_PAGE_SIZE } from '../../../shared/page-size-preference';

/** The statuses History lists, in the order the file draws their chips:
 *  `All requests · Completed · Cancelled · Rejected` (`04 - History`). The
 *  terminal statuses of constitution IV; `Received` is live and stays on the
 *  Requests Queue (spec 013 FR-002). */
export const TERMINAL_STATUSES = ['Completed', 'Cancelled', 'Rejected'] as const satisfies readonly RequestStatus[];
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export type HistoryChip = 'All requests' | TerminalStatus;
export const HISTORY_CHIPS: readonly HistoryChip[] = ['All requests', ...TERMINAL_STATUSES];

/** The queue's drawn sort menu (`02.1`); the date orders read the resolved
 *  time (spec 013 FR-006). */
export const HISTORY_SORTS = QUEUE_SORTS;
export type HistorySort = QueueSort;

/** Chip, search, sort and page as one value. */
export interface HistoryQuery {
  chip: HistoryChip;
  search: string;
  sort: HistorySort;
  /** 1-based. May run past the last page; the projection clamps it. */
  page: number;
  pageSize: number;
}

export const INITIAL_HISTORY_QUERY: HistoryQuery = {
  chip: 'All requests',
  search: '',
  sort: 'Newest First',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/** A row: the identity fields as the queue carries them, the rendered items
 *  and resolved date, and the terminal status. */
export interface HistoryRow extends Pick<QueueRow, 'id' | 'displayId' | 'requestorName' | 'requestorContext' | 'itemSummary'> {
  resolvedLabel: string;
  status: TerminalStatus;
}

export interface HistoryViewModel {
  /** Resolved requests before any search: tells "nothing resolved yet" apart
   *  from "nothing matches" when `rows` is empty. */
  resolvedCount: number;
  /** Per chip, over the search matches (spec 013 FR-004). */
  chipCounts: Readonly<Record<HistoryChip, number>>;
  /** Rows the selected chip and search match, across every page. */
  matchCount: number;
  /** The page actually shown, after clamping. */
  page: number;
  rows: readonly HistoryRow[];
}

/** The table's part of the view model: what one page read answers. */
export type HistoryTable = Pick<HistoryViewModel, 'matchCount' | 'page' | 'rows'>;

/** The counts' part: the chips, and whether anything is resolved at all.
 *  Read in parallel beside the rows, so the table never waits on them
 *  (FR-055). */
export type HistoryCounts = Omit<HistoryViewModel, keyof HistoryTable>;
