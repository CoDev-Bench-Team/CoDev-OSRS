/** A published paged list. */
export type ApiPage<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read `{ data, total, page, limit, totalPages }`. Returns null when the
 *  body is not that envelope. */
export function readPage<T>(body: unknown): ApiPage<T> | null {
  if (!isRecord(body) || !Array.isArray(body.data)) return null;
  const { total, page, limit, totalPages } = body;
  if (
    typeof total !== 'number' ||
    typeof page !== 'number' ||
    typeof limit !== 'number' ||
    typeof totalPages !== 'number'
  ) {
    return null;
  }
  return { data: body.data as T[], total, page, limit, totalPages };
}

/** The largest page the screens ask for. The contract publishes no maximum. */
export const ALL_PAGES_LIMIT = 100;

/** Read every page of a list, for a screen that draws no paging (catalog,
 *  My Requests, Profile). `fetchPage` gets a 1-based page and the limit and
 *  returns that page's body. Rejects when a body is not the paged envelope. */
export async function readAllPages<T>(fetchPage: (page: number, limit: number) => Promise<unknown>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; ; page += 1) {
    const read = readPage<T>(await fetchPage(page, ALL_PAGES_LIMIT));
    if (!read) throw new Error('The API returned a list that is not a published page.');
    rows.push(...read.data);
    if (page >= read.totalPages || read.data.length === 0) return rows;
  }
}
