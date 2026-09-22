import { useEffect, useState } from 'react';
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
  TableHead,
} from '../../../shared/ui';
import { DESTINATIONS, requestDetailPath } from '../../../app/destinations';
import { buildApprovalQueueViewModel } from './approval-queue-model';
import type {
  ApprovalQueueSnapshot,
  ApprovalQueueSource,
  ApprovalQueueViewModel,
} from './approval-queue-types';
import { seededApprovalQueueSource } from './seeded-approval-queue-source';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; snapshot: ApprovalQueueSnapshot };

/** One source of truth for the grid. The header and the row cells read the
 *  same widths through the same mechanism, so a column cannot be widened in
 *  one place and left behind in the other. */
const COLUMNS = {
  id: '200px',
  requester: '180px',
  items: undefined,
  status: '190px',
  submitted: '180px',
  action: '180px',
} as const;

/** Matches `TableHead`'s own sizing: a fixed column does not shrink, and the
 *  fluid one may shrink below its content so `truncate` can take effect. */
const column = (width?: string) => (width ? { width, flexShrink: 0 } : { flex: 1, minWidth: 0 });

/** What a screen reader is told as the queue settles. The count is the page's
 *  whole point, so the settled announcement carries it rather than saying only
 *  that something changed. Annotated `: string` with no `default`, so adding a
 *  state without an announcement is a type error. */
function announce(state: LoadState, queue: ApprovalQueueViewModel | null): string {
  switch (state.kind) {
    case 'loading':
      return 'Loading approval queue.';
    case 'failed':
      return 'The approval queue could not be loaded.';
    case 'loaded': {
      const pending = queue?.pendingApprovalCount ?? 0;
      if (pending === 0) return 'No requests are awaiting approval.';
      return `${pending} request${pending === 1 ? '' : 's'} awaiting approval.`;
    }
  }
}

export function ApprovalsQueuePage({
  /** Must be referentially stable — it is an effect dependency, so an object
   *  built inline in the caller's render would reload the queue on every
   *  render. Pass a module constant, or hold it in `useMemo`/a ref. */
  source = seededApprovalQueueSource,
}: {
  source?: ApprovalQueueSource;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

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

  /** Derived once here rather than inside the table, so the announcement and
   *  what is on screen are the same projection of the same snapshot. */
  const queue = state.kind === 'loaded' ? buildApprovalQueueViewModel(state.snapshot) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-32 py-32">
      {/* The page title is the loaded state's `<h1>`. While a `Notice` is on
          screen it carries its own title heading, so rendering this header too
          would put two `<h1>`s in the document at once. */}
      {queue ? (
        <PageHeader title={DESTINATIONS.approvals.title} subtitle={DESTINATIONS.approvals.purpose} />
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
          title="Loading approval queue"
          body="Current request workload is being prepared."
        />
      ) : null}

      {state.kind === 'failed' ? (
        <Notice
          eyebrow="Unavailable"
          tone="stopped"
          title="Approval queue could not be loaded"
          body="Try again to retrieve the current request workload."
          actions={
            <Button
              onClick={() => {
                setState({ kind: 'loading' });
                setAttempt((current) => current + 1);
              }}
            >
              Try Again
            </Button>
          }
        />
      ) : null}

      {queue ? <LoadedQueue queue={queue} /> : null}
    </div>
  );
}

function LoadedQueue({ queue }: { queue: ApprovalQueueViewModel }) {
  return (
    <>
      <section className="grid grid-cols-1 gap-16 md:grid-cols-3" aria-label="Approval workload summary">
        <SummaryCard value={String(queue.pendingApprovalCount)} label="Pending approval" />
        <SummaryCard value={String(queue.inProcessingCount)} label="In Processing" />
        <SummaryCard value={String(queue.lowStockAlertCount)} label="Low stock alerts" />
      </section>

      <section className="flex min-w-0 flex-col gap-20" aria-labelledby="pending-approval-heading">
        <div id="pending-approval-heading">
          <SectionTitle className="scroll-mt-24">Pending Approval</SectionTitle>
        </div>

        <div
          role="region"
          aria-label="Pending requests table"
          tabIndex={0}
          className="w-full min-w-0 overflow-x-auto rounded-10"
        >
          <TableCard className="min-w-[1090px]">
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
              <div className="flex min-h-row-height-request items-center border-t border-line-default px-20 py-18">
                <p className="type-body text-ink-secondary">No requests are awaiting approval.</p>
              </div>
            ) : (
              queue.pendingRows.map((request) => (
                <div
                  key={request.id}
                  className="flex min-h-row-height-request items-center border-t border-line-default px-20 py-18"
                >
                  <span style={column(COLUMNS.id)} className="type-ui-bold text-ink-primary">
                    {request.id}
                  </span>
                  <span style={column(COLUMNS.requester)} className="flex flex-col gap-1 pr-12">
                    <span className="truncate type-ui text-ink-primary">{request.requestorName}</span>
                    {request.requestorContext ? (
                      <span className="truncate type-meta text-ink-secondary">{request.requestorContext}</span>
                    ) : null}
                  </span>
                  <span
                    style={column(COLUMNS.items)}
                    className="truncate pr-12 type-ui text-ink-primary"
                    title={request.itemSummary}
                  >
                    {request.itemSummary}
                  </span>
                  <span style={column(COLUMNS.status)} className="flex items-center">
                    <StatusPill status={request.status} />
                  </span>
                  <span style={column(COLUMNS.submitted)} className="type-ui text-ink-secondary">
                    {request.submittedLabel}
                  </span>
                  <span style={column(COLUMNS.action)} className="flex items-center">
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
      </section>
    </>
  );
}
