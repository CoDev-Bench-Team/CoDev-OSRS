import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router';
import {
  Button,
  FilterChip,
  Notice,
  PageHeader,
  Pagination,
  Search,
  Select,
  StatusPill,
  SummaryCard,
  TableCard,
  TABLE_ROW_PADDING_CLASS,
  TableHead,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
} from '../../../shared/ui';
import { DESTINATIONS } from '../../../app/destinations';
import { buildQueueViewModel, NO_VALUE, updateQuery } from './queue-model';
import {
  INITIAL_QUERY,
  PAGE_SIZES,
  QUEUE_CHIPS,
  QUEUE_SORTS,
  type QueueQuery,
  type QueueSort,
  type QueueViewModel,
} from './queue-types';
import { adminRequestSource } from './admin-request-source';
import { RefusalAlert } from '../detail/RefusalAlert';
import { REQUEST_NOT_FOUND, useDeepLinkedRequest } from '../deep-link';
import { ReviewPanel } from './ReviewPanel';
import type { AdminRequestSource, ReviewSnapshot, TransitionResult } from './review-types';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; snapshot: ReviewSnapshot };

/** One source of truth for the grid. The header and the row cells read the
 *  same widths through the same `tableColumnStyle`, so a column cannot be
 *  widened or sized differently in one place and left behind in the other. */
const COLUMNS = {
  id: '200px',
  requester: '180px',
  items: undefined,
  status: '180px',
  submitted: '180px',
  action: '180px',
} as const satisfies Record<string, ColumnWidth | undefined>;

/** The floor the fluid ITEMS column keeps before its content starts
 *  truncating. */
const MIN_ITEMS_WIDTH = 120;

/** Derived from COLUMNS and the shared row gutter, never restated — see
 *  `tableMinWidth`, which also rejects a width that is not a sane pixel length. */
const TABLE_MIN_WIDTH = tableMinWidth(Object.values(COLUMNS), MIN_ITEMS_WIDTH);

/** `Select` hands back a plain string. Narrowed rather than cast, so a value
 *  outside QUEUE_SORTS can never reach the projection's comparator lookup. */
const isQueueSort = (value: string): value is QueueSort => (QUEUE_SORTS as readonly string[]).includes(value);

/** What a screen reader is told as the queue settles. The count is the page's
 *  whole point, so the settled announcement carries it rather than saying only
 *  that something changed. Annotated `: string` with no `default`, so adding a
 *  state without an announcement is a type error. */
function announce(state: LoadState, queue: QueueViewModel | null): string {
  switch (state.kind) {
    case 'loading':
      return 'Loading requests queue.';
    case 'failed':
      return 'The requests queue could not be loaded.';
    case 'loaded': {
      if (!queue || queue.liveCount === 0) return 'No requests are in the queue.';
      const shown = queue.matchCount;
      if (shown === 0) return 'No requests match the current filters.';
      return `${shown} request${shown === 1 ? '' : 's'} match. ${queue.pendingApprovalCount} awaiting approval.`;
    }
  }
}

