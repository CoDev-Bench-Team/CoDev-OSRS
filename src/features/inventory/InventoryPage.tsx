import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
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
import { DESTINATIONS } from '../../app/destinations';
import { TablePager, TableState } from '../assets/TableToolbar';
import { useTableQuery } from '../assets/useTableQuery';
import { NO_VALUE } from '../requests/format';
import { AddInventoryMenu, type AddKind } from './AddInventoryMenu';
import { BulkAddPanel } from './BulkAddPanel';
import { inventorySource } from './inventory-source';
import { useInventory } from './inventory-store';
import { InventoryToolbar } from './InventoryToolbar';
import { UNIT_CHIPS, type UnitRow } from './types';
import { UnitFormPanel } from './UnitFormPanel';

/** `/inventory` — `03 - Inventory` (spec 015 Story 1, plan P10).
 *
 *  The register of physical units, one row per item, newest added first.
 *  **+ Add Inventory** opens Add Single Unit or Add Multiple Units; a row's
 *  **Review** opens Review/Edit. The open panel is component state, never an
 *  address, so no unit id or secret reaches a URL (FR-012).
 *
 *  Column widths are the frame's (200 / 150 / 180 / 150 / 167 / 190 / 167,
 *  ACTION taking the rest) inside 20px padding; below 1344px the table scrolls
 *  sideways inside its card. */
const COLUMNS: [label: string, width?: ColumnWidth][] = [
  ['MODEL', '200px'],
  ['CATEGORY', '150px'],
  ['PURCHASE REQUEST', '180px'],
  ['SERIAL NUMBER', '150px'],
  ['OFFICE', '167px'],
  ['ASSIGNED', '190px'],
  ['STATUS', '167px'],
  ['ACTION'],
];

const TABLE_MIN_WIDTH = tableMinWidth(
  COLUMNS.map(([, width]) => width),
  100,
);

/** The Queue's and History's options and default (FR-005). */
const PAGE_SIZES = [10, 25, 50, 100] as const;

type PanelState = { kind: AddKind } | { kind: 'edit'; id: string } | null;

export function InventoryPage() {
  const { search } = useLocation();
  const source = useMemo(() => inventorySource(search), [search]);
  const { state, reload, get, create, createBatch, update, remove } = useInventory(source);
  const units = useMemo(() => (state.kind === 'loaded' ? state.units : []), [state]);
  const query = useTableQuery(
    units,
    (u: UnitRow) => ({
      text: [u.itemName, u.model, u.pr, u.serialNumber].filter(Boolean).join(' '),
      category: u.category,
      status: u.status,
    }),
    { statuses: UNIT_CHIPS, pageSizes: PAGE_SIZES, pageSize: 50 },
  );
  const [panel, setPanel] = useState<PanelState>(null);
  const table = useRef<HTMLDivElement>(null);

  /** A panel that closes after its row has gone (a removal) has no opener to
   *  return to; focus goes to the table instead of falling to the page. */
  const closePanel = () => {
    setPanel(null);
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) table.current?.focus();
    });
  };

  return (
    <div className="flex flex-1 flex-col pt-[34px] pb-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <PageHeader title={DESTINATIONS.inventory.title} subtitle={DESTINATIONS.inventory.purpose} />
        <AddInventoryMenu onChoose={(kind) => setPanel({ kind })} />
      </div>

      <InventoryToolbar query={query} />

      <TableCard className="mt-[34px] min-w-0">
        {/* Focusable, as the Assets table is, so a keyboard can scroll the
            columns into view when the table is wider than the window. */}
        <div
          ref={table}
          role="region"
          aria-label="Inventory table"
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
              rowCount={query.rows.length}
              empty={units.length === 0 ? 'No units in the register yet' : 'No unit matches that search'}
              loadingLabel="Loading inventory"
              failedTitle="Inventory could not be loaded"
              onRetry={() => void reload()}
            />

            {query.rows.map((unit) => (
              <div
                key={unit.id}
                data-unit={unit.id}
                className={`flex h-row-height-inventory w-full items-center border-b border-line-default bg-surface-card ${TABLE_ROW_PADDING_CLASS}`}
              >
                <span className="truncate pr-16 type-ui-bold text-ink-strong" style={tableColumnStyle('200px')} title={unit.itemName}>
                  {unit.itemName}
                </span>
                <span className="type-ui text-ink-strong" style={tableColumnStyle('150px')}>
                  {unit.category}
                </span>
                <span className="truncate pr-16 type-ui text-ink-strong" style={tableColumnStyle('180px')}>
                  {unit.pr ?? NO_VALUE}
                </span>
                <span className="truncate pr-16 type-ui text-ink-strong" style={tableColumnStyle('150px')}>
                  {unit.serialNumber ?? NO_VALUE}
                </span>
                <span className="flex items-center" style={tableColumnStyle('167px')}>
                  {/* The design's `Site Office Label`, as the catalog's View
                      Specs draws it. */}
                  <span className="inline-flex h-32 items-center rounded-8 bg-surface-card px-10 font-sans text-11-5 font-bold leading-display text-ink-muted ring-default">
                    {unit.location}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-2 pr-16" style={tableColumnStyle('190px')}>
                  {unit.assignee ? (
                    <>
                      <span className="truncate type-ui text-ink-strong">{unit.assignee.name}</span>
                      {unit.assignee.department ? (
                        <span className="truncate font-sans text-11 leading-tight text-ink-secondary">{unit.assignee.department}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="font-sans text-11 leading-tight text-ink-muted">Unassigned</span>
                  )}
                </span>
                <span className="flex items-center" style={tableColumnStyle('167px')}>
                  <StatusPill unit={unit.status} />
                </span>
                <span className="flex items-center" style={tableColumnStyle()}>
                  <Button
                    aria-label={`Review ${unit.itemName} ${unit.serialNumber ?? unit.pr ?? ''}`.trim()}
                    onClick={() => setPanel({ kind: 'edit', id: unit.id })}
                  >
                    Review
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </TableCard>

      <TablePager query={query} />

      {/* New units lead the list, so with no filter set page 1 shows them.
          Filters are the Admin's and are left as they are. */}
      {panel?.kind === 'single' ? (
        <UnitFormPanel
          mode="add"
          onClose={closePanel}
          onCreate={async (draft) => {
            await create(draft);
            query.setPage(1);
          }}
        />
      ) : null}
      {panel?.kind === 'batch' ? (
        <BulkAddPanel
          onClose={closePanel}
          onCreate={async (draft) => {
            await createBatch(draft);
            query.setPage(1);
          }}
        />
      ) : null}
      {panel?.kind === 'edit' ? (
        <UnitFormPanel
          key={panel.id}
          mode="edit"
          unitId={panel.id}
          load={get}
          onClose={closePanel}
          onUpdate={update}
          onRemove={remove}
          onGone={() => void reload()}
        />
      ) : null}
    </div>
  );
}
