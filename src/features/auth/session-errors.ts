/** The shell's existing refusal, used when a problem has neither detail nor title. */
export const SIGN_IN_REFUSAL = 'Sign-in did not succeed. Please try again.';

/** No API base is configured, and there is no seeded session to fall back on
 *  (spec 017 FR-001a). */
export const API_NOT_CONFIGURED = 'The API is not configured. Set VITE_API_BASE_URL and reload.';

/** A sign-in refusal. `sessionNotice` is the published problem text, or
 *  `SIGN_IN_REFUSAL` when the body has neither detail nor title. */
export class SessionRefusal extends Error {
  readonly sessionNotice: string;

  constructor(sessionNotice: string) {
    super(sessionNotice);
    this.name = 'SessionRefusal';
    this.sessionNotice = sessionNotice;
  }
}
