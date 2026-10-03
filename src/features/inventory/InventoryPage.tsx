import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  PageHeader,
  SkeletonRegion,
  SkeletonRows,
  StatusPill,
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  tableColumnStyle,
  NotPublished,
  tableMinWidth,
  type ColumnWidth,
} from '../../shared/ui';
import { useSessionReady } from '../auth/session-context';
import { DESTINATIONS } from '../../app/destinations';
import { TablePager, TableState, type TableLoadState } from '../assets/TableToolbar';
import { useRemoteTableQuery, type RemoteTableQuery } from '../assets/useRemoteTableQuery';
import { ALL_CATEGORIES, type TableQuery } from '../assets/table-query';
import { NO_VALUE } from '../requests/format';
import { PAGE_SIZES } from '../requests/queue/queue-types';
import { AddInventoryMenu, type AddKind } from './AddInventoryMenu';
import { BulkAddPanel } from './BulkAddPanel';
import { inventorySource, type InventorySource } from './inventory-source';
import { InventoryToolbar } from './InventoryToolbar';
import { type UnitBatchDraft, type UnitChip, type UnitDetail, type UnitDraft, type UnitRow } from './types';
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

type PanelState = { kind: AddKind } | { kind: 'edit'; id: string } | null;

/** Every query is asked of the API (spec 017 Story 8). */
export function InventoryPage() {
  const ready = useSessionReady();
  const source = useMemo(() => inventorySource(), []);
  const fetchPage = useCallback((q: RemoteTableQuery<UnitChip>, withCounts: boolean) => source.page(q, withCounts), [source]);
  const { state, query, reload, fetching } = useRemoteTableQuery(fetchPage, { pageSizes: PAGE_SIZES, table: 'inventory', enabled: ready });
  const after = useCallback(
    async <T,>(saving: Promise<T>) => {
      const saved = await saving;
      reload();
      return saved;
    },
    [reload],
  );
  /** Units the API confirmed removed. A list read sent straight after the
   *  delete can still carry the unit (the API soft-deletes, and its read can
   *  lag the write), so a removed unit is kept off the table, and out of the
   *  counts, until a read no longer returns it. */
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const shown = useMemo(() => {
    const hidden = query.rows.filter((row) => removed.has(row.id));
    if (!hidden.length) return query;
    const less = (status: UnitChip) => hidden.filter((row) => row.status === status).length;
    return {
      ...query,
      rows: query.rows.filter((row) => !removed.has(row.id)),
      total: Math.max(0, query.total - hidden.length),
      counts: {
        all: Math.max(0, query.counts.all - hidden.length),
        of: (status: UnitChip) => Math.max(0, query.counts.of(status) - less(status)),
      },
    };
  }, [query, removed]);
  /** The register itself is empty, not just this filter: All counts every
   *  unit for the search and category, so with neither set and that count
   *  settled at zero there is nothing in the register. Not the page's total,
   *  which answers the previous query while the next one is in flight. */
  const registerEmpty =
    !query.search && query.category === ALL_CATEGORIES && !query.countsLoading && shown.counts.all === 0;
  return (
    <InventoryView
      source={source}
      state={state}
      busy={fetching}
      query={shown}
      registerEmpty={registerEmpty}
      actions={{
        reload,
        get: (id) => source.get(id),
        create: (draft) => after(source.create(draft)),
        createBatch: (draft) => after(source.createBatch(draft)),
        update: (id, draft) => after(source.update(id, draft)),
        remove: async (id, reason) => {
          await source.remove(id, reason);
          setRemoved((current) => new Set(current).add(id));
          reload();
        },
      }}
    />
  );
}

type InventoryActions = {
  reload: () => unknown;
  get: (id: string) => Promise<UnitDetail>;
  create: (draft: UnitDraft) => Promise<unknown>;
  createBatch: (draft: UnitBatchDraft) => Promise<unknown>;
  update: (id: string, draft: UnitDraft) => Promise<unknown>;
  remove: (id: string, reason: string) => Promise<unknown>;
};

function InventoryView({
  busy,
  source,
  state,
  query,
  registerEmpty,
  actions: { reload, get, create, createBatch, update, remove },
}: {
  source: InventorySource;
  /** The next page is in flight. */
  busy: boolean;
  state: TableLoadState;
  query: TableQuery<UnitChip, UnitRow>;
  /** No unit exists at all, rather than none matching. */
  registerEmpty: boolean;
  actions: InventoryActions;
}) {
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

      <TableCard className="mt-[34px] min-w-0" busy={busy}>
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
              fetching={busy}
              rowCount={query.rows.length}
              empty={registerEmpty ? 'No units in the register yet' : 'No unit matches that search'}
              loading={
                <SkeletonRegion label="Loading inventory">
                  <SkeletonRows
                    columns={[
                      ['200px', 'bold'],
                      ['150px', 'text'],
                      ['180px', 'text'],
                      ['150px', 'text'],
                      ['167px', 'office'],
                      ['190px', 'caption'],
                      ['167px', 'unit-pill'],
                      [undefined, 'button'],
                    ]}
                    rowClassName="h-row-height-inventory border-b border-line-default bg-surface-card"
                  />
                </SkeletonRegion>
              }
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
                  ) : unit.status === 'Assigned' ? (
                    // The API's unit read carries no assignee (contracts G6).
                    <span className="type-ui text-ink-strong">
                      <NotPublished />
                    </span>
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

      <TablePager query={query} hidden={state.kind === 'loading' || busy} />

      {/* New units lead the list, so with no filter set page 1 shows them.
          Filters are the Admin's and are left as they are. */}
      {panel?.kind === 'single' ? (
        <UnitFormPanel
          mode="add"
          addStatuses={source.createStatuses}
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
