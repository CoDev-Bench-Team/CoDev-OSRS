import { seededAssetSource } from '../assets/seeded-asset-source';
import { inventoryStub, installInventoryDevHooks } from './dev/inventory-stub';
import { createSeededInventorySource } from './seeded-inventory-source';
import { createUnitRegister, unitRegister } from './seeded-unit-register';
import { seededUserDirectory } from './seeded-user-directory';
import type { UnitBatchDraft, UnitDetail, UnitDraft, UnitRow } from './types';

/** The Inventory boundary (spec 015 plan P2, P4).
 *
 *  No endpoint, payload or error code lives behind this name. The published
 *  `/inventory-items` cannot carry the screen yet — no assignee on read, no
 *  purchase request, no upload, secrets on the employee's reads (contracts conflict 11) — so
 *  today's only implementation is seeded. A contract-backed one replaces it
 *  here and no page changes.
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
  get(id: string): Promise<UnitDetail>;
  create(draft: UnitDraft): Promise<UnitDetail>;
  /** All or nothing (FR-010). */
  createBatch(draft: UnitBatchDraft): Promise<UnitRow[]>;
  update(id: string, draft: UnitDraft): Promise<UnitDetail>;
  /** The reason is kept by the seeded source; the contract's removal takes
   *  none, so a contract-backed source drops it (spec 015 D10, G2). */
  remove(id: string, reason: string): Promise<void>;
}

/** A refusal that names no field: an unknown unit (404) or a conflict (409),
 *  as an RFC 9457 problem body. */
export type UnitProblem = { title: string; status: 404 | 409; detail: string };

export function isUnitProblem(value: unknown): value is UnitProblem {
  if (typeof value !== 'object' || value === null) return false;
  const { status, detail } = value as { status?: unknown; detail?: unknown };
  return (status === 404 || status === 409) && typeof detail === 'string';
}

const shared = createSeededInventorySource(unitRegister, seededAssetSource, seededUserDirectory);
if (import.meta.env.DEV) installInventoryDevHooks(unitRegister, shared);

/** Which source Inventory reads: the seeded one, over the register Assets
 *  also counts from (plan P3).
 *
 *  On the dev server only, `?inventory=<mode>` builds a stub over a FRESH
 *  register to reach what the seed cannot (`dev/inventory-stub.ts`).
 *  `import.meta.env.DEV` is `false` in a production build, so the branch and
 *  the stub are dropped. */
export function inventorySource(search: string): InventorySource {
  if (import.meta.env.DEV) {
    const stub = inventoryStub(new URLSearchParams(search).get('inventory'), () =>
      createSeededInventorySource(createUnitRegister(), seededAssetSource, seededUserDirectory),
    );
    if (stub) return stub;
  }
  return shared;
}
