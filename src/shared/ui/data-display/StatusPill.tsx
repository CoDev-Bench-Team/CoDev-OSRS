import {
  REQUEST_TONE,
  STOCK_TONE,
  type Availability,
  type InventoryStatus,
  type RequestStatus,
  type StatusTone,
  type StockStatus,
} from '../status';

const TONE: Record<StatusTone, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg',
  ready: 'bg-status-ready-bg text-status-ready-fg',
  rejected: 'bg-status-rejected-bg text-status-rejected-fg',
  completed: 'bg-status-completed-bg text-status-completed-fg',
  // Struck through, as the design's `Status/Cancelled` pill draws it.
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg line-through',
  delivery: 'bg-status-delivery-bg text-status-delivery-fg',
  pickup: 'bg-status-pickup-bg text-status-pickup-fg',
  received: 'bg-status-received-bg text-status-received-fg',
};

const AVAILABILITY: Record<Availability, { cls: string; label: string }> = {
  available: { cls: 'bg-status-available-bg text-status-available-fg', label: 'Available' },
  unavailable: { cls: 'bg-status-unavailable-bg text-status-unavailable-fg', label: 'Unavailable' },
};

/** The design's `Inventory Status` variants, on the same chip geometry as
 *  availability: green, amber and red text on a 10% tint of the same colour. */
const INVENTORY: Record<InventoryStatus, string> = {
  Available: 'bg-status-available-bg text-status-available-fg',
  'Low in Stock': 'bg-status-low-bg text-status-low-fg',
  'Out of Stock': 'bg-status-unavailable-bg text-status-unavailable-fg',
};

/** The pill carries two geometries, chosen by which kind of status it is given
 *  (spec 002 FR-009):
 *
 *  - request and stock  — 999px radius, 12px bold, 6x10 padding
 *  - catalog availability and inventory status — 8px radius, 11.5px bold,
 *    10px padding, on 10% tints
 *
 *  A request status always reads as its own name, in its own tone. */
type Props =
  | { status: RequestStatus; stock?: never; availability?: never; inventory?: never; className?: string }
  | { stock: StockStatus; status?: never; availability?: never; inventory?: never; className?: string }
  | { availability: Availability; status?: never; stock?: never; inventory?: never; className?: string }
  | { inventory: InventoryStatus; status?: never; stock?: never; availability?: never; className?: string };

export function StatusPill(props: Props) {
  const { className } = props;

  if (props.availability || props.inventory) {
    const { cls, label } = props.inventory
      ? { cls: INVENTORY[props.inventory], label: props.inventory }
      : AVAILABILITY[props.availability!];
    return (
      <span
        className={`inline-flex items-center justify-center rounded-8 p-10 font-sans text-11-5 font-bold leading-display whitespace-nowrap ${cls} ${className ?? ''}`}
      >
        {label}
      </span>
    );
  }

  const label = props.status ?? props.stock!;
  const tone = TONE[props.status ? REQUEST_TONE[props.status] : STOCK_TONE[props.stock!]];

  return (
    <span
      className={`inline-flex items-center rounded-pill px-10 py-6 type-pill whitespace-nowrap ${tone} ${className ?? ''}`}
    >
      {label}
    </span>
  );
}
