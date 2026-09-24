import type { RequestStatus } from '../../../shared/ui';

/** A feature-local read model, not a backend response shape. */
export interface QueueRequest {
  id: string;
  requestorName: string;
  requestorContext?: string;
  items: readonly string[];
  submittedAt: string;
  status: RequestStatus;
}

export interface QueueSnapshot {
  requests: readonly QueueRequest[];
  /** Classified by the source; the SPA deliberately owns no threshold. */
  lowStockAlertCount: number;
}

export interface QueueSource {
  load(): Promise<QueueSnapshot>;
}

/** A row is a projection of a request: the identity fields are carried over
 *  as-is (typed off the source so they cannot drift), and the display-only
 *  `items`/`submittedAt` are replaced by their rendered forms. */
export interface QueueRow
  extends Pick<QueueRequest, 'id' | 'requestorName' | 'requestorContext'> {
  itemSummary: string;
  submittedLabel: string;
  /** Carried so the row's pill states what the row IS, rather than repeating
   *  a literal that only the model's filter keeps true. */
  status: RequestStatus;
}

export interface QueueViewModel {
  pendingApprovalCount: number;
  inProcessingCount: number;
  lowStockAlertCount: number;
  pendingRows: readonly QueueRow[];
}
