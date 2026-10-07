import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router';
import {
  Button,
  EmptyState,
  FilterChip,
  Notice,
  PageHeader,
  Pagination,
  Search,
  SkeletonRegion,
  SkeletonRows,
  Select,
  StatusPill,
  TableCard,
  TABLE_ROW_PADDING_CLASS,
  TableHead,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
} from '../../../shared/ui';
import { DESTINATIONS } from '../../../app/destinations';
import { useSessionReady } from '../../auth/session-context';
import { RefusalAlert } from '../detail/RefusalAlert';
import { REQUEST_NOT_FOUND, useDeepLinkedRequest, type DeepLinkState } from '../deep-link';
import { requestLabel } from '../detail/request-detail-types';
import { useLinkedRequest, useOpenRequest, useSettledQuery } from '../paged-source';
import { CountsUnavailable } from '../CountsUnavailable';
import { isNothingAtAll, startCounts, usePageCounts, type CountsRead } from '../page-counts';
import { addressedQuery, useRequestAddress } from '../request-address';
import { NO_VALUE } from '../format';
import { updateQuery } from '../list-query';
import { PAGE_SIZES } from '../queue/queue-types';
import type { ReviewRequest } from '../queue/review-types';
import { isResolved } from './history-model';
import { historySource, type HistorySource } from './history-source';
import {
  HISTORY_CHIPS,
  HISTORY_SORTS,
  INITIAL_HISTORY_QUERY,
  type HistoryQuery,
  type HistorySort,
  type HistoryCounts,
  type HistoryTable,
} from './history-types';
import { HistoryPanel } from './HistoryPanel';
import { readPageSize, savePageSize } from '../../../shared/page-size-preference';

/** The Admin's History (BEN-144, spec 013; frame `04 - History`): every
 *  resolved request across all requestors, in the Requests Queue's table
 *  geometry, with a read-only panel. Nothing here changes a request: the
 *  source it holds can only load (plan D1). */

/** `history` is the API's answer to the current query; `requests` are the
 *  rows behind it, for the panel (spec 017 plan D1). */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; history: HistoryTable; requests: readonly ReviewRequest[] };

async function loadHistory(source: HistorySource, query: HistoryQuery): Promise<Extract<LoadState, { kind: 'loaded' }>> {
  const { history, requests } = await source.page(query);
  return { kind: 'loaded', history, requests };
}

/** The queue's widths, RESOLVED in place of SUBMITTED, so the two tables read
 *  as one system (plan D5). */
const COLUMNS = {
  id: '200px',
  requester: '180px',
  items: undefined,
  status: '180px',
  resolved: '180px',
  action: '180px',
} as const satisfies Record<string, ColumnWidth | undefined>;

const MIN_ITEMS_WIDTH = 120;
const TABLE_MIN_WIDTH = tableMinWidth(Object.values(COLUMNS), MIN_ITEMS_WIDTH);

const isHistorySort = (value: string): value is HistorySort => (HISTORY_SORTS as readonly string[]).includes(value);

/** What a screen reader is told as History settles. The skeleton table
 *  announces itself; the failure `Notice` does not, so it is said here, as on
 *  the queue. */
function announce(state: LoadState, history: HistoryTable | null, nothingResolved: boolean): string {
  if (state.kind === 'failed') return 'History could not be loaded.';
  if (!history) return '';
  if (nothingResolved) return 'No requests have been resolved yet.';
  const shown = history.matchCount;
  if (shown === 0) return 'No resolved requests match the current filters.';
  return `${shown} resolved request${shown === 1 ? ' matches' : 's match'}.`;
}

