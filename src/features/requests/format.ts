/** Dates for the Employee's request screens.
 *
 *  Pinned to Manila, as BEN-46's queue is: Codev is Manila-based, and a
 *  viewer-local label would read a day early for anything submitted before
 *  08:00 local. `Intl` throws on an unparseable date during render, so a bad
 *  timestamp becomes an em dash instead of escaping to the shell's error. */
/** What a cell shows when the source gave nothing usable. The queue page
 *  compares against it to recognise a placeholder, so it lives in one place. */
export const NO_VALUE = '—';

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
  return Number.isNaN(date.getTime()) ? NO_VALUE : fmt.format(date);
}

/** "Sep 11, 2026" — My Requests' DATE column and the queue's SUBMITTED. An
 *  unparseable value becomes the em dash rather than throwing during render. */
export const formatDate = (value: string) => format(DATE, value) ?? NO_VALUE;

/** "Sep 11, 2026, 9:42 AM" — a timeline node. */
export const formatDateTime = (value: string | undefined) => format(DATE_TIME, value);

/** "Laptop, Keyboard + 1 more" — the first `shown` names, then a count. Each
 *  frame draws its own `shown`: `04 - My Requests` names two before counting,
 *  the Requests Queue three. Both screens call this one helper.
 *
 *  An absent or blank item list gets the same em dash as an unparseable date,
 *  and for the same reason: a blank cell cannot be told apart from a rendering
 *  fault, and both are shapes an unpublished source can hand us. Blank names
 *  are dropped before the count so "+ N more" never promises rows that are not
 *  there. */
export function summarizeItems(names: readonly string[], shown: 2 | 3) {
  const named = names.filter((name) => name.trim().length > 0);
  if (named.length === 0) return NO_VALUE;
  if (named.length <= shown) return named.join(', ');
  return `${named.slice(0, shown).join(', ')} + ${named.length - shown} more`;
}
