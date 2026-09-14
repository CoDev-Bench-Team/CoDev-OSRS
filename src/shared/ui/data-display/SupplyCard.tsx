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
  modelLabel?: string;
  model?: string;
  /** Selectable models. Defaults to just the current one, which keeps the
      control looking exactly as the source draws it when there is no choice. */
  models?: string[];
  onModelChange?: (model: string) => void;
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
        {/* A real <select>, not a div that looks like one. Native gives keyboard
            control, type-ahead, screen-reader semantics and the platform picker
            on mobile for free — none of which a styled div can reproduce.
            `appearance-none` removes the OS arrow so the source's own "⌄" is
            what shows. */}
        <div className="relative w-full">
          <select
            value={model}
            onChange={(e) => onModelChange?.(e.target.value)}
            aria-label={modelLabel}
            className="h-control-height-lg w-full cursor-pointer appearance-none truncate rounded-10 bg-surface-card py-0 pr-40 pl-16 font-sans text-14 leading-tight text-ink-primary ring-default transition-osrs focus-visible:ring-brand"
          >
            {(models ?? [model]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {/* The glyph's ink (15px) overflows its 12px line box, so centring the
              box does not centre what you see. Giving it a square box with the
              ink centred inside makes its position predictable. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-16 flex h-16 w-16 -translate-y-1/2 items-center justify-center font-sans text-12 leading-none text-ink-secondary"
          >
            ⌄
          </span>
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
