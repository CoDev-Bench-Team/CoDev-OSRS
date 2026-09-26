/** The shell's identity vocabulary.
 *
 *  These are SPA terms, not HTTP terms. Nothing here is a REST payload, a field
 *  name or an error code — spec 003 FR-004 and ARCHITECT.md §8 reserve those to
 *  the backend team. When the contract publishes, its shapes are mapped INTO
 *  these types by a new `SessionSource`; the shell keeps speaking this language. */

/** Constitution 3.0.0 II: two human roles, one per user (ADR-0005). The Admin
 *  both decides a request and fulfils it; `approver` and `supply_admin` are
 *  retired. A closed union, so an elevated or combined role cannot be
 *  expressed anywhere in the SPA (FR-005). */
export type Role = 'employee' | 'admin';

export const ROLES: readonly Role[] = ['employee', 'admin'];

/** A home office, in the published contract's own vocabulary — the current
 *  user's `location` enum, transcribed rather than invented (spec 006 D3). */
export type Office = 'Cebu' | 'Bacolod' | 'Makati' | 'Pasig' | 'Davao';

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
  /** The person's home office, shown on Profile. Optional: a user without one
   *  renders their email alone (spec 006 Edge Cases). A contract-backed source
   *  maps the contract's `location` into it. */
  office?: Office;
};

export type Session = {
  user: User;
  role: Role;
};

/** The shell's three states. `unknown` is the one that matters: it is why a
 *  signed-in user never sees a flash of the sign-in screen (FR-018). */
export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

/** Human-readable role names for the account cluster and navigation copy.
 *  The design file's words — its account cluster reads "Ethan Cruz — Admin". */
export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  admin: 'Admin',
};
