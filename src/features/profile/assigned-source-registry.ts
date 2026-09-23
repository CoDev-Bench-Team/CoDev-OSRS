import type { AssignedEquipmentSource } from './assigned-source';

/** Which assigned-equipment source is active — or none.
 *
 *  `null` IS spec 006 state (c): the backend exposes no assigned equipment, so
 *  `Currently Assigned` is not rendered at all. That is the production answer
 *  today, because the published contract has no such resource. When it does, a
 *  contract-backed source is returned here and the page does not change.
 *
 *  In development only, `?assigned=items|empty|loading|failing` on `/profile`
 *  selects a stub so states (a) and (b), loading and failure can be reached
 *  without a backend (FR-010 as amended 2026-09-23). The guard is the literal
 *  `import.meta.env.DEV`, which Vite replaces with `false` in a production
 *  build, so the branch and the stub's chunk are dropped from the bundle. */
export async function resolveAssignedSource(search: string): Promise<AssignedEquipmentSource | null> {
  if (import.meta.env.DEV) {
    const mode = new URLSearchParams(search).get('assigned');
    if (mode) {
      const { stubSource } = await import('./dev/assigned-stub');
      return stubSource(mode);
    }
  }
  return null;
}
