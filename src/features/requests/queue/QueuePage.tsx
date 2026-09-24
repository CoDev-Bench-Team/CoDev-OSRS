import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import {
  BUTTON_SHAPE,
  BUTTON_VARIANT,
  Button,
  Notice,
  PageHeader,
  SectionTitle,
  StatusPill,
  SummaryCard,
  TableCard,
  TABLE_ROW_PADDING_CLASS,
  TableHead,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
} from '../../../shared/ui';
import { DESTINATIONS, requestDetailPath } from '../../../app/destinations';
import { buildQueueViewModel, NO_VALUE } from './queue-model';
import type {
  QueueSnapshot,
  QueueSource,
  QueueViewModel,
} from './queue-types';
import { seededQueueSource } from './seeded-queue-source';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; snapshot: QueueSnapshot };

/** One source of truth for the grid. The header and the row cells read the
 *  same widths through the same `tableColumnStyle`, so a column cannot be
 *  widened or sized differently in one place and left behind in the other. */
const COLUMNS = {
  id: '200px',
  requester: '180px',
  items: undefined,
  status: '190px',
  submitted: '180px',
  action: '180px',
} as const satisfies Record<string, ColumnWidth | undefined>;

/** The floor the fluid ITEMS column keeps before its content starts
 *  truncating. */
const MIN_ITEMS_WIDTH = 120;

/** Derived from COLUMNS and the shared row gutter, never restated — see
 *  `tableMinWidth`, which also rejects a width that is not a sane pixel length. */
const TABLE_MIN_WIDTH = tableMinWidth(Object.values(COLUMNS), MIN_ITEMS_WIDTH);

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
      const pending = queue?.pendingApprovalCount ?? 0;
      if (pending === 0) return 'No requests are awaiting approval.';
      return `${pending} request${pending === 1 ? '' : 's'} awaiting approval.`;
    }
  }
}

export function QueuePage({
  /** Must be referentially stable — it is an effect dependency, so an object
   *  built inline in the caller's render would reload the queue on every
   *  render. Pass a module constant, or hold it in `useMemo`/a ref. */
  source = seededQueueSource,
}: {
  source?: QueueSource;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  /** Set only by Try Again, so a successful FIRST load never steals focus from
   *  wherever the visitor already is. */
  const retrying = useRef(false);
  const recoveredHeading = useRef<HTMLDivElement>(null);

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
   *  Focus goes to the "Pending Approval" heading rather than the page header:
   *  the live region is already about to say how many requests are waiting, and
   *  a page header carrying a title AND a subtitle would be read out on top of
   *  that. The section heading is two words, it is the heading of the content
   *  that just appeared, and it puts the visitor at the table. */
  useEffect(() => {
    if (state.kind !== 'loaded' || !retrying.current) return;
    retrying.current = false;
    recoveredHeading.current?.focus();
  }, [state]);

  /** Derived once here rather than inside the table, so the announcement and
   *  what is on screen are the same projection of the same snapshot. */
  const queue = state.kind === 'loaded' ? buildQueueViewModel(state.snapshot) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-32 py-32">
      {/* The page title is the loaded state's `<h1>`. While a `Notice` is on
          screen it carries its own title heading, so rendering this header too
          would put two `<h1>`s in the document at once. */}
      {queue ? (
        <PageHeader title={DESTINATIONS.queue.title} subtitle={DESTINATIONS.queue.purpose} />
      ) : null}

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

      {queue ? <LoadedQueue queue={queue} headingRef={recoveredHeading} /> : null}
    </div>
  );
}

function LoadedQueue({
  queue,
  headingRef,
}: {
  queue: QueueViewModel;
  /** Where focus lands when a retry succeeds; see the effect that uses it. */
  headingRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-16 md:grid-cols-3" aria-label="Requests workload summary">
        <SummaryCard value={String(queue.pendingApprovalCount)} label="Pending approval" />
        <SummaryCard value={String(queue.inProcessingCount)} label="In Processing" />
        <SummaryCard value={String(queue.lowStockAlertCount)} label="Low stock alerts" />
      </section>

      <section className="flex min-w-0 flex-col gap-20" aria-labelledby="pending-approval-heading">
        <div id="pending-approval-heading" ref={headingRef} tabIndex={-1}>
          <SectionTitle className="scroll-mt-24">Pending Approval</SectionTitle>
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
          aria-label="Pending requests table"
          tabIndex={0}
          className="-mx-9 -mt-4 -mb-14 min-w-0 overflow-x-auto px-9 pt-4 pb-14"
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

              {queue.pendingRows.length === 0 ? (
                <div className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
                  <p className="type-body text-ink-secondary">No requests are awaiting approval.</p>
                </div>
              ) : (
                queue.pendingRows.map((request) => (
                  <div
                    key={request.id}
                    className={`flex min-h-row-height-request items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}
                  >
                    <span style={tableColumnStyle(COLUMNS.id)} className="type-ui-bold text-ink-primary">
                      {request.id}
                    </span>
                    <span style={tableColumnStyle(COLUMNS.requester)} className="flex flex-col gap-1 pr-12">
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
                      <Link
                        to={requestDetailPath(request.id)}
                        aria-label={`Review request ${request.id}`}
                        className={`${BUTTON_SHAPE} ${BUTTON_VARIANT.primary}`}
                      >
                        Review
                      </Link>
                    </span>
                  </div>
                ))
              )}
            </TableCard>
          </div>
        </div>
      </section>
    </>
  );
}
