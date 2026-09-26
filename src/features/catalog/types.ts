/** A catalog item, in product language.
 *
 *  Every field here is published by the Assets contract
 *  (`specs/001-office-supplies-mvp/contracts/README.md`, `GET /assets`).
 *  Nothing is invented, which is what keeps constitution VII true while the
 *  client is unwired. */

/** The contract's `category` enum, in the contract's order — which is also the
 *  order the design draws the chips in. The design's chip reads "WiFI"; the
 *  contract says `Wifi`, and the contract is what the SPA renders (spec D6). */
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

/** The contract's office enum, as `GET /assets?location=` publishes it. It now
 *  says `Ortigas`, matching the design — conflict 2 in `contracts/README.md`
 *  has moved on the backend side (spec D7). */
export const OFFICES = ['Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao'] as const;

export type CatalogOffice = (typeof OFFICES)[number];

/** The category-dependent specification fields the contract publishes as
 *  top-level asset properties. Every one is optional: which of them an asset
 *  carries depends on its category (spec 001 FR-002a). */
export type AssetSpecs = {
  ram?: string;
  storage?: string;
  processor?: string;
  graphics?: string;
  operatingSystem?: string;
};

export type CatalogItem = {
  id: string;
  /** The specific item — "Dell Latitude 5440". One card is one asset, so the
   *  card no longer offers a model choice (spec D5). */
  name: string;
  category: Category;
  /** The contract's `model`: brand or model string. */
  model: string;
  description?: string;
  /** Optional: the contract's `imageBase64`, already resolved to something an
   *  `<img>` can take. The card falls back when it is absent. */
  image?: string;
  specs: AssetSpecs;
  /** Available units at the office the catalog was read for — the contract's
   *  `location`-scoped quantity. Reserved units are not requestable, so this,
   *  not a total, is what the pill and the stepper read (constitution III). */
  available: number;
  /** The contract's `lowQtyAlert` — the boundary for `Low in Stock`. */
  lowQtyAlert: number;
};
