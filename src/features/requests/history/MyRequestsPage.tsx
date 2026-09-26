import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import {
  Button,
  LoadingState,
  Notice,
  PageHeader,
  StatusPill,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  TableHead,
  tableColumnStyle,
  type ColumnWidth,
} from '../../../shared/ui';
import { DESTINATIONS } from '../../../app/destinations';
import { useSession } from '../../auth/session-context';
import { RequestDetailPanel } from '../detail/RequestDetailPanel';
import type { CancelResult, EmployeeRequest, EmployeeRequestSource } from '../detail/request-detail-types';
import { employeeRequestSource } from '../detail/employee-request-source';
import { RefusalAlert } from '../detail/RefusalAlert';
import { useDeepLinkedRequest } from '../deep-link';
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
// Header and row cells are both sized through `tableColumnStyle`, so a column
// cannot drift out from under its heading.
const WIDTH = { id: '180px', date: '160px', status: '160px', action: '120px' } as const satisfies Record<
  string,
  ColumnWidth
>;
const COLS: [string, ColumnWidth?][] = [
  ['Request ID', WIDTH.id],
  ['Date', WIDTH.date],
  ['Items'],
  ['Status', WIDTH.status],
  ['Action', WIDTH.action],
];

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; requests: readonly EmployeeRequest[] };

export function MyRequestsPage({ source: given }: { source?: EmployeeRequestSource }) {
  const { search } = useLocation();
  const source = useMemo(() => given ?? employeeRequestSource(search), [given, search]);
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

  const cancel = async (id: string, reason: string): Promise<CancelResult> => {
    // A contract-backed source can reject (network, 5xx). Treat that as the
    // `unavailable` refusal the panel already explains, rather than leaving
    // the form disabled and the rejection unhandled.
    let result: CancelResult;
    try {
      result = await source.cancel(user!, id, reason);
    } catch {
      result = { ok: false, refusal: 'unavailable' };
    }
    // Reload either way: on success the row's pill must follow the panel's
    // (acceptance 4); on a refusal the request changed underneath us, and the
    // panel should show what it is now, not what it was.
    const next = await fetchRequests();
    // Refused because the request changed, but the reload that would show how
    // failed: the panel still holds the old status, so it must not say "its
    // current status is shown above". Report it as the plain failure instead.
    if (!result.ok && result.refusal === 'status-changed' && next.state !== 'ready') {
      result = { ok: false, refusal: 'unavailable' };
    }
    const outcome = result;
    setLoad((prev) => {
      if (next.state === 'ready' || prev.state !== 'ready') return next;
      // The reload failed. Swapping in the failure notice would unmount the
      // open panel mid-submit and hide a cancel that went through, so keep the
      // list we had — with the cancelled request in it when the cancel worked.
      if (!outcome.ok) return prev;
      return { state: 'ready', requests: prev.requests.map((r) => (r.id === id ? outcome.request : r)) };
    });
    return result;
  };

  // `/requests/:id` lands here for an Employee and opens their own request.
  // Only their own ids are in the list, so another Employee's request and a
  // missing one get the same notice (spec 003 FR-012a).
  const ownIds = useMemo(() => (load.state === 'ready' ? load.requests.map((r) => r.id) : null), [load]);
  const unavailable = useDeepLinkedRequest(ownIds, setOpenId);

  const { title, purpose } = DESTINATIONS.requests;
  const requests = load.state === 'ready' ? load.requests : [];
  const open = requests.find((r) => r.id === openId);

  return (
    <div className="flex flex-col gap-24 py-32">
      <PageHeader title={title} subtitle={purpose} />

      {unavailable ? <RefusalAlert messages={[unavailable]} /> : null}

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
            <p className={`border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18 type-body text-ink-secondary`}>
              You have not submitted any requests yet
            </p>
          ) : (
            <ul>
              {requests.map((request) => (
                <li
                  key={request.id}
                  className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}
                >
                  <span style={tableColumnStyle(WIDTH.id)} className="type-ui-bold text-ink-primary">
                    {request.id}
                  </span>
                  <span style={tableColumnStyle(WIDTH.date)} className="type-ui text-ink-secondary">
                    {formatDate(request.submittedAt)}
                  </span>
                  <span style={tableColumnStyle()} className="truncate type-ui text-ink-body">
                    {summarizeItems(
                      request.lines.map((l) => l.name),
                      2,
                    )}
                  </span>
                  <span style={tableColumnStyle(WIDTH.status)}>
                    <StatusPill status={request.status} />
                  </span>
                  <span style={tableColumnStyle(WIDTH.action)}>
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
