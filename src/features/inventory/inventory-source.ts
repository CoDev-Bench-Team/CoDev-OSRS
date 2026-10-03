import { apiInventorySource } from './api-inventory-source';
import type { RemoteTablePage, RemoteTableQuery } from '../assets/useRemoteTableQuery';
import type { AddStatus, UnitBatchDraft, UnitChip, UnitDetail, UnitDraft, UnitRow } from './types';

/** The Inventory boundary (spec 015 plan P2, P4).
 *
 *  No endpoint, payload or error code lives behind this name. The one
 *  implementation is `api-inventory-source.ts`, over the published
 *  `/inventory-items`; what that contract still lacks is in contracts
 *  conflict 11.
 *
 *  `get` is the only read that returns the BitLocker Identifier and Recovery
 *  Key/PIN: `UnitRow` has no field for either, so the table cannot render one
 *  (FR-002, SC-006).
 *
 *  A refusal rejects with the published `ValidationProblem` (400,
 *  `shared/validation.ts`), whose pointers name `UnitDraft` / `UnitBatchDraft`
 *  paths, or with a `UnitProblem` (404, 409) whose `detail` the panel shows
 *  verbatim. */
export interface InventorySource {
  /** Every unit, newest added first (FR-005). */
  list(): Promise<UnitRow[]>;
  /** One page of the table, asked of the API (spec 017 plan D1). */
  page(query: RemoteTableQuery<UnitChip>, withCounts: boolean): Promise<RemoteTablePage<UnitRow, UnitChip>>;
  /** What Add Single Unit offers. Absent: every add status (spec 015 D3). */
  readonly createStatuses?: readonly AddStatus[];
  get(id: string): Promise<UnitDetail>;
  create(draft: UnitDraft): Promise<UnitDetail>;
  /** All or nothing (FR-010). */
  createBatch(draft: UnitBatchDraft): Promise<UnitRow[]>;
  update(id: string, draft: UnitDraft): Promise<UnitDetail>;
  /** The reason is kept by the seeded source; the contract's removal takes
   *  none, so a contract-backed source drops it (spec 015 D10, G2). */
  remove(id: string, reason: string): Promise<void>;
}

/** A refusal that names no field: a business rule (400 with no field errors,
 *  such as an asset deleted meanwhile), an unknown unit (404) or a conflict
 *  (409), as an RFC 9457 problem body. */
export type UnitProblem = { title: string; status: 400 | 404 | 409; detail: string };

export function isUnitProblem(value: unknown): value is UnitProblem {
  if (typeof value !== 'object' || value === null) return false;
  const { status, detail } = value as { status?: unknown; detail?: unknown };
  return (status === 400 || status === 404 || status === 409) && typeof detail === 'string';
}

/** The published API (spec 017 Story 8). There is no seeded source and no
 *  dev stub. */
export function inventorySource(): InventorySource {
  return apiInventorySource;
}
