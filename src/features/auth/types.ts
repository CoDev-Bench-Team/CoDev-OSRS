/** The shell's identity vocabulary.
 *
 *  These are SPA terms, not HTTP terms. Nothing here is a REST payload, a field
 *  name or an error code — spec 003 FR-004 and ARCHITECT.md §8 reserve those to
 *  the backend team. When the contract publishes, its shapes are mapped INTO
 *  these types by a new `SessionSource`; the shell keeps speaking this language. */

/** Constitution II: three human roles, one per user. A closed union, so a
 *  combined or elevated role cannot be expressed anywhere in the SPA (FR-005). */
export type Role = 'employee' | 'approver' | 'supply_admin';

export const ROLES: readonly Role[] = ['employee', 'approver', 'supply_admin'];

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
};
