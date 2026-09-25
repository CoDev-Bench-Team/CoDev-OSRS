import type { User } from '../features/auth/types';

/** Request identifiers owned by the seeded employee, and nothing else.
 *
 *  This is NOT a request model. The shell holds no request data and invents no
 *  request contract — FR-004 and ARCHITECT.md §8 reserve that to the backend
 *  team, and FR-024 keeps request behavior out of this feature entirely.
 *
 *  What these ids are for is FR-012a. A request an Employee may not see and a
 *  request that does not exist have to produce the IDENTICAL response, or
 *  identifiers could be enumerated by reading the difference. Proving that
 *  needs three cases to exist: an id the employee owns, an id someone else
 *  owns, and an id nobody owns. The ids come from the design file's sample
 *  data; only ownership is modelled.
 *
 *  The real ownership decision belongs to the API. When the contract publishes,
 *  re-verify FR-012a against real identifiers before trusting it (plan 003,
 *  Known Risks). */
const OWNED_BY: Record<string, readonly string[]> = {
  'maya.santos': ['REQ-2026-1847', 'REQ-2026-1842', 'REQ-2026-1838', 'REQ-2026-1805', 'REQ-2026-1760', 'REQ-2026-1733'],
};

/** Since 2026-09-23 an Employee never reaches `/requests/:id` — the route's
 *  role guard refuses them before this runs, for every id alike, which keeps
 *  FR-012a's no-enumeration guarantee. The employee branch stays so the rule
 *  still holds if the screen is ever reused behind a looser guard.
 *
 *  Employees reach only their own requests; an Admin reaches any request
 *  regardless of status, with the actions on it still gated by status and role
 *  when those actions ship (D6, FR-009). */
export function mayViewRequest(user: User, requestId: string): boolean {
  if (user.role !== 'employee') return true;
  return (OWNED_BY[user.id] ?? []).includes(requestId);
}
