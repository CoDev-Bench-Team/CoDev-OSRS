import type { AssetSpecs, CatalogItem, Category } from './types';

type SpecKey = keyof AssetSpecs;

/** Which specification rows each category carries, in the order the View
 *  Specs panel draws them (spec 001 FR-002a; `02.1 - Catalog - View Specs`).
 *
 *  Laptop, Phone and Headset require a model; Wifi and Type C Hub offer it as
 *  optional; UPS, Mice and Other Devices have none. Monitor has no Add Asset
 *  frame in the design, and the catalog card draws it with a model, so it is
 *  treated like Headset (spec D8). */
const ROWS: Record<Category, { model: boolean; specs: SpecKey[] }> = {
  Laptop: { model: true, specs: ['ram', 'storage', 'processor', 'graphics', 'operatingSystem'] },
  Phone: { model: true, specs: ['ram', 'storage'] },
  Headset: { model: true, specs: [] },
  Monitor: { model: true, specs: [] },
  Wifi: { model: true, specs: [] },
  'Type C Hub': { model: true, specs: [] },
  UPS: { model: false, specs: [] },
  Mice: { model: false, specs: [] },
  'Other Devices': { model: false, specs: [] },
};

const SPEC_LABEL: Record<SpecKey, string> = {
  ram: 'RAM',
  storage: 'Storage',
  processor: 'Processor',
  graphics: 'Graphics',
  operatingSystem: 'Operating System',
};

export type SpecRow = { label: string; value: string };

/** The rows an item's panel shows: only those its category defines, and only
 *  those the item actually has a value for. An empty field is left out rather
 *  than drawn as a blank or a dash. */
export function specRows(item: Pick<CatalogItem, 'category' | 'model' | 'specs'>): SpecRow[] {
  const { model, specs } = ROWS[item.category];
  const rows: SpecRow[] = [];
  if (model && item.model.trim() !== '') rows.push({ label: 'Model', value: item.model });
  for (const key of specs) {
    const value = item.specs[key]?.trim();
    if (value) rows.push({ label: SPEC_LABEL[key], value });
  }
  return rows;
}
