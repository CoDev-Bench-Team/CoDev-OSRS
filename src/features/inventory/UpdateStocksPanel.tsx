import { useId, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, SidePanel, TextInput } from '../../shared/ui';
import { fieldErrors, isValidationProblem } from '../../shared/validation';
import { OFFICES, type Office } from '../auth/types';
import { available, clampTotal } from '../assets/stock';
import type { Asset, StockChange } from '../assets/types';

/** Update stocks — `03.4 - Update Stocks` (spec 008 Story 5).
 *
 *  A stepper sets an office's **Total**. Reserved belongs to the request
 *  pipeline and is not editable here, so each stepper is floored at that
 *  office's Reserved: `−` stops there and a typed value below it is raised back
 *  on blur. Available is always `Total − Reserved`, so nothing on this panel
 *  can break `Total = Available + Reserved` or make a quantity negative
 *  (constitution III, spec 008 D9).
 *
 *  The threshold and all five offices go to the source in ONE call, applied
 *  together or not at all (FR-007).
 *
 *  Each office row states its reserved and available units beneath the name.
 *  The frame draws the name alone; without the floor stated, a `−` that stops
 *  at 3 reads as a bug. An addition, logged in docs/design-system/additions.md. */
export function UpdateStocksPanel({
  asset,
  onClose,
  onSave,
  onEditDetails,
}: {
  asset: Asset;
  onClose: () => void;
  onSave: (change: StockChange) => Promise<unknown>;
  onEditDetails: () => void;
}) {
  const formId = useId();
  const [threshold, setThreshold] = useState(String(asset.lowStockThreshold));
  const [totals, setTotals] = useState<Record<Office, string>>(
    () => Object.fromEntries(OFFICES.map((o) => [o, String(asset.stock[o].total)])) as Record<Office, string>,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalOf = (office: Office) => clampTotal(Number(totals[office]), asset.stock[office].reserved);
  const setTotal = (office: Office, value: string) => {
    setTotals((t) => ({ ...t, [office]: value }));
    setErrors((prev) => without(prev, `totals.${office}`));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const lowStockThreshold = Number(threshold);
    if (threshold.trim() === '' || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setErrors({ lowStockThreshold: 'Enter a whole number, 0 or more' });
      return;
    }
    const change: StockChange = {
      lowStockThreshold,
      totals: Object.fromEntries(OFFICES.map((o) => [o, totalOf(o)])) as Record<Office, number>,
    };
    setSaving(true);
    try {
      await onSave(change);
      onClose();
    } catch (error) {
      if (isValidationProblem(error)) setErrors(fieldErrors(error));
      else {
        console.error('[inventory] stock save failed', error);
        setErrors({ '': 'Stock could not be saved. Nothing was changed. Try again' });
      }
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title={`Update stocks — ${asset.name}`}
      onClose={onClose}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">Update stocks</h2>}
      footer={
        <div className="flex items-center justify-center gap-12 border-t border-line-default pt-16">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-32">
        {errors[''] ? (
          <p role="alert" className="rounded-6 bg-status-rejected-bg px-12 py-10 type-meta leading-body text-status-rejected-fg">
            {errors['']}
          </p>
        ) : null}

        <div className="flex flex-col gap-12">
          {asset.image ? <img src={asset.image} alt="" className="aspect-[4/3] w-full rounded-10 object-cover" /> : null}
          <Field label="Item Name">
            {({ id }) => <TextInput id={id} value={asset.name} readOnly />}
          </Field>
          <Field label="Category">
            {({ id }) => <TextInput id={id} value={asset.category} readOnly />}
          </Field>
          <button
            type="button"
            onClick={onEditDetails}
            className="w-fit cursor-pointer border-none bg-transparent p-0 font-sans text-12 leading-tight font-bold text-brand-primary-alt transition-osrs hover:text-brand-primary"
          >
            Update Item Details and Specs &gt;
          </button>
        </div>

        <FieldGroup heading="STOCKS">
          <Field label="Low-stock threshold" error={errors.lowStockThreshold}>
            {({ id, invalid, describedBy }) => (
              <TextInput
                id={id}
                inputMode="numeric"
                invalid={invalid}
                aria-describedby={describedBy}
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                  setErrors((prev) => without(prev, 'lowStockThreshold'));
                }}
              />
            )}
          </Field>

          {OFFICES.map((office) => {
            const { reserved } = asset.stock[office];
            const total = totalOf(office);
            const error = errors[`totals.${office}`];
            return (
              <OfficeStepper
                key={office}
                office={office}
                value={totals[office]}
                reserved={reserved}
                availableUnits={available({ total, reserved })}
                error={error}
                onChange={(v) => setTotal(office, v)}
                onCommit={() => setTotal(office, String(total))}
              />
            );
          })}
        </FieldGroup>
      </form>
    </SidePanel>
  );
}

function without(errors: Record<string, string>, key: string): Record<string, string> {
  if (!(key in errors)) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

/** One office's row: the name and its floor, then `−` / value / `+`. The value
 *  is typeable; it is clamped when the field is left, never while typing. */
function OfficeStepper({
  office,
  value,
  reserved,
  availableUnits,
  error,
  onChange,
  onCommit,
}: {
  office: Office;
  value: string;
  reserved: number;
  availableUnits: number;
  error?: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  const id = useId();
  const current = clampTotal(Number(value), reserved);
  const step =
    'hit-area flex size-22 cursor-pointer items-center justify-center rounded-4 border-none bg-transparent p-0 pb-2 font-sans text-14 font-semibold leading-tight text-osrs-stone-600 transition-osrs hover:text-osrs-stone-900 disabled:cursor-default disabled:text-ink-muted';
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-12">
        <label htmlFor={id} className="flex flex-col gap-4">
          <span className="font-sans text-13 font-bold text-osrs-ink-800">{office}</span>
          <span id={`${id}-floor`} className="type-caption text-ink-secondary">
            {`${reserved} reserved · ${availableUnits} available`}
          </span>
        </label>
        <div className="flex items-center gap-4 rounded-4 bg-surface-stepper p-2">
          <button
            type="button"
            className={step}
            aria-label={`Decrease ${office} stock`}
            disabled={current <= reserved}
            onClick={() => onChange(String(Math.max(reserved, current - 1)))}
          >
            −
          </button>
          <input
            id={id}
            inputMode="numeric"
            aria-describedby={`${id}-floor${error ? ` ${id}-error` : ''}`}
            aria-invalid={error ? true : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
            onBlur={onCommit}
            className="w-[5ch] border-none bg-transparent text-center font-sans text-13 font-semibold leading-tight tabular-nums text-osrs-stone-900"
          />
          <button
            type="button"
            className={step}
            aria-label={`Increase ${office} stock`}
            onClick={() => onChange(String(current + 1))}
          >
            +
          </button>
        </div>
      </div>
      {error ? (
        <span id={`${id}-error`} className="type-meta leading-body text-status-rejected-fg">
          {error}
        </span>
      ) : null}
    </div>
  );
}
