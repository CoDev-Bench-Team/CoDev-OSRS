/** A dash for a number the API does not publish, named for a screen reader
 *  (spec 017 FR-028, FR-041). Never a `0`: zero would be a false fact. */
export function NotPublished() {
  return <span aria-label="Not published">—</span>;
}
