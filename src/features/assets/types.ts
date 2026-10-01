import type { Office } from '../auth/types';

/** Assets and their stock, in product language (spec 014).
 *
 *  SPA terms, not HTTP terms. Where a name matches the live contract it is
 *  deliberate — the category values and the five specification keys are the
 *  contract's own — so wiring maps them one-to-one. Where the contract has no
 *  equivalent (per-asset unit counts) the gap is recorded in
 *  `specs/001-office-supplies-mvp/contracts/README.md`. */

/** The contract's category enum, in its order (spec 014 D4). */
export const CATEGORIES = [
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
export type Category = (typeof CATEGORIES)[number];

/** The design's specification rows, keyed by the contract's field names. */
export const SPEC_KEYS = ['ram', 'storage', 'processor', 'graphics', 'operatingSystem'] as const;
export type SpecKey = (typeof SPEC_KEYS)[number];

/** One office's stock: how many of the asset's units there are `Available`
 *  and how many `Reserved`. Counts of units by status, never set by hand;
 *  Total is their sum and is never stored (constitution III, ADR-0008). */
export type StockLevels = { available: number; reserved: number };

export type Asset = {
  id: string;
  name: string;
  category: Category;
  model?: string;
  description?: string;
  /** A data URI, as the contract's `imageBase64` carries it. */
  image?: string;
  specs: Partial<Record<SpecKey, string>>;
  /** One per asset, set on Add Asset and edited on Update Asset (spec 014 D8). */
  lowStockThreshold: number;
  /** Units in `Assigned` — the Assets screen's ASSIGNED UNITS. Not in Total. */
  assigned: number;
  stock: Record<Office, StockLevels>;
};

/** What the Add and Update Asset panels submit. No stock: units are added on
 *  Inventory. Both panels draw the threshold (spec 014 D8). */
export type AssetDraft = Pick<
  Asset,
  'name' | 'category' | 'model' | 'description' | 'image' | 'specs' | 'lowStockThreshold'
>;
