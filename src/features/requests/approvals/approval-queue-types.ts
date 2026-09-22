import type { RequestStatus } from '../../../shared/ui';

/** A feature-local read model, not a backend response shape. */
export interface ApprovalQueueRequest {
  id: string;
  requestorName: string;
  requestorContext?: string;
  items: readonly string[];
  submittedAt: string;
  status: RequestStatus;
}

export interface ApprovalQueueSnapshot {
  requests: readonly ApprovalQueueRequest[];
  /** Classified by the source; the SPA deliberately owns no threshold. */
  lowStockAlertCount: number;
}

export interface ApprovalQueueSource {
  load(): Promise<ApprovalQueueSnapshot>;
}

export interface ApprovalQueueRow {
  id: string;
  requestorName: string;
  requestorContext?: string;
  itemSummary: string;
  submittedLabel: string;
  /** Carried so the row's pill states what the row IS, rather than repeating
   *  a literal that only the model's filter keeps true. */
  status: RequestStatus;
}

export interface ApprovalQueueViewModel {
  pendingApprovalCount: number;
  inProcessingCount: number;
  lowStockAlertCount: number;
  pendingRows: readonly ApprovalQueueRow[];
}
