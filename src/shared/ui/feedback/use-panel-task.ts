import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast, type ToastInput } from './toast-context';

/** What one panel action says, in the panel or in a toast: the same words in
 *  both, so closing the panel mid-action changes where they appear, not what
 *  they say. */
export type TaskCopy<T> = {
  /** "Approving REQ-2026-1847…" */
  loading: string;
  success: (value: T) => { title: string; body?: string };
  failure: (error: unknown) => { title: string; body?: string; action?: ToastInput['action'] };
};

export type TaskResult<T> = {
  /** The panel closed before the work ended, so a toast reported it and the
   *  panel must not. */
  detached: boolean;
} & ({ ok: true; value: T } | { ok: false; error: unknown });

type Running = { copy: TaskCopy<never>; toast?: string };

/** The work a side panel starts — a save, an approval, a removal — and who
 *  reports it (one behaviour for every side drawer, 2026-10-03).
 *
 *  While the panel is open, the panel reports it: its button names the work
 *  ("Saving…"), its form and scrolling are locked, and the outcome is shown
 *  in it. If the panel is closed first — ✕, Esc, a click on the scrim — the
 *  work carries on and a toast takes over at once: the loading line, then the
 *  outcome. `handOff` is that moment; unmounting the panel calls it too.
 *
 *  Tasks are keyed, so a page whose panel can be closed and reopened on
 *  another record (the Requests Queue) can have several in flight. */
export function usePanelTask() {
  const toaster = useToast();
  const tasks = useRef(new Map<string, Running>());
  const [running, setRunning] = useState<ReadonlySet<string>>(() => new Set());

  /** Moves the running task(s) to a toast: one key, or every task. */
  const handOff = useCallback(
    (key?: string) => {
      for (const [k, task] of tasks.current) {
        if (key !== undefined && k !== key) continue;
        if (!task.toast) task.toast = toaster.show({ tone: 'loading', title: task.copy.loading });
      }
    },
    [toaster],
  );

  // A panel that unmounts with work in flight has been closed: hand it off.
  // (StrictMode's rehearsal unmount runs before any work starts, so it hands
  // off nothing.)
  useEffect(() => () => handOff(), [handOff]);

  const run = useCallback(
    async <T>(key: string, copy: TaskCopy<T>, work: () => Promise<T>): Promise<TaskResult<T>> => {
      const task: Running = { copy: copy as TaskCopy<never> };
      tasks.current.set(key, task);
      setRunning((all) => new Set(all).add(key));
      let result: { ok: true; value: T } | { ok: false; error: unknown };
      try {
        result = { ok: true, value: await work() };
      } catch (error) {
        result = { ok: false, error };
      }
      tasks.current.delete(key);
      setRunning((all) => {
        const rest = new Set(all);
        rest.delete(key);
        return rest;
      });
      if (task.toast) {
        toaster.update(
          task.toast,
          result.ok ? { tone: 'success', ...copy.success(result.value) } : { tone: 'error', ...copy.failure(result.error) },
        );
      }
      return { detached: Boolean(task.toast), ...result };
    },
    [toaster],
  );

  /** Whether work is in flight now (one key, or any), read from the ref: a
   *  second press can land before the re-render that disables its button,
   *  and only this sees the first press. Guard every start with it. */
  const inFlight = useCallback((key?: string) => (key === undefined ? tasks.current.size > 0 : tasks.current.has(key)), []);

  return { run, handOff, inFlight, isRunning: (key: string) => running.has(key), busy: running.size > 0 };
}
