import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, ConfirmDialog, Field, FieldGroup, LoadingState, Notice, Select, SidePanel, StatusPill, TextArea } from '../../shared/ui';
import { useAssets } from '../assets/asset-store';
import { ImageField } from '../assets/ImageField';
import type { Asset, Category } from '../assets/types';
import { OFFICES, type Office } from '../auth/types';
import { deviceFieldsFor, stripHidden } from './device-fields';
import { formatAmount, parseAmount } from './format';
import { isUnitProblem } from './inventory-source';
import { refusal, useAttempt } from './inventory-store';
import type { AddStatus, EditStatus, UnitDetail, UnitDraft } from './types';
import { CatalogItemPicker, DeviceFields, FormAlert, FormFooter, PurchaseFields, RemoveUnitSection, UserPicker, type Device, type Purchase } from './unit-fields';
import { statusOptions, withAssignee, withStatus } from './unit-rules';
import { today, validateUnit } from './unit-validation';
import { userDirectory, type DirectoryUser } from './user-directory';

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
    draft.status = form.status;
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

/** Every assignable user: `null` while loading, `'failed'` if the read failed. */
function useUsers() {
  const [users, setUsers] = useState<DirectoryUser[] | null | 'failed'>(null);
  useEffect(() => {
    let active = true;
    userDirectory()
      .list()
      .then(
        (list) => {
          if (active) setUsers(list);
        },
        () => {
          if (active) setUsers('failed');
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
type Errors = Record<string, string>;

/** Loads the unit under review; add mode is ready at once. `retry` loads
 *  again after a failure, `gone` records a 404 met later by a save. */
function useUnitLoad(unitId: string | null, load: ((id: string) => Promise<UnitDetail>) | null, onLoaded: (unit: UnitDetail) => void) {
  const [loaded, setLoaded] = useState<Loaded>(unitId ? { kind: 'loading' } : { kind: 'ready' });
  const [attempt, setAttempt] = useState(0);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });
  useEffect(() => {
    if (!unitId || !load) return;
    let active = true;
    load(unitId).then(
      (unit) => {
        if (!active) return;
        onLoadedRef.current(unit);
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
  return {
    loaded,
    retry: () => setAttempt((n) => n + 1),
    gone: (message: string) => setLoaded({ kind: 'gone', message }),
  };
}

/** The body while the unit is not ready: loading, gone (a 404) or failed. */
function UnitLoadNotice({ loaded }: { loaded: Exclude<Loaded, { kind: 'ready' }> }) {
  if (loaded.kind === 'loading') {
    return (
      <div className="[&>div]:min-h-[204px]">
        <LoadingState label="Loading unit" />
      </div>
    );
  }
  if (loaded.kind === 'gone') {
    return <Notice eyebrow="Not found" tone="stopped" title="This unit is no longer in the register" body={loaded.message} />;
  }
  return <Notice eyebrow="Could not load" tone="stopped" title="The unit could not be loaded" body="Nothing was changed. Try again in a moment" />;
}

function NoticeFooter({ onRetry, onClose }: { onRetry?: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center justify-center gap-12">
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
      <Button onClick={onClose}>Close</Button>
    </div>
  );
}

/** ASSIGNMENT: User, Office and Status. A Reserved unit shows all three
 *  read-only (`options` is `null`), Status reading `Reserved`. */
function AssignmentFields({
  form,
  users,
  options,
  errors,
  onAssignee,
  onLocation,
  onStatus,
}: {
  form: FormState;
  users: DirectoryUser[] | null | 'failed';
  options: readonly (AddStatus | EditStatus)[] | null;
  errors: Errors;
  onAssignee: (userId: string | undefined) => void;
  onLocation: (office: Office) => void;
  onStatus: (status: AddStatus | EditStatus) => void;
}) {
  const reserved = options === null;
  return (
    <FieldGroup heading="ASSIGNMENT">
      <UserPicker users={users} value={reserved ? undefined : form.assignedToId} disabled={reserved} error={errors.assignedToId} onChange={onAssignee} />
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
            onChange={(v) => onLocation(v as Office)}
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
            disabled={reserved}
            options={options ? [...options] : ['Reserved']}
            value={reserved ? 'Reserved' : form.status}
            onChange={(v) => {
              const next = options?.find((o) => o === v);
              if (next) onStatus(next);
            }}
          />
        )}
      </Field>
    </FieldGroup>
  );
}

/** NOTES: Description and the Attachment uploader. */
function NotesFields({
  form,
  errors,
  onChange,
}: {
  form: FormState;
  errors: Errors;
  onChange: (key: 'description' | 'attachmentUrl', value: string | undefined) => void;
}) {
  return (
    <FieldGroup heading="NOTES">
      <Field label="Description" error={errors.description}>
        {({ id, invalid, describedBy }) => (
          <TextArea
            id={id}
            invalid={invalid}
            aria-describedby={describedBy}
            placeholder="Insert here..."
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="h-[75px] min-h-[75px]! py-12!"
          />
        )}
      </Field>
      <ImageField label="Attachment" filename="unit-attachment" value={form.attachmentUrl} error={errors.attachmentUrl} onChange={(v) => onChange('attachmentUrl', v)} />
    </FieldGroup>
  );
}

type FooterProps = { loaded: Loaded; formId: string; saving: boolean; removing: boolean; onCancelRemoval: () => void; onRetry: () => void };

/** The footer for each load state: none while loading, Close (and Try again
 *  after a failure) while not ready, Cancel and the submit button once ready. */
function panelFooter({ loaded, formId, saving, removing, onCancelRemoval, onRetry }: FooterProps) {
  if (loaded.kind === 'loading') return undefined;
  if (loaded.kind !== 'ready') {
    return (leave: () => void) => <NoticeFooter onRetry={loaded.kind === 'failed' ? onRetry : undefined} onClose={leave} />;
  }
  return (leave: () => void) => (
    <FormFooter
      formId={formId}
      saving={saving}
      submitLabel={removing ? 'Confirm Removal' : 'Save Changes'}
      savingLabel={removing ? 'Removing…' : 'Saving…'}
      onCancel={removing ? onCancelRemoval : leave}
    />
  );
}

function UnitHeader({ title, unit }: { title: string; unit?: UnitDetail }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-4">
      <h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">{title}</h2>
      {unit ? <StatusPill unit={unit.status} /> : null}
    </div>
  );
}

export function UnitFormPanel(props: Props) {
  const formId = useId();
  const { state: assetsState } = useAssets();
  const assets = assetsState.kind === 'loaded' ? assetsState.assets : null;
  const users = useUsers();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [removing, setRemoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const editing = props.mode === 'edit' ? props : null;
  const { loaded, retry, gone } = useUnitLoad(editing?.unitId ?? null, editing?.load ?? null, (unit) => setForm(fromUnit(unit)));

  const { saving, attempt } = useAttempt(props.onClose, (error, what) => {
    setConfirming(false);
    const result = refusal(error, what, (key) => SHOWN.has(key));
    if (!('problem' in result)) setErrors(result.errors);
    else if (result.problem.status === 404) gone(result.problem.detail);
    else setErrors({ '': result.problem.detail });
  });

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
    if (loaded.kind === 'gone') editing?.onGone();
    props.onClose();
  };

  /** A blank reason stays on the field. A reason asks first: removal deletes
   *  the unit permanently (spec 015 Story 4). */
  function askRemove() {
    if (!reason.trim()) {
      setErrors({ reason: 'Enter a reason for removal' });
      return;
    }
    setConfirming(true);
  }

  function confirmRemove(target: NonNullable<typeof editing>) {
    if (saving) return;
    void attempt(() => target.onRemove(target.unitId, reason.trim()), 'The unit could not be removed');
  }

  function save() {
    const draft = toDraft(form, unit?.assetId ?? form.asset?.id ?? '', category, reserved);
    const found = validateUnit(draft, category, today(), unit);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    void attempt(() => (props.mode === 'edit' ? props.onUpdate(props.unitId, draft) : props.onCreate(draft)), 'The unit could not be saved');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (removing && editing) askRemove();
    else save();
  }

  const leaveRemoving = () => {
    setRemoving(false);
    setConfirming(false);
    setReason('');
    clear('reason');
  };

  const title = editing ? (unit?.itemName ?? 'Review unit') : 'Add Single Unit';

  return (
    <SidePanel
      title={title}
      onClose={close}
      dismissible={!saving}
      header={<UnitHeader title={title} unit={unit} />}
      bodyClassName="px-14 pt-10 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      footer={panelFooter({ loaded, formId, saving, removing, onCancelRemoval: leaveRemoving, onRetry: retry })}
    >
      {loaded.kind !== 'ready' ? (
        <UnitLoadNotice loaded={loaded} />
      ) : (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-32">
          <FormAlert message={errors['']} />

          {editing ? null : (
            <CatalogItemPicker
              assets={assets}
              value={form.asset}
              failed={assetsState.kind === 'failed'}
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
          <AssignmentFields
            form={form}
            users={users}
            options={options}
            errors={errors}
            onAssignee={(userId) => {
              setForm((f) => withAssignee(f, userId));
              clear('assignedToId', 'status');
            }}
            onLocation={(office) => set('location', office)}
            onStatus={(status) => {
              setForm((f) => withStatus(f, status));
              clear('status', 'assignedToId');
            }}
          />
          <NotesFields form={form} errors={errors} onChange={set} />

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

          {confirming && editing ? (
            <ConfirmDialog
              title="Remove this unit?"
              confirmLabel="Remove unit"
              busy={saving}
              onCancel={() => setConfirming(false)}
              onConfirm={() => confirmRemove(editing)}
            >
              <p>This permanently deletes the unit. You cannot undo it.</p>
            </ConfirmDialog>
          ) : null}
        </form>
      )}
    </SidePanel>
  );
}
