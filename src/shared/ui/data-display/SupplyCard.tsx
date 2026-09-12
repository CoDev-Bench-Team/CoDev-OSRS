import { StatusPill } from './StatusPill';
import type { Availability } from '../status';
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
  modelLabel = 'Model',
  model = 'Dell Latitude',
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
  modelLabel?: string;
  model?: string;
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  actionLabel?: string;
  onAction?: () => void;
  image?: string;
  className?: string;
}) {
  const step = (d: number) => onQuantityChange?.(Math.max(1, quantity + d));
  const stepBtn =
    'cursor-pointer rounded-4 border-none bg-transparent px-8 py-4 font-sans text-14 font-semibold leading-tight text-osrs-stone-600 transition-osrs hover:text-osrs-stone-900';

  return (
    <div
      className={`flex w-full max-w-[436px] flex-col items-start overflow-hidden rounded-10 bg-surface-card shadow-card ${className ?? ''}`}
    >
      <img src={image ?? itemLaptop} alt="" className="h-[180px] w-full shrink-0 object-cover" />
      <div className="flex w-full flex-col items-start gap-12 p-18">
        <span className="line-clamp-1 type-eyebrow uppercase text-ink-secondary">{category}</span>
        {/* The pill sits immediately after the name, as the source draws it —
            not pushed to the far edge. `flex-1` on the name would do that, so
            the name only gets `min-w-0`, which lets it shrink and clamp when
            long while the pill stays adjacent. */}
        <div className="flex w-full items-center gap-12">
          <span className="line-clamp-2 min-w-0 type-card-title text-ink-primary">{name}</span>
          <span className="shrink-0">
            <StatusPill availability={availability} />
          </span>
        </div>
        <span className="font-sans text-11-5 font-bold leading-display text-ink-primary">{modelLabel}</span>
        <div className="flex h-control-height-lg w-full items-center justify-between overflow-hidden rounded-10 bg-surface-card px-16 ring-default">
          <span className="truncate font-sans text-14 leading-tight text-ink-primary">{model}</span>
          <span className="ml-8 shrink-0 font-sans text-12 leading-tight text-ink-secondary">⌄</span>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-12">
          <div className="flex items-center gap-8 rounded-4 bg-surface-stepper p-2">
            <button type="button" className={stepBtn} onClick={() => step(-1)} aria-label="Decrease quantity">
              -
            </button>
            <span className="font-sans text-13 font-semibold leading-tight text-osrs-stone-900" aria-live="polite">
              {quantity}
            </span>
            <button type="button" className={stepBtn} onClick={() => step(1)} aria-label="Increase quantity">
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onAction}
            /* 304px is the source's width. Capped rather than fixed so the
               button still shrinks below the design width (spec 002 D2). */
            className="flex h-control-height-md w-full max-w-[304px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-10 border-none bg-brand-primary px-18 type-ui-bold whitespace-nowrap text-brand-on-primary ring-brand transition-osrs hover:bg-osrs-red-550"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
