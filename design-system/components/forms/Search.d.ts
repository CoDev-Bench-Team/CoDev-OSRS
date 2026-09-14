import * as React from 'react';

export interface SearchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Placeholder copy. Defaults to the catalog wording from the source. */
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * The 46px hairline search field used above every catalog, queue and inventory table.
 * @startingPoint section="Forms" subtitle="Catalog / inventory search field" viewport="700x120"
 */
export declare function Search(props: SearchProps): JSX.Element;
