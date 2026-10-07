import type { useRemoteTableQuery } from './useRemoteTableQuery';

export const ALL_CATEGORIES = 'All categories';

/** Search, category, status chip and page over a table the API pages — the
 *  Assets toolbar (spec 014 Story 1) and Inventory's (spec 015 Story 1). */
export type TableQuery<S extends string = string, T = unknown> = ReturnType<typeof useRemoteTableQuery<T, S>>['query'];
