import { useCallback, useEffect, useState } from 'react';
import { Button, LoadingState, Notice, PageHeader, StatusPill, TableCard, TableHead } from '../../../shared/ui';
import { DESTINATIONS } from '../../../app/destinations';
import { useSession } from '../../auth/session-context';
import { RequestDetailPanel } from '../detail/RequestDetailPanel';
import type { EmployeeRequest, EmployeeRequestSource } from '../detail/request-detail-types';
import { seededEmployeeRequestSource } from '../detail/seeded-employee-request-source';
import { formatDate, summarizeItems } from '../format';

/** My Requests — a STAND-IN for BEN-44.
 *
 *  BEN-45's panel opens from a row's *View details*, and the list that carries
 *  that link (BEN-44) has not shipped. This is the `04 - My Requests` frame at
 *  its plainest — the five drawn columns over the seeded source — so the panel
 *  has somewhere to open from. BEN-44 replaces this file; the panel and the
 *  source are BEN-45's and stay (docs/design-system/additions.md).
 *
 *  The open request is component state, not an address: the panel "opens from
 *  View details and closes without navigating" (spec 003, 2026-09-23). */
const COLS: [string, string?][] = [
  ['Request ID', '180px'],
  ['Date', '160px'],
  ['Items'],
  ['Status', '160px'],
  ['Action', '120px'],
];

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; requests: readonly EmployeeRequest[] };

export function MyRequestsPage({ source = seededEmployeeRequestSource }: { source?: EmployeeRequestSource }) {
  const { session } = useSession();
  const user = session?.user;
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (): Promise<Load> => {
      if (!user) return { state: 'failed' };
      try {
        return { state: 'ready', requests: await source.list(user) };
      } catch {
        return { state: 'failed' };
      }
    },
    [source, user],
  );

  const refresh = useCallback(async () => setLoad(await fetchRequests()), [fetchRequests]);

  useEffect(() => {
    let live = true;
    void fetchRequests().then((next) => {
      if (live) setLoad(next);
    });
    return () => {
      live = false;
    };
  }, [fetchRequests]);

  const cancel = async (id: string, reason: string) => {
    const result = await source.cancel(user!, id, reason);
    // Refresh either way: on success the row's pill must follow the panel's
    // (acceptance 4); on a refusal the request changed underneath us, and the
    // panel should show what it is now, not what it was.
    await refresh();
    return result;
  };

  const { title } = DESTINATIONS.requests;
  const requests = load.state === 'ready' ? load.requests : [];
  const open = requests.find((r) => r.id === openId);

  return (
    <div className="flex flex-col gap-24 py-32">
      <PageHeader title={title} subtitle="Track every request from submission through pickup and completion" />

      {load.state === 'loading' ? <LoadingState label="Loading your requests" /> : null}

      {load.state === 'failed' ? (
        <Notice
          eyebrow="Unavailable"
          tone="stopped"
          title="Your requests could not be loaded"
          body="Nothing has changed. Try again in a moment"
          actions={<Button onClick={() => void refresh()}>Try Again</Button>}
        />
      ) : null}

      {load.state === 'ready' ? (
        <TableCard className="w-full">
          <TableHead cols={COLS} />
          {requests.length === 0 ? (
            <p className="border-t border-line-default px-20 py-18 type-body text-ink-secondary">
              You have not submitted any requests yet
            </p>
          ) : (
            <ul>
              {requests.map((request) => (
                <li key={request.id} className="flex items-center border-t border-line-default px-20 py-18">
                  <span className="w-[180px] shrink-0 type-ui-bold text-ink-primary">{request.id}</span>
                  <span className="w-[160px] shrink-0 type-ui text-ink-secondary">{formatDate(request.submittedAt)}</span>
                  <span className="min-w-0 flex-1 truncate type-ui text-ink-body">
                    {summarizeItems(request.lines.map((l) => l.name))}
                  </span>
                  <span className="w-[160px] shrink-0">
                    <StatusPill status={request.status} />
                  </span>
                  <span className="w-[120px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(request.id)}
                      aria-label={`View details of ${request.id}`}
                      className="inline-flex cursor-pointer items-center gap-4 border-none bg-transparent p-0 type-ui-bold text-ink-link transition-osrs hover:text-brand-primary-alt"
                    >
                      View details <span aria-hidden="true">→</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TableCard>
      ) : null}

      {open ? <RequestDetailPanel request={open} onClose={() => setOpenId(null)} onCancel={cancel} /> : null}
    </div>
  );
}
