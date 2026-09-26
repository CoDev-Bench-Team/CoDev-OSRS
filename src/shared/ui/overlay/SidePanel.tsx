import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { dismissPopovers } from './popover-layer';
import { useScrollLock } from './scroll-lock';

/** The right-hand sheet the design draws over My Requests (`04.1`, `04.2`):
 *  full height, white, on the same 50% scrim as a modal.
 *
 *  It is a modal in everything but position, so it behaves like one. Focus
 *  moves in on open and is held there, Esc and a click on the scrim close it,
 *  and on close focus returns to whatever opened it — the row's View details
 *  link — so a keyboard user lands back where they were. Closing never
 *  navigates: the panel has no address of its own (spec 003, 2026-09-23).
 *
 *  It slides in from the right over a fading scrim and slides back out before
 *  `onClose` runs, so the caller unmounts it only once it has left the screen. */
/** Well past the longest exit animation (`--motion-fast`, 120ms). Raise it if a
 *  motion token ever outgrows it. */
const EXIT_BACKSTOP_MS = 400;

export function SidePanel({
  title,
  header,
  onClose,
  children,
  footer,
  dismissible = true,
}: {
  /** The dialog's accessible name, applied as `aria-label`. */
  title: string;
  /** What sits beside the close button — the request id and its pill. */
  header: ReactNode;
  /** Called once the exit animation has ended. The caller MUST unmount the
   *  panel here: until it does, the off-screen dialog still holds focus and
   *  answers Esc and Tab. */
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom of the sheet, outside the scrolling body. */
  footer?: ReactNode;
  /** `false` while the caller has work in flight that the panel must outlive —
   *  the Request List's submit (spec 008 FR-010). ✕, Esc and the scrim are
   *  ignored until it is `true` again, so the panel cannot unmount mid-submit.
   *  The ✕ stays in place, disabled, so the header does not reflow. */
  dismissible?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // The page behind the scrim stays put while the panel is open.
  useScrollLock();
  // The latest handler, read by the listeners below; they are installed once,
  // so focus is taken and returned exactly once per opening.
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });

  // Every way of closing — ✕, Esc, the scrim — starts the exit animation;
  // `onClose` runs when it ends. The timer is a backstop in case no
  // `animationend` arrives, so the panel can never get stuck open.
  const [leaving, setLeaving] = useState(false);
  const leave = useRef(() => {});
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    close.current();
  };
  useLayoutEffect(() => {
    leave.current = dismissible ? () => setLeaving(true) : () => {};
  });
  useEffect(() => {
    if (!leaving) return;
    const backstop = window.setTimeout(finish, EXIT_BACKSTOP_MS);
    return () => window.clearTimeout(backstop);
  }, [leaving]);

  useEffect(() => {
    dismissPopovers();
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        leave.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const focusable = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      // Nothing enabled — every control disabled while work is in flight: hold
      // focus on the dialog itself rather than let Tab reach the page behind.
      if (!focusable.length) {
        e.preventDefault();
        panel.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Focus can leave the panel without a Tab: a focused control that
      // unmounts drops it to <body>. Treat anywhere outside the panel like the
      // panel itself, so the next Tab comes back in rather than reaching the
      // page behind the scrim (aria-modal, FR-002).
      const active = document.activeElement;
      const outside = active === panel.current || !panel.current.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-backdrop">
      <div
        className={`absolute inset-0 bg-backdrop ${leaving ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'}`}
        aria-hidden="true"
        onClick={() => leave.current()}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (leaving && e.target === e.currentTarget) finish();
        }}
        className={`absolute inset-y-0 right-0 z-dialog flex w-full max-w-[400px] flex-col bg-surface-card outline-none ${leaving ? 'animate-sheet-out' : 'animate-sheet-in'}`}
      >
        <div className="flex items-center gap-12 border-b border-line-default px-20 py-18">
          <div className="flex min-w-0 flex-1 items-center gap-10">{header}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => leave.current()}
            disabled={!dismissible}
            className="inline-flex h-touch-target w-touch-target shrink-0 cursor-pointer items-center justify-center rounded-8 border-none bg-transparent text-ink-primary transition-osrs hover:text-ink-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* `bytesize:close`, as every panel in the file draws it: a 16px
                frame, a 14px cross at (1,1), 1px black round-capped stroke. */}
            <svg viewBox="0 0 16 16" className="size-16" fill="none" aria-hidden="true">
              <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-20 py-20">{children}</div>
        {footer ? <div className="flex flex-col gap-12 px-20 pb-20">{footer}</div> : null}
      </div>
    </div>
  );
}
