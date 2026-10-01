const AMOUNT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `80,000.00` — a price as the Price field shows it beside its `Php` prefix. */
export function formatAmount(amount: number): string {
  return AMOUNT.format(amount);
}

/** `Php 80,000.00` — the price as the design writes it (spec 015 FR-013). */
export function formatPeso(amount: number): string {
  return `Php ${formatAmount(amount)}`;
}

/** What the Admin typed in Price, as a number: blank is no price, and the
 *  thousands separators `formatAmount` writes are allowed. Anything else that
 *  is not a plain decimal is `NaN`, which validation refuses. */
export function parseAmount(typed: string): number | undefined {
  const plain = typed.trim().replaceAll(',', '');
  if (!plain) return undefined;
  return /^\d+(\.\d+)?$/.test(plain) ? Number(plain) : NaN;
}

/** What the Price field keeps of a keystroke or paste: digits and one decimal
 *  point, so the value stays a plain `58000`. Letters, commas and every other
 *  character are dropped as they are typed. */
export function amountInput(raw: string): string {
  const kept = raw.replace(/[^\d.]/g, '');
  const dot = kept.indexOf('.');
  return dot < 0 ? kept : kept.slice(0, dot + 1) + kept.slice(dot + 1).replace(/\./g, '');
}

/** How the Price field shows its plain value while it is not being edited:
 *  `58000` reads `58,000.00`. A value validation would refuse (more than two
 *  decimals) shows as typed, so its error still names what was entered. */
export function displayAmount(value: string): string {
  const amount = parseAmount(value);
  if (amount === undefined || Number.isNaN(amount) || /\.\d{3,}$/.test(value.trim())) return value;
  return formatAmount(amount);
}
