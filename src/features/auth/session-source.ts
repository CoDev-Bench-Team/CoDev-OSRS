/** The session boundary (spec 003 D3, FR-002, FR-003).
 *
 *  Everything the shell knows about who is signed in comes through this one
 *  interface, and the interface is expressed in the SPA's own vocabulary —
 *  `Session`, `User`, `Role`. There is no endpoint here, no payload shape and
 *  no error code, because `ARCHITECT.md` §8 reserves the REST contract to the
 *  backend team and constitution VII forbids inventing one here (FR-004).
 *
 *  Today `seeded-source.ts` satisfies it. When the contract publishes, a second
 *  implementation is written against it and nothing else in the shell changes.
 */

/** The three human roles of constitution II, as a closed union. There is no
 *  combined "Admin" *role*: the design file's Admin surface merges Approver and
 *  Supply Admin, and ADR-0003 refuses that merge where it counts — in what a
 *  signed-in person is allowed to do. A person holds exactly one role, and
 *  changing it takes a full sign-out and sign-in (FR-005, D5). */
export const ROLES = ['employee', 'approver', 'supply_admin'] as const;
export type Role = (typeof ROLES)[number];

/** How a role is named on screen.
 *
 *  The Supply Admin's cluster reads "Admin" because that is what the drawn top
 *  bar says (figma 88:22832) and the project owner asked for that bar verbatim
 *  on 2026-09-15. It is a caption, not a role: `Role` is still the closed union
 *  below, the guards still authorize against `supply_admin`, and no approval
 *  action is reachable from it — which is what constitution II and ADR-0003
 *  actually forbid collapsing. Recorded in docs/design-system/additions.md;
 *  restoring "Supply Admin" is this one line. */
export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  approver: 'Approver',
  supply_admin: 'Admin',
};

export type User = {
  id: string;
  name: string;
  email: string;
  /** Two letters on a flat colour. The design system never shows a photo. */
  initials: string;
  role: Role;
};

export type Session = { user: User; role: Role };

export interface SessionSource {
  /** Resolve an existing session, or `null` when there is none. Never throws
   *  for "not signed in" — that is a `null`, not a failure. */
  current(): Promise<Session | null>;
  /** Establish a session. Rejects when sign-in is refused, so a refusal can
   *  never be mistaken for a signed-out success (FR-003b). Takes no argument:
   *  the SPA does not choose a role, and implements no authentication of its
   *  own (FR-003a). */
  signIn(): Promise<Session>;
  signOut(): Promise<void>;
  /** Fires when the session may have changed elsewhere — another tab signing
   *  out, or a role change (FR-017a, FR-017b). Returns its own unsubscribe. */
  subscribe(onChange: () => void): () => void;
}
