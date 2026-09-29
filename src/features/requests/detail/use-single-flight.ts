import { useCallback, useRef, useState } from 'react';

/** Runs one async action at a time (spec 012 FR-008, FR-018).
 *
 *  `busy` drives the disabled buttons. The ref is what actually guarantees
 *  one send: a second press can land before the re-render disables anything,
 *  and state set in the first press is not visible to it yet. A dropped call
 *  resolves to `undefined`, so the caller knows to do nothing. */
export function useSingleFlight() {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);
  return [busy, run] as const;
}
