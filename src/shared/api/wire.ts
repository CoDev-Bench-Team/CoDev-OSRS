/** Small, strict readers for published response bodies. A field the screens
 *  need that is missing or mistyped makes the read throw, so the screen shows
 *  its error state; nothing is invented to fill the gap (constitution VII). */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function record(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${what}: not an object`);
  return value;
}

export function str(body: Record<string, unknown>, key: string, what: string): string {
  const value = body[key];
  if (typeof value !== 'string') throw new Error(`${what}: ${key} is not a string`);
  return value;
}

export function num(body: Record<string, unknown>, key: string, what: string): number {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${what}: ${key} is not a number`);
  return value;
}

/** An id the API publishes as a number, carried as a string in the screens. */
export function id(body: Record<string, unknown>, key: string, what: string): string {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value) return value;
  throw new Error(`${what}: ${key} is not an id`);
}

/** Optional text: absent, `null` and blank all read as `undefined`. */
export function optStr(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function optNum(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
