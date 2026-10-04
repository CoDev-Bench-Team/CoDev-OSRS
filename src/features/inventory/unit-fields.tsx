import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Field, FieldGroup, Search, TextField, TextInput, type FieldControl } from '../../shared/ui';
import { onDismissPopovers } from '../../shared/ui/overlay/popover-layer';
import type { Asset, Category } from '../assets/types';
import { deviceFieldsFor } from './device-fields';
import { caretAt, settleAmount, typeAmount } from './format';
import { removal } from './unit-rules';
import type { DirectoryUser } from './user-directory';
import type { UnitStatus } from '../../shared/ui';

/** The parts the Inventory panels share (spec 015 plan P12). */

type Errors = Record<string, string | undefined>;

/** `bytesize:close`, as every panel in the file draws it. */
function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-16" fill="none" aria-hidden="true">
      <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** A refusal that names no field, above the form or the rows it is about. */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-6 bg-status-rejected-bg px-12 py-10 type-meta leading-body text-status-rejected-fg">
      {message}
    </p>
  );
}

/** Under Catalog Item or User when its list fails to load. Closing the
 *  panel and opening it again loads the list again. */
const CATALOG_UNLOADED = 'Catalog items could not be loaded. Close the panel and try again';
const USERS_UNLOADED = 'Users could not be loaded. Close the panel and try again';

/** **Cancel** and the submit button, centred under the panel. */
export function FormFooter({
  formId,
  saving,
  disabled,
  submitLabel,
  savingLabel,
  onCancel,
}: {
  formId: string;
  saving: boolean;
  disabled?: boolean;
  submitLabel: string;
  savingLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-12">
      <Button variant="ghost" disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" form={formId} disabled={saving || disabled}>
        {saving ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}

const RESULT_LIMIT = 8;

/** The list's tallest, as its `max-h` says. */
const LIST_MAX_HEIGHT = 260;

type ListPlace = { left: number; width: number } & ({ top: number } | { bottom: number });

/** An ARIA 1.2 combobox's keyboard and list state over `items`: Arrow keys
 *  move the active option, Enter picks it, Esc closes the list. The list is
 *  undrawn (logged in additions.md).
 *
 *  The list overlays what is under the field rather than pushing it down. As
 *  the shared `Select` does, it is portalled out of the panel's scrolling body,
 *  which would otherwise clip it: into the open `<dialog>` when there is one
 *  (everything outside a modal dialog is inert), else `<body>`, and placed
 *  fixed under the field (`anchor`), or above it when there is no room below.
 *  It follows the field when the panel scrolls. */
function useCombobox<T>(items: readonly T[], onPick: (item: T) => void) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const shown = items.slice(0, RESULT_LIMIT);
  const expanded = open && shown.length > 0;
  const anchor = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [place, setPlace] = useState<ListPlace | null>(null);

  // A modal appearing dismisses any list already open (popover-layer.ts).
  useEffect(() => onDismissPopovers(() => setOpen(false)), []);

  // Placed before paint, so the list never appears and then jumps.
  useLayoutEffect(() => {
    if (!expanded) return;
    const host = anchor.current?.closest<HTMLElement>('dialog[open]') ?? null;
    setLayer(host ?? document.body);
    const measure = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      // A modal <dialog> is the containing block for `position: fixed`
      // (SidePanel says why), so coordinates there are from its box.
      const box = host?.getBoundingClientRect() ?? { top: 0, left: 0, bottom: window.innerHeight };
      const below = window.innerHeight - r.bottom;
      const flip = below < LIST_MAX_HEIGHT + 8 && r.top > below;
      setPlace(
        flip
          ? { bottom: box.bottom - r.top + 4, left: r.left - box.left, width: r.width }
          : { top: r.bottom + 4 - box.top, left: r.left - box.left, width: r.width },
      );
    };
    measure();
    // The panel body scrolls under the list: follow the field, but not when
    // the list scrolls itself.
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      measure();
    };
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [expanded]);

  const pick = (item: T) => {
    onPick(item);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + shown.length) % shown.length);
    } else if (e.key === 'Enter' && expanded) {
      e.preventDefault();
      const item = shown[active];
      if (item !== undefined) pick(item);
    } else if (e.key === 'Escape' && expanded) {
      // The panel's Esc closes the panel; this one only closes the list.
      e.preventDefault();
      setOpen(false);
    }
  };

  const inputProps = {
    role: 'combobox' as const,
    'aria-expanded': expanded,
    'aria-controls': `${id}-list`,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant': expanded ? `${id}-opt-${active}` : undefined,
    autoComplete: 'off',
    onKeyDown,
    onBlur: () => setOpen(false),
  };

  const list = (label: string, render: (item: T) => ReactNode, key: (item: T) => string) =>
    expanded && layer && place ? createPortal(
      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        style={{ position: 'fixed', ...place }}
        className="z-popover max-h-[260px] overflow-y-auto rounded-10 bg-surface-card p-4 shadow-card ring-default"
      >
        {shown.map((item, i) => (
          <li
            key={key(item)}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => setActive(i)}
            // Before the input's blur closes the list.
            onMouseDown={(e) => {
              e.preventDefault();
              pick(item);
            }}
            className={`flex cursor-pointer flex-col gap-4 rounded-6 px-12 py-10 transition-osrs ${i === active ? 'bg-osrs-surface-subtle' : ''}`}
          >
            {render(item)}
          </li>
        ))}
      </ul>,
      layer,
    ) : null;

  return {
    /** The field the list hangs from. */
    anchor,
    inputProps,
    list,
    reveal: () => {
      setOpen(true);
      setActive(0);
    },
  };
}

