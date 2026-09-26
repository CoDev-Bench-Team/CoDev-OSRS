/** The top bar's Request List marker, as something a feature can return focus
 *  to without knowing how the bar marks it (spec 011 D3).
 *
 *  The drawer the marker opens is closed from the Catalog, sometimes after the
 *  route changed underneath it, and then `SidePanel`'s recorded opener can be
 *  `<body>`. The marker is where focus belongs. The attribute and the query
 *  that finds it live together here, so neither side can rename one alone; the
 *  check scripts read the same attribute. */
export const REQUEST_LIST_MARKER_PROPS = { 'data-request-list-marker': '' } as const;

/** Focuses the marker, but only when nothing else holds focus — never steals
 *  it from a control the person has already moved to. */
export function focusRequestListMarkerIfIdle(): void {
  const active = document.activeElement;
  if (active && active !== document.body) return;
  document.querySelector<HTMLElement>('[data-request-list-marker]')?.focus();
}
