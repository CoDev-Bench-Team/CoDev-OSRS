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

/** How many of the remaining pages `readAllPages` reads at once. */
const ALL_PAGES_PARALLEL = 4;

/** Read every page of a list, for a screen that draws no paging (catalog,
 *  My Requests, Profile). `fetchPage` gets a 1-based page and the limit and
 *  returns that page's body. The first page says how many there are; the
 *  rest are then read a few at a time, in parallel, and joined in page
 *  order. A list with a page missing is not the list, so any failed read
 *  rejects the whole. Rejects when a body is not the paged envelope. */
export async function readAllPages<T>(fetchPage: (page: number, limit: number) => Promise<unknown>): Promise<T[]> {
  const read = async (page: number) => {
    const body = readPage<T>(await fetchPage(page, ALL_PAGES_LIMIT));
    if (!body) throw new Error('The API returned a list that is not a published page.');
    return body;
  };
  const first = await read(1);
  if (first.totalPages <= 1 || first.data.length === 0) return first.data;
  const pages = [first];
  for (let next = 2; next <= first.totalPages; next += ALL_PAGES_PARALLEL) {
    const batch = Array.from({ length: Math.min(ALL_PAGES_PARALLEL, first.totalPages - next + 1) }, (_, i) => read(next + i));
    pages.push(...(await Promise.all(batch)));
  }
  return pages.flatMap((page) => page.data);
}
