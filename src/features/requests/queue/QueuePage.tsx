import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  ArrowCounterClockwise,
  Button,
  EmptyState,
  usePanelTask,
  type TaskCopy,
  FilterChip,
  Notice,
  PageHeader,
  Pagination,
  Search,
  SkeletonRows,
  Select,
  StatusPill,
  SummaryCard,
  TableCard,
  TABLE_ROW_PADDING_CLASS,
  TableHead,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
  useToast,
} from '../../../shared/ui';
import { DESTINATIONS, queueRequestPath } from '../../../app/destinations';
import { useSessionReady } from '../../auth/session-context';
import { NO_VALUE } from './queue-model';
import { updateQuery } from '../list-query';
import {
  INITIAL_QUERY,
  PAGE_SIZES,
  QUEUE_CHIPS,
  QUEUE_SORTS,
  type QueueQuery,
  type QueueSort,
  type QueueCounts,
  type QueueTable,
} from './queue-types';
import { adminRequestSource } from './admin-request-source';
import { RefusalAlert } from '../detail/RefusalAlert';
import { REQUEST_NOT_FOUND, useDeepLinkedRequest, type DeepLinkState } from '../deep-link';
import { ReviewPanel, type PanelNotice, type PendingAction } from './ReviewPanel';
import { isResolved } from '../history/history-model';
import {
  LOCATION_REQUIRED,
  type AdminRequestSource,
  type QueuePageResult,
  type ReviewRefusal,
  type ReviewRequest,
  type TransitionResult,
  type UpdateStatusTarget,
} from './review-types';
import { requestLabel } from '../detail/request-detail-types';
import { useLinkedRequest, useOpenRequest, useSettledQuery } from '../paged-source';
import { CountsUnavailable } from '../CountsUnavailable';
import { isNothingAtAll, startCounts, usePageCounts, type CountsRead } from '../page-counts';
import { addressedQuery, useRequestAddress } from '../request-address';
import { readPageSize, savePageSize } from '../../../shared/page-size-preference';

/** `queue` is the API's answer to the current query; `requests` are the rows
 *  behind it, for the panel (spec 017 plan D1). */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; queue: QueueTable; requests: readonly ReviewRequest[] };

async function loadQueue(source: AdminRequestSource, query: QueueQuery): Promise<Extract<LoadState, { kind: 'loaded' }>> {
  const result: QueuePageResult = await source.page(query);
  return { kind: 'loaded', queue: result.queue, requests: result.requests };
}



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
function announce(
  state: LoadState,
  queue: QueueTable | null,
  counts: QueueCounts | null,
  /** The live requests the chip and search match, once the counts say. */
  liveMatches: number | null,
  nothingLive: boolean,
): string {
  switch (state.kind) {
    case 'loading':
      return 'Loading requests queue.';
    case 'failed':
      return 'The requests queue could not be loaded.';
    case 'loaded': {
      if (!queue || nothingLive) return 'No requests are in the queue.';
      // *All requests* lists resolved requests in the list's total too (plan
      // D5, contracts C14): the live count is said once the counts know it.
      const shown = liveMatches ?? queue.matchCount;
      if (shown === 0) return 'No requests match the current filters.';
      const matched = `${shown} request${shown === 1 ? '' : 's'} match.`;
      return counts ? `${matched} ${counts.pendingApprovalCount} awaiting approval.` : matched;
    }
  }
}

/** What a toast says as one review action runs and ends. */
type ActionCopy = {
  loading: (label: string) => string;
  done: (label: string) => string;
  failed: (label: string) => string;
  /** Under a success: who hears about it. */
  email: string;
};

const DECISION_EMAIL = 'The employee will receive an email with your decision.';
const CHANGE_EMAIL = 'The employee will receive an email about the change.';

const ACTION_COPY = {
  approve: {
    loading: (l) => `Approving ${l}…`,
    done: (l) => `${l} approved`,
    failed: (l) => `${l} could not be approved`,
    email: DECISION_EMAIL,
  },
  reject: {
    loading: (l) => `Rejecting ${l}…`,
    done: (l) => `${l} rejected`,
    failed: (l) => `${l} could not be rejected`,
    email: DECISION_EMAIL,
  },
  cancel: {
    loading: (l) => `Cancelling ${l}…`,
    done: (l) => `${l} cancelled`,
    failed: (l) => `${l} could not be cancelled`,
    email: CHANGE_EMAIL,
  },
  complete: {
    loading: (l) => `Completing ${l}…`,
    done: (l) => `${l} completed`,
    failed: (l) => `${l} could not be completed`,
    email: CHANGE_EMAIL,
  },
} satisfies Record<string, ActionCopy>;

