import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Notice, PageHeader, SectionTitle, SummaryCard, TableCard, TableHead } from '../../../shared/ui';
import { buildApprovalQueueViewModel } from './approval-queue-model';
import type { ApprovalQueueSnapshot, ApprovalQueueSource } from './approval-queue-types';
import { seededApprovalQueueSource } from './seeded-approval-queue-source';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; snapshot: ApprovalQueueSnapshot };

export function ApprovalsQueuePage({
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-32 py-32">
      <PageHeader title="Requests Queue" subtitle="Review and decide on pending supply requests" />

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

      {state.kind === 'loaded' ? <LoadedQueue snapshot={state.snapshot} /> : null}
    </div>
  );
}

function LoadedQueue({ snapshot }: { snapshot: ApprovalQueueSnapshot }) {
  const queue = buildApprovalQueueViewModel(snapshot);

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

        <div className="w-full min-w-0 overflow-x-auto rounded-10" tabIndex={0} aria-label="Pending requests table">
          <TableCard className="min-w-[900px]">
            <TableHead
              cols={[
                ['REQUEST ID', '200px'],
                ['REQUESTER', '180px'],
                ['ITEMS'],
                ['SUBMITTED', '180px'],
                ['ACTION', '180px'],
              ]}
            />

            {queue.pendingRows.length === 0 ? (
              <div className="flex min-h-row-height-request items-center px-20 py-18">
                <p className="type-body text-ink-secondary">No requests are awaiting approval.</p>
              </div>
            ) : (
              queue.pendingRows.map((request) => (
                <div
                  key={request.id}
                  className="flex min-h-row-height-request items-center border border-line-default px-20 py-18"
                >
                  <span className="w-[200px] shrink-0 type-ui-bold text-ink-primary">{request.id}</span>
                  <span className="flex w-[180px] shrink-0 flex-col gap-1 pr-12">
                    <span className="type-ui text-ink-primary">{request.requestorName}</span>
                    {request.requestorContext ? (
                      <span className="type-meta text-ink-secondary">{request.requestorContext}</span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate pr-12 type-ui text-ink-primary" title={request.itemSummary}>
                    {request.itemSummary}
                  </span>
                  <span className="w-[180px] shrink-0 type-ui text-ink-secondary">{request.submittedLabel}</span>
                  <span className="flex w-[180px] shrink-0 items-center">
                    <Link
                      to={`/requests/${encodeURIComponent(request.id)}`}
                      aria-label={`Review request ${request.id}`}
                      className="inline-flex h-control-height-md min-w-[82px] items-center justify-center rounded-10 bg-brand-primary px-18 type-ui-bold whitespace-nowrap text-brand-on-primary ring-brand transition-osrs hover:bg-osrs-red-550"
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
