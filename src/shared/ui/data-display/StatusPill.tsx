import {
  PICKUP_LABEL,
  REQUEST_TONE,
  STOCK_TONE,
  type Availability,
  type RequestStatus,
  type StatusTone,
  type StockStatus,
} from '../status';

const TONE: Record<StatusTone, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg',
  ready: 'bg-status-ready-bg text-status-ready-fg',
  rejected: 'bg-status-rejected-bg text-status-rejected-fg',
};

const AVAILABILITY: Record<Availability, { cls: string; label: string }> = {
  available: { cls: 'bg-status-available-bg text-status-available-fg', label: 'Available' },
  unavailable: { cls: 'bg-status-unavailable-bg text-status-unavailable-fg', label: 'Unavailable' },
};

/** The pill carries two geometries, chosen by which kind of status it is given
 *  (spec 002 FR-009):
 *
 *  - request and stock  — 999px radius, 12px bold, 6x10 padding
 *  - catalog availability — 8px radius, 11.5px bold, 10px padding, on 10% tints
 *
 *  Passing a `pickupLabel` renders `Released` as "Ready for Pickup" without
 *  changing the status itself. */
type Props =
  | { status: RequestStatus; stock?: never; availability?: never; pickupLabel?: boolean; className?: string }
  | { stock: StockStatus; status?: never; availability?: never; pickupLabel?: never; className?: string }
  | { availability: Availability; status?: never; stock?: never; pickupLabel?: never; className?: string };

export function StatusPill(props: Props) {
  const { className } = props;

  if (props.availability) {
    const a = AVAILABILITY[props.availability];
    return (
      <span
        className={`inline-flex items-center justify-center rounded-8 p-10 font-sans text-11-5 font-bold leading-display whitespace-nowrap ${a.cls} ${className ?? ''}`}
      >
        {a.label}
      </span>
    );
  }

  const value = props.status ?? props.stock!;
  const tone = props.status ? REQUEST_TONE[props.status] : STOCK_TONE[props.stock!];
  const label = props.status && props.pickupLabel ? (PICKUP_LABEL[props.status] ?? value) : value;

  return (
    <span
      className={`inline-flex items-center rounded-pill px-10 py-6 type-pill whitespace-nowrap ${TONE[tone]} ${className ?? ''}`}
    >
      {label}
    </span>
  );
}
