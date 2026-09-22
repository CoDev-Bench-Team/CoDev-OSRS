import type {
  ApprovalQueueRequest,
  ApprovalQueueSnapshot,
  ApprovalQueueViewModel,
} from './approval-queue-types';

const IN_PROCESSING = new Set<ApprovalQueueRequest['status']>(['Approved', 'For Release', 'Released']);

const SUBMITTED_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function summarizeItems(items: readonly string[]) {
  if (items.length <= 3) return items.join(', ');
  return `${items.slice(0, 3).join(', ')} + ${items.length - 3} more`;
}

export function buildApprovalQueueViewModel(snapshot: ApprovalQueueSnapshot): ApprovalQueueViewModel {
  const seenPendingIds = new Set<string>();
  const pendingRows = snapshot.requests.flatMap((request) => {
    if (request.status !== 'Pending Approval' || seenPendingIds.has(request.id)) return [];
    seenPendingIds.add(request.id);

    return [
      {
        id: request.id,
        requestorName: request.requestorName,
        requestorContext: request.requestorContext,
        itemSummary: summarizeItems(request.items),
        submittedLabel: SUBMITTED_DATE.format(new Date(request.submittedAt)),
      },
    ];
  });

  return {
    pendingApprovalCount: pendingRows.length,
    inProcessingCount: snapshot.requests.filter((request) => IN_PROCESSING.has(request.status)).length,
    lowStockAlertCount: snapshot.lowStockAlertCount,
    pendingRows,
  };
}
