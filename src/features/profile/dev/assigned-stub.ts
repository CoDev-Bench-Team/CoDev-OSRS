import type { AssignedEquipmentSource, AssignedItem } from '../assigned-source';

/** DEVELOPMENT ONLY — never imported outside the `import.meta.env.DEV` branch
 *  in `assigned-source-registry.ts`, so it is absent from the production build.
 *
 *  It exists to reach spec 006 states (a) and (b), loading and failure while the
 *  backend exposes no assigned equipment (FR-010 as amended 2026-09-23). The
 *  rows are deliberately synthetic, not the design's laptop, mouse and phone,
 *  so no one mistakes them for real units. One row has no tag and one has no
 *  date, to exercise the partial-row edge case. */
const STUB_ITEMS: AssignedItem[] = [
  { id: 'stub-a', name: 'Stub item A', tag: 'STUB-0001', assignedOn: '2026-01-14' },
  { id: 'stub-b', name: 'Stub item B (no tag)', assignedOn: '2026-03-02' },
  { id: 'stub-c', name: 'Stub item C (no date)', tag: 'STUB-0003' },
];

/** Marks this module's code. `scripts/check-profile-build.mjs` reads this value
 *  from this file and fails the build gate if it appears in `dist/` — so it
 *  must stay a string literal, and it must stay USED (below), or the gate could
 *  never see a leak (FR-010). */
export const DEV_STUB_SENTINEL = 'osrs-profile-dev-stub';

const LOADING_MS = 2000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** `null` for an unknown mode, which renders the production state (c). */
export function stubSource(mode: string): AssignedEquipmentSource | null {
  switch (mode) {
    case 'items':
      return { assignedToMe: async () => STUB_ITEMS };
    case 'empty':
      return { assignedToMe: async () => [] };
    case 'loading':
      return {
        assignedToMe: async () => {
          await delay(LOADING_MS);
          return STUB_ITEMS;
        },
      };
    case 'failing':
      return { assignedToMe: () => Promise.reject(new Error(`${DEV_STUB_SENTINEL}: stubbed failure`)) };
    default:
      return null;
  }
}
