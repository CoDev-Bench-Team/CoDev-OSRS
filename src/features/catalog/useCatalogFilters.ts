import { useMemo, useState } from 'react';
import { CATEGORIES, type CatalogItem, type Category } from './types';

/** The chip shown first. Not a category — selecting it clears the filter. */
export const ALL_CATEGORIES = 'All supplies';

export type CategoryFilter = Category | typeof ALL_CATEGORIES;

/** Every chip, in the order the design draws them: the all-items chip, then
 *  the contract's category enum. The row is fixed rather than derived from the
 *  returned items. The design draws every category whether or not it is
 *  stocked, and a fixed row does not reflow when the office changes (spec D6). */
export const CATEGORY_CHIPS: readonly CategoryFilter[] = [ALL_CATEGORIES, ...CATEGORIES];

/** Search over name, model and category, plus a category chip, applied
 *  together (FR-005 to FR-007). The design's placeholder reads "Search
 *  supplies by name or category", and the contract's own search matches name,
 *  model and category name, so this search matches the same three.
 *
 *  Both filters run client-side over the returned set. The contract accepts
 *  `search` and `category` parameters, and moving them server-side is what
 *  pagination (FR-018) will need, but that belongs with the contract-backed
 *  source rather than here. */
export function useCatalogFilters(items: CatalogItem[]) {
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return items.filter((i) => {
      const matchesCategory = category === ALL_CATEGORIES || i.category === category;
      const matchesTerm =
        needle === '' ||
        i.name.toLowerCase().includes(needle) ||
        i.model.toLowerCase().includes(needle) ||
        i.category.toLowerCase().includes(needle);
      return matchesCategory && matchesTerm;
    });
  }, [items, term, category]);

  /** Clearing the category keeps the search term (Story 2 AC5). */
  const clearCategory = () => setCategory(ALL_CATEGORIES);
  const clearAll = () => {
    setTerm('');
    setCategory(ALL_CATEGORIES);
  };

  return {
    term,
    setTerm,
    category,
    setCategory,
    visible,
    clearCategory,
    clearAll,
    filtered: term !== '' || category !== ALL_CATEGORIES,
  };
}
