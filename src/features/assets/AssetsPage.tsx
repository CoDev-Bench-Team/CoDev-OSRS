import { useCallback, useState } from 'react';
import {
  Button,
  PageHeader,
  SkeletonRegion,
  SkeletonRows,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
  type StockStatus,
} from '../../shared/ui';
import { DESTINATIONS, pageSubtitle } from '../../app/destinations';
import { useSessionReady } from '../auth/session-context';
import { AssetFormPanel } from './AssetFormPanel';
import { assetSource } from './asset-store';
import { TablePager, TableState, TableToolbar, type TableLoadState } from './TableToolbar';
import type { TableQuery } from './table-query';
import { useRemoteTableQuery, type RemoteTableQuery } from './useRemoteTableQuery';
import { ViewAssetPanel } from './ViewAssetPanel';
import type { Asset, AssetDraft } from './types';

/** `/assets` — `03- Assets` (spec 014 Story 1).
 *
 *  The requestable catalogue, by model, with its units counted by status and
 *  summed across the five offices: Available, Reserved and Assigned
 *  (ADR-0008). A row opens View Asset; **+ Add Asset** opens the Add panel.
 *
 *  Column widths are the drawn ones (320 / 180 / 264 / 180 / 180, the last
 *  taking the rest) inside 20px padding, so below about 1300px
 *  the table scrolls sideways inside its card rather than reflowing. */
const COLUMNS: [label: string, width?: ColumnWidth][] = [
  ['ITEM NAME', '320px'],
  ['CATEGORY', '180px'],
  ['MODEL', '264px'],
  ['AVAILABLE UNITS', '180px'],
  ['PENDING/RESERVED UNITS', '180px'],
  ['ASSIGNED UNITS'],
];

const PAGE_SIZES = [10, 25, 50] as const;

/** Derived from the columns and the shared gutter; the fluid column keeps 120px. */
const TABLE_MIN_WIDTH = tableMinWidth(
  COLUMNS.map(([, width]) => width),
  120,
);

type PanelState = { kind: 'add' } | { kind: 'view'; id: string } | { kind: 'update'; id: string } | null;

/** Every query is asked of the API (spec 017 Story 7). */
export function AssetsPage() {
  const ready = useSessionReady();
  const fetchPage = useCallback((q: RemoteTableQuery<StockStatus>) => assetSource.page(q), []);
  const { state, query, reload, fetching } = useRemoteTableQuery(fetchPage, { pageSizes: PAGE_SIZES, table: 'assets', enabled: ready });
  const saved = useCallback(
    async (saving: Promise<Asset>) => {
      const asset = await saving;
      reload();
      return asset;
    },
    [reload],
  );
  return (
    <AssetsView
      state={state}
      busy={fetching}
      query={query}
      reload={reload}
      create={(draft) => saved(assetSource.create(draft))}
      update={(id, draft) => saved(assetSource.update(id, draft))}
    />
  );
}

function AssetsView({
  busy,
  state,
  query,
  reload,
  create,
  update,
}: {
  /** The next page is in flight. */
  busy: boolean;
  state: TableLoadState;
  query: TableQuery<StockStatus, Asset>;
  reload: () => unknown;
  create: (draft: AssetDraft) => Promise<Asset>;
  update: (id: string, draft: AssetDraft) => Promise<Asset>;
}) {
  const [panel, setPanel] = useState<PanelState>(null);
  const selected: Asset | undefined =
    panel && panel.kind !== 'add' ? query.rows.find((a) => a.id === panel.id) : undefined;

  return (
    <div className="flex flex-1 flex-col pt-[34px] pb-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <PageHeader title={DESTINATIONS.assets.title} subtitle={pageSubtitle(DESTINATIONS.assets)} />
        <Button variant="accent" onClick={() => setPanel({ kind: 'add' })}>
          + Add Asset
        </Button>
      </div>

      <TableToolbar query={query} allLabel="All items" />

      <TableCard className="mt-[34px] min-w-0" busy={busy}>
        {/* Focusable, as the Requests Queue's is, so a keyboard can scroll the
            count columns into view when the table is wider than the window. */}
        <div
          role="region"
          aria-label="Assets table"
          tabIndex={0}
          className="w-full min-w-0 overflow-x-auto focus-visible:-outline-offset-2"
        >
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <div className={`flex h-[48px] items-center bg-surface-table-header ${TABLE_ROW_PADDING_CLASS}`}>
              {COLUMNS.map(([label, width]) => (
                <span key={label} className="type-eyebrow uppercase text-ink-secondary" style={tableColumnStyle(width)}>
                  {label}
                </span>
              ))}
            </div>

            <TableState
              state={state}
              fetching={busy}
              rowCount={query.rows.length}
              empty="No asset matches that search"
              loading={
                <SkeletonRegion label="Loading stock">
                  <SkeletonRows
                    columns={[
                      ['320px', 'bold'],
                      ['180px', 'text'],
                      ['264px', 'text'],
                      ['180px', 'number'],
                      ['180px', 'number'],
                      [undefined, 'number'],
                    ]}
                    rowClassName="h-row-height-inventory border-b border-line-default bg-surface-card"
                  />
                </SkeletonRegion>
              }
              failedTitle="Stock could not be loaded"
              onRetry={() => void reload()}
            />

            {query.rows.map((asset) => (
              <div
                key={asset.id}
                className={`relative flex h-row-height-inventory w-full items-center border-b border-line-default bg-surface-card ${TABLE_ROW_PADDING_CLASS} transition-osrs hover:bg-osrs-surface-subtle`}
              >
                {/* The name is the row's one control, so the other cells stay
                    readable text. `static` lets its ::after reach the row,
                    making the whole row clickable as drawn and carrying the
                    focus ring around it; the touch-target rule would
                    otherwise position the button (index.css). */}
                <span className="min-w-0 pr-16" style={tableColumnStyle('320px')}>
                  <button
                    type="button"
                    onClick={() => setPanel({ kind: 'view', id: asset.id })}
                    className="static block w-full cursor-pointer truncate border-none bg-transparent p-0 text-left type-ui-bold text-ink-strong after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand-primary"
                  >
                    {asset.name}
                  </button>
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle('180px')}>
                  {asset.category}
                </span>
                <span className="truncate pr-16 type-ui text-ink-strong" style={tableColumnStyle('264px')}>
                  {asset.model ?? '—'}
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle('180px')}>
                  {asset.available}
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle('180px')}>
                  {asset.reserved}
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle()}>
                  {asset.assigned}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TableCard>

      <TablePager query={query} hidden={state.kind === 'loading' || busy} />

      {/* New assets lead the list, so with no filter set page 1 shows the one
          just added. Filters are the Admin's and are left as they are. */}
      {panel?.kind === 'add' ? (
        <AssetFormPanel
          onClose={() => setPanel(null)}
          onSave={async (draft) => {
            await create(draft);
            query.setPage(1);
          }}
        />
      ) : null}
      {panel?.kind === 'view' && selected ? (
        <ViewAssetPanel
          asset={selected}
          onClose={() => setPanel(null)}
          onUpdate={() => setPanel({ kind: 'update', id: selected.id })}
        />
      ) : null}
      {panel?.kind === 'update' && selected ? (
        <AssetFormPanel
          asset={selected}
          onClose={() => setPanel({ kind: 'view', id: selected.id })}
          onSave={(draft) => update(selected.id, draft)}
        />
      ) : null}
    </div>
  );
}
