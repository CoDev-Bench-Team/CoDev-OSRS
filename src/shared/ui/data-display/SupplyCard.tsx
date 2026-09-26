import { StatusPill } from './StatusPill';
import { Select } from '../forms/Select';
import type { Availability, InventoryStatus } from '../status';
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
  inventory,
  maxQuantity,
  actionDisabled = false,
  modelLabel = 'Model',
  model = 'Dell Latitude',
  models,
  onModelChange,
  onViewSpecs,
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
  /** When given, the pill carries the design's three-state `Inventory Status`
   *  (Available / Low in Stock / Out of Stock) instead of the binary
   *  availability one, and `availability` is ignored. Added for the catalog,
   *  which must show the stock band rather than a boolean (spec 005 D1, D10);
   *  omit it and the card renders exactly as it did before. */
  inventory?: InventoryStatus;
  /** Upper bound for the stepper. Omitted, the stepper is unbounded as before. */
  maxQuantity?: number;
  actionDisabled?: boolean;
  modelLabel?: string;
  /** `null` removes the model label and select. The catalog uses it: in the
   *  2026-09-22 design each card is one asset, so there is no model to choose
   *  and `02 - Catalog` hides both nodes on every card (spec 005 D5).
   *  `undefined` keeps the sample model, so the gallery is unaffected. */
  model?: string | null;
  /** Selectable models. Defaults to just the current one, which keeps the
      control looking exactly as the source draws it when there is no choice. */
  models?: string[];
  onModelChange?: (model: string) => void;
  /** When given, the card draws the source's `View specs >` link, which calls
   *  this. Omitted, no link is drawn — the gallery's card renders as before. */
  onViewSpecs?: () => void;
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  /** `null` removes the action and its stepper — the card renders read-only. Used by
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
    'hit-area flex size-22 cursor-pointer items-center justify-center rounded-4 border-none bg-transparent p-0 pb-2 font-sans text-14 font-semibold leading-tight text-osrs-stone-600 transition-osrs hover:text-osrs-stone-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-osrs-stone-600';

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
            {inventory ? <StatusPill inventory={inventory} /> : <StatusPill availability={availability} />}
          </span>
        </div>
        {model === null ? null : (
          <>
            <span className="font-sans text-11-5 font-bold leading-display text-ink-primary">{modelLabel}</span>
            {/* A custom listbox, not a native <select>: the overlay is styled
                from the design system rather than drawn by the OS. Everything
                the native control provided — keyboard operation, type-ahead,
                screen-reader semantics — is implemented in Select rather than
                given up. */}
            <Select
              label={modelLabel}
              value={model}
              options={models ?? [model]}
              onChange={(m) => onModelChange?.(m)}
            />
          </>
        )}
        {onViewSpecs ? (
          /* The source's `Label 1` text style (Inter Bold 11.5) bound to its
             `Link` fill. A button, not an anchor: it opens a panel and has no
             address of its own. The accessible name carries the item, so a
             screen reader moving through the grid hears which specs open. */
          <button
            type="button"
            onClick={onViewSpecs}
            aria-label={`View specs for ${name}`}
            className="hit-area cursor-pointer border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-display text-osrs-blue-600 transition-osrs hover:underline"
          >
            View specs &gt;
          </button>
        ) : null}
        {/* A read-only card (`actionLabel={null}`) has nothing to count toward,
            so the stepper goes with the action rather than being left as a
            control that does nothing. */}
        {actionLabel === null ? null : (
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
          </div>
        )}
      </div>
    </div>
  );
}
