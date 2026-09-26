import { useMemo, useState } from 'react';
import { PageHeader, Pagination, Search, Select, StatusPill, TableCard } from '../../shared/ui';
import type { StockStatus } from '../../shared/ui';
import {
  ALL_CATEGORIES,
  CATEGORIES,
  DEFAULT_PAGE_SIZE,
  INVENTORY_ITEMS,
  PAGE_SIZES,
  STOCK_FILTERS,
} from './inventory-data';

/** Inventory — figma `03 - Inventory`, variant B (drift-2026-09-22 §4d).
 *
 *  The Admin's screen: the only role that may see or set stock (`ARCHITECT.md`
 *  §7). A title block, a search field beside a category filter, four stock
 *  chips, the stock table, and the pager.
 *
 *  **Read-only, on sample data.** The frame also draws "+ Add Inventory" and a
 *  per-row "Update stock" action. Neither is here: the first opens a per-unit
 *  form the designer has not reconciled with this aggregate table (drift §4e),
 *  the second opens `03.4 - Update Stocks`, and both need the per-office
 *  Total / Available / Reserved shape that is still open with the backend team
 *  (`contracts/README.md`, conflict 1). They return with an Inventory spec
 *  (BEN-80/81), not before — constitution I and VII.
 *
 *  Column widths are the drawn ones (300 / 180 / 140 / 170 / 190 / fill inside
 *  20px padding), which is why the table scrolls sideways inside its own card
 *  below about 1100px rather than reflowing: `DESIGN.md` §9 puts designed
 *  geometry ahead of an invented small-screen table.
 *
 *  The chip counts, the pager's range and the rows all come out of one pass
 *  over the same list — search and category first, then the counts, then the
 *  chip, then the page slice — so they cannot disagree with each other. The
 *  list is the frame's sample rows until the API supplies real ones.
 *
 *  The table is built from `div`s so the drawn flex geometry holds, and carries
 *  the ARIA table roles so a screen reader can still announce each value with
 *  its column heading.
 */
const COLUMNS: { label: string; width: string }[] = [
  { label: 'ITEM NAME', width: 'w-[300px]' },
  { label: 'CATEGORY', width: 'w-[180px]' },
  { label: 'TOTAL STOCK', width: 'w-[140px]' },
  { label: 'AVAILABLE QUANTITY', width: 'w-[170px]' },
  { label: 'RESERVED / PENDING', width: 'w-[190px]' },
  { label: 'STATUS', width: 'flex-1' },
];

