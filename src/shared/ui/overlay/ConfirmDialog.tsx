import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../actions/Button';
import { listenForScrimClick, wrapTab } from './modal-dialog';
import { TOP_LAYER_CLOSED, TOP_LAYER_OPENED } from './popover-layer';

/** A small modal that asks before an action is sent. Undrawn: logged in
 *  `docs/design-system/additions.md` §3h.
 *
 *  A native `<dialog>` opened with `showModal()`, so it stacks in the top layer
 *  above an open `SidePanel` and makes the panel inert. `SidePanel` listens for
 *  Esc and Tab on the document, so both are handled here and stopped: Esc
 *  closes this dialog, never the panel under it. Focus starts on Cancel and
 *  returns to whatever opened the dialog. While `busy`, nothing dismisses it. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();
  // Read by the native listeners, which are installed once.
  const dismiss = useRef(onCancel);
  const busyNow = useRef(busy);
  useLayoutEffect(() => {
    dismiss.current = onCancel;
    busyNow.current = busy;
  });

  useEffect(() => {
    const el = dialog.current;
    const opener = document.activeElement as HTMLElement | null;
    if (el && !el.open) {
      el.showModal();
      // Toasts move into the topmost modal, or they would be inert under it.
      window.dispatchEvent(new Event(TOP_LAYER_OPENED));
    }
    // Cancel is the first button: the safe choice has focus.
    el?.querySelector<HTMLButtonElement>('button')?.focus();
    const cancel = () => {
      if (!busyNow.current) dismiss.current();
    };
    // A close request that is not a key (the browser's own) still goes
    // through `onCancel`, so the caller's state never says open when it is not.
    const onNativeCancel = (e: Event) => {
      e.preventDefault();
      cancel();
    };
    el?.addEventListener('cancel', onNativeCancel);
    const stopScrim = el ? listenForScrimClick(el, cancel) : () => {};
    return () => {
      el?.removeEventListener('cancel', onNativeCancel);
      stopScrim();
      if (el?.open) el.close();
      window.dispatchEvent(new Event(TOP_LAYER_CLOSED));
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (!busy) onCancel();
      return;
    }
    if (e.key !== 'Tab' || !dialog.current) return;
    e.stopPropagation();
    wrapTab(e, dialog.current, 'button:not([disabled])');
  };

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-auto h-fit w-[calc(100%-32px)] max-w-[360px] rounded-10 border-none bg-surface-card p-0 shadow-card outline-none backdrop:bg-backdrop backdrop:animate-fade-in"
    >
      <div className="flex flex-col gap-16 p-20">
        <h2 id={titleId} className="type-card-title text-ink-heading">
          {title}
        </h2>
        <div id={bodyId} className="flex flex-col gap-8 type-body text-ink-body">
          {children}
        </div>
        <div className="flex items-center justify-center gap-12">
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
