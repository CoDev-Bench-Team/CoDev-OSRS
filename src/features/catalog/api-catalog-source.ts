import { assetImageSrc, listAssets, readAllPages, readAsset } from '../../shared/api';
import type { CatalogSource } from './catalog-source';
import type { CatalogItem, CatalogOffice } from './types';

/** The catalog over `GET /assets?location=<office>` (spec 017 Story 1). Every
 *  page is read: the catalog draws no paging. Each row carries the specs, so
 *  View Specs reads the row and keeps its office-scoped quantity (FR-014); the
 *  single read's quantity is summed across offices and is not shown. */
export const apiCatalogSource: CatalogSource = {
  async items(office: CatalogOffice): Promise<CatalogItem[]> {
    const rows = await readAllPages<unknown>((page, limit) => listAssets({ location: office, page, limit }));
    return rows.map((row) => {
      const asset = readAsset(row);
      return {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        model: asset.model ?? asset.name,
        description: asset.description,
        image: (asset.imageBase64 && assetImageSrc(asset.imageBase64)) || undefined,
        specs: {
          ram: asset.ram,
          storage: asset.storage,
          processor: asset.processor,
          graphics: asset.graphics,
          operatingSystem: asset.operatingSystem,
        },
        available: asset.quantity,
        lowQtyAlert: asset.lowQtyAlert,
      };
    });
  },
};