/** A refused transition, carried through `usePanelTask` as its failure. */
class Refused extends Error {
  readonly refusal: ReviewRefusal;
  constructor(refusal: ReviewRefusal) {
    super(refusal);
    this.refusal = refusal;
  }
}

const updateCopy = (to: UpdateStatusTarget): ActionCopy => ({
  loading: (l) => `Updating ${l} to ${to}…`,
  done: (l) => `${l} is now ${to}`,
  failed: (l) => `${l} could not be updated to ${to}`,
  email: CHANGE_EMAIL,
});

/** Why a toast says an action failed. Nothing was changed in any of them. */
const REFUSAL_COPY: Record<ReviewRefusal, string> = {
  'status-changed': 'It was updated while you were viewing it. Its current status is shown in the queue.',
  'reason-required': 'A reason is required. Nothing was changed.',
  'location-required': `${LOCATION_REQUIRED} Nothing was changed.`,
  unavailable: 'Nothing was changed. Try again.',
};

/** The queue snapshot: loaded for the asked query once the session is
 *  known, kept on screen while the next one loads, and reloaded after every
 *  transition. */
function useQueueSnapshot(source: AdminRequestSource, asked: QueueQuery, ready: boolean) {
  const latestAsked = useRef(asked);
  useLayoutEffect(() => {
    latestAsked.current = asked;
  }, [asked]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  /** The query the table on screen answers. While it differs from the one
   *  asked, the next page is in flight and the table says so (spec 017). */
  const [answered, setAnswered] = useState<QueueQuery | null>(null);
  /** The request whose last change was saved but whose reload failed, so the
   *  panel is showing stale data for it. Tied to an id, so a late result from
   *  a panel already closed never warns about a different request. */
  const [staleId, setStaleId] = useState<string | null>(null);
  /** One count for every load, the page's and an action's reload alike: only
   *  the newest started is applied, so an older read never puts back rows
   *  from before an action. */
  const loads = useRef(0);
  /** The newest counts read. Each load starts one beside its rows read and
   *  publishes it at once, so the cards and chips are drawn when the counts
   *  arrive, not when the rows do. */
  const [countsRead, setCountsRead] = useState<CountsRead<QueueCounts> | null>(null);
  const readCounts = useCallback(
    (query: QueueQuery, fresh = false) =>
      setCountsRead(startCounts(() => source.counts(query, { fresh }), query.search)),
    [source],
  );

  // Every query is asked of the API; the current page stays on screen while
  // the next one is asked.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const mine = ++loads.current;

    void Promise.resolve()
      .then(() => {
        if (active) readCounts(asked);
        return loadQueue(source, asked);
      })
      .then((loaded) => {
        if (!active || mine !== loads.current) return;
        setState(loaded);
        setAnswered(asked);
      })
      .catch(() => {
        if (active && mine === loads.current) setState({ kind: 'failed' });
      });

    return () => {
      active = false;
    };
  }, [attempt, source, asked, ready, readCounts]);

  /** Runs one transition, then reloads from the same source whatever the
   *  outcome, so the panel, rows, chips and cards are one snapshot (spec 008
   *  FR-013, plan D3). The reload never passes through `loading`: the current
   *  snapshot stays on screen, so the panel does not unmount, and the new one
   *  replaces it on success. If the reload fails, the old snapshot stays. A
   *  refusal that promised to show the current status then reports
   *  `unavailable` instead, because the panel can no longer show it. */
  const refresh = async () => {
    // The query on screen now, not when the action started: the panel can be
    // closed mid-action and the chip, search or page changed meanwhile. If it
    // changes again while this loads, the page's own load answers it instead.
    const query = latestAsked.current;
    const mine = ++loads.current;
    readCounts(query);
    let loaded: LoadState;
    try {
      loaded = await loadQueue(source, query);
    } catch (error) {
      // This reload superseded any page load in flight, so the page must
      // still settle: ask again, keeping the snapshot on screen meanwhile.
      if (mine === loads.current) setAttempt((n) => n + 1);
      throw error;
    }
    if (mine !== loads.current || latestAsked.current !== query) return;
    setState(loaded);
    setAnswered(query);
    setStaleId(null);
  };

  /** Runs one transition, then reloads from the same source whatever the
   *  outcome. `reloaded` is false when the reload failed: the queue on screen
   *  is then the one from before. A source that throws is `unavailable`. */
  const transition = async (
    id: string,
    run: () => Promise<TransitionResult>,
  ): Promise<{ result: TransitionResult; reloaded: boolean }> => {
    let result: TransitionResult;
    try {
      result = await run();
    } catch {
      result = { ok: false, refusal: 'unavailable' };
    }
    try {
      await refresh();
      return { result, reloaded: true };
    } catch {
      // Once a change is saved but unseen, the warning stays until a reload
      // succeeds. A later refusal must not clear it.
      if (result.ok) setStaleId(id);
      // "Its current status is shown" cannot be kept when nothing reloaded.
      const shown: TransitionResult =
        !result.ok && result.refusal === 'status-changed' ? { ok: false, refusal: 'unavailable' } : result;
      return { result: shown, reloaded: false };
    }
  };

  /** Try Again: back to loading, and ask again. */
  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((current) => current + 1);
  };

  /** **Refresh**'s re-read (spec 017 FR-054). It asks for the query on screen
   *  and swaps the rows in only when they arrive, never passing through
   *  loading. It starts no load of its own: a page load or an action's reload
   *  begun meanwhile supersedes it, and while a page load is in flight it does
   *  not ask at all, since that load answers. A failure throws and leaves the
   *  table as it is. */
  const reread = async () => {
    const query = latestAsked.current;
    if (state.kind !== 'loaded' || answered !== query) return;
    const at = loads.current;
    readCounts(query, true);
    const loaded = await loadQueue(source, query);
    if (at !== loads.current || latestAsked.current !== query) return;
    setState(loaded);
    setStaleId(null);
  };

  /** Reads the counts again on their own, after a failed counts read. */
  const retryCounts = () => readCounts(latestAsked.current, true);

  return { state, answered, countsRead, staleId, refresh, transition, retry, reread, retryCounts };
}

