import type { StockStatus } from '../../shared/ui';
import {
  ApiProblemError,
  assetImageSrc,
  createAsset,
  listAssets,
  readAllPages,
  readAsset,
  readAssetCounts,
  readPage,
  updateAsset,
  type ApiAsset,
  type AssetStockLevel,
  type UpdateAssetBody,
} from '../../shared/api';
import type { ValidationProblem } from '../../shared/validation';
import type { AssetSource } from './asset-source';
import { SPEC_KEYS, type Asset, type AssetDraft, type Category } from './types';
import type { RemoteTablePage, RemoteTableQuery } from './useRemoteTableQuery';
import { ALL_CATEGORIES } from './table-query';

/** Assets over `/assets` (spec 017 Story 7). The unit counts are the API's,
 *  read across all offices (FR-041). */

const LEVEL: Record<StockStatus, AssetStockLevel> = {
  'In Stock': 'in_stock',
  'Low Stock': 'low_stock',
  'Out of Stock': 'out_of_stock',
};

/** The last version of each asset this source read, so an update sends only
 *  what changed (FR-042). Memory only. */
const seen = new Map<string, Asset>();

function toAsset(asset: ApiAsset): Asset {
  const read: Asset = {
    id: asset.id,
    name: asset.name,
    category: asset.category as Category,
    model: asset.model,
    description: asset.description,
    image: (asset.imageBase64 && assetImageSrc(asset.imageBase64)) || undefined,
    specs: Object.fromEntries(SPEC_KEYS.flatMap((key) => (asset[key] ? [[key, asset[key]]] : []))),
    lowStockThreshold: asset.lowQtyAlert,
    available: asset.quantity,
    reserved: asset.reservedQuantity,
    assigned: asset.assignedQuantity,
    total: asset.totalQuantity,
  };
  seen.set(read.id, read);
  return read;
}

/** Keep only the entries that differ from the asset as last read. Nothing is
 *  dropped when the asset was never read. */
function changedOnly(id: string, body: UpdateAssetBody): UpdateAssetBody {
  const before = seen.get(id);
  if (!before) return body;
  const was: Record<string, unknown> = {
    name: before.name,
    category: before.category,
    model: before.model,
    lowQtyAlert: before.lowStockThreshold,
    imageBase64: before.image ?? null,
    description: before.description ?? null,
    ...Object.fromEntries(SPEC_KEYS.map((key) => [key, before.specs[key] ?? null])),
  };
  return Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== was[key])) as UpdateAssetBody;
}

/** The API's field pointers, in `AssetDraft` terms, so the form puts each
 *  message under its field. */
const POINTER: Record<string, string> = {
  '#/imageBase64': '#/image',
  '#/lowQtyAlert': '#/lowStockThreshold',
  ...Object.fromEntries(SPEC_KEYS.map((key) => [`#/${key}`, `#/specs/${key}`])),
};

/** A `400` with field errors becomes the form's `ValidationProblem`. Anything
 *  else is rethrown as it came. */
function asFormRefusal(error: unknown): never {
  if (error instanceof ApiProblemError && error.status === 400 && error.problem.errors?.length) {
    const problem: ValidationProblem = {
      type: 'validation-error',
      title: error.problem.title ?? 'Validation Failed',
      status: 400,
      errors: error.problem.errors.map((entry) => ({ detail: entry.detail, pointer: POINTER[entry.pointer] ?? entry.pointer })),
    };
    throw problem;
  }
  throw error;
}

/** The image as the contract carries it: the data URI the form holds. */
const image = (draft: AssetDraft) => draft.image;

export const apiAssetSource: AssetSource = {
  async list() {
    const rows = await readAllPages<unknown>((page, limit) => listAssets({ page, limit }));
    return rows.map((row) => toAsset(readAsset(row)));
  },

  /** One read: the page's rows and, from the same body, every chip's count
   *  (`counts` follows the search and category but not the chip). The counts
   *  ride along on every page, so `withCounts` costs nothing either way. */
  async page(query: RemoteTableQuery<StockStatus>): Promise<RemoteTablePage<Asset, StockStatus>> {
    const body = await listAssets({
      search: query.search.trim() || undefined,
      category: query.category === ALL_CATEGORIES ? undefined : (query.category as Category),
      stockLevel: query.status ? LEVEL[query.status] : undefined,
      page: query.page,
      limit: query.pageSize,
    });
    const read = readPage<unknown>(body);
    if (!read) throw new Error('assets: not a page');
    const counts = readAssetCounts(body);
    return {
      rows: read.data.map((row) => toAsset(readAsset(row))),
      total: read.total,
      counts: {
        all: counts.total,
        of: Object.fromEntries(Object.entries(LEVEL).map(([status, level]) => [status, counts.byStockLevel[level]])),
      },
    };
  },

  async create(draft) {
    try {
      return toAsset(
        readAsset(
          await createAsset({
            name: draft.name,
            category: draft.category,
            // The API requires a model on every category (contracts conflict 9);
            // a form without one is refused, and the refusal is shown.
            model: draft.model ?? '',
            description: draft.description,
            imageBase64: image(draft),
            lowQtyAlert: draft.lowStockThreshold,
            ...draft.specs,
          }),
        ),
      );
    } catch (error) {
      asFormRefusal(error);
    }
  },

  async update(id, draft) {
    const body: UpdateAssetBody = {
      name: draft.name,
      category: draft.category,
      model: draft.model,
      lowQtyAlert: draft.lowStockThreshold,
      // A cleared field is sent as `null`, which the API clears.
      imageBase64: image(draft) ?? null,
      description: draft.description ?? null,
      ...Object.fromEntries(SPEC_KEYS.map((key) => [key, draft.specs[key] ?? null])),
    };
    try {
      return toAsset(readAsset(await updateAsset(id, changedOnly(id, body))));
    } catch (error) {
      asFormRefusal(error);
    }
  },
};
