import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { dismissPopovers } from './popover-layer';
import { useScrollLock } from './scroll-lock';

/** The right-hand sheet the design draws over My Requests (`04.1`, `04.2`):
 *  full height, white, on the same 50% scrim as a modal.
 *
 *  It is a native `<dialog>` opened with `showModal()`, so the browser makes
 *  the page behind it inert, and the scrim is the dialog's own `::backdrop`.
 *  Focus moves in on open and is held there, Esc and a click on the scrim close it,
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
  /** Pinned to the bottom of the sheet, outside the scrolling body. A function
   *  receives `close`, which leaves the way ✕ does (animated, then `onClose`),
   *  for a footer that carries its own Close button (spec 008, `02.2.2.1`). */
  footer?: ReactNode | ((close: () => void) => ReactNode);
  /** `false` while the caller has work in flight that the panel must outlive —
   *  the Request List's submit (spec 011 FR-010). ✕, Esc and the scrim are
   *  ignored until it is `true` again, so the panel cannot unmount mid-submit.
   *  The ✕ stays in place, disabled, so the header does not reflow. */
  dismissible?: boolean;
}) {
  const panel = useRef<HTMLDialogElement>(null);
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
  // Read by the native-close listener, which is installed once.
  const canDismiss = useRef(dismissible);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    close.current();
  };
  useLayoutEffect(() => {
    leave.current = dismissible ? () => setLeaving(true) : () => {};
    canDismiss.current = dismissible;
  });
  useEffect(() => {
    if (!leaving) return;
    const backstop = window.setTimeout(finish, EXIT_BACKSTOP_MS);
    return () => window.clearTimeout(backstop);
  }, [leaving]);

  useEffect(() => {
    dismissPopovers();
    const opener = document.activeElement as HTMLElement | null;
    const dialog = panel.current;
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.focus();

    // Esc is handled on keydown, and the keydown is cancelled, so the browser
    // never starts its own close. Leaving it to the dialog's `cancel` event is
    // not enough: Chrome makes `cancel` un-cancellable when Esc repeats with no
    // user activation in between, and would close a panel that must stay open
    // (`dismissible={false}`) or skip the exit animation. A control inside
    // that handled Esc itself (an open Select closing its list) has already
    // prevented the keydown: that Esc was the control's, not the panel's.
    // `cancel` stays as the fallback for close requests that are not a key.
    const onCancel = (e: Event) => {
      e.preventDefault();
      leave.current();
    };
    // The page behind is inert, but Tab can still leave the document for the
    // browser's own chrome. Wrap it inside the panel, as before (FR-002).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc that cancels an input method's composition (Chinese, Japanese,
        // Korean typing) belongs to the text field, not the panel.
        if (e.defaultPrevented || e.isComposing) return;
        e.preventDefault();
        leave.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      // Nothing enabled — every control disabled while work is in flight: hold
      // focus on the dialog itself rather than let Tab reach the page behind.
      if (!focusable.length) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // A focused control that unmounts drops focus to <body>. Treat anywhere
      // outside the panel like the panel itself, so the next Tab comes back in.
      const active = document.activeElement;
      const outside = active === dialog || !dialog.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    // The sheet's content fills the dialog box, so a click whose target is the
    // dialog itself landed on the ::backdrop: the scrim. Its keyboard
    // equivalent is Esc, above.
    // A click goes to the nearest common ancestor of where the pointer went
    // down and where it came up. A drag between the sheet and the scrim, in
    // either direction, therefore also "clicks" the dialog. Both ends must
    // land on the scrim.
    let pressedScrim = false;
    let releasedScrim = false;
    const onPress = (e: PointerEvent) => {
      pressedScrim = e.target === dialog;
    };
    const onRelease = (e: PointerEvent) => {
      releasedScrim = e.target === dialog;
    };
    const onScrim = (e: MouseEvent) => {
      if (e.target === dialog && pressedScrim && releasedScrim) leave.current();
      pressedScrim = false;
      releasedScrim = false;
    };
    // The browser may close the dialog itself: Chrome makes `cancel`
    // un-cancellable when Esc repeats without user activation in between.
    // Then there is no exit animation to wait for, and the panel must still
    // report closing, or the page would hold a closed dialog as "open". The
    // cleanup's own `close()` runs after `finish` or on unmount, so `done`
    // keeps this from reporting twice. `close` is queued, not synchronous: a
    // close from a StrictMode remount's cleanup arrives after the dialog has
    // been reopened, and is ignored because the dialog is open again.
    const onNativeClose = () => {
      if (!dialog || dialog.open) return;
      // Work in flight must outlive the panel (`dismissible={false}`): a
      // close the browser forced is undone rather than honoured.
      if (!canDismiss.current) {
        dialog.showModal();
        return;
      }
      finish();
    };
    dialog?.addEventListener('cancel', onCancel);
    dialog?.addEventListener('pointerdown', onPress);
    dialog?.addEventListener('pointerup', onRelease);
    dialog?.addEventListener('click', onScrim);
    dialog?.addEventListener('close', onNativeClose);
    document.addEventListener('keydown', onKey);
    return () => {
      dialog?.removeEventListener('cancel', onCancel);
      dialog?.removeEventListener('pointerdown', onPress);
      dialog?.removeEventListener('pointerup', onRelease);
      dialog?.removeEventListener('click', onScrim);
      dialog?.removeEventListener('close', onNativeClose);
      document.removeEventListener('keydown', onKey);
      if (dialog?.open) dialog.close();
      opener?.focus?.();
    };
  }, []);

  // A footer function may return nothing, and then there is no footer band.
  const footerContent =
    typeof footer === 'function'
      ? footer(() => {
          if (dismissible) setLeaving(true);
        })
      : footer;

  return (
    <dialog
      ref={panel}
      aria-label={title}
      tabIndex={-1}
      // `will-change-transform` makes the dialog the containing block for
      // `position: fixed` descendants ALWAYS, not only while the slide
      // animation holds a transform. A Select's list is portalled in here and
      // positions itself against this box (Select.tsx).
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) finish();
      }}
      className={`fixed inset-y-0 right-0 left-auto m-0 flex h-dvh max-h-none w-full max-w-[400px] flex-col overflow-hidden border-none will-change-transform bg-surface-card p-0 outline-none backdrop:bg-backdrop ${
        leaving ? 'animate-sheet-out backdrop:animate-fade-out' : 'animate-sheet-in backdrop:animate-fade-in'
      }`}
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
      {footerContent ? <div className="flex flex-col gap-12 px-20 pb-20">{footerContent}</div> : null}
    </dialog>
  );
}
