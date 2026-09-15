import * as React from 'react';

export type OsrsRequestStatus =
  | 'Pending Approval' | 'Approved' | 'Ready for Pickup' | 'For Delivery'
  | 'For Release' | 'Released' | 'Completed' | 'Rejected'
  | 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface StatusPillsProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `pill` = 999px request/stock status. `rounded` = 8px stock-availability chip. */
  shape?: 'pill' | 'rounded';
  /** Request or inventory status; drives the colour pair. */
  status?: OsrsRequestStatus;
  /** Availability chip form (forces `rounded`). */
  availability?: 'available' | 'unavailable';
  /** Override the rendered text without changing the colour pair. */
  label?: string;
}

/**
 * The status vocabulary of the whole system — request lifecycle pills and stock-availability chips.
 * @startingPoint section="Data display" subtitle="Every request + stock status colour pair" viewport="700x200"
 */
export declare function StatusPills(props: StatusPillsProps): JSX.Element;
