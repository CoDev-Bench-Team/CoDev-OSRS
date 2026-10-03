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
