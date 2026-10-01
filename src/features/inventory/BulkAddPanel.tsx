import { useId, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, Select, SidePanel, TextInput } from '../../shared/ui';
import { useAssets } from '../assets/asset-store';
import type { Asset } from '../assets/types';
import { OFFICES, type Office } from '../auth/types';
import { deviceFieldsFor, stripHidden } from './device-fields';
import { parseAmount } from './format';
import { refusal, useAttempt } from './inventory-store';
import type { UnitBatchDraft } from './types';
import { CatalogItemPicker, FormAlert, PurchaseFields, SecretInput, type Device, type Purchase } from './unit-fields';
import { MAX_BATCH, today, validateBatch } from './unit-validation';

/** Add Multiple Units — `03 - Inventory - Bulk Add Units`, 650px (spec 015
 *  Story 5, plan P12).
 *
 *  One catalog item, one office and one set of purchase details for 1–100
 *  units, each on its own row. The **No. of Units** count is the number of
 *  rows, always: the stepper adds and drops the last row, a row's ✕ drops that
 *  row. It opens with one empty row (Story 5 1a). The drawn green ✓ is not
 *  built: every row stays editable and Save checks them all (Q6). */

type Row = Device & { key: number };

let nextKey = 0;
const emptyRow = (): Row => ({ key: ++nextKey, serialNumber: '', bitlockerIdentifier: '', recoveryPin: '' });

