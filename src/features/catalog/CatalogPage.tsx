import { useMemo } from 'react';
import { LoadingState, Notice, PageHeader, Search } from '../../shared/ui';
import { DESTINATIONS } from '../../app/destinations';
import { useCatalog } from './catalog-context';
import { CatalogProvider } from './CatalogProvider';
import { CatalogGrid } from './CatalogGrid';
import { CategoryChip } from './CategoryChip';
import { RequestListDraftProvider } from './RequestListDraftProvider';
import { seededCatalogSource } from './seeded-source';
import { useCatalogFilters } from './useCatalogFilters';

/** The catalog (spec 005).
 *
 *  Reads through the boundary; every role sees the same item facts and only an
 *  Employee is offered the action that starts a request. Nothing on this page
 *  changes stock. */
function CatalogContents() {
  const state = useCatalog();
  const items = state.status === 'ready' ? state.items : [];
  const { term, setTerm, type, setType, types, visible, clearAll, filtered } = useCatalogFilters(items);

  const { title, purpose } = DESTINATIONS.catalog;

  if (state.status === 'loading') {
    return (
      <div className="flex flex-col gap-24">
        <PageHeader title={title} subtitle={purpose} />
        <LoadingState label="Loading the catalog" />
      </div>
    );
  }

  if (state.status === 'failed') {
    return (
      <div className="flex flex-col gap-24">
        <PageHeader title={title} subtitle={purpose} />
        <Notice
          eyebrow="Unavailable"
          tone="stopped"
          title="The catalog could not be loaded"
          body="Stock numbers are not available right now, so nothing is shown rather than showing figures that may be out of date."
          actions={
            <button
              type="button"
              onClick={state.retry}
              className="hit-area inline-flex h-control-height-md cursor-pointer items-center rounded-10 border-none bg-brand-primary px-18 type-ui-bold text-brand-on-primary ring-brand transition-osrs hover:bg-osrs-red-550"
            >
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-24">
        <PageHeader title={title} subtitle={purpose} />
        <Notice
          eyebrow="Empty"
          title="No supplies have been encoded yet"
          body="A Supply Admin needs to add items and their quantities before requests can be made."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <PageHeader title={title} subtitle={purpose} />
      <Search
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search supplies by name or model"
        aria-label="Search supplies by name or model"
      />
      <div className="flex flex-wrap gap-10">
        {types.map((t) => (
          <CategoryChip key={t} label={t} active={t === type} onClick={() => setType(t)} />
        ))}
      </div>
      <CatalogGrid items={visible} filtered={filtered} onClearFilters={clearAll} />
    </div>
  );
}

export function CatalogPage() {
  /* Stable across renders so the provider's effect does not re-fetch on every
     parent render. Swapped for a contract-backed source when one exists. */
  const source = useMemo(() => seededCatalogSource(), []);
  return (
    <CatalogProvider source={source}>
      <RequestListDraftProvider>
        <CatalogContents />
      </RequestListDraftProvider>
    </CatalogProvider>
  );
}
