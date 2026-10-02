import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button, MdiChevronDown } from '../../shared/ui';

export type AddKind = 'single' | 'batch';

const ITEMS: [kind: AddKind, label: string][] = [
  ['single', 'Add Single Unit'],
  ['batch', 'Add Multiple Units'],
];

/** **+ Add Inventory** — a menu button over Add Single Unit and Add Multiple
 *  Units, the only way to either panel (`03 - Inventory - Open Add Inventory
 *  Dropdown`; spec 015 FR-006, plan P11).
 *
 *  Arrow keys, Home and End move between the items. Esc, Tab and a click
 *  outside close the menu. Choosing an item puts focus back on the button
 *  before the panel opens, so the panel returns focus there when it closes
 *  (FR-016). */
export function AddInventoryMenu({ onChoose }: { onChoose: (kind: AddKind) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  /** Which item takes focus when the menu opens. */
  const [initial, setInitial] = useState<'first' | 'last'>('first');

  useEffect(() => {
    if (!open) return;
    items.current[initial === 'first' ? 0 : ITEMS.length - 1]?.focus();
    const outside = (e: PointerEvent) => {
      if (wrapper.current?.contains(e.target as Node)) return;
      setOpen(false);
      // A click on something focusable keeps that focus; anywhere else, focus
      // comes back to the button rather than falling to the page.
      requestAnimationFrame(() => {
        if (!document.activeElement || document.activeElement === document.body) buttonRef.current?.focus();
      });
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, initial]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = items.current.findIndex((item) => item === document.activeElement);
    const move = (to: number) => {
      e.preventDefault();
      items.current[(to + ITEMS.length) % ITEMS.length]?.focus();
    };
    if (e.key === 'ArrowDown') move(at + 1);
    else if (e.key === 'ArrowUp') move(at - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(ITEMS.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={wrapper} className="relative">
      <Button
        ref={buttonRef}
        variant="accent"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="gap-8"
        onClick={() => {
          setInitial('first');
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          e.preventDefault();
          setInitial(e.key === 'ArrowDown' ? 'first' : 'last');
          setOpen(true);
        }}
      >
        + Add Inventory
        <MdiChevronDown aria-hidden="true" className={`transition-osrs ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Add Inventory"
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-10 mt-7 flex min-w-full flex-col rounded-10 bg-surface-card py-[11px] shadow-card"
        >
          {/* Items stay 40px tall rather than the drawn 28px, so their 44px
              touch targets below the design width (index.css) don't overlap. */}
          {ITEMS.map(([kind, label], i) => (
            <button
              key={kind}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close();
                onChoose(kind);
              }}
              className="cursor-pointer border-none bg-transparent px-16 py-10 text-left type-body whitespace-nowrap text-ink-strong transition-osrs hover:bg-osrs-surface-subtle focus-visible:bg-osrs-surface-subtle focus-visible:-outline-offset-2"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