/** `carbon:close-large`, the row's red ✕. */
function CloseLarge() {
  return (
    <svg viewBox="0 0 16 16" className="size-16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

const SHOWN_TOP = new Set(['assetId', 'location', 'pr', 'price', 'supplier', 'purchasedAt']);
const shown = (key: string) => SHOWN_TOP.has(key) || /^units\.\d+\.(serialNumber|bitlockerIdentifier|recoveryPin)$/.test(key);

export function BulkAddPanel({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: UnitBatchDraft) => Promise<unknown> }) {
  const formId = useId();
  const { state: assetsState } = useAssets();
  const assets = assetsState.kind === 'loaded' ? assetsState.assets : null;
  const [asset, setAsset] = useState<Asset>();
  const [location, setLocation] = useState<Office>('Cebu');
  const [purchase, setPurchase] = useState<Purchase>({ pr: '', price: '', supplier: '', purchasedAt: '' });
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** A refusal that names no field (a 409), shown above the rows. */
  const [conflict, setConflict] = useState<string>();
  const rule = deviceFieldsFor(asset?.category);
  const { saving, attempt } = useAttempt(onClose, (error, what) => {
    const result = refusal(error, what, shown);
    if ('problem' in result) setConflict(result.problem.detail);
    else setErrors(result.errors);
  });

  /** Row errors are keyed by position, so any change to the row list clears
   *  them rather than leaving a message under the wrong row. */
  const changeRows = (next: (rows: Row[]) => Row[]) => {
    setRows(next);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('units'))));
    setConflict(undefined);
  };

  const addRow = () => changeRows((rs) => (rs.length >= MAX_BATCH ? rs : [...rs, emptyRow()]));

  const clear = (key: string) => {
    setErrors((e) => {
      if (!(key in e) && !('' in e)) return e;
      const next = { ...e };
      delete next[key];
      delete next[''];
      return next;
    });
    setConflict(undefined);
  };

  const editRow = (i: number, key: keyof Device, value: string) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
    clear(`units.${i}.${key}`);
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || rows.length === 0) return;
    const draft: UnitBatchDraft = {
      assetId: asset?.id ?? '',
      location,
      pr: purchase.pr,
      price: parseAmount(purchase.price),
      supplier: purchase.supplier,
      purchasedAt: purchase.purchasedAt || undefined,
      units: rows.map(({ serialNumber, bitlockerIdentifier, recoveryPin }) =>
        stripHidden({ serialNumber, bitlockerIdentifier, recoveryPin }, asset?.category),
      ),
    };
    const found = validateBatch(draft, asset?.category, today());
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    void attempt(() => onCreate(draft), 'The units could not be saved');
  }

  const full = rows.length >= MAX_BATCH;

  return (
    <SidePanel
      title="Add Multiple Units"
      width="batch"
      onClose={onClose}
      dismissible={!saving}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">Add Multiple Units</h2>}
      bodyClassName="px-14 pt-10 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      footer={(leave) => (
        <div className="flex items-center justify-center gap-12">
          <Button variant="ghost" onClick={leave} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving || rows.length === 0}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      )}
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-32">
        <FormAlert message={errors['']} />

        <CatalogItemPicker
          assets={assets}
          value={asset}
          error={errors.assetId}
          onChange={(next) => {
            setAsset(next);
            // Serials stay; BitLocker values go with a category that has none.
            if (!deviceFieldsFor(next?.category).bitlocker) {
              setRows((rs) => rs.map((r) => ({ ...r, bitlockerIdentifier: '', recoveryPin: '' })));
            }
            clear('assetId');
          }}
        />

        <div className="flex flex-col gap-14">
          <div className="flex items-center justify-between gap-16">
            <span id={`${formId}-count`} className="font-sans text-12-5 font-bold leading-body text-osrs-ink-800">
              No. of Units
            </span>
            <div className="flex items-center gap-8 select-none" role="group" aria-labelledby={`${formId}-count`}>
              <Button
                variant="ghost"
                aria-label="Remove the last unit"
                disabled={rows.length === 0}
                onClick={() => changeRows((rs) => rs.slice(0, -1))}
                className="h-control-height-lg! w-[46px] px-0 text-20"
              >
                −
              </Button>
              <output
                aria-live="polite"
                aria-label={`${rows.length} unit${rows.length === 1 ? '' : 's'}`}
                className="flex h-control-height-lg w-[46px] items-center justify-center rounded-6 border border-osrs-border-warm type-meta text-osrs-ink-800"
              >
                {rows.length}
              </output>
              <Button
                variant="ghost"
                aria-label="Add a unit"
                disabled={full}
                onClick={addRow}
                className="h-control-height-lg! w-[50px] px-0 text-20"
              >
                +
              </Button>
            </div>
          </div>
          <Field label="Office" required error={errors.location}>
            {({ id, required, invalid, describedBy }) => (
              <Select
                id={id}
                label="Office"
                size="field"
                required={required}
                invalid={invalid}
                describedBy={describedBy}
                options={[...OFFICES]}
                value={location}
                onChange={(v) => {
                  setLocation(v as Office);
                  clear('location');
                }}
              />
            )}
          </Field>
        </div>

        <PurchaseFields
          value={purchase}
          onChange={(key, value) => {
            setPurchase((p) => ({ ...p, [key]: value }));
            clear(key);
          }}
          errors={errors}
          today={today()}
        />

        <FieldGroup heading="UNITS">
          <FormAlert message={conflict} />
          {errors.units ? <p className="type-meta leading-body text-status-rejected-fg">{errors.units}</p> : null}
          {rows.map((row, i) => (
            <div key={row.key} role="group" aria-label={`Unit ${i + 1}`} className="flex items-start gap-12">
              <Field label="Serial Number" required={rule.serial === 'required'} error={errors[`units.${i}.serialNumber`]} className="min-w-0 flex-1">
                {({ id, required, invalid, describedBy }) => (
                  <TextInput
                    id={id}
                    required={required}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    autoComplete="off"
                    value={row.serialNumber}
                    onChange={(e) => editRow(i, 'serialNumber', e.target.value)}
                  />
                )}
              </Field>
              {rule.bitlocker ? (
                <>
                  <Field label="BitLocker Identifier" error={errors[`units.${i}.bitlockerIdentifier`]} className="min-w-0 flex-1">
                    {(control) => (
                      <SecretInput
                        control={control}
                        label={`BitLocker Identifier, unit ${i + 1}`}
                        value={row.bitlockerIdentifier}
                        onChange={(v) => editRow(i, 'bitlockerIdentifier', v)}
                      />
                    )}
                  </Field>
                  <Field label="Recovery Key/PIN" error={errors[`units.${i}.recoveryPin`]} className="min-w-0 flex-1">
                    {(control) => (
                      <SecretInput
                        control={control}
                        label={`Recovery Key/PIN, unit ${i + 1}`}
                        value={row.recoveryPin}
                        onChange={(v) => editRow(i, 'recoveryPin', v)}
                      />
                    )}
                  </Field>
                </>
              ) : null}
              <button
                type="button"
                aria-label={`Remove unit ${i + 1}`}
                onClick={() => changeRows((rs) => rs.filter((r) => r.key !== row.key))}
                className="mt-14 inline-flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-10 border-none bg-status-rejected-bg text-brand-primary-alt transition-osrs hover:bg-osrs-red-50"
              >
                <CloseLarge />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={full}
            onClick={addRow}
            className="w-fit cursor-pointer border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-tight text-brand-primary-alt hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
          >
            + Add another unit
          </button>
        </FieldGroup>
      </form>
    </SidePanel>
  );
}
