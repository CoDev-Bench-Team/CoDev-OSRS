import type { SessionSource } from './session-source';

/** An optional capability of a `SessionSource`, the same shape as demo accounts.
 *
 *  A source backed by Google needs the visitor to press Google's own button,
 *  because that is the control that produces a credential. The seeded source
 *  does not. The sign-in screen asks whether the active source offers a button
 *  to mount, and carries no environment check of its own. */
export interface GoogleButtonSource {
  /** Render the provider's sign-in control into `container`. Rejects if the
   *  provider's script cannot be loaded. */
  mountButton(container: HTMLElement): Promise<void>;
}

export function hasGoogleButton(source: SessionSource): source is SessionSource & GoogleButtonSource {
  return typeof (source as Partial<GoogleButtonSource>).mountButton === 'function';
}
