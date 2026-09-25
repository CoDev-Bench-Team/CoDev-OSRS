/** The published validation-error response (BEN-98), read into form terms.
 *
 *  RFC 9457 Problem Details with one entry per failing field, each naming its
 *  field by an RFC 6901 JSON Pointer in URI-fragment form (`#/name`). The shape
 *  is the contract's own — `specs/001-office-supplies-mvp/contracts/README.md` —
 *  and every form maps it through here rather than parsing it again. */
export type ValidationProblem = {
  type: 'validation-error';
  title: string;
  status: 400;
  errors: { detail: string; pointer: string }[];
};

export function isValidationProblem(value: unknown): value is ValidationProblem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ValidationProblem>;
  return v.type === 'validation-error' && Array.isArray(v.errors);
}

/** `#/specs/0/value` → `specs.0.value`. Decodes the pointer's two escapes
 *  (`~1` is `/`, `~0` is `~`) and the fragment's percent-encoding. A pointer to
 *  the whole document (`#` or `#/`) maps to the empty key: a form shows that one
 *  above its fields rather than under any of them. */
export function pointerToField(pointer: string): string {
  const path = pointer.startsWith('#') ? pointer.slice(1) : pointer;
  if (path === '' || path === '/') return '';
  return path
    .replace(/^\//, '')
    .split('/')
    .map((token) => decodeURIComponent(token).replace(/~1/g, '/').replace(/~0/g, '~'))
    .join('.');
}

/** One message per field. The contract repeats a pointer once per failed
 *  constraint, all with the same `detail`; the first one is kept. */
export function fieldErrors(problem: ValidationProblem): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { pointer, detail } of problem.errors) {
    const field = pointerToField(pointer);
    if (!(field in out)) out[field] = detail;
  }
  return out;
}
