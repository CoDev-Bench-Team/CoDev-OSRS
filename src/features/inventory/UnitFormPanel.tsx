import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, FieldSkeleton, Notice, Skeleton, SkeletonRegion, Select, SidePanel, StatusPill, TextArea } from '../../shared/ui';
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
import { assetFromSnapshot, resolveAsset, snapshotOf } from './catalog-snapshot';
import { clearDraft, draftString, readDraft, writeDraft } from '../../shared/form-draft-cache';
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
    /** A restored draft's assignee, shown until the user directory loads. */
    assigneeName?: string;
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

/** Add Single Unit's form from a draft saved under five minutes ago. Secrets
 *  were never stored; the catalog item is resolved by id from `assets`. */
function fromSaved(saved: Record<string, unknown> | undefined, assets: readonly Asset[] | null): FormState {
  if (!saved) return EMPTY;
  const location = draftString(saved, 'location');
  const status = draftString(saved, 'status');
  const assignedToId = draftString(saved, 'assignedToId');
  const attachmentUrl = draftString(saved, 'attachmentUrl');
  return {
    ...EMPTY,
    asset: resolveAsset(assets, assetFromSnapshot(saved.asset)),
    pr: draftString(saved, 'pr'),
    price: draftString(saved, 'price'),
    supplier: draftString(saved, 'supplier'),
    purchasedAt: draftString(saved, 'purchasedAt'),
    serialNumber: draftString(saved, 'serialNumber'),
    location: (OFFICES as readonly string[]).includes(location) ? (location as Office) : EMPTY.location,
    status: (statusOptions('add') as readonly string[]).includes(status) ? (status as AddStatus) : undefined,
    assignedToId: assignedToId || undefined,
    assigneeName: draftString(saved, 'assigneeName') || undefined,
    description: draftString(saved, 'description'),
    attachmentUrl: attachmentUrl || undefined,
  };
}

/** What Add Single Unit keeps: everything but the secrets, and the catalog
 *  item as a snapshot (the full record carries its image as a data URI). */
