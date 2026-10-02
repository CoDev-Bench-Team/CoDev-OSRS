import type { Office } from '../../auth/types';
import type { InventorySource } from '../inventory-source';
import type { UnitRegister } from '../seeded-unit-register';

/** DEV-ONLY STUB. It is reached only through `inventory-source.ts`, behind
 *  `import.meta.env.DEV`, so a production build drops it.
 *
 *  `?inventory=<mode>` on `/inventory` reaches what the seed cannot:
 *
 *  - `failing`: every load fails, so the page shows its failure notice and
 *    **Try again** (spec 015 FR-015).
 *  - `recovers`: every load fails until `window.__recoverInventory()` is
 *    called, then succeeds, so **Try again** can be shown to reload. Not "fail
 *    once": StrictMode's second mount would load before the failure showed.
 *  - `slow`: the load is held until `window.__releaseInventory()` is called,
 *    so the loading state can be seen and checked.
 *  - `empty`: the register holds no unit; the table shows its empty state.
 *
 *  Each mode builds its own register, so a stubbed session never disturbs the
 *  shared one. */

declare global {
  interface OsrsDevHooks {
    /** The register's development-only reach (spec 015 plan P16). */
    inventory?: {
      /** Units of the asset at the office, by status. */
      counts(assetId: string, office: Office): { available: number; reserved: number; total: number; assigned: number; inactive: number };
      /** A request reserves the unit behind an open panel. */
      reserveBehind(unitId: string): void;
      /** The unit is removed elsewhere behind an open panel. */
      removeBehind(unitId: string): void;
      /** Answers the next save with this problem body, once. */
      refuseNext(problem: unknown): void;
    };
  }
  interface Window {
    __osrs?: OsrsDevHooks;
    /** Set by `?inventory=slow` while a load is held. */
    __releaseInventory?: () => void;
    /** Set by `?inventory=recovers`; lets later loads succeed. */
    __recoverInventory?: () => void;
    __inventoryRecovered?: boolean;
  }
}

export function installInventoryDevHooks(register: UnitRegister, source: { refuseNext(problem: unknown): void }) {
  window.__osrs = {
    ...window.__osrs,
    inventory: {
      counts(assetId, office) {
        const here = register.list().filter((u) => u.assetId === assetId && u.location === office);
        const count = (status: string) => here.filter((u) => u.status === status).length;
        const available = count('Available');
        const reserved = count('Reserved');
        return { available, reserved, total: available + reserved, assigned: count('Assigned'), inactive: count('Inactive') };
      },
      reserveBehind(unitId) {
        const unit = register.get(unitId);
        if (unit) register.replace({ ...unit, status: 'Reserved', assignedToId: undefined });
      },
      removeBehind(unitId) {
        register.remove(unitId, 'Removed elsewhere (dev hook)');
      },
      refuseNext: (problem) => source.refuseNext(problem),
    },
  };
}

export function inventoryStub(mode: string | null, fresh: () => InventorySource): InventorySource | null {
  switch (mode) {
    case 'failing': {
      const seeded = fresh();
      return { ...seeded, list: () => Promise.reject(new Error('inventory stub: load failed')) };
    }
    case 'recovers': {
      // The flag lives on window, not in this closure: StrictMode builds the
      // source twice in development, and either copy may be the one in use.
      const seeded = fresh();
      window.__inventoryRecovered = false;
      window.__recoverInventory = () => {
        window.__inventoryRecovered = true;
      };
      return {
        ...seeded,
        list: () => (window.__inventoryRecovered ? seeded.list() : Promise.reject(new Error('inventory stub: not yet recovered'))),
      };
    }
    case 'slow': {
      const seeded = fresh();
      return {
        ...seeded,
        list: () =>
          new Promise<void>((resolve) => {
            window.__releaseInventory = () => {
              window.__releaseInventory = undefined;
              resolve();
            };
          }).then(() => seeded.list()),
      };
    }
    case 'empty': {
      const seeded = fresh();
      return { ...seeded, list: () => new Promise((resolve) => setTimeout(() => resolve([]), 250)) };
    }
    default:
      return null;
  }
}
