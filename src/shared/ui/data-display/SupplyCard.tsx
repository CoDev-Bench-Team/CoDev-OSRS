import { StatusPill } from './StatusPill';
import { Select } from '../forms/Select';
import type { Availability, StockStatus } from '../status';
import itemLaptop from '../../../assets/items/item-laptop.jpg';

/** The catalog tile. 436px at the design width, fluid below it (spec 002 D2).
 *
 *  The "⌄" in the model select and the "-" / "+" in the stepper are set in
 *  Inter at the surrounding size, exactly as the source does — they are the
 *  only two places the file uses Unicode as iconography, and substituting a
 *  chevron icon would be a change, not a port. */
export function SupplyCard({
  category = 'Devices',
  name = 'Business Laptop',
  availability = 'available',
  stock,
  onHand,
  maxQuantity,
  actionDisabled = false,
  modelLabel = 'Model',
  model = 'Dell Latitude',
  models,
  onModelChange,
  quantity = 1,
  onQuantityChange,
  actionLabel = 'Add to Request List',
  onAction,
  image,
  className,
}: {
  category?: string;
  name?: string;
  availability?: Availability;
  /** When given, the pill carries the three-state stock vocabulary instead of
   *  the binary availability one, and `availability` is ignored. Added for the
   *  catalog, which must show real stock rather than a boolean (spec 005 D1);
   *  omit it and the card renders exactly as it did before. */
  stock?: StockStatus;
  /** On-hand count, shown beside the model label. Omitted, nothing is drawn. */
  onHand?: number;
  /** Upper bound for the stepper. Omitted, the stepper is unbounded as before. */
  maxQuantity?: number;
  actionDisabled?: boolean;
  modelLabel?: string;
  model?: string;
  /** Selectable models. Defaults to just the current one, which keeps the
      control looking exactly as the source draws it when there is no choice. */
  models?: string[];
  onModelChange?: (model: string) => void;
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  /** `null` removes the action entirely — the card renders read-only. Used by
   *  the catalog, where only an Employee is offered the control that starts a
   *  request (spec 005 FR-008). `undefined` keeps the default label, so the
   *  gallery is unaffected. */
  actionLabel?: string | null;
  onAction?: () => void;
  /** `undefined` keeps the sample photo the gallery relies on. Pass `null` to
   *  say the item genuinely has no image, and a neutral tile is drawn instead —
   *  a laptop photograph standing in for a headset is worse than no photograph. */
  image?: string | null;
  className?: string;
}) {
  const ceiling = maxQuantity ?? Number.POSITIVE_INFINITY;
  const step = (d: number) => onQuantityChange?.(Math.min(ceiling, Math.max(1, quantity + d)));
  /* The source pads the glyph (4px 8px), which makes the button as wide as
     its character: 22.5px around "-" and 25.4px around "+". Both are fixed
     22px squares here so the pair reads as symmetric.

     `pb-2`: Inter's ascender/descender split puts the baseline at 16.06px in
     a 22px box, and the sign glyphs' ink centres 4.04px above the baseline,
     so a centred line box paints them 1px low. Two pixels of bottom padding
     lift the line box by one. Measured, not eyeballed.

     `hit-area`: below the design width the global 44px touch-target rule
     would grow the box and the stepper with it (73x26 became 113x48), so the
     44px is supplied by an invisible pseudo-element instead and the drawn
     geometry holds at every width. */
  const stepBtn =
    'hit-area flex size-22 cursor-pointer items-center justify-center rounded-4 border-none bg-transparent p-0 pb-2 font-sans text-14 font-semibold leading-tight text-osrs-stone-600 transition-osrs hover:text-osrs-stone-900';

  return (
    <div
      className={`flex w-full max-w-[436px] flex-col items-start overflow-hidden rounded-10 bg-surface-card shadow-card ${className ?? ''}`}
    >
      {image === null ? (
        <div
          aria-hidden
          className="flex h-[180px] w-full shrink-0 items-center justify-center bg-surface-stepper"
        >
          <span className="type-eyebrow uppercase text-ink-secondary">No image</span>
        </div>
      ) : (
        <img src={image ?? itemLaptop} alt="" className="h-[180px] w-full shrink-0 object-cover" />
      )}
      <div className="flex w-full flex-col items-start gap-12 p-18">
        <span className="line-clamp-1 type-eyebrow uppercase text-ink-secondary">{category}</span>
        {/* The pill sits immediately after the name, as the source draws it —
            not pushed to the far edge. `flex-1` on the name would do that, so
            the name only gets `min-w-0`, which lets it shrink and clamp when
            long while the pill stays adjacent. */}
        <div className="flex w-full items-center gap-12">
          <span className="line-clamp-2 min-w-0 type-card-title text-ink-primary">{name}</span>
          <span className="shrink-0">
            {stock ? <StatusPill stock={stock} /> : <StatusPill availability={availability} />}
          </span>
        </div>
        <div className="flex w-full items-baseline justify-between gap-12">
          <span className="font-sans text-11-5 font-bold leading-display text-ink-primary">{modelLabel}</span>
          {/* The number FR-002 asks for. The pill says which band the shelf is
              in; this says how deep it is. */}
          {onHand === undefined ? null : (
            <span className="font-sans text-11-5 leading-display tabular-nums text-ink-secondary">
              {onHand} on hand
            </span>
          )}
        </div>
        {/* A custom listbox, not a native <select>: the overlay is styled from
            the design system rather than drawn by the OS. Everything the native
            control provided — keyboard operation, type-ahead, screen-reader
            semantics — is implemented in Select rather than given up. */}
        <Select
          label={modelLabel}
          value={model}
          options={models ?? [model]}
          onChange={(m) => onModelChange?.(m)}
        />
        <div className="flex w-full flex-wrap items-center justify-between gap-12">
          {/* gap-4, not the source's 8: with a three-digit slot the number
              already has slack either side, and 8 on top of it read as a hole. */}
          <div className="flex items-center gap-4 rounded-4 bg-surface-stepper p-2">
            {/* U+2212 minus, not the hyphen the source types. The hyphen is a
                6.5px dash sitting on the x-height axis; the minus is 9.42px on
                the math axis, exactly matching "+" in width and height, so the
                two signs are the same size and sit on the same line. */}
            <button
              type="button"
              className={stepBtn}
              onClick={() => step(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            {/* The source draws "1" at its natural width, which would let the
                stepper widen and the primary button shrink as digits are added.
                The slot is fixed at three tabular digits instead: a request
                cannot exceed stock, so 999 covers the range, and tabular
                figures give every digit the same advance so 1 → 10 → 100
                moves nothing. Beyond three digits the slot grows rather than
                overlapping the buttons. */}
            <span
              className="min-w-[3ch] text-center font-sans text-13 font-semibold leading-tight tabular-nums text-osrs-stone-900"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              className={stepBtn}
              onClick={() => step(1)}
              disabled={quantity >= ceiling}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          {actionLabel === null ? null : (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            /* 304px is the source's width. Capped rather than fixed so the
               button still shrinks below the design width (spec 002 D2). */
            className="flex h-control-height-md w-full max-w-[304px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-10 border-none bg-brand-primary px-18 type-ui-bold whitespace-nowrap text-brand-on-primary ring-brand transition-osrs hover:bg-osrs-red-550 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-primary"
          >
            {actionLabel}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
