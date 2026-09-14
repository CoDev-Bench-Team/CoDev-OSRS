import * as React from 'react';

export interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The dialog or sheet to centre over the dimmed page. */
  children?: React.ReactNode;
}

/**
 * The 50% black scrim behind every modal — rejection confirmation, request-list drawer.
 * @startingPoint section="Overlay" subtitle="50% black modal scrim" viewport="700x220"
 */
export declare function Backdrop(props: BackdropProps): JSX.Element;
