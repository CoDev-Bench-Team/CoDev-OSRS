/** A catalog item, in product language.
 *
 *  Every field here is published by the Assets contract
 *  (`specs/001-office-supplies-mvp/contracts/README.md`). Nothing is invented,
 *  which is what keeps constitution VII true while the client is unwired.
 *
 *  Two published fields are deliberately absent. `location` is an office enum,
 *  and surfacing it would imply per-office stock the MVP does not model —
 *  multi-warehouse is an explicit product non-goal. `specs[]` has no slot on
 *  the drawn card. Both are recorded as D3 and D4 in `specs/005-catalog/spec.md`. */
export type CatalogItem = {
  id: string;
  name: string;
  model: string;
  /** The contract's `type`. Drives the filter chips. The checked-in mock's
   *  `category` is not a contract field and is not modelled (spec D2). */
  type: string;
  /** Optional: the contract's `imageBase64`, already resolved to something an
   *  `<img>` can take. The card falls back when it is absent. */
  image?: string;
  /** The contract's `quantity` — on-hand stock, the number FR-002 requires. */
  onHand: number;
  /** The contract's `lowQtyAlert` — the boundary for `Low Stock`. */
  lowQtyAlert: number;
};
