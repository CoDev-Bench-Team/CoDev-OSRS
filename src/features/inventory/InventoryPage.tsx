import { useMemo, useState } from 'react';
import {
  Button,
  PageHeader,
  StatusPill,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  tableColumnStyle,
  tableMinWidth,
  type ColumnWidth,
} from '../../shared/ui';
import { AssetFormPanel } from '../assets/AssetFormPanel';
import { useAssets } from '../assets/asset-store';
import { stockStatus, stockTotals } from '../assets/stock';
import { TablePager, TableState, TableToolbar } from '../assets/TableToolbar';
import { useTableQuery } from '../assets/useTableQuery';
import { UpdateStocksPanel } from './UpdateStocksPanel';

/** `/inventory` — `03 - Inventory`, the stock-levels frame B (spec 008 D2,
 *  Story 4).
 *
 *  One row per item, its stock summed over the five offices. `TOTAL STOCK`
 *  is always `AVAILABLE QUANTITY + RESERVED / PENDING`, because Available is
 *  derived from the other two rather than stored (constitution III). The pill
 *  is derived too (D11). `Update stock` opens the per-office panel.
 *
 *  **+ Add Inventory** is drawn and disabled: it opens a per-unit form — serial
 *  number, BitLocker identifier, recovery key — that constitution VIII puts out
 *  of scope (D10). Column widths are the drawn 300 / 180 / 140 / 170 / 190 /
 *  fill / 92. */
const COLUMNS: [label: string, width?: ColumnWidth, align?: string][] = [
  ['ITEM NAME', '300px'],
  ['CATEGORY', '180px'],
  ['TOTAL STOCK', '140px'],
  ['AVAILABLE QUANTITY', '170px'],
  ['RESERVED / PENDING', '190px'],
  ['STATUS'],
  ['ACTION', '92px', 'text-right'],
];

/** Derived from the columns and the shared gutter; the fluid column keeps 120px. */
const TABLE_MIN_WIDTH = tableMinWidth(
  COLUMNS.map(([, width]) => width),
  120,
);

type PanelState = { kind: 'stock'; id: string } | { kind: 'details'; id: string } | null;

export function InventoryPage() {
  const { state, reload, update, setStock } = useAssets();
  const assets = useMemo(() => (state.kind === 'loaded' ? state.assets : []), [state]);
  const rows = useMemo(
    () =>
      assets.map((asset) => {
        const totals = stockTotals(asset);
        return { asset, ...totals, status: stockStatus(totals.available, asset.lowStockThreshold) };
      }),
    [assets],
  );
  const query = useTableQuery(rows, (r) => ({
    text: `${r.asset.name} ${r.asset.model ?? ''} ${r.asset.category}`,
    category: r.asset.category,
    status: r.status,
  }));
  const [panel, setPanel] = useState<PanelState>(null);
  const selected = panel ? assets.find((a) => a.id === panel.id) : undefined;

  return (
    <div className="flex flex-1 flex-col pt-[34px] pb-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <PageHeader
          title="Inventory"
          subtitle="Monitor stock levels, manage reservations, and keep office essentials ready."
        />
        <Button
          variant="accent"
          disabled
          aria-describedby="add-inventory-note"
          className="cursor-not-allowed opacity-60"
        >
          + Add Inventory
        </Button>
        <span id="add-inventory-note" className="sr-only">
          Adding individual units is not part of the MVP
        </span>
      </div>

      <TableToolbar query={query} allLabel="All items" />

      <TableCard className="mt-[34px] min-w-0">
        <div className="w-full min-w-0 overflow-x-auto">
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <div className={`flex h-[48px] items-center bg-surface-table-header ${TABLE_ROW_PADDING_CLASS}`}>
              {COLUMNS.map(([label, width, align]) => (
                <span
                  key={label}
                  className={`type-eyebrow uppercase text-ink-secondary ${align ?? ''}`}
                  style={tableColumnStyle(width)}
                >
                  {label}
                </span>
              ))}
            </div>

            <TableState state={state} rowCount={query.rows.length} empty="No item matches that search" onRetry={() => void reload()} />

            {query.rows.map(({ asset, total, available, reserved, status }) => (
              <div key={asset.id} className={`flex h-row-height-inventory items-center border-b border-line-default ${TABLE_ROW_PADDING_CLASS}`}>
                <span className="truncate pr-16 type-ui-bold text-ink-strong" style={tableColumnStyle('300px')}>
                  {asset.name}
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle('180px')}>
                  {asset.category}
                </span>
                <span className="font-sans text-14 leading-tight font-bold text-ink-strong" style={tableColumnStyle('140px')}>
                  {total}
                </span>
                <span
                  className={`font-sans text-14 leading-tight font-bold ${available === 0 ? 'text-status-rejected-fg' : 'text-status-ready-fg'}`}
                  style={tableColumnStyle('170px')}
                >
                  {available}
                </span>
                <span className="font-sans text-14 leading-tight text-ink-strong" style={tableColumnStyle('190px')}>
                  {reserved}
                </span>
                <span style={tableColumnStyle()}>
                  <StatusPill stock={status} />
                </span>
                <span className="flex justify-end" style={tableColumnStyle('92px')}>
                  <button
                    type="button"
                    aria-label={`Update stock for ${asset.name}`}
                    onClick={() => setPanel({ kind: 'stock', id: asset.id })}
                    className="cursor-pointer border-none bg-transparent p-0 font-sans text-12 leading-tight font-bold whitespace-nowrap text-brand-primary transition-osrs hover:text-brand-primary-alt"
                  >
                    Update stock
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </TableCard>

      <TablePager query={query} />

      {panel?.kind === 'stock' && selected ? (
        <UpdateStocksPanel
          asset={selected}
          onClose={() => setPanel(null)}
          onSave={(change) => setStock(selected.id, change)}
          onEditDetails={() => setPanel({ kind: 'details', id: selected.id })}
        />
      ) : null}
      {panel?.kind === 'details' && selected ? (
        <AssetFormPanel
          asset={selected}
          onClose={() => setPanel({ kind: 'stock', id: selected.id })}
          onSave={(draft) => update(selected.id, draft)}
        />
      ) : null}
    </div>
  );
}
