import type { RequestListLine } from './request-list-types';

/** The drawn stepper square in `03 - Request List`: 30px, white, `line-default`
 *  hairline, r6, the sign in Inter Regular 12 black (U+2212 minus to match
 *  `+`, as `SupplyCard` does). `hit-area` keeps the drawn box at every width
 *  and meets the 44px touch minimum with an invisible pseudo-element — without
 *  it, the global rule below 1440px grows only the ENABLED square to 44px, so
 *  `−` and `+` differ in size. */
const STEP =
  'hit-area flex size-[30px] cursor-pointer items-center justify-center rounded-6 border-none bg-surface-card p-0 type-meta text-ink-primary ring-default transition-osrs hover:text-ink-secondary disabled:cursor-not-allowed disabled:opacity-40';

/** One line of the Request List (spec 008 FR-006), as `03 - Request List`
 *  draws it since 2026-09-23: the category as a grey eyebrow over the item
 *  name, a `− qty +` stepper, and **Remove**, on the 18px-padded card.
 *
 *  `−` stops at 1 and `+` at the item's Available at the Employee's office as
 *  last read (FR-003). A line already above a fresher Available keeps its
 *  quantity — the system decides at submit — so only `+` is disabled there.
 *  A validation message for this line, placed from the system's pointer
 *  (FR-013a), sits under the row and describes each of its controls, so it is
 *  read out wherever focus lands on the line. The invalid line keeps its card
 *  shadow and gains the brand-red hairline as `outline-brand` — an outline,
 *  not `ring-brand`, because two box-shadows on one element do not stack. */
export function RequestListLineRow({
  line,
  disabled,
  messages,
  onQuantity,
  onRemove,
}: {
  line: RequestListLine;
  /** While a submit is in flight, nothing in the list can change (FR-010a). */
  disabled: boolean;
  messages: readonly string[];
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const invalid = messages.length > 0;
  const messageId = `line-${line.assetId}-message`;
  const describedBy = invalid ? messageId : undefined;
  return (
    <li
      className={`flex flex-col gap-8 rounded-10 bg-surface-card p-18 shadow-card ${invalid ? 'outline-brand' : ''}`}
      data-invalid={invalid || undefined}
    >
      <div className="flex items-center gap-18">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Eyebrow: Inter Bold 14 in `Ink-400` — the fill style wins over the
              node's cached black (drift-2026-09-22 §9). Name: Inter Bold 15.
              Both are Figma "Auto" line height, which is the font's normal
              leading (17px and 18px boxes), not `leading-tight`. */}
          <span className="truncate font-sans text-14 font-bold leading-[normal] uppercase text-ink-muted">{line.category}</span>
          <span className="truncate font-sans text-15 font-bold leading-[normal] text-ink-primary">{line.name}</span>
        </div>
        <div className="flex items-center gap-10" role="group" aria-label={`Quantity of ${line.name}`}>
          <button
            type="button"
            className={STEP}
            onClick={() => onQuantity(line.quantity - 1)}
            disabled={disabled || line.quantity <= 1}
            aria-label={`Decrease ${line.name}`}
            aria-describedby={describedBy}
          >
            −
          </button>
          <span className="text-center font-sans text-12 font-bold leading-tight tabular-nums text-ink-primary" aria-live="polite">
            {line.quantity}
          </span>
          <button
            type="button"
            className={STEP}
            onClick={() => onQuantity(line.quantity + 1)}
            disabled={disabled || line.quantity >= line.available}
            aria-label={`Increase ${line.name}`}
            aria-describedby={describedBy}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${line.name}`}
          aria-describedby={describedBy}
          className="hit-area cursor-pointer border-none bg-transparent p-0 type-meta text-brand-primary-alt transition-osrs hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove
        </button>
      </div>
      {invalid ? (
        <ul id={messageId} className="flex flex-col gap-2">
          {messages.map((m) => (
            <li key={m} className="type-meta text-status-rejected-fg">
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