export function InventoryPage() {
  const [query, setQuery] = useState('');
  const [stock, setStock] = useState<StockStatus | null>(null);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const view = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const searched = INVENTORY_ITEMS.filter(
      (item) =>
        (!needle || item.name.toLowerCase().includes(needle) || item.category.toLowerCase().includes(needle)) &&
        (category === ALL_CATEGORIES || item.category === category),
    );
    const counts = new Map(
      STOCK_FILTERS.map((filter) => [
        filter.label,
        filter.match === null ? searched.length : searched.filter((item) => item.stock === filter.match).length,
      ]),
    );
    const matching = stock === null ? searched : searched.filter((item) => item.stock === stock);
    // Clamped here rather than stored, so a filter that shrinks the list never
    // leaves the table on a page that no longer exists.
    const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
    const current = Math.min(page, pageCount);
    const rows = matching.slice((current - 1) * pageSize, current * pageSize);
    return { counts, total: matching.length, page: current, rows };
  }, [query, stock, category, page, pageSize]);

  // Any change to what matches starts again from the first page.
  const refilter = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  return (
    // The shell's `<main>` supplies the gutter and nothing else, so the drawn
    // vertical rhythm lives here: the frame puts the title at y=121 under an
    // 87px bar. `flex-1` keeps the pager's `mt-auto` pinned near the bottom
    // edge, where the frame places it.
    <div className="flex flex-1 flex-col pt-[34px] pb-32">
      <PageHeader
        title="Inventory"
        subtitle="Monitor stock levels, manage reservations, and keep office essentials ready."
      />

      <div className="mt-18 flex flex-wrap items-center gap-16">
        <Search
          placeholder="Search inventory by item name or code"
          value={query}
          onChange={(e) => refilter(setQuery)(e.target.value)}
          className="min-w-[260px] flex-1"
        />
        {/* `Select` fills its parent, as the catalog's card requires, so the
            drawn 210px width is set on a wrapper rather than fought for with a
            competing width utility. */}
        <div className="w-[210px] shrink-0">
          <Select
            label="Filter by category"
            options={[ALL_CATEGORIES, ...CATEGORIES]}
            value={category}
            onChange={refilter(setCategory)}
          />
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-10">
        {STOCK_FILTERS.map((filter) => {
          const active = stock === filter.match;
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={active}
              onClick={() => refilter(setStock)(filter.match)}
              // 31px tall as drawn: the frame's 8px padding sits inside its
              // 1px stroke, which CSS puts outside the box instead.
              className={`flex h-[31px] cursor-pointer items-center gap-4 rounded-pill px-14 font-sans text-12 transition-osrs ${
                active
                  ? 'border-none bg-brand-primary-alt text-brand-on-primary'
                  : 'border border-line-default bg-surface-card text-ink-strong hover:text-brand-primary'
              }`}
            >
              <span className={active ? 'font-bold' : ''}>{filter.label}</span>
              <span className={active ? '' : 'text-ink-muted'}>({view.counts.get(filter.label)})</span>
            </button>
          );
        })}
      </div>

      <TableCard className="mt-[34px] min-w-0">
        {/* A scroll container has to be reachable from the keyboard, or its
            off-screen columns are mouse-only below the table's minimum width. */}
        <div role="region" aria-label="Inventory table" tabIndex={0} className="w-full min-w-0 overflow-x-auto">
          <div role="table" aria-label="Inventory" aria-rowcount={view.total + 1} className="min-w-[1020px]">
            {/* The drawn header is 48px on a cool surface — taller than the
                library's `TableHead`, and with a right-aligned final column it
                does not model. Inlined rather than bending that component, the
                way the source's own inventory screen does. */}
            <div role="rowgroup">
              <div role="row" aria-rowindex={1} className="flex h-[48px] items-center bg-surface-table-header px-20">
                {COLUMNS.map((column) => (
                  <span
                    key={column.label}
                    role="columnheader"
                    className={`type-eyebrow uppercase text-ink-secondary ${column.width}`}
                  >
                    {column.label}
                  </span>
                ))}
              </div>
            </div>

            <div role="rowgroup">
              {view.rows.map((item, index) => (
                <div
                  key={item.id}
                  role="row"
                  aria-rowindex={(view.page - 1) * pageSize + index + 2}
                  className="flex h-row-height-inventory items-center border-b border-line-default px-20"
                >
                  <span role="cell" className="type-ui-bold w-[300px] text-ink-strong">
                    {item.name}
                  </span>
                  <span role="cell" className="type-ui w-[180px] text-ink-strong">
                    {item.category}
                  </span>
                  <span role="cell" className="w-[140px] font-sans text-14 leading-tight font-bold text-ink-strong">
                    {item.total}
                  </span>
                  <span
                    role="cell"
                    className={`w-[170px] font-sans text-14 leading-tight font-bold ${
                      item.available === 0 ? 'text-status-rejected-fg' : 'text-status-ready-fg'
                    }`}
                  >
                    {item.available}
                  </span>
                  <span role="cell" className="w-[190px] font-sans text-14 leading-tight text-ink-strong">
                    {item.reserved}
                  </span>
                  <span role="cell" className="flex-1">
                    <StatusPill stock={item.stock} />
                  </span>
                </div>
              ))}

              {view.rows.length === 0 ? (
                <div role="row" className="flex h-row-height-inventory items-center px-20">
                  <p role="cell" aria-colspan={COLUMNS.length} className="type-body text-ink-secondary">
                    No item matches that search
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </TableCard>

      {/* The frame pins the pager near the bottom edge of its 1024 canvas
          rather than to the table, so it is pushed down here too and settles
          at the drawn position at the design size. */}
      <div className="mt-auto pt-32">
        <Pagination
          label="Inventory pages"
          page={view.page}
          pageSize={pageSize}
          total={view.total}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={refilter(setPageSize)}
        />
      </div>
    </div>
  );
}
