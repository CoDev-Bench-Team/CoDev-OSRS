import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, LoadingState, Notice, Select, SidePanel, StatusPill, TextArea } from '../../shared/ui';
import { fieldErrors, isValidationProblem } from '../../shared/validation';
import { useAssets } from '../assets/asset-store';
import { ImageField } from '../assets/ImageField';
import type { Asset, Category } from '../assets/types';
import { OFFICES, type Office } from '../auth/types';
import { deviceFieldsFor, stripHidden } from './device-fields';
import { formatAmount, parseAmount } from './format';
import { isUnitProblem } from './inventory-source';
import { seededUserDirectory } from './seeded-user-directory';
import type { AddStatus, EditStatus, UnitDetail, UnitDraft } from './types';
import { CatalogItemPicker, DeviceFields, PurchaseFields, RemoveUnitSection, UserPicker, type Device, type Purchase } from './unit-fields';
import { statusOptions, withAssignee, withStatus } from './unit-rules';
import { today, validateUnit } from './unit-validation';
import type { DirectoryUser } from './user-directory';

/** Add Single Unit, Review/Edit and Remove Unit — `03.1 - Inventory - Add
 *  Inventory`, `03 - Inventory - Review/Edit`, `Delete Unit` and `Delete Unit
 *  Confirmation` (spec 015 Stories 2 to 4, plan P12).
 *
 *  One form for add and edit, as Assets' `AssetFormPanel` is. The status rules
 *  and the device fields are tables (`unit-rules.ts`, `device-fields.ts`), so
 *  this panel decides nothing about which statuses or fields exist. */

type FormState = Purchase &
  Device & {
    asset?: Asset;
    location: Office;
    status?: AddStatus | EditStatus;
    assignedToId?: string;
    description: string;
    attachmentUrl?: string;
  };

const EMPTY: FormState = {
  pr: '',
  price: '',
  supplier: '',
  purchasedAt: '',
  serialNumber: '',
  bitlockerIdentifier: '',
  recoveryPin: '',
  location: 'Cebu',
  description: '',
};

function fromUnit(unit: UnitDetail): FormState {
  return {
    pr: unit.pr ?? '',
    price: unit.price === undefined ? '' : formatAmount(unit.price),
    supplier: unit.supplier ?? '',
    purchasedAt: unit.purchasedAt ?? '',
    serialNumber: unit.serialNumber ?? '',
    bitlockerIdentifier: unit.bitlockerIdentifier ?? '',
    recoveryPin: unit.recoveryPin ?? '',
    location: unit.location,
    status: unit.status === 'Reserved' ? undefined : unit.status,
    assignedToId: unit.assignee?.id,
    description: unit.description ?? '',
    attachmentUrl: unit.attachmentUrl,
  };
}

/** The draft the form submits. A Reserved unit's carries no status, user or
 *  office, so saving its other details can never release it (plan P5). */
function toDraft(form: FormState, assetId: string, category: Category | undefined, reserved: boolean): UnitDraft {
  const draft: UnitDraft = {
    assetId,
    pr: form.pr,
    price: parseAmount(form.price),
    supplier: form.supplier,
    purchasedAt: form.purchasedAt || undefined,
    serialNumber: form.serialNumber,
    bitlockerIdentifier: form.bitlockerIdentifier,
    recoveryPin: form.recoveryPin,
    description: form.description,
    attachmentUrl: form.attachmentUrl,
  };
  if (!reserved) {
    draft.location = form.location;
    draft.status = form.status === 'Inactive' || form.status === 'Available' || form.status === 'Assigned' ? form.status : undefined;
    draft.assignedToId = form.status === 'Assigned' ? form.assignedToId : undefined;
  }
  return stripHidden(draft, category);
}

/** Every key a message can land under in this panel. */
const SHOWN = new Set([
  'assetId',
  'pr',
  'price',
  'supplier',
  'purchasedAt',
  'serialNumber',
  'bitlockerIdentifier',
  'recoveryPin',
  'assignedToId',
  'location',
  'status',
  'description',
  'attachmentUrl',
  'reason',
]);

