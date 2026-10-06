import { useMemo, useState, type ReactNode } from 'react';
import { RequestListCountContext } from './request-list-count';

/** Holds the request-list count for the session. Owns no request data — only
 *  the number the top bar shows. See `request-list-count.ts`. */
export function RequestListCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count, setCount }), [count]);
  return <RequestListCountContext value={value}>{children}</RequestListCountContext>;
}
