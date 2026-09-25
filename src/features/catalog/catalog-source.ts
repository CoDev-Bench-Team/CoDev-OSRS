import type { CatalogItem, CatalogOffice } from './types';

/** The catalog boundary (spec 005; mirrors spec 003's `SessionSource`).
 *
 *  Everything the page knows about where supplies come from is this one
 *  method. There is no endpoint here, no payload and no error code — the
 *  interface is expressed entirely in the SPA's own vocabulary, which is what
 *  keeps FR-012 true while the Assets contract is unwired. Today
 *  `seeded-source.ts` satisfies it; when the contract is wired, a second
 *  implementation is written against it and no page code changes.
 *
 *  `items(office)` reads every active asset with its availability scoped to
 *  that one office, which is the shape the published assets list offers
 *  (availability "scoped to a single office location"). Stock is a vector over
 *  offices (constitution III); the page asks for one component of it at a time.
 *
 *  It REJECTS when the catalog cannot be retrieved — it never resolves to an
 *  empty array to mean failure. An empty catalog and an unreachable one are
 *  different outcomes and the page shows them differently (FR-011). */
export interface CatalogSource {
  items(office: CatalogOffice): Promise<CatalogItem[]>;
}
