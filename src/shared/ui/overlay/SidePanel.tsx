import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { dismissPopovers } from './popover-layer';

/** The right-hand sheet the design draws over My Requests (`04.1`, `04.2`):
 *  full height, white, on the same 50% scrim as a modal.
 *
 *  It is a modal in everything but position, so it behaves like one. Focus
 *  moves in on open and is held there, Esc and a click on the scrim close it,
 *  and on close focus returns to whatever opened it — the row's View details
 *  link — so a keyboard user lands back where they were. Closing never
 *  navigates: the panel has no address of its own (spec 003, 2026-09-23). */
export function SidePanel({
  title,
  header,
  onClose,
  children,
  footer,
}: {
  /** Accessible name, and the id the heading is labelled by. */
  title: string;
  /** What sits beside the close button — the request id and its pill. */
  header: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom of the sheet, outside the scrolling body. */
  footer?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // The latest handler, read by the listeners below; they are installed once,
  // so focus is taken and returned exactly once per opening.
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    dismissPopovers();
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const focusable = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
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
      <div className="absolute inset-0 bg-backdrop" aria-hidden="true" onClick={() => close.current()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 z-dialog flex w-full max-w-[400px] flex-col bg-surface-card outline-none"
      >
        <div className="flex items-center gap-12 border-b border-line-default px-20 py-18">
          <div className="flex min-w-0 flex-1 items-center gap-10">{header}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => close.current()}
            className="inline-flex h-touch-target w-touch-target shrink-0 cursor-pointer items-center justify-center rounded-8 border-none bg-transparent text-ink-strong transition-osrs hover:text-ink-secondary"
          >
            <svg viewBox="0 0 24 24" className="h-20 w-20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-20 py-20">{children}</div>
        {footer ? <div className="flex flex-col gap-12 px-20 pb-20">{footer}</div> : null}
      </div>
    </div>
  );
}
