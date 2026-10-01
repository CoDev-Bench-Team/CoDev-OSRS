import type { UnitStatus } from '../../shared/ui';
import type { AddStatus, EditStatus } from './types';

/** The status rules, in one table the panels, the seeded source and the check
 *  all read (spec 015 plan P6; constitution 9.0.0 III).
 *
 *  Reserved is in neither option list: only a request transition moves a unit
 *  into or out of it (D2). */

const ADD: readonly AddStatus[] = ['Available', 'Assigned'];
const EDIT: readonly EditStatus[] = ['Available', 'Assigned', 'Inactive'];

/** What a Status control offers: on Add Single Unit, Available and Assigned
 *  (D3); on Review/Edit, Available, Assigned and Inactive (D4), or `null` —
 *  read-only — for a Reserved unit. */
export function statusOptions(mode: 'add'): readonly AddStatus[];
export function statusOptions(mode: 'edit', unit: { status: UnitStatus }): readonly EditStatus[] | null;
export function statusOptions(mode: 'add' | 'edit', unit?: { status: UnitStatus }): readonly (AddStatus | EditStatus)[] | null {
  if (mode === 'add') return ADD;
  return unit?.status === 'Reserved' ? null : EDIT;
}

type Assignable<S extends string> = { status?: S; assignedToId?: string };

/** Available and Inactive clear the User (FR-008). */
export function withStatus<S extends string, D extends Assignable<S>>(draft: D, status: S): D {
  return status === 'Assigned' ? { ...draft, status } : { ...draft, status, assignedToId: undefined };
}

/** Picking a User sets Assigned. Clearing it leaves the status alone, so an
 *  Assigned unit with no User is refused on Save rather than silently
 *  released (spec 015 D4). */
export function withAssignee<D extends Assignable<string>>(draft: D, userId: string | undefined): D {
  return userId ? { ...draft, assignedToId: userId, status: 'Assigned' } : { ...draft, assignedToId: undefined };
}

export const ASSIGNED_REFUSAL =
  'This unit can’t be removed because it is assigned to a user. Remove assignment first before removing this unit.';
/** Ours; the file draws only the assigned refusal (spec 015 D9). */
export const RESERVED_REFUSAL = 'This unit can’t be removed because it is reserved for a request.';

/** Whether a unit may be removed: only one no one holds (FR-009). */
export function removal(unit: { status: UnitStatus }): { allowed: true } | { allowed: false; reason: string } {
  if (unit.status === 'Assigned') return { allowed: false, reason: ASSIGNED_REFUSAL };
  if (unit.status === 'Reserved') return { allowed: false, reason: RESERVED_REFUSAL };
  return { allowed: true };
}
