import { Select } from '../../shared/ui';
import { OFFICES, type CatalogOffice } from './types';

const label = (office: CatalogOffice) => `${office} Office`;

/** The office selector beside the search field ("Cebu Office" in
 *  `02 - Catalog`). Stock is held per office (constitution III), so this
 *  decides which office's availability every card shows.
 *
 *  The shared `Select`, at the source's 210px, with the options labelled as
 *  the design labels its value. */
export function OfficeSelect({
  value,
  onChange,
}: {
  value: CatalogOffice;
  onChange: (office: CatalogOffice) => void;
}) {
  return (
    <Select
      label="Office"
      className="md:w-[210px] md:shrink-0"
      value={label(value)}
      options={OFFICES.map(label)}
      onChange={(picked) => {
        const office = OFFICES.find((o) => label(o) === picked);
        if (office) onChange(office);
      }}
    />
  );
}
