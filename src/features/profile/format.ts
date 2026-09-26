import type { Office } from '../auth/types';

/** `<email> • <Office> Office` — or the email alone when the session
 *  carries no office, so the separator never dangles (spec 006 Edge Cases). */
export function identityLine(email: string, office?: Office): string {
  return office ? `${email} • ${office} Office` : email;
}

const ASSIGNED_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // The value is a calendar date, not an instant. Formatting it in local time
  // would move it back a day anywhere west of UTC.
  timeZone: 'UTC',
});

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `2026-01-14` → `Jan 14, 2026`. Anything that is not a real calendar date
 *  returns `null`; the card then says the date is not available rather than
 *  printing `Invalid Date` (FR-009 as amended). */
export function formatAssignedDate(isoDate: string): string | null {
  const match = CALENDAR_DATE.exec(isoDate);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Date.UTC rolls 2026-02-31 over into March; a rollover means it was not a date.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return ASSIGNED_DATE.format(date);
}
