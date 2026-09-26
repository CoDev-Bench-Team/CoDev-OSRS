/** The backend's validation failure, read once for every form (BEN-98).
 *
 *  Every body-validated endpoint answers a bad body with HTTP 400,
 *  `application/problem+json` (RFC 9457):
 *
 *    { type: 'validation-error', title, status, errors: [{ detail, pointer }] }
 *
 *  where `pointer` is an RFC 6901 JSON Pointer, usually in URI-fragment form
 *  (`#/items/0/quantity`). See `specs/001-office-supplies-mvp/contracts/README.md`.
 *
 *  This module knows nothing about any one form. It turns the body into
 *  decoded path segments; each form decides which of its inputs a path names.
 *  It invents no codes and rewrites no `detail`. */

/** One validation message and the decoded path of the field it names.
 *  `path` is `[]` for a pointer at the whole document. */
export type FieldProblem = { path: string[]; detail: string };

/** Decode an RFC 6901 JSON Pointer into its reference tokens.
 *
 *  Accepts the URI-fragment form (`#/a/b`, percent-encoded) and the plain
 *  string form (`/a/b`). `~1` becomes `/` and `~0` becomes `~`, in that order,
 *  as RFC 6901 §4 requires. Anything that is not a pointer yields `[]`, which
 *  a form treats as "names no field". */
export function pointerPath(pointer: string): string[] {
  let raw = pointer;
  if (raw.startsWith('#')) {
    try {
      raw = decodeURIComponent(raw.slice(1));
    } catch {
      return [];
    }
  }
  if (raw === '' || !raw.startsWith('/')) return [];
  return raw
    .slice(1)
    .split('/')
    .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a response body as a validation failure.
 *
 *  Returns `null` when the body is not one — not an object, not
 *  `type: 'validation-error'`, no `errors` array, or no entry with a message to
 *  show — so a caller can fall back to showing the problem's own `detail` or
 *  `title` rather than refusing silently. Entries without a non-blank string
 *  `detail` are skipped, since an empty message tells no one anything; an
 *  entry without a usable `pointer` is kept with an empty path, so its message
 *  is still shown rather than dropped. */
export function parseValidationProblem(body: unknown): FieldProblem[] | null {
  if (!isRecord(body) || body.type !== 'validation-error' || !Array.isArray(body.errors)) return null;
  const problems: FieldProblem[] = [];
  for (const entry of body.errors) {
    if (!isRecord(entry) || typeof entry.detail !== 'string' || entry.detail.trim() === '') continue;
    problems.push({
      path: typeof entry.pointer === 'string' ? pointerPath(entry.pointer) : [],
      detail: entry.detail,
    });
  }
  return problems.length > 0 ? problems : null;
}

/* The flat, one-message-per-field view a plain form wants — the API #41
 * (BEN-48) wrote for the asset and stock panels, kept here so spec 001 T003a
 * stays one module. Each is a thin layer over `pointerPath` /
 * `parseValidationProblem`, not a second parser. */

/** The contract's validation failure (BEN-98), as a type. */
export type ValidationProblem = {
  type: 'validation-error';
  title: string;
  status: 400;
  errors: { detail: string; pointer: string }[];
};

export function isValidationProblem(value: unknown): value is ValidationProblem {
  return isRecord(value) && value.type === 'validation-error' && Array.isArray(value.errors);
}

/** `#/specs/0/value` → `specs.0.value`. A pointer at the whole document maps
 *  to `''`, which a form shows above its fields rather than under one. */
export function pointerToField(pointer: string): string {
  return pointerPath(pointer).join('.');
}

/** One message per field, keyed by `pointerToField`. The contract repeats a
 *  pointer once per failed constraint; the first message is kept. */
export function fieldErrors(problem: ValidationProblem): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { path, detail } of parseValidationProblem(problem) ?? []) {
    const field = path.join('.');
    if (!(field in out)) out[field] = detail;
  }
  return out;
}
