/** A status or category filter chip, from the file's `Category` chip on
 *  `02 - Requests Queue` (drift-2026-09-24 §7): 31px high, pill radius, 14x8
 *  padding, 12px Inter, 14px between label and count.
 *
 *  Selected: the brand-primary-alt fill, label and count both white. Otherwise:
 *  white on the default ring, label in the strong ink, count in the muted
 *  ink. A toggle button rather than a radio, because `aria-pressed` is what a
 *  row of filter buttons announces. */
export function FilterChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  /** Rendered as `(n)` after the label. Omit it for a chip with no count. */
  count?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`inline-flex h-[31px] cursor-pointer items-center gap-14 rounded-pill border-none px-14 py-8 font-sans text-12 leading-none whitespace-nowrap transition-osrs ${
        selected
          ? 'bg-brand-primary-alt text-brand-on-primary'
          : 'bg-surface-card text-ink-strong ring-default hover:bg-osrs-surface-subtle'
      }`}
    >
      <span>{label}</span>
      {count === undefined ? null : (
        <span className={selected ? 'text-brand-on-primary' : 'text-ink-muted'}>({count.toLocaleString('en-US')})</span>
      )}
    </button>
  );
}