/** The review actions (spec 008 FR-013, amended 2026-10-03): each runs with
 *  its panel open, which names it and then shows how it ended; closing the
 *  panel first hands it to a toast. `reopen` is the toast's way back to a
 *  refused request. */
function useReviewActions(
  transition: (id: string, run: () => Promise<TransitionResult>) => Promise<{ result: TransitionResult; reloaded: boolean }>,
  reopen: (id: string) => void,
) {
  /** Review actions, keyed by request (`usePanelTask`). While the panel is
   *  open it shows the action under way and how it ended; a panel closed
   *  first hands the action to a toast (2026-10-03, one behaviour for every
   *  side drawer). */
  const tasks = usePanelTask();
  /** The action in flight per request, so its panel names it and offers
   *  nothing else until it lands: nothing is sent twice (spec 008 FR-015). */
  const [inFlight, setInFlight] = useState<ReadonlyMap<string, PendingAction>>(() => new Map());
  /** How the last action on a request ended, while its panel stayed open. */
  const [notice, setNotice] = useState<{ id: string } & PanelNotice>();

  const act = (request: ReviewRequest, kind: PendingAction, copy: ActionCopy, run: () => Promise<TransitionResult>) => {
    const label = requestLabel(request);
    const { id } = request;
    if (tasks.inFlight(id)) return; // a second press, dropped (FR-015)
    setNotice(undefined);
    setInFlight((all) => new Map(all).set(id, kind));
    const taskCopy: TaskCopy<boolean> = {
      loading: copy.loading(label),
      success: (reloaded) => ({
        title: copy.done(label),
        body: reloaded ? copy.email : 'The queue could not be refreshed. Other changes since may be missing.',
      }),
      failure: (error) => ({
        title: copy.failed(label),
        body: REFUSAL_COPY[error instanceof Refused ? error.refusal : 'unavailable'],
        action: { label: 'Review request', onClick: () => reopen(id) },
      }),
    };
    void tasks
      .run(id, taskCopy, async () => {
        const { result, reloaded } = await transition(id, run);
        if (!result.ok) throw new Refused(result.refusal);
        return reloaded;
      })
      .then((outcome) => {
        setInFlight((all) => {
          const rest = new Map(all);
          rest.delete(id);
          return rest;
        });
        if (outcome.detached) return;
        const { title, body } = outcome.ok ? taskCopy.success(outcome.value) : taskCopy.failure(outcome.error);
        setNotice({ id, tone: outcome.ok ? 'success' : 'error', title, body });
      });
  };

  return {
    act,
    /** Hands a request's running action to a toast: its panel is closing. */
    handOff: tasks.handOff,
    inFlight,
    notice,
    clearNotice: () => setNotice(undefined),
  };
}

