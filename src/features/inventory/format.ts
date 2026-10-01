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
