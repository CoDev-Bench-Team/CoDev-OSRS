import type { Office } from '../auth/types';

/** Assets and their stock, in product language (spec 008).
 *
 *  SPA terms, not HTTP terms. Where a name matches the live contract it is
 *  deliberate — the category values and the five specification keys are the
 *  contract's own — so wiring maps them one-to-one. Where the contract has no
 *  equivalent (per-office Total / Reserved, deployed units, custom specs) the
 *  gap is recorded in `specs/001-office-supplies-mvp/contracts/README.md`. */

/** The contract's category enum, in its order (spec 008 D4). */
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

export type CustomSpec = { key: string; value: string };

/** One office's stock. Available is never stored: it is `total − reserved`
 *  (constitution III, spec 008 D9). */
export type StockLevels = { total: number; reserved: number };

export type Asset = {
  id: string;
  name: string;
  category: Category;
  model?: string;
  description?: string;
  /** A data URI, as the contract's `imageBase64` carries it. */
  image?: string;
  specs: Partial<Record<SpecKey, string>>;
  /** The Update Asset panel's free rows. No contract field (spec 008 D7). */
  customSpecs: CustomSpec[];
  /** One per asset, as the Update stocks panel draws it (spec 008 D8). */
  lowStockThreshold: number;
  /** Units consumed by completed requests — the Assets screen's DEPLOYED UNITS. */
  deployed: number;
  stock: Record<Office, StockLevels>;
};

/** What the Add and Update Asset panels submit. Stock is not on it: the
 *  design moved it to the Update stocks panel (drift §4f). */
export type AssetDraft = Pick<Asset, 'name' | 'category' | 'model' | 'description' | 'image' | 'specs' | 'customSpecs'>;

/** What the Update stocks panel submits, all at once (spec 008 FR-007). */
export type StockChange = { lowStockThreshold: number; totals: Record<Office, number> };
