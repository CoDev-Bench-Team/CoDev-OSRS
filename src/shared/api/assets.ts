import { apiRequest } from './client';
import { API_ASSET_CATEGORIES, type ApiAssetCategory } from './maps';
import { id, num, optStr, record, str } from './wire';
import { withQuery } from './query';

/** `/assets`, as published on 2026-10-03. Each operation is defined once here
 *  (spec 017 FR-003). Responses stay `unknown` until a mapper reads them
 *  against the live field record (plan D15). */

export type AssetStockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ApiOffice = 'Cebu' | 'Bacolod' | 'Makati' | 'Ortigas' | 'Davao';

export type ListAssetsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: ApiAssetCategory;
  /** Scopes `quantity` and `stockLevel` to one office. */
  location?: ApiOffice;
  stockLevel?: AssetStockLevel;
};

/** `GET /assets`. Added by BEN-156; reused by BEN-161. The page also carries
 *  `counts` (`readAssetCounts`). */
export function listAssets(params: ListAssetsParams): Promise<unknown> {
  return apiRequest(withQuery('/assets', params));
}

/** `GET /assets/:id`. `quantity` is across all offices. */
export function getAsset(id: string): Promise<unknown> {
  return apiRequest(`/assets/${encodeURIComponent(id)}`);
}

type SpecFields = {
  ram?: string;
  storage?: string;
  processor?: string;
  graphics?: string;
  operatingSystem?: string;
};

export type CreateAssetBody = SpecFields & {
  name: string;
  category: ApiAssetCategory;
  model: string;
  description?: string;
  imageBase64?: string;
  lowQtyAlert?: number;
};

/** On update a nullable field is cleared with `null`; an absent one is left. */
export type UpdateAssetBody = {
  name?: string;
  category?: ApiAssetCategory;
  model?: string;
  lowQtyAlert?: number;
  imageBase64?: string | null;
  description?: string | null;
} & { [K in keyof SpecFields]?: string | null };

/** `POST /assets`. No quantity: units are added on Inventory. */
export function createAsset(body: CreateAssetBody): Promise<unknown> {
  return apiRequest('/assets', { method: 'POST', body });
}

/** `PATCH /assets/:id`. Partial; quantity is not writable. */
export function updateAsset(id: string, body: UpdateAssetBody): Promise<unknown> {
  return apiRequest(`/assets/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

/** One published asset, as `GET /assets` rows, `GET /assets/:id` and the
 *  create and update responses carry it (Swagger, 2026-10-03). The counts are
 *  of the asset's units by status, at the office the list was scoped to or
 *  across all offices: `quantity` is Available, `totalQuantity` is Available +
 *  Reserved, and Assigned units are not in it (constitution III). */
export type ApiAsset = {
  id: string;
  name: string;
  category: ApiAssetCategory;
  model?: string;
  description?: string;
  imageBase64?: string;
  lowQtyAlert: number;
  quantity: number;
  reservedQuantity: number;
  assignedQuantity: number;
  totalQuantity: number;
  ram?: string;
  storage?: string;
  processor?: string;
  graphics?: string;
  operatingSystem?: string;
};

export function readAsset(value: unknown): ApiAsset {
  const what = 'asset';
  const body = record(value, what);
  const category = str(body, 'category', what);
  if (!(API_ASSET_CATEGORIES as readonly string[]).includes(category)) throw new Error(`${what}: unpublished category ${category}`);
  return {
    id: id(body, 'id', what),
    name: str(body, 'name', what),
    category: category as ApiAssetCategory,
    model: optStr(body, 'model'),
    description: optStr(body, 'description'),
    imageBase64: optStr(body, 'imageBase64'),
    lowQtyAlert: num(body, 'lowQtyAlert', what),
    quantity: num(body, 'quantity', what),
    reservedQuantity: num(body, 'reservedQuantity', what),
    assignedQuantity: num(body, 'assignedQuantity', what),
    totalQuantity: num(body, 'totalQuantity', what),
    ram: optStr(body, 'ram'),
    storage: optStr(body, 'storage'),
    processor: optStr(body, 'processor'),
    graphics: optStr(body, 'graphics'),
    operatingSystem: optStr(body, 'operatingSystem'),
  };
}

/** `counts` on a `GET /assets` page: how many assets match the search,
 *  category and office in total and at each stock level. It ignores
 *  `stockLevel`, so it answers every stock chip at once (BEN-115, 2026-10-03). */
export type AssetCounts = { total: number; byStockLevel: Record<AssetStockLevel, number> };

const STOCK_LEVELS: readonly AssetStockLevel[] = ['in_stock', 'low_stock', 'out_of_stock'];

export function readAssetCounts(page: unknown): AssetCounts {
  const what = 'assets.counts';
  const counts = record(record(page, 'assets').counts, what);
  const levels = record(counts.byStockLevel, `${what}.byStockLevel`);
  return {
    total: num(counts, 'total', what),
    byStockLevel: Object.fromEntries(STOCK_LEVELS.map((level) => [level, num(levels, level, `${what}.byStockLevel`)])) as Record<
      AssetStockLevel,
      number
    >,
  };
}
