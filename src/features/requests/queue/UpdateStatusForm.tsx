import { useId, useState, type FormEvent } from 'react';
import { Button, ConfirmDialog, Select, TextField, type RequestStatus } from '../../../shared/ui';
import type { Office } from '../../auth/types';
import {
  LOCATION_REQUIRED,
  officeLabel,
  pickupLabel,
  updateStatusTargets,
  type PickupLocation,
  type UpdateStatusTarget,
} from './review-types';

/** `02.2.1 - Update Status`: a required `Status *` select, with Cancel /
 *  Update Status (spec 008 Story 3, plan D7). From `Approved` it offers the two
 *  handover peers. From a handover state it offers `Received`, first and
 *  preselected, and the other peer; never the current status (FR-008, FR-008a,
 *  ADR-0010). A valid submit asks in a confirmation dialog before anything is
 *  sent (FR-008b).
 *
 *  The frame draws only the status. Choosing `Ready for Pickup` reveals a
 *  required pickup location, because spec 001 FR-011a needs one. The location
 *  is one of the offices the source exposes, with the request's office
 *  preselected, or `Other…`, which reveals a free-text field. This is decided
 *  by the project owner, undrawn, and logged in additions.md §3h. */
const OTHER = 'Other…';
const OTHER_REQUIRED = 'Enter where the employee collects the items.';

/** The location the form's fields name, or `undefined` when they name none. */
function chosenLocation(place: string, other: string, offices: readonly Office[]): PickupLocation | undefined {
  if (place === OTHER) {
    const text = other.trim();
    return text ? { kind: 'other', text } : undefined;
  }
  const office = offices.find((o) => officeLabel(o) === place);
  return office ? { kind: 'office', office } : undefined;
}

/** The `Pickup location *` select, and the free-text field `Other…` reveals.
 *  The office select is invalid only while `Other…` is not chosen; otherwise
 *  the free-text field carries the error. */
function PickupLocationField({
  place,
  other,
  invalid,
  pickupOffices,
  onPlace,
  onOther,
}: {
  place: string;
  other: string;
  invalid: boolean;
  pickupOffices: readonly Office[];
  onPlace: (value: string) => void;
  onOther: (value: string) => void;
}) {
  const locationError = useId();
  const officeInvalid = invalid && place !== OTHER;

  return (
    <>
      <div className="flex flex-col gap-8">
        <span className={`type-ui-bold ${officeInvalid ? 'text-status-rejected-fg' : 'text-ink-strong'}`}>
          Pickup location<span aria-hidden="true"> *</span>
        </span>
        <Select
          label="Pickup location"
          placeholder="Select a location"
          required
          invalid={officeInvalid}
          describedBy={officeInvalid ? locationError : undefined}
          value={place || undefined}
          options={[...pickupOffices.map(officeLabel), OTHER]}
          onChange={onPlace}
        />
        {officeInvalid ? (
          <p id={locationError} role="alert" className="type-meta text-status-rejected-fg">
            {LOCATION_REQUIRED}
          </p>
        ) : null}
      </div>

      {place === OTHER ? (
        <TextField
          label="Other location"
          required
          autoFocus
          placeholder="e.g 6th floor IT desk"
          value={other}
          invalid={invalid}
          message={OTHER_REQUIRED}
          onChange={(e) => onOther(e.target.value)}
        />
      ) : null}
    </>
  );
}

export function UpdateStatusForm({
  status,
  requestorOffice,
  pickupOffices,
  submitting,
  submittingLabel = 'Updating…',
  onBack,
  onConfirm,
}: {
  status: RequestStatus;
  requestorOffice: Office;
  pickupOffices: readonly Office[];
  submitting: boolean;
  /** The submit button's words while the change is in flight. */
  submittingLabel?: string;
  onBack: () => void;
  /** Resolves `'location-required'` if the source refused the location, which
   *  puts the location back in its invalid state. */
  onConfirm: (to: UpdateStatusTarget, pickup?: PickupLocation) => Promise<'location-required' | void>;
}) {
  const targets = updateStatusTargets(status);
  const isTarget = (value: string): value is UpdateStatusTarget => (targets as readonly string[]).includes(value);
  // From `Approved` the frame draws `For Delivery`. From a handover state the
  // next step is `Received`, the first option (FR-008).
  const [to, setTo] = useState<UpdateStatusTarget>(targets[0] ?? 'For Delivery');
  const [place, setPlace] = useState(() => (pickupOffices.includes(requestorOffice) ? officeLabel(requestorOffice) : ''));
  const [other, setOther] = useState('');
  const [invalid, setInvalid] = useState(false);
  // The valid change waiting on the confirmation dialog (FR-008b).
  const [asking, setAsking] = useState<{ to: UpdateStatusTarget; pickup?: PickupLocation } | null>(null);

  const confirm = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (to !== 'Ready for Pickup') {
      setAsking({ to });
      return;
    }
    const pickup = chosenLocation(place, other, pickupOffices);
    if (!pickup) {
      setInvalid(true);
      return;
    }
    setAsking({ to, pickup });
  };

  const send = async () => {
    if (!asking || submitting) return;
    const refused = await onConfirm(asking.to, asking.pickup);
    // On success the form is gone. Otherwise the dialog closes so the panel's
    // notice, or the invalid location, is in view.
    setAsking(null);
    if (refused === 'location-required' && asking.pickup) setInvalid(true);
  };

  const pickingUp = to === 'Ready for Pickup';

  return (
    <form
      onSubmit={confirm}
      noValidate
      aria-label="Update status"
      className="flex flex-col gap-16 rounded-10 bg-surface-card p-16 ring-1 ring-line-default"
    >
      <div className="flex flex-col gap-8">
        <span className="type-ui-bold text-ink-strong">
          Status<span aria-hidden="true"> *</span>
        </span>
        <Select
          label="Status"
          required
          value={to}
          options={[...targets]}
          onChange={(value) => {
            if (isTarget(value)) setTo(value);
            setInvalid(false);
          }}
        />
      </div>

      {pickingUp ? (
        <PickupLocationField
          place={place}
          other={other}
          invalid={invalid}
          pickupOffices={pickupOffices}
          onPlace={(value) => {
            setPlace(value);
            setInvalid(false);
          }}
          onOther={(value) => {
            setOther(value);
            if (invalid && value.trim()) setInvalid(false);
          }}
        />
      ) : null}

      <div className="flex items-center justify-center gap-12">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? submittingLabel : 'Update Status'}
        </Button>
      </div>

      {asking ? (
        <ConfirmDialog
          title="Update status?"
          confirmLabel="Confirm"
          busy={submitting}
          onCancel={() => setAsking(null)}
          onConfirm={() => void send()}
        >
          <p>
            {`Change this request from ${status} to ${asking.to}${asking.pickup ? `, collected at ${pickupLabel(asking.pickup)}` : ''}.`}
          </p>
          {asking.to === 'Received' ? (
            <p>The items will be assigned to the employee. This cannot be undone.</p>
          ) : null}
          <p className="text-ink-secondary">The employee will receive an email about the change.</p>
        </ConfirmDialog>
      ) : null}
    </form>
  );
}
