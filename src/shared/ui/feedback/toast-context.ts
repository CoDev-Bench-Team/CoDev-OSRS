import { createContext, use } from 'react';

/** What a toast says about the work it reports. `loading` stays until it is
 *  updated; `success` and `info` leave on their own; `error` stays until it
 *  is dismissed, so a failure is never missed. */
export type ToastTone = 'loading' | 'success' | 'error' | 'info';

export type ToastInput = {
  tone: ToastTone;
  title: string;
  body?: string;
  /** One follow-up, such as reopening what failed. */
  action?: { label: string; onClick: () => void };
};

export type Toaster = {
  /** Shows a toast and returns its id. */
  show: (toast: ToastInput) => string;
  /** Replaces what a toast says: a `loading` toast becomes its outcome. */
  update: (id: string, toast: ToastInput) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<Toaster | null>(null);

/** The app's toasts. Lives apart from `ToastProvider` so each module exports
 *  a hook or a component, never both, which keeps fast refresh working. */
export function useToast(): Toaster {
  const toaster = use(ToastContext);
  if (!toaster) throw new Error('useToast must be used inside <ToastProvider>');
  return toaster;
}
