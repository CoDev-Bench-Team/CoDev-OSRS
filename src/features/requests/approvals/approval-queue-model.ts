import type {
  ApprovalQueueRequest,
  ApprovalQueueSnapshot,
  ApprovalQueueViewModel,
} from './approval-queue-types';

/** What a cell shows when the source gave nothing usable. Exported because the
 *  page has to recognise it — a placeholder is not worth a tooltip. */
export const NO_VALUE = '—';

const IN_PROCESSING = new Set<ApprovalQueueRequest['status']>(['Approved', 'For Release', 'Released']);

/** Codev is Manila-based, so a UTC label reads a day early for anything
 *  submitted before 08:00 local — and SUBMITTED is the column an Approver uses
 *  to judge how long a request has waited. Pinned rather than viewer-local so
 *  every Approver reads the same date whatever their machine is set to. */
const SUBMITTED_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

/** `Intl` throws `RangeError` on an unparseable date, and this runs during
 *  render — one bad timestamp would otherwise escape the page's own failure
 *  state and surface as the shell's generic error instead. */
function formatSubmitted(value: string) {
  const submittedAt = new Date(value);
  return Number.isNaN(submittedAt.getTime()) ? NO_VALUE : SUBMITTED_DATE.format(submittedAt);
}

/** An absent or blank item list gets the same em dash as an unparseable date,
 *  and for the same reason: a blank cell cannot be told apart from a rendering
 *  fault, and both are shapes an unpublished source can hand us. Blank names
 *  are dropped before the count so "+ N more" never promises rows that are not
 *  there. */
function summarizeItems(items: readonly string[]) {
  const named = items.filter((item) => item.trim().length > 0);
  if (named.length === 0) return NO_VALUE;
  if (named.length <= 3) return named.join(', ');
  return `${named.slice(0, 3).join(', ')} + ${named.length - 3} more`;
}

export function buildApprovalQueueViewModel(snapshot: ApprovalQueueSnapshot): ApprovalQueueViewModel {
  /** One de-duplication pass before anything is counted: a malformed source
   *  must not inflate one metric while another absorbs the same repeat. */
  const seenIds = new Set<string>();
  const requests = snapshot.requests.filter((request) => {
    if (seenIds.has(request.id)) return false;
    seenIds.add(request.id);
    return true;
  });

  const pendingRows = requests
    .filter((request) => request.status === 'Pending Approval')
    .map((request) => ({
      id: request.id,
      requestorName: request.requestorName,
      requestorContext: request.requestorContext,
      itemSummary: summarizeItems(request.items),
      submittedLabel: formatSubmitted(request.submittedAt),
      status: request.status,
    }));

  return {
    pendingApprovalCount: pendingRows.length,
    inProcessingCount: requests.filter((request) => IN_PROCESSING.has(request.status)).length,
    lowStockAlertCount: snapshot.lowStockAlertCount,
    pendingRows,
  };
}
