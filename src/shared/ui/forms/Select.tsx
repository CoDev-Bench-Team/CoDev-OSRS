import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdiChevronDown } from '../icons/MdiChevronDown';
import { onDismissPopovers } from '../overlay/popover-layer';

const OPEN_KEYS = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

/** The keys that move the active option, as (current, count) → next. */
const NAVIGATION: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => (n ? (i + 1) % n : 0),
  ArrowUp: (i, n) => (n ? (i - 1 + n) % n : 0),
  Home: () => 0,
  End: (_, n) => n - 1,
};

/** Type-ahead: keys typed within 800ms of each other build one prefix. Returns
 *  the first option starting with it, or -1. */
function typeAhead(typed: { buffer: string; at: number }, key: string, options: readonly string[]): number {
  const now = Date.now();
  typed.buffer = now - typed.at > 800 ? key : typed.buffer + key;
  typed.at = now;
  const q = typed.buffer.toLowerCase();
  return options.findIndex((o) => o.toLowerCase().startsWith(q));
}

function triggerClass(field: boolean, invalid: boolean, disabled: boolean): string {
  const shape = field
    ? `h-[39px] rounded-6 border px-12 ${invalid ? 'border-status-rejected-fg' : 'border-osrs-border-warm'}`
    : 'h-control-height-lg rounded-10 border-none px-16 ring-default';
  const pointer = disabled ? 'cursor-default' : 'cursor-pointer hover:text-ink-secondary';
  return `flex w-full items-center justify-between gap-8 bg-surface-card text-left transition-osrs ${shape} ${pointer}`;
}

function valueClass(field: boolean, hasValue: boolean): string {
  const ink = !hasValue ? 'text-ink-secondary' : field ? 'text-osrs-ink-800' : 'text-ink-primary';
  return `truncate font-sans leading-tight ${field ? 'text-12' : 'text-14'} ${ink}`;
}

