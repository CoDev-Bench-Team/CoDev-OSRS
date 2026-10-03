/** `path?a=1&b=2` from a typed parameter object. Only the keys a caller's type
 *  allows reach here, so a route cannot be sent a parameter it does not
 *  publish (spec 017 plan D12). Blank and absent values are left out. */
export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `${path}?${text}` : path;
}
