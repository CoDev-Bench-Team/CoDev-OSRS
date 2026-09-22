/** A filter chip. Pressed state is carried on `aria-pressed`, not colour
 *  alone, so the selected chip is reported to a screen reader as well as drawn. */
export function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`hit-area inline-flex h-[31px] cursor-pointer items-center rounded-pill border-none px-14 font-sans text-12 leading-none whitespace-nowrap transition-osrs ${
        active ? 'bg-brand-primary text-brand-on-primary ring-brand' : 'bg-surface-card text-ink-secondary ring-default'
      }`}
    >
      {label}
    </button>
  );
}
