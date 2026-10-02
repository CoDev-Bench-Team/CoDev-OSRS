import { useEffect, useRef, useState } from 'react';
import type { GoogleButtonSource } from './google-button-source';

/** Google's real sign-in button, under the drawn 242×64 pill.
 *
 *  The pill paints over this frame, so the visitor sees the drawing and not
 *  Google's own border and label. The pill does not take the click; this
 *  frame does. Fading the frame does not hide it in every browser, which is
 *  why the pill has to cover it.
 *
 *  Google's button is shorter than the pill. A scale transform makes the
 *  on-screen box disagree with the size Google rendered, and after a few
 *  seconds Google then refuses the click. Zoom grows the frame's own box to
 *  the pill instead. The frame is fitted once: writing zoom again makes the
 *  observer that watches it loop.
 *
 *  The credential arrives through `onGoogleCredential`. This overlay does not
 *  start sign-in on the press, or the screen says "Signing in…" before Google
 *  has opened anything. */

const PILL_HEIGHT = 64;
const fitted = new WeakSet<HTMLIFrameElement>();

/** Grow Google's own box until it fills the pill. The height is read once,
 *  before zoom changes it. */
function fitGoogleFrame(container: HTMLElement): void {
  const frame = container.querySelector('iframe');
  if (!(frame instanceof HTMLIFrameElement) || fitted.has(frame)) return;
  const height = frame.offsetHeight;
  if (height < 32 || height > 56) return;
  frame.style.setProperty('zoom', (PILL_HEIGHT / height).toFixed(4));
  fitted.add(frame);
}

export function GoogleSignInOverlay({
  source,
  onUnavailable,
}: {
  source: GoogleButtonSource;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
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
        if (cancelled) return;
        fitGoogleFrame(container);
        setPhase('ready');
      })
      .catch(() => {
        if (cancelled) return;
        container.replaceChildren();
        setPhase('failed');
        onUnavailable();
      });

    const observer = new MutationObserver(() => fitGoogleFrame(container));
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['style'] });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [source, onUnavailable]);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-32"
      onPointerDownCapture={() => {
        // A failed script load has no button yet. Retry the mount. The press
        // cannot open the chooser until a later press on the live button.
        if (phase !== 'failed') return;
        const container = host.current;
        if (!container) return;
        setPhase('loading');
        void source
          .mountButton(container)
          .then(() => {
            if (!alive.current) return;
            fitGoogleFrame(container);
            setPhase('ready');
          })
          .catch(() => {
            if (!alive.current) return;
            container.replaceChildren();
            setPhase('failed');
            onUnavailable();
          });
      }}
    >
      <div ref={host} className="relative h-full w-full" />
    </div>
  );
}