/** `/queue/:id`, and a link arriving in navigation state: which request the
 *  address asks to open, whether it is still being resolved, and the way back
 *  to plain `/queue` (spec 008 FR-001b). */
function useQueueDeepLink(source: AdminRequestSource, state: LoadState, ready: boolean) {
  const { state: navigation, search: address } = useLocation();
  const navigate = useNavigate();
  /** `/queue/:id`, the address an email's *View request* reaches for an
   *  Admin (`/requests/:id` redirects here): that request's review panel over
   *  the queue (spec 008 FR-001b). A link may also arrive in navigation state. */
  const { id: routeId } = useParams();
  const linkId = routeId ?? (navigation as DeepLinkState | null)?.openRequest;
  // `/requests/:id` lands here for an Admin. The snapshot holds every request:
  // a live one opens its review panel, and a resolved one is forwarded to
  // History, which owns its read-only panel (spec 013 FR-016, plan D14).
  // A paged source holds one page, so a link it does not hold is read by id.
  // Read once the session is known: a read sent while it resolves is refused,
  // and a resolved request would then miss instead of going on to History.
  // Review puts the row's id in the address: the page holds it already, so
  // it opens at once rather than waiting on a read (spec 008 FR-001).
  const onPage =
    !!linkId && state.kind === 'loaded' && state.requests.some((r) => r.id === linkId || r.displayId === linkId);
  const fetched = useLinkedRequest(source, ready && !onPage ? linkId : undefined);
  const known = useMemo(
    (): readonly ReviewRequest[] | null =>
      state.kind !== 'loaded'
        ? null
        : onPage
          ? state.requests
          : fetched === 'pending'
            ? null
            : fetched
              ? [...state.requests, fetched]
              : state.requests,
    [state, fetched, onPage],
  );
  const allIds = useMemo(
    () => (known ? known.flatMap((request) => (request.displayId ? [request.id, request.displayId] : [request.id])) : null),
    [known],
  );
  const findKnown = (id: string) => known?.find((r) => r.id === id || r.displayId === id);
  const forwardResolved = (id: string): string | undefined => {
    const request = findKnown(id);
    return request && isResolved(request) ? DESTINATIONS.history.path : undefined;
  };
  const { linked, unavailable, resolving, dismiss } = useDeepLinkedRequest(allIds, REQUEST_NOT_FOUND, forwardResolved, {
    id: routeId,
    base: DESTINATIONS.queue.path,
  });
  /** A deep link still being resolved. Until it is, the queue shows its
   *  loading state rather than a table it may be about to leave: a resolved
   *  request's link is forwarded to History, and the queue must not flash or
   *  announce its rows on the way (spec 013 plan D14). */
  const linking = resolving;


  /** Leave `/queue/:id` for `/queue`: the address names an open panel only
   *  while that panel is open. */
  const leaveRoutedLink = () => {
    if (routeId) navigate({ pathname: DESTINATIONS.queue.path, search: address }, { replace: true });
  };
  /** Open a request's panel by putting its id in the address, `/queue/:id`
   *  (spec 008 FR-001). Replaced, not pushed: the panel is not a page of its
   *  own, so Back leaves the queue as it did before. */
  const openRoutedLink = (id: string) => {
    const request = findKnown(id);
    navigate({ pathname: queueRequestPath(request?.displayId ?? id), search: address }, { replace: true });
  };
  return { linked, unavailable, linking, dismiss, findKnown, leaveRoutedLink, openRoutedLink };
}

