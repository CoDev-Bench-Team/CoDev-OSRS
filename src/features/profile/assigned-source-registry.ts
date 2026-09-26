import type { AssignedEquipmentSource } from './assigned-source';

/** Which assigned-equipment source is active — or none.
 *
 *  `null` IS spec 006 state (c): the backend exposes no assigned equipment, so
 *  `Currently Assigned` is not rendered at all. That is the production answer
 *  today, because the published contract has no such resource. When it does, a
 *  contract-backed source is returned here and the page does not change.
 *
 *  `?assigned=items|empty|loading|failing` on `/profile` selects a stub so
 *  states (a) and (b), loading and failure can be reached without a backend —
 *  locally, on deploy previews and in production (FR-010 as amended
 *  2026-09-23, second amendment). It is opt-in only: without the parameter this
 *  returns `null` exactly as before. The stub is a dynamic `import()`, so it is
 *  its own chunk and a normal visit never downloads it; `check-profile-build`
 *  fails if it is ever folded into the main bundle. */
export async function resolveAssignedSource(search: string): Promise<AssignedEquipmentSource | null> {
  const mode = new URLSearchParams(search).get('assigned');
  if (!mode) return null;
  const { stubSource } = await import('./dev/assigned-stub');
  return stubSource(mode);
}
