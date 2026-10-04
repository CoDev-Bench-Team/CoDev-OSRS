/** What an Admin has typed into a side panel's form, kept in this browser for
 *  five minutes so a click outside the panel does not lose it. Used by Add
 *  Single Unit, Add Multiple Units, Add Asset and Update Asset.
 *
 *  There is no timer. A draft is read once, when its panel mounts, and one
 *  older than five minutes is removed then, before the first render, so a
 *  stale draft is never shown. Every other expired draft is swept at the same
 *  time. The five minutes run from the last change: reopening a draft without
 *  changing it does not renew it. A successful save and Cancel remove the
 *  panel's draft, and signing out removes every draft.
 *
 *  Callers never store BitLocker identifiers or recovery keys/PINs: they are
 *  Admin-only secrets (constitution VIII), and browser storage outlives the
 *  session. Storage can be blocked or throw; every call is best-effort. */

import { useCallback, useEffect, useRef, useState } from 'react';

const TTL_MS = 5 * 60 * 1000;
const PREFIX = 'osrs.draft.';

/** `unit.single`, `unit.bulk`, `asset.new`, or `asset.<id>` for an update. */
export type DraftName = string;

const key = (name: DraftName) => `${PREFIX}${name}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The stored value, or `undefined` when it is unreadable or expired. */
function fresh(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const stored: unknown = JSON.parse(raw);
    if (isRecord(stored) && typeof stored.savedAt === 'number' && Date.now() - stored.savedAt < TTL_MS && isRecord(stored.value)) {
      return stored.value;
    }
  } catch {
    // Unreadable.
  }
  return undefined;
}

export function clearDraft(name: DraftName): void {
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    // Nothing stored, or storage is unavailable.
  }
}

/** Removes the drafts `stale` picks out by their stored text. */
function removeWhere(stale: (raw: string | null) => boolean): void {
  try {
    const storage = window.localStorage;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k?.startsWith(PREFIX) && stale(storage.getItem(k))) keys.push(k);
    }
    for (const k of keys) storage.removeItem(k);
  } catch {
    // Storage is unavailable.
  }
}

/** Removes every draft that is unreadable or past five minutes. */
function sweep(): void {
  removeWhere((raw) => !fresh(raw));
}

/** Removes every draft. Called on sign-out, so the next person on this
 *  browser never sees what the last one typed. */
export function clearAllDrafts(): void {
  removeWhere(() => true);
}

/** Drafts whose save is still running, perhaps in a toast after the panel
 *  closed. A panel reopened meanwhile starts empty rather than restoring the
 *  values being saved, which a second Save would duplicate. */
const saving = new Set<DraftName>();

/** Runs `save` with the draft held back from new panels, and removes the
 *  draft once it succeeds. A failed save leaves the draft as it was. */
export async function savingDraft<T>(name: DraftName, save: () => Promise<T>, discard: () => void): Promise<T> {
  saving.add(name);
  try {
    const result = await save();
    discard();
    return result;
  } finally {
    saving.delete(name);
  }
}

/** The saved draft, if it is under five minutes old. Expired drafts, this one
 *  included, are removed first. */
export function readDraft(name: DraftName): Record<string, unknown> | undefined {
  sweep();
  if (saving.has(name)) return undefined;
  try {
    return fresh(window.localStorage.getItem(key(name)));
  } catch {
    return undefined;
  }
}

/** `false` when it was not kept (blocked, or over quota); the form still
 *  holds it. */
export function writeDraft(name: DraftName, value: Record<string, unknown>): boolean {
  try {
    window.localStorage.setItem(key(name), JSON.stringify({ savedAt: Date.now(), value }));
    return true;
  } catch {
    return false;
  }
}

/** Keeps `value` as the draft `name` while the panel is open.
 *
 *  - A value equal to `untouched` (nothing typed) removes the draft.
 *  - A value still equal to the `restored` one is not rewritten, so reopening
 *    a draft does not renew its five minutes.
 *  - `fallback` is written instead when `value` does not fit in storage (a
 *    large image, say).
 *
 *  Returns `discard`, for Cancel and a successful save: it removes the draft
 *  and stops this panel writing it again, even if a list the form shows
 *  finishes loading while the panel animates out. */
export function useDraftWriter(
  name: DraftName,
  value: Record<string, unknown>,
  {
    untouched,
    restored,
    fallback,
    enabled = true,
  }: {
    /** `false` keeps nothing (Review/Edit unit). */
    enabled?: boolean;
    untouched: string;
    restored: Record<string, unknown> | undefined;
    fallback?: (value: Record<string, unknown>) => Record<string, unknown>;
  },
): () => void {
  const discarded = useRef(false);
  /** Set by the first write: from then on every change is written, a change
   *  back to the restored value included. */
  const written = useRef(false);
  const json = JSON.stringify(value);
  // The form as first rendered from the draft, not the stored text: the form
  // rebuilds its keys in its own order, so the stored text would never match.
  const [restoredJson] = useState(() => (restored ? json : null));
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    fallbackRef.current = fallback;
  });
  useEffect(() => {
    if (!enabled || discarded.current) return;
    if (!written.current && json === restoredJson) return;
    // Past the restored value: a clear counts as a write, so typing the
    // restored value back in is kept.
    written.current = true;
    if (json === untouched) {
      clearDraft(name);
      return;
    }
    const next = JSON.parse(json) as Record<string, unknown>;
    if (!writeDraft(name, next) && fallbackRef.current) writeDraft(name, fallbackRef.current(next));
  }, [enabled, name, json, untouched, restoredJson]);
  return useCallback(() => {
    if (!enabled) return;
    discarded.current = true;
    clearDraft(name);
  }, [enabled, name]);
}

/** Reads a field of a restored draft that must be one of `options`, or the
 *  fallback. */
export function draftOneOf<T extends string, F extends T | undefined>(
  draft: Record<string, unknown> | undefined,
  field: string,
  options: readonly T[],
  fallback: F,
): T | F {
  const value = draft?.[field];
  return options.find((o) => o === value) ?? fallback;
}

/** Reads a string field of a restored draft, or the fallback. */
export function draftString(draft: Record<string, unknown> | undefined, field: string, fallback = ''): string {
  const value = draft?.[field];
  return typeof value === 'string' ? value : fallback;
}
