import type { RequestStatus } from '../ui/status';

/** Published request statuses, compared with the live API document on
 *  2026-10-02. Display words follow the integration guide. */
export const REQUEST_STATUS_LABEL = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ready_for_pickup: 'Ready for Pickup',
  for_delivery: 'For Delivery',
  received: 'Received',
  rejected: 'Rejected',
  // The guide's display word is `Complete`. The shell status is `Completed`.
  // The map keeps the guide's word; the gap is in the contract README.
  completed: 'Complete',
  cancelled: 'Cancelled',
} as const;

export type ApiRequestStatus = keyof typeof REQUEST_STATUS_LABEL;

/** Published asset categories, including the API spelling `Wifi`. */
export const API_ASSET_CATEGORIES = [
  'Laptop',
  'Headset',
  'Monitor',
  'Phone',
  'UPS',
  'Mice',
  'Wifi',
  'Type C Hub',
  'Other Devices',
] as const;

export type ApiAssetCategory = (typeof API_ASSET_CATEGORIES)[number];

/** The catalog chip says WiFi. The API spelling stays `Wifi`. */
export function assetCategoryLabel(category: string): string {
  return category === 'Wifi' ? 'WiFi' : category;
}

/** Shell request statuses (`src/shared/ui/status.ts`) for each published one.
 *  `completed` is the shell's `Completed`; the pill owns its display word. */
const SHELL_STATUS = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ready_for_pickup: 'Ready for Pickup',
  for_delivery: 'For Delivery',
  received: 'Received',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const satisfies Record<ApiRequestStatus, RequestStatus>;

export type ShellRequestStatus = (typeof SHELL_STATUS)[ApiRequestStatus];

export function isApiRequestStatus(value: unknown): value is ApiRequestStatus {
  return typeof value === 'string' && Object.hasOwn(SHELL_STATUS, value);
}

/** A status outside the published set is not guessed: it throws, and the
 *  screen shows its error state (plan D10). */
export function toRequestStatus(value: unknown): ShellRequestStatus {
  if (!isApiRequestStatus(value)) throw new Error(`Unpublished request status: ${String(value)}`);
  return SHELL_STATUS[value];
}

export function toApiStatus(status: ShellRequestStatus): ApiRequestStatus {
  const entry = Object.entries(SHELL_STATUS).find(([, shell]) => shell === status);
  if (!entry) throw new Error(`No published status for ${status}`);
  return entry[0] as ApiRequestStatus;
}
