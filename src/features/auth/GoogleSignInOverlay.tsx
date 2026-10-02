import { useEffect, useRef, useState } from 'react';
import type { GoogleButtonSource } from './google-button-source';

/** Google's real sign-in button, invisible, laid over the drawn 242×64 pill.
 *
 *  Google's button cannot be restyled into that pill: it caps near 40px tall
 *  and draws its own border and type. It is rendered at `opacity: 0`, stretched
 *  to the full pill, and receives the click. A keyboard focus reveals it
 *  (`:focus-visible`) so the focus ring stays visible. A mouse click also
 *  focuses the button, and `:focus-within` would flash Google's button on every
 *  press, so the reveal is keyboard-only.
 *
 *  The credential request opens on `pointerdown` capture, before Google's
 *  button handles the press. A keyboard activation inside Google's iframe does
 *  not produce that event; `onGoogleCredential` delivers that credential. */
export function GoogleSignInOverlay({
  source,
  onPress,
  onUnavailable,
}: {
  source: GoogleButtonSource;
  onPress: () => void;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let cancelled = false;
    setPhase('loading');
    void source
      .mountButton(container)
      .then(() => {
        if (!cancelled) setPhase('ready');
      })
      .catch(() => {
        if (cancelled) return;
        container.replaceChildren();
        setPhase('failed');
        onUnavailable();
      });

    return () => {
      cancelled = true;
    };
  }, [source, onUnavailable]);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-32"
      style={{ opacity: keyboardFocus ? 1 : 0 }}
      onPointerDownCapture={() => {
        if (phase === 'ready') {
          onPress();
          return;
        }
        // The first press after a failed script load retries the mount. That
        // press cannot reach a button that is not in the document yet, so the
        // credential waiter stays closed until a later press on the live button.
        if (phase !== 'failed') return;
        const container = host.current;
        if (!container) return;
        setPhase('loading');
        void source
          .mountButton(container)
          .then(() => {
            if (alive.current) setPhase('ready');
          })
          .catch(() => {
            if (!alive.current) return;
            container.replaceChildren();
            setPhase('failed');
            onUnavailable();
          });
      }}
      onFocusCapture={(event) => {
        const target = event.target;
        setKeyboardFocus(target instanceof Element && target.matches(':focus-visible'));
      }}
      onBlurCapture={() => setKeyboardFocus(false)}
    >
      <div
        ref={host}
        className="absolute top-1/2 left-1/2"
        style={{
          width: 242,
          transform: `translate(-50%, -50%) scaleY(${keyboardFocus ? 1 : 1.6})`,
        }}
      />
    </div>
  );
}
