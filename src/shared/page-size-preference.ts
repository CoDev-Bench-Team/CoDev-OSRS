/** `Result per page`, remembered per table in this browser.
 *
 *  A per-viewer convenience only: storage can be blocked, cleared or throw
 *  (private windows, previews), so every read falls back to the default and
 *  every write is best-effort. A stored size the table no longer offers is
 *  ignored. */

export const DEFAULT_PAGE_SIZE = 10;

export type PagedTable = 'assets' | 'inventory' | 'queue' | 'history';

const key = (table: PagedTable) => `osrs.pageSize.${table}`;

export function readPageSize(table: PagedTable, sizes: readonly number[]): number {
  const fallback = sizes.includes(DEFAULT_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : sizes[0];
  try {
    const stored = Number(window.localStorage.getItem(key(table)));
    return sizes.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function savePageSize(table: PagedTable, size: number): void {
  try {
    window.localStorage.setItem(key(table), String(size));
  } catch {
    // Not remembered; the table still uses the size for this visit.
  }
}