export function HistoryPage({
  /** Must be referentially stable; it is an effect dependency. */
  source: given,
}: {
  source?: HistorySource;
}) {
  const { state: navigation, search: address } = useLocation();
  const source = useMemo(() => given ?? historySource(), [given]);
  const ready = useSessionReady();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [query, setQuery] = useState<HistoryQuery>(() => ({
    ...INITIAL_HISTORY_QUERY,
    ...addressedQuery(address),
    pageSize: readPageSize('history', PAGE_SIZES),
  }));
  const asked = useSettledQuery(query, true);
  /** The query the table on screen answers. While it differs from the one
   *  asked, the next page is in flight and the table says so (spec 017). */
  const [answered, setAnswered] = useState<HistoryQuery | null>(null);
  /** The newest counts read, started beside each rows read and published at
   *  once, so the chips are drawn when the counts arrive, not the rows. */
  const [countsRead, setCountsRead] = useState<CountsRead<HistoryCounts> | null>(null);
  /** The request open in the panel. Component state, not an address (spec 013
   *  Clarifications). */
  const [openId, setOpenId] = useState<string | null>(null);

  const retrying = useRef(false);
  const recoveredFocus = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (active) setCountsRead(startCounts(() => source.counts(asked), asked.search));
        return loadHistory(source, asked);
      })
      .then((loaded) => {
        if (!active) return;
        setState(loaded);
        setAnswered(asked);
      })
      .catch(() => {
        if (active) setState({ kind: 'failed' });
      });
    return () => {
      active = false;
    };
  }, [attempt, source, asked, ready]);

  /** A successful retry unmounts the button the keyboard user was on. Focus
   *  goes to the chips, as on the queue. */
  useEffect(() => {
    if (state.kind !== 'loaded' || !retrying.current) return;
    retrying.current = false;
    recoveredFocus.current?.focus();
  }, [state]);

  const history = useMemo(
    () => (state.kind === 'loaded' ? state.history : null),
    [state],
  );
  /** The chip counts, read beside the rows and drawn when they arrive;
   *  neither waits on the other. */
  const { counts, search: countedSearch, failed: countsFailed } = usePageCounts(countsRead);
  /** The chip counts for the search being asked; `null` while they load. */
  const shownChipCounts = countedSearch === asked.search ? (counts?.chipCounts ?? null) : null;
  /** Reads the counts again on their own, after a failed counts read. */
  const retryCounts = () => setCountsRead(startCounts(() => source.counts(asked), asked.search));
  // Nothing at all is resolved: "nothing yet", not "nothing matches".
  const nothingResolved = isNothingAtAll(counts?.resolvedCount, history, answered);
  const change = (next: Partial<HistoryQuery>) => {
    if (next.pageSize !== undefined) savePageSize('history', next.pageSize);
    setQuery((current) => updateQuery(current, next));
  };
  // Search and sort live in the address too (`?search=&sort=`).
  useRequestAddress(query, change);

  /** `/requests/:id` for a resolved request lands here, forwarded by the queue
   *  (spec 013 FR-016, plan D14). Only resolved requests can open. */
  // Read once the session is known, as the list is.
  const fetched = useLinkedRequest(source, ready ? (navigation as DeepLinkState | null)?.openRequest : undefined);
  const known = useMemo(
    (): readonly ReviewRequest[] | null =>
      state.kind !== 'loaded' || fetched === 'pending'
        ? null
        : fetched
          ? [...state.requests, fetched]
          : state.requests,
    [state, fetched],
  );
  const resolvedIds = useMemo(
    () =>
      known
        ? known.filter(isResolved).flatMap((request) => (request.displayId ? [request.id, request.displayId] : [request.id]))
        : null,
    [known],
  );
  const { linked, unavailable, dismiss } = useDeepLinkedRequest(resolvedIds, REQUEST_NOT_FOUND);
  const review = (id: string) => {
    dismiss();
    setOpenId(id);
  };

  const shownId = openId ?? linked;
  const listed = shownId ? known?.find((r) => r.id === shownId || r.displayId === shownId) : undefined;
  const found = useOpenRequest(source, shownId, listed);
  const openRequest = found && isResolved(found) ? found : undefined;

  const closePanel = () => {
    setOpenId(null);
    dismiss();
    // SidePanel returns focus to the Review that opened it. A deep-linked
    // panel was opened by no Review on this page, so focus goes to the chips.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) recoveredFocus.current?.focus();
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-32 py-32">
      <div role="status" aria-live="polite" className="sr-only">
        {announce(state, history, nothingResolved)}
      </div>

      {state.kind === 'failed' ? (
        <Notice
          eyebrow="Unavailable"
          tone="stopped"
          title="History could not be loaded"
          body="Nothing has changed. Try again to retrieve resolved requests."
          actions={
            <Button
              onClick={() => {
                retrying.current = true;
                setState({ kind: 'loading' });
                setAttempt((current) => current + 1);
              }}
            >
              Try Again
            </Button>
          }
        />
      ) : null}

      {unavailable ? <RefusalAlert messages={[unavailable]} /> : null}

      {/* The page keeps its layout while the first page loads: chips, table
          and pager stand in place, drawn as skeletons until it arrives. */}
      {state.kind !== 'failed' ? (
        <LoadedHistory
          history={history}
          chipCounts={shownChipCounts}
          onRetryCounts={countsFailed && !shownChipCounts ? retryCounts : undefined}
          nothingResolved={nothingResolved}
          busy={state.kind === 'loaded' && answered !== asked}
          query={query}
          onChange={change}
          focusRef={recoveredFocus}
          onReview={review}
        />
      ) : null}

      {openRequest ? <HistoryPanel key={openRequest.id} request={openRequest} onClose={closePanel} /> : null}
    </div>
  );
}

