import { useMemo, useState } from 'react';
import type { CatalogItem } from './types';

/** The chip shown first. Not a type value — selecting it clears the filter. */
export const ALL_TYPES = 'All supplies';

/** Search over name and model, plus a type chip, applied together (FR-005 to
 *  FR-007).
 *
 *  Chips are derived from the types actually present in the returned catalog
 *  rather than hard-coded, so a contract enum change needs no edit here and an
 *  unexpected value is never unreachable. Both filters are client-side over the
 *  returned set: pushing them into query parameters would invent contract
 *  surface the published document does not describe. */
export function useCatalogFilters(items: CatalogItem[]) {
  const [term, setTerm] = useState('');
  const [type, setType] = useState<string>(ALL_TYPES);

  const types = useMemo(() => {
    const present = Array.from(new Set(items.map((i) => i.type))).sort((a, b) => a.localeCompare(b));
    return [ALL_TYPES, ...present];
  }, [items]);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return items.filter((i) => {
      const matchesType = type === ALL_TYPES || i.type === type;
      const matchesTerm =
        needle === '' ||
        i.name.toLowerCase().includes(needle) ||
        i.model.toLowerCase().includes(needle);
      return matchesType && matchesTerm;
    });
  }, [items, term, type]);

  /** Clearing the type keeps the search term (Story 2 AC5). */
  const clearType = () => setType(ALL_TYPES);
  const clearAll = () => {
    setTerm('');
    setType(ALL_TYPES);
  };

  return { term, setTerm, type, setType, types, visible, clearType, clearAll, filtered: term !== '' || type !== ALL_TYPES };
}
