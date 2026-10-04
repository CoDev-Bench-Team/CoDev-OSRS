import type { Asset } from '../assets/types';
import { CATEGORIES, type Category } from '../assets/types';

/** The few fields of a chosen catalog item a unit draft keeps, so a restored
 *  draft shows its item at once instead of after the asset list loads. The
 *  add panels read only `id`, `name`, `category` and `model`. The full record
 *  replaces the snapshot as soon as the list arrives. */
export type AssetSnapshot = Pick<Asset, 'id' | 'name' | 'category' | 'model'>;

export function snapshotOf(asset: Asset | undefined): AssetSnapshot | undefined {
  return asset ? { id: asset.id, name: asset.name, category: asset.category, model: asset.model } : undefined;
}

/** A stand-in Asset from a stored snapshot. Its counts and specs are empty and
 *  never shown: the panel swaps in the loaded record before anything reads
 *  them. `undefined` when the snapshot is unreadable. */
export function assetFromSnapshot(value: unknown): Asset | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id || typeof v.name !== 'string') return undefined;
  if (!(CATEGORIES as readonly string[]).includes(String(v.category))) return undefined;
  return {
    id: v.id,
    name: v.name,
    category: v.category as Category,
    model: typeof v.model === 'string' ? v.model : undefined,
    specs: {},
    lowStockThreshold: 0,
    available: 0,
    reserved: 0,
    assigned: 0,
    total: 0,
  };
}

/** The loaded record for a restored item: the list's own when it has loaded,
 *  else the snapshot. `undefined` once the list is in and lacks it (removed). */
export function resolveAsset(assets: readonly Asset[] | null, restored: Asset | undefined): Asset | undefined {
  if (!restored) return undefined;
  if (!assets) return restored;
  return assets.find((a) => a.id === restored.id);
}
