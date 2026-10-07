import { apiSessionSource } from './api-session-source';
import type { Session } from './types';

/** The session boundary (spec 003 D3, FR-002, FR-003).
 *
 *  Everything the shell knows about authentication is these four methods. There
 *  is no endpoint here, no payload, no error code — the interface is expressed
 *  entirely in the SPA's own vocabulary, which is what keeps FR-004 true while
 *  the backend contract is unpublished. `api-session-source.ts` satisfies it
 *  against the published API; there is no seeded implementation (spec 017,
 *  Session 2026-10-03 second).
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
  signIn(credential?: string): Promise<Session>;

  /** End the session. Must also clear the stored reference. */
  signOut(): Promise<void>;

  /** Notify when the session may have changed elsewhere — another tab signing
   *  out (FR-017a), or a role change behind the boundary (FR-017b). The shell
   *  responds by re-resolving through `current()`; the callback carries no
   *  session, so no authorization fact travels on this channel. */
  subscribe(listener: () => void): () => void;
}

/** The published API session. There is no seeded session (spec 017 FR-001). */
export function selectSessionSource(): SessionSource {
  return apiSessionSource;
}
