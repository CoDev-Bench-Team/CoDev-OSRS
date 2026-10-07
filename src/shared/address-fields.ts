import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

/** A screen's search and sort, mirrored in its address's query string, so
 *  they survive a reload and can be shared as a link.
 *
 *  The screen keeps its own state and is read from the address once, as it
 *  mounts (`fieldsFrom`). After that the screen leads: what it shows is
 *  written to the address, REPLACING the history entry, so typing a search
 *  does not push one entry per letter. A field at its default (`''`) is left
 *  out. Other parameters are kept.
 *
 *  The address leads only when it changes from outside the screen (a link to
 *  the bare address, Back): the screen is then told to show what it says.
 *  The address's own updates can land a beat behind fast typing, so every
 *  write is remembered until it lands, and a landing write is never mistaken
 *  for an outside change that would put an older search back. */

/** The named fields of a query string. A missing one is `''`. */
export function fieldsFrom<K extends string>(search: string, names: readonly K[]): Record<K, string> {
  const params = new URLSearchParams(search);
  return Object.fromEntries(names.map((name) => [name, params.get(name) ?? ''])) as Record<K, string>;
}

/** Keep `values` in the address, and hand an outside change to `apply`.
 *  `names` must be a module constant. */
export function useAddressFields<K extends string>(
  names: readonly K[],
  values: Record<K, string>,
  apply: (fromAddress: Record<K, string>) => void,
): void {
  const [params, setParams] = useSearchParams();
  const key = (fields: Record<K, string>) => JSON.stringify(names.map((name) => fields[name]));
  const inAddress = key(Object.fromEntries(names.map((name) => [name, params.get(name) ?? ''])) as Record<K, string>);
  const shown = key(values);

  /** Writes sent and not yet seen in the address, oldest first. */
  const pending = useRef<string[]>([]);
  const latest = useRef({ apply, inAddress, shown });
  useLayoutEffect(() => {
    latest.current = { apply, inAddress, shown };
  });

  // The address changed: one of our writes landing, or an outside change.
  useEffect(() => {
    // Writes can land merged (the router applies them in a transition), so
    // the latest matching one settles every write before it.
    const landed = pending.current.lastIndexOf(inAddress);
    if (landed >= 0) {
      pending.current = pending.current.slice(landed + 1);
      return;
    }
    if (inAddress === latest.current.shown) return;
    const fields = JSON.parse(inAddress) as string[];
    latest.current.apply(Object.fromEntries(names.map((name, i) => [name, fields[i] ?? ''])) as Record<K, string>);
  }, [inAddress, names]);

  // What the screen shows changed: write it.
  useEffect(() => {
    if (shown === latest.current.inAddress && pending.current.length === 0) return;
    if (pending.current[pending.current.length - 1] === shown) return;
    pending.current.push(shown);
    const fields = JSON.parse(shown) as string[];
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        names.forEach((name, i) => {
          const value = fields[i] ?? '';
          if (value) next.set(name, value);
          else next.delete(name);
        });
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [shown, names, setParams]);
}
