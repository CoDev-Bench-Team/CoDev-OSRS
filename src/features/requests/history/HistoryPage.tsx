import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router';
import {
  Button,
  FilterChip,
  LoadingState,
  Notice,
  PageHeader,
  Pagination,
  Search,
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
import { RefusalAlert } from '../detail/RefusalAlert';
import { REQUEST_NOT_FOUND, useDeepLinkedRequest } from '../deep-link';
import { NO_VALUE } from '../format';
import { updateQuery } from '../list-query';
import { PAGE_SIZES } from '../queue/queue-types';
import type { ReviewSnapshot } from '../queue/review-types';
import { buildHistoryViewModel, isResolved } from './history-model';
import { historySource, type HistorySource } from './history-source';
import {
  HISTORY_CHIPS,
  HISTORY_SORTS,
  INITIAL_HISTORY_QUERY,
  type HistoryQuery,
  type HistorySort,
  type HistoryViewModel,
} from './history-types';
import { HistoryPanel } from './HistoryPanel';

/** The Admin's History (BEN-144, spec 012; frame `04 - History`): every
 *  resolved request across all requestors, in the Requests Queue's table
 *  geometry, with a read-only panel. Nothing here changes a request: the
 *  source it holds can only load (plan D1). */

type LoadState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; snapshot: ReviewSnapshot };

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

/** What a screen reader is told as History settles. `LoadingState` announces
 *  itself; the failure `Notice` does not, so it is said here, as on the queue. */
function announce(state: LoadState, history: HistoryViewModel | null): string {
  if (state.kind === 'failed') return 'History could not be loaded.';
  if (!history) return '';
  if (history.resolvedCount === 0) return 'No requests have been resolved yet.';
  const shown = history.matchCount;
  if (shown === 0) return 'No resolved requests match the current filters.';
  return `${shown} resolved request${shown === 1 ? '' : 's'} match.`;
}

export function HistoryPage({
  /** Must be referentially stable; it is an effect dependency. */
  source: given,
}: {
  source?: HistorySource;
}) {
  const { search } = useLocation();
  const source = useMemo(() => given ?? historySource(search), [given, search]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [query, setQuery] = useState<HistoryQuery>(INITIAL_HISTORY_QUERY);
  /** The request open in the panel. Component state, not an address (spec 012
   *  Clarifications). */
  const [openId, setOpenId] = useState<string | null>(null);

  const retrying = useRef(false);
  const recoveredFocus = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => source.load())
      .then((snapshot) => {
        if (active) setState({ kind: 'loaded', snapshot });
      })
      .catch(() => {
        if (active) setState({ kind: 'failed' });
      });
    return () => {
      active = false;
    };
  }, [attempt, source]);

  /** A successful retry unmounts the button the keyboard user was on. Focus
   *  goes to the chips, as on the queue. */
  useEffect(() => {
    if (state.kind !== 'loaded' || !retrying.current) return;
    retrying.current = false;
    recoveredFocus.current?.focus();
  }, [state]);

  const history = useMemo(
    () => (state.kind === 'loaded' ? buildHistoryViewModel(state.snapshot, query) : null),
    [state, query],
  );
  const change = (next: Partial<HistoryQuery>) => setQuery((current) => updateQuery(current, next));

  /** `/requests/:id` for a resolved request lands here, forwarded by the queue
   *  (spec 012 FR-016, plan D14). Only resolved requests can open. */
  const resolvedIds = useMemo(
    () => (state.kind === 'loaded' ? state.snapshot.requests.filter(isResolved).map((request) => request.id) : null),
    [state],
  );
  const { unavailable, dismiss } = useDeepLinkedRequest(resolvedIds, setOpenId, REQUEST_NOT_FOUND);
  const review = (id: string) => {
    dismiss();
    setOpenId(id);
  };

  const found = openId && state.kind === 'loaded' ? state.snapshot.requests.find((r) => r.id === openId) : undefined;
  const openRequest = found && isResolved(found) ? found : undefined;

  const closePanel = () => {
    setOpenId(null);
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
        {announce(state, history)}
      </div>

      {state.kind === 'loading' ? <LoadingState label="Loading history" /> : null}

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

      {history ? (
        <LoadedHistory history={history} query={query} onChange={change} focusRef={recoveredFocus} onReview={review} />
      ) : null}

      {openRequest ? <HistoryPanel key={openRequest.id} request={openRequest} onClose={closePanel} /> : null}
    </div>
  );
}

function LoadedHistory({
  history,
  query,
  onChange,
  focusRef,
  onReview,
}: {
  history: HistoryViewModel;
  query: HistoryQuery;
  onChange: (change: Partial<HistoryQuery>) => void;
  focusRef: RefObject<HTMLDivElement | null>;
  onReview: (id: string) => void;
}) {
  return (
    /* The queue's vertical rhythm: 14px under the header, 16px under the
       toolbar, 30px under the chips, 14px above the pagination. */
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
            count={history.chipCounts[chip]}
            selected={query.chip === chip}
            onSelect={() => onChange({ chip })}
          />
        ))}
      </div>

      {/* Padding and negative margins give the card's shadow room inside the
          scroll region, as on the queue. */}
      <div
        role="region"
        aria-label="History table"
        tabIndex={0}
        className="-mx-9 mt-[30px] -mb-14 min-w-0 overflow-x-auto px-9 pt-4 pb-14"
      >
        <div style={{ minWidth: TABLE_MIN_WIDTH }}>
          <TableCard>
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

            {history.rows.length === 0 ? (
              <div className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                <p className="type-body text-ink-secondary">
                  {history.resolvedCount === 0
                    ? 'No requests have been resolved yet.'
                    : 'No resolved requests match the current search and status filter.'}
                </p>
              </div>
            ) : (
              history.rows.map((request) => (
                <div
                  key={request.id}
                  className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}
                >
                  <span style={tableColumnStyle(COLUMNS.id)} className="type-ui-bold text-ink-primary">
                    {request.id}
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
                    {/* Opens the read-only panel; the drawn label (spec 012 H1). */}
                    <Button aria-label={`Review request ${request.id}`} onClick={() => onReview(request.id)}>
                      Review
                    </Button>
                  </span>
                </div>
              ))
            )}
          </TableCard>
        </div>
      </div>

      <div className="mt-14">
        <Pagination
          label="History pages"
          page={history.page}
          pageSize={query.pageSize}
          total={history.matchCount}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={(page) => onChange({ page })}
          onPageSizeChange={(pageSize) => onChange({ pageSize })}
        />
      </div>
    </div>
  );
}
