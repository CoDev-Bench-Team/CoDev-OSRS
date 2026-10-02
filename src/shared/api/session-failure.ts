/** Writes that return the person to sign-in on `401` or `403` and are not
 *  sent again. This module does not call them. */
export const SESSION_ENDING_WRITES = [
  { method: 'POST', path: '/requests' },
  { method: 'POST', path: '/requests/:id/receive' },
  { method: 'POST', path: '/requests/:id/sign' },
] as const;

const WRITE_PATTERNS = SESSION_ENDING_WRITES.map((entry) => ({
  method: entry.method,
  pattern: new RegExp(`^${entry.path.replaceAll(':id', '[^/]+')}$`),
}));

function pathname(path: string): string {
  const bare = path.split('?')[0] ?? path;
  return bare.startsWith('/') ? bare : `/${bare}`;
}

function isAuthCall(method: string, path: string): boolean {
  const target = pathname(path);
  return (method === 'POST' && target === '/auth/google') || (method === 'GET' && target === '/auth/me');
}

/** Auth reads and logout must not wake the session listener. Logout is the
 *  wake's own call; notifying it again would sign out forever. */
export function notifiesSessionEnded(method: string, path: string): boolean {
  const target = pathname(path);
  if (method === 'POST' && target === '/auth/logout') return false;
  return !isAuthCall(method, path);
}

export function isSessionEndingWrite(method: string, path: string): boolean {
  const target = pathname(path);
  return WRITE_PATTERNS.some((entry) => entry.method === method && entry.pattern.test(target));
}

/** `sign-in` returns the person to sign-in. `error` is shown on the screen.
 *  `none` is any other status. A `401` or `403` is never a retry. */
export function sessionFailure(status: number, method: string, path: string): 'sign-in' | 'error' | 'none' {
  if (status === 401) return 'sign-in';
  if (status === 403 && (isAuthCall(method, path) || isSessionEndingWrite(method, path))) return 'sign-in';
  if (status === 403) return 'error';
  return 'none';
}
