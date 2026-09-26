import { useId, useState, type FormEvent } from 'react';
import { Button, Select, TextField, type RequestStatus } from '../../../shared/ui';
import type { Office } from '../../auth/types';
import { HANDOVER_STATUSES, type HandoverStatus, type PickupLocation } from './review-types';

/** `02.2.1 - Update Status`: a required `Status *` select offering the two
 *  handover peers, with Cancel / Update Status (spec 008 Story 3, plan D7).
 *
 *  The frame draws only the status. Choosing `Ready for Pickup` reveals a
 *  required pickup location, because spec 001 FR-011a needs one. The location
 *  is one of the offices the source exposes, with the request's office
 *  preselected, or `Other…`, which reveals a free-text field. This is decided
 *  by the project owner, undrawn, and logged in additions.md §3h.
 *
 *  A request already `Ready for Pickup` starts on the location it has, not the
 *  office, so confirming without looking never silently moves it. A submit that
 *  changes nothing is refused: it is not a transition, and it must not reach
 *  the source (or, later, send a `Status changed` email for no change). */
const OTHER = 'Other…';
const officeLabel = (office: Office) => `${office} Office`;
const LOCATION_REQUIRED = 'Choose where the employee collects the items.';
const OTHER_REQUIRED = 'Enter where the employee collects the items.';

const sameLocation = (a: PickupLocation | undefined, b: PickupLocation | undefined) =>
  !!a && !!b && (a.kind === 'office' ? b.kind === 'office' && a.office === b.office : b.kind === 'other' && a.text === b.text);

const isHandover = (value: string): value is HandoverStatus => (HANDOVER_STATUSES as readonly string[]).includes(value);

export function UpdateStatusForm({
  status,
  pickupLocation,
  requestorOffice,
  pickupOffices,
  submitting,
  onBack,
  onConfirm,
}: {
  status: RequestStatus;
  /** The location a `Ready for Pickup` request already has. */
  pickupLocation?: PickupLocation;
  requestorOffice: Office;
  pickupOffices: readonly Office[];
  submitting: boolean;
  onBack: () => void;
  /** Resolves `'location-required'` if the source refused the location, which
   *  puts the location back in its invalid state. */
  onConfirm: (to: HandoverStatus, pickup?: PickupLocation) => Promise<'location-required' | void>;
}) {
  // From `Approved` the frame draws `For Delivery`. From a handover state the
  // useful default is the peer, since swapping is why the Admin is here.
  const [to, setTo] = useState<HandoverStatus>(status === 'For Delivery' ? 'Ready for Pickup' : 'For Delivery');
  const [place, setPlace] = useState<string>(() => {
    if (pickupLocation?.kind === 'other') return OTHER;
    if (pickupLocation?.kind === 'office' && pickupOffices.includes(pickupLocation.office)) {
      return officeLabel(pickupLocation.office);
    }
    return pickupOffices.includes(requestorOffice) ? officeLabel(requestorOffice) : '';
  });
  const [other, setOther] = useState(pickupLocation?.kind === 'other' ? pickupLocation.text : '');
  const [invalid, setInvalid] = useState(false);
  const [unchanged, setUnchanged] = useState(false);
  const locationError = useId();

  const pickup = (): PickupLocation | undefined => {
    if (place === OTHER) {
      const text = other.trim();
      return text ? { kind: 'other', text } : undefined;
    }
    const office = pickupOffices.find((o) => officeLabel(o) === place);
    return office ? { kind: 'office', office } : undefined;
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (to === 'Ready for Pickup') {
      const location = pickup();
      if (!location) {
        setInvalid(true);
        return;
      }
      if (status === to && sameLocation(location, pickupLocation)) {
        setUnchanged(true);
        return;
      }
      if ((await onConfirm(to, location)) === 'location-required') setInvalid(true);
      return;
    }
    if (status === to) {
      setUnchanged(true);
      return;
    }
    await onConfirm(to);
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
          options={[...HANDOVER_STATUSES]}
          onChange={(value) => {
            if (isHandover(value)) setTo(value);
            setInvalid(false);
            setUnchanged(false);
          }}
        />
      </div>

      {pickingUp ? (
        <div className="flex flex-col gap-8">
          <span className={`type-ui-bold ${invalid && place !== OTHER ? 'text-status-rejected-fg' : 'text-ink-strong'}`}>
            Pickup location<span aria-hidden="true"> *</span>
          </span>
          <Select
            label="Pickup location"
            placeholder="Select a location"
            required
            invalid={invalid && place !== OTHER}
            describedBy={invalid && place !== OTHER ? locationError : undefined}
            value={place || undefined}
            options={[...pickupOffices.map(officeLabel), OTHER]}
            onChange={(value) => {
              setPlace(value);
              setInvalid(false);
              setUnchanged(false);
            }}
          />
          {invalid && place !== OTHER ? (
            <p id={locationError} role="alert" className="type-meta text-status-rejected-fg">
              {LOCATION_REQUIRED}
            </p>
          ) : null}
        </div>
      ) : null}

      {pickingUp && place === OTHER ? (
        <TextField
          label="Other location"
          required
          autoFocus
          placeholder="e.g 6th floor IT desk"
          value={other}
          invalid={invalid}
          message={OTHER_REQUIRED}
          onChange={(e) => {
            setOther(e.target.value);
            setUnchanged(false);
            if (invalid && e.target.value.trim()) setInvalid(false);
          }}
        />
      ) : null}

      {unchanged ? (
        <p role="alert" className="type-meta text-status-rejected-fg">
          {`This request is already ${status}${to === 'Ready for Pickup' ? ' at that location' : ''}. Choose a different status or location.`}
        </p>
      ) : null}

      <div className="flex items-center justify-center gap-12">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          Update Status
        </Button>
      </div>
    </form>
  );
}
