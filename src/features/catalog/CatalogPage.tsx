import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, FilterChip, Notice, PageHeader, Search, SkeletonRegion, SupplyCardSkeleton } from '../../shared/ui';
import { DESTINATIONS, pageSubtitle } from '../../app/destinations';
import { useSession, useSessionReady } from '../auth/session-context';
import { useRequestList } from '../requests/create/request-draft';
import { RequestListDrawer } from '../requests/create/RequestListDrawer';
import { apiRequestSubmitSource } from '../requests/create/api-request-submit-source';
import type { CatalogSource } from './catalog-source';
import { useCatalog } from './catalog-context';
import { CatalogProvider } from './CatalogProvider';
import { CatalogGrid } from './CatalogGrid';
import { OfficeSelect } from './OfficeSelect';
import { apiCatalogSource } from './api-catalog-source';
import { OFFICES, type CatalogOffice } from './types';
import { CATEGORY_CHIPS, useCatalogFilters } from './useCatalogFilters';


/** The signed-in user's home office, if the catalog's office list has it. */
function useHomeOffice(): CatalogOffice | undefined {
  const { session } = useSession();
  const office: string | undefined = session?.user.office;
  return OFFICES.find((o) => o === office);
}

/** The catalog (spec 005).
 *
 *  Reads through the boundary, one office at a time; every role sees the same
 *  item facts and only an Employee is offered the action that starts a
 *  request. Nothing on this page changes stock.
 *
 *  The header, toolbar and chips stay put while the grid below them loads,
 *  fails or empties, so changing the office never throws away the search term
 *  or the chosen category. */
function CatalogContents({
  office,
  onOfficeChange,
  homeOffice,
}: {
  office: CatalogOffice;
  onOfficeChange: (office: CatalogOffice) => void;
  homeOffice: CatalogOffice | undefined;
}) {
  const state = useCatalog();
  const items = state.status === 'ready' ? state.items : [];
  const { term, setTerm, category, setCategory, visible, clearAll, filtered } = useCatalogFilters(items);

  let body: ReactNode;
  if (state.status === 'loading') {
    // The grid's own columns and gutter, filled with card silhouettes.
    body = (
      <SkeletonRegion label="Loading the catalog" className="grid grid-cols-1 gap-[27px] md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SupplyCardSkeleton key={i} />
        ))}
      </SkeletonRegion>
    );
  } else if (state.status === 'failed') {
    body = (
      <Notice
        eyebrow="Unavailable"
        tone="stopped"
        title="The catalog could not be loaded"
        body="Stock numbers are not available right now, so nothing is shown rather than showing figures that may be out of date."
        actions={<Button onClick={state.reload}>Try again</Button>}
      />
    );
  } else if (items.length === 0) {
    body = (
      <Notice
        eyebrow="Empty"
        title="No supplies have been encoded yet"
        body="Items and their quantities need to be encoded before requests can be made."
      />
    );
  } else {
    body = (
      <CatalogGrid
        items={visible}
        office={office}
        homeOffice={homeOffice}
        filtered={filtered}
        onClearFilters={clearAll}
      />
    );
  }

  /* `02 - Catalog` spacing: 34px below the top bar, 24 from header to
     toolbar, 12 from toolbar to chips, 34 from chips to the grid. */
  return (
    <div className="flex w-full min-w-0 flex-col gap-[34px] pt-[34px] pb-32">
      <div className="flex flex-col gap-24">
        <PageHeader title={DESTINATIONS.catalog.title} subtitle={pageSubtitle(DESTINATIONS.catalog)} />
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-16 md:flex-row">
            <Search
              className="md:flex-1"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onClear={() => setTerm('')}
              placeholder="Search supplies by name or category"
              aria-label="Search supplies by name or category"
            />
            <OfficeSelect value={office} onChange={onOfficeChange} />
          </div>
          <div className="flex flex-wrap gap-10" role="group" aria-label="Filter by category">
            {CATEGORY_CHIPS.map((c) => (
              <FilterChip key={c} label={c} selected={c === category} onSelect={() => setCategory(c)} />
            ))}
          </div>
        </div>
      </div>
      {body}
    </div>
  );
}

/** The Request List drawer, over the Catalog (spec 011 FR-006). Employee-only
 *  (FR-016); opened only from the top-bar marker (FR-006a). Inside the catalog
 *  provider so a submit can re-read the numbers it just moved (FR-011). */
function CatalogRequestList({ source, homeOffice }: { source: CatalogSource; homeOffice: CatalogOffice | undefined }) {
  const { session } = useSession();
  const { isOpen, submissions } = useRequestList();
  const { reload } = useCatalog();
  /* FR-011 in every state, keyed on the session's success count rather than
     a drawer callback: a submit sent before leaving the Catalog mid-submit
     (D7) can land after this Catalog was mounted anew, and it is this one that
     must re-read. A read already in flight may predate the reserve, and a
     failed one deserves the retry the submit makes useful. Not on mount — the
     Catalog has just read. */
  const seen = useRef(submissions);
  useEffect(() => {
    if (seen.current === submissions) return;
    seen.current = submissions;
    reload();
  }, [submissions, reload]);
  if (!isOpen || session?.role !== 'employee') return null;
  return (
    <RequestListDrawer catalogSource={source} submitSource={apiRequestSubmitSource} homeOffice={homeOffice} />
  );
}

export function CatalogPage() {
  /* The published API (spec 017 Story 1). A module constant, so the
     provider's effect does not re-fetch on every parent render. */
  const source = apiCatalogSource;
  const homeOffice = useHomeOffice();
  /* The requesting office is the Employee's own, so the selector opens on it
     (spec 001 Assumptions). Someone with no office in the list starts on the
     first one the contract names. */
  const ready = useSessionReady();
  // The office chosen here, else the home office once the session names it:
  // the page renders before the session resolves, so the home office cannot
  // be read only at mount.
  const [chosen, setOffice] = useState<CatalogOffice | null>(null);
  const office = chosen ?? homeOffice ?? OFFICES[0];

  return (
    <CatalogProvider source={source} office={office} enabled={ready}>
      <CatalogContents office={office} onOfficeChange={setOffice} homeOffice={homeOffice} />
      <CatalogRequestList source={source} homeOffice={homeOffice} />
    </CatalogProvider>
  );
}
