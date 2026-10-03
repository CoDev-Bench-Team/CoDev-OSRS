import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastInput, type Toaster, type ToastTone } from './toast-context';
import { createPortal } from 'react-dom';
import { TOP_LAYER_CLOSED, TOP_LAYER_OPENED } from '../overlay/popover-layer';

/** Toasts: short reports of work that finished, or is finishing, away from
 *  the control that started it. Not drawn in the design file; recorded in
 *  docs/design-system/additions.md.
 *
 *  Bottom right, newest last, a card each: a tone marker, a title, an optional
 *  line and action, and a close button. The stack is a manual popover, so it
 *  sits in the top layer above an open side panel or dialog, raised again
 *  whenever a toast changes or a modal opens. A modal makes everything outside
 *  it inert, popovers included, so while one is open the stack is portalled
 *  into it (the topmost), where its buttons still work. Success and info
 *  leave after a few seconds, unless a pointer or focus is on them; loading
 *  stays until it becomes its outcome; an error stays until dismissed. */

const LINGER_MS = 5000;

/** `node` in `host` when there is one, in place otherwise. */
const portalInto = (host: HTMLElement | null, node: ReactNode) => (host ? createPortal(node, host) : node);

type Toast = ToastInput & { id: string };

const TONE: Record<ToastTone, { mark: string; label: string }> = {
  loading: { mark: 'border-2 border-status-info-fg border-t-transparent animate-spin motion-reduce:animate-none', label: 'In progress' },
  success: { mark: 'bg-status-available-fg', label: 'Done' },
  error: { mark: 'bg-status-rejected-fg', label: 'Failed' },
  info: { mark: 'bg-status-info-fg', label: 'Note' },
};

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-12" fill="none" aria-hidden="true">
      <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ToastCard({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  // Stable per toast, so another toast arriving or updating does not restart
  // this one's linger timer.
  const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id]);
  const [held, setHeld] = useState(false);
  const lingers = toast.tone === 'success' || toast.tone === 'info';

  useEffect(() => {
    if (!lingers || held) return;
    const timer = setTimeout(onDismiss, LINGER_MS);
    return () => clearTimeout(timer);
  }, [lingers, held, onDismiss, toast.title, toast.body]);

  const { mark, label } = TONE[toast.tone];
  return (
    <li
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      aria-busy={toast.tone === 'loading' || undefined}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      className="pointer-events-auto flex w-[360px] max-w-[calc(100vw-32px)] animate-fade-in items-start gap-12 rounded-10 bg-surface-card p-16 shadow-card ring-default"
    >
      {/* The first line is the close button's 24px: the mark, the title and
          the button are centred on it, so a one-line toast sits centred and a
          longer one keeps all three on its title. */}
      <span aria-hidden="true" className="flex h-24 shrink-0 items-center">
        <span className={`size-14 rounded-circle ${mark}`} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <p className="flex min-h-24 items-center type-ui-bold text-ink-primary">
          <span className="sr-only">{label}: </span>
          {toast.title}
        </p>
        {toast.body ? <p className="type-meta leading-body text-ink-secondary">{toast.body}</p> : null}
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 cursor-pointer self-start border-none bg-transparent p-0 type-ui-bold text-ink-link"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
      {toast.tone === 'loading' ? null : (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="inline-flex size-24 shrink-0 cursor-pointer items-center justify-center rounded-6 border-none bg-transparent p-0 text-ink-secondary transition-osrs hover:text-ink-primary"
        >
          <CloseGlyph />
        </button>
      )}
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const layer = useRef<HTMLDivElement>(null);

  const show = useCallback((toast: ToastInput) => {
    const id = `toast-${++next.current}`;
    setToasts((all) => [...all, { ...toast, id }]);
    return id;
  }, []);
  const update = useCallback((id: string, toast: ToastInput) => {
    setToasts((all) => all.map((t) => (t.id === id ? { ...toast, id } : t)));
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);
  const toaster = useMemo<Toaster>(() => ({ show, update, dismiss }), [show, update, dismiss]);

  // Into the top layer, above any open modal, and raised again whenever a
  // toast changes (a loading toast becoming its outcome) and whenever a modal
  // opens (`TOP_LAYER_OPENED`), so a panel opened since never covers them.
  const raise = useCallback(() => {
    const el = layer.current;
    if (!el || typeof el.showPopover !== 'function') return;
    // Re-showing would take focus out of a toast the keyboard is on.
    if (el.contains(document.activeElement)) return;
    if (el.matches(':popover-open')) el.hidePopover();
    if (el.querySelector('li')) el.showPopover();
  }, []);
  /** The topmost open modal, which the stack lives in while it is open. */
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const follow = () => {
      const open = document.querySelectorAll<HTMLElement>('dialog:modal');
      setHost(open.length ? open[open.length - 1] : null);
    };
    window.addEventListener(TOP_LAYER_OPENED, follow);
    window.addEventListener(TOP_LAYER_CLOSED, follow);
    return () => {
      window.removeEventListener(TOP_LAYER_OPENED, follow);
      window.removeEventListener(TOP_LAYER_CLOSED, follow);
    };
  }, []);
  useLayoutEffect(raise, [toasts, raise, host]);

  return (
    <ToastContext value={toaster}>
      {children}
      {portalInto(host,
      <div
        ref={layer}
        popover="manual"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-auto right-16 bottom-16 m-0 overflow-visible border-none bg-transparent p-0"
      >
        <ol className="flex flex-col items-end gap-10">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} dismiss={dismiss} />
          ))}
        </ol>
      </div>,
      )}
    </ToastContext>
  );
}