export function QueuePage({
  /** Must be referentially stable — it is an effect dependency, so an object
   *  built inline in the caller's render would reload the queue on every
   *  render. Pass a module constant, or hold it in `useMemo`/a ref. */
  source: given,
}: {
  source?: AdminRequestSource;
}) {
  const source = useMemo(() => given ?? adminRequestSource(), [given]);
  const ready = useSessionReady();
  const { search: address } = useLocation();
  const [query, setQuery] = useState<QueueQuery>(() => ({
    ...INITIAL_QUERY,
    ...addressedQuery(address),
    pageSize: readPageSize('queue', PAGE_SIZES),
  }));
  /** The query a paged source is asked: `query`, with search settled for
   *  SEARCH_DEBOUNCE_MS. A seeded source is never asked, so it never waits. */
  const asked = useSettledQuery(query, true);
  const { state, answered, countsRead, staleId, refresh, transition, retry, reread, retryCounts } = useQueueSnapshot(
    source,
    asked,
    ready,
  );
  // The refusal toast's way back works from anywhere, even after the queue
  // has unmounted: the address opens the panel (spec 008 FR-001b).
  const navigateTo = useNavigate();
  /** Reopens a request on this page, while it is mounted (set below). */
  const reopenHere = useRef<((id: string) => void) | null>(null);
  const { act, handOff, inFlight, notice, clearNotice } = useReviewActions(transition, (id) => {
    if (reopenHere.current) reopenHere.current(id);
    else void navigateTo(queueRequestPath(id));
  });
  const { linked, unavailable, linking, dismiss, findKnown, leaveRoutedLink, openRoutedLink } = useQueueDeepLink(source, state, ready);

  /** Set only by Try Again, so a successful FIRST load never steals focus from
   *  wherever the visitor already is. */
  const retrying = useRef(false);
  const recoveredFocus = useRef<HTMLDivElement>(null);

  /** **Refresh** (spec 017 FR-054). The rows stay while it runs, with the
   *  table marked as updating; a failure keeps them and says so in a toast.
   *  Not `refresh`: that one follows an action and, when it fails, loads the
   *  page again, which would swap the rows for the failure notice. */
  const toaster = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const refreshNow = async () => {
    setRefreshing(true);
    try {
      await reread();
    } catch {
      toaster.show({ tone: 'error', title: "The queue couldn't be refreshed", body: 'The requests shown are unchanged. Try again.' });
    } finally {
      setRefreshing(false);
    }
  };

  /** Derived once here rather than inside the table, so the announcement and
   *  what is on screen are the same projection of the same snapshot. Memoised
   *  on the load state and the query, the projection's only inputs, so a render
   *  that changes neither does not re-sort a large snapshot. */
  const queue = useMemo(
    () => (state.kind === 'loaded' ? state.queue : null),
    [state],
  );
  /** The cards and chip counts, read beside the rows and drawn when they
   *  arrive; neither waits on the other. The chips describe the search in
   *  the box, so they show the counts read for it, even while its rows are
   *  still on their way. */
  const { counts, search: countedSearch, failed: countsFailed } = usePageCounts(countsRead);
  /** The chip counts for the search being asked; `null` while they load. */
  const shownChipCounts = linking || countedSearch !== asked.search ? null : (counts?.chipCounts ?? null);
  // Nothing at all is live: "nothing to do", not "nothing matches".
  const nothingLive = isNothingAtAll(counts?.liveCount, queue, answered);
  const change = (next: Partial<QueueQuery>) => {
    if (next.pageSize !== undefined) savePageSize('queue', next.pageSize);
    setQuery((current) => updateQuery(current, next));
  };
  // Search and sort live in the address too (`?search=&sort=`).
  useRequestAddress(query, change);

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
    // While a deep link resolves the table is not mounted yet; wait for it.
    if (state.kind !== 'loaded' || linking || !retrying.current) return;
    retrying.current = false;
    recoveredFocus.current?.focus();
  }, [state, linking]);

  /** Review opens the panel by its address, `/queue/:id`, so the panel can be
   *  linked to and reopened from the address bar (spec 008 FR-001, amended
   *  2026-10-06). The address is the only record of which panel is open.
   *  A request whose panel is already open stays open: its address would not
   *  change, so nothing would resolve it again after a dismiss (the toast's
   *  "Review request" for the request on screen). */
  const review = (id: string) => {
    const open = linked ? findKnown(linked) : undefined;
    if (linked === id || open?.id === id || open?.displayId === id) return;
    dismiss();
    openRoutedLink(id);
  };

  const listed = linked ? findKnown(linked) : undefined;
  const openRequest = useOpenRequest(source, linked, listed, state);

  // The toast's "Review request": on this page, switch the panel to that
  // request, handing the open one's running action to its toast first.
  useLayoutEffect(() => {
    reopenHere.current = (id: string) => {
      if (openRequest && openRequest.id !== id) handOff(openRequest.id);
      clearNotice();
      review(id);
    };
    return () => {
      reopenHere.current = null;
    };
  });

  const closePanel = () => {
    // An action still running on this request carries on; a toast reports it.
    // Tasks are keyed by the request's own id; the address may carry its
    // display id.
    if (openRequest) handOff(openRequest.id);
    clearNotice();
    dismiss();
    leaveRoutedLink();
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
        {announce(
          linking && state.kind === 'loaded' ? { kind: 'loading' } : state,
          queue,
          counts,
          answered && countedSearch === answered.search && counts ? counts.chipCounts[answered.chip] : null,
          nothingLive,
        )}
      </div>

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
                retry();
              }}
            >
              Try Again
            </Button>
          }
        />
      ) : null}

      {unavailable ? <RefusalAlert messages={[unavailable]} /> : null}

      {/* The page keeps its layout while the first page loads, or while a deep
          link resolves: header, cards, chips, table and pager stand in place,
          their data drawn as skeletons until it arrives. */}
      {state.kind !== 'failed' ? (
        <LoadedQueue
          queue={linking ? null : queue}
          counts={linking ? null : counts}
          chipCounts={shownChipCounts}
          onRetryCounts={countsFailed && !shownChipCounts && !linking ? retryCounts : undefined}
          nothingLive={nothingLive}
          busy={(state.kind === 'loaded' && answered !== asked) || refreshing}
          refreshing={refreshing}
          onRefresh={state.kind === 'loaded' ? () => void refreshNow() : undefined}
          query={query}
          onChange={change}
          focusRef={recoveredFocus}
          onReview={review}
        />
      ) : null}

      {openRequest ? (
        <ReviewPanel
          // A different request is a different panel: its form state, focus
          // and dialog start fresh, and nothing from the last one leaks in.
          key={openRequest.id}
          request={openRequest}
          pickupOffices={source.pickupOffices}
          canComplete={source.canComplete === true}
          reloadFailed={staleId === openRequest.id}
          pending={inFlight.get(openRequest.id) ?? null}
          notice={notice?.id === openRequest.id ? notice : undefined}
          onLeave={() => handOff(openRequest.id)}
          onClose={closePanel}
          onApprove={(id, notes) => act(openRequest, 'approve', ACTION_COPY.approve, () => source.approve(id, notes))}
          onReject={(id, reason, notes) => act(openRequest, 'reject', ACTION_COPY.reject, () => source.reject(id, reason, notes))}
          onUpdateStatus={(id, to, pickup) =>
            act(openRequest, 'updateStatus', updateCopy(to), () => source.updateStatus(id, to, pickup))
          }
          onCancel={(id, reason) => act(openRequest, 'cancel', ACTION_COPY.cancel, () => source.cancel(id, reason))}
          onComplete={(id) => act(openRequest, 'complete', ACTION_COPY.complete, () => source.complete(id))}
        />
      ) : null}
    </div>
  );
}

