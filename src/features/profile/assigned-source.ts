/** One piece of equipment assigned to the signed-in user, in SPA vocabulary.
 *
 *  Every field but the name is optional: a row renders what it was given and
 *  never invents a value; a missing date is stated in words (spec 006 Edge
 *  Cases, FR-009). */
export type AssignedItem = {
  id: string;
  name: string;
  tag?: string;
  /** Calendar date, `YYYY-MM-DD`. */
  assignedOn?: string;
};

/** The assigned-equipment boundary (spec 006; mirrors spec 003's
 *  `SessionSource`).
 *
 *  No endpoint, payload or error code: the published contract exposes no
 *  assigned equipment, and this feature does not invent one (constitution VII).
 *  When the backend publishes it, an implementation is written against it and
 *  registered in `assigned-source-registry.ts`; no page code changes.
 *
 *  There is deliberately no user parameter. The source answers for the
 *  signed-in user only (FR-006), as the contract's current-user resource does.
 *
 *  `assignedToMe()` REJECTS when the list cannot be retrieved — it never
 *  resolves `[]` to mean failure. "Nothing assigned" and "could not find out"
 *  are different facts and the page shows them differently (FR-008, FR-011). */
export interface AssignedEquipmentSource {
  assignedToMe(): Promise<AssignedItem[]>;
}