function toSaved(form: FormState, users: DirectoryUser[] | null | 'failed'): Record<string, unknown> {
  const { asset, bitlockerIdentifier: _id, recoveryPin: _pin, assigneeName, ...rest } = form;
  const chosen = Array.isArray(users) ? users.find((u) => u.id === form.assignedToId)?.name : undefined;
  return { ...rest, asset: snapshotOf(asset), assigneeName: form.assignedToId ? (chosen ?? assigneeName) : undefined };
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
  | {
      mode: 'add';
      /** What Status offers on create. Defaults to every add status; the API
       *  source offers no Inactive (spec 017 plan D13, contracts G10). */
      addStatuses?: readonly AddStatus[];
      onClose: () => void;
      onCreate: (draft: UnitDraft) => Promise<unknown>;
    }
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
    // The form's sections: a heading over its fields.
    return (
      <SkeletonRegion label="Loading unit" className="flex flex-col gap-24">
        {[3, 3, 2].map((fields, section) => (
          <div key={section} aria-hidden="true" className="flex flex-col gap-16">
            <Skeleton className="h-12 w-[120px]" />
            {Array.from({ length: fields }, (_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
        ))}
      </SkeletonRegion>
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
      <UserPicker
        users={users}
        value={reserved ? undefined : form.assignedToId}
        pendingName={form.assigneeName}
        disabled={reserved}
        error={errors.assignedToId}
        onChange={onAssignee}
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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type FooterProps = {
  loaded: Loaded;
  formId: string;
  saving: boolean;
  adding: boolean;
  removing: boolean;
  onCancelRemoval: () => void;
  onRetry: () => void;
  /** Cancel on Add discards the kept draft. */
  onDiscard: () => void;
};

/** The footer for each load state: none while loading, Close (and Try again
 *  after a failure) while not ready, Cancel and the submit button once ready. */
function panelFooter({ loaded, formId, saving, adding, removing, onCancelRemoval, onRetry, onDiscard }: FooterProps) {
  if (loaded.kind === 'loading') return undefined;
  if (loaded.kind !== 'ready') {
    return (leave: () => void) => <NoticeFooter onRetry={loaded.kind === 'failed' ? onRetry : undefined} onClose={leave} />;
  }
  return (leave: () => void) => (
    <FormFooter
      formId={formId}
      saving={saving}
      submitLabel={removing ? 'Confirm Removal' : 'Save Changes'}
      savingLabel={removing ? 'Removing…' : adding ? 'Adding…' : 'Saving…'}
      onCancel={
        removing
          ? onCancelRemoval
          : () => {
              onDiscard();
              leave();
            }
      }
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

function useUnitFormPanel(props: Props) {
  const formId = useId();
  // Only Add draws the Catalog Item picker; Review/Edit's asset is fixed.
  const { state: assetsState } = useAssets({ enabled: props.mode === 'add' });
  const assets = assetsState.kind === 'loaded' ? assetsState.assets : null;
  const users = useUsers();
  // Add mode only: read once, before the first render, so an expired draft
  // is already gone (shared/form-draft-cache.ts).
  const [saved] = useState(() => (props.mode === 'add' ? readDraft('unit.single') : undefined));
  // The draft's catalog item shows at once from its snapshot.
  const [form, setForm] = useState<FormState>(() => fromSaved(saved, assets));
  // Once the catalog loads, the full record replaces the snapshot.
  const [restoring, setRestoring] = useState(assets === null);
  if (restoring && (assets || assetsState.kind === 'failed')) {
    setRestoring(false);
    if (assets) setForm((f) => ({ ...f, asset: resolveAsset(assets, f.asset) }));
  }
  useEffect(() => {
    if (props.mode !== 'add') return;
    const value = toSaved(form, users);
    if (JSON.stringify(value) === JSON.stringify(toSaved(EMPTY, null))) {
      clearDraft('unit.single');
      return;
    }
    // An attachment too large for storage is dropped from the draft, not the rest.
    if (!writeDraft('unit.single', value)) writeDraft('unit.single', { ...value, attachmentUrl: undefined });
  }, [props.mode, form, users]);
  const [errors, setErrors] = useState<Errors>({});
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState('');
  const editing = props.mode === 'edit' ? props : null;
  const { loaded, retry, gone } = useUnitLoad(editing?.unitId ?? null, editing?.load ?? null, (unit) => setForm(fromUnit(unit)));

  const { saving, attempt, handOff } = useAttempt(props.onClose, (error, what) => {
    const result = refusal(error, what, (key) => SHOWN.has(key));
    if (!('problem' in result)) setErrors(result.errors);
    else if (result.problem.status === 404) gone(result.problem.detail);
    else setErrors({ '': result.problem.detail });
  });

  const unit = loaded.kind === 'ready' ? loaded.unit : undefined;
  /** How the toast names this unit if the panel is closed mid-save. */
  const unitName = unit?.serialNumber ? `unit ${unit.serialNumber}` : 'unit';
  const reserved = unit?.status === 'Reserved';
  const category: Category | undefined = unit?.category ?? form.asset?.category;
  const addStatuses = props.mode === 'add' ? props.addStatuses : undefined;
  const options = useMemo(
    () => (unit ? statusOptions('edit', unit) : (addStatuses ?? statusOptions('add'))),
    [unit, addStatuses],
  );

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

  /** A blank reason stays on the field. A reason removes the unit at once:
   *  the warning under the reason's label is the confirmation (spec 015
   *  Story 4 as amended 2026-10-03; no dialog). */
  function askRemove() {
    if (!reason.trim()) {
      setErrors({ reason: 'Enter a reason for removal' });
      return;
    }
    if (editing) confirmRemove(editing);
  }

  function confirmRemove(target: NonNullable<typeof editing>) {
    if (saving) return;
    void attempt(() => target.onRemove(target.unitId, reason.trim()), {
      loading: `Removing ${unitName}…`,
      done: `${capitalize(unitName)} removed`,
      failed: 'The unit could not be removed',
    });
  }

  function save() {
    const draft = toDraft(form, unit?.assetId ?? form.asset?.id ?? '', category, reserved);
    const found = validateUnit(draft, category, today(), unit);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const adding = props.mode === 'add';
    const name = adding ? (draft.serialNumber?.trim() ? `unit ${draft.serialNumber.trim()}` : 'unit') : unitName;
    const send = () =>
      props.mode === 'edit'
        ? props.onUpdate(props.unitId, draft)
        : props.onCreate(draft).then((created) => {
            clearDraft('unit.single');
            return created;
          });
    void attempt(send, {
      loading: adding ? `Adding ${name}…` : `Saving ${name}…`,
      done: `${capitalize(name)} ${adding ? 'added' : 'saved'}`,
      failed: 'The unit could not be saved',
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (removing && editing) askRemove();
    else save();
  }

  const leaveRemoving = () => {
    setRemoving(false);
    setReason('');
    clear('reason');
  };

  const title = editing ? (unit?.itemName ?? 'Review unit') : 'Add Single Unit';

  return {
    formId,
    assets,
    assetsState,
    users,
    form,
    errors,
    removing,
    reason,
    editing,
    loaded,
    retry,
    saving,
    handOff,
    unit,
    category,
    options,
    set,
    setForm,
    clear,
    close,
    confirmRemove,
    submit,
    leaveRemoving,
    title,
    setReason,
    setRemoving,
  };
}

function UnitFormBody({ editor }: { editor: ReturnType<typeof useUnitFormPanel> }) {
  const {
    formId,
    saving,
    assets,
    assetsState,
    users,
    form,
    errors,
    removing,
    reason,
    editing,
    unit,
    category,
    options,
    set,
    setForm,
    clear,
    submit,
    setReason,
    setRemoving,
  } = editor;

  return (
    <form id={formId} onSubmit={submit} noValidate>
      {/* Locked while saving or removing: the fieldset disables every control in it. */}
      <fieldset disabled={saving} className="m-0 flex min-w-0 flex-col gap-32 border-0 p-0">
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
      </fieldset>
    </form>
  );
}

export function UnitFormPanel(props: Props) {
  const editor = useUnitFormPanel(props);
  return (
    <SidePanel
      title={editor.title}
      onClose={editor.close}
      busy={editor.saving}
      onLeave={editor.handOff}
      header={<UnitHeader title={editor.title} unit={editor.unit} />}
      bodyClassName="px-14 pt-10 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      footer={panelFooter({
        loaded: editor.loaded,
        formId: editor.formId,
        saving: editor.saving,
        adding: !editor.editing,
        removing: editor.removing,
        onCancelRemoval: editor.leaveRemoving,
        onRetry: editor.retry,
        onDiscard: () => {
          if (!editor.editing) clearDraft('unit.single');
        },
      })}
    >
      {editor.loaded.kind !== 'ready' ? <UnitLoadNotice loaded={editor.loaded} /> : <UnitFormBody editor={editor} />}
    </SidePanel>
  );
}