/** The table's rows while the first page loads, cell for cell. */
const ROW_SKELETON = [
  [COLUMNS.id, 'id'],
  [COLUMNS.requester, 'stack'],
  [COLUMNS.items, 'text'],
  [COLUMNS.status, 'request-pill'],
  [COLUMNS.submitted, 'date'],
  [COLUMNS.action, 'button'],
] as const;

/** What an empty page of the queue says. */
function emptyQueueLabel(
  queue: QueueTable,
  chipCounts: QueueCounts['chipCounts'] | null,
  query: QueueQuery,
  nothingLive: boolean,
): string {
  if (nothingLive) return 'No requests are in the queue.';
  // A page of *All requests* whose rows were all resolved (plan D5): later
  // pages may still hold live ones.
  if (queue.matchCount > 0 && chipCounts?.[query.chip] !== 0) return 'No live requests on this page.';
  return 'No requests match the current search and status filter.';
}

function LoadedQueue({
  queue,
  counts,
  chipCounts,
  onRetryCounts,
  nothingLive,
  busy,
  refreshing,
  onRefresh,
  query,
  onChange,
  focusRef,
  onReview,
}: {
  /** The next page is in flight. */
  busy: boolean;
  /** **Refresh** is running. */
  refreshing: boolean;
  /** Re-reads the page on screen; absent until the first page has loaded. */
  onRefresh?: () => void;
  /** `null` until the first answer arrives: the data is drawn as skeletons. */
  queue: QueueTable | null;
  /** `null` until the counts arrive, independent of the rows. */
  counts: QueueCounts | null;
  /** The chip counts for the search on screen; `null` while they load. */
  chipCounts: QueueCounts['chipCounts'] | null;
  /** Set when the counts read failed and none are shown: the page says so
   *  and offers to read them again. */
  onRetryCounts?: () => void;
  /** Nothing is live at all, so an empty table says so. */
  nothingLive: boolean;
  query: QueueQuery;
  onChange: (change: Partial<QueueQuery>) => void;
  /** Where focus lands when a retry succeeds; see the effect that uses it. */
  focusRef: RefObject<HTMLDivElement | null>;
  /** Opens the review panel for a request (spec 008 FR-001). */
  onReview: (id: string) => void;
}) {
  return (
    /* Vertical rhythm from `02 - Requests Queue`: 14px under the header, 16px
       under the toolbar, 34px under the chips, 34px above the pagination. */
    <div className="flex min-w-0 flex-col">
      {/* The page title is the loaded state's `<h1>`. While a `Notice` is on
          screen it carries its own title heading, so rendering this header too
          would put two `<h1>`s in the document at once. */}
      <div className="flex flex-wrap items-start justify-between gap-16">
        <PageHeader title={DESTINATIONS.queue.title} subtitle={DESTINATIONS.queue.purpose} />
        {/* No placeholder while the counts load: the cards appear once the
            counts are known, whether or not the rows are. Two cards, as `02 - Requests
            Queue` draws them (spec 004 FR-004, amended 2026-10-03). */}
        {counts ? (
          <section
            className="grid w-full grid-cols-1 gap-16 sm:grid-cols-2 lg:w-auto lg:grid-cols-[repeat(2,262px)]"
            aria-label="Requests workload summary"
          >
            <SummaryCard value={String(counts.pendingApprovalCount)} label="Pending approval" size="compact" />
            <SummaryCard value={String(counts.inProcessingCount)} label="In Processing" tone="neutral" size="compact" />
          </section>
        ) : null}
      </div>

      <div className="mt-14 flex flex-col gap-16 md:flex-row">
        <Search
          className="md:flex-1"
          aria-label="Search requests"
          /* The file has a double space after "ID,"; transcribed with one. */
          placeholder="Search by request ID, employee name, email, or item..."
          value={query.search}
          onChange={(e) => onChange({ search: e.target.value })}
          onClear={() => onChange({ search: '' })}
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
        <Button variant="ghost" className="gap-8" disabled={!onRefresh || refreshing} onClick={onRefresh}>
          <ArrowCounterClockwise size={18} className={refreshing ? 'animate-spin [animation-direction:reverse]' : undefined} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
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
            count={chipCounts?.[chip] ?? 0}
            loading={!chipCounts}
            selected={query.chip === chip}
            onSelect={() => onChange({ chip })}
          />
        ))}
      </div>
      {onRetryCounts ? <CountsUnavailable onRetry={onRetryCounts} /> : null}

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
          <TableCard busy={busy}>
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

            {/* An empty page while the next is in flight answers the previous
                query, so its empty message would describe the wrong filter. */}
            {!queue || (busy && queue.rows.length === 0) ? (
              // The page's live region already says the queue is loading.
              <SkeletonRows columns={ROW_SKELETON} rowClassName="min-h-row-height-request border-t border-line-default py-18" />
            ) : queue.rows.length === 0 ? (
              <div className="border-t border-line-default">
                <EmptyState label={emptyQueueLabel(queue, chipCounts, query, nothingLive)} />
              </div>
            ) : (
              queue.rows.map((request) => (
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
          label="Requests queue pages"
          hidden={!queue || busy}
          page={queue?.page ?? 1}
          pageSize={query.pageSize}
          total={queue?.matchCount ?? 0}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={(page) => onChange({ page })}
          onPageSizeChange={(pageSize) => onChange({ pageSize })}
        />
      </div>
    </div>
  );
}

