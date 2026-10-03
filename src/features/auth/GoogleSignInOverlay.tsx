import { useEffect, useRef, useState } from 'react';
import type { GoogleButtonSource } from './google-button-source';

/** Google's real sign-in button, under the drawn 242×64 pill.
 *
 *  The pill paints over this frame, so the visitor sees the drawing and not
 *  Google's own border and label. The pill does not take the click; this
 *  frame does. Fading the frame does not hide it in every browser, which is
 *  why the pill has to cover it.
 *
 *  Google's button is 40px tall and sits at the top of the pill, so the
 *  padding under the label is not part of it. The button itself is stretched
 *  to the pill: the click has to land on Google's element, and a cover in
 *  front of it drops the press. A scale transform on the frame makes the
 *  on-screen box disagree with the size Google rendered, and after a few
 *  seconds Google then refuses the click. Zoom grows the frame's own box to
 *  the pill instead. Each piece is fitted once: writing the size again makes
 *  the observer that watches it loop.
 *
 *  The credential arrives through `onGoogleCredential`. This overlay does not
 *  start sign-in on the press, or the screen says "Signing in…" before Google
 *  has opened anything. */

const PILL_HEIGHT = 64;
const fittedFrames = new WeakSet<HTMLIFrameElement>();
const fittedButtons = new WeakSet<HTMLElement>();

/** Grow Google's own box until it fills the pill. The height is read once,
 *  before the fit changes it. */
function fitGoogleFrame(container: HTMLElement): void {
  const frame = container.querySelector('iframe');
  if (frame instanceof HTMLIFrameElement && !fittedFrames.has(frame)) {
    const height = frame.offsetHeight;
    if (height >= 32 && height <= 56) {
      frame.style.setProperty('zoom', (PILL_HEIGHT / height).toFixed(4));
      fittedFrames.add(frame);
    }
  }

  const button = container.querySelector('[role="button"]');
  if (!(button instanceof HTMLElement) || fittedButtons.has(button)) return;
  const height = button.offsetHeight;
  if (height < 32 || height > 56) return;
  button.style.setProperty('height', `${PILL_HEIGHT}px`);
  let node = button.parentElement;
  while (node && node !== container) {
    if (node.offsetHeight > 0 && node.offsetHeight < PILL_HEIGHT) {
      node.style.setProperty('height', `${PILL_HEIGHT}px`);
    }
    node = node.parentElement;
  }
  fittedButtons.add(button);
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