/** A custom select with an overlay panel, styled from the design system.
 *
 *  Replacing a native <select> means giving up everything the platform provided
 *  — keyboard operation, type-ahead, screen-reader semantics — so this
 *  implements the ARIA listbox pattern rather than being a div that opens:
 *
 *   - the trigger is a combobox with `aria-expanded` and `aria-activedescendant`
 *   - Enter, Space, Arrow keys and Alt+Down open the panel
 *   - Arrows move the active option, Home and End jump, Escape closes
 *   - typing jumps to the first option starting with those characters
 *   - focus returns to the trigger on close, so Tab order is never lost
 *   - the panel flips above the trigger when there is not room below
 */
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select',
  disabled,
  required,
  invalid,
  describedBy,
  className,
  id: triggerId,
  size = 'md',
}: {
  value?: string;
  options: string[];
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Disables the control. Option count has no bearing on this: a select with
   *  one option opens and shows it, the way a native select does. */
  disabled?: boolean;
  /** Announced to assistive technology; the visible asterisk is the caller's. */
  required?: boolean;
  /** Announced as invalid; the message that says why is the caller's. */
  invalid?: boolean;
  /** The id of the element that explains the current error, if any. */
  describedBy?: string;
  className?: string;
  /** For a visible `<label htmlFor>` naming the control, as a form field has. */
  id?: string;
  /** `field` is the admin side panels' 39px input: 6px radius, warm hairline,
   *  12px text, matching `TextInput` beside it. */
  size?: 'md' | 'field';
}) {
  // Disabled only when asked. A single option is not a reason to disable: the
  // control still opens and shows what is there, which is what a native select
  // does. Using the real `disabled` attribute rather than only `aria-disabled`
  // keeps it out of the tab order when it is set.
  const isDisabled = disabled === true;
  const field = size === 'field';
  const selectedIndex = () => Math.max(0, options.indexOf(value ?? ''));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  // Where the open list is portalled; resolved when it opens, not in render.
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ buffer: '', at: 0 });
  const id = useId();

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      const next = options[index];
      if (next !== undefined) onChange?.(next);
      close();
    },
    [options, onChange, close],
  );

  // A modal appearing dismisses any popover that is already open. The popover
  // layer sits above the dialog layer so a select inside a dialog works, which
  // means ordering alone cannot keep a stale popover off a new scrim.
  useEffect(() => onDismissPopovers(() => setOpen(false)), []);

  // Close on a click outside, and on scroll — an anchored panel that stays put
  // while the page moves is worse than one that closes.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      // The panel lives in a portal, so it is not inside rootRef.
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    // Close when the page scrolls underneath an anchored panel — but ignore
    // scrolling inside our own list, including the scrolling this component
    // does itself to keep the active option visible.
    const onScroll = (e: Event) => {
      const target = e.target as Node;
      if (listRef.current === target || listRef.current?.contains(target)) return;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  /** Position the panel before paint, so it never appears and then jumps.
   *
   *  The panel is portalled to <body> and positioned fixed rather than being
   *  absolutely placed next to the trigger. It has to be: SupplyCard clips its
   *  content with `overflow-hidden` to round the image corners, which would cut
   *  the panel off inside the card. No z-index can escape a clipping ancestor. */
  useLayoutEffect(() => {
    if (!open) return;
    // Inside an open modal <dialog> (SidePanel) everything outside the dialog
    // is inert and below the top layer, so the list goes into the dialog.
    // Anywhere else it goes to <body>, clear of clipping cards. The dialog is
    // the containing block for `position: fixed` (SidePanel says why), so
    // coordinates there are measured from its box, not the viewport.
    const host = triggerRef.current?.closest<HTMLElement>('dialog[open]') ?? null;
    setLayer(host ?? document.body);
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const origin = host?.getBoundingClientRect() ?? { top: 0, left: 0 };
      const needed = Math.min(options.length, 6) * 42 + 8;
      const below = window.innerHeight - r.bottom;
      const flip = below < needed && r.top > below;
      setRect({
        top: (flip ? r.top - needed - 4 : r.bottom + 4) - origin.top,
        left: r.left - origin.left,
        width: r.width,
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, options.length]);

  // Scroll the list itself rather than calling scrollIntoView, which walks up
  // and scrolls the window too when the control is below the fold — that fired
  // the scroll handler above and closed the panel on the first arrow key.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (!open) {
      if (OPEN_KEYS.has(e.key)) {
        e.preventDefault();
        setActive(selectedIndex());
        setOpen(true);
      }
      return;
    }
    const step = NAVIGATION[e.key];
    if (step) {
      e.preventDefault();
      setActive((i) => step(i, options.length));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(active);
    } else if (e.key.length === 1) {
      const hit = typeAhead(typed.current, e.key, options);
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={rootRef} className={`relative w-full ${className ?? ''}`}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup={isDisabled ? undefined : 'listbox'}
        aria-controls={isDisabled ? undefined : `${id}-list`}
        aria-label={label}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        data-option-count={options.length}
        onClick={() => {
          if (isDisabled) return;
          setActive(selectedIndex());
          setOpen((o) => !o);
        }}
        onKeyDown={onKeyDown}
        className={triggerClass(field, invalid === true, isDisabled)}
      >
        <span className={valueClass(field, value !== undefined)}>
          {value ?? placeholder}
        </span>
        <MdiChevronDown
          size={field ? 16 : 20}
          className={`shrink-0 text-ink-secondary transition-osrs ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        !isDisabled &&
        rect &&
        layer &&
        createPortal(
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
            className="z-popover max-h-[260px] overflow-y-auto rounded-10 bg-surface-card p-4 shadow-card ring-default"
          >
            {options.map((option, i) => {
              const selected = option === value;
              return (
                <li
                  key={option}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex cursor-pointer items-center justify-between gap-8 rounded-6 px-12 py-10 font-sans text-14 leading-tight transition-osrs ${
                    selected ? 'font-bold text-brand-primary' : 'text-ink-primary'
                  } ${i === active ? 'bg-osrs-surface-subtle' : ''}`}
                >
                  <span className="truncate">{option}</span>
                </li>
              );
            })}
          </ul>,
          layer,
        )}
    </div>
  );
}
