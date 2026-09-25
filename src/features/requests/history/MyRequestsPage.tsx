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
import { formatDate, summarizeItems } from '../format';
import { newestFirst } from './order';

/** My Requests — `04 - My Requests` (spec 009, BEN-44).
 *
 *  The signed-in Employee's own requests, newest first, each with its live
 *  status pill and a *View details* that opens BEN-45's panel (spec 007). The
 *  source answers for the signed-in Employee only; the page sorts, so a
 *  source need not promise an order (spec 009 D2, D4). No filters, search or
 *  pagination: the frame draws none (D3).
 *
 *  The open request is component state, not an address: the panel "opens from
 *  View details and closes without navigating" (spec 003, 2026-09-23). */
// The frame's column widths (200 / 180 / fill / 190 / 90 inside the 20px
// gutter). Header and row cells are both sized through `tableColumnStyle`, so a
// column cannot drift out from under its heading.
const WIDTH = { id: '200px', date: '180px', status: '190px', action: '90px' } as const satisfies Record<
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

/** The frame's `arrow-right`: a 7px arrow inset 2.5px in a 12px box, a 1px
 *  round-capped stroke. The file strokes it in `brand-primary` while the label
 *  beside it binds `Codev Red` (`brand-primary-alt`) — the two reds
 *  drift-2026-09-22 §9 leaves open — so each keeps its own. */
function ArrowRight() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="h-12 w-12 shrink-0 text-brand-primary">
      <path d="M2.5 6h7M9.5 6 6 2.5M9.5 6 6 9.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

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

  const { title, purpose } = DESTINATIONS.requests;
  const requests = useMemo(() => (load.state === 'ready' ? newestFirst(load.requests) : []), [load]);
  const open = requests.find((r) => r.id === openId);

  return (
    // The frame sets the title 34px under the bar and the table 40px under the
    // subtitle.
    <div className="flex flex-col gap-[40px] pt-[34px] pb-32">
      <PageHeader title={title} subtitle={purpose} />

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
            <p className={`${TABLE_ROW_PADDING_CLASS} py-18 type-body text-ink-secondary`}>
              You have not submitted any requests yet
            </p>
          ) : (
            <ul>
              {requests.map((request) => (
                <li
                  key={request.id}
                  className={`flex items-center border-b border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}
                >
                  <span style={tableColumnStyle(WIDTH.id)} className="type-ui-bold text-ink-primary">
                    {request.id}
                  </span>
                  <span style={tableColumnStyle(WIDTH.date)} className="type-ui text-ink-secondary">
                    {formatDate(request.submittedAt)}
                  </span>
                  <span style={tableColumnStyle()} className="truncate pr-16 type-ui text-ink-primary">
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
                      className="inline-flex cursor-pointer items-center gap-7 border-none bg-transparent p-0 font-sans text-12 leading-tight font-bold whitespace-nowrap text-brand-primary-alt transition-osrs hover:text-brand-primary"
                    >
                      View details
                      <ArrowRight />
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