/** The table's rows while the first page loads, cell for cell. */
const ROW_SKELETON = [
  [COLUMNS.id, 'id'],
  [COLUMNS.requester, 'stack'],
  [COLUMNS.items, 'text'],
  [COLUMNS.status, 'request-pill'],
  [COLUMNS.resolved, 'date'],
  [COLUMNS.action, 'button'],
] as const;

function LoadedHistory({
  history,
  chipCounts,
  onRetryCounts,
  nothingResolved,
  busy,
  query,
  onChange,
  focusRef,
  onReview,
}: {
  /** The next page is in flight. */
  busy: boolean;
  /** `null` until the first answer arrives: the data is drawn as skeletons. */
  history: HistoryTable | null;
  /** The chip counts for the search on screen; `null` while they load. */
  chipCounts: HistoryCounts['chipCounts'] | null;
  /** Set when the counts read failed and none are shown: the page says so
   *  and offers to read them again. */
  onRetryCounts?: () => void;
  /** Nothing is resolved at all, so an empty table says so. */
  nothingResolved: boolean;
  query: HistoryQuery;
  onChange: (change: Partial<HistoryQuery>) => void;
  focusRef: RefObject<HTMLDivElement | null>;
  onReview: (id: string) => void;
}) {
  return (
    /* The queue's vertical rhythm: 14px under the header, 16px under the
       toolbar, 30px under the chips, 34px above the pagination. */
    <div className="flex min-w-0 flex-col">
      <PageHeader title={DESTINATIONS.history.title} subtitle={DESTINATIONS.history.purpose} />

      <div className="mt-14 flex flex-col gap-16 md:flex-row">
        <Search
          className="md:flex-1"
          aria-label="Search history"
          /* The file has a double space after "ID,"; transcribed with one, as
             on the queue. */
          placeholder="Search by request ID, employee name, email, or item..."
          value={query.search}
          onChange={(e) => onChange({ search: e.target.value })}
          onClear={() => onChange({ search: '' })}
        />
        <Select
          className="md:w-[210px]"
          label="Sort history"
          value={query.sort}
          options={[...HISTORY_SORTS]}
          onChange={(sort) => {
            if (isHistorySort(sort)) onChange({ sort });
          }}
        />
      </div>

      <div ref={focusRef} tabIndex={-1} role="group" aria-label="Filter by status" className="mt-16 flex flex-wrap gap-10">
        {HISTORY_CHIPS.map((chip) => (
          <FilterChip
            key={chip}
            label={chip}
            count={chipCounts?.[chip] ?? 0}
            loading={!chipCounts}
            selected={query.chip === chip}
            onSelect={() => onChange({ chip })}
          />
        ))}
      </div>
      {onRetryCounts ? <CountsUnavailable onRetry={onRetryCounts} /> : null}

      {/* Padding and negative margins give the card's shadow room inside the
          scroll region, as on the queue. */}
      <div
        role="region"
        aria-label="History table"
        tabIndex={0}
        className="-mx-9 mt-[30px] -mb-14 min-w-0 overflow-x-auto px-9 pt-4 pb-14"
      >
        <div style={{ minWidth: TABLE_MIN_WIDTH }}>
          <TableCard busy={busy}>
            <TableHead
              cols={[
                ['REQUEST ID', COLUMNS.id],
                ['REQUESTER', COLUMNS.requester],
                ['ITEMS', COLUMNS.items],
                ['STATUS', COLUMNS.status],
                ['RESOLVED', COLUMNS.resolved],
                ['ACTION', COLUMNS.action],
              ]}
            />

            {/* An empty page while the next is in flight answers the previous
                query, so its empty message would describe the wrong filter. */}
            {!history || (busy && history.rows.length === 0) ? (
              <SkeletonRegion label="Loading history">
                <SkeletonRows columns={ROW_SKELETON} rowClassName="min-h-row-height-request border-t border-line-default py-18" />
              </SkeletonRegion>
            ) : history.rows.length === 0 ? (
              <div className="border-t border-line-default">
                <EmptyState
                  label={
                    nothingResolved
                      ? 'No requests have been resolved yet.'
                      : 'No resolved requests match the current search and status filter.'
                  }
                />
              </div>
            ) : (
              history.rows.map((request) => (
                <div
                  key={request.id}
                  className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}
                >
                  <span style={tableColumnStyle(COLUMNS.id)} className="type-ui-bold text-ink-primary">
                    {requestLabel(request)}
                  </span>
                  <span style={tableColumnStyle(COLUMNS.requester)} className="flex flex-col gap-4 pr-12">
                    <span className="truncate type-ui text-ink-primary">{request.requestorName}</span>
                    {request.requestorContext ? (
                      <span className="truncate type-meta text-ink-secondary">{request.requestorContext}</span>
                    ) : null}
                  </span>
                  <span
                    style={tableColumnStyle(COLUMNS.items)}
                    className="truncate pr-12 type-ui text-ink-primary"
                    title={request.itemSummary === NO_VALUE ? undefined : request.itemSummary}
                  >
                    {request.itemSummary}
                  </span>
                  <span style={tableColumnStyle(COLUMNS.status)} className="flex items-center">
                    <StatusPill status={request.status} />
                  </span>
                  <span style={tableColumnStyle(COLUMNS.resolved)} className="type-ui text-ink-secondary">
                    {request.resolvedLabel}
                  </span>
                  <span style={tableColumnStyle(COLUMNS.action)} className="flex items-center">
                    {/* Opens the read-only panel; the drawn label (spec 013 H1). */}
                    <Button aria-label={`Review request ${requestLabel(request)}`} onClick={() => onReview(request.id)}>
                      Review
                    </Button>
                  </span>
                </div>
              ))
            )}
          </TableCard>
        </div>
      </div>

      <div className="mt-[34px]">
        <Pagination
          label="History pages"
          hidden={!history || busy}
          page={history?.page ?? 1}
          pageSize={query.pageSize}
          total={history?.matchCount ?? 0}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={(page) => onChange({ page })}
          onPageSizeChange={(pageSize) => onChange({ pageSize })}
        />
      </div>
    </div>
  );
}
