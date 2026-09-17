import { useEffect, useRef, useState } from 'react';
import type { GoogleButtonSource } from './google-button-source';

/** Google's real sign-in button, invisible, laid exactly over the drawn one.
 *
 *  Two requirements pull in opposite directions and this is what satisfies
 *  both. The Linear requirements say to render a Google Sign-In button and let
 *  it invoke the configured callback — and testing showed that really is the
 *  only mechanism that works, because One Tap silently declines to appear. The
 *  design file specifies a 242x64 borderless pill that Google's button cannot
 *  be restyled into: it caps near 40px tall and draws its own border and type.
 *
 *  So Google's button is rendered, and covered. It sits on top at `opacity: 0`,
 *  stretched to the full 242x64, and receives every click in that area. What
 *  the visitor sees is the drawn control; what the browser clicks is Google's.
 *
 *  **Google's button is the real control, including for the keyboard.** The
 *  drawn one is made `inert` while this overlay is mounted, because a keyboard
 *  press on it could never open Google's popup — a synthetic click cannot reach
 *  into a cross-origin iframe — so it would open a credential request that
 *  nothing could ever satisfy, and hang until the timeout.
 *
 *  That leaves FR-023, which requires a visible focus indicator. A control at
 *  `opacity: 0` has none, so the overlay becomes visible while a KEYBOARD focus
 *  is inside it: a keyboard user sees Google's own button, with Google's own
 *  focus ring, and operates it directly.
 *
 *  Keyboard focus specifically — `:focus-visible`, not `:focus-within`. A mouse
 *  click also focuses the button, so `:focus-within` revealed the overlay on
 *  every click and the drawn pill appeared to "stretch" into Google's button
 *  mid-press. `:focus-visible` is the browser's own answer to "did this focus
 *  come from the keyboard", which is exactly the question being asked. */
export function GoogleSignInOverlay({ source, onPress }: { source: GoogleButtonSource; onPress: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [keyboardFocus, setKeyboardFocus] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let cancelled = false;
    void source.mountButton(container).catch(() => {
      // The drawn control underneath stays clickable, so a failed mount
      // degrades to a sign-in attempt that reports a plain refusal rather than
      // to a dead card.
      if (!cancelled) container.replaceChildren();
    });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-32"
      style={{ opacity: keyboardFocus ? 1 : 0 }}
      /** Capture phase, and `pointerdown` rather than `click`: the request for
       *  the credential has to be open BEFORE Google's button handles the press
       *  and opens its popup, or the callback arrives with nowhere to deliver. */
      onPointerDownCapture={onPress}
      onFocusCapture={(event) => setKeyboardFocus(event.target.matches(':focus-visible'))}
      onBlurCapture={() => setKeyboardFocus(false)}
    >
      <div
        ref={host}
        className="absolute top-1/2 left-1/2"
        /** Google's button is ~40px tall; the drawn pill is 64. Stretching the
         *  invisible overlay vertically makes the whole drawn area clickable
         *  instead of only a 40px band through its middle — distortion does not
         *  matter for something nobody sees. When a keyboard focus DOES reveal
         *  it, the stretch is dropped so Google's button is shown undistorted. */
        style={{
          width: 242,
          transform: `translate(-50%, -50%) scaleY(${keyboardFocus ? 1 : 1.6})`,
        }}
      />
    </div>
  );
}
