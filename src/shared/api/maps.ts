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