const matches = (needle: string, ...values: (string | undefined)[]) => {
  const q = needle.trim().toLowerCase();
  return !q || values.some((v) => v?.toLowerCase().includes(q));
};

/** `Catalog Item *` — searches the Assets source by item name or model and,
 *  once one is chosen, shows its category as an eyebrow over the name with ✕
 *  (spec 015 Story 2 criterion 3, `03.1.1`). */
export function CatalogItemPicker({
  assets,
  value,
  onChange,
  error,
  failed,
}: {
  /** `null` while the Assets source loads. */
  assets: readonly Asset[] | null;
  /** The Assets source could not be read. */
  failed?: boolean;
  value: Asset | undefined;
  onChange: (asset: Asset | undefined) => void;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const wrapper = useRef<HTMLDivElement>(null);
  const found = (assets ?? []).filter((a) => matches(query, a.name, a.model));
  const box = useCombobox(found, (asset) => {
    onChange(asset);
    setQuery('');
  });

  return (
    <div ref={wrapper} className="flex flex-col gap-14">
      <Field label="Catalog Item" required error={error ?? (failed ? CATALOG_UNLOADED : undefined)}>
        {({ id, required, invalid, describedBy }) => (
          <div ref={box.anchor}>
            <Search
              id={id}
              placeholder="Search catalog item name or code"
              aria-required={required}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={assets === null}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                box.reveal();
              }}
              onClear={() => setQuery('')}
              {...box.inputProps}
              // Focus or a click lists the catalog; typing narrows it.
              onFocus={box.reveal}
              onClick={box.reveal}
            />
            {box.list(
              'Catalog items',
              (a) => (
                <>
                  <span className="type-eyebrow uppercase text-ink-secondary">{a.category}</span>
                  <span className="font-sans text-14 leading-tight text-ink-primary">{a.name}</span>
                  {a.model ? <span className="type-meta text-ink-secondary">{a.model}</span> : null}
                </>
              ),
              (a) => a.id,
            )}
          </div>
        )}
      </Field>
      {value ? (
        <div className="flex items-center gap-5 rounded-8 border border-osrs-border-warm bg-surface-card p-12">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <span className="font-sans text-11 font-bold leading-tight text-ink-muted uppercase">{value.category}</span>
            <span className="truncate font-sans text-11 font-bold leading-tight text-osrs-ink-800">{value.name}</span>
          </div>
          <button
            type="button"
            aria-label={`Clear catalog item ${value.name}`}
            onClick={() => {
              onChange(undefined);
              // The ✕ goes with the chosen item; focus moves to the search.
              wrapper.current?.querySelector('input')?.focus();
            }}
            className="inline-flex size-touch-target shrink-0 cursor-pointer items-center justify-center rounded-8 border-none bg-transparent text-ink-primary transition-osrs hover:text-ink-secondary"
          >
            <CloseGlyph />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** `User` — every user, any role, any office, by name or email (FR-008). Focus
 *  lists them all; typing filters. The field reads the chosen user's name. */
export function UserPicker({
  users,
  value,
  pendingName,
  onChange,
  error,
  disabled,
}: {
  /** `null` while loading, `'failed'` if the directory could not be read. */
  users: readonly DirectoryUser[] | null | 'failed';
  value: string | undefined;
  /** The chosen user's name from a restored draft, shown while the directory
   *  loads. */
  pendingName?: string;
  onChange: (userId: string | undefined) => void;
  error?: string;
  disabled?: boolean;
}) {
  const failed = users === 'failed';
  const list = failed ? [] : (users ?? []);
  const chosen = list.find((u) => u.id === value);
  const [query, setQuery] = useState<string | null>(null);
  const typed = query ?? chosen?.name ?? (value && users === null ? (pendingName ?? '') : '');
  const found = query === null ? list : list.filter((u) => matches(query, u.name, u.email));
  const box = useCombobox(found, (user) => {
    onChange(user.id);
    setQuery(null);
  });

  return (
    <Field label="User" error={error ?? (failed ? USERS_UNLOADED : undefined)}>
      {({ id, invalid, describedBy }) => (
        <div ref={box.anchor}>
          <TextInput
            id={id}
            placeholder="Insert here..."
            invalid={invalid}
            aria-describedby={describedBy}
            disabled={disabled || users === null}
            value={typed}
            onChange={(e) => {
              setQuery(e.target.value);
              box.reveal();
              // Editing the name lets go of the user it named.
              if (value) onChange(undefined);
            }}
            {...box.inputProps}
            // The whole directory opens on focus; typing narrows it.
            onFocus={box.reveal}
            onClick={box.reveal}
            onBlur={() => {
              box.inputProps.onBlur();
              setQuery(null);
            }}
          />
          {box.list(
            'Users',
            (u) => (
              <>
                <span className="font-sans text-14 leading-tight text-ink-primary">{u.name}</span>
                <span className="type-meta text-ink-secondary">
                  {u.email}
                  {u.department ? ` · ${u.department}` : ''}
                </span>
              </>
            ),
            (u) => u.id,
          )}
        </div>
      )}
    </Field>
  );
}

/** A BitLocker Identifier or Recovery Key/PIN input: masked by default with a
 *  Show/Hide toggle (spec 015 D6, FR-012). Masked by CSS on a text input,
 *  never `type="password"`, so no browser offers to save it as a password
 *  (plan R3). */
export function SecretInput({
  control,
  label,
  value,
  onChange,
}: {
  control: FieldControl;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <TextInput
        id={control.id}
        invalid={control.invalid}
        aria-describedby={control.describedBy}
        type="text"
        autoComplete="off"
        spellCheck={false}
        data-secret=""
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pr-[64px] ${shown ? '' : '[-webkit-text-security:disc]'}`}
      />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={`${shown ? 'Hide' : 'Show'} ${label}`}
        onClick={() => setShown((s) => !s)}
        className="absolute top-1/2 right-4 h-control-height-sm -translate-y-1/2 cursor-pointer rounded-6 border-none bg-transparent px-10 font-sans text-11 font-bold text-ink-link"
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export type Purchase = { pr: string; price: string; supplier: string; purchasedAt: string };

/** PURCHASE DETAILS: Purchase Request (ours, D14), Price in pesos, Supplier,
 *  Purchased Date no later than today (FR-013). */
export function PurchaseFields({
  value,
  onChange,
  errors,
  today,
}: {
  value: Purchase;
  onChange: <K extends keyof Purchase>(key: K, value: Purchase[K]) => void;
  errors: Errors;
  today: string;
}) {
  // Reformatting moves the commas, so the caret is put back after the same
  // digits it followed. Runs after every render: a keystroke the format
  // drops (a letter) re-renders nothing yet still needs the caret restored.
  const priceCaret = useRef<{ input: HTMLInputElement; at: number } | null>(null);
  useLayoutEffect(() => {
    const pending = priceCaret.current;
    if (!pending) return;
    priceCaret.current = null;
    pending.input.setSelectionRange(pending.at, pending.at);
  });
  return (
    <FieldGroup heading="PURCHASE DETAILS">
      <Field label="Purchase Request" error={errors.pr}>
        {({ id, invalid, describedBy }) => (
          <TextInput
            id={id}
            invalid={invalid}
            aria-describedby={describedBy}
            placeholder="e.g. 2026-0142"
            value={value.pr}
            onChange={(e) => onChange('pr', e.target.value)}
          />
        )}
      </Field>
      <Field label="Price" error={errors.price}>
        {({ id, invalid, describedBy }) => (
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-12 -translate-y-1/2 type-meta text-ink-secondary">
              Php
            </span>
            <TextInput
              id={id}
              invalid={invalid}
              aria-describedby={describedBy}
              inputMode="decimal"
              placeholder="0.00"
              value={value.price}
              onChange={(e) => {
                const input = e.target;
                const typed = input.value;
                const significant = typed.slice(0, input.selectionStart ?? typed.length).replace(/[^\d.]/g, '').length;
                const next = typeAmount(typed);
                const caret = { input, at: caretAt(next, significant) };
                if (next === value.price) queueMicrotask(() => input.setSelectionRange(caret.at, caret.at));
                else priceCaret.current = caret;
                onChange('price', next);
              }}
              onBlur={() => {
                const settled = settleAmount(value.price);
                if (settled !== value.price) onChange('price', settled);
              }}
              className="pl-[44px]"
            />
          </div>
        )}
      </Field>
      <Field label="Supplier" error={errors.supplier}>
        {({ id, invalid, describedBy }) => (
          <TextInput
            id={id}
            invalid={invalid}
            aria-describedby={describedBy}
            placeholder="e.g. Ace Supplies"
            value={value.supplier}
            onChange={(e) => onChange('supplier', e.target.value)}
          />
        )}
      </Field>
      <Field label="Purchased Date" error={errors.purchasedAt}>
        {({ id, invalid, describedBy }) => (
          <TextInput
            id={id}
            type="date"
            max={today}
            invalid={invalid}
            aria-describedby={describedBy}
            value={value.purchasedAt}
            onChange={(e) => onChange('purchasedAt', e.target.value)}
          />
        )}
      </Field>
    </FieldGroup>
  );
}

export type Device = { serialNumber: string; bitlockerIdentifier: string; recoveryPin: string };

/** DEVICE DETAILS, from `DEVICE_FIELDS`: Serial Number always, required by
 *  category; the BitLocker pair for a Laptop only (D13). */
export function DeviceFields({
  category,
  value,
  onChange,
  errors,
}: {
  category: Category | undefined;
  value: Device;
  onChange: <K extends keyof Device>(key: K, value: Device[K]) => void;
  errors: Errors;
}) {
  const rule = deviceFieldsFor(category);
  return (
    <FieldGroup heading="DEVICE DETAILS">
      <Field label="Serial Number" required={rule.serial === 'required'} error={errors.serialNumber}>
        {({ id, required, invalid, describedBy }) => (
          <TextInput
            id={id}
            required={required}
            invalid={invalid}
            aria-describedby={describedBy}
            autoComplete="off"
            placeholder="e.g. PF3ABCXY"
            value={value.serialNumber}
            onChange={(e) => onChange('serialNumber', e.target.value)}
          />
        )}
      </Field>
      {rule.bitlocker ? (
        <>
          <Field label="BitLocker Identifier" error={errors.bitlockerIdentifier}>
            {(control) => (
              <SecretInput
                control={control}
                label="BitLocker Identifier"
                value={value.bitlockerIdentifier}
                onChange={(v) => onChange('bitlockerIdentifier', v)}
              />
            )}
          </Field>
          <Field label="Recovery Key/PIN" error={errors.recoveryPin}>
            {(control) => (
              <SecretInput control={control} label="Recovery Key/PIN" value={value.recoveryPin} onChange={(v) => onChange('recoveryPin', v)} />
            )}
          </Field>
        </>
      ) : null}
    </FieldGroup>
  );
}

/** `mdi-light:delete`, the file's 14px glyph. */
function DeleteGlyph() {
  return (
    <svg viewBox="0 0 14 14" className="size-14" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5h9M5.5 3.5V2.25h3V3.5M3.5 3.5l.6 8.25h5.8l.6-8.25M5.75 5.75v4M8.25 5.75v4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** REMOVE UNIT: the **Remove Unit** link for a unit no one holds, the reason
 *  it cannot be removed otherwise (FR-009), and in removing mode the required
 *  `Reason for removal *` (`03 - Inventory - Delete Unit Confirmation`). */
export function RemoveUnitSection({
  status,
  removing,
  reason,
  error,
  onReason,
  onStart,
}: {
  status: UnitStatus;
  removing: boolean;
  reason: string;
  error?: string;
  onReason: (reason: string) => void;
  onStart: () => void;
}) {
  const rule = removal({ status });
  return (
    <FieldGroup heading="REMOVE UNIT">
      {!rule.allowed ? (
        <p className="rounded-10 border border-status-low-fg bg-status-low-bg p-20 font-sans text-12-5 leading-body text-status-low-fg">
          {rule.reason}
        </p>
      ) : removing ? (
        <TextField
          label="Reason for removal"
          hint="This unit will be deleted and cannot be restored. Are you sure you want to continue?"
          tone="danger"
          size="sm"
          required
          autoFocus
          placeholder="e.g item on hold, insufficient justification..."
          value={reason}
          invalid={!!error}
          message={error}
          onChange={(e) => onReason(e.target.value)}
        />
      ) : (
        <button
          type="button"
          onClick={onStart}
          className="inline-flex w-fit cursor-pointer items-center gap-4 border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-tight text-brand-primary-alt hover:underline"
        >
          <DeleteGlyph />
          Remove Unit
        </button>
      )}
    </FieldGroup>
  );
}
