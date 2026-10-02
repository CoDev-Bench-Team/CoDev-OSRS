/** The shell's existing refusal, used when a problem has neither detail nor title. */
export const SIGN_IN_REFUSAL = 'Sign-in did not succeed. Please try again.';

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
