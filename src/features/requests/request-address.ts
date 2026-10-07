import { fieldsFrom, useAddressFields } from '../../shared/address-fields';
import { ADDRESS_FIELDS, SORT_PARAM, sortFromParam, type QueueSort } from './queue/queue-types';

/** The Requests Queue's and History's search and sort, kept in the address
 *  (`?search=&sort=`), so they survive a reload and can be shared as a link.
 *  The chip and the page are not kept. */

type Addressed = { search: string; sort: QueueSort };

/** The search and sort an address names, for a table's first query. */
export function addressedQuery(search: string): Addressed {
  const fields = fieldsFrom(search, ADDRESS_FIELDS);
  return { search: fields.search, sort: sortFromParam(fields.sort) };
}

/** Writes the table's search and sort to the address as they change, and
 *  applies an outside change to the address (a link to the bare page) as a
 *  change of the table's own. */
export function useRequestAddress(query: Addressed, change: (patch: Addressed) => void): void {
  useAddressFields(ADDRESS_FIELDS, { search: query.search, sort: SORT_PARAM[query.sort] }, (fields) =>
    change({ search: fields.search, sort: sortFromParam(fields.sort) }),
  );
}
