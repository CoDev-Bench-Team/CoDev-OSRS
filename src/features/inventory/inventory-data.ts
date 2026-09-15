import type { StockStatus } from '../../shared/ui';

/** The inventory screen's sample data — figma `03 - Inventory` (113:27060).
 *
 *  **This is the designer's sample data, not a data model.** The REST contract
 *  is the backend team's to publish (`ARCHITECT.md` §8), and constitution VII
 *  forbids this repository from inventing fields, routes or error codes. These
 *  rows exist so the screen can be built and reviewed against the frame before
 *  that contract lands, and they go when it does.
 *
 *  Nothing here performs inventory arithmetic. Stock movement is transactional
 *  and belongs to the API (constitution III); this file only says what the
 *  frame draws.
 */

export type InventoryItem = {
  /** A slug, not a code. The newer frames drop the asset code the earlier UI
   *  kit showed under each item name, so there is no identifier to show. */
  id: string;
  name: string;
  category: string;
  total: number;
  available: number;
  reserved: number;
  /** Drawn per row rather than derived: the source states each pill, and the
   *  rule that would produce them is an API concern. */
  stock: StockStatus;
};

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'dell-latitude-7440', name: 'Dell Latitude 7440', category: 'Laptops', total: 32, available: 18, reserved: 14, stock: 'In Stock' },
  { id: 'lg-ultrafine-27', name: 'LG UltraFine 27-inch', category: 'Monitors', total: 24, available: 8, reserved: 16, stock: 'In Stock' },
  { id: 'logitech-mx-keys', name: 'Logitech MX Keys', category: 'Keyboards', total: 40, available: 24, reserved: 16, stock: 'In Stock' },
  { id: 'logitech-mx-master-3s', name: 'Logitech MX Master 3S', category: 'Mice', total: 28, available: 4, reserved: 24, stock: 'Low Stock' },
  { id: 'jabra-evolve2-40', name: 'Jabra Evolve2 40', category: 'Headsets', total: 20, available: 5, reserved: 15, stock: 'Low Stock' },
  { id: 'usb-c-cable-2m', name: 'USB-C Cable 2m', category: 'Cables', total: 60, available: 0, reserved: 60, stock: 'Out of Stock' },
];

/** The filter chips, with the counts the frame states. They do not describe
 *  the six rows above — the frame shows six rows and a footer reading
 *  "1-50 of 1,250", so its own numbers describe a catalog these rows are a
 *  page of. Reproduced as drawn rather than recomputed. */
export const STOCK_FILTERS = [
  { label: 'All items', count: 238, match: null },
  { label: 'In stock', count: 7, match: 'In Stock' },
  { label: 'Low stock', count: 7, match: 'Low Stock' },
  { label: 'Out of stock', count: 7, match: 'Out of Stock' },
] as const satisfies readonly { label: string; count: number; match: StockStatus | null }[];

/** Categories offered by the filter and by the drawer's Category field. */
export const ALL_CATEGORIES = 'All categories';
export const CATEGORIES = ['Office Supplies', 'Laptops', 'Monitors', 'Keyboards', 'Mice', 'Headsets', 'Cables'];

/** The pagination figures the frame states, drawn as-is for the same reason. */
export const PAGINATION = { rangeLabel: '1-50 of 1,250', pages: [1, 2, 3, 4, 5], current: 2, perPage: '50' };
