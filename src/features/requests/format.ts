/** Dates for the Employee's request screens.
 *
 *  Pinned to Manila, as BEN-46's queue is: Codev is Manila-based, and a
 *  viewer-local label would read a day early for anything submitted before
 *  08:00 local. `Intl` throws on an unparseable date during render, so a bad
 *  timestamp becomes an em dash instead of escaping to the shell's error. */
const DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
});

function format(fmt: Intl.DateTimeFormat, value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : fmt.format(date);
}

/** "Sep 11, 2026" — the list's DATE column. */
export const formatDate = (value: string) => format(DATE, value) ?? '—';

/** "Sep 11, 2026, 9:42 AM" — a timeline node. */
export const formatDateTime = (value: string | undefined) => format(DATE_TIME, value);

/** "Laptop, Keyboard + 1 more" — two names, then a count, exactly as the
 *  `04 - My Requests` frame summarises a three-line request. BEN-46's queue
 *  lists up to three before counting; reconcile the two when it merges. */
export function summarizeItems(names: readonly string[]) {
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} + ${names.length - 2} more`;
}
