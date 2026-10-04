/** What an Admin has typed into a side panel's form, kept in this browser for
 *  five minutes so a click outside the panel does not lose it. Used by Add
 *  Single Unit, Add Multiple Units, Add Asset and Update Asset.
 *
 *  There is no timer. A draft is read once, when its panel mounts, and one
 *  older than five minutes is removed then, before the first render, so a
 *  stale draft is never shown. Every other expired draft is swept at the same
 *  time. A successful save and Cancel remove the panel's draft too.
 *
 *  Callers never store BitLocker identifiers or recovery keys/PINs: they are
 *  Admin-only secrets (constitution VIII), and browser storage outlives the
 *  session. Storage can be blocked or throw; every call is best-effort. */

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

/** Removes every draft that is unreadable or past five minutes. */
function sweep(): void {
  try {
    const storage = window.localStorage;
    const stale: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k?.startsWith(PREFIX) && !fresh(storage.getItem(k))) stale.push(k);
    }
    for (const k of stale) storage.removeItem(k);
  } catch {
    // Storage is unavailable.
  }
}

/** The saved draft, if it is under five minutes old. Expired drafts, this one
 *  included, are removed first. */
export function readDraft(name: DraftName): Record<string, unknown> | undefined {
  sweep();
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

/** Reads a string field of a restored draft, or the fallback. */
export function draftString(draft: Record<string, unknown> | undefined, field: string, fallback = ''): string {
  const value = draft?.[field];
  return typeof value === 'string' ? value : fallback;
}
