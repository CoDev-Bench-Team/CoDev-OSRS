import { useId } from 'react';
import { SidePanel, StatusPill, StatusTimeline } from '../../../shared/ui';
import { SECTION_HEADING } from '../detail/detail-typography';
import { requestTimeline } from '../request-timeline';
import { Card, ItemsRequested, RequesterBlock, StoppedReason } from '../review-parts';
import { requestLabel } from '../detail/request-detail-types';
import type { ResolvedRequest } from './history-model';

/** The Admin's read-only view of a resolved request, a side panel over
 *  History (BEN-144, spec 013). Frame: `04 - History` with its Cancelled panel.
 *
 *  It reads the request back and offers nothing to do: no footer, no action.
 *  ✕, Esc and the scrim close it (spec 013 FR-008 to FR-011). The Rejected and
 *  Completed panels are composed from the same parts, since only the Cancelled
 *  one is drawn (additions.md §3j). */
export function HistoryPanel({ request, onClose }: { request: ResolvedRequest; onClose: () => void }) {
  const statusHeadingId = useId();
  return (
    <SidePanel
      title={`Request ${requestLabel(request)}`}
      onClose={onClose}
      header={
        <>
          <h2 className="type-section-title truncate text-ink-heading">{requestLabel(request)}</h2>
          <StatusPill status={request.status} />
        </>
      }
    >
      <RequesterBlock name={request.requestorName} email={request.requestorEmail} office={request.requestorOffice} />

      <ItemsRequested lines={request.lines} />

      {request.noteToApprover ? (
        <Card title="Note to Approver">
          <p className="type-meta text-ink-body">{request.noteToApprover}</p>
        </Card>
      ) : null}

      <section className="flex flex-col gap-18" aria-labelledby={statusHeadingId}>
        <h3 id={statusHeadingId} className={SECTION_HEADING}>
          Status
        </h3>
        <StatusTimeline nodes={requestTimeline(request)} />
      </section>

      <StoppedReason request={request} />
    </SidePanel>
  );
}
