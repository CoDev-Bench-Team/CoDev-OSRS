const AMOUNT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `80,000.00` — a price as the Price field shows it beside its `Php` prefix. */
export function formatAmount(amount: number): string {
  return AMOUNT.format(amount);
}

/** What the Admin typed in Price, as a number: blank is no price, and the
 *  thousands separators `formatAmount` writes are allowed. Anything else that
 *  is not a plain decimal is `NaN`, which validation refuses. */
export function parseAmount(typed: string): number | undefined {
  const plain = typed.trim().replaceAll(',', '');
  if (!plain) return undefined;
  return /^\d+(\.\d+)?$/.test(plain) ? Number(plain) : NaN;
}

/** The Price field as the Admin types: digits grouped by thousands, one
 *  decimal point and at most two decimals. `58000` reads `58,000`, `1250.5`
 *  reads `1,250.5`. Letters and every other character are dropped. The value
 *  stays a string for display; `parseAmount` reads the number back. */
export function typeAmount(raw: string): string {
  const kept = raw.replace(/[^\d.]/g, '');
  const dot = kept.indexOf('.');
  const whole = (dot < 0 ? kept : kept.slice(0, dot)).replace(/^0+(?=\d)/, '');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (dot < 0) return grouped;
  return `${grouped || '0'}.${kept.slice(dot + 1).replace(/\./g, '').slice(0, 2)}`;
}

/** Where the caret belongs in `formatted` so it still follows the same
 *  `significant` digits and point it followed before the commas moved. */
export function caretAt(formatted: string, significant: number): number {
  if (significant <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) seen++;
    if (seen === significant) return i + 1;
  }
  return formatted.length;
}

/** The Price field once the Admin leaves it: `58,000` reads `58,000.00`. */
export function settleAmount(value: string): string {
  const amount = parseAmount(value);
  return amount === undefined || Number.isNaN(amount) ? value : formatAmount(amount);
}
