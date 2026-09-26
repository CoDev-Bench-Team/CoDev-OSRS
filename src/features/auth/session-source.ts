import type { Session } from './types';

/** The session boundary (spec 003 D3, FR-002, FR-003).
 *
 *  Everything the shell knows about authentication is these four methods. There
 *  is no endpoint here, no payload, no error code — the interface is expressed
 *  entirely in the SPA's own vocabulary, which is what keeps FR-004 true while
 *  the backend contract is unpublished. Today `seeded-source.ts` satisfies it;
 *  when the contract publishes, a second implementation is written against it
 *  and no shell code changes.
 *
 *  `signIn()` REJECTS when authentication is refused — it never resolves to
 *  `null`. A refusal and a signed-out success are different outcomes and must
 *  never be confused (FR-003b). */
export interface SessionSource {
  /** Resolve the stored session reference into a session, or `null` when there
   *  is none and when the reference is stale. Called on every load, so a
   *  reference left behind on a shared device is revalidated, never trusted. */
  current(): Promise<Session | null>;

  /** Begin a session. The shell calls this from the designed Google control and
   *  never learns what happens inside. Rejects when sign-in is refused. */
  signIn(): Promise<Session>;

  /** End the session. Must also clear the stored reference. */
  signOut(): Promise<void>;

  /** Notify when the session may have changed elsewhere — another tab signing
   *  out (FR-017a), or a role change behind the boundary (FR-017b). The shell
   *  responds by re-resolving through `current()`; the callback carries no
   *  session, so no authorization fact travels on this channel. */
  subscribe(listener: () => void): () => void;
}

/** A demo affordance, deliberately NOT part of `SessionSource`.
 *
 *  A source that authenticates nobody has to be told whom to sign in as, and a
 *  tester has to be able to reach both roles to exercise SC-001 and
 *  SC-003. A source backed by the real contract authenticates a real person, so
 *  it implements none of this and the chooser disappears from the sign-in
 *  screen on its own — see `hasDemoAccounts()`. */
export interface DemoAccountSource {
  accounts(): readonly DemoAccount[];
  /** The account id `signIn()` will resolve to. */
  selected(): string;
  select(id: string): void;
}

export type DemoAccount = {
  id: string;
  label: string;
  detail: string;
  /** Selecting this one makes `signIn()` reject, so a refusal (FR-003b) can be
   *  demonstrated without a backend that can refuse. */
  refuses?: boolean;
};

export function hasDemoAccounts(source: SessionSource): source is SessionSource & DemoAccountSource {
  return typeof (source as Partial<DemoAccountSource>).accounts === 'function';
}