export function QueuePage({
  /** Must be referentially stable — it is an effect dependency, so an object
   *  built inline in the caller's render would reload the queue on every
   *  render. Pass a module constant, or hold it in `useMemo`/a ref. */
  source: given,
}: {
  source?: AdminRequestSource;
}) {
  const { search } = useLocation();
  const source = useMemo(() => given ?? adminRequestSource(search), [given, search]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [query, setQuery] = useState<QueueQuery>(INITIAL_QUERY);
  /** The request open in the review panel. Component state, not an address:
   *  Review opens the panel over `/queue` and never navigates (spec 008
   *  FR-001, plan D10). */
  const [openId, setOpenId] = useState<string | null>(null);
  /** The request whose last change was saved but whose reload failed, so the
   *  panel is showing stale data for it. Tied to an id, so a late result from
   *  a panel already closed never warns about a different request. */
  const [staleId, setStaleId] = useState<string | null>(null);

  /** Set only by Try Again, so a successful FIRST load never steals focus from
   *  wherever the visitor already is. */
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

  /** A successful retry unmounts the failure notice, and with it the button the
   *  keyboard user was standing on — focus would fall to `<body>` and they
   *  would have to tab in from the top of the document to reach the queue they
   *  just asked for.
   *
   *  Focus goes to the status chips rather than the page header: the live
   *  region is already about to say how many requests are shown, and a page
   *  header carrying a title AND a subtitle would be read out on top of that.
   *  The chips' group has a short name and sits directly above the table. The
   *  queue frame draws no section heading to land on (spec 004, amendment 3). */
  useEffect(() => {
    if (state.kind !== 'loaded' || !retrying.current) return;
    retrying.current = false;
    recoveredFocus.current?.focus();
  }, [state]);

  /** Derived once here rather than inside the table, so the announcement and
   *  what is on screen are the same projection of the same snapshot. Memoised
   *  on the load state and the query, the projection's only inputs, so a render
   *  that changes neither does not re-sort a large snapshot. */
  const queue = useMemo(
    () => (state.kind === 'loaded' ? buildQueueViewModel(state.snapshot, query) : null),
    [state, query],
  );
  const change = (next: Partial<QueueQuery>) => setQuery((current) => updateQuery(current, next));

  /** Runs one transition, then reloads from the same source whatever the
   *  outcome, so the panel, rows, chips and cards are one snapshot (spec 008
   *  FR-013, plan D3). The reload never passes through `loading`: the current
   *  snapshot stays on screen, so the panel does not unmount, and the new one
   *  replaces it on success. If the reload fails, the old snapshot stays. A
   *  refusal that promised to show the current status then reports
   *  `unavailable` instead, because the panel can no longer show it. */
  const refresh = async () => {
    const snapshot = await source.load();
    setState({ kind: 'loaded', snapshot });
    setStaleId(null);
  };

  const transition = async (id: string, run: () => Promise<TransitionResult>): Promise<TransitionResult> => {
    const result = await run();
    try {
      await refresh();
      return result;
    } catch {
      // Once a change is saved but unseen, the warning stays until a reload
      // succeeds. A later refusal must not clear it.
      if (result.ok) setStaleId(id);
      return !result.ok && result.refusal === 'status-changed' ? { ok: false, refusal: 'unavailable' } : result;
    }
  };

  // `/requests/:id` lands here for an Admin and opens that request's panel. The
  // snapshot holds every request, terminal ones included, so a link to a
  // decided request opens it read-only.
  const allIds = useMemo(
    () => (state.kind === 'loaded' ? state.snapshot.requests.map((request) => request.id) : null),
    [state],
  );
  const { unavailable, dismiss } = useDeepLinkedRequest(allIds, setOpenId, REQUEST_NOT_FOUND);
  const review = (id: string) => {
    dismiss();
    setOpenId(id);
  };

  const openRequest =
    openId && state.kind === 'loaded' ? state.snapshot.requests.find((request) => request.id === openId) : undefined;

  const closePanel = () => {
    setOpenId(null);
    // The stale-data notice tells the Admin to close the panel to refresh, so
    // closing does. If this reload fails too, the request stays marked stale
    // and warns again when it is reopened.
    if (staleId) refresh().catch(() => {});
    // SidePanel returns focus to the Review that opened it. If that row has
    // left the queue (the request became terminal), the button is gone and
    // focus would fall to <body>. It goes to the chips instead, the queue's
    // existing recovery target (FR-002).
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) recoveredFocus.current?.focus();
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-32 py-32">

      {/* One region, mounted for the page's whole life, whose text changes as
          the queue settles. A live region inserted with its text already in
          place is routinely missed — only a change WITHIN an existing region
          announces reliably, and `loading` is the state the page opens in. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announce(state, queue)}
      </div>

      {state.kind === 'loading' ? (
        <Notice
          eyebrow="Loading"
          tone="info"
          title="Loading requests queue"
          body="Current request workload is being prepared."
        />
      ) : null}

      {state.kind === 'failed' ? (
        <Notice
          eyebrow="Unavailable"
          tone="stopped"
          title="Requests queue could not be loaded"
          body="Try again to retrieve the current request workload."
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

      {queue ? (
        <LoadedQueue queue={queue} query={query} onChange={change} focusRef={recoveredFocus} onReview={review} />
      ) : null}

      {openRequest ? (
        <ReviewPanel
          // A different request is a different panel: its form state, focus
          // and dialog start fresh, and nothing from the last one leaks in.
          key={openRequest.id}
          request={openRequest}
          pickupOffices={source.pickupOffices}
          reloadFailed={staleId === openRequest.id}
          onClose={closePanel}
          onApprove={(id) => transition(id, () => source.approve(id))}
          onReject={(id, reason) => transition(id, () => source.reject(id, reason))}
          onUpdateStatus={(id, to, pickup) => transition(id, () => source.updateStatus(id, to, pickup))}
        />
      ) : null}
    </div>
  );
}

function LoadedQueue({
  queue,
  query,
  onChange,
  focusRef,
  onReview,
}: {
  queue: QueueViewModel;
  query: QueueQuery;
  onChange: (change: Partial<QueueQuery>) => void;
  /** Where focus lands when a retry succeeds; see the effect that uses it. */
  focusRef: RefObject<HTMLDivElement | null>;
  /** Opens the review panel for a request (spec 008 FR-001). */
  onReview: (id: string) => void;
}) {
  return (
    /* Vertical rhythm from `02 - Requests Queue`: 14px under the header, 16px
       under the toolbar, 34px under the chips, 14px above the pagination. */
    <div className="flex min-w-0 flex-col">
      {/* The page title is the loaded state's `<h1>`. While a `Notice` is on
          screen it carries its own title heading, so rendering this header too
          would put two `<h1>`s in the document at once. */}
      <div className="flex flex-wrap items-start justify-between gap-16">
        <PageHeader title={DESTINATIONS.queue.title} subtitle={DESTINATIONS.queue.purpose} />
        <section
          className="grid w-full grid-cols-1 gap-16 sm:grid-cols-3 lg:w-auto lg:grid-cols-[repeat(3,262px)]"
          aria-label="Requests workload summary"
        >
          <SummaryCard value={String(queue.pendingApprovalCount)} label="Pending approval" size="compact" />
          <SummaryCard value={String(queue.inProcessingCount)} label="In Processing" tone="neutral" size="compact" />
          <SummaryCard value={String(queue.lowStockAlertCount)} label="Low stock alerts" tone="neutral" size="compact" />
        </section>
      </div>

      <div className="mt-14 flex flex-col gap-16 md:flex-row">
        <Search
          className="md:flex-1"
          aria-label="Search requests"
          /* The file has a double space after "ID,"; transcribed with one. */
          placeholder="Search by request ID, employee name, email, or item..."
          value={query.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
        <Select
          className="md:w-[210px]"
          label="Sort requests"
          value={query.sort}
          options={[...QUEUE_SORTS]}
          onChange={(sort) => {
            if (isQueueSort(sort)) onChange({ sort });
          }}
        />
      </div>

      <div
        ref={focusRef}
        tabIndex={-1}
        role="group"
        aria-label="Filter by status"
        className="mt-16 flex flex-wrap gap-10"
      >
        {QUEUE_CHIPS.map((chip) => (
          <FilterChip
            key={chip}
            label={chip}
            count={queue.chipCounts[chip]}
            selected={query.chip === chip}
            onSelect={() => onChange({ chip })}
          />
        ))}
      </div>

      {/* The card's `shadow-card` is offset 5px down over an 18px blur, so it
          paints ~4px above, ~14px below and ~9px either side of the card.
          `overflow-x-auto` computes the block axis to `auto` as well, so a
          scroll region wrapped tight around the card would clip that shadow
          on three sides. The padding gives the shadow room and the matching
          negative margins give the space back, keeping the card where the
          layout puts it. 9px of horizontal bleed is well inside the shell's
          32px gutter, so SC-006 still holds at 360px. */}
      <div
        role="region"
        aria-label="Requests table"
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
                ['SUBMITTED', COLUMNS.submitted],
                ['ACTION', COLUMNS.action],
              ]}
            />

            {queue.rows.length === 0 ? (
              <div className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                <p className="type-body text-ink-secondary">
                  {queue.liveCount === 0
                    ? 'No requests are in the queue.'
                    : 'No requests match the current search and status filter.'}
                </p>
              </div>
            ) : (
              queue.rows.map((request) => (
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
                    /* The full summary is worth a tooltip; the em dash that
                       stands in for "no items" is not — it would hover the
                       same character the cell already shows. */
                    title={request.itemSummary === NO_VALUE ? undefined : request.itemSummary}
                  >
                    {request.itemSummary}
                  </span>
                  <span style={tableColumnStyle(COLUMNS.status)} className="flex items-center">
                    <StatusPill status={request.status} />
                  </span>
                  <span style={tableColumnStyle(COLUMNS.submitted)} className="type-ui text-ink-secondary">
                    {request.submittedLabel}
                  </span>
                  <span style={tableColumnStyle(COLUMNS.action)} className="flex items-center">
                    {/* Opens the review panel over the queue; the address and
                        the query stay as they are (spec 008 FR-001, FR-002). */}
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
          label="Requests queue pages"
          page={queue.page}
          pageSize={query.pageSize}
          total={queue.matchCount}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={(page) => onChange({ page })}
          onPageSizeChange={(pageSize) => onChange({ pageSize })}
        />
      </div>
    </div>
  );
}
