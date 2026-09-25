import { useMemo, useState } from 'react';
import {
  Button,
  PageHeader,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
} from '../../shared/ui';
import { AssetFormPanel } from './AssetFormPanel';
import { useAssets } from './asset-store';
import { assetStockStatus, stockTotals } from './stock';
import { TablePager, TableState, TableToolbar } from './TableToolbar';
import { useTableQuery } from './useTableQuery';
import { ViewAssetPanel } from './ViewAssetPanel';
import type { Asset } from './types';

/** `/assets` — `03- Assets` (spec 008 Story 1).
 *
 *  The requestable catalogue, by model, with unit counts summed across the five
 *  offices: Available and Reserved from stock, Deployed from completed requests.
 *  A row opens View Asset; **+ Add Asset** opens the Add panel.
 *
 *  Column widths are the drawn ones inside 20px padding, so below about 1100px
 *  the table scrolls sideways inside its card rather than reflowing, as
 *  Inventory does. */
const COLUMNS: [label: string, width?: ColumnWidth][] = [
  ['ITEM NAME', '300px'],
  ['CATEGORY', '160px'],
  ['MODEL', '200px'],
  ['AVAILABLE UNITS', '160px'],
  ['PENDING/RESERVED UNITS', '200px'],
  ['DEPLOYED UNITS'],
];

/** Derived from the columns and the shared gutter; the fluid column keeps 120px. */
const TABLE_MIN_WIDTH = tableMinWidth(
  COLUMNS.map(([, width]) => width),
  120,
);

type PanelState = { kind: 'add' } | { kind: 'view'; id: string } | { kind: 'update'; id: string } | null;

export function AssetsPage() {
  const { state, reload, create, update } = useAssets();
  const assets = useMemo(() => (state.kind === 'loaded' ? state.assets : []), [state]);
  const query = useTableQuery(assets, (a) => ({
    text: `${a.name} ${a.model ?? ''} ${a.category}`,
    category: a.category,
    status: assetStockStatus(a),
  }));
  const [panel, setPanel] = useState<PanelState>(null);
  const selected: Asset | undefined = panel && panel.kind !== 'add' ? assets.find((a) => a.id === panel.id) : undefined;

  return (
    <div className="flex flex-1 flex-col pt-[34px] pb-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <PageHeader title="Assets" subtitle="Deployed and available units" />
        <Button variant="accent" onClick={() => setPanel({ kind: 'add' })}>
          + Add Asset
        </Button>
      </div>

      <TableToolbar query={query} allLabel="All assets" />

      <TableCard className="mt-[34px] min-w-0">
        <div className="w-full min-w-0 overflow-x-auto">
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <div className={`flex h-[48px] items-center bg-surface-table-header ${TABLE_ROW_PADDING_CLASS}`} role="presentation">
              {COLUMNS.map(([label, width]) => (
                <span key={label} className="type-eyebrow uppercase text-ink-secondary" style={tableColumnStyle(width)}>
                  {label}
                </span>
              ))}
            </div>

            <TableState state={state} rowCount={query.rows.length} empty="No asset matches that search" onRetry={() => void reload()} />

            {query.rows.map((asset) => {
              const { available, reserved } = stockTotals(asset);
              return (
                <button
                  key={asset.id}
                  type="button"
                  aria-label={`View ${asset.name}`}
                  onClick={() => setPanel({ kind: 'view', id: asset.id })}
                  className={`flex h-row-height-inventory w-full cursor-pointer items-center border-x-0 border-t-0 border-b border-line-default bg-surface-card text-left ${TABLE_ROW_PADDING_CLASS} transition-osrs hover:bg-osrs-surface-subtle`}
                >
                  <span className="truncate pr-16 type-ui-bold text-ink-strong" style={tableColumnStyle('300px')}>
                    {asset.name}
                  </span>
                  <span className="type-ui text-ink-strong" style={tableColumnStyle('160px')}>
                    {asset.category}
                  </span>
                  <span className="truncate pr-16 type-ui text-ink-strong" style={tableColumnStyle('200px')}>
                    {asset.model ?? '—'}
                  </span>
                  <span className="type-ui text-ink-strong" style={tableColumnStyle('160px')}>
                    {available}
                  </span>
                  <span className="type-ui text-ink-strong" style={tableColumnStyle('200px')}>
                    {reserved}
                  </span>
                  <span className="type-ui text-ink-strong" style={tableColumnStyle()}>
                    {asset.deployed}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </TableCard>

      <TablePager query={query} />

      {panel?.kind === 'add' ? <AssetFormPanel onClose={() => setPanel(null)} onSave={create} /> : null}
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
