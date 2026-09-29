import type { RequestStatus } from '../../../shared/ui';
import type { QueueRow } from '../queue/queue-types';

/** The statuses History lists, in the order the file draws their chips:
 *  `All requests · Completed · Cancelled · Rejected` (`04 - History`). The
 *  terminal statuses of constitution IV; `Received` is live and stays on the
 *  Requests Queue (spec 012 FR-002). */
export const TERMINAL_STATUSES = ['Completed', 'Cancelled', 'Rejected'] as const satisfies readonly RequestStatus[];
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export type HistoryChip = 'All requests' | TerminalStatus;
export const HISTORY_CHIPS: readonly HistoryChip[] = ['All requests', ...TERMINAL_STATUSES];

/** The queue's drawn sort menu (`02.1`); the date orders read the resolved
 *  time (spec 012 FR-006). */
export const HISTORY_SORTS = ['Newest First', 'Oldest First', 'Employee (A-Z)'] as const;
export type HistorySort = (typeof HISTORY_SORTS)[number];

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
  pageSize: 50,
};

/** A row: the identity fields as the queue carries them, the rendered items
 *  and resolved date, and the terminal status. */
export interface HistoryRow extends Pick<QueueRow, 'id' | 'requestorName' | 'requestorContext' | 'itemSummary'> {
  resolvedLabel: string;
  status: TerminalStatus;
}

export interface HistoryViewModel {
  /** Resolved requests before any search: tells "nothing resolved yet" apart
   *  from "nothing matches" when `rows` is empty. */
  resolvedCount: number;
  /** Per chip, over the search matches (spec 012 FR-004). */
  chipCounts: Readonly<Record<HistoryChip, number>>;
  /** Rows the selected chip and search match, across every page. */
  matchCount: number;
  /** The page actually shown, after clamping. */
  page: number;
  rows: readonly HistoryRow[];
}