function useUsers() {
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  useEffect(() => {
    let active = true;
    seededUserDirectory.list().then(
      (list) => {
        if (active) setUsers(list);
      },
      () => {
        if (active) setUsers([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return users;
}

type Props =
  | { mode: 'add'; onClose: () => void; onCreate: (draft: UnitDraft) => Promise<unknown> }
  | {
      mode: 'edit';
      unitId: string;
      load: (id: string) => Promise<UnitDetail>;
      onClose: () => void;
      onUpdate: (id: string, draft: UnitDraft) => Promise<unknown>;
      onRemove: (id: string, reason: string) => Promise<unknown>;
      /** The unit is gone (a 404): the page reloads its list. */
      onGone: () => void;
    };

type Loaded = { kind: 'loading' } | { kind: 'failed' } | { kind: 'gone'; message: string } | { kind: 'ready'; unit?: UnitDetail };

export function UnitFormPanel(props: Props) {
  const editing = props.mode === 'edit';
  const formId = useId();
  const { state: assetsState } = useAssets();
  const assets = assetsState.kind === 'loaded' ? assetsState.assets : null;
  const users = useUsers();
  const [loaded, setLoaded] = useState<Loaded>(editing ? { kind: 'loading' } : { kind: 'ready' });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState('');

  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const unitId = editing ? props.unitId : null;
  const load = editing ? props.load : null;
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!unitId || !load) return;
    let active = true;
    load(unitId).then(
      (unit) => {
        if (!active) return;
        setForm(fromUnit(unit));
        setLoaded({ kind: 'ready', unit });
      },
      (error: unknown) => {
        if (!active) return;
        setLoaded(isUnitProblem(error) && error.status === 404 ? { kind: 'gone', message: error.detail } : { kind: 'failed' });
      },
    );
    return () => {
      active = false;
    };
  }, [unitId, load, attempt]);

  const unit = loaded.kind === 'ready' ? loaded.unit : undefined;
  const reserved = unit?.status === 'Reserved';
  const category: Category | undefined = unit?.category ?? form.asset?.category;
  const options = useMemo(() => (unit ? statusOptions('edit', unit) : statusOptions('add')), [unit]);

  const clear = (...keys: string[]) =>
    setErrors((e) => {
      if (!keys.some((k) => k in e) && !('' in e)) return e;
      const next = { ...e };
      for (const k of [...keys, '']) delete next[k];
      return next;
    });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    clear(key);
  };

  const close = () => {
    if (loaded.kind === 'gone' && props.mode === 'edit') props.onGone();
    props.onClose();
  };

  const refused = (error: unknown, what: string) => {
    if (!live.current) return;
    if (isValidationProblem(error)) {
      const mapped = fieldErrors(error);
      const unshown = Object.keys(mapped).find((key) => !SHOWN.has(key));
      setErrors(unshown === undefined ? mapped : { ...mapped, '': `${what}: ${mapped[unshown]}` });
    } else if (isUnitProblem(error)) {
      if (error.status === 404) setLoaded({ kind: 'gone', message: error.detail });
      else setErrors({ '': error.detail });
    } else {
      setErrors({ '': `${what}. Try again` });
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (removing && props.mode === 'edit') {
      if (!reason.trim()) {
        setErrors({ reason: 'Enter a reason for removal' });
        return;
      }
      setSaving(true);
      try {
        await props.onRemove(props.unitId, reason.trim());
        if (live.current) props.onClose();
      } catch (error) {
        refused(error, 'The unit could not be removed');
      } finally {
        if (live.current) setSaving(false);
      }
      return;
    }

    const assetId = unit?.assetId ?? form.asset?.id ?? '';
    const draft = toDraft(form, assetId, category, reserved);
    const found = validateUnit(draft, category, today(), unit);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      if (props.mode === 'edit') await props.onUpdate(props.unitId, draft);
      else await props.onCreate(draft);
      if (live.current) props.onClose();
    } catch (error) {
      refused(error, 'The unit could not be saved');
    } finally {
      if (live.current) setSaving(false);
    }
  }

  const title = editing ? (unit?.itemName ?? 'Review unit') : 'Add Single Unit';
  const header = (
    <div className="flex min-w-0 flex-col items-start gap-4">
      <h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">{title}</h2>
      {unit ? <StatusPill unit={unit.status} /> : null}
    </div>
  );

  const footer =
    loaded.kind === 'ready' ? (
      (leave: () => void) => (
        <div className="flex items-center justify-center gap-12">
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => {
              if (removing) {
                setRemoving(false);
                setReason('');
                clear('reason');
              } else leave();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? (removing ? 'Removing…' : 'Saving…') : removing ? 'Confirm Removal' : 'Save Changes'}
          </Button>
        </div>
      )
    ) : loaded.kind === 'loading' ? undefined : (
      (leave: () => void) => (
        <div className="flex items-center justify-center gap-12">
          {loaded.kind === 'failed' ? (
            <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          ) : null}
          <Button onClick={leave}>Close</Button>
        </div>
      )
    );

  return (
    <SidePanel
      title={title}
      onClose={close}
      dismissible={!saving}
      header={header}
      bodyClassName="px-14 pt-10 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      footer={footer}
    >
      {loaded.kind === 'loading' ? (
        <div className="[&>div]:min-h-[204px]">
          <LoadingState label="Loading unit" />
        </div>
      ) : loaded.kind === 'gone' ? (
        <Notice eyebrow="Not found" tone="stopped" title="This unit is no longer in the register" body={loaded.message} />
      ) : loaded.kind === 'failed' ? (
        <Notice eyebrow="Could not load" tone="stopped" title="The unit could not be loaded" body="Nothing was changed. Try again in a moment" />
      ) : (
        <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-32">
          {errors[''] ? (
            <p role="alert" className="rounded-6 bg-status-rejected-bg px-12 py-10 type-meta leading-body text-status-rejected-fg">
              {errors['']}
            </p>
          ) : null}

          {editing ? null : (
            <CatalogItemPicker
              assets={assets}
              value={form.asset}
              error={errors.assetId}
              onChange={(asset) => {
                setForm((f) => ({
                  ...f,
                  asset,
                  // A hidden field's value is dropped, never kept for later.
                  ...(deviceFieldsFor(asset?.category).bitlocker ? {} : { bitlockerIdentifier: '', recoveryPin: '' }),
                }));
                clear('assetId', 'serialNumber', 'bitlockerIdentifier', 'recoveryPin');
              }}
            />
          )}

          <PurchaseFields value={form} onChange={set} errors={errors} today={today()} />
          <DeviceFields category={category} value={form} onChange={set} errors={errors} />

          <FieldGroup heading="ASSIGNMENT">
            <UserPicker
              users={users}
              value={reserved ? undefined : form.assignedToId}
              disabled={reserved}
              error={errors.assignedToId}
              onChange={(userId) => {
                setForm((f) => withAssignee(f, userId));
                clear('assignedToId', 'status');
              }}
            />
            <Field label="Office" required error={errors.location}>
              {({ id, required, invalid, describedBy }) => (
                <Select
                  id={id}
                  label="Office"
                  size="field"
                  required={required}
                  invalid={invalid}
                  describedBy={describedBy}
                  disabled={reserved}
                  options={[...OFFICES]}
                  value={form.location}
                  onChange={(v) => set('location', v as Office)}
                />
              )}
            </Field>
            <Field label="Status" required error={errors.status}>
              {({ id, required, invalid, describedBy }) => (
                <Select
                  id={id}
                  label="Status"
                  size="field"
                  required={required}
                  invalid={invalid}
                  describedBy={describedBy}
                  placeholder="Select Status"
                  disabled={options === null}
                  options={options ? [...options] : ['Reserved']}
                  value={options === null ? 'Reserved' : form.status}
                  onChange={(v) => {
                    const next = options?.find((o) => o === v);
                    if (!next) return;
                    setForm((f) => withStatus(f, next));
                    clear('status', 'assignedToId');
                  }}
                />
              )}
            </Field>
          </FieldGroup>

          <FieldGroup heading="NOTES">
            <Field label="Description" error={errors.description}>
              {({ id, invalid, describedBy }) => (
                <TextArea
                  id={id}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder="Insert here..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="h-[75px] py-12!"
                />
              )}
            </Field>
            <ImageField
              label="Attachment"
              filename="unit-attachment"
              value={form.attachmentUrl}
              error={errors.attachmentUrl}
              onChange={(v) => set('attachmentUrl', v)}
            />
          </FieldGroup>

          {unit ? (
            <RemoveUnitSection
              status={unit.status}
              removing={removing}
              reason={reason}
              error={errors.reason}
              onReason={(v) => {
                setReason(v);
                clear('reason');
              }}
              onStart={() => setRemoving(true)}
            />
          ) : null}
        </form>
      )}
    </SidePanel>
  );
}
