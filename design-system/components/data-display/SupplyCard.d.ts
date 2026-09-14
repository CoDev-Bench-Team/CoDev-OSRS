import * as React from 'react';

export interface SupplyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase eyebrow above the item name. */
  category?: string;
  /** Item name, Inter 700 / 17px. */
  name?: string;
  /** Availability chip state. */
  availability?: 'available' | 'unavailable';
  /** Override the chip copy. */
  availabilityLabel?: string;
  /** Label above the model select. */
  modelLabel?: string;
  /** Currently selected model. */
  model?: string;
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  /** Primary button copy. */
  actionLabel?: string;
  onAction?: () => void;
  /** Hero bitmap URL. Defaults to the bundled catalog photo. */
  image?: string;
}

/**
 * The catalog tile: 436px photo card with availability chip, model select, quantity stepper and the primary add action.
 * @startingPoint section="Data display" subtitle="Catalog supply card, 436×415" viewport="700x430"
 */
export declare function SupplyCard(props: SupplyCardProps): JSX.Element;
