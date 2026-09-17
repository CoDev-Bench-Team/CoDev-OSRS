/** The shell's identity vocabulary.
 *
 *  These are SPA terms, not HTTP terms. Nothing here is a REST payload, a field
 *  name or an error code — spec 003 FR-004 and ARCHITECT.md §8 reserve those to
 *  the backend team. When the contract publishes, its shapes are mapped INTO
 *  these types by a new `SessionSource`; the shell keeps speaking this language. */

/** The human roles, one per user. A closed union, so an ad-hoc or elevated role
 *  cannot be expressed anywhere in the SPA (FR-005).
 *
 *  `admin` is the role the backend contract actually issues alongside
 *  `employee` — the published API models two roles, and an admin both decides
 *  on requests and fulfils them. Constitution II was amended to that two-role
 *  reality on 2026-09-17 (v1.3.0); ADR-0003 is superseded by ADR-0005.
 *
 *  `approver` and `supply_admin` remain because the separation they describe is
 *  still the product's process (docs/process-flow.md) and the seeded demo
 *  source exercises each stage independently. They are not issued by the
 *  contract. If the API ever splits `admin`, they are already here. */
export type Role = 'employee' | 'approver' | 'supply_admin' | 'admin';

export const ROLES: readonly Role[] = ['employee', 'approver', 'supply_admin', 'admin'];

/** What the account cluster needs to name the signed-in person, and nothing
 *  more. `initials` is carried rather than derived: a name is not reliably two
 *  words, and the design system's Avatar never renders a photograph. */
export type User = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  /** A token colour for the avatar. Optional — Avatar has its own default. */
  avatarColor?: string;
};

export type Session = {
  user: User;
  role: Role;
};

/** The shell's three states. `unknown` is the one that matters: it is why a
 *  signed-in user never sees a flash of the sign-in screen (FR-018). */
export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

/** Human-readable role names for the account cluster and navigation copy.
 *  The process flow's words, not invented ones (docs/process-flow.md). */
export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  approver: 'Approver',
  supply_admin: 'Supply Admin',
  admin: 'Admin',
};
